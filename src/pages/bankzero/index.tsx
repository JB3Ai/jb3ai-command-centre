import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, TrendingUp, TrendingDown, DollarSign, Search, Filter } from "lucide-react";

interface BankTxn {
  id: string;
  txn_date: string;
  description: string;
  amount_zar: number;
  balance_zar: number | null;
  category: string | null;
  source_file: string | null;
  created_at: string;
}

interface ParsedRow {
  txn_date: string;
  description: string;
  amount_zar: number;
  balance_zar: number | null;
  category: string;
  _key: string; // dedup key
}

// ── Auto-categorisation ────────────────────────────────────────────────────
const CATEGORY_RULES: [RegExp, string][] = [
  // Dev & SaaS — match before generic rules
  [/anthropic|github|vercel|netlify|notion|figma|canva|google workspace|ngrok|taskade|cloudflare|digitalocean|aws |amazon web|heroku|stripe|sendgrid|twilio/i, "Dev/SaaS"],
  // Subscriptions — be specific, avoid matching "Apple Pay"
  [/netflix|spotify|apple\.com|apple music|apple tv|icloud|google play|dstv|showmax|disney\+|dropbox|microsoft 365|adobe/i, "Subscriptions"],
  // Groceries
  [/checkers|woolworths|pick n pay|\bpnp\b|spar|food lover|shoprite|clicks|kwikspar|parkway\b/i, "Groceries"],
  // Food & Takeaways
  [/uber eats|mr d food|mr delivery|bolt food|kfc|mcdonalds|mcd |nandos|steers|panarottis|ocean basket|spur |piza inn|debonairs|coffee|cafe|eatery|restaurant|kitchen|diner|grill|bakery|motherland|abantu/i, "Dining"],
  // Fuel — fixed: no trailing space required on BP
  [/sasol|engen|\bbp\b|caltex|shell\b|total\b|fuel|petrol/i,              "Fuel"],
  // Transport
  [/\buber\b|bolt |taxi|gautrain|intercape|greyhound/i,                    "Transport"],
  // Airtime / Data
  [/vodacom|mtn |cell c|telkom|afrihost|\brain\b/i,                        "Airtime/Data"],
  // Transfers
  [/transfer|payment to|pay to|\beft\b/i,                                  "Transfers"],
  // Income
  [/salary|payroll|income|wage/i,                                          "Income"],
  // Cash
  [/cashsend|\batm\b/i,                                                    "Cash"],
  // Medical
  [/medical|dis-chem|pharmacy|doctor|dentist|hospital|clicks pharmacy/i,   "Medical"],
  // Bank Fees
  [/interest|bank fee|service fee|monthly fee|penalty/i,                   "Bank Fees"],
  // Entertainment & Leisure
  [/rollercade|cinema|ster-kinekor|nu metro|netflix|gaming|steam|playstation/i, "Entertainment"],
  // Liquor
  [/liquor|bottle store|wine|beer|spirit/i,                                "Liquor"],
];

function autoCategory(desc: string, type?: string): string {
  const t = type?.toLowerCase() ?? "";
  if (t === "atm withdrawal" || t.includes("atm")) return "Cash";
  if (t === "buy data") return "Airtime/Data";
  if (t === "payment out") return "Transfers";
  if (t === "card purchase" || t === "phone tap") { /* fall through to rules */ }
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(desc)) return cat;
  }
  return "Other";
}

// ── CSV parser — handles BankZero export formats ──────────────────────────
function parseCsv(text: string): string[][] {
  return text.trim().split(/\r?\n/).map(line => {
    const cells: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

function parseAmount(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/[R\s,]/g, "");
  return parseFloat(clean) || 0;
}

function parseDate(s: string): string {
  // Handles DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD Mon YYYY
  s = s.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return s;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  const mon: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  };
  const dmonY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmonY) return `${dmonY[3]}-${mon[dmonY[2].toLowerCase()] ?? "01"}-${dmonY[1].padStart(2,"0")}`;
  return s;
}

function parseBankZeroCSV(text: string, _filename: string): ParsedRow[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.toLowerCase().replace(/\s+/g, "_"));

  // Find column indices — flexible for BankZero & common SA bank exports
  const col = (names: string[]) => names.map(n => header.indexOf(n)).find(i => i >= 0) ?? -1;
  const dateIdx   = col(["date","transaction_date","txn_date","value_date"]);
  const desc1Idx  = col(["description_1","description","narrative","details","reference","transaction_description"]);
  const desc2Idx  = col(["description_2","additional_description"]);
  const typeIdx   = col(["type","transaction_type","txn_type"]);
  const amtIdx    = col(["amount","amount_(zar)","transaction_amount"]);
  const debitIdx  = col(["debit","debit_amount","debits"]);
  const creditIdx = col(["credit","credit_amount","credits"]);
  const balIdx    = col(["balance","running_balance","closing_balance"]);

  const results: ParsedRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2 || !r[0]) continue;
    const dateStr = dateIdx >= 0 ? r[dateIdx] : r[0];
    const txn_date = parseDate(dateStr);
    if (!txn_date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

    const raw1 = desc1Idx >= 0 ? r[desc1Idx] : r[1] ?? "";
    const raw2 = desc2Idx >= 0 ? r[desc2Idx] : "";
    const txnType = typeIdx >= 0 ? r[typeIdx] : "";
    const desc = raw2 ? `${raw1} — ${raw2}` : raw1;
    let amount_zar = 0;
    if (amtIdx >= 0) {
      amount_zar = parseAmount(r[amtIdx]);
    } else if (debitIdx >= 0 || creditIdx >= 0) {
      const debit  = debitIdx  >= 0 ? parseAmount(r[debitIdx])  : 0;
      const credit = creditIdx >= 0 ? parseAmount(r[creditIdx]) : 0;
      amount_zar = credit - debit; // credit positive, debit negative
    }
    const balance_zar = balIdx >= 0 ? parseAmount(r[balIdx]) : null;
    const category = autoCategory(desc, txnType);
    const _key = `${txn_date}|${desc}|${amount_zar}`;
    results.push({ txn_date, description: desc, amount_zar, balance_zar, category, _key });
  }
  return results;
}

// ── Formatting helpers ─────────────────────────────────────────────────────
const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 });
const fmt = (n: number) => ZAR.format(n);

function MetricCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean;
}) {
  const colour = positive === undefined ? "#D4AF37"
    : positive ? "#4ade80" : "#f87171";
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ fontFamily: "Orbitron, sans-serif", color: colour }}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function TxnRow({ txn }: { txn: BankTxn }) {
  const isCredit = txn.amount_zar > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isCredit ? "bg-green-400/10" : "bg-red-400/10"}`}>
        {isCredit
          ? <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{txn.description || "—"}</p>
        <p className="text-xs text-zinc-500">
          {txn.txn_date} · <span className="text-zinc-600">{txn.category ?? "Other"}</span>
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isCredit ? "text-green-400" : "text-red-400"}`}>
          {isCredit ? "+" : ""}{fmt(txn.amount_zar)}
        </p>
        {txn.balance_zar !== null && (
          <p className="text-xs text-zinc-600">{fmt(txn.balance_zar)}</p>
        )}
      </div>
    </div>
  );
}

export default function BankZeroPage() {
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"transactions" | "import">("transactions");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  // Import state
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [csvFilename, setCsvFilename] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("hub_bankzero_transactions")
      .select("*").order("txn_date", { ascending: false }).limit(500)
      .then(({ data }) => { setTxns(data ?? []); setLoading(false); });
  }, []);

  // ── Derived metrics ────────────────────────────────────────────────────
  const currentBalance = txns.find(t => t.balance_zar !== null)?.balance_zar ?? null;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTxns = txns.filter(t => t.txn_date.startsWith(thisMonth));
  const monthIn  = monthTxns.filter(t => t.amount_zar > 0).reduce((s, t) => s + t.amount_zar, 0);
  const monthOut = monthTxns.filter(t => t.amount_zar < 0).reduce((s, t) => s + t.amount_zar, 0);

  const categories = useMemo(() =>
    ["All", ...Array.from(new Set(txns.map(t => t.category ?? "Other"))).sort()], [txns]);

  const months = useMemo(() =>
    ["All", ...Array.from(new Set(txns.map(t => t.txn_date.slice(0, 7)))).sort().reverse()], [txns]);

  const visible = useMemo(() => txns.filter(t => {
    if (catFilter !== "All" && (t.category ?? "Other") !== catFilter) return false;
    if (monthFilter !== "All" && !t.txn_date.startsWith(monthFilter)) return false;
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [txns, catFilter, monthFilter, search]);

  // ── CSV handling ───────────────────────────────────────────────────────
  function handleFile(file: File) {
    setCsvFilename(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseBankZeroCSV(text, file.name);
      setPreview(rows);
      setTab("import");
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!preview.length) return;
    setImporting(true);
    setImportResult(null);
    // Dedup against existing: fetch keys for same date range
    const dates = preview.map(r => r.txn_date).sort();
    const { data: existing } = await supabase.from("hub_bankzero_transactions")
      .select("txn_date,description,amount_zar")
      .gte("txn_date", dates[0]).lte("txn_date", dates[dates.length - 1]);
    const existingKeys = new Set((existing ?? []).map(
      r => `${r.txn_date}|${r.description}|${r.amount_zar}`));
    const newRows = preview.filter(r => !existingKeys.has(r._key))
      .map(({ _key, ...r }) => ({ ...r, source_file: csvFilename }));
    if (!newRows.length) {
      setImportResult("All rows already exist — nothing new to import.");
      setImporting(false);
      return;
    }
    const { error } = await supabase.from("hub_bankzero_transactions").insert(newRows);
    if (error) {
      setImportResult(`Error: ${error.message}`);
    } else {
      setImportResult(`✓ Imported ${newRows.length} new transactions (${preview.length - newRows.length} duplicates skipped).`);
      const { data } = await supabase.from("hub_bankzero_transactions")
        .select("*").order("txn_date", { ascending: false }).limit(500);
      setTxns(data ?? []);
      setPreview([]);
      setTab("transactions");
    }
    setImporting(false);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Metrics bar */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-zinc-800 shrink-0">
        <MetricCard label="Current Balance"
          value={currentBalance !== null ? fmt(currentBalance) : "—"}
          sub="latest transaction balance" />
        <MetricCard label={`${thisMonth} In`} value={fmt(monthIn)}
          sub="credits this month" positive={true} />
        <MetricCard label={`${thisMonth} Out`} value={fmt(Math.abs(monthOut))}
          sub="debits this month" positive={false} />
        <MetricCard label="Net This Month" value={fmt(monthIn + monthOut)}
          sub="income minus spend" positive={(monthIn + monthOut) >= 0} />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800 shrink-0">
        {(["transactions","import"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            {t}{t === "import" && preview.length > 0 ? ` (${preview.length})` : ""}
          </button>
        ))}
        {/* Upload button always visible */}
        <label className="ml-auto flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-cyan-400/50 hover:text-cyan-400 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" /> Upload CSV
          <input type="file" accept=".csv" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "transactions" ? (
          <>
            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search transactions…"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600" />
              </div>
              <Filter className="w-4 h-4 text-zinc-600 shrink-0" />
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none">
                {months.map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className="text-xs text-zinc-600">{visible.length} rows</span>
            </div>
            {loading ? (
              <p className="text-zinc-500 text-sm text-center mt-12">Loading transactions…</p>
            ) : txns.length === 0 ? (
              <div className="text-center mt-16">
                <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No transactions yet</p>
                <p className="text-zinc-600 text-xs mt-1">Upload a BankZero CSV statement to get started</p>
              </div>
            ) : visible.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center mt-12">No matches for current filters</p>
            ) : (
              visible.map(t => <TxnRow key={t.id} txn={t} />)
            )}
          </>
        ) : (
          // Import tab
          <div className="p-6 max-w-3xl">
            {preview.length === 0 ? (
              <div ref={dropRef}
                onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add("border-cyan-400/50"); }}
                onDragLeave={() => dropRef.current?.classList.remove("border-cyan-400/50")}
                onDrop={e => { e.preventDefault(); dropRef.current?.classList.remove("border-cyan-400/50"); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
                className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center transition-colors">
                <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 mb-1">Drop your BankZero CSV here</p>
                <p className="text-zinc-600 text-xs">or use the Upload CSV button above</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold">{csvFilename}</p>
                    <p className="text-zinc-500 text-xs">{preview.length} transactions parsed</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreview([]); setImportResult(null); }}
                      className="px-4 py-2 text-sm border border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors">
                      Clear
                    </button>
                    <button onClick={confirmImport} disabled={importing}
                      className="px-4 py-2 text-sm bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 rounded-lg transition-colors disabled:opacity-50">
                      {importing ? "Importing…" : `Import ${preview.length} rows`}
                    </button>
                  </div>
                </div>
                {importResult && (
                  <p className={`text-sm mb-4 px-4 py-2 rounded-lg border ${importResult.startsWith("✓") ? "border-green-400/30 bg-green-400/10 text-green-400" : "border-red-400/30 bg-red-400/10 text-red-400"}`}>
                    {importResult}
                  </p>
                )}
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 gap-0 px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                    <span>Date</span><span className="col-span-2">Description</span><span className="text-right">Amount</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {preview.slice(0, 100).map((r, i) => (
                      <div key={i} className="grid grid-cols-4 gap-0 px-4 py-2.5 border-b border-zinc-800/50 text-sm hover:bg-zinc-900/40">
                        <span className="text-zinc-500">{r.txn_date}</span>
                        <span className="col-span-2 text-white truncate pr-2">{r.description}</span>
                        <span className={`text-right font-mono ${r.amount_zar >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {r.amount_zar >= 0 ? "+" : ""}{fmt(r.amount_zar)}
                        </span>
                      </div>
                    ))}
                    {preview.length > 100 && (
                      <p className="text-zinc-600 text-xs text-center py-3">…and {preview.length - 100} more</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


