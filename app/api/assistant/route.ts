import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase';
import { calculateBudgetSnapshot, evaluatePurchase } from '@/lib/budgetEngine';
import { CATEGORY_LABELS } from '@/lib/constants';
import { format } from 'date-fns';

/**
 * POST - Chat with MyFO assistant
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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
- Expected spend to date: $${snapshot.expectedSpendToDate.toFixed(2)}
- Actual spend to date: $${snapshot.actualSpendToDate.toFixed(2)}

UPCOMING PLANNED ITEMS (next 7 days):
${snapshot.plannedNext7Days.length > 0
        ? snapshot.plannedNext7Days.map(item => `- ${item.name}: $${item.amount.toFixed(2)} on ${format(item.date, 'MMM dd')}`).join('\n')
        : '- None'}

TOP SPENDING CATEGORIES (last 14 days):
${snapshot.topCategories.length > 0
        ? snapshot.topCategories.map(cat => `- ${CATEGORY_LABELS[cat.category]}: $${cat.amount.toFixed(2)}`).join('\n')
        : '- No transactions yet'}

WEEKLY BUDGETS:
- Fixed costs per week: $${snapshot.fixedPerWeek.toFixed(2)}
- Variable budget per week: $${snapshot.variableWeeklyTotal.toFixed(2)}
${evaluation ? `
PURCHASE EVALUATION for $${purchaseAmount}:
- Verdict: ${evaluation.verdict.toUpperCase()}
- Impact on safe-to-spend: Would leave $${evaluation.impactOnSafeToSpend.toFixed(2)} for the week
- Impact on runway: ${evaluation.impactOnRunway}
` : ''}
`;

    const systemPrompt = `You are MyFO (My Financial Officer), a helpful student financial health copilot. Your role is to help college students make informed spending decisions.

CRITICAL RULES:
1. ALWAYS use the exact numbers provided in the budget context. NEVER make up or hallucinate financial numbers.
2. When a student asks "Can I afford X?", provide a structured response with:
   - Clear recommendation (Yes/Risky/No) based on the deterministic evaluation
   - Impact on their safe-to-spend and runway
   - 2-3 alternative options or "make it work" strategies
   - One specific next best action
3. Be encouraging but honest. If they're behind, acknowledge it but focus on actionable steps.
4. Keep responses concise and actionable - students are busy.
5. This is NOT financial advice - you're a budgeting tool that helps with planning.

When discussing purchases:
- "Safe" = within safe-to-spend budget
- "Risky" = affordable but would eat into buffer/runway
- "Not recommended" = would exceed remaining funds

Always offer creative alternatives and budgeting strategies when purchases are risky or not recommended.`;

    // Call OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: budgetContext },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      reply,
      snapshot,
      evaluation,
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
