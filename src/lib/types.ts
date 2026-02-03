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
  startDate?: Date;
  endDate?: Date;
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

// =====================================================
// NEW: Income and Financial Health Types
// =====================================================

export type IncomeType = 'job' | 'scholarship' | 'grant' | 'loan' | 'family' | 'work_study' | 'other';
export type IncomeFrequency = 'one_time' | 'monthly' | 'biweekly' | 'weekly' | 'semester';

export interface IncomeSource {
  id: string;
  type: IncomeType;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  startDate?: Date;
  endDate?: Date;
  isLoan: boolean;
  interestRate?: number;
  notes?: string;
}

export interface EmergencyFund {
  targetAmount: number;
  currentAmount: number;
  weeklyContribution: number;
  percentComplete: number;
}

export interface LoanProjection {
  totalLoanAmount: number;
  projectedSavings: number;
  canPayBackThisSemester: boolean;
  percentPayable: number;
  monthsToPayOff: number;
  message: string;
}

export interface FinancialHealth {
  // Income breakdown
  totalLoans: number;
  totalGrants: number;
  totalScholarships: number;
  totalJobIncome: number;
  totalFamilySupport: number;
  totalIncome: number;

  // Status indicators
  emergencyFundStatus: 'none' | 'building' | 'partial' | 'funded';
  emergencyFund: EmergencyFund | null;

  // Projections
  loanRepaymentProjection: LoanProjection | null;

  // Cash flow
  weeklyIncomeRate: number;
  weeklyExpenseRate: number;
  netWeeklyCashFlow: number;

  // Health score (0-100)
  healthScore: number;
  healthLevel: 'poor' | 'fair' | 'good' | 'excellent';

  // Personalized tips
  tips: string[];
}

// Income type labels for UI
export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  job: 'Job Income',
  scholarship: 'Scholarship',
  grant: 'Grant',
  loan: 'Loan',
  family: 'Family Support',
  work_study: 'Work Study',
  other: 'Other Income',
};

export const INCOME_FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  biweekly: 'Bi-weekly',
  weekly: 'Weekly',
  semester: 'Per Semester',
};