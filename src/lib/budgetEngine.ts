import { BudgetSnapshot, FixedCosts, VariableBudgets } from './types';
import { Category, CATEGORIES } from './constants';
import { differenceInDays, addWeeks, startOfWeek, endOfWeek, isAfter, isBefore, isWithinInterval, addDays } from 'date-fns';

export interface PlanData {
  startDate: Date;
  endDate: Date;
  disbursementDate: Date;
  startingBalance: number;
  grants: number;
  loans: number;
  workStudyMonthly: number;
  otherIncomeMonthly: number;
  fixedCosts: FixedCosts;
  variableBudgets: VariableBudgets;
}

export interface TransactionData {
  date: Date;
  amount: number;
  category: Category;
}

export interface PlannedItemData {
  name: string;
  date: Date;
  amount: number;
}

/**
 * DETERMINISTIC BUDGETING ENGINE
 * Produces all budget metrics using only math - no LLM hallucination
 * 
 * NEW SMART WEEKLY BUDGET LOGIC:
 * 1. Calculate total remaining funds
 * 2. Subtract ALL future planned expenses (trips, events, etc.)
 * 3. Divide remaining by weeks left to get weekly budget
 * 4. Subtract this week's spending to get remaining for THIS week
 * 
 * This means:
 * - $10K with 10 weeks left = $1K/week
 * - If you spend $1K this week, you have $0 left (not $900)
 * - If you have a $2K trip next month, it reduces all weekly budgets proportionally
 */
export function calculateBudgetSnapshot(
  plan: PlanData,
  transactions: TransactionData[],
  plannedItems: PlannedItemData[],
  today: Date = new Date()
): BudgetSnapshot {
  // 1. Calculate time periods
  const totalDays = Math.max(1, differenceInDays(plan.endDate, plan.startDate));
  const weeksTotal = Math.ceil(totalDays / 7);
  const elapsedDays = Math.max(0, differenceInDays(today, plan.startDate));
  const weeksElapsed = Math.min(Math.floor(elapsedDays / 7), weeksTotal);
  const remainingWeeks = Math.max(1, weeksTotal - weeksElapsed);

  // 2. Calculate weekly rates
  const totalMonthlyIncome = plan.workStudyMonthly + plan.otherIncomeMonthly;
  const incomePerWeek = totalMonthlyIncome / 4.33; // Average weeks per month

  const totalFixedMonthly = 
    plan.fixedCosts.rent +
    plan.fixedCosts.utilities +
    plan.fixedCosts.subscriptions +
    plan.fixedCosts.transportation;
  const fixedPerWeek = totalFixedMonthly / 4.33;

  const variableWeeklyTotal = 
    plan.variableBudgets.groceries +
    plan.variableBudgets.dining +
    plan.variableBudgets.entertainment +
    plan.variableBudgets.misc;

  // 3. Calculate total planned budget for semester
  const totalFixed = fixedPerWeek * weeksTotal;
  const totalVariable = variableWeeklyTotal * weeksTotal;
  const totalPlannedItemsAmount = plannedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPlannedBudgetForSemester = totalFixed + totalVariable + totalPlannedItemsAmount;

  // 4. Calculate expected spend to date
  const expectedFixed = fixedPerWeek * weeksElapsed;
  const expectedVariable = variableWeeklyTotal * weeksElapsed;
  const plannedItemsToDate = plannedItems
    .filter(item => isBefore(item.date, today) || item.date.toDateString() === today.toDateString())
    .reduce((sum, item) => sum + item.amount, 0);
  const expectedSpendToDate = expectedFixed + expectedVariable + plannedItemsToDate;

  // 5. Calculate actual spending from transactions
  const actualSpendToDate = transactions
    .filter(t => t.category !== CATEGORIES.INCOME && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeFromTransactions = transactions
    .filter(t => t.category === CATEGORIES.INCOME || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // 6. Calculate income accrued to date
  const incomeAccruedToDate = incomePerWeek * weeksElapsed + incomeFromTransactions;

  // 7. Calculate remaining funds
  const totalAvailableFunds = plan.startingBalance + plan.grants + plan.loans;
  const remainingFundsToday = totalAvailableFunds + incomeAccruedToDate - actualSpendToDate;

  // 8. Calculate ahead/behind status
  const aheadBehind = expectedSpendToDate - actualSpendToDate;
  let status: 'ahead' | 'ontrack' | 'behind';
  if (aheadBehind > expectedSpendToDate * 0.05) {
    status = 'ahead'; // Spent 5%+ less than expected
  } else if (aheadBehind < -expectedSpendToDate * 0.05) {
    status = 'behind'; // Spent 5%+ more than expected
  } else {
    status = 'ontrack';
  }

  // 9. Calculate planned items in next 7 days
  const sevenDaysFromNow = addDays(today, 7);
  const plannedNext7Days = plannedItems
    .filter(item => 
      isWithinInterval(item.date, { start: today, end: sevenDaysFromNow })
    )
    .map(item => ({
      name: item.name,
      amount: item.amount,
      date: item.date,
    }));
  const plannedNext7DaysTotal = plannedNext7Days.reduce((sum, item) => sum + item.amount, 0);

  // ========================================
  // 10. NEW SMART WEEKLY BUDGET CALCULATION
  // ========================================
  
  // Get start and end of current week (Monday to Sunday)
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  // Calculate THIS WEEK's spending
  const thisWeekSpending = transactions
    .filter(t => 
      t.category !== CATEGORIES.INCOME && 
      t.amount > 0 &&
      isWithinInterval(t.date, { start: currentWeekStart, end: currentWeekEnd })
    )
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate ALL future planned expenses (from today onwards)
  const futurePlannedExpenses = plannedItems
    .filter(item => isAfter(item.date, today) || item.date.toDateString() === today.toDateString())
    .reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate expected future fixed costs
  const futureFixedCosts = fixedPerWeek * remainingWeeks;
  
  // Calculate expected future income
  const futureIncome = incomePerWeek * remainingWeeks;
  
  // Available funds for discretionary spending:
  // = Current funds - future planned expenses - future fixed costs + future income
  const availableForDiscretionary = remainingFundsToday - futurePlannedExpenses - futureFixedCosts + futureIncome;
  
  // Weekly discretionary budget = available / remaining weeks
  const weeklyDiscretionaryBudget = Math.max(0, availableForDiscretionary / remainingWeeks);
  
  // Safe to spend THIS week = weekly budget - this week's spending
  const safeToSpendThisWeek = Math.max(0, weeklyDiscretionaryBudget - thisWeekSpending);

  // 11. Calculate runway date
  const runwayDate = calculateRunwayDate(
    remainingFundsToday,
    today,
    plan.endDate,
    fixedPerWeek,
    variableWeeklyTotal,
    incomePerWeek,
    plannedItems.filter(item => isAfter(item.date, today))
  );

  // 12. Calculate top spending categories (last 14 days)
  const fourteenDaysAgo = addDays(today, -14);
  const recentTransactions = transactions.filter(t => 
    isAfter(t.date, fourteenDaysAgo) && t.category !== CATEGORIES.INCOME
  );
  
  const categoryTotals = recentTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category: category as Category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    safeToSpendThisWeek,
    runwayDate,
    remainingFundsToday,
    aheadBehind,
    status,
    variableWeeklyTotal,
    fixedPerWeek,
    plannedNext7Days,
    topCategories,
    weeksTotal,
    weeksElapsed,
    expectedSpendToDate,
    actualSpendToDate,
  };
}

/**
 * Calculate the runway date - when funds will run out
 */
function calculateRunwayDate(
  remainingFunds: number,
  startDate: Date,
  endDate: Date,
  fixedPerWeek: number,
  variablePerWeek: number,
  incomePerWeek: number,
  futurePlannedItems: PlannedItemData[]
): Date | null {
  let currentFunds = remainingFunds;
  let currentDate = startDate;
  const weeklyBurn = fixedPerWeek + variablePerWeek - incomePerWeek;

  // Simulate week by week
  while (isBefore(currentDate, endDate) || currentDate.toDateString() === endDate.toDateString()) {
    // Check if any planned items occur this week
    const weekEnd = addWeeks(currentDate, 1);
    const itemsThisWeek = futurePlannedItems
      .filter(item => isWithinInterval(item.date, { start: currentDate, end: weekEnd }))
      .reduce((sum, item) => sum + item.amount, 0);

    // Subtract weekly burn + planned items
    currentFunds -= (weeklyBurn + itemsThisWeek);

    if (currentFunds <= 0) {
      return currentDate;
    }

    currentDate = addWeeks(currentDate, 1);
  }

  // If we made it through the semester, return null (fully funded)
  return null;
}

/**
 * Evaluate if a purchase is safe
 */
export function evaluatePurchase(
  amount: number,
  snapshot: BudgetSnapshot
): {
  verdict: 'safe' | 'risky' | 'not_recommended';
  impactOnRunway: string;
  impactOnSafeToSpend: number;
} {
  let verdict: 'safe' | 'risky' | 'not_recommended';
  
  if (amount <= snapshot.safeToSpendThisWeek) {
    verdict = 'safe';
  } else if (amount <= snapshot.remainingFundsToday) {
    verdict = 'risky';
  } else {
    verdict = 'not_recommended';
  }

  const impactOnSafeToSpend = snapshot.safeToSpendThisWeek - amount;

  // Calculate impact on runway (rough estimate)
  let impactOnRunway = 'No significant impact';
  if (verdict === 'risky') {
    impactOnRunway = 'Could reduce runway by 1-2 weeks';
  } else if (verdict === 'not_recommended') {
    impactOnRunway = 'Would exhaust funds before semester end';
  }

  return {
    verdict,
    impactOnRunway,
    impactOnSafeToSpend,
  };
}
