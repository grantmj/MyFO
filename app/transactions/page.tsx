"use client";

import { useEffect, useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_LABELS, Category } from "@/lib/constants";
import { format } from "date-fns";
import Papa from "papaparse";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  source: string;
}

export default function TransactionsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Transactions
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            Import and manage your spending
          </p>
        </div>

        {/* PDF Import Section */}
        <Card className="mb-4">
          <h2 className="text-base font-medium text-foreground mb-2">Import from PDF</h2>
          <p className="text-xs text-muted mb-3">
            Upload a credit card statement PDF - we&apos;ll automatically extract and categorize transactions using AI.
          </p>
          
          <div className="space-y-3">
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfSelect}
              disabled={pdfParsing}
              className="block w-full text-xs text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent file:text-white hover:file:bg-accent/90 disabled:opacity-50"
            />

            {pdfParsing && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                <span>Parsing PDF and extracting transactions...</span>
              </div>
            )}

            {showPdfPreview && !pdfParsing && (
              <div className="pt-3 border-t border-border">
                <h3 className="text-xs font-medium text-foreground mb-3">
                  Found {editableTransactions.length} transactions - Review and confirm
                </h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto border border-border rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted">Date</th>
                        <th className="text-left py-2 px-2 font-medium text-muted">Description</th>
                        <th className="text-left py-2 px-2 font-medium text-muted">Amount</th>
                        <th className="text-left py-2 px-2 font-medium text-muted">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableTransactions.map((transaction, index) => (
                        <tr key={index} className="border-b border-border last:border-0">
                          <td className="py-2 px-2 text-foreground whitespace-nowrap">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-2 px-2 text-foreground">
                            {transaction.description}
                          </td>
                          <td className="py-2 px-2 text-foreground font-medium">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={transaction.category}
                              onChange={(e) => updateParsedCategory(index, e.target.value)}
                              className="text-xs border border-border rounded px-2 py-1 text-foreground bg-white focus:outline-none focus:ring-1 focus:ring-accent"
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
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    onClick={confirmPdfImport}
                    disabled={uploading}
                  >
                    {uploading ? 'Importing...' : `Import ${editableTransactions.length} Transactions`}
                  </Button>
                  <Button variant="ghost" onClick={cancelPdfImport}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* CSV Import Section */}
        <Card className="mb-4">
          <h2 className="text-base font-medium text-foreground mb-2">Import from CSV</h2>
          <p className="text-xs text-muted mb-3">
            Upload a CSV file from your bank. Should include Date, Description, and Amount columns.
          </p>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-xs text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent file:text-white hover:file:bg-accent/90"
            />

            {showColumnMapper && (
              <div className="pt-3 border-t border-border">
                <h3 className="text-xs font-medium text-foreground mb-2">Map CSV Columns</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="mt-2">
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
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => processCSV(csvData, dateColumn, descColumn, amountColumn)}
                    disabled={!dateColumn || !descColumn || !amountColumn || uploading}
                  >
                    {uploading ? 'Importing...' : 'Import Transactions'}
                  </Button>
                  <Button variant="ghost" onClick={resetCSVState}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Bank/Credit Card Linking Section */}
        <Card className="mb-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 className="text-base font-medium text-foreground mb-1">Connect Your Accounts</h2>
              <p className="text-xs text-muted">Link your bank or credit card for automatic transaction imports</p>
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
              Connecting accounts enables <strong>auto-categorization</strong> and <strong>real-time budget tracking</strong>
            </p>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card>
          <h2 className="text-base font-medium text-foreground mb-3">
            All Transactions ({transactions.length})
          </h2>

          {transactions.length === 0 ? (
            <p className="text-sm text-muted">No transactions yet. Import your bank CSV to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-muted">Description</th>
                    <th className="text-left py-3 px-2 font-medium text-muted">Amount</th>
                    <th className="text-left py-3 px-2 font-medium text-muted">Category</th>
                    <th className="text-left py-3 px-2 font-medium text-muted">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-foreground whitespace-nowrap">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-2 text-foreground">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-2 text-foreground font-medium">
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={transaction.category}
                          onChange={(e) => updateTransactionCategory(transaction.id, e.target.value)}
                          className="text-xs border border-border rounded px-2 py-1 text-foreground bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2 text-muted text-xs">
                        {transaction.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
