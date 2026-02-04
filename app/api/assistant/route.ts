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
      description: 'Add a spending transaction. Call this when the user mentions they spent money on something. If they don\'t mention a date, ASK when it happened before calling this function.',
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
          },
          date: {
            type: 'string',
            description: 'Date of the transaction in YYYY-MM-DD format. If user says "today", "yesterday", "last week", convert to actual date. If unsure, ask the user.'
          }
        },
        required: ['amount', 'description', 'category']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_income',
      description: 'Add a new income source like a job, scholarship, grant, work-study, or family support. Call this when user mentions getting a new job, winning a scholarship, receiving a grant, or other recurring/one-time income.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the income source (e.g., "Library Student Assistant", "FAFSA Grant", "Parents monthly support")'
          },
          amount: {
            type: 'number',
            description: 'Amount in dollars'
          },
          type: {
            type: 'string',
            enum: ['job', 'work_study', 'scholarship', 'grant', 'loan', 'family', 'other'],
            description: 'Type of income source'
          },
          frequency: {
            type: 'string',
            enum: ['weekly', 'biweekly', 'monthly', 'semester', 'one_time'],
            description: 'How often this income is received'
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the income source'
          }
        },
        required: ['name', 'amount', 'type', 'frequency']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_planned_item',
      description: 'Add a planned future expense like textbooks, spring break trip, concert tickets. Call this when user mentions something they need or want to buy in the future.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the planned expense'
          },
          amount: {
            type: 'number',
            description: 'Estimated cost in dollars'
          },
          date: {
            type: 'string',
            description: 'When they plan to make this purchase (YYYY-MM-DD format)'
          },
          category: {
            type: 'string',
            enum: ['groceries', 'dining', 'entertainment', 'transportation', 'rent', 'utilities', 'subscriptions', 'misc'],
            description: 'Category of the expense'
          }
        },
        required: ['name', 'amount', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: 'Delete transactions by matching description. Use description="all" to delete ALL transactions. Set delete_all=true to delete all matching transactions at once.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description or partial description of the transaction to delete. Use "all" to delete ALL transactions.'
          },
          amount: {
            type: 'number',
            description: 'Amount of the transaction to delete (helps narrow down which one)'
          },
          date: {
            type: 'string',
            description: 'Date of the transaction in YYYY-MM-DD format'
          },
          delete_all: {
            type: 'boolean',
            description: 'If true, delete ALL transactions matching the criteria. If false, only delete the first match.'
          }
        },
        required: ['description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_opportunity',
      description: 'Update the status of a job or scholarship application. Call this when user says they applied, got an interview, received an offer, or got rejected. If status changes to "received", this will automatically add it as an income source.',
      parameters: {
        type: 'object',
        properties: {
          opportunity_name: {
            type: 'string',
            description: 'Name or partial name of the opportunity to update'
          },
          status: {
            type: 'string',
            enum: ['discovered', 'applied', 'interviewing', 'received', 'rejected', 'saved'],
            description: 'New status of the application'
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the status change'
          }
        },
        required: ['opportunity_name', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'track_opportunity',
      description: 'Add a new job or scholarship opportunity to track. Call this when user mentions a new job, internship, scholarship, or grant they want to apply for.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the job or scholarship'
          },
          type: {
            type: 'string',
            enum: ['job', 'scholarship', 'grant', 'gig', 'work_study'],
            description: 'Type of opportunity'
          },
          organization: {
            type: 'string',
            description: 'Company or organization offering this opportunity'
          },
          amount: {
            type: 'number',
            description: 'Pay rate (hourly for jobs) or award amount (for scholarships/grants)'
          },
          frequency: {
            type: 'string',
            enum: ['hourly', 'weekly', 'biweekly', 'monthly', 'semester', 'one_time'],
            description: 'How often this pays'
          },
          hours_per_week: {
            type: 'number',
            description: 'For jobs: expected hours per week'
          },
          deadline: {
            type: 'string',
            description: 'Application deadline in YYYY-MM-DD format'
          },
          apply_url: {
            type: 'string',
            description: 'URL to apply'
          },
          status: {
            type: 'string',
            enum: ['discovered', 'saved', 'applied'],
            description: 'Initial status (default: saved)'
          }
        },
        required: ['name', 'type']
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
    // Use provided date or default to now
    const transactionDate = args.date ? new Date(args.date).toISOString() : new Date().toISOString();

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: args.amount,
        description: args.description,
        category: args.category,
        date: transactionDate,
      });

    if (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: error.message };
    }
    return { success: true, amount: args.amount, category: args.category, date: args.date || 'today' };
  }

  if (name === 'add_income') {
    const { error } = await supabase
      .from('income_sources')
      .insert({
        user_id: userId,
        name: args.name,
        amount: args.amount,
        type: args.type,
        frequency: args.frequency,
        notes: args.notes || null,
      });

    if (error) {
      console.error('Error adding income:', error);
      return { success: false, error: error.message };
    }
    return { success: true, name: args.name, amount: args.amount, type: args.type, frequency: args.frequency };
  }

  if (name === 'add_planned_item') {
    const { error } = await supabase
      .from('planned_items')
      .insert({
        user_id: userId,
        name: args.name,
        amount: args.amount,
        date: args.date,
        category: args.category || 'misc',
      });

    if (error) {
      console.error('Error adding planned item:', error);
      return { success: false, error: error.message };
    }
    return { success: true, name: args.name, amount: args.amount, date: args.date };
  }

  if (name === 'delete_transaction') {
    // Special case: delete all transactions
    if (args.description === 'all' || args.description === '*') {
      const { data: allTx, error: fetchError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId);

      if (fetchError || !allTx || allTx.length === 0) {
        return { success: false, error: 'No transactions to delete' };
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting all transactions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, deleted: 'all', count: allTx.length, message: `Deleted all ${allTx.length} transactions` };
    }

    // Find matching transactions
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .ilike('description', `%${args.description}%`);

    if (args.amount) {
      query = query.eq('amount', args.amount);
    }
    if (args.date) {
      query = query.eq('date', args.date);
    }

    const { data: matchingTx, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error finding transaction:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!matchingTx || matchingTx.length === 0) {
      return { success: false, error: `No transaction found matching "${args.description}"` };
    }

    // If delete_all flag is set, delete all matches
    if (args.delete_all && matchingTx.length > 1) {
      const ids = matchingTx.map((t: any) => t.id);
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error deleting transactions:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        deleted: matchingTx.map((t: any) => t.description).join(', '),
        count: matchingTx.length,
        message: `Deleted ${matchingTx.length} transactions`
      };
    }

    // Delete the first match
    const txToDelete = matchingTx[0];
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txToDelete.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deleted: txToDelete.description,
      amount: txToDelete.amount,
      message: `Deleted "${txToDelete.description}" ($${txToDelete.amount})`
    };
  }

  if (name === 'update_opportunity') {
    // First find the opportunity by name (case-insensitive partial match)
    const { data: opportunities, error: fetchError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${args.opportunity_name}%`);

    if (fetchError) {
      console.error('Error fetching opportunities:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!opportunities || opportunities.length === 0) {
      return { success: false, error: `No opportunity found matching "${args.opportunity_name}"` };
    }

    const opportunity = opportunities[0];
    const updates: any = { status: args.status };

    if (args.notes) updates.notes = args.notes;
    if (args.status === 'applied') updates.applied_date = new Date().toISOString().split('T')[0];
    if (args.status === 'received' || args.status === 'rejected') {
      updates.decision_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', opportunity.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating opportunity:', error);
      return { success: false, error: error.message };
    }

    // If status is 'received', also create income source
    if (args.status === 'received') {
      const incomeTypeMap: Record<string, string> = {
        'job': 'job', 'work_study': 'work_study', 'scholarship': 'scholarship',
        'grant': 'grant', 'gig': 'job'
      };
      const frequencyMap: Record<string, string> = {
        'hourly': 'monthly', 'weekly': 'weekly', 'biweekly': 'biweekly',
        'monthly': 'monthly', 'semester': 'semester', 'one_time': 'one_time'
      };

      let amount = opportunity.amount || 0;
      if (opportunity.frequency === 'hourly' && opportunity.hours_per_week) {
        amount = opportunity.amount * opportunity.hours_per_week * 4;
      }

      await supabase.from('income_sources').insert({
        user_id: userId,
        name: opportunity.name,
        amount: amount,
        type: incomeTypeMap[opportunity.type] || 'other',
        frequency: frequencyMap[opportunity.frequency || 'monthly'] || 'monthly',
        notes: `Auto-added from application (${opportunity.organization || 'unknown'})`,
      });

      return {
        success: true,
        opportunity: opportunity.name,
        status: args.status,
        incomeCreated: true,
        message: `Updated "${opportunity.name}" to ${args.status} and added as income source!`
      };
    }

    return { success: true, opportunity: opportunity.name, status: args.status };
  }

  if (name === 'track_opportunity') {
    const { error } = await supabase
      .from('opportunities')
      .insert({
        user_id: userId,
        name: args.name,
        type: args.type,
        organization: args.organization || null,
        amount: args.amount || null,
        frequency: args.frequency || null,
        hours_per_week: args.hours_per_week || null,
        deadline: args.deadline || null,
        apply_url: args.apply_url || null,
        status: args.status || 'saved',
        notes: null,
      });

    if (error) {
      console.error('Error tracking opportunity:', error);
      return { success: false, error: error.message };
    }
    return { success: true, name: args.name, type: args.type, status: args.status || 'saved' };
  }

  return { success: false, error: 'Unknown function' };
}

/**
 * POST - Chat with MyFo assistant
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

    // Fetch income sources (no is_active column in schema)
    const { data: incomeSourcesData } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', userId);

    const incomeSources = incomeSourcesData as any[];

    // Fetch opportunities (job/scholarship applications)
    const { data: opportunitiesData } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const opportunities = opportunitiesData as any[];

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

    // Calculate weekly income
    const weeklyIncome = (incomeSources || []).reduce((total: number, source: any) => {
      const amount = source.amount || 0;
      switch (source.frequency) {
        case 'weekly': return total + amount;
        case 'biweekly': return total + (amount / 2);
        case 'monthly': return total + (amount / 4);
        case 'semester': return total + (amount / snapshot.weeksTotal);
        default: return total;
      }
    }, 0);

    // Determine budget health signals for proactive messaging
    const isBudgetTight = snapshot.safeToSpendThisWeek < 50 || snapshot.status === 'behind';
    const hasLoans = plan.loans > 0;
    const loanPercentage = ((plan.loans / plan.starting_balance) * 100).toFixed(0);
    const weeksRemaining = snapshot.weeksTotal - snapshot.weeksElapsed;

    // Build context for LLM
    const budgetContext = `
CURRENT BUDGET STATUS (use these exact numbers, never invent your own):
- Today's date: ${format(new Date(), 'MMMM d, yyyy')}
- Remaining funds today: $${snapshot.remainingFundsToday.toFixed(2)}
- Safe to spend this week: $${snapshot.safeToSpendThisWeek.toFixed(2)}
- Runway date: ${snapshot.runwayDate ? format(snapshot.runwayDate, 'MMM dd, yyyy') : 'Fully funded through semester end'}
- Budget status: ${snapshot.status === 'ahead' ? 'AHEAD of plan' : snapshot.status === 'behind' ? 'BEHIND plan' : 'ON TRACK'} by $${Math.abs(snapshot.aheadBehind).toFixed(2)}
- Weeks elapsed: ${snapshot.weeksElapsed} of ${snapshot.weeksTotal} (${weeksRemaining} weeks remaining)

SEMESTER FUNDING:
- Total disbursement: $${plan.starting_balance}
- From Loans: $${plan.loans} (${loanPercentage}% of total - ${hasLoans ? 'remember to gently remind about repayment on big purchases' : 'no loans!'})
- From Grants/Scholarships: $${plan.grants} (free money!)
- Weekly variable budget: $${Object.values(variableBudgets || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0).toFixed(0)}

CURRENT INCOME SOURCES (${(incomeSources || []).length} active):
${(incomeSources || []).length > 0
        ? (incomeSources || []).map((s: any) => `- ${s.name}: $${s.amount}/${s.frequency} (${s.type})`).join('\n')
        : '- No active income sources yet - SUGGEST JOBS/SCHOLARSHIPS!'}
- Estimated weekly income: $${weeklyIncome.toFixed(0)}/week

JOB/SCHOLARSHIP APPLICATIONS (${(opportunities || []).length} tracked):
${(opportunities || []).length > 0
        ? (opportunities || []).map((o: any) => `- ${o.name} (${o.type}): ${o.status.toUpperCase()}${o.amount ? ` - $${o.amount}` : ''}${o.organization ? ` @ ${o.organization}` : ''}`).join('\n')
        : '- No applications being tracked'}

RECENT TRANSACTIONS (last 10):
${(transactions || []).slice(0, 10).map((t: any) => `- ${format(new Date(t.date), 'MMM d')}: ${t.description} - $${t.amount} (${t.category})`).join('\n') || '- No transactions recorded'}

PROACTIVE SIGNALS:
- Budget is ${isBudgetTight ? 'TIGHT - suggest income boosting options!' : 'healthy'}
- ${hasLoans ? `User has loans ($${plan.loans}) - be mindful about big discretionary purchases` : 'No student loans'}
- ${(incomeSources || []).length === 0 ? 'NO INCOME SOURCES - strongly suggest campus jobs or scholarships!' : ''}

${evaluation ? `
PURCHASE EVALUATION for $${purchaseAmount}:
- Verdict: ${evaluation.verdict.toUpperCase()}
- Impact on safe-to-spend: Would leave $${evaluation.impactOnSafeToSpend.toFixed(2)} for the week
- Work hours equivalent: ${(purchaseAmount! / 15).toFixed(1)} hours at $15/hr
` : ''}
`;

    const systemPrompt = `You are MyFo (My Financial Officer), a proactive and empathetic student financial assistant. Today's date is ${format(new Date(), 'MMMM d, yyyy')}.

YOUR PERSONALITY:
- Be supportive but DIRECT and punchy. No lectures. No fluff.
- KEEP RESPONSES VERY CONCISE (max 2-3 sentences unless explaining a calculation).
- Use data to back up your suggestions.
- USE BOLDING SPARINGLY (only for critical numbers).

DATABASE OPERATIONS:
1. add_income: New job, scholarship, grant, family support
2. add_transaction: Spending money
3. delete_transaction: Remove mistaken transaction
4. update_plan: Change loans, disbursement, budget
5. add_planned_item: Future expenses
6. update_opportunity: Status change (applied/received/rejected)
7. track_opportunity: New job/scholarship interest

CRITICAL RULES:
- If user says "today", "yesterday", or a specific day -> LOG IT IMMEDIATELY. Do not ask "when?".
- Calculate relative dates yourself (e.g. if today is Friday and they say "last Tuesday", figure out the date).
- ONLY ask for date if they completely omitted it (e.g. "I bought a coffee").
- When you add a transaction, just say "Logged it." + the impact. Don't ask for confirmation.
- Use add_income for jobs/scholarships.
- "Received" opportunity = auto-creates income.

BE PROACTIVE WITH SUGGESTIONS:
1. If budget is TIGHT (< $50/week): Suggest quick campus jobs.
2. If they have LOANS: Briefly mention impact on big purchases.
3. INCOME BOOSTING: Suggest specific relevant jobs/scholarships if they need cash.

4. When they mention wanting something expensive:
   - Calculate how many work hours it would take at $15/hr
   - Suggest waiting or saving gradually

5. ALWAYS be aware of:
   - How many weeks are left in the semester
   - Whether they're ahead or behind on their budget
   - Their loan vs. grant ratio (higher loans = more gentle about spending)`;


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
      model: 'gpt-5.1-2025-11-13',
      messages,
      tools: functions,
      tool_choice: 'auto',
      temperature: 0.7,
      max_completion_tokens: 500,
    });

    let assistantMessage = completion.choices[0].message;
    let functionResults: string[] = [];

    // Handle function calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Process all tool calls and collect results
      const toolResponses: { tool_call_id: string; result: string }[] = [];

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
        const resultMessage = `${fn.name}: ${result.success ? 'Updated successfully' : result.error}`;
        functionResults.push(resultMessage);
        toolResponses.push({
          tool_call_id: (toolCall as any).id,
          result: resultMessage
        });
      }

      // Get final response after function calls - must respond to ALL tool calls
      messages.push(assistantMessage);

      // Add a tool response message for EACH tool call
      for (const toolResponse of toolResponses) {
        messages.push({
          role: 'tool',
          tool_call_id: toolResponse.tool_call_id,
          content: JSON.stringify({ result: toolResponse.result }),
        });
      }

      completion = await openai.chat.completions.create({
        model: 'gpt-5.1-2025-11-13',
        messages,
        temperature: 0.7,
        max_completion_tokens: 500,
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
