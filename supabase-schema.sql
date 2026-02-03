-- ============================================
-- MyFO Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Paste this → Run
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (simple auth for hackathon)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID, -- Optional, can be null for simple auth
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Plain text for hackathon simplicity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLANS TABLE (Semester budget configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  disbursement_date DATE NOT NULL,
  
  -- Starting balance
  starting_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Funding sources
  grants DECIMAL(12,2) DEFAULT 0,
  loans DECIMAL(12,2) DEFAULT 0,
  work_study_monthly DECIMAL(12,2) DEFAULT 0,
  other_income_monthly DECIMAL(12,2) DEFAULT 0,
  
  -- Fixed costs (stored as JSONB for flexibility)
  fixed_costs JSONB DEFAULT '{"rent": 0, "utilities": 0, "subscriptions": 0, "transportation": 0}',
  
  -- Variable budgets (weekly)
  variable_budgets JSONB DEFAULT '{"groceries": 0, "dining": 0, "entertainment": 0, "misc": 0}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL, -- Positive = expense, Negative = income
  category TEXT NOT NULL,
  merchant_guess TEXT,
  source TEXT DEFAULT 'manual', -- 'csv', 'manual', 'plaid'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- ============================================
-- PLANNED ITEMS TABLE (upcoming expenses)
-- ============================================
CREATE TABLE IF NOT EXISTS planned_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_items_user_date ON planned_items(user_id, date);

-- ============================================
-- FAFSA CHECKLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fafsa_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  create_fsa_id BOOLEAN DEFAULT FALSE,
  gather_tax_docs BOOLEAN DEFAULT FALSE,
  list_schools BOOLEAN DEFAULT FALSE,
  submit_fafsa BOOLEAN DEFAULT FALSE,
  verification BOOLEAN DEFAULT FALSE,
  review_award BOOLEAN DEFAULT FALSE,
  accept_aid BOOLEAN DEFAULT FALSE,
  mark_calendar BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INCOME SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('job', 'scholarship', 'grant', 'loan', 'family', 'work_study', 'other')),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('one_time', 'monthly', 'biweekly', 'weekly', 'semester')),
  start_date DATE,
  end_date DATE,
  is_loan BOOLEAN DEFAULT FALSE,
  interest_rate DECIMAL(5,2),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_sources_user ON income_sources(user_id);

-- ============================================
-- EMERGENCY FUND TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_fund (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  target_amount DECIMAL(12,2) DEFAULT 500,
  current_amount DECIMAL(12,2) DEFAULT 0,
  weekly_contribution DECIMAL(12,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (Important!)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fafsa_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_fund ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (no auth enforcement)
-- This is for development - you can add auth policies later
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for plans" ON plans FOR ALL USING (true);
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all for planned_items" ON planned_items FOR ALL USING (true);
CREATE POLICY "Allow all for fafsa_checklist" ON fafsa_checklist FOR ALL USING (true);
CREATE POLICY "Allow all for income_sources" ON income_sources FOR ALL USING (true);
CREATE POLICY "Allow all for emergency_fund" ON emergency_fund FOR ALL USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fafsa_checklist_updated_at BEFORE UPDATE ON fafsa_checklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER emergency_fund_updated_at BEFORE UPDATE ON emergency_fund
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
