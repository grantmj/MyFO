"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { addMonths } from "date-fns";

const STEPS = ['Your Funds', 'Weekly Budget'];

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

  const disbursementAmount = parseFloat(disbursement) || 0;
  const loansAmount = parseFloat(loans) || 0;
  const grantsAmount = Math.max(0, disbursementAmount - loansAmount);
  const weeklyAmount = parseFloat(weeklyBudget) || 0;

  async function handleSubmit() {
    if (!userId) {
      showToast('Please log in first', 'error');
      return;
    }

    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = addMonths(startDate, 4);
      const disbursementDate = new Date();

      const data = {
        startDate,
        endDate,
        disbursementDate,
        startingBalance: disbursementAmount,
        grants: grantsAmount,
        loans: loansAmount,
        monthlyIncome: 0,
        fixedCosts: { rent: 0, utilities: 0, subscriptions: 0, transportation: 0 },
        variableBudgets: {
          groceries: weeklyAmount * 0.4,
          dining: weeklyAmount * 0.25,
          entertainment: weeklyAmount * 0.2,
          misc: weeklyAmount * 0.15,
        },
        plannedItems: [],
      };

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      if (res.ok) {
        showToast('Plan created!', 'success');
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

  // Demo: pre-fill with sample data
  async function handleConnectDemo() {
    setLoading(true);
    // Pre-fill demo data
    setDisbursement('5000');
    setLoans('2000');
    setWeeklyBudget('200');

    if (!userId) {
      showToast('Please log in first', 'error');
      setLoading(false);
      return;
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, 4);

    const data = {
      startDate,
      endDate,
      disbursementDate: startDate,
      startingBalance: 5000,
      grants: 3000,
      loans: 2000,
      monthlyIncome: 500,
      fixedCosts: { rent: 0, utilities: 0, subscriptions: 15, transportation: 50 },
      variableBudgets: { groceries: 80, dining: 50, entertainment: 40, misc: 30 },
      plannedItems: [],
    };

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      // Also seed some demo transactions
      await fetch('/api/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        showToast('Demo data loaded!', 'success');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #f0fdf4 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '28rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#059669',
            marginBottom: '0.5rem'
          }}>
            Welcome to MyFo
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Quick setup – just {STEPS.length} steps
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div style={{
          padding: '0.875rem 1rem',
          background: '#fef9c3',
          border: '1px solid #fde047',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '0.8rem', color: '#854d0e', margin: 0 }}>
            📋 <strong>High-level setup:</strong> We'll refine your budget once you import transactions or statements.
          </p>
        </div>

        {/* Connect MyASU Demo Button */}
        <button
          onClick={handleConnectDemo}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '0.75rem',
            border: '2px dashed #10b981',
            background: '#f0fdf4',
            color: '#059669',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}
        >
          🎓 Connect MyASU (demo) — Load sample data
        </button>

        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginBottom: '1rem' }}>
          — or enter manually —
        </div>

        {/* Stepper */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {STEPS.map((step, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
                background: index <= currentStep ? '#10b981' : '#e5e7eb',
                color: index <= currentStep ? 'white' : '#9ca3af',
              }}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div style={{
                  width: '2.5rem',
                  height: '2px',
                  background: index < currentStep ? '#10b981' : '#e5e7eb',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
            {STEPS[currentStep]}
          </h2>

          {/* Step 1: Your Funds */}
          {currentStep === 0 && (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                This is what hits your bank account from financial aid at the start of the semester.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                    Total Disbursement (after tuition)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 600 }}>$</span>
                    <input
                      type="number"
                      value={disbursement}
                      onChange={(e) => setDisbursement(e.target.value)}
                      placeholder="5000"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 1.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                    How much in loans are you taking out this semester?
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 600 }}>$</span>
                    <input
                      type="number"
                      value={loans}
                      onChange={(e) => setLoans(e.target.value)}
                      placeholder="2000"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 1.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Weekly Budget + Submit */}
          {currentStep === 1 && (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                Estimate your weekly spending. We'll refine this once you import transactions.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                  Weekly Budget Estimate
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                    placeholder="200"
                    style={{
                      width: '100%',
                      padding: '0.875rem 0.875rem 0.875rem 1.75rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #10b981',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f3f4f6'
          }}>
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'transparent',
                color: currentStep === 0 ? '#d1d5db' : '#6b7280',
                fontWeight: 500,
                cursor: currentStep === 0 ? 'default' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ← Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: canProceed() ? '#10b981' : '#e5e7eb',
                  color: canProceed() ? 'white' : '#9ca3af',
                  fontWeight: 600,
                  cursor: canProceed() ? 'pointer' : 'default',
                  fontSize: '0.875rem'
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: canProceed() ? '#10b981' : '#e5e7eb',
                  color: 'white',
                  fontWeight: 600,
                  cursor: (loading || !canProceed()) ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontSize: '0.875rem'
                }}
              >
                {loading ? 'Creating...' : 'Start Using MyFo →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
