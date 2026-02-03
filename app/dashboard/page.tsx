"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import CircularProgress from "@/components/ui/CircularProgress";
import { BudgetSnapshot, FinancialHealth } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { useToast } from "@/components/ui/Toast";

interface FafsaChecklist {
  createFsaId: boolean;
  gatherTaxDocs: boolean;
  listSchools: boolean;
  submitFafsa: boolean;
  verification: boolean;
  reviewAward: boolean;
  acceptAid: boolean;
  markCalendar: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BudgetSnapshot | null>(null);
  const [fafsaChecklist, setFafsaChecklist] = useState<FafsaChecklist | null>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);

  // Plan data for funds breakdown
  const [planData, setPlanData] = useState<any>(null);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [editingFunds, setEditingFunds] = useState({
    starting_balance: '',
    grants: '',
    loans: '',
  });
  const [savingFunds, setSavingFunds] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  // Check for data updates when tab becomes visible (user returns from chat)
  useEffect(() => {
    let lastCheckedUpdate = '';

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Check if data was updated via chat
        try {
          const updateFlag = localStorage.getItem('myfo_data_updated');
          if (updateFlag && updateFlag !== lastCheckedUpdate) {
            lastCheckedUpdate = updateFlag;
            // Clear the flag and refresh dashboard
            localStorage.removeItem('myfo_data_updated');
            console.log('Data was updated via chat, refreshing dashboard...');
            initializeDashboard();
          }
        } catch (e) {
          console.warn('Could not check for data updates');
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check on mount in case user navigated directly
    handleVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function initializeDashboard() {
    try {
      const userRes = await fetch('/api/user');
      const { user } = await userRes.json();
      setUserId(user.id);

      const planRes = await fetch(`/api/plan?userId=${user.id}`);
      const { plan } = await planRes.json();

      if (!plan) {
        router.push('/onboarding');
        return;
      }

      // Store plan data for funds breakdown
      setPlanData(plan);

      // Fetch data in parallel - handle each response individually to prevent one failure from breaking all
      const [snapshotRes, fafsaRes, healthRes] = await Promise.all([
        fetch(`/api/budget-snapshot?userId=${user.id}`).catch(() => null),
        fetch(`/api/fafsa-checklist?userId=${user.id}`).catch(() => null),
        fetch(`/api/financial-health?userId=${user.id}`).catch(() => null),
      ]);

      // Parse responses safely
      if (snapshotRes?.ok) {
        try {
          const { snapshot: budgetSnapshot } = await snapshotRes.json();
          setSnapshot(budgetSnapshot);
        } catch (e) {
          console.warn('Failed to parse budget snapshot');
        }
      }

      if (fafsaRes?.ok) {
        try {
          const { checklist } = await fafsaRes.json();
          setFafsaChecklist(checklist);
        } catch (e) {
          console.warn('Failed to parse fafsa checklist');
        }
      }

      if (healthRes?.ok) {
        try {
          const healthData = await healthRes.json();
          if (healthData.financialHealth) {
            setFinancialHealth(healthData.financialHealth);
          }
        } catch (e) {
          console.warn('Failed to parse financial health');
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      showToast('Failed to load dashboard', 'error');
      setLoading(false);
    }
  }

  async function loadDemoData() {
    if (!userId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        showToast('Demo data loaded successfully!', 'success');
        window.location.reload();
      } else {
        showToast('Failed to load demo data', 'error');
      }
    } catch (error) {
      console.error('Error loading demo data:', error);
      showToast('Failed to load demo data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFafsaItem(field: keyof FafsaChecklist) {
    if (!userId || !fafsaChecklist) return;

    try {
      const res = await fetch('/api/fafsa-checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          field,
          value: !fafsaChecklist[field],
        }),
      });

      if (res.ok) {
        const { checklist } = await res.json();
        setFafsaChecklist(checklist);
      }
    } catch (error) {
      console.error('Error updating FAFSA checklist:', error);
    }
  }

  function openFundsModal() {
    if (planData) {
      setEditingFunds({
        starting_balance: planData.starting_balance?.toString() || '0',
        grants: planData.grants?.toString() || '0',
        loans: planData.loans?.toString() || '0',
      });
      setShowFundsModal(true);
    }
  }

  async function saveFunds() {
    if (!userId || !planData) return;

    setSavingFunds(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planData.id,
          data: {
            startingBalance: parseFloat(editingFunds.starting_balance) || 0,
            grants: parseFloat(editingFunds.grants) || 0,
            loans: parseFloat(editingFunds.loans) || 0,
          }
        }),
      });

      if (res.ok) {
        showToast('Funds updated successfully!', 'success');
        setShowFundsModal(false);
        // Refresh data
        initializeDashboard();
      } else {
        showToast('Failed to update funds', 'error');
      }
    } catch (error) {
      console.error('Error saving funds:', error);
      showToast('Failed to update funds', 'error');
    }
    setSavingFunds(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#76B89F', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#4b5563', fontWeight: 500 }}>Loading your finances...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const statusColor =
    snapshot.status === 'ahead' ? '#059669' :
      snapshot.status === 'behind' ? '#dc2626' :
        '#76B89F';

  const statusBg =
    snapshot.status === 'ahead' ? '#10b981' :
      snapshot.status === 'behind' ? '#ef4444' :
        '#76B89F';

  const statusText =
    snapshot.status === 'ahead' ? 'Ahead of Plan' :
      snapshot.status === 'behind' ? 'Behind Plan' :
        'On Track';

  const progressPercentage = Math.min(100, (snapshot.weeksElapsed / snapshot.weeksTotal) * 100);
  const totalSpending = snapshot.topCategories.reduce((sum, cat) => sum + cat.amount, 0);

  const cardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6'
  };

  const simpleColors = [
    '#76B89F',
    '#5a8a78',
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Dashboard</h1>
            <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Your semester financial overview</p>
          </div>
          <button
            onClick={loadDemoData}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              background: '#76B89F',
              color: 'white',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(118, 184, 159, 0.25)'
            }}
          >
            Load Demo Data
          </button>
        </div>

        {/* Hero Metric - Safe to Spend */}
        <div style={{ ...cardStyle, marginBottom: '2rem', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 1rem',
            borderRadius: '9999px',
            backgroundColor: '#E8F3EF',
            color: '#2d5a44',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '1rem'
          }}>
            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#76B89F', animation: 'pulse 2s infinite' }} />
            Safe to Spend This Week
          </div>
          <div style={{ fontSize: '3.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            <AnimatedNumber value={snapshot.safeToSpendThisWeek} prefix="$" decimals={0} />
          </div>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Based on your remaining budget and planned expenses</p>
          <details style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer' }}>How is this calculated?</summary>
            <p style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '0.5rem', textAlign: 'left' }}>
              Safe to spend = min(weekly budget remaining, semester funds ÷ weeks left)
            </p>
          </details>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ marginBottom: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Runway Date */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Runway Date
                </span>
                <p style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {snapshot.runwayDate
                    ? format(new Date(snapshot.runwayDate), 'MMM dd, yyyy')
                    : 'Fully Funded'}
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {snapshot.runwayDate ? 'When funds run out' : 'Through semester end'}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: '#76B89F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Budget Status */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Budget Status
                </span>
                <p style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: statusColor }}>
                  {statusText}
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <AnimatedNumber
                    value={Math.abs(snapshot.aheadBehind)}
                    prefix="$"
                    decimals={0}
                  /> {snapshot.aheadBehind >= 0 ? 'under budget' : 'over budget'}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: statusBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Remaining Funds - Clickable */}
          <div
            onClick={openFundsModal}
            style={{
              ...cardStyle,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '2px solid transparent',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Remaining Funds
                </span>
                <p style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  <AnimatedNumber value={snapshot.remainingFundsToday} prefix="$" decimals={0} />
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#10b981', fontWeight: 500 }}>
                  Click to see breakdown →
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Funds Breakdown Modal */}
        {showFundsModal && planData && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowFundsModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💰 Funds Breakdown
              </h2>

              {/* Current Remaining */}
              <div style={{ background: '#ecfdf5', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 500 }}>Current Remaining</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#047857' }}>${snapshot?.remainingFundsToday?.toFixed(2) || '0'}</p>
              </div>

              {/* Breakdown */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>Source Breakdown</h3>

                {/* Starting Balance */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>
                    Total Disbursement
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>$</span>
                    <input
                      type="number"
                      value={editingFunds.starting_balance}
                      onChange={(e) => setEditingFunds({ ...editingFunds, starting_balance: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                {/* Grants */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#10b981' }}>🎓</span> Grants & Scholarships (Free Money!)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>$</span>
                    <input
                      type="number"
                      value={editingFunds.grants}
                      onChange={(e) => setEditingFunds({ ...editingFunds, grants: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                {/* Loans */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#f59e0b' }}>⚠️</span> Loans (Must Repay!)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>$</span>
                    <input
                      type="number"
                      value={editingFunds.loans}
                      onChange={(e) => setEditingFunds({ ...editingFunds, loans: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  {parseFloat(editingFunds.loans) > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                      💡 This will need to be repaid after graduation
                    </p>
                  )}
                </div>

                {/* Spent So Far */}
                <div style={{ background: '#f3f4f6', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280' }}>Total Spent</span>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>
                      -${snapshot?.actualSpendToDate?.toFixed(2) || '0'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Expected by now</span>
                    <span style={{ fontWeight: 500, color: '#6b7280' }}>
                      ${snapshot?.expectedSpendToDate?.toFixed(2) || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowFundsModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    background: 'white',
                    color: '#374151',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveFunds}
                  disabled={savingFunds}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '0.5rem',
                    background: savingFunds ? '#9ca3af' : '#10b981',
                    color: 'white',
                    fontWeight: 600,
                    cursor: savingFunds ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingFunds ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Financial Health Summary */}
        {financialHealth && (
          <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  background: financialHealth.healthLevel === 'excellent' ? '#10b981' :
                    financialHealth.healthLevel === 'good' ? '#76B89F' :
                      financialHealth.healthLevel === 'fair' ? '#f59e0b' :
                        '#ef4444',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {financialHealth.healthScore}
                </span>
                Financial Health
              </h3>
              <a href="/income" style={{ fontSize: '0.875rem', color: '#76B89F', fontWeight: 500, textDecoration: 'none' }}>
                Manage Income →
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Cash Flow */}
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Weekly Cash Flow</p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: financialHealth.netWeeklyCashFlow >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {financialHealth.netWeeklyCashFlow >= 0 ? '+' : ''}${financialHealth.netWeeklyCashFlow.toFixed(0)}/week
                </p>
              </div>
              {/* Emergency Fund */}
              {financialHealth.emergencyFund && (
                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Emergency Fund</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                    {financialHealth.emergencyFund.percentComplete.toFixed(0)}% funded
                  </p>
                </div>
              )}
              {/* Loan Status */}
              {financialHealth.loanRepaymentProjection && (
                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Loans This Semester</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                    ${financialHealth.loanRepaymentProjection.totalLoanAmount.toFixed(0)}
                  </p>
                </div>
              )}
            </div>
            {/* Loan Projection Message */}
            {financialHealth.loanRepaymentProjection && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.5rem',
                borderLeft: '3px solid #10b981'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
                  {financialHealth.loanRepaymentProjection.message}
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          {/* Semester Progress with Circular */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Semester Progress
            </h3>
            {/* Semester Date Bar */}
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                <span>Start: {snapshot.startDate ? format(new Date(snapshot.startDate), 'MMM dd') : 'Jan'}</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Today</span>
                <span>End: {snapshot.endDate ? format(new Date(snapshot.endDate), 'MMM dd') : 'May'}</span>
              </div>
              <div style={{ height: '0.5rem', background: '#e5e7eb', borderRadius: '9999px', position: 'relative' }}>
                <div style={{ height: '100%', width: `${progressPercentage}%`, background: '#10b981', borderRadius: '9999px' }} />
                <div style={{ position: 'absolute', left: `${progressPercentage}%`, top: '-0.25rem', width: '1rem', height: '1rem', background: '#10b981', borderRadius: '50%', border: '2px solid white', transform: 'translateX(-50%)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <CircularProgress
                percentage={progressPercentage}
                size={120}
                strokeWidth={10}
                label="complete"
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Weeks Elapsed</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {snapshot.weeksElapsed} / {snapshot.weeksTotal}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Expected Spend</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#76B89F' }}>
                      <AnimatedNumber value={snapshot.expectedSpendToDate} prefix="$" decimals={0} />
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Actual Spend</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                      <AnimatedNumber value={snapshot.actualSpendToDate} prefix="$" decimals={0} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Spending Categories */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Top Spending (Last 14 Days)
            </h3>
            {snapshot.topCategories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {snapshot.topCategories.slice(0, 5).map((cat, i) => {
                  const percentage = totalSpending > 0 ? (cat.amount / totalSpending) * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                          {CATEGORY_LABELS[cat.category]}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                          ${cat.amount.toFixed(0)}
                        </span>
                      </div>
                      <div style={{ height: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: simpleColors[i % simpleColors.length],
                            borderRadius: '9999px',
                            transition: 'width 0.7s ease',
                            width: `${percentage}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p style={{ color: '#4b5563' }}>No transactions yet</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Import your bank CSV to get started</p>
              </div>
            )}
          </div>

          {/* Upcoming Planned Items */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                Planned Expenses
              </h3>
              <a href="/transactions" style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                + Add Item
              </a>
            </div>
            {snapshot.plannedNext7Days.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {snapshot.plannedNext7Days.map((item, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        background: '#76B89F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        {format(new Date(item.date), 'dd')}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: '#111827' }}>{item.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {format(new Date(item.date), 'EEEE, MMM dd')}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#76B89F' }}>
                      ${item.amount.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '2rem', height: '2rem', color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p style={{ color: '#4b5563', marginBottom: '0.5rem' }}>No planned items yet</p>
                <a href="/transactions" style={{ fontSize: '0.875rem', color: '#10b981', textDecoration: 'none', fontWeight: 500 }}>Add your first planned expense →</a>
              </div>
            )}
          </div>

          {/* FAFSA Checklist */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                FAFSA Readiness
              </h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: '#E8F3EF', color: '#2d5a44', fontWeight: 500 }}>
                {fafsaChecklist ? [
                  fafsaChecklist.createFsaId,
                  fafsaChecklist.gatherTaxDocs,
                  fafsaChecklist.listSchools,
                  fafsaChecklist.submitFafsa,
                  fafsaChecklist.verification,
                  fafsaChecklist.reviewAward,
                  fafsaChecklist.acceptAid,
                  fafsaChecklist.markCalendar,
                ].filter(Boolean).length : 0}/8 Complete
              </span>
            </div>
            {fafsaChecklist && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { key: 'createFsaId', label: 'Create FSA ID' },
                  { key: 'gatherTaxDocs', label: 'Gather tax documents' },
                  { key: 'listSchools', label: 'List schools to receive FAFSA' },
                  { key: 'submitFafsa', label: 'Submit FAFSA form' },
                  { key: 'verification', label: 'Complete verification' },
                  { key: 'reviewAward', label: 'Review award letter' },
                  { key: 'acceptAid', label: 'Accept aid package' },
                  { key: 'markCalendar', label: 'Mark disbursement dates' },
                ].map(({ key, label }) => {
                  const isChecked = fafsaChecklist[key as keyof FafsaChecklist];
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isChecked ? '#ecfdf5' : '#f9fafb',
                        border: isChecked ? '1px solid #a7f3d0' : '1px solid transparent'
                      }}
                    >
                      <div style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '0.375rem',
                        border: isChecked ? 'none' : '2px solid #d1d5db',
                        backgroundColor: isChecked ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isChecked && (
                          <svg style={{ width: '0.75rem', height: '0.75rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFafsaItem(key as keyof FafsaChecklist)}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: isChecked ? '#047857' : '#374151',
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <a
                href="https://studentaid.gov/h/apply-for-aid/fafsa"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#76B89F', fontWeight: 500, textDecoration: 'none' }}
              >
                Learn more about FAFSA
                <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <a
            href="/transactions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              background: '#76B89F',
              color: 'white',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 6px rgba(118, 184, 159, 0.25)'
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Transactions
          </a>
          <a
            href="/assistant"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Ask MyFo a Question
          </a>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
