import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import { OnboardingData } from '@/lib/types';

/**
 * GET - Fetch user's plan
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // GET most recent plan
    const { data: fetchedPlan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const plan = fetchedPlan as any;

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching plan:', error);
      return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
    }

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    // Map Supabase column names to expected format
    const planData = {
      id: plan.id,
      userId: plan.user_id,
      startDate: plan.start_date,
      endDate: plan.end_date,
      disbursementDate: plan.disbursement_date,
      startingBalance: plan.starting_balance,
      grants: plan.grants,
      loans: plan.loans,
      workStudyMonthly: plan.work_study_monthly,
      otherIncomeMonthly: plan.other_income_monthly,
      fixedCosts: plan.fixed_costs,
      variableBudgets: plan.variable_budgets,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    };

    return NextResponse.json({ plan: planData });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

/**
 * POST - Create a new plan from onboarding data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { userId, data } = body as { userId: string; data: OnboardingData };

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Create plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: userId,
        start_date: new Date(data.startDate).toISOString().split('T')[0],
        end_date: new Date(data.endDate).toISOString().split('T')[0],
        disbursement_date: new Date(data.disbursementDate).toISOString().split('T')[0],
        starting_balance: data.startingBalance,
        grants: data.grants,
        loans: data.loans,
        work_study_monthly: data.monthlyIncome,
        other_income_monthly: 0,
        fixed_costs: data.fixedCosts,
        variable_budgets: data.variableBudgets,
      } as any)
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    // Create planned items if any
    if (data.plannedItems && data.plannedItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('planned_items')
        .insert(
          data.plannedItems.map(item => ({
            user_id: userId,
            name: item.name,
            date: new Date(item.date).toISOString().split('T')[0],
            amount: item.amount,
            category: item.category,
          })) as any
        );

      if (itemsError) {
        console.error('Error creating planned items:', itemsError);
      }
    }

    // Initialize FAFSA checklist
    await supabase
      .from('fafsa_checklist')
      .insert({ user_id: userId } as any);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

/**
 * PUT - Update an existing plan
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { planId, data } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.startDate) updateData.start_date = new Date(data.startDate).toISOString().split('T')[0];
    if (data.endDate) updateData.end_date = new Date(data.endDate).toISOString().split('T')[0];
    if (data.disbursementDate) updateData.disbursement_date = new Date(data.disbursementDate).toISOString().split('T')[0];
    if (data.startingBalance !== undefined) updateData.starting_balance = data.startingBalance;
    if (data.grants !== undefined) updateData.grants = data.grants;
    if (data.loans !== undefined) updateData.loans = data.loans;
    if (data.monthlyIncome !== undefined) updateData.work_study_monthly = data.monthlyIncome;
    if (data.fixedCosts) updateData.fixed_costs = data.fixedCosts;
    if (data.variableBudgets) updateData.variable_budgets = data.variableBudgets;

    const { data: plan, error } = await supabase
      .from('plans')
      .update(updateData as any)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
