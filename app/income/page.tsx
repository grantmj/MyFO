"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { IncomeSource, IncomeType, IncomeFrequency, FinancialHealth, INCOME_TYPE_LABELS, INCOME_FREQUENCY_LABELS } from "@/lib/types";

const INCOME_TYPE_COLORS: Record<IncomeType, string> = {
    job: '#76B89F',
    scholarship: '#f59e0b',
    grant: '#10b981',
    loan: '#ef4444',
    family: '#ec4899',
    work_study: '#06b6d4',
    other: '#9b8fc9',
};

interface Opportunity {
    id: string;
    user_id: string;
    type: 'job' | 'scholarship' | 'grant' | 'gig' | 'work_study';
    name: string;
    organization?: string;
    amount?: number;
    frequency?: string;
    hours_per_week?: number;
    deadline?: string;
    apply_url?: string;
    status: 'discovered' | 'applied' | 'interviewing' | 'received' | 'rejected' | 'saved';
    applied_date?: string;
    decision_date?: string;
    notes?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    discovered: { bg: '#e5e7eb', text: '#374151' },
    saved: { bg: '#dbeafe', text: '#1e40af' },
    applied: { bg: '#fef3c7', text: '#92400e' },
    interviewing: { bg: '#e0e7ff', text: '#3730a3' },
    received: { bg: '#d1fae5', text: '#065f46' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_LABELS: Record<string, string> = {
    discovered: '🔍 Discovered',
    saved: '💾 Saved',
    applied: '📝 Applied',
    interviewing: '🎤 Interviewing',
    received: '🎉 Received!',
    rejected: '❌ Rejected',
};

export default function IncomePage() {
    const { showToast } = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

    // Opportunities state
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [showOpportunityModal, setShowOpportunityModal] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

    // Form state
    const [formType, setFormType] = useState<IncomeType>('job');
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formFrequency, setFormFrequency] = useState<IncomeFrequency>('monthly');
    const [formIsLoan, setFormIsLoan] = useState(false);
    const [formInterestRate, setFormInterestRate] = useState('');
    const [formNotes, setFormNotes] = useState('');

    // Emergency fund form
    const [efTarget, setEfTarget] = useState('500');
    const [efCurrent, setEfCurrent] = useState('0');
    const [efWeekly, setEfWeekly] = useState('0');
    const [efEditing, setEfEditing] = useState(false);

    useEffect(() => {
        initializePage();
    }, []);

    async function initializePage() {
        try {
            const userRes = await fetch('/api/user');
            const { user } = await userRes.json();
            setUserId(user.id);

            await Promise.all([
                loadIncomeSources(user.id),
                loadFinancialHealth(user.id),
                loadOpportunities(user.id),
            ]);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing:', error);
            showToast('Failed to load data', 'error');
            setLoading(false);
        }
    }

    async function loadIncomeSources(uid: string) {
        const res = await fetch(`/api/income-sources?userId=${uid}`);
        const data = await res.json();
        setIncomeSources(data.incomeSources || []);
    }

    async function loadFinancialHealth(uid: string) {
        const res = await fetch(`/api/financial-health?userId=${uid}`);
        const data = await res.json();
        if (data.financialHealth) {
            setFinancialHealth(data.financialHealth);
            if (data.financialHealth.emergencyFund) {
                setEfTarget(data.financialHealth.emergencyFund.targetAmount.toString());
                setEfCurrent(data.financialHealth.emergencyFund.currentAmount.toString());
                setEfWeekly(data.financialHealth.emergencyFund.weeklyContribution.toString());
            }
        }
    }

    async function loadOpportunities(uid: string) {
        try {
            const res = await fetch(`/api/opportunities?userId=${uid}`);
            const data = await res.json();
            setOpportunities(data.opportunities || []);
        } catch (error) {
            console.warn('Could not load opportunities');
        }
    }

    async function saveOpportunity(opp: Partial<Opportunity> & { type: string; name: string }) {
        if (!userId) return;
        try {
            const res = await fetch('/api/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...opp }),
            });
            if (res.ok) {
                showToast('Opportunity saved!', 'success');
                await loadOpportunities(userId);
            }
        } catch (error) {
            showToast('Failed to save opportunity', 'error');
        }
    }

    async function updateOpportunityStatus(id: string, status: string) {
        if (!userId) return;
        try {
            const res = await fetch('/api/opportunities', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, userId, status }),
            });
            if (res.ok) {
                const data = await res.json();
                if (status === 'received' && data.incomeCreated) {
                    showToast('🎉 Congrats! Added to your income sources!', 'success');
                    await loadIncomeSources(userId); // Reload income to show new source
                } else {
                    showToast(`Status updated to: ${STATUS_LABELS[status]}`, 'success');
                }
                await loadOpportunities(userId);
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    }

    async function deleteOpportunity(id: string) {
        if (!userId) return;
        try {
            const res = await fetch(`/api/opportunities?id=${id}&userId=${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                showToast('Opportunity removed', 'success');
                await loadOpportunities(userId);
            }
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    }


    function openAddModal() {
        setEditingSource(null);
        setFormType('job');
        setFormName('');
        setFormAmount('');
        setFormFrequency('monthly');
        setFormIsLoan(false);
        setFormInterestRate('');
        setFormNotes('');
        setShowAddModal(true);
    }

    function openEditModal(source: IncomeSource) {
        setEditingSource(source);
        setFormType(source.type);
        setFormName(source.name);
        setFormAmount(source.amount.toString());
        setFormFrequency(source.frequency);
        setFormIsLoan(source.isLoan);
        setFormInterestRate(source.interestRate?.toString() || '');
        setFormNotes(source.notes || '');
        setShowAddModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!userId) return;

        try {
            const payload = {
                userId,
                type: formType,
                name: formName,
                amount: parseFloat(formAmount),
                frequency: formFrequency,
                isLoan: formType === 'loan' || formIsLoan,
                interestRate: formInterestRate ? parseFloat(formInterestRate) : null,
                notes: formNotes || null,
            };

            if (editingSource) {
                await fetch('/api/income-sources', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: editingSource.id }),
                });
                showToast('Income source updated!', 'success');
            } else {
                await fetch('/api/income-sources', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Income source added!', 'success');
            }

            setShowAddModal(false);
            await Promise.all([loadIncomeSources(userId), loadFinancialHealth(userId)]);
        } catch (error) {
            console.error('Error saving:', error);
            showToast('Failed to save', 'error');
        }
    }

    async function handleDelete(id: string) {
        if (!userId || !confirm('Delete this income source?')) return;

        try {
            await fetch(`/api/income-sources?id=${id}`, { method: 'DELETE' });
            showToast('Deleted!', 'success');
            await Promise.all([loadIncomeSources(userId), loadFinancialHealth(userId)]);
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    }

    async function saveEmergencyFund() {
        if (!userId) return;

        try {
            await fetch('/api/emergency-fund', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    targetAmount: parseFloat(efTarget),
                    currentAmount: parseFloat(efCurrent),
                    weeklyContribution: parseFloat(efWeekly),
                }),
            });
            showToast('Emergency fund updated!', 'success');
            setEfEditing(false);
            await loadFinancialHealth(userId);
        } catch (error) {
            showToast('Failed to save', 'error');
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#76B89F', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#4b5563', fontWeight: 500 }}>Loading income data...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const cardStyle: React.CSSProperties = {
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6'
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .page-container {
                    animation: fadeIn 0.4s ease-out;
                }
                .header-section {
                    animation: fadeInUp 0.5s ease-out;
                }
                .card-animate {
                    animation: scaleIn 0.5s ease-out;
                }
                .btn-primary {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(118, 184, 159, 0.35);
                }
                .btn-primary:active {
                    transform: translateY(0) scale(0.98);
                }
                .btn-secondary {
                    transition: all 0.2s ease;
                }
                .btn-secondary:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .btn-secondary:active {
                    transform: scale(0.95);
                }
                .income-item {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .income-item:hover {
                    transform: translateX(4px);
                    background: #f3f4f6 !important;
                }
                .opportunity-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .opportunity-card:hover {
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .job-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .job-card:hover {
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                }
                .modal-overlay {
                    animation: fadeIn 0.2s ease-out;
                }
                .modal-content {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .progress-bar {
                    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .score-circle {
                    animation: fadeIn 0.6s ease-out;
                }
                .stat-card {
                    transition: all 0.3s ease;
                }
                .stat-card:hover {
                    transform: scale(1.05);
                }
                .badge {
                    transition: all 0.2s ease;
                }
                .badge:hover {
                    transform: scale(1.1);
                }
                .link-btn {
                    transition: all 0.2s ease;
                }
                .link-btn:hover {
                    transform: translateX(2px);
                }
            `}</style>
            <div className="page-container" style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Header */}
                <div className="header-section" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Income & Funding</h1>
                        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Track all your money sources</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="btn-primary"
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
                        + Add Income Source
                    </button>
                </div>

                {/* Financial Health Score */}
                {financialHealth && (
                    <div className="card-animate" style={{ ...cardStyle, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div className="score-circle" style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: `conic-gradient(
                ${financialHealth.healthLevel === 'excellent' ? '#10b981' :
                                    financialHealth.healthLevel === 'good' ? '#76B89F' :
                                        financialHealth.healthLevel === 'fair' ? '#f59e0b' : '#ef4444'} ${financialHealth.healthScore * 3.6}deg, 
                #e5e7eb ${financialHealth.healthScore * 3.6}deg
              )`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{financialHealth.healthScore}</span>
                                <span style={{ fontSize: '0.625rem', color: '#6b7280', textTransform: 'uppercase' }}>Score</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                                Financial Health:                                 <span style={{
                                    color: financialHealth.healthLevel === 'excellent' ? '#10b981' :
                                        financialHealth.healthLevel === 'good' ? '#76B89F' :
                                            financialHealth.healthLevel === 'fair' ? '#f59e0b' : '#ef4444',
                                    textTransform: 'capitalize'
                                }}>{financialHealth.healthLevel}</span>
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Weekly income: ${financialHealth.weeklyIncomeRate.toFixed(0)} | Weekly expenses: ${financialHealth.weeklyExpenseRate.toFixed(0)} |
                                Net: <span style={{ color: financialHealth.netWeeklyCashFlow >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                    {financialHealth.netWeeklyCashFlow >= 0 ? '+' : ''}${financialHealth.netWeeklyCashFlow.toFixed(0)}/week
                                </span>
                            </p>
                            {financialHealth.tips.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {financialHealth.tips.map((tip, i) => (
                                        <span key={i} className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#E8F3EF', color: '#2d5a44' }}>
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                    {/* Income Sources List */}
                    <div className="card-animate" style={cardStyle}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                            Net Income ({incomeSources.length})
                        </h3>
                        {incomeSources.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {incomeSources.map((source) => (
                                    <div
                                        key={source.id}
                                        className="income-item"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            backgroundColor: '#f9fafb',
                                            border: '1px solid #f3f4f6'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '2.5rem',
                                                height: '2.5rem',
                                                borderRadius: '0.5rem',
                                                background: INCOME_TYPE_COLORS[source.type as IncomeType],
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                {source.type === 'loan' ? '📋' : source.type === 'job' ? '💼' : source.type === 'scholarship' ? '🎓' : source.type === 'other' ? '🎉' : '$'}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{source.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {INCOME_TYPE_LABELS[source.type as IncomeType]} • {INCOME_FREQUENCY_LABELS[source.frequency as IncomeFrequency]}
                                                    {source.isLoan && source.interestRate && ` • ${source.interestRate}% APR`}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 700, color: source.isLoan || source.amount < 0 ? '#ef4444' : '#10b981', fontSize: '1rem' }}>
                                                ${source.amount.toFixed(0)}
                                            </span>
                                            <button onClick={() => openEditModal(source)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => handleDelete(source.id)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid #fecaca', borderRadius: '0.375rem', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: '#6b7280' }}>No income sources yet</p>
                                <button onClick={openAddModal} style={{ marginTop: '0.5rem', color: '#76B89F', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                                    + Add your first income source
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Emergency Fund */}
                    <div className="card-animate" style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                                Emergency Fund
                            </h3>
                            <button
                                onClick={() => setEfEditing(!efEditing)}
                                className="btn-secondary"
                                style={{ fontSize: '0.75rem', color: '#76B89F', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {efEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {efEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Target Amount</label>
                                    <input
                                        type="number"
                                        value={efTarget}
                                        onChange={(e) => setEfTarget(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Current Amount</label>
                                    <input
                                        type="number"
                                        value={efCurrent}
                                        onChange={(e) => setEfCurrent(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Weekly Contribution</label>
                                    <input
                                        type="number"
                                        value={efWeekly}
                                        onChange={(e) => setEfWeekly(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <button
                                    onClick={saveEmergencyFund}
                                    className="btn-primary"
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#10b981', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Progress</span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                            ${parseFloat(efCurrent).toFixed(0)} / ${parseFloat(efTarget).toFixed(0)}
                                        </span>
                                    </div>
                                    <div style={{ height: '0.75rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div
                                            className="progress-bar"
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#10b981',
                                                borderRadius: '9999px',
                                                width: `${Math.min(100, (parseFloat(efCurrent) / parseFloat(efTarget)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#166534' }}>Weekly contribution</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>${parseFloat(efWeekly).toFixed(0)}/week</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loan Summary */}
                    {financialHealth?.loanRepaymentProjection && (
                        <div className="card-animate" style={{ ...cardStyle, gridColumn: 'span 2' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem' }}>$</span>
                                Loan Repayment Projection
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>${financialHealth.loanRepaymentProjection.totalLoanAmount.toFixed(0)}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Loans</p>
                                </div>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>${financialHealth.loanRepaymentProjection.projectedSavings.toFixed(0)}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Projected Savings</p>
                                </div>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#E8F3EF', borderRadius: '0.75rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d5a44' }}>{financialHealth.loanRepaymentProjection.percentPayable.toFixed(0)}%</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Payable This Semester</p>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', borderLeft: '4px solid #76B89F' }}>
                                <p style={{ color: '#374151', lineHeight: 1.6 }}>{financialHealth.loanRepaymentProjection.message}</p>
                            </div>
                        </div>
                    )}

                    {/* My Applications Section */}
                    {opportunities.length > 0 && (
                        <div className="card-animate" style={{ ...cardStyle, gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem' }}>📋</span>
                                    My Applications
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', background: '#d1fae5', color: '#065f46', borderRadius: '9999px' }}>
                                        {opportunities.filter(o => o.status === 'received').length} Received
                                    </span>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '9999px' }}>
                                        {opportunities.filter(o => o.status === 'applied' || o.status === 'interviewing').length} Pending
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {opportunities.map((opp) => (
                                    <div
                                        key={opp.id}
                                        className="opportunity-card"
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid #e5e7eb',
                                            background: opp.status === 'received' ? '#f0fdf4' : opp.status === 'rejected' ? '#fef2f2' : '#fafafa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '1rem' }}>{opp.type === 'job' || opp.type === 'work_study' || opp.type === 'gig' ? '💼' : '🎓'}</span>
                                                <p style={{ fontWeight: 600, color: '#111827' }}>{opp.name}</p>
                                                {opp.organization && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>@ {opp.organization}</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                                {opp.amount && <span style={{ fontWeight: 500 }}>{opp.frequency === 'hourly' ? `$${opp.amount}/hr` : `$${opp.amount}`}</span>}
                                                {opp.hours_per_week && <span>{opp.hours_per_week} hrs/wk</span>}
                                                {opp.deadline && <span>Due: {new Date(opp.deadline).toLocaleDateString()}</span>}
                                                {opp.applied_date && <span>Applied: {new Date(opp.applied_date).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {opp.apply_url && (
                                                <a
                                                    href={opp.apply_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="link-btn"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', borderRadius: '0.375rem', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    Apply →
                                                </a>
                                            )}
                                            <select
                                                value={opp.status}
                                                onChange={(e) => updateOpportunityStatus(opp.id, e.target.value)}
                                                style={{
                                                    padding: '0.375rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '0.375rem',
                                                    border: 'none',
                                                    background: STATUS_COLORS[opp.status]?.bg || '#e5e7eb',
                                                    color: STATUS_COLORS[opp.status]?.text || '#374151',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <option value="discovered">🔍 Discovered</option>
                                                <option value="saved">💾 Saved</option>
                                                <option value="applied">📝 Applied</option>
                                                <option value="interviewing">🎤 Interviewing</option>
                                                <option value="received">🎉 Received!</option>
                                                <option value="rejected">❌ Rejected</option>
                                            </select>
                                            <button
                                                onClick={() => deleteOpportunity(opp.id)}
                                                style={{ padding: '0.375rem', fontSize: '0.75rem', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}
                                                title="Remove"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Job Board Section */}
                    <div className="card-animate" style={{ ...cardStyle, gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: '#76B89F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem' }}>💼</span>
                                Job Opportunities
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Mock data for demo</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {/* Campus Library Job */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>📚 Library Student Assistant</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Hayden Library, ASU</p>
                                    </div>
                                    <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#d1fae5', color: '#065f46', borderRadius: '9999px' }}>Flexible</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span>$15/hr</span>
                                    <span>8-15 hrs/wk</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://students.asu.edu/employment"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        View Listing →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'job',
                                            name: 'Library Student Assistant',
                                            organization: 'Hayden Library, ASU',
                                            amount: 15,
                                            frequency: 'hourly',
                                            hours_per_week: 12,
                                            apply_url: 'https://students.asu.edu/employment',
                                            status: 'saved',
                                            notes: 'Campus library job, ~8-15 hrs/week at $15/hr',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#76B89F', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#76B89F', textAlign: 'center' }}>
                                    Impact: +$120/wk → Stabilize weekly balance
                                </p>
                            </div>

                            {/* Event Staffing */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🎪 Event Staff - Football Games</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sun Devil Stadium</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', borderRadius: '9999px' }}>Seasonal</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span>$17/hr</span>
                                    <span>4-8 hrs/game</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://sundevilstadium.asu.edu/jobs"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        View Listing →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'gig',
                                            name: 'Event Staff - Football Games',
                                            organization: 'Sun Devil Stadium',
                                            amount: 17,
                                            frequency: 'hourly',
                                            hours_per_week: 6,
                                            apply_url: 'https://sundevilstadium.asu.edu/jobs',
                                            status: 'saved',
                                            notes: '~4 games/month, 4 hrs each at $17/hr',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#76B89F', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#76B89F', textAlign: 'center' }}>
                                    Impact: +$68/wk → Great for weekend income
                                </p>
                            </div>

                            {/* Red Bull Gig */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🥤 Red Bull Campus Rep</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Various campus locations</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', borderRadius: '9999px' }}>Fun</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span>$16/hr</span>
                                    <span>5-10 hrs/wk</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://jobs.redbull.com/us-en/student-marketeer"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        View Listing →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'gig',
                                            name: 'Red Bull Campus Rep',
                                            organization: 'Red Bull',
                                            amount: 16,
                                            frequency: 'hourly',
                                            hours_per_week: 7,
                                            apply_url: 'https://jobs.redbull.com/us-en/student-marketeer',
                                            status: 'saved',
                                            notes: 'Tabling and event gigs, ~5-10 hrs/week at $16/hr',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#76B89F', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#76B89F', textAlign: 'center' }}>
                                    Impact: +$80/wk → Free energy drinks included!
                                </p>
                            </div>

                            {/* Research Assistant */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🔬 Research Assistant</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Fulton Engineering</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fce7f3', color: '#9d174d', borderRadius: '9999px' }}>Resume+</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span>$18/hr</span>
                                    <span>10-15 hrs/wk</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://students.asu.edu/employment"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        View Listing →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'job',
                                            name: 'Research Assistant',
                                            organization: 'Fulton Engineering',
                                            amount: 18,
                                            frequency: 'hourly',
                                            hours_per_week: 12,
                                            apply_url: 'https://students.asu.edu/employment',
                                            status: 'saved',
                                            notes: 'Lab research position, ~10-15 hrs/week at $18/hr',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#76B89F', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#76B89F', textAlign: 'center' }}>
                                    Impact: +$180/wk → Build your career!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Scholarship Opportunities Section */}
                    <div className="card-animate" style={{ ...cardStyle, gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: '#f59e0b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem' }}>🎓</span>
                                Scholarship Opportunities
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Free money you don't have to repay!</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {/* General ASU Scholarship */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🌟 ASU General Scholarship</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Office of Scholarships & Aid</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#d1fae5', color: '#065f46', borderRadius: '9999px' }}>Open Now</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>$500-$2,000</span>
                                    <span>Due: Mar 1</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://students.asu.edu/scholarships"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#fef3c7', color: '#92400e', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        Apply →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'scholarship',
                                            name: 'ASU General Scholarship',
                                            organization: 'Office of Scholarships & Aid',
                                            amount: 1000,
                                            frequency: 'semester',
                                            deadline: '2026-03-01',
                                            apply_url: 'https://students.asu.edu/scholarships',
                                            status: 'saved',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#f59e0b', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#f59e0b', textAlign: 'center' }}>
                                    Impact: Free $1,000! No repayment needed
                                </p>
                            </div>

                            {/* Essay Contest */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>✍️ "Why College" Essay Contest</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>National Essay Competition</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', borderRadius: '9999px' }}>500 words</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>$750</span>
                                    <span>Rolling deadline</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://scholarships.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#fef3c7', color: '#92400e', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        Apply →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'scholarship',
                                            name: 'Why College Essay Contest',
                                            organization: 'National Essay Competition',
                                            amount: 750,
                                            frequency: 'one_time',
                                            apply_url: 'https://scholarships.com',
                                            status: 'saved',
                                            notes: 'Rolling deadline - 500 word essay',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#f59e0b', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#f59e0b', textAlign: 'center' }}>
                                    Low effort, high reward - just a short essay!
                                </p>
                            </div>

                            {/* STEM Scholarship */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🔬 STEM Excellence Award</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Fulton Schools of Engineering</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', borderRadius: '9999px' }}>STEM Only</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>$1,500</span>
                                    <span>Due: Apr 15</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://engineering.asu.edu/scholarships"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#fef3c7', color: '#92400e', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        Apply →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'scholarship',
                                            name: 'STEM Excellence Award',
                                            organization: 'Fulton Schools of Engineering',
                                            amount: 1500,
                                            frequency: 'semester',
                                            deadline: '2026-04-15',
                                            apply_url: 'https://engineering.asu.edu/scholarships',
                                            status: 'saved',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#f59e0b', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#f59e0b', textAlign: 'center' }}>
                                    Impact: Covers ~2 months of expenses!
                                </p>
                            </div>

                            {/* First-Gen Scholarship */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>💪 First-Gen Student Award</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>ASU Student Success Office</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fce7f3', color: '#9d174d', borderRadius: '9999px' }}>Identity</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>$1,000</span>
                                    <span>Due: Feb 28</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a
                                        href="https://students.asu.edu/first-generation"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-btn"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#fef3c7', color: '#92400e', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        Apply →
                                    </a>
                                    <button
                                        onClick={() => saveOpportunity({
                                            type: 'grant',
                                            name: 'First-Gen Student Award',
                                            organization: 'ASU Student Success Office',
                                            amount: 1000,
                                            frequency: 'semester',
                                            deadline: '2026-02-28',
                                            apply_url: 'https://students.asu.edu/first-generation',
                                            status: 'saved',
                                        })}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#f59e0b', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        + Track
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#f59e0b', textAlign: 'center' }}>
                                    First in your family? You qualify!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Events Section */}
                    <div className="card-animate" style={{ ...cardStyle, gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: '#9b8fc9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem' }}>🎉</span>
                                2026 Events
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Mock data for demo</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {/* Formula 1 Austin */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🏎️ Formula 1 Austin 2026</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Circuit of the Americas</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', borderRadius: '9999px' }}>Racing</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#dc2626' }}>$250</span>
                                    <span>Oct 23-25, 2026</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormType('other');
                                        setFormName('Formula 1 Austin 2026');
                                        setFormAmount('-250');
                                        setFormFrequency('one_time');
                                        setFormIsLoan(false);
                                        setFormNotes('F1 race weekend ticket - one-time event');
                                        setShowAddModal(true);
                                    }}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: '#9b8fc9', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    + Add This Event
                                </button>
                                <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.5rem', textAlign: 'center' }}>
                                    Impact: -$250 one-time expense
                                </p>
                            </div>

                            {/* Decadence 2026 */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🎶 Decadence 2026</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phoenix Convention Center</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fce7f3', color: '#831843', borderRadius: '9999px' }}>Rave</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#dc2626' }}>$200</span>
                                    <span>Dec 30-31, 2026</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormType('other');
                                        setFormName('Decadence 2026');
                                        setFormAmount('-200');
                                        setFormFrequency('one_time');
                                        setFormIsLoan(false);
                                        setFormNotes('NYE rave ticket - one-time event');
                                        setShowAddModal(true);
                                    }}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: '#9b8fc9', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    + Add This Event
                                </button>
                                <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.5rem', textAlign: 'center' }}>
                                    Impact: -$200 one-time expense
                                </p>
                            </div>

                            {/* Snowbowl Trip */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>⛷️ Snowbowl Trip</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Flagstaff, Arizona</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#dbeafe', color: '#1e3a8a', borderRadius: '9999px' }}>Ski Trip</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#dc2626' }}>$200</span>
                                    <span>Feb 14-15, 2026</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormType('other');
                                        setFormName('Snowbowl Trip');
                                        setFormAmount('-200');
                                        setFormFrequency('one_time');
                                        setFormIsLoan(false);
                                        setFormNotes('Ski trip with friends - one-time event');
                                        setShowAddModal(true);
                                    }}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: '#9b8fc9', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    + Add This Event
                                </button>
                                <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.5rem', textAlign: 'center' }}>
                                    Impact: -$200 one-time expense
                                </p>
                            </div>

                            {/* Arizona State Fair */}
                            <div className="job-card" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#111827' }}>🎡 Arizona State Fair</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phoenix, AZ</p>
                                    </div>
                                    <span className="badge" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fef3c7', color: '#78350f', borderRadius: '9999px' }}>Fair</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#dc2626' }}>$50</span>
                                    <span>Oct 10, 2026</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormType('other');
                                        setFormName('Arizona State Fair');
                                        setFormAmount('-50');
                                        setFormFrequency('one_time');
                                        setFormIsLoan(false);
                                        setFormNotes('State fair visit - one-time event');
                                        setShowAddModal(true);
                                    }}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: '#9b8fc9', color: 'white', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    + Add This Event
                                </button>
                                <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.5rem', textAlign: 'center' }}>
                                    Impact: -$50 one-time expense
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#111827' }}>
                            {editingSource ? 'Edit Income Source' : 'Add Income Source'}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>Type</label>
                                <select
                                    value={formType}
                                    onChange={(e) => {
                                        setFormType(e.target.value as IncomeType);
                                        if (e.target.value === 'loan') setFormIsLoan(true);
                                    }}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                >
                                    {Object.entries(INCOME_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g., Campus Library Job"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>Amount ($)</label>
                                <input
                                    type="number"
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    placeholder="0"
                                    required
                                    step="0.01"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>Frequency</label>
                                <select
                                    value={formFrequency}
                                    onChange={(e) => setFormFrequency(e.target.value as IncomeFrequency)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                >
                                    {Object.entries(INCOME_FREQUENCY_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            {formType === 'loan' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formInterestRate}
                                        onChange={(e) => setFormInterestRate(e.target.value)}
                                        placeholder="4.5"
                                        step="0.1"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>Notes (optional)</label>
                                <textarea
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Any additional details..."
                                    rows={2}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#76B89F', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    {editingSource ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}