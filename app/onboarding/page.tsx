"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { addMonths, format } from "date-fns";

const STEPS = ['Your Funds', 'Weekly Budget', 'Review'];

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Your Funds
  const [disbursement, setDisbursement] = useState('');
  const [loans, setLoans] = useState('');

  // Step 2: Weekly Budget
  const [weeklyBudget, setWeeklyBudget] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch('/api/user');
      const { user } = await res.json();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  function canProceed() {
    if (currentStep === 0) {
      return disbursement && loans;
    }
    if (currentStep === 1) {
      return weeklyBudget;
    }
    return true;
  }

  // Calculate derived values for summary
  const disbursementAmount = parseFloat(disbursement) || 0;
  const loansAmount = parseFloat(loans) || 0;
  const grantsAmount = Math.max(0, disbursementAmount - loansAmount);
  const weeklyAmount = parseFloat(weeklyBudget) || 0;
  const semesterWeeks = 16;
  const totalBudgetNeeded = weeklyAmount * semesterWeeks;
  const willLastWeeks = weeklyAmount > 0 ? Math.floor(disbursementAmount / weeklyAmount) : 0;

  async function handleSubmit() {
    if (!userId) {
      showToast('Please log in first', 'error');
      return;
    }

    try {
      setLoading(true);

      // Auto-calculate dates - start today, end 4 months from now
      const startDate = new Date();
      const endDate = addMonths(startDate, 4);
      const disbursementDate = new Date();

      // Build a simplified plan with auto-calculated values
      const data = {
        startDate,
        endDate,
        disbursementDate,
        startingBalance: disbursementAmount,
        grants: grantsAmount,
        loans: loansAmount,
        monthlyIncome: 0, // Can update via bot later
        fixedCosts: {
          rent: 0,
          utilities: 0,
          subscriptions: 0,
          transportation: 0,
        },
        variableBudgets: {
          groceries: weeklyAmount * 0.4, // 40% of weekly budget
          dining: weeklyAmount * 0.25,    // 25%
          entertainment: weeklyAmount * 0.2, // 20%
          misc: weeklyAmount * 0.15,      // 15%
        },
        plannedItems: [],
      };

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      if (res.ok) {
        showToast('Plan created! Let\'s see your dashboard.', 'success');
        router.push('/dashboard');
      } else {
        showToast('Failed to create plan', 'error');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      showToast('Failed to create plan', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #faf5ff 100%)',
      padding: '3rem 1rem'
    }}>
      <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Welcome to MyFO
          </h1>
          <p style={{ color: '#6b7280' }}>
            Quick setup – just {STEPS.length} steps
          </p>
        </div>

        {/* Stepper */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2rem'
        }}>
          {STEPS.map((step, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: index <= currentStep
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : '#e5e7eb',
                  color: index <= currentStep ? 'white' : '#9ca3af',
                  transition: 'all 0.3s'
                }}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  style={{
                    width: '3rem',
                    height: '2px',
                    background: index < currentStep
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : '#e5e7eb',
                    transition: 'all 0.3s'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            {STEPS[currentStep]}
          </h2>

          {/* Step 1: Your Funds */}
          {currentStep === 0 && (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                After tuition is paid, how much money hits your account?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Total Disbursement (after tuition)
                  </label>
                  <input
                    type="number"
                    value={disbursement}
                    onChange={(e) => setDisbursement(e.target.value)}
                    placeholder="5000"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    This is what shows up in your bank from financial aid
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    How much of that is from loans?
                  </label>
                  <input
                    type="number"
                    value={loans}
                    onChange={(e) => setLoans(e.target.value)}
                    placeholder="2000"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    This helps track how much debt you're taking on
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Weekly Budget */}
          {currentStep === 1 && (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                How much do you want to spend each week on everything (food, fun, etc)?
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  Weekly Budget
                </label>
                <input
                  type="number"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(e.target.value)}
                  placeholder="200"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #6366f1',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', textAlign: 'center' }}>
                  Tip: Start with $150-$250/week for a typical student
                </p>
              </div>

              {/* Quick calculation preview */}
              {weeklyBudget && disbursement && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f0fdf4',
                  borderRadius: '0.75rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 500 }}>
                    💡 At ${weeklyAmount}/week, your ${disbursementAmount} will last about <strong>{willLastWeeks} weeks</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 2 && (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Here's your plan. You can always adjust these in settings or by chatting with MyFO.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Summary Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}>
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Funds</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>${disbursementAmount.toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>From Loans</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>${loansAmount.toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Grants/Scholarships</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>${grantsAmount.toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#eef2ff', borderRadius: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Weekly Budget</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>${weeklyAmount}/wk</p>
                  </div>
                </div>

                {/* Runway estimate */}
                <div style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '0.75rem',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Your money should last</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{willLastWeeks} weeks</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                    ~{Math.round(willLastWeeks / 4)} months
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f3f4f6'
          }}>
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'transparent',
                color: currentStep === 0 ? '#d1d5db' : '#6b7280',
                fontWeight: 500,
                cursor: currentStep === 0 ? 'default' : 'pointer'
              }}
            >
              ← Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: canProceed()
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : '#e5e7eb',
                  color: canProceed() ? 'white' : '#9ca3af',
                  fontWeight: 600,
                  cursor: canProceed() ? 'pointer' : 'default',
                  boxShadow: canProceed() ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {loading ? 'Creating...' : 'Start Using MyFO →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
