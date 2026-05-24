# OS³ Command Centre — Operator scripts

Local-only utilities. Not deployed; not part of the React build.

## braveheart_catalog.py

Catalogs every legal document in `C:\Users\jono\OneDrive\BACKUP AND MASTER COPIES\BRAVEHEART` into the `hub_braveheart_documents` Supabase table. Metadata only — content stays on disk. Idempotent (deduplicates on sha256 of file content).

### One-time setup

1. Apply migration `supabase/migrations/004_braveheart_documents.sql` in the Supabase SQL Editor.
2. Install deps:

   ```powershell
   pip install supabase pypdf python-docx python-dotenv --break-system-packages
   ```

3. Create `scripts\.env` from `.env.example` and paste your Supabase `service_role` key.

### Manual run

```powershell
cd "C:\Apps in Dev Visual Code Folder\Claude Working Folder\PROJECTS\jb3ai-command-centre\scripts"
python braveheart_catalog.py
```

Expected output (no PII):
```
BRAVEHEART catalog complete
  Folder:            C:\Users\jono\OneDrive\BACKUP AND MASTER COPIES\BRAVEHEART
  Files scanned:     42
  Already cataloged: 35
  New rows inserted: 7
  New by type:
    letter       3
    summons      2
    notice       1
    unknown      1
```

### Daily auto-run (Windows Task Scheduler)

Run this once in an **elevated** PowerShell:

```powershell
schtasks /create /sc daily /st 02:00 /tn "BRAVEHEART Catalog" `
  /tr "python `"C:\Apps in Dev Visual Code Folder\Claude Working Folder\PROJECTS\jb3ai-command-centre\scripts\braveheart_catalog.py`"" `
  /rl HIGHEST /f
```

Verify it's scheduled:

```powershell
schtasks /query /tn "BRAVEHEART Catalog"
```

Run on demand:

```powershell
schtasks /run /tn "BRAVEHEART Catalog"
```

Remove later if you want:

```powershell
schtasks /delete /tn "BRAVEHEART Catalog" /f
```

### What gets extracted from filenames

The script tries to auto-fill these fields from the filename alone (no body text extraction):

| Field | Heuristic | Examples |
|-------|-----------|----------|
| `doc_type` | Keyword match | `summons`, `motion`, `judgment`, `demand`, `notice`, `response`, `letter`, `statement`, `invoice`, `affidavit`, `agreement` |
| `doc_date` | Regex patterns | `Feb2026`, `2026-02-01`, `February 2026`, falls back to file modified date |
| `creditor_hint` | Known token match | `FNB`, `Absa`, `Capitec`, `Standard Bank`, `Nedbank`, `RMB`, `BankZero`, `Investec`, `Discovery Bank`, `Debtbusters`, `ConstellationRMS`, `FusionCS`, `SARS`, etc. |
| `page_count` | `pypdf.PdfReader` | PDFs only |
| `file_hash` | sha256 of content | Used for dedup |

To add more creditor tokens, edit `CREDITOR_TOKENS` near the top of the script.

### Linking documents to creditors

`braveheart_id` is nullable. After cataloging, link rows to their matching creditor in `hub_braveheart` via SQL or (next phase) a UI dropdown in `/braveheart`.

### Safety

- The script never prints filenames, sender info, or document content.
- All writes go directly to Supabase via the service-role key.
- The `.env` file is gitignored (verify via `git check-ignore scripts/.env`).
