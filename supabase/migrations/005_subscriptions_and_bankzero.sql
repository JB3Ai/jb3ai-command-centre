-- Migration: subscriptions_and_bankzero
-- Description: Create tables for subscriptions management and bank zero statements processing

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('IN', 'OUT')),
    status TEXT CHECK (status IN ('active', 'paused', 'cancelled', 'trial')),
    amount NUMERIC(10,2),
    currency TEXT DEFAULT 'ZAR',
    billing_cycle TEXT,
    next_billing_date DATE,
    billing_email TEXT DEFAULT 'subscriptions@jonoblackburn.com',
    vendor_url TEXT,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bankzero_statements
CREATE TABLE IF NOT EXISTS bankzero_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    raw_text TEXT,
    meta JSONB
);

-- Table: bank_transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID REFERENCES bankzero_statements(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type TEXT CHECK (type IN ('debit', 'credit')) NOT NULL,
    matched_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access subscriptions" ON subscriptions
    FOR ALL TO authenticated USING (true);

-- Row Level Security (RLS) for bankzero_statements
ALTER TABLE bankzero_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access bankzero statements" ON bankzero_statements
    FOR ALL TO authenticated USING (true);

-- Row Level Security (RLS) for bank_transactions
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access bank transactions" ON bank_transactions
    FOR ALL TO authenticated USING (true);

-- Sample seed data for standard SaaS subscriptions
INSERT INTO subscriptions (name, direction, status, amount, currency, billing_cycle, next_billing_date, vendor_url, category) VALUES
('ChatGPT Plus', 'OUT', 'active', 20.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://chat.openai.com', 'Software'),
('Google Workspace', 'OUT', 'active', 12.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://workspace.google.com', 'Software'),
('Midjourney', 'OUT', 'active', 10.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://www.midjourney.com', 'Software'),
('Vercel', 'OUT', 'active', 20.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://vercel.com', 'Hosting'),
('OpenAI', 'OUT', 'active', 30.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://platform.openai.com', 'AI Services'),
('Notion', 'OUT', 'active', 10.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://www.notion.so', 'Productivity'),
('Linear', 'OUT', 'active', 15.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://linear.app', 'Development'),
('Figma', 'OUT', 'active', 12.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://figma.com', 'Design'),
('Slack', 'OUT', 'active', 12.50, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://slack.com', 'Communication'),
('GitHub Pro', 'OUT', 'active', 4.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://github.com', 'Development');

-- Sample seed data for recurring client inflows
INSERT INTO subscriptions (name, direction, status, amount, currency, billing_cycle, next_billing_date, category) VALUES
('Client Retainer A', 'IN', 'active', 5000.00, 'ZAR', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'Client Inflow'),
('Client Retainer B', 'IN', 'active', 3500.00, 'ZAR', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'Client Inflow'),
('Consulting Project X', 'IN', 'active', 15000.00, 'ZAR', 'quarterly', CURRENT_DATE + INTERVAL '90 days', 'Client Inflow'),
('Freelance Contract Y', 'IN', 'active', 2500.00, 'ZAR', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'Client Inflow'),
('Project Z Payment', 'IN', 'active', 8000.00, 'ZAR', 'one-time', CURRENT_DATE + INTERVAL '15 days', 'Client Inflow');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_direction ON subscriptions(direction);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_statement_id ON bank_transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(type);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched_subscription_id ON bank_transactions(matched_subscription_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_is_reconciled ON bank_transactions(is_reconciled);