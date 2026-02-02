"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { BudgetSnapshot } from "@/lib/types";
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

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    try {
      // Get or create user
      const userRes = await fetch('/api/user');
      const { user } = await userRes.json();
      setUserId(user.id);

      // Check if user has a plan
      const planRes = await fetch(`/api/plan?userId=${user.id}`);
      const { plan } = await planRes.json();

      if (!plan) {
        // Redirect to onboarding
        router.push('/onboarding');
        return;
      }

      // Fetch budget snapshot
      const snapshotRes = await fetch(`/api/budget-snapshot?userId=${user.id}`);
      const { snapshot: budgetSnapshot } = await snapshotRes.json();
      setSnapshot(budgetSnapshot);

      // Fetch FAFSA checklist
      const fafsaRes = await fetch(`/api/fafsa-checklist?userId=${user.id}`);
      const { checklist } = await fafsaRes.json();
      setFafsaChecklist(checklist);

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
        // Reload page
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const statusColor = 
    snapshot.status === 'ahead' ? 'text-green-600' :
    snapshot.status === 'behind' ? 'text-red-600' :
    'text-blue-600';

  const statusText =
    snapshot.status === 'ahead' ? 'Ahead of Plan' :
    snapshot.status === 'behind' ? 'Behind Plan' :
    'On Track';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Your semester financial overview</p>
          </div>
          <Button variant="secondary" onClick={loadDemoData}>
            Load Demo Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
              Safe to Spend This Week
            </h3>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              ${snapshot.safeToSpendThisWeek.toFixed(0)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Based on remaining budget
            </p>
          </Card>

          <Card>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
              Runway Date
            </h3>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {snapshot.runwayDate 
                ? format(new Date(snapshot.runwayDate), 'MMM dd, yyyy')
                : 'Fully Funded'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {snapshot.runwayDate ? 'Funds run out' : 'Through semester end'}
            </p>
          </Card>

          <Card>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
              Budget Status
            </h3>
            <p className={`mt-2 text-2xl font-semibold ${statusColor}`}>
              {statusText}
            </p>
            <p className="mt-1 text-xs text-muted">
              ${Math.abs(snapshot.aheadBehind).toFixed(0)} {snapshot.aheadBehind >= 0 ? 'under' : 'over'}
            </p>
          </Card>

          <Card>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
              Remaining Funds
            </h3>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              ${snapshot.remainingFundsToday.toFixed(0)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Available today
            </p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Planned Items */}
          <Card>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Upcoming Planned Items
            </h3>
            {snapshot.plannedNext7Days.length > 0 ? (
              <div className="space-y-3">
                {snapshot.plannedNext7Days.map((item, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted">
                        {format(new Date(item.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      ${item.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No planned items in the next 7 days</p>
            )}
          </Card>

          {/* Top Spending Categories */}
          <Card>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Top Spending (Last 14 Days)
            </h3>
            {snapshot.topCategories.length > 0 ? (
              <div className="space-y-3">
                {snapshot.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                    <p className="text-sm font-medium text-foreground">
                      {CATEGORY_LABELS[cat.category]}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      ${cat.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No transactions yet</p>
            )}
          </Card>

          {/* Semester Progress */}
          <Card>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Semester Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted">Weeks Elapsed</p>
                  <p className="text-xs font-medium text-foreground">
                    {snapshot.weeksElapsed} / {snapshot.weeksTotal}
                  </p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all"
                    style={{ 
                      width: `${Math.min(100, (snapshot.weeksElapsed / snapshot.weeksTotal) * 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted">Expected Spend</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${snapshot.expectedSpendToDate.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Actual Spend</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${snapshot.actualSpendToDate.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* FAFSA Checklist */}
          <Card>
            <h3 className="text-lg font-medium text-foreground mb-4">
              FAFSA Readiness Checklist
            </h3>
            {fafsaChecklist && (
              <div className="space-y-2">
                {[
                  { key: 'createFsaId', label: 'Create FSA ID' },
                  { key: 'gatherTaxDocs', label: 'Gather tax documents' },
                  { key: 'listSchools', label: 'List schools to receive FAFSA' },
                  { key: 'submitFafsa', label: 'Submit FAFSA form' },
                  { key: 'verification', label: 'Complete verification (if needed)' },
                  { key: 'reviewAward', label: 'Review award letter' },
                  { key: 'acceptAid', label: 'Accept aid package' },
                  { key: 'markCalendar', label: 'Mark disbursement dates' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={fafsaChecklist[key as keyof FafsaChecklist]}
                      onChange={() => toggleFafsaItem(key as keyof FafsaChecklist)}
                      className="w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <a 
                href="https://studentaid.gov/h/apply-for-aid/fafsa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                Learn more about FAFSA →
              </a>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button variant="primary" href="/transactions">
            Import Transactions
          </Button>
          <Button variant="secondary" href="/assistant">
            Ask MyFO a Question
          </Button>
        </div>
      </div>
    </div>
  );
}
