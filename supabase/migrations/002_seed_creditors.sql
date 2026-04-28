-- ============================================================================
-- OS³ Command Centre — Seed: BRAVEHEART creditors (24 rows)
-- Project: uxeolplwhtyyefpmwktw  (eu-west-1)
-- File:    002_seed_creditors.sql
-- Date:    2026-04-26
-- Source:  PROJECTS/jb3ai-command-centre/../creditors-dashboard.html
--
-- Behaviour
--   • Wrapped in BEGIN…COMMIT — atomic.
--   • Idempotent: DELETEs the 24 target rows by account_ref (or by title where
--     account_ref is NULL) before INSERT, so the script can be re-run safely.
--     No other rows in hub_braveheart are touched.
--   • next_action_due is populated ONLY where the dashboard has an explicit
--     deadline date in the notes (rows 9, 15). NULL elsewhere.
--   • synced_at = now() — every row stamped with run-time, supports the
--     "Last sync dd/mm/26" UI pattern.
--
-- Sensitive data — sensitive
--   This file contains real account references, attorney contacts, and
--   amounts owed. SQL only — never paste into chat memory or commit logs.
--   The .gitignore already covers .env.local but this migration WILL be
--   committed (it's how we replay state). Treat the GitHub repo accordingly
--   (private repo `jb3ai-os3`).
--
-- Sanity check (run after applying):
--   select count(*) from hub_braveheart where account_ref is not null
--      or title in ('Business Partners','SA Health');
--   -- expect: 24
--
--   select sum(amount_zar)::numeric(14,2) from hub_braveheart
--    where amount_zar is not null;
--   -- expect ≈ 1,953,177.26  (15 of 24 rows have known amounts)
--   -- Dashboard headline "Known Exposure: R 2,151,054+" includes
--   -- rough estimates for some TBC rows that we are NOT recording numerically.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Idempotency: clear only the 24 target rows first
-- ---------------------------------------------------------------------------
delete from public.hub_braveheart
 where account_ref in (
   '26840670001',
   'Fio Real Estate',
   'HH00124',
   'STACES/118224',
   '082074960004',
   'TPT1257',
   'B0270489 · Ref HP10596635',
   '85353512047',
   '4103-7500-7434-9067',
   '85316812377',
   '85358285532',
   '62473423417',
   '479026 ···· 9000',
   'BLA00386',
   'CB1340899 · 02250',
   '3001245142',
   '7000100100087412029',
   '4-000-072-262-837',
   '4-000-521-325-083',
   '6007851105876094',
   '4123590017',
   'Suzelle Benadé'
 )
 or (account_ref is null and title in ('Business Partners', 'SA Health'));

-- ---------------------------------------------------------------------------
-- Insert 24 rows
-- Column order:
--   title, creditor, account_ref, status,
--   priority, response_status, on_credit_record, imed_status,
--   action_status, attorney_name, attorney_meta,
--   amount_zar, next_action_due, notes,
--   synced_at, updated_at
-- ---------------------------------------------------------------------------
insert into public.hub_braveheart (
  title, creditor, account_ref, status,
  priority, response_status, on_credit_record, imed_status,
  action_status, attorney_name, attorney_meta,
  amount_zar, next_action_due, notes,
  synced_at, updated_at
) values

-- ── 1 ── CRITICAL ─────────────────────────────────────────────────────────
('MFC (Nedbank) — Haval H6', 'MFC (Nedbank)', '26840670001', 'Legal — Defend',
 'Critical', 'green', true, 'no',
 'Action Required', 'MFC / Nedbank', '{"contact":"Uplift permission needed"}'::jsonb,
 null, null,
 $note$URGENT THIS WEEK — write to MFC requesting permission for Jessica to uplift vehicle. Registered in Jono's name, in Jessica's possession. Act before MFC sends sheriff.$note$,
 now(), now()),

-- ── 2 ──
('Rent — 415B Olive Bee Eater', 'Rent', 'Fio Real Estate', 'Legal Proceedings',
 'Critical', 'red', false, 'no',
 'Urgent Action Required', 'Fio Real Estate', '{"contact":"Managing agents"}'::jsonb,
 null, null,
 $note$Rental arrears. Legal proceedings in progress. Not on personal credit record but must engage immediately.$note$,
 now(), now()),

-- ── 3 ──
('Wattage Metering — HH00124', 'Wattage Metering', 'HH00124', 'Arrears — Disconnected',
 'Critical', 'red', false, 'no',
 'Urgent Action Required', 'Wattage Metering', '{"contact":"Electricity provider"}'::jsonb,
 11300.85, null,
 $note$Disconnected since 10 Feb 2026. BF R10,835.68 + Feb 2026 charges = R11,300.85 due. Pay to reconnect.$note$,
 now(), now()),

-- ── 4 ── HIGH ─────────────────────────────────────────────────────────────
('Standard Bank — iStore BlueBean', 'Standard Bank', 'STACES/118224', 'Legal — Defend',
 'High', 'red', true, 'no',
 'Needs Investigation', 'Standard Bank Legal', '{"contact":"Internal"}'::jsonb,
 null, null,
 $note$Case STACES/118224. Obtain statement and full details before responding.$note$,
 now(), now()),

-- ── 5 ──
('Standard Bank Vehicle — IMED Bakkie', 'Standard Bank Vehicle', '082074960004', 'Litigation — Redirect & Defend',
 'High', 'green', false, 'yes',
 'Action Required', 'Lorraine Senekal', '{"contact":"SB Vehicle Finance"}'::jsonb,
 29607.24, null,
 $note$Send IMED liquidation docs to Lorraine Senekal at SB Vehicle Finance. Redirect liability to IMED (PTY) LTD in liquidation.$note$,
 now(), now()),

-- ── 6 ──
('Tomorrow''s People — School', 'Tomorrow''s People', 'TPT1257', 'Legal — Negotiate',
 'High', 'red', false, 'no',
 'Action Required', 'Blake & Associates', '{"contact":"Attorney"}'::jsonb,
 178094.20, null,
 $note$School fees dispute — children did not attend in 2025. Blake & Associates acting. Claim is disputed as fraudulent. Negotiate & defend.$note$,
 now(), now()),

-- ── 7 ──
('Vodacom — iMED (HP Attorneys)', 'Vodacom', 'B0270489 · Ref HP10596635', 'IMED — Redirect & Defend',
 'High', 'green', false, 'yes',
 'Action Required', 'HP Attorneys (HPM)', '{"contact":"hpattorneys@hpd.co.za"}'::jsonb,
 3069.00, null,
 $note$Ref HP10596635. R3,069.00 arrears. Sent to IMED address — IMED liability. Redirect to liquidator. Do NOT pay personally. Pay ref: ABSA 4085074161 if settled via IMED.$note$,
 now(), now()),

-- ── 8 ── (CRITICAL despite being mid-list — S129)
('WesBank — Mercedes GT53', 'WesBank', '85353512047', 'Section 129 — Surrender/Defend',
 'Critical', 'green', true, 'no',
 'Urgent Action Required', 'H&H Legal — Naj Berning', '{"contact":"naj@h-hlegal.co.za · 064 121 9877"}'::jsonb,
 66243.57, null,
 $note$S129 notice issued. Arrears R66,432 (3.02 months). Interest R187.30/day. Threatening s127 surrender or court order. Vehicle is DAMAGED — must respond urgently explaining damage/insurance. Do NOT surrender.$note$,
 now(), now()),

-- ── 9 ── (next_action_due — Due 11 May 2026 in notes)
('Woolworths — Credit Card', 'Woolworths', '4103-7500-7434-9067', 'Arrangement — Pay',
 'High', 'green', true, 'no',
 'Urgent Action Required', 'Blake & Associates', '{"contact":"Arrears: R23,049.87"}'::jsonb,
 153046.37, '2026-05-11',
 $note$Statement 16 Apr 2026. Due 11 May 2026. Arrears R23,049.87. Pay to: ABSA branch 632005 / acc 1600033251. Arrangement in place — send proof or plan breaks.$note$,
 now(), now()),

-- ── 10 ──
('WesBank — Mazda CX-3', 'WesBank', '85316812377', 'IMED Issued',
 'High', 'red', false, 'yes',
 'Awaiting Response', 'IMED Distributors', '{"contact":"WesBank Vehicle"}'::jsonb,
 null, null,
 $note$IMED issued. Vehicle in possession. Await creditor response to IMED notice.$note$,
 now(), now()),

-- ── 11 ──
('WesBank — Solar System (IMED)', 'WesBank', '85358285532', 'IMED Issued',
 'High', 'red', false, 'yes',
 'Awaiting Response', 'IMED Distributors', '{"contact":"Cust: 11092986933"}'::jsonb,
 819982.29, null,
 $note$Solar: Inverter, PV & LiFePO4. Orig cap R1,080,218.63. Outstanding R819,982.29. Contract bal R995,546.58. Monthly R23,818.49. Pay: FNB 54549006334 / br 255005.$note$,
 now(), now()),

-- ── 12 ──
('RMB — Overdraft (FNB)', 'RMB', '62473423417', 'Internal Collections',
 'High', 'red', true, 'no',
 'Awaiting Response', 'FNB Internal', '{"contact":"RMB Private Bank"}'::jsonb,
 188255.55, null,
 $note$RMB Private Bank overdraft. Balance -R188,255.55. FNB internal collections. Negotiate settlement.$note$,
 now(), now()),

-- ── 13 ──
('RMB — Credit Card (FNB)', 'RMB', '479026 ···· 9000', 'Internal Collections',
 'High', 'red', true, 'no',
 'Awaiting Response', 'FNB Internal', '{"contact":"RMB Private Bank"}'::jsonb,
 130571.33, null,
 $note$RMB Private Bank credit card. Balance -R130,571.33. FNB internal collections. Negotiate settlement.$note$,
 now(), now()),

-- ── 14 ── (account_ref intentionally NULL)
('Business Partners', 'Business Partners', null, 'IMED Noted',
 'High', 'red', false, 'yes',
 'Monitor', 'IMED Distributors', '{"contact":"Business liability"}'::jsonb,
 null, null,
 $note$IMED noted. Monitor for formal issue. Related to business liabilities of IMED.$note$,
 now(), now()),

-- ── 15 ── (next_action_due — 14 days from 16 Apr 2026 → 30 Apr 2026)
('Potgieter Louw Attorneys', 'Potgieter Louw Attorneys', 'BLA00386', 'Attorney Account — Payable',
 'High', 'green', false, 'no',
 'Payment Proposal Required', 'Potgieter Louw Attorneys', '{"contact":"Urgent App & Maintenance"}'::jsonb,
 29131.38, '2026-04-30',
 $note$Ref BLA00386. R29,131.38 due. Received 16 Apr 2026 — 14 days to pay before services cease. 2% interest/month. Payment proposal required urgently. Also need to send ID & proof of residence.$note$,
 now(), now()),

-- ── 16 ──
('Pretoria Chinese School (Ceebee DMS)', 'Pretoria Chinese School', 'CB1340899 · 02250', 'Disputed — Penalty Clause',
 'High', 'green', true, 'no',
 'Dispute Letter Required', 'Ceebee DMS', '{"contact":"collector104@ceebee.co.za"}'::jsonb,
 null, null,
 $note$Daughter's former school. Penalty for leaving due to financial hardship — disputed as unfair/unenforceable. Summons threatened by 28 Feb 2026 but gone quiet. Dispute proactively. Credit listing flagged in subject line.$note$,
 now(), now()),

-- ── 17 ── MEDIUM ──────────────────────────────────────────────────────────
('Discovery Bank', 'Discovery Bank', '3001245142', 'Collections — Negotiate',
 'Medium', 'red', true, 'no',
 'Pending Reply', 'MBD Attorneys', '{"contact":"Collections"}'::jsonb,
 64808.56, null,
 $note$MBD acting for Discovery. Negotiate settlement or payment arrangement. Awaiting reply.$note$,
 now(), now()),

-- ── 18 ──
('Edgars / Edcon', 'Edgars / Edcon', '7000100100087412029', 'Collections — Negotiate',
 'Medium', 'red', true, 'no',
 'Pending Reply', 'Edcon Collections', '{"contact":"Internal"}'::jsonb,
 null, null,
 $note$Edgars account in collections. Negotiate arrangement. Awaiting response.$note$,
 now(), now()),

-- ── 19 ──
('FNB — Daly Attorneys (Loan)', 'FNB', '4-000-072-262-837', 'IMED — Redirect & Defend',
 'Medium', 'green', false, 'yes',
 'Action Required', 'IMED Distributors', '{"contact":"via Daly Attorneys"}'::jsonb,
 85601.60, null,
 $note$IMED liability — send liquidation docs to Daly Attorneys. Redirect claim to IMED (PTY) LTD liquidator. Obtain full statement of account.$note$,
 now(), now()),

-- ── 20 ──
('FNB — Internal Collections (Loan)', 'FNB', '4-000-521-325-083', 'Collections — Negotiate',
 'Medium', 'red', true, 'no',
 'Awaiting Info', 'FNB Internal', '{"contact":"Collections dept"}'::jsonb,
 188618.48, null,
 $note$FNB personal loan in internal collections. Obtain statement then negotiate arrangement.$note$,
 now(), now()),

-- ── 21 ──
('Woolworths — Personal Loan', 'Woolworths', '6007851105876094', 'Review — Negotiate',
 'Medium', 'red', true, 'no',
 'Pending Reply', 'Blake & Associates', '{"contact":"Attorney"}'::jsonb,
 null, null,
 $note$Woolworths personal loan. Separate from credit card account. Blake & Associates acting. Awaiting reply.$note$,
 now(), now()),

-- ── 22 ── (account_ref intentionally NULL; small was empty — meta is empty jsonb)
('SA Health', 'SA Health', null, 'IMED Noted',
 'Medium', 'red', false, 'yes',
 'Monitor', 'IMED Distributors', '{}'::jsonb,
 null, null,
 $note$SA Health account — IMED noted. Monitor for formal issue.$note$,
 now(), now()),

-- ── 23 ──
('Google Ads / ACM', 'Google Ads / ACM', '4123590017', 'IMED — Redirect & Defend',
 'Medium', 'green', false, 'yes',
 'Action Required', 'Access Credit Management Ltd', '{"contact":"collect@accesscm.co.uk"}'::jsonb,
 698.44, null,
 $note$Google Ads underpayment — IMED account. Collected by ACM (UK). R698.44. Redirect to IMED liquidator. Send liquidation holding letter once liquidator confirmed (today's setdown 20 Apr 2026).$note$,
 now(), now()),

-- ── 24 ──
('Tomorrow''s People — Therapy', 'Tomorrow''s People', 'Suzelle Benadé', 'Open Account',
 'Medium', 'red', false, 'no',
 'Awaiting Response', 'Suzelle Benadé', '{"contact":"Therapist"}'::jsonb,
 4148.40, null,
 $note$Therapy account with Suzelle Benadé. R4,148.40 outstanding. Not on credit record. Separate from school fees (Blake & Associates).$note$,
 now(), now());

commit;

-- ============================================================================
-- DONE. Next: 003_seed_integrations.sql for hub_sync_status (CONFIG dashboard).
-- ============================================================================
