import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import { FinancialHealth, IncomeFrequency, LoanProjection, EmergencyFund } from '@/lib/types';

// Helper to convert frequency to weekly rate
function getWeeklyRate(amount: number, frequency: IncomeFrequency): number {
    switch (frequency) {
        case 'weekly': return amount;
        case 'biweekly': return amount / 2;
        case 'monthly': return amount / 4.33;
        case 'semester': return amount / 16; // ~16 weeks per semester
        case 'one_time': return 0; // One-time doesn't have a weekly rate
        default: return 0;
    }
}

// Helper to get total for semester
function getSemesterTotal(amount: number, frequency: IncomeFrequency, weeksRemaining: number): number {
    switch (frequency) {
        case 'weekly': return amount * weeksRemaining;
        case 'biweekly': return (amount / 2) * weeksRemaining;
        case 'monthly': return (amount / 4.33) * weeksRemaining;
        case 'semester':
        case 'one_time': return amount;
        default: return 0;
    }
}

// Calculate health score (0-100)
function calculateHealthScore(
    emergencyFundPercent: number,
    loanToIncomeRatio: number,
    netCashFlow: number,
    hasEmergencyFund: boolean
): number {
    let score = 50; // Base score

    // Emergency fund contribution (up to 25 points)
    if (hasEmergencyFund) {
        score += Math.min(25, emergencyFundPercent * 0.25);
    }

    // Net cash flow contribution (up to 25 points)
    if (netCashFlow > 0) {
        score += Math.min(25, netCashFlow * 0.5);
    } else {
        score += Math.max(-25, netCashFlow * 0.5);
    }

    // Loan management (up to -25 or +10 points)
    if (loanToIncomeRatio < 0.3) {
        score += 10; // Good loan ratio
    } else if (loanToIncomeRatio > 0.5) {
        score -= Math.min(25, (loanToIncomeRatio - 0.5) * 50);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

// Generate personalized tips
function generateTips(
    emergencyFund: EmergencyFund | null,
    totalLoans: number,
    netCashFlow: number,
    hasJobIncome: boolean
): string[] {
    const tips: string[] = [];

    // Emergency fund tips
    if (!emergencyFund || emergencyFund.currentAmount === 0) {
        tips.push("Start building an emergency fund! Even $25/week adds up to $400 by semester end.");
    } else if (emergencyFund.percentComplete < 50) {
        const remaining = emergencyFund.targetAmount - emergencyFund.currentAmount;
        tips.push(`You're ${emergencyFund.percentComplete.toFixed(0)}% to your emergency fund goal! Just $${remaining.toFixed(0)} to go.`);
    } else if (emergencyFund.percentComplete >= 100) {
        tips.push("🎉 Your emergency fund is fully funded! Great job protecting yourself.");
    }

    // Loan tips
    if (totalLoans > 0 && netCashFlow > 0) {
        tips.push("You're saving money! Consider putting some toward loans to reduce future interest.");
    } else if (totalLoans > 0) {
        tips.push("Track your loan interest rates - focus on paying highest rates first after graduation.");
    }

    // Income tips
    if (!hasJobIncome) {
        tips.push("Consider a part-time campus job for extra income - even 10 hours/week helps!");
    }

    // Cash flow tips
    if (netCashFlow < 0) {
        tips.push("You're spending more than your income. Review your variable spending categories.");
    } else if (netCashFlow > 100) {
        tips.push("Great cash flow! You're building financial runway for the future.");
    }

    return tips.slice(0, 3); // Max 3 tips
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        // Fetch all data in parallel - use maybeSingle to avoid 404 on missing records
        const [incomeResult, fundResult, planResult, snapshotResult] = await Promise.all([
            supabase.from('income_sources').select('*').eq('user_id', userId),
            supabase.from('emergency_fund').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            // Get budget snapshot for expense info - catch any errors
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/budget-snapshot?userId=${userId}`)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null),
        ]);

        const incomeSources = (incomeResult.data || []) as any[];
        const emergencyFundData = fundResult.data as any; // May be null
        const plan = planResult.data as any; // May be null
        const snapshot = snapshotResult;

        // Calculate income by type
        let totalLoans = 0;
        let totalGrants = 0;
        let totalScholarships = 0;
        let totalJobIncome = 0;
        let totalFamilySupport = 0;
        let weeklyIncomeRate = 0;

        const weeksRemaining = snapshot?.snapshot?.weeksTotal
            ? snapshot.snapshot.weeksTotal - (snapshot.snapshot.weeksElapsed || 0)
            : 16;

        for (const source of incomeSources) {
            const semesterAmount = getSemesterTotal(source.amount, source.frequency as IncomeFrequency, weeksRemaining);
            const weeklyRate = getWeeklyRate(source.amount, source.frequency as IncomeFrequency);

            switch (source.type) {
                case 'loan':
                    totalLoans += semesterAmount;
                    break;
                case 'grant':
                    totalGrants += semesterAmount;
                    weeklyIncomeRate += weeklyRate;
                    break;
                case 'scholarship':
                    totalScholarships += semesterAmount;
                    weeklyIncomeRate += weeklyRate;
                    break;
                case 'job':
                case 'work_study':
                    totalJobIncome += semesterAmount;
                    weeklyIncomeRate += weeklyRate;
                    break;
                case 'family':
                    totalFamilySupport += semesterAmount;
                    weeklyIncomeRate += weeklyRate;
                    break;
                default:
                    weeklyIncomeRate += weeklyRate;
            }
        }

        // Also add legacy plan income if no detailed sources
        if (incomeSources.length === 0 && plan) {
            totalGrants += plan.grants;
            totalLoans += plan.loans;
            weeklyIncomeRate += (plan.work_study_monthly + plan.other_income_monthly) / 4.33;
        }

        const totalIncome = totalGrants + totalScholarships + totalJobIncome + totalFamilySupport;

        // Calculate expense rate from snapshot
        const weeklyExpenseRate = snapshot?.snapshot
            ? snapshot.snapshot.fixedPerWeek + snapshot.snapshot.variableWeeklyTotal
            : 0;

        const netWeeklyCashFlow = weeklyIncomeRate - weeklyExpenseRate;

        // Emergency fund status
        let emergencyFundStatus: 'none' | 'building' | 'partial' | 'funded' = 'none';
        let emergencyFund: EmergencyFund | null = null;

        if (emergencyFundData) {
            const percentComplete = emergencyFundData.target_amount > 0
                ? (emergencyFundData.current_amount / emergencyFundData.target_amount) * 100
                : 0;

            emergencyFund = {
                targetAmount: emergencyFundData.target_amount,
                currentAmount: emergencyFundData.current_amount,
                weeklyContribution: emergencyFundData.weekly_contribution,
                percentComplete,
            };

            if (percentComplete >= 100) {
                emergencyFundStatus = 'funded';
            } else if (percentComplete >= 50) {
                emergencyFundStatus = 'partial';
            } else if (percentComplete > 0 || emergencyFundData.weekly_contribution > 0) {
                emergencyFundStatus = 'building';
            }
        }

        // Loan repayment projection
        let loanRepaymentProjection: LoanProjection | null = null;

        if (totalLoans > 0) {
            const projectedSavings = Math.max(0, netWeeklyCashFlow * weeksRemaining);
            const percentPayable = totalLoans > 0 ? (projectedSavings / totalLoans) * 100 : 0;
            const canPayBackThisSemester = projectedSavings >= totalLoans;

            // Rough estimate of months to pay off (assuming continued saving after semester)
            const monthlyNetIncome = netWeeklyCashFlow * 4.33;
            const monthsToPayOff = monthlyNetIncome > 0
                ? Math.ceil((totalLoans - projectedSavings) / monthlyNetIncome) + (weeksRemaining / 4.33)
                : 999;

            let message = '';
            if (canPayBackThisSemester) {
                message = `Great news! At your current pace, you'll save $${projectedSavings.toFixed(0)} by semester end — enough to pay off all your loans this semester!`;
            } else if (percentPayable >= 50) {
                message = `You're on track to save $${projectedSavings.toFixed(0)} by semester end — that's ${percentPayable.toFixed(0)}% of your loan balance!`;
            } else if (percentPayable > 0) {
                message = `At your current pace, you'll save $${projectedSavings.toFixed(0)} by semester end (${percentPayable.toFixed(0)}% of your loans). Consider increasing income or reducing expenses.`;
            } else {
                message = `You've taken $${totalLoans.toFixed(0)} in loans this semester. Building positive cash flow will help you pay them back after graduation.`;
            }

            loanRepaymentProjection = {
                totalLoanAmount: totalLoans,
                projectedSavings,
                canPayBackThisSemester,
                percentPayable,
                monthsToPayOff: Math.min(monthsToPayOff, 120), // Cap at 10 years
                message,
            };
        }

        // Calculate health score
        const loanToIncomeRatio = totalIncome > 0 ? totalLoans / totalIncome : 0;
        const healthScore = calculateHealthScore(
            emergencyFund?.percentComplete || 0,
            loanToIncomeRatio,
            netWeeklyCashFlow,
            !!emergencyFund
        );

        let healthLevel: 'poor' | 'fair' | 'good' | 'excellent';
        if (healthScore >= 80) healthLevel = 'excellent';
        else if (healthScore >= 60) healthLevel = 'good';
        else if (healthScore >= 40) healthLevel = 'fair';
        else healthLevel = 'poor';

        // Generate tips
        const hasJobIncome = incomeSources.some(s => s.type === 'job' || s.type === 'work_study');
        const tips = generateTips(emergencyFund, totalLoans, netWeeklyCashFlow, hasJobIncome);

        const financialHealth: FinancialHealth = {
            totalLoans,
            totalGrants,
            totalScholarships,
            totalJobIncome,
            totalFamilySupport,
            totalIncome,
            emergencyFundStatus,
            emergencyFund,
            loanRepaymentProjection,
            weeklyIncomeRate,
            weeklyExpenseRate,
            netWeeklyCashFlow,
            healthScore,
            healthLevel,
            tips,
        };

        return NextResponse.json({ financialHealth });
    } catch (error) {
        console.error('Error calculating financial health:', error);
        return NextResponse.json({ error: 'Failed to calculate financial health' }, { status: 500 });
    }
}