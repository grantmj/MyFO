import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OnboardingData } from '@/lib/types';

/**
 * GET - Fetch user's plan
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const plan = await prisma.plan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!plan) {
      return NextResponse.json({ plan: null });
    }
    
    // Parse JSON fields
    const planData = {
      ...plan,
      fixedCosts: JSON.parse(plan.fixedCostsJson),
      variableBudgets: JSON.parse(plan.variableBudgetsJson),
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
    const body = await request.json();
    const { userId, data } = body as { userId: string; data: OnboardingData };
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Create plan
    const plan = await prisma.plan.create({
      data: {
        userId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        disbursementDate: new Date(data.disbursementDate),
        startingBalance: data.startingBalance,
        grants: data.grants,
        loans: data.loans,
        workStudyMonthly: data.monthlyIncome,
        otherIncomeMonthly: 0,
        fixedCostsJson: JSON.stringify(data.fixedCosts),
        variableBudgetsJson: JSON.stringify(data.variableBudgets),
      },
    });
    
    // Create planned items if any
    if (data.plannedItems && data.plannedItems.length > 0) {
      await prisma.plannedItem.createMany({
        data: data.plannedItems.map(item => ({
          userId,
          name: item.name,
          date: new Date(item.date),
          amount: item.amount,
          category: item.category,
        })),
      });
    }
    
    // Initialize FAFSA checklist
    await prisma.fafsaChecklist.create({
      data: { userId },
    });
    
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
    const body = await request.json();
    const { planId, data } = body;
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }
    
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        disbursementDate: data.disbursementDate ? new Date(data.disbursementDate) : undefined,
        startingBalance: data.startingBalance,
        grants: data.grants,
        loans: data.loans,
        workStudyMonthly: data.monthlyIncome,
        fixedCostsJson: data.fixedCosts ? JSON.stringify(data.fixedCosts) : undefined,
        variableBudgetsJson: data.variableBudgets ? JSON.stringify(data.variableBudgets) : undefined,
      },
    });
    
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
