"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { IncomeSource, IncomeType, IncomeFrequency, FinancialHealth, INCOME_TYPE_LABELS, INCOME_FREQUENCY_LABELS } from "@/lib/types";

const INCOME_TYPE_COLORS: Record<IncomeType, string> = {
    job: '#14b8a6',
    scholarship: '#f59e0b',
    grant: '#10b981',
    loan: '#ef4444',
    family: '#ec4899',
    work_study: '#06b6d4',
    other: '#6b7280',
};

export default function IncomePage() {
    const { showToast } = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

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
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#14b8a6', animation: 'spin 1s linear infinite' }} />
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
            <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Income & Funding</h1>
                        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Track all your money sources</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            background: '#14b8a6',
                            color: 'white',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(20, 184, 166, 0.25)'
                        }}
                    >
                        + Add Income Source
                    </button>
                </div>

                {/* Financial Health Score */}
                {financialHealth && (
                    <div style={{ ...cardStyle, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: `conic-gradient(
                ${financialHealth.healthLevel === 'excellent' ? '#10b981' :
                                    financialHealth.healthLevel === 'good' ? '#14b8a6' :
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
                                Financial Health: <span style={{
                                    color: financialHealth.healthLevel === 'excellent' ? '#10b981' :
                                        financialHealth.healthLevel === 'good' ? '#14b8a6' :
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
                                        <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#ccfbf1', color: '#0f766e' }}>
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
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                            Income Sources ({incomeSources.length})
                        </h3>
                        {incomeSources.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {incomeSources.map((source) => (
                                    <div
                                        key={source.id}
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
                                                {source.type === 'loan' ? '📋' : source.type === 'job' ? '💼' : source.type === 'scholarship' ? '🎓' : '$'}
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
                                            <span style={{ fontWeight: 700, color: source.isLoan ? '#ef4444' : '#10b981', fontSize: '1rem' }}>
                                                ${source.amount.toFixed(0)}
                                            </span>
                                            <button onClick={() => openEditModal(source)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => handleDelete(source.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid #fecaca', borderRadius: '0.375rem', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: '#6b7280' }}>No income sources yet</p>
                                <button onClick={openAddModal} style={{ marginTop: '0.5rem', color: '#14b8a6', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                                    + Add your first income source
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Emergency Fund */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                                Emergency Fund
                            </h3>
                            <button
                                onClick={() => setEfEditing(!efEditing)}
                                style={{ fontSize: '0.75rem', color: '#14b8a6', background: 'none', border: 'none', cursor: 'pointer' }}
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
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#10b981',
                                                borderRadius: '9999px',
                                                width: `${Math.min(100, (parseFloat(efCurrent) / parseFloat(efTarget)) * 100)}%`,
                                                transition: 'width 0.5s ease'
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
                        <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem' }}>$</span>
                                Loan Repayment Projection
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>${financialHealth.loanRepaymentProjection.totalLoanAmount.toFixed(0)}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Loans</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>${financialHealth.loanRepaymentProjection.projectedSavings.toFixed(0)}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Projected Savings</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#ccfbf1', borderRadius: '0.75rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f766e' }}>{financialHealth.loanRepaymentProjection.percentPayable.toFixed(0)}%</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Payable This Semester</p>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', borderLeft: '4px solid #14b8a6' }}>
                                <p style={{ color: '#374151', lineHeight: 1.6 }}>{financialHealth.loanRepaymentProjection.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
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
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#14b8a6', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
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
