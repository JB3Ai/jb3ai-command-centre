# BRAVEHEART v2 data flow

## Goal

Move reviewed creditor/legal/finance data into Supabase so the Command Centre dashboard reads a clean, normalized backend rather than old seed data or raw Gmail extraction.

## Source-of-truth flow

Google Sheet V2.3 reconciliation
→ approved import payload
→ Supabase BRAVEHEART v2 tables
→ dashboard views
→ Command Centre UI

Raw Gmail/SMS discovery data must not write directly to approved account records.

## Core tables

- `braveheart_creditors`
- `braveheart_accounts`
- `braveheart_contacts`
- `braveheart_balance_snapshots`
- `braveheart_communications`
- `braveheart_legal_matters`
- `braveheart_documents`
- `braveheart_reconciliation_queue`
- `braveheart_sync_runs`

## Dashboard views

### `braveheart_account_dashboard`
One row per account with current balance, arrears, stage, priority, waiting-on status, latest communication, and legal indicator.

### `braveheart_dashboard_summary`
Headline metrics:
- known exposure
- personal exposure
- business/IMED exposure
- critical accounts
- waiting on us
- waiting on creditor/handler
- unresolved reconciliation items

## Import rules

1. Exact account/reference is the strongest external identity key.
2. Creditor name alone must never merge two accounts.
3. Personal and IMED/business accounts remain separate even under the same creditor.
4. Accounts without a verified reference use a `temporary_key` and remain `REVIEW` until confirmed.
5. Each balance import creates a dated snapshot as well as updating the latest account balance.
6. Gmail/SMS messages are evidence/history, not authority for overwriting approved values.
7. `CONFLICT`, `REVIEW`, and `NO_EVIDENCE` items remain in the reconciliation queue.

## Security

The schema enables RLS for authenticated users. Server-side imports should use a secure service-role environment variable outside the client bundle. Never expose a service-role key through `VITE_*` variables.

## Old data

`hub_braveheart` and `002_seed_creditors.sql` are legacy. Do not use the old seed as the new source of truth. The new normalized tables can run alongside it during dashboard migration, then the old page can be switched to the v2 service once data has been imported and verified.
