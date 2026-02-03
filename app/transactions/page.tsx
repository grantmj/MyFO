"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_LABELS, Category } from "@/lib/constants";
import { format, startOfMonth, startOfWeek, subMonths } from "date-fns";
import Papa from "papaparse";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  source: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  rent: '#ef4444',
  utilities: '#f97316',
  groceries: '#22c55e',
  dining: '#eab308',
  transportation: '#3b82f6',
  books_supplies: '#8b5cf6',
  health: '#ec4899',
  subscriptions: '#06b6d4',
  entertainment: '#f43f5e',
  travel: '#14b8a6',
  misc: '#6b7280',
  income: '#76B89F',
};

const CATEGORY_ICONS: Record<string, string> = {
  rent: '🏠',
  utilities: '💡',
  groceries: '🛒',
  dining: '🍕',
  transportation: '🚗',
  books_supplies: '📚',
  health: '💊',
  subscriptions: '📱',
  entertainment: '🎬',
  travel: '✈️',
  misc: '📦',
  income: '💰',
};

export default function TransactionsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<'week' | 'month' | 'semester'>('month');

  // CSV parsing state
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [dateColumn, setDateColumn] = useState('');
  const [descColumn, setDescColumn] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [amountConvention, setAmountConvention] = useState<'positive-spend' | 'negative-spend'>('positive-spend');

  // PDF parsing state
  const [pdfParsing, setPdfParsing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [editableTransactions, setEditableTransactions] = useState<any[]>([]);

  // Computed spending analytics
  const spendingAnalytics = useMemo(() => {
    const now = new Date();
    let periodStart: Date;

    switch (viewPeriod) {
      case 'week':
        periodStart = startOfWeek(now);
        break;
      case 'semester':
        periodStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
        break;
      default:
        periodStart = startOfMonth(now);
    }

    const prevPeriodStart = subMonths(periodStart, 1);

    // Filter transactions for current period (expenses only, positive amounts)
    const periodTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= periodStart && t.amount > 0 && t.category !== 'income';
    });

    const prevPeriodTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= prevPeriodStart && txDate < periodStart && t.amount > 0 && t.category !== 'income';
    });

    // Calculate totals
    const totalSpending = periodTransactions.reduce((sum, t) => sum + t.amount, 0);
    const prevTotalSpending = prevPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Days elapsed in period
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDaily = totalSpending / daysElapsed;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    periodTransactions.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const categoryTotals = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
        label: CATEGORY_LABELS[category as Category] || category,
        color: CATEGORY_COLORS[category] || '#6b7280',
        icon: CATEGORY_ICONS[category] || '📦',
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top 5 expenses
    const topExpenses = [...periodTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalSpending,
      prevTotalSpending,
      avgDaily,
      daysElapsed,
      categoryTotals,
      topExpenses,
      changePercent: prevTotalSpending > 0 ? ((totalSpending - prevTotalSpending) / prevTotalSpending) * 100 : 0,
    };
  }, [transactions, viewPeriod]);

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    try {
      const userRes = await fetch('/api/user');
      const { user } = await userRes.json();
      setUserId(user.id);

      await fetchTransactions(user.id);
    } catch (error) {
      console.error('Error initializing page:', error);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions(uid: string) {
    const res = await fetch(`/api/transactions?userId=${uid}`);
    const { transactions } = await res.json();
    setTransactions(transactions);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          showToast('CSV file is empty', 'error');
          return;
        }

        const headers = Object.keys(results.data[0] as Record<string, unknown>);
        setCsvHeaders(headers);
        setCsvData(results.data);

        // Try to auto-detect columns
        const dateCols = ['date', 'transaction date', 'posted date'];
        const descCols = ['description', 'name', 'merchant'];
        const amountCols = ['amount', 'debit', 'credit'];

        const dateCol = headers.find(h => dateCols.includes(h.toLowerCase())) || '';
        const descCol = headers.find(h => descCols.includes(h.toLowerCase())) || '';
        const amountCol = headers.find(h => amountCols.includes(h.toLowerCase())) || '';

        if (dateCol && descCol && amountCol) {
          // Auto-detected all columns
          setDateColumn(dateCol);
          setDescColumn(descCol);
          setAmountColumn(amountCol);
          setShowColumnMapper(false);
          processCSV(results.data, dateCol, descCol, amountCol);
        } else {
          // Need user to map columns
          setDateColumn(dateCol);
          setDescColumn(descCol);
          setAmountColumn(amountCol);
          setShowColumnMapper(true);
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        showToast('Failed to parse CSV file', 'error');
      },
    });
  }

  async function processCSV(
    data: any[],
    dateCol: string,
    descCol: string,
    amountCol: string
  ) {
    if (!userId) return;

    try {
      setUploading(true);

      const transactions = data.map(row => ({
        date: row[dateCol],
        description: row[descCol],
        amount: parseFloat(row[amountCol]),
      })).filter(t => t.date && t.description && !isNaN(t.amount));

      if (transactions.length === 0) {
        showToast('No valid transactions found in CSV', 'error');
        return;
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactions,
          amountConvention,
        }),
      });

      if (res.ok) {
        const { count } = await res.json();
        showToast(`Imported ${count} transactions successfully!`, 'success');
        await fetchTransactions(userId);
        resetCSVState();
      } else {
        showToast('Failed to import transactions', 'error');
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      showToast('Failed to import transactions', 'error');
    } finally {
      setUploading(false);
    }
  }

  function resetCSVState() {
    setCsvData([]);
    setCsvHeaders([]);
    setDateColumn('');
    setDescColumn('');
    setAmountColumn('');
    setShowColumnMapper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function updateTransactionCategory(transactionId: string, category: string) {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, category }),
      });

      if (res.ok) {
        showToast('Category updated', 'success');
        if (userId) await fetchTransactions(userId);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      showToast('Failed to update category', 'error');
    }
  }

  // PDF Upload handlers
  async function handlePdfSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a PDF file', 'error');
      return;
    }

    setPdfParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/transactions/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setParsedTransactions(data.transactions);
        setEditableTransactions(data.transactions.map((t: any) => ({ ...t })));
        setShowPdfPreview(true);
        showToast(`Found ${data.count} transactions!`, 'success');
      } else {
        showToast(data.error || 'Failed to parse PDF', 'error');
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      showToast('Failed to parse PDF', 'error');
    } finally {
      setPdfParsing(false);
    }
  }

  async function confirmPdfImport() {
    if (!userId) return;

    try {
      setUploading(true);

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactions: editableTransactions,
          source: 'pdf',
        }),
      });

      if (res.ok) {
        const { count } = await res.json();
        showToast(`Imported ${count} transactions from PDF!`, 'success');
        await fetchTransactions(userId);
        cancelPdfImport();
      } else {
        showToast('Failed to import transactions', 'error');
      }
    } catch (error) {
      console.error('Error importing PDF transactions:', error);
      showToast('Failed to import transactions', 'error');
    } finally {
      setUploading(false);
    }
  }

  function cancelPdfImport() {
    setParsedTransactions([]);
    setEditableTransactions([]);
    setShowPdfPreview(false);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  }

  function updateParsedCategory(index: number, category: string) {
    const updated = [...editableTransactions];
    updated[index].category = category;
    setEditableTransactions(updated);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#76B89F', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#4b5563', fontWeight: 500 }}>Loading transactions...</p>
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
    border: '1px solid #f3f4f6',
    marginBottom: '1rem'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Transactions
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            Track and analyze your spending
          </p>
        </div>

        {/* Period Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['week', 'month', 'semester'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setViewPeriod(period)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: viewPeriod === period ? '#76B89F' : '#e5e7eb',
                color: viewPeriod === period ? 'white' : '#374151',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              This {period}
            </button>
          ))}
        </div>

        {/* Spending Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Total Spending */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💰</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Spending</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              ${spendingAnalytics.totalSpending.toFixed(2)}
            </p>
            {spendingAnalytics.prevTotalSpending > 0 && (
              <p style={{
                fontSize: '0.75rem',
                color: spendingAnalytics.changePercent > 0 ? '#ef4444' : '#22c55e',
                marginTop: '0.25rem'
              }}>
                {spendingAnalytics.changePercent > 0 ? '↑' : '↓'} {Math.abs(spendingAnalytics.changePercent).toFixed(0)}% vs last period
              </p>
            )}
          </div>

          {/* Daily Average */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Daily Average</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              ${spendingAnalytics.avgDaily.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              over {spendingAnalytics.daysElapsed} days
            </p>
          </div>

          {/* Transaction Count */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🧾</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Transactions</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              {spendingAnalytics.categoryTotals.reduce((sum, c) => sum + 1, 0) > 0 ? spendingAnalytics.topExpenses.length + (spendingAnalytics.categoryTotals.length > 5 ? '+' : '') : '0'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {spendingAnalytics.categoryTotals.length} categories
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {spendingAnalytics.categoryTotals.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Spending by Category
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {spendingAnalytics.categoryTotals.map((cat) => (
                <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '2rem', textAlign: 'center', fontSize: '1.25rem' }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{cat.label}</span>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>${cat.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(cat.percentage, 100)}%`,
                          background: cat.color,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ minWidth: '3rem', textAlign: 'right', fontSize: '0.75rem', color: '#6b7280' }}>
                    {cat.percentage.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Expenses */}
        {spendingAnalytics.topExpenses.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔥 Top Expenses
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {spendingAnalytics.topExpenses.map((tx, i) => (
                <div key={tx.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      background: CATEGORY_COLORS[tx.category] || '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'white',
                      fontWeight: 600,
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <p style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem', margin: 0 }}>{tx.description}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        {CATEGORY_LABELS[tx.category as Category] || tx.category} • {format(new Date(tx.date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.875rem' }}>
                    -${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {transactions.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📭</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>No transactions yet</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Import your bank statements below to see your spending breakdown</p>
          </div>
        )}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Import from PDF</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Upload a credit card statement PDF - we&apos;ll automatically extract and categorize transactions using AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfSelect}
              disabled={pdfParsing}
              style={{
                width: '100%',
                fontSize: '0.875rem',
                color: '#111827'
              }}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent/90 disabled:opacity-50"
            />

            {pdfParsing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: '2px solid #76B89F', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                <span>Parsing PDF and extracting transactions...</span>
              </div>
            )}

            {showPdfPreview && !pdfParsing && (
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                  Found {editableTransactions.length} transactions - Review and confirm
                </h3>
                <div style={{ overflowX: 'auto', maxHeight: '24rem', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 500, color: '#6b7280' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 500, color: '#6b7280' }}>Description</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 500, color: '#6b7280' }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 500, color: '#6b7280' }}>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableTransactions.map((transaction, index) => (
                        <tr key={index} style={{ borderBottom: index === editableTransactions.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem', color: '#111827', whiteSpace: 'nowrap' }}>
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </td>
                          <td style={{ padding: '0.5rem', color: '#111827' }}>
                            {transaction.description}
                          </td>
                          <td style={{ padding: '0.5rem', color: '#111827', fontWeight: 500 }}>
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <select
                              value={transaction.category}
                              onChange={(e) => updateParsedCategory(index, e.target.value)}
                              style={{ fontSize: '0.875rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', color: '#111827', backgroundColor: 'white' }}
                            >
                              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={confirmPdfImport}
                    disabled={uploading}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      background: '#76B89F',
                      color: 'white',
                      fontWeight: 600,
                      border: 'none',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.5 : 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {uploading ? 'Importing...' : `Import ${editableTransactions.length} Transactions`}
                  </button>
                  <button
                    onClick={cancelPdfImport}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      color: '#374151',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CSV Import Section */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Import from CSV</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Upload a CSV file from your bank. Should include Date, Description, and Amount columns.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{
                width: '100%',
                fontSize: '0.875rem',
                color: '#111827'
              }}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent/90"
            />

            {showColumnMapper && (
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Map CSV Columns</h3>
                <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <Select
                    label="Date Column"
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    options={[
                      { value: '', label: 'Select...' },
                      ...csvHeaders.map(h => ({ value: h, label: h })),
                    ]}
                  />
                  <Select
                    label="Description Column"
                    value={descColumn}
                    onChange={(e) => setDescColumn(e.target.value)}
                    options={[
                      { value: '', label: 'Select...' },
                      ...csvHeaders.map(h => ({ value: h, label: h })),
                    ]}
                  />
                  <Select
                    label="Amount Column"
                    value={amountColumn}
                    onChange={(e) => setAmountColumn(e.target.value)}
                    options={[
                      { value: '', label: 'Select...' },
                      ...csvHeaders.map(h => ({ value: h, label: h })),
                    ]}
                  />
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <Select
                    label="Amount Convention"
                    value={amountConvention}
                    onChange={(e) => setAmountConvention(e.target.value as any)}
                    options={[
                      { value: 'positive-spend', label: 'Positive = Spending (e.g., 50.00)' },
                      { value: 'negative-spend', label: 'Negative = Spending (e.g., -50.00)' },
                    ]}
                  />
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => processCSV(csvData, dateColumn, descColumn, amountColumn)}
                    disabled={!dateColumn || !descColumn || !amountColumn || uploading}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      background: '#76B89F',
                      color: 'white',
                      fontWeight: 600,
                      border: 'none',
                      cursor: (!dateColumn || !descColumn || !amountColumn || uploading) ? 'not-allowed' : 'pointer',
                      opacity: (!dateColumn || !descColumn || !amountColumn || uploading) ? 0.5 : 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {uploading ? 'Importing...' : 'Import Transactions'}
                  </button>
                  <button
                    onClick={resetCSVState}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      color: '#374151',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bank/Credit Card Linking Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Connect Your Accounts</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Link your bank or credit card for automatic transaction imports</p>
            </div>
            <span style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.65rem',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: '9999px',
              fontWeight: 500
            }}>Coming Soon</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Bank Account */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '2px dashed #d1d5db',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
              onClick={() => showToast('Bank linking coming soon! Use CSV import for now.', 'info')}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 0.75rem',
                borderRadius: '50%',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🏦</span>
              </div>
              <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Bank Account</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Chase, Bank of America, Wells Fargo...</p>
            </div>

            {/* Credit Card */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '2px dashed #d1d5db',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
              onClick={() => showToast('Credit card linking coming soon! Use CSV import for now.', 'info')}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 0.75rem',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>💳</span>
              </div>
              <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Credit Card</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Visa, Mastercard, Discover, Amex...</p>
            </div>

            {/* Statement PDF */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '2px dashed #d1d5db',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
              onClick={() => showToast('PDF statement parsing coming soon! Use CSV import for now.', 'info')}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 0.75rem',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📄</span>
              </div>
              <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Upload Statement</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>PDF bank/credit card statements</p>
            </div>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f0fdf4',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem' }}>✨</span>
            <p style={{ fontSize: '0.8rem', color: '#166534' }}>
              Connecting accounts enables               <strong>auto-categorization</strong> and <strong>real-time budget tracking</strong>
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            All Transactions ({transactions.length})
          </h2>

          {transactions.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No transactions yet. Import your bank CSV to get started.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: '#6b7280' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: '#6b7280' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: '#6b7280' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: '#6b7280' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: 500, color: '#6b7280' }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} style={{ borderBottom: index === transactions.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#111827', whiteSpace: 'nowrap' }}>
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#111827' }}>
                        {transaction.description}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#111827', fontWeight: 500 }}>
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <select
                          value={transaction.category}
                          onChange={(e) => updateTransactionCategory(transaction.id, e.target.value)}
                          style={{ fontSize: '0.875rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', color: '#111827', backgroundColor: 'white' }}
                        >
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                        {transaction.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
