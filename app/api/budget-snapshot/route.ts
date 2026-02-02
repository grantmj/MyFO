import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateBudgetSnapshot } from '@/lib/budgetEngine';

/**
 * GET - Calculate and return current budget snapshot
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Fetch plan
    const plan = await prisma.plan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!plan) {
      return NextResponse.json({ error: 'No plan found. Please complete onboarding.' }, { status: 404 });
    }
    
    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });
    
    // Fetch planned items
    const plannedItems = await prisma.plannedItem.findMany({
      where: { userId },
    });
    
    // Parse JSON fields
    const fixedCosts = JSON.parse(plan.fixedCostsJson);
    const variableBudgets = JSON.parse(plan.variableBudgetsJson);
    
    // Calculate snapshot
    const snapshot = calculateBudgetSnapshot(
      {
        startDate: plan.startDate,
        endDate: plan.endDate,
        disbursementDate: plan.disbursementDate,
        startingBalance: plan.startingBalance,
        grants: plan.grants,
        loans: plan.loans,
        workStudyMonthly: plan.workStudyMonthly,
        otherIncomeMonthly: plan.otherIncomeMonthly,
        fixedCosts,
        variableBudgets,
      },
      transactions.map(t => ({
        date: t.date,
        amount: t.amount,
        category: t.category as any,
      })),
      plannedItems.map(item => ({
        name: item.name,
        date: item.date,
        amount: item.amount,
      }))
    );
    
    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Error calculating budget snapshot:', error);
    return NextResponse.json({ error: 'Failed to calculate budget snapshot' }, { status: 500 });
  }
}
