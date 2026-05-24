"""
BRAVEHEART document catalog
============================
Scans C:\\Users\\jono\\OneDrive\\BACKUP AND MASTER COPIES\\BRAVEHEART recursively,
hashes each file, extracts filename metadata, upserts to hub_braveheart_documents
in Supabase.

PII NEVER prints to stdout. Output is only counts + doc_type breakdown.

Setup (one time):
    pip install supabase pypdf python-docx python-dotenv --break-system-packages

Configure (.env in this folder OR system env vars):
    SUPABASE_URL=https://uxeolplwhtyyefpmwktw.supabase.co
    SUPABASE_SERVICE_KEY=<service_role_key>
    BRAVEHEART_FOLDER=C:\\Users\\jono\\OneDrive\\BACKUP AND MASTER COPIES\\BRAVEHEART

Run manually:
    python braveheart_catalog.py

Schedule daily (Windows Task Scheduler, runs at 02:00):
    schtasks /create /sc daily /st 02:00 /tn "BRAVEHEART Catalog" ^
        /tr "python C:\\Apps in Dev Visual Code Folder\\Claude Working Folder\\PROJECTS\\jb3ai-command-centre\\scripts\\braveheart_catalog.py"
"""

from __future__ import annotations

import hashlib
import os
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

try:
    from dotenv import load_dotenv
    # override=True ensures .env wins over any shadowing system env vars
    load_dotenv(Path(__file__).parent / ".env", override=True)
except ImportError:
    pass  # python-dotenv optional; system env vars also work

try:
    from supabase import create_client
except ImportError:
    sys.exit("ERROR: pip install supabase --break-system-packages")

# ── Config ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
BRAVEHEART_FOLDER = Path(
    os.environ.get(
        "BRAVEHEART_FOLDER",
        r"C:\Users\jono\OneDrive\BACKUP AND MASTER COPIES\BRAVEHEART",
    )
)

EXTS = {".pdf", ".docx", ".doc", ".html", ".htm", ".eml", ".txt", ".rtf"}

DOC_TYPE_PATTERNS = [
    ("summons",   r"\bsummons?\b|\bdagvaarding\b"),
    ("motion",    r"\bmotion\b|\bnotice of motion\b"),
    ("judgment",  r"\bjudg[ae]?ment\b|\bvonnis\b"),
    ("demand",    r"\bdemand\b|\bletter of demand\b|\bs129\b|\bsec.?\s*129\b"),
    ("notice",    r"\bnotice\b|\bkennisgewing\b"),
    ("response",  r"\bresponse\b|\bantwoord\b|\breply\b"),
    ("letter",    r"\bletter\b|\bbrief\b|\bcorrespondence\b"),
    ("statement", r"\bstatement\b|\bstaat\b"),
    ("invoice",   r"\binvoice\b|\bfactuur\b"),
    ("affidavit", r"\baffidavit\b|\beedsverklaring\b"),
    ("agreement", r"\bagreement\b|\bcontract\b|\bovereenkoms\b"),
]

# Common South African creditor / institution tokens to recognise in filenames
CREDITOR_TOKENS = [
    "FNB", "Absa", "ABSA", "Capitec", "Standard Bank", "StandardBank",
    "Nedbank", "RMB", "BankZero", "Bank Zero",
    "Investec", "DiscoveryBank", "Discovery Bank",
    "Debtbusters", "ConstellationRMS", "Constellation", "FusionCS", "Fusion",
    "SARS", "TymeBank", "Tyme", "African Bank",
]
CREDITOR_TOKENS = sorted(set(CREDITOR_TOKENS), key=len, reverse=True)

# Month lookup for filename parsing
MONTHS = {
    m.lower(): i for i, m in enumerate(
        ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], start=1
    )
}
MONTHS_LONG = {
    m.lower(): i for i, m in enumerate(
        ["January","February","March","April","May","June",
         "July","August","September","October","November","December"], start=1
    )
}

DATE_PATTERNS = [
    # YYYY-MM-DD or YYYY_MM_DD or YYYYMMDD
    (re.compile(r"(20\d{2})[-_]?(\d{2})[-_]?(\d{2})"), lambda m: date(int(m[1]), int(m[2]), int(m[3]))),
    # Mon2026 or Mon_2026 or MonYYYY
    (re.compile(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-_ ]?(20\d{2})", re.I),
     lambda m: date(int(m[2]), MONTHS[m[1].lower()], 1)),
    # YYYY-MM or YYYY_MM
    (re.compile(r"(20\d{2})[-_](\d{2})(?!\d)"), lambda m: date(int(m[1]), int(m[2]), 1)),
    # Month YYYY
    (re.compile(r"(january|february|march|april|may|june|july|august|september|october|november|december)[-_ ]?(20\d{2})", re.I),
     lambda m: date(int(m[2]), MONTHS_LONG[m[1].lower()], 1)),
]


def sha256_file(path: Path, chunk_size: int = 1 << 16) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(chunk_size):
            h.update(chunk)
    return h.hexdigest()


def extract_doc_type(name: str) -> str | None:
    n = name.lower()
    for label, pat in DOC_TYPE_PATTERNS:
        if re.search(pat, n, re.I):
            return label
    return None


def extract_doc_date(name: str, fallback_mtime: float) -> date:
    for pat, build in DATE_PATTERNS:
        m = pat.search(name)
        if m:
            try:
                return build(m)
            except (ValueError, KeyError):
                continue
    # Fall back to file modified date
    return date.fromtimestamp(fallback_mtime)


def extract_creditor_hint(name: str) -> str | None:
    for token in CREDITOR_TOKENS:
        if re.search(rf"\b{re.escape(token)}\b", name, re.I):
            return token
    return None


def pdf_page_count(path: Path) -> int | None:
    try:
        from pypdf import PdfReader
        return len(PdfReader(str(path), strict=False).pages)
    except Exception:
        return None


def docx_page_count(path: Path) -> int | None:
    # python-docx can't give exact page count without rendering; return None
    # but we could return paragraph count as a rough proxy. Skip for now.
    return None


def main() -> int:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in env or .env file")
        return 2

    if not BRAVEHEART_FOLDER.exists():
        print(f"ERROR: BRAVEHEART folder not found: {BRAVEHEART_FOLDER}")
        return 3

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all existing hashes once (single round-trip vs N selects)
    existing = sb.table("hub_braveheart_documents").select("file_hash").execute()
    existing_hashes: set[str] = {row["file_hash"] for row in (existing.data or [])}

    scanned = 0
    skipped = 0
    new_rows: list[dict] = []
    type_counts: Counter = Counter()
    errors: list[str] = []

    for path in BRAVEHEART_FOLDER.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in EXTS:
            continue
        # Skip Office lock files (~$*) and hidden files
        if path.name.startswith("~$") or path.name.startswith("."):
            continue
        scanned += 1

        try:
            file_hash = sha256_file(path)
        except Exception as e:
            errors.append(f"hash failed: {path.name} ({e.__class__.__name__})")
            continue

        if file_hash in existing_hashes:
            skipped += 1
            continue

        stat = path.stat()
        doc_type = extract_doc_type(path.name)
        doc_date = extract_doc_date(path.name, stat.st_mtime)
        creditor_hint = extract_creditor_hint(path.name)

        page_count = None
        if path.suffix.lower() == ".pdf":
            page_count = pdf_page_count(path)

        new_rows.append({
            "file_path":       str(path),
            "file_name":       path.name,
            "file_hash":       file_hash,
            "file_size_bytes": stat.st_size,
            "doc_type":        doc_type,
            "doc_date":        doc_date.isoformat() if doc_date else None,
            "creditor_hint":   creditor_hint,
            "page_count":      page_count,
            "text_extracted":  False,
        })
        type_counts[doc_type or "unknown"] += 1

    # Dedupe within the local batch — same file content can appear under
    # multiple filenames (e.g. duplicated PDFs). First occurrence wins;
    # later duplicates are reported separately so you know they exist.
    seen_local_hashes: set[str] = set()
    unique_rows: list[dict] = []
    local_duplicates = 0
    for row in new_rows:
        if row["file_hash"] in seen_local_hashes:
            local_duplicates += 1
            continue
        seen_local_hashes.add(row["file_hash"])
        unique_rows.append(row)

    # Bulk upsert in chunks of 200. ignore_duplicates=True means if a row
    # somehow exists already (race condition with another runner), skip it.
    inserted = 0
    for i in range(0, len(unique_rows), 200):
        chunk = unique_rows[i:i + 200]
        try:
            sb.table("hub_braveheart_documents").upsert(
                chunk, on_conflict="file_hash", ignore_duplicates=True,
            ).execute()
            inserted += len(chunk)
        except Exception as e:
            errors.append(f"upsert chunk {i}: {e.__class__.__name__}: {str(e)[:200]}")

    # Summary — NO filenames, NO PII
    print(f"BRAVEHEART catalog complete")
    print(f"  Folder:                {BRAVEHEART_FOLDER}")
    print(f"  Files scanned:         {scanned}")
    print(f"  Already cataloged:     {skipped}")
    print(f"  Local content dupes:   {local_duplicates}")
    print(f"  New rows inserted:     {inserted}")
    if type_counts:
        print(f"  New by type:")
        for t, n in sorted(type_counts.items(), key=lambda x: -x[1]):
            print(f"    {t:12s} {n}")
    if errors:
        print(f"  Errors: {len(errors)}")
        for e in errors[:5]:
            print(f"    {e}")

    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
