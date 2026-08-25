# Subscriptions and Bank Zero Integration

This document explains the database schema and functionality for managing subscriptions and bank zero statements within the JB3AI Command Centre.

## Database Schema Overview

### Tables Created

#### 1. `subscriptions` Table
Manages subscription information for both outgoing expenses and incoming client payments.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier for each subscription
- `name` (TEXT): Subscription name (e.g., 'ChatGPT Plus', 'Client Retainer A')
- `direction` (TEXT): Either 'IN' for income or 'OUT' for expenses
- `status` (TEXT): Subscription status ('active', 'paused', 'cancelled', 'trial')
- `amount` (NUMERIC(10,2)): Monthly/annual subscription amount
- `currency` (TEXT): Currency code (default 'ZAR')
- `billing_cycle` (TEXT): Billing frequency ('monthly', 'annually', 'quarterly', etc.)
- `next_billing_date` (DATE): Next billing date
- `billing_email` (TEXT): Email address for billing notifications (default 'subscriptions@jonoblackburn.com')
- `vendor_url` (TEXT): URL to vendor/service website
- `category` (TEXT): Category for grouping subscriptions
- `notes` (TEXT): Additional notes about the subscription
- `created_at` & `updated_at` (TIMESTAMPTZ): Timestamps for record creation and updates

#### 2. `bankzero_statements` Table
Stores information about uploaded bank statements.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier for each statement
- `filename` (TEXT): Original filename of the uploaded statement
- `period_start` (DATE): Start date of the statement period
- `period_end` (DATE): End date of the statement period
- `uploaded_at` (TIMESTAMPTZ): When the statement was uploaded
- `raw_text` (TEXT): Raw text content from the statement
- `meta` (JSONB): Metadata about the statement

#### 3. `bank_transactions` Table
Stores individual transactions from bank statements with linking to subscriptions.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier for each transaction
- `statement_id` (UUID): References `bankzero_statements.id`
- `transaction_date` (DATE): Date of the transaction
- `description` (TEXT): Transaction description
- `amount` (NUMERIC): Transaction amount
- `type` (TEXT): Either 'debit' or 'credit'
- `matched_subscription_id` (UUID): References `subscriptions.id` (nullable)
- `is_reconciled` (BOOLEAN): Whether transaction has been reconciled
- `created_at` & `updated_at` (TIMESTAMPTZ): Timestamps for record creation and updates

## Row Level Security (RLS)

All tables have Row Level Security enabled with policies allowing authenticated users full access to the data.

## Seed Data

The migration includes sample seed data for:
1. Standard SaaS subscriptions (Google Workspace, OpenAI, Midjourney, etc.)
2. Recurring client inflows (Client Retainer A, Consulting Project X, etc.)

## Usage Examples

### 1. Adding a New Subscription
```sql
INSERT INTO subscriptions (name, direction, status, amount, currency, billing_cycle, next_billing_date, vendor_url, category) 
VALUES ('New Service', 'OUT', 'active', 25.00, 'USD', 'monthly', CURRENT_DATE + INTERVAL '30 days', 'https://newservice.com', 'Software');
```

### 2. Uploading a Bank Statement
```sql
INSERT INTO bankzero_statements (filename, period_start, period_end, raw_text) 
VALUES ('bank_statement_q3.csv', '2023-07-01', '2023-09-30', 'Raw statement content...');
```

### 3. Matching Transactions to Subscriptions
```sql
UPDATE bank_transactions 
SET matched_subscription_id = 'subscription-uuid-here' 
WHERE id = 'transaction-uuid-here';
```

### 4. Finding Unreconciled Transactions
```sql
SELECT * FROM bank_transactions 
WHERE is_reconciled = false;
```

### 5. Viewing Subscription Status
```sql
SELECT name, direction, status, amount, next_billing_date 
FROM subscriptions 
WHERE status = 'active';
```

## Indexes for Performance

The migration creates several indexes for optimal query performance:
- `idx_subscriptions_direction`: For filtering by subscription direction
- `idx_subscriptions_status`: For filtering by subscription status
- `idx_subscriptions_next_billing_date`: For upcoming billing queries
- `idx_bank_transactions_statement_id`: For transaction lookups by statement
- `idx_bank_transactions_transaction_date`: For date-based queries
- `idx_bank_transactions_type`: For debit/credit filtering
- `idx_bank_transactions_matched_subscription_id`: For subscription matching
- `idx_bank_transactions_is_reconciled`: For reconciliation status queries

## Integration with Command Centre

This database structure supports the following features in the command centre:
1. **Subscription Dashboard**: View all subscriptions with status and upcoming billing dates
2. **Bank Statement Processing**: Upload and process bank statements
3. **Transaction Matching**: Automatically or manually match transactions to subscriptions
4. **Financial Reporting**: Generate reports on income/expenses and reconciliation status
5. **Reconciliation Workflow**: Track which transactions have been reconciled

## Migration Instructions

To apply this migration:
1. Ensure you're connected to your Supabase database
2. Run the migration file: `005_subscriptions_and_bankzero.sql`
3. The seed data will be automatically inserted
4. Verify the tables exist and contain the expected data

## Security Considerations

- All tables have RLS enabled to ensure only authenticated users can access data
- The seed data includes realistic sample subscriptions for testing
- Foreign key constraints ensure data integrity between tables