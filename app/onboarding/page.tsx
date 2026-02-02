"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { OnboardingData, FixedCosts, VariableBudgets } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { format } from "date-fns";

const STEPS = [
  'Basics',
  'Funding',
  'Fixed Costs',
  'Variable Budgets',
  'Planned Items',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Basics
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [disbursementDate, setDisbursementDate] = useState('');
  const [startingBalance, setStartingBalance] = useState('');

  // Step 2: Funding
  const [grants, setGrants] = useState('');
  const [loans, setLoans] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Step 3: Fixed Costs
  const [rent, setRent] = useState('');
  const [utilities, setUtilities] = useState('');
  const [subscriptions, setSubscriptions] = useState('');
  const [transportation, setTransportation] = useState('');

  // Step 4: Variable Budgets
  const [groceries, setGroceries] = useState('');
  const [dining, setDining] = useState('');
  const [entertainment, setEntertainment] = useState('');
  const [misc, setMisc] = useState('');

  // Step 5: Planned Items
  const [plannedItems, setPlannedItems] = useState<Array<{
    name: string;
    date: string;
    amount: string;
    category: string;
  }>>([]);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const res = await fetch('/api/user');
    const { user } = await res.json();
    setUserId(user.id);
  }

  function addPlannedItem() {
    setPlannedItems([...plannedItems, { name: '', date: '', amount: '', category: CATEGORIES.MISC }]);
  }

  function removePlannedItem(index: number) {
    setPlannedItems(plannedItems.filter((_, i) => i !== index));
  }

  function updatePlannedItem(index: number, field: string, value: string) {
    const updated = [...plannedItems];
    updated[index] = { ...updated[index], [field]: value };
    setPlannedItems(updated);
  }

  function canProceed() {
    if (currentStep === 0) {
      return startDate && endDate && disbursementDate && startingBalance;
    }
    if (currentStep === 1) {
      return grants && loans && monthlyIncome;
    }
    if (currentStep === 2) {
      return rent && utilities && subscriptions && transportation;
    }
    if (currentStep === 3) {
      return groceries && dining && entertainment && misc;
    }
    return true;
  }

  async function handleSubmit() {
    if (!userId) return;

    try {
      setLoading(true);

      const data: OnboardingData = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        disbursementDate: new Date(disbursementDate),
        startingBalance: parseFloat(startingBalance),
        grants: parseFloat(grants),
        loans: parseFloat(loans),
        monthlyIncome: parseFloat(monthlyIncome),
        fixedCosts: {
          rent: parseFloat(rent),
          utilities: parseFloat(utilities),
          subscriptions: parseFloat(subscriptions),
          transportation: parseFloat(transportation),
        },
        variableBudgets: {
          groceries: parseFloat(groceries),
          dining: parseFloat(dining),
          entertainment: parseFloat(entertainment),
          misc: parseFloat(misc),
        },
        plannedItems: plannedItems
          .filter(item => item.name && item.date && item.amount)
          .map(item => ({
            name: item.name,
            date: new Date(item.date),
            amount: parseFloat(item.amount),
            category: item.category as any,
          })),
      };

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      if (res.ok) {
        showToast('Plan created successfully!', 'success');
        router.push('/');
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">Welcome to MyFO</h1>
          <p className="mt-2 text-sm text-muted">
            Let's set up your semester budget plan in {STEPS.length} simple steps
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  index <= currentStep
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 text-muted'
                }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block h-0.5 w-12 lg:w-20 ${
                    index < currentStep ? 'bg-accent' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <h2 className="text-xl font-medium text-foreground mb-6">
            Step {currentStep + 1}: {STEPS[currentStep]}
          </h2>

          {/* Step 1: Basics */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Input
                type="date"
                label="Semester Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="Semester End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Input
                type="date"
                label="Disbursement/Refund Date"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
              />
              <Input
                type="number"
                label="Starting Balance on Disbursement Date ($)"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="2000"
              />
            </div>
          )}

          {/* Step 2: Funding */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Input
                type="number"
                label="Grants/Scholarships for Semester ($)"
                value={grants}
                onChange={(e) => setGrants(e.target.value)}
                placeholder="3500"
              />
              <Input
                type="number"
                label="Loans Accepted for Semester ($)"
                value={loans}
                onChange={(e) => setLoans(e.target.value)}
                placeholder="2500"
              />
              <Input
                type="number"
                label="Monthly Income (Work Study / Part-Time) ($)"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="600"
              />
            </div>
          )}

          {/* Step 3: Fixed Costs */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted mb-4">Enter your monthly fixed costs</p>
              <Input
                type="number"
                label="Rent (Monthly, $)"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                placeholder="800"
              />
              <Input
                type="number"
                label="Utilities (Monthly, $)"
                value={utilities}
                onChange={(e) => setUtilities(e.target.value)}
                placeholder="150"
              />
              <Input
                type="number"
                label="Subscriptions (Monthly, $)"
                value={subscriptions}
                onChange={(e) => setSubscriptions(e.target.value)}
                placeholder="50"
              />
              <Input
                type="number"
                label="Transportation (Monthly, $)"
                value={transportation}
                onChange={(e) => setTransportation(e.target.value)}
                placeholder="100"
              />
            </div>
          )}

          {/* Step 4: Variable Budgets */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted mb-4">Set your weekly variable budgets</p>
              <Input
                type="number"
                label="Groceries (Weekly, $)"
                value={groceries}
                onChange={(e) => setGroceries(e.target.value)}
                placeholder="80"
              />
              <Input
                type="number"
                label="Dining Out (Weekly, $)"
                value={dining}
                onChange={(e) => setDining(e.target.value)}
                placeholder="50"
              />
              <Input
                type="number"
                label="Entertainment (Weekly, $)"
                value={entertainment}
                onChange={(e) => setEntertainment(e.target.value)}
                placeholder="40"
              />
              <Input
                type="number"
                label="Miscellaneous (Weekly, $)"
                value={misc}
                onChange={(e) => setMisc(e.target.value)}
                placeholder="30"
              />
            </div>
          )}

          {/* Step 5: Planned Items */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted mb-4">
                Add any big planned purchases or trips (optional, 0-5 items)
              </p>
              {plannedItems.map((item, index) => (
                <Card key={index} className="bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">Item {index + 1}</h4>
                      <button
                        onClick={() => removePlannedItem(index)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      label="Name"
                      value={item.name}
                      onChange={(e) => updatePlannedItem(index, 'name', e.target.value)}
                      placeholder="Spring break trip"
                    />
                    <Input
                      type="date"
                      label="Date"
                      value={item.date}
                      onChange={(e) => updatePlannedItem(index, 'date', e.target.value)}
                    />
                    <Input
                      type="number"
                      label="Amount ($)"
                      value={item.amount}
                      onChange={(e) => updatePlannedItem(index, 'amount', e.target.value)}
                      placeholder="400"
                    />
                    <Select
                      label="Category"
                      value={item.category}
                      onChange={(e) => updatePlannedItem(index, 'category', e.target.value)}
                      options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </div>
                </Card>
              ))}
              {plannedItems.length < 5 && (
                <Button variant="secondary" onClick={addPlannedItem} className="w-full">
                  + Add Planned Item
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              ← Back
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Next →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
              >
                {loading ? 'Creating...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
