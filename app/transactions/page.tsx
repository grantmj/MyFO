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

// Balance Graph Component
function BalanceGraph({ transactions, viewPeriod, initialBalance }: { 
  transactions: Transaction[], 
  viewPeriod: '7days' | '30days' | '90days',
  initialBalance: number 
}) {
  const cardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    marginBottom: 0,
  };

  // Calculate daily balance data
  const balanceData = useMemo(() => {
    const now = new Date();
    const daysBack = viewPeriod === '7days' ? 7 : viewPeriod === '30days' ? 30 : 90;
    
    // Get period start
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - daysBack);
    periodStart.setHours(0, 0, 0, 0);
    
    // Filter and sort transactions in period (expenses only)
    const periodTx = transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return txDate >= periodStart && t.amount > 0 && t.category !== 'income';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate total spending in the period
    const totalSpending = periodTx.reduce((sum, t) => sum + t.amount, 0);
    
    // Start balance at beginning of period (before any spending)
    const startBalance = initialBalance + totalSpending;
    
    // Calculate balance for each day
    const dailyData: { date: Date; balance: number }[] = [];
    let currentBalance = startBalance;
    
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(periodStart);
      date.setDate(periodStart.getDate() + i);
      
      // Get spending for this specific day
      const daySpending = periodTx
        .filter(t => {
          const txDate = new Date(t.date);
          txDate.setHours(0, 0, 0, 0);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          return txDate.getTime() === checkDate.getTime();
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Balance at start of day (before spending)
      dailyData.push({ date: new Date(date), balance: currentBalance });
      
      // Subtract spending for next day
      currentBalance -= daySpending;
    }
    
    return dailyData;
  }, [transactions, viewPeriod, initialBalance]);

  // Calculate graph dimensions
  const width = 400;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 45, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  if (balanceData.length === 0) {
    return (
      <div className="card-animate" style={cardStyle}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          📈 Balance Over Time
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Not enough data</p>
      </div>
    );
  }

  // Calculate scales
  const minBalance = Math.min(...balanceData.map(d => d.balance));
  const maxBalance = Math.max(...balanceData.map(d => d.balance));
  const balanceRange = maxBalance - minBalance || 1;
  
  // Calculate zero line Y position
  const zeroY = padding.top + graphHeight - ((0 - minBalance) / balanceRange) * graphHeight;

  // Generate path points with balance values
  const points = balanceData.map((d, i) => {
    const x = padding.left + (i / (balanceData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((d.balance - minBalance) / balanceRange) * graphHeight;
    return { x, y, balance: d.balance };
  });

  // Create separate paths for positive (green) and negative (red) portions
  const positivePath: string[] = [];
  const negativePath: string[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const prevPoint = i > 0 ? points[i - 1] : null;
    
    if (point.balance >= 0) {
      // Point is positive
      if (prevPoint && prevPoint.balance < 0) {
        // Crossing from negative to positive - add intersection point
        const intersectX = prevPoint.x + ((point.x - prevPoint.x) * (0 - prevPoint.balance)) / (point.balance - prevPoint.balance);
        negativePath.push(`L ${intersectX} ${zeroY}`);
        positivePath.push(`M ${intersectX} ${zeroY}`);
      }
      if (positivePath.length === 0) {
        positivePath.push(`M ${point.x} ${point.y}`);
      } else {
        positivePath.push(`L ${point.x} ${point.y}`);
      }
    } else {
      // Point is negative
      if (prevPoint && prevPoint.balance >= 0) {
        // Crossing from positive to negative - add intersection point
        const intersectX = prevPoint.x + ((point.x - prevPoint.x) * (0 - prevPoint.balance)) / (point.balance - prevPoint.balance);
        positivePath.push(`L ${intersectX} ${zeroY}`);
        negativePath.push(`M ${intersectX} ${zeroY}`);
      }
      if (negativePath.length === 0) {
        negativePath.push(`M ${point.x} ${point.y}`);
      } else {
        negativePath.push(`L ${point.x} ${point.y}`);
      }
    }
  }
  
  const positivePathD = positivePath.join(' ');
  const negativePathD = negativePath.join(' ');

  return (
    <div className="card-animate" style={cardStyle}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📈 Balance Over Time
      </h2>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Grid lines (subtle) */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + graphHeight * (1 - pct);
          return (
            <line
              key={pct}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}
        
        {/* Zero line (horizontal line at y=0) */}
        {minBalance < 0 && maxBalance > 0 && (
          <g>
            <line
              x1={padding.left}
              y1={zeroY}
              x2={width - padding.right}
              y2={zeroY}
              stroke="#6b7280"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              opacity="0.5"
            />
            <text
              x={width - padding.right + 5}
              y={zeroY}
              fontSize="9"
              fill="#6b7280"
              dominantBaseline="middle"
            >
              $0
            </text>
          </g>
        )}
        
        {/* Positive balance line (green) */}
        {positivePathD && (
          <path
            d={positivePathD}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            opacity="0.7"
          />
        )}
        
        {/* Negative balance line (red) */}
        {negativePathD && (
          <path
            d={negativePathD}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            opacity="0.7"
          />
        )}
        
        {/* Y-axis labels */}
        {[0, 1].map((pct) => {
          const y = padding.top + graphHeight * (1 - pct);
          const value = minBalance + balanceRange * pct;
          return (
            <text
              key={pct}
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              fontSize="10"
              fill="#9ca3af"
              dominantBaseline="middle"
            >
              ${value.toFixed(0)}
            </text>
          );
        })}
        
        {/* X-axis day labels */}
        {balanceData.map((d, i) => {
          // Show labels every few days based on view period
          const interval = viewPeriod === '7days' ? 1 : viewPeriod === '30days' ? 5 : 15;
          if (i % interval !== 0 && i !== balanceData.length - 1) return null;
          
          const x = padding.left + (i / (balanceData.length - 1)) * graphWidth;
          const dateStr = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <text
              key={i}
              x={x}
              y={height - padding.bottom + 15}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
            >
              {dateStr}
            </text>
          );
        })}
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="balanceGradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="balanceGradientRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.03" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function TransactionsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [statementBalance, setStatementBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'analytics' | 'history'>('manage');
  const [viewPeriod, setViewPeriod] = useState<'7days' | '30days' | '90days'>('30days');

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
    let daysBack: number;
    let periodLabel: string;

    switch (viewPeriod) {
      case '7days':
        daysBack = 7;
        periodLabel = 'Last 7 Days';
        break;
      case '90days':
        daysBack = 90;
        periodLabel = 'Last 90 Days';
        break;
      default: // '30days'
        daysBack = 30;
        periodLabel = 'Last 30 Days';
    }

    // Current period: last N days
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - daysBack);
    periodStart.setHours(0, 0, 0, 0);

    // Previous period: the N days before that
    const prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(periodStart.getDate() - daysBack);
    const prevPeriodEnd = new Date(periodStart);
    prevPeriodEnd.setHours(23, 59, 59, 999);

    // Filter transactions for current period (expenses only, positive amounts)
    const periodTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= periodStart && t.amount > 0 && t.category !== 'income';
    });

    const prevPeriodTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= prevPeriodStart && txDate < prevPeriodEnd && t.amount > 0 && t.category !== 'income';
    });

    // Debug: log filtering info
    if (transactions.length > 0) {
      console.log(`[${periodLabel}] Period start:`, periodStart.toISOString().split('T')[0]);
      console.log(`[${periodLabel}] Transactions in period:`, periodTransactions.length, 'of', transactions.length);
    }

    // Calculate totals
    const totalSpending = periodTransactions.reduce((sum, t) => sum + t.amount, 0);
    const prevTotalSpending = prevPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Average per day over the full period (not just days with transactions)
    const avgDaily = totalSpending / daysBack;

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
      daysBack,
      periodLabel,
      categoryTotals,
      topExpenses,
      transactionCount: periodTransactions.length,
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

      // Fetch transactions and snapshot in parallel
      await Promise.all([
        fetchTransactions(user.id),
        fetchSnapshot(user.id),
      ]);
    } catch (error) {
      console.error('Error initializing page:', error);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSnapshot(uid: string) {
    try {
      const res = await fetch(`/api/budget-snapshot?userId=${uid}`);
      const data = await res.json();
      setSnapshot(data.snapshot);
    } catch (error) {
      console.error('Error fetching snapshot:', error);
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
        const { count, duplicatesSkipped, message } = await res.json();
        showToast(message || `Imported ${count} transactions successfully!`, 'success');
        await Promise.all([
          fetchTransactions(userId),
          fetchSnapshot(userId),
        ]);
        resetCSVState();
        // Switch to analytics tab to see the results
        setActiveTab('analytics');
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

  async function deleteTransaction(transactionId: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const res = await fetch(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Transaction deleted', 'success');
        if (userId) await fetchTransactions(userId);
      } else {
        showToast('Failed to delete transaction', 'error');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Failed to delete transaction', 'error');
    }
  }

  async function clearAllTransactions() {
    if (!confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) return;

    try {
      setLoading(true);
      
      // Delete transactions one by one (could be optimized with a bulk delete endpoint)
      const deletePromises = transactions.map(t => 
        fetch(`/api/transactions?id=${t.id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      showToast('All transactions cleared', 'success');
      if (userId) await fetchTransactions(userId);
    } catch (error) {
      console.error('Error clearing transactions:', error);
      showToast('Failed to clear transactions', 'error');
    } finally {
      setLoading(false);
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
        
        // Capture statement balance if available
        if (typeof data.statementBalance === 'number') {
          setStatementBalance(data.statementBalance);
          const balanceMsg = data.statementBalance >= 0 
            ? `Balance: $${data.statementBalance.toFixed(2)} available` 
            : `Balance: $${Math.abs(data.statementBalance).toFixed(2)} owed`;
          showToast(`Found ${data.count} transactions! ${balanceMsg}`, 'success');
        } else {
          showToast(`Found ${data.count} transactions!`, 'success');
        }
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
        const { count, duplicatesSkipped, message } = await res.json();
        showToast(message || `Imported ${count} transactions from PDF!`, 'success');
        await Promise.all([
          fetchTransactions(userId),
          fetchSnapshot(userId),
        ]);
        cancelPdfImport();
        // Switch to analytics tab to see the results
        setActiveTab('analytics');
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
                    animation: scaleIn 0.5s ease-out;
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
        <div className="header-section" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Transactions
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            Import, manage, and analyze your spending
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'manage' ? '#76B89F' : '#6b7280',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'manage' ? '3px solid #76B89F' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'analytics' ? '#76B89F' : '#6b7280',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'analytics' ? '3px solid #76B89F' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'history' ? '#76B89F' : '#6b7280',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'history' ? '3px solid #76B89F' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Transaction History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <>
            {/* Period Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                { key: '7days', label: 'Last 7 Days' },
                { key: '30days', label: 'Last 30 Days' },
                { key: '90days', label: 'Last 90 Days' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setViewPeriod(period.key as '7days' | '30days' | '90days')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: viewPeriod === period.key ? '#76B89F' : '#e5e7eb',
                    color: viewPeriod === period.key ? 'white' : '#374151',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Empty State for Analytics */}
            {transactions.length === 0 ? (
              <div className="card-animate" style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                    No Transactions Yet
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                    Import your transactions to see spending analytics and insights
                  </p>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="btn-primary"
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      background: '#76B89F',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Go to Import & Manage
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Spending Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Balance/Available Funds */}
          <div className="stat-card" style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💵</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {statementBalance !== null ? 'Statement Balance' : 'Available Balance'}
              </span>
            </div>
            <p style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: (statementBalance !== null ? statementBalance : snapshot?.balance ?? 0) >= 0 ? '#111827' : '#ef4444', 
              margin: 0 
            }}>
              ${statementBalance !== null 
                ? Math.abs(statementBalance).toFixed(2) 
                : (snapshot?.balance ? snapshot.balance.toFixed(2) : '0.00')}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {statementBalance !== null 
                ? (statementBalance >= 0 ? 'credit/available' : 'amount owed')
                : (snapshot?.balance >= 0 ? 'remaining funds' : 'overspent')}
            </p>
          </div>

          {/* Total Spending */}
          <div className="stat-card" style={{ ...cardStyle, marginBottom: 0 }}>
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
          <div className="stat-card" style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Daily Average</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              ${spendingAnalytics.avgDaily.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              over {spendingAnalytics.daysBack} days
            </p>
          </div>

          {/* Transaction Count */}
          <div className="stat-card" style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🧾</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Transactions</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              {spendingAnalytics.transactionCount}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {spendingAnalytics.categoryTotals.length} categories
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {spendingAnalytics.categoryTotals.length > 0 && (
          <div className="card-animate" style={cardStyle}>
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
                        className="progress-bar"
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

        {/* Top Expenses and Balance Graph */}
        {spendingAnalytics.topExpenses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Top Expenses */}
            <div className="card-animate" style={cardStyle}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔥 Top Expenses
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {spendingAnalytics.topExpenses.map((tx, i) => (
                  <div className="income-item" key={tx.id} style={{
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

            {/* Balance Over Time Graph */}
            <BalanceGraph 
              transactions={transactions} 
              viewPeriod={viewPeriod}
              initialBalance={statementBalance !== null ? statementBalance : (snapshot?.balance || 0)}
            />
          </div>
        )}
              </>
            )}
          </>
        )}

        {/* Import & Manage Tab */}
        {activeTab === 'manage' && (
          <>
        <div className="card-animate" style={cardStyle}>
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
                    className="btn-primary"
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
                    className="btn-secondary"
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
        <div className="card-animate" style={cardStyle}>
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
                    className="btn-primary"
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
                    className="btn-secondary"
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
        <div className="card-animate" style={cardStyle}>
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
          </>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="card-animate" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                All Transactions ({transactions.length})
              </h2>
              {transactions.length > 0 && (
                <button
                  onClick={clearAllTransactions}
                  className="btn-secondary"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  No Transaction History
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                  Import transactions to see your complete history here
                </p>
                <button
                  onClick={() => setActiveTab('manage')}
                  className="btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    background: '#76B89F',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Go to Import
                </button>
              </div>
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
                      <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 500, color: '#6b7280' }}>Actions</th>
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
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="btn-secondary"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              borderRadius: '0.375rem',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                            title="Delete transaction"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
