import { supabase } from './supabase'

export type BraveheartPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type BraveheartEntity = 'Personal' | 'IMED' | 'Business' | 'Unknown'
export type BraveheartWaitingOn = 'US' | 'CREDITOR' | 'HANDLER' | 'UNKNOWN'
export type BraveheartReconciliationStatus = 'CONFIRMED' | 'REVIEW' | 'CONFLICT' | 'NO_EVIDENCE'
export type BraveheartConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type BraveheartDashboardAccount = {
  account_id: string
  creditor: string
  creditor_group?: string | null
  entity_type: BraveheartEntity
  product_type?: string | null
  account_ref?: string | null
  latest_balance?: number | null
  arrears?: number | null
  amount_due?: number | null
  instalment?: number | null
  stage?: string | null
  priority?: BraveheartPriority | null
  waiting_on?: BraveheartWaitingOn | null
  next_action?: string | null
  next_action_due?: string | null
  on_credit_report?: boolean | null
  reconciliation_status?: BraveheartReconciliationStatus | null
  confidence?: BraveheartConfidence | null
  last_verified_at?: string | null
  last_communication_at?: string | null
  has_open_legal_matter?: boolean | null
}

export type BraveheartDashboardSummary = {
  account_count: number
  total_known_exposure: number
  personal_exposure: number
  business_exposure: number
  critical_count: number
  waiting_on_us_count: number
  waiting_on_external_count: number
  unresolved_reconciliation_count: number
}

export async function getBraveheartAccounts() {
  return supabase
    .from('braveheart_account_dashboard')
    .select('*')
    .order('priority', { ascending: true, nullsFirst: false })
    .order('latest_balance', { ascending: false, nullsFirst: false })
}

export async function getBraveheartSummary() {
  return supabase
    .from('braveheart_dashboard_summary')
    .select('*')
    .single()
}

export async function getBraveheartCommunications(accountId: string) {
  return supabase
    .from('braveheart_communications')
    .select('*')
    .eq('account_id', accountId)
    .order('occurred_at', { ascending: false })
}

export async function getBraveheartLegalMatters(accountId: string) {
  return supabase
    .from('braveheart_legal_matters')
    .select('*')
    .eq('account_id', accountId)
    .order('deadline', { ascending: true, nullsFirst: false })
}

export async function getBraveheartDocuments(accountId: string) {
  return supabase
    .from('braveheart_documents')
    .select('*')
    .eq('account_id', accountId)
    .order('document_date', { ascending: false, nullsFirst: false })
}

export async function getBraveheartReconciliationQueue() {
  return supabase
    .from('braveheart_reconciliation_queue')
    .select('*')
    .neq('status', 'RESOLVED')
    .order('severity', { ascending: true })
    .order('created_at', { ascending: false })
}
