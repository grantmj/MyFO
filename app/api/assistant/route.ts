import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { calculateBudgetSnapshot, evaluatePurchase } from '@/lib/budgetEngine';
import { CATEGORY_LABELS } from '@/lib/constants';
import { format } from 'date-fns';

// Simple Supabase client for DB updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Function definitions for OpenAI
const functions: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_plan',
      description: 'Update the user\'s financial plan. Call this when the user wants to change their disbursement amount, loan amount, weekly budget, or other plan values.',
      parameters: {
        type: 'object',
        properties: {
          loans: {
            type: 'number',
            description: 'New loan amount for the semester'
          },
          starting_balance: {
            type: 'number',
            description: 'New total disbursement/starting balance'
          },
          grants: {
            type: 'number',
            description: 'New grants/scholarships amount'
          },
          weekly_budget: {
            type: 'number',
            description: 'New weekly spending budget'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Add a new spending transaction. Call this when the user mentions they spent money on something.',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Transaction amount in dollars'
          },
          description: {
            type: 'string',
            description: 'What the money was spent on'
          },
          category: {
            type: 'string',
            enum: ['groceries', 'dining', 'entertainment', 'transportation', 'rent', 'utilities', 'subscriptions', 'misc'],
            description: 'Category of the transaction'
          }
        },
        required: ['amount', 'description', 'category']
      }
    }
  }
];

// Execute function calls
async function executeFunction(name: string, args: any, userId: string, planId: string) {
  if (name === 'update_plan') {
    const updates: any = {};
    if (args.loans !== undefined) updates.loans = args.loans;
    if (args.starting_balance !== undefined) updates.starting_balance = args.starting_balance;
    if (args.grants !== undefined) updates.grants = args.grants;
    if (args.weekly_budget !== undefined) {
      // Update variable budgets proportionally
      updates.variable_budgets = {
        groceries: args.weekly_budget * 0.4,
        dining: args.weekly_budget * 0.25,
        entertainment: args.weekly_budget * 0.2,
        misc: args.weekly_budget * 0.15,
      };
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId);

      if (error) {
        console.error('Error updating plan:', error);
        return { success: false, error: error.message };
      }
      return { success: true, updated: Object.keys(updates) };
    }
    return { success: false, error: 'No updates provided' };
  }

  if (name === 'add_transaction') {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: args.amount,
        description: args.description,
        category: args.category,
        date: new Date().toISOString(),
      });

    if (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: error.message };
    }
    return { success: true, amount: args.amount, category: args.category };
  }

  return { success: false, error: 'Unknown function' };
}

/**
 * POST - Chat with MyFO assistant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, conversationHistory = [] } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
        isConfigError: true,
      }, { status: 500 });
    }

    // Fetch budget snapshot
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const plan = planData as any;

    if (!plan) {
      return NextResponse.json({
        error: 'No plan found. Please complete onboarding first.',
        needsOnboarding: true,
      }, { status: 404 });
    }

    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    const transactions = transactionsData as any[];

    const { data: plannedItemsData } = await supabase
      .from('planned_items')
      .select('*')
      .eq('user_id', userId);

    const plannedItems = plannedItemsData as any[];

    // JSONB is already parsed by Supabase
    const fixedCosts = plan.fixed_costs as any;
    const variableBudgets = plan.variable_budgets as any;

    const snapshot = calculateBudgetSnapshot(
      {
        startDate: new Date(plan.start_date),
        endDate: new Date(plan.end_date),
        disbursementDate: new Date(plan.disbursement_date),
        startingBalance: plan.starting_balance,
        grants: plan.grants,
        loans: plan.loans,
        workStudyMonthly: plan.work_study_monthly,
        otherIncomeMonthly: plan.other_income_monthly,
        fixedCosts,
        variableBudgets,
      },
      (transactions || []).map(t => ({
        date: new Date(t.date),
        amount: t.amount,
        category: t.category as any,
      })),
      (plannedItems || []).map(item => ({
        name: item.name,
        date: new Date(item.date),
        amount: item.amount,
      }))
    );

    // Try to extract purchase amount from message
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const purchaseAmount = amountMatch ? parseFloat(amountMatch[1]) : null;

    // Evaluate purchase if amount found
    let evaluation = null;
    if (purchaseAmount) {
      evaluation = evaluatePurchase(purchaseAmount, snapshot);
    }

    // Build context for LLM
    const budgetContext = `
CURRENT BUDGET STATUS (use these exact numbers, never invent your own):
- Remaining funds today: $${snapshot.remainingFundsToday.toFixed(2)}
- Safe to spend this week: $${snapshot.safeToSpendThisWeek.toFixed(2)}
- Runway date: ${snapshot.runwayDate ? format(snapshot.runwayDate, 'MMM dd, yyyy') : 'Fully funded through semester end'}
- Budget status: ${snapshot.status === 'ahead' ? 'AHEAD of plan' : snapshot.status === 'behind' ? 'BEHIND plan' : 'ON TRACK'} by $${Math.abs(snapshot.aheadBehind).toFixed(2)}
- Weeks elapsed: ${snapshot.weeksElapsed} of ${snapshot.weeksTotal}

CURRENT PLAN VALUES:
- Total disbursement: $${plan.starting_balance}
- Loans: $${plan.loans}
- Grants/Scholarships: $${plan.grants}
- Weekly variable budget: $${Object.values(variableBudgets || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0).toFixed(0)}

${evaluation ? `
PURCHASE EVALUATION for $${purchaseAmount}:
- Verdict: ${evaluation.verdict.toUpperCase()}
- Impact on safe-to-spend: Would leave $${evaluation.impactOnSafeToSpend.toFixed(2)} for the week
` : ''}
`;

    const systemPrompt = `You are MyFO (My Financial Officer), a helpful student financial assistant. 

IMPORTANT: You have the ability to UPDATE THE DATABASE when the user wants to change their financial info.
- If they say they have a different loan amount, USE update_plan to change it
- If they mention spending money on something, USE add_transaction to log it
- Always confirm what you updated after making changes

When making updates:
1. Use the update_plan function for: loan amounts, disbursement, grants, weekly budget
2. Use the add_transaction function for: recording purchases/spending

Be helpful, concise, and proactive about updating their info when they share new financial details.`;

    // Call OpenAI with function calling
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: budgetContext },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    let completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: functions,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    });

    let assistantMessage = completion.choices[0].message;
    let functionResults: string[] = [];

    // Handle function calls
    if (assistantMessage.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        const fn = (toolCall as any).function;
        if (!fn) continue;
        const args = JSON.parse(fn.arguments);
        const result = await executeFunction(
          fn.name,
          args,
          userId,
          plan.id
        );
        functionResults.push(
          `${fn.name}: ${result.success ? 'Updated successfully' : result.error}`
        );
      }

      // Get final response after function calls
      messages.push(assistantMessage);
      messages.push({
        role: 'tool',
        tool_call_id: (assistantMessage.tool_calls[0] as any).id,
        content: JSON.stringify({ results: functionResults }),
      });

      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantMessage = completion.choices[0].message;
    }

    const reply = assistantMessage.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      reply,
      snapshot,
      evaluation,
      updates: functionResults.length > 0 ? functionResults : undefined,
    });
  } catch (error: any) {
    console.error('Error in assistant:', error);

    if (error?.status === 401) {
      return NextResponse.json({
        error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env',
        isConfigError: true,
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
