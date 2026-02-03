import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import { calculateBudgetSnapshot } from '@/lib/budgetEngine';

/**
 * GET - Calculate and return current budget snapshot
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch plan
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (planError && planError.code !== 'PGRST116') {
      console.error('Error fetching plan:', planError);
      return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
    }

    const plan = planData as any;

    if (!plan) {
      return NextResponse.json({ error: 'No plan found. Please complete onboarding.' }, { status: 404 });
    }

    // Fetch transactions
    const { data: transactionsData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    const transactions = transactionsData as any[];

    // Fetch planned items
    const { data: plannedItemsData, error: itemsError } = await supabase
      .from('planned_items')
      .select('*')
      .eq('user_id', userId);

    if (itemsError) {
      console.error('Error fetching planned items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch planned items' }, { status: 500 });
    }

    const plannedItems = plannedItemsData as any[];

    // JSONB is already parsed by Supabase
    // JSONB is already parsed by Supabase
    const fixedCosts = plan.fixed_costs as any;
    const variableBudgets = plan.variable_budgets as any;

    // Calculate snapshot
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

    // Add semester dates to snapshot
    const snapshotWithDates = {
      ...snapshot,
      startDate: plan.start_date,
      endDate: plan.end_date,
    };

    return NextResponse.json({ snapshot: snapshotWithDates });
  } catch (error) {
    console.error('Error calculating budget snapshot:', error);
    return NextResponse.json({ error: 'Failed to calculate budget snapshot' }, { status: 500 });
  }
}
