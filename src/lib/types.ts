import { Category } from './constants';

export interface FixedCosts {
  rent: number;
  utilities: number;
  subscriptions: number;
  transportation: number;
}

export interface VariableBudgets {
  groceries: number;
  dining: number;
  entertainment: number;
  misc: number;
}

export interface BudgetSnapshot {
  safeToSpendThisWeek: number;
  runwayDate: Date | null;
  remainingFundsToday: number;
  aheadBehind: number;
  status: 'ahead' | 'ontrack' | 'behind';
  variableWeeklyTotal: number;
  fixedPerWeek: number;
  plannedNext7Days: Array<{ name: string; amount: number; date: Date }>;
  topCategories: Array<{ category: Category; amount: number }>;
  weeksTotal: number;
  weeksElapsed: number;
  expectedSpendToDate: number;
  actualSpendToDate: number;
}

export interface OnboardingData {
  // Step 1: Basics
  startDate: Date;
  endDate: Date;
  disbursementDate: Date;
  startingBalance: number;
  
  // Step 2: Funding
  grants: number;
  loans: number;
  monthlyIncome: number;
  
  // Step 3: Fixed costs
  fixedCosts: FixedCosts;
  
  // Step 4: Variable budgets
  variableBudgets: VariableBudgets;
  
  // Step 5: Planned items
  plannedItems: Array<{
    name: string;
    date: Date;
    amount: number;
    category: Category;
  }>;
}
