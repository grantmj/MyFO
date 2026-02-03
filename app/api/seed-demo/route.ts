import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import { addDays, subDays, addMonths } from 'date-fns';
import { CATEGORIES } from '@/lib/constants';

/**
 * POST - Seed database with demo data for quick testing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Clear existing data
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('planned_items').delete().eq('user_id', userId);
    await supabase.from('plans').delete().eq('user_id', userId);

    // Create a sample semester plan
    const today = new Date();
    const startDate = subDays(today, 45); // Started 45 days ago
    const endDate = addMonths(startDate, 4); // 4-month semester
    const disbursementDate = subDays(startDate, 5); // Disbursed 5 days before start

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: userId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        disbursement_date: disbursementDate.toISOString().split('T')[0],
        starting_balance: 2000,
        grants: 3500,
        loans: 2500,
        work_study_monthly: 600,
        other_income_monthly: 0,
        fixed_costs: {
          rent: 800,
          utilities: 150,
          subscriptions: 50,
          transportation: 100,
        },
        variable_budgets: {
          groceries: 80,
          dining: 50,
          entertainment: 40,
          misc: 30,
        },
      } as any)
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    // Create sample transactions (last 45 days)
    const sampleTransactions = [
      // Week 1
      { daysAgo: 44, desc: 'Whole Foods', amount: 75.50, cat: CATEGORIES.GROCERIES },
      { daysAgo: 43, desc: 'Chipotle', amount: 12.50, cat: CATEGORIES.DINING },
      { daysAgo: 42, desc: 'Shell Gas Station', amount: 45.00, cat: CATEGORIES.TRANSPORTATION },
      { daysAgo: 41, desc: 'Netflix', amount: 15.99, cat: CATEGORIES.SUBSCRIPTIONS },
      { daysAgo: 40, desc: 'Campus Bookstore', amount: 125.00, cat: CATEGORIES.BOOKS_SUPPLIES },

      // Week 2
      { daysAgo: 37, desc: 'Trader Joes', amount: 68.20, cat: CATEGORIES.GROCERIES },
      { daysAgo: 36, desc: 'Starbucks', amount: 8.50, cat: CATEGORIES.DINING },
      { daysAgo: 35, desc: 'Uber', amount: 15.30, cat: CATEGORIES.TRANSPORTATION },
      { daysAgo: 34, desc: 'Movie Theater', amount: 18.00, cat: CATEGORIES.ENTERTAINMENT },

      // Week 3
      { daysAgo: 30, desc: 'Safeway', amount: 82.15, cat: CATEGORIES.GROCERIES },
      { daysAgo: 29, desc: 'Pizza Hut', amount: 22.50, cat: CATEGORIES.DINING },
      { daysAgo: 28, desc: 'CVS Pharmacy', amount: 32.50, cat: CATEGORIES.HEALTH },
      { daysAgo: 27, desc: 'Spotify', amount: 10.99, cat: CATEGORIES.SUBSCRIPTIONS },

      // Week 4
      { daysAgo: 23, desc: 'Grocery Outlet', amount: 55.40, cat: CATEGORIES.GROCERIES },
      { daysAgo: 22, desc: 'Five Guys', amount: 16.75, cat: CATEGORIES.DINING },
      { daysAgo: 21, desc: 'Gas Station', amount: 40.00, cat: CATEGORIES.TRANSPORTATION },
      { daysAgo: 20, desc: 'Target', amount: 45.00, cat: CATEGORIES.MISC },

      // Week 5
      { daysAgo: 16, desc: 'Whole Foods', amount: 92.30, cat: CATEGORIES.GROCERIES },
      { daysAgo: 15, desc: 'Doordash', amount: 28.50, cat: CATEGORIES.DINING },
      { daysAgo: 14, desc: 'Concert Ticket', amount: 55.00, cat: CATEGORIES.ENTERTAINMENT },

      // Week 6
      { daysAgo: 9, desc: 'Kroger', amount: 71.85, cat: CATEGORIES.GROCERIES },
      { daysAgo: 8, desc: 'Subway', amount: 11.25, cat: CATEGORIES.DINING },
      { daysAgo: 7, desc: 'Lyft', amount: 12.50, cat: CATEGORIES.TRANSPORTATION },
      { daysAgo: 6, desc: 'Amazon', amount: 38.99, cat: CATEGORIES.MISC },

      // Recent (this week)
      { daysAgo: 3, desc: 'Trader Joes', amount: 65.20, cat: CATEGORIES.GROCERIES },
      { daysAgo: 2, desc: 'Starbucks', amount: 7.50, cat: CATEGORIES.DINING },
      { daysAgo: 1, desc: 'Uber Eats', amount: 24.75, cat: CATEGORIES.DINING },

      // Income transactions
      { daysAgo: 30, desc: 'Work Study Payroll', amount: -300, cat: CATEGORIES.INCOME },
      { daysAgo: 15, desc: 'Work Study Payroll', amount: -300, cat: CATEGORIES.INCOME },
    ];

    const { error: txError } = await supabase
      .from('transactions')
      .insert(sampleTransactions.map(t => ({
        user_id: userId,
        date: subDays(today, t.daysAgo).toISOString().split('T')[0],
        description: t.desc,
        amount: t.amount,
        category: t.cat,
        merchant_guess: t.desc,
        source: 'csv',
      } as any))) as any;

    if (txError) {
      console.error('Error creating transactions:', txError);
    }

    // Create sample planned items
    const { error: itemsError } = await supabase
      .from('planned_items')
      .insert([
        {
          user_id: userId,
          name: 'Spring Break Trip',
          date: addDays(today, 30).toISOString().split('T')[0],
          amount: 400,
          category: CATEGORIES.TRAVEL,
          notes: 'Beach trip with friends',
        },
        {
          user_id: userId,
          name: 'New Laptop',
          date: addDays(today, 60).toISOString().split('T')[0],
          amount: 800,
          category: CATEGORIES.BOOKS_SUPPLIES,
          notes: 'For next semester',
        },
      ] as any);

    if (itemsError) {
      console.error('Error creating planned items:', itemsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data loaded successfully',
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}
