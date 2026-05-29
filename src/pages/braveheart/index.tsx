import { useEffect, useMemo, useState } from "react";
import {
  Scale,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Clock,
  FileText,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { supabase, type HubBraveheart, type HubBraveheartDocument } from "@/lib/supabase";

/**
 * OS³ Command Centre — BRAVEHEART (Task #15)
 *
 * Matters + creditor accounts. 24 seeded rows from migration 002.
 * Reads from hub_braveheart with the priority/response/credit-record
 * extensions added in migration 001.
 *
 * Brand:
 *   • amount_zar in gold (it's exposure)
 *   • response_status mapped to red/amber/green dot
 *   • priority pill in rose/amber/cyan/grey
 *   • on_credit_record flagged with a shield icon
 */

const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
const EXTRA_FILTERS = ["Needs Action", "Stale", "Court 30d"] as const;
type Filter = "All" | (typeof PRIORITIES)[number] | (typeof EXTRA_FILTERS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 30;
const ACTION_TOUCH_DAYS = 14;
const COURT_WINDOW_DAYS = 30;
const ACTION_DUE_DAYS = 7;
const RESOLVED_STATUSES = ["resolved", "closed", "paid", "settled", "done"];

function isResolved(status?: string | null): boolean {
  if (!status) return false;
  return RESOLVED_STATUSES.includes(status.toLowerCase());
}

function daysSince(iso?: string | null): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

function daysUntil(iso?: string | null): number {
  if (!iso) return Infinity;
  return (new Date(iso).getTime() - Date.now()) / DAY_MS;
}

function isStale(r: HubBraveheart): boolean {
  return !isResolved(r.status) && daysSince(r.last_correspondence_at) > STALE_DAYS;
}

function needsAction(r: HubBraveheart): boolean {
  if (r.response_status === "red") return true;
  const dueIn = daysUntil(r.next_action_due);
  if (dueIn >= -365 && dueIn <= ACTION_DUE_DAYS) return true;
  if (!isResolved(r.status) && daysSince(r.last_correspondence_at) > ACTION_TOUCH_DAYS) return true;
  return false;
}

function isCourtSoon(r: HubBraveheart): boolean {
  const d = daysUntil(r.court_date);
  return d >= 0 && d <= COURT_WINDOW_DAYS;
}

function priorityClass(p?: string | null): string {
  switch (p) {
    case "Critical":
      return "border-rose-400/40 bg-rose-500/10 text-rose-300";
    case "High":
      return "border-amber-400/40 bg-amber-500/10 text-amber-300";
    case "Medium":
      return "border-cyan-30 bg-cyan-10 text-cyan";
    case "Low":
    default:
      return "border-edge bg-steel text-ink-mute";
  }
}

function responseDotClass(r?: string | null): string {
  switch (r) {
    case "red":
      return "bg-rose-400";
    case "amber":
      return "bg-amber-400";
    case "green":
      return "bg-emerald-400";
    default:
      return "bg-ink-ghost";
  }
}

function fmtZar(n?: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yy");
  } catch {
    return "—";
  }
}

function fmtBytes(bytes?: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docTypeBadgeClass(t?: string | null): string {
  switch (t?.toLowerCase()) {
    case "summons":
    case "court order":
    case "judgment":
      return "border-rose-400/40 bg-rose-500/10 text-rose-300";
    case "statement":
    case "invoice":
      return "border-amber-400/40 bg-amber-500/10 text-amber-300";
    case "letter":
    case "correspondence":
      return "border-cyan-30 bg-cyan-10 text-cyan";
    default:
      return "border-edge bg-steel text-ink-mute";
  }
}

export default function BraveheartPage() {
  const [rows, setRows] = useState<HubBraveheart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docs, setDocs] = useState<HubBraveheartDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [linkingDoc, setLinkingDoc] = useState<string | null>(null);

  async function loadDocs() {
    setDocsLoading(true);
    const { data } = await supabase
      .from("hub_braveheart_documents")
      .select("*")
      .order("doc_date", { ascending: false, nullsFirst: true });
    setDocs((data as HubBraveheartDocument[]) ?? []);
    setDocsLoading(false);
  }

  async function linkDocToCreditor(docId: string, braveheartId: string) {
    setLinkingDoc(docId);
    const { error: err } = await supabase
      .from("hub_braveheart_documents")
      .update({ braveheart_id: braveheartId })
      .eq("id", docId);
    if (!err) {
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, braveheart_id: braveheartId } : d)),
      );
    }
    setLinkingDoc(null);
  }

  const docsForCreditor = useMemo(() => {
    const map = new Map<string, HubBraveheartDocument[]>();
    for (const d of docs) {
      if (d.braveheart_id) {
        const arr = map.get(d.braveheart_id) ?? [];
        arr.push(d);
        map.set(d.braveheart_id, arr);
      }
    }
    return map;
  }, [docs]);

  const unlinkedDocs = useMemo(
    () => docs.filter((d) => !d.braveheart_id),
    [docs],
  );

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_braveheart")
      .select("*")
      .order("priority", { ascending: true, nullsFirst: false })
      .order("amount_zar", { ascending: false, nullsFirst: false });
    if (err) {
      setError(err.message);
    } else {
      setRows((data as HubBraveheart[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    void loadDocs();
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case "All":
        return rows;
      case "Needs Action": {
        const subset = rows.filter(needsAction);
        // oldest last_correspondence first so most-ignored floats to top
        return [...subset].sort(
          (a, b) => daysSince(b.last_correspondence_at) - daysSince(a.last_correspondence_at),
        );
      }
      case "Stale": {
        const subset = rows.filter(isStale);
        return [...subset].sort(
          (a, b) => daysSince(b.last_correspondence_at) - daysSince(a.last_correspondence_at),
        );
      }
      case "Court 30d": {
        const subset = rows.filter(isCourtSoon);
        // soonest court date first
        return [...subset].sort(
          (a, b) => daysUntil(a.court_date) - daysUntil(b.court_date),
        );
      }
      default:
        return rows.filter((r) => r.priority === filter);
    }
  }, [rows, filter]);

  const totals = useMemo(() => {
    const exposure = rows.reduce((sum, r) => sum + (r.amount_zar ?? 0), 0);
    const onRecord = rows.filter((r) => r.on_credit_record).length;
    const critical = rows.filter((r) => r.priority === "Critical").length;
    return { exposure, onRecord, critical, count: rows.length };
  }, [rows]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: rows.length };
    for (const p of PRIORITIES) {
      map[p] = rows.filter((r) => r.priority === p).length;
    }
    map["Needs Action"] = rows.filter(needsAction).length;
    map["Stale"] = rows.filter(isStale).length;
    map["Court 30d"] = rows.filter(isCourtSoon).length;
    return map;
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <Scale className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              BRAVEHEART
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Matters and creditor accounts — priority, exposure, response state,
              and credit-record flags.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:shrink-0">
          {lastRefresh && (
            <span className="rounded-sm border border-edge bg-graphite px-2.5 py-1 font-mono text-[11px] text-ink-mute">
              last sync {format(lastRefresh, "HH:mm · dd MMM")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-sm border border-edge bg-steel px-3 py-1.5 text-xs font-medium text-ink hover:border-cyan-30 hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary strip — exposure in gold */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-edge bg-graphite px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mute">
        <span>
          <span className="font-display text-base font-bold text-ink">{totals.count}</span>{" "}
          matters
        </span>
        <span>
          <span className="font-display text-base font-bold text-rose-400">{totals.critical}</span>{" "}
          critical
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink">{totals.onRecord}</span>{" "}
          on credit record
        </span>
        <span>
          <span className="font-display text-base font-bold text-gold">{fmtZar(totals.exposure)}</span>{" "}
          total exposure
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink">{docs.length}</span>{" "}
          documents
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Filter chips — priorities + action-oriented filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["All", ...PRIORITIES] as Filter[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(p)}
            className={`rounded-sm border px-3 py-1 text-[11px] font-medium ${
              filter === p
                ? "border-cyan-30 bg-cyan-15 text-cyan"
                : "border-edge bg-steel text-ink-dim hover:text-ink"
            }`}
          >
            {p}{" "}
            <span className="ml-1 font-mono text-[10px] text-ink-mute">
              {counts[p] ?? 0}
            </span>
          </button>
        ))}
        {/* Action-oriented chips — visually separated, rose accent when non-zero */}
        <span className="mx-2 hidden h-6 w-px self-center bg-edge sm:inline-block" aria-hidden="true" />
        {(EXTRA_FILTERS as readonly Filter[]).map((f) => {
          const isActive = filter === f;
          const hasItems = (counts[f] ?? 0) > 0;
          const baseClasses = "rounded-sm border px-3 py-1 text-[11px] font-medium";
          const stateClasses = isActive
            ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
            : hasItems
              ? "border-edge bg-steel text-ink hover:border-rose-400/30"
              : "border-edge bg-steel text-ink-mute hover:text-ink";
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`${baseClasses} ${stateClasses}`}
            >
              {f}{" "}
              <span className="ml-1 font-mono text-[10px] text-ink-mute">
                {counts[f] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-lg border border-edge bg-graphite">
        {loading && rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-dim">Loading matters…</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-dim">
            No matters match this filter.
          </div>
        ) : (
          <ul className="divide-y divide-edge">
            {filtered.map((m) => {
              const open = expanded === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : m.id)}
                    className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 text-left hover:bg-steel/50"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${responseDotClass(m.response_status)}`}
                      title={`response: ${m.response_status ?? "unknown"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-ink break-words">
                          {m.title || m.creditor || "(untitled matter)"}
                        </span>
                        {m.account_ref && (
                          <span className="font-mono text-[11px] text-ink-mute">
                            {m.account_ref}
                          </span>
                        )}
                        {m.on_credit_record && (
                          <span
                            className="inline-flex items-center gap-1 rounded-sm border border-rose-400/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-300"
                            title="On credit record"
                          >
                            <ShieldAlert className="h-3 w-3" strokeWidth={2} />
                            credit
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-mute">
                        {m.creditor && <span>{m.creditor}</span>}
                        {m.action_status && <span>· {m.action_status}</span>}
                        {m.last_correspondence_at && (
                          <span className={isStale(m) ? "inline-flex items-center gap-1 text-amber-300" : ""}>
                            · last touch {fmtDate(m.last_correspondence_at)}
                            {isStale(m) && (
                              <Clock
                                className="h-3 w-3"
                                strokeWidth={2}
                                aria-label={`Stale — no contact in ${Math.floor(daysSince(m.last_correspondence_at))} days`}
                              />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {typeof m.amount_zar === "number" && (
                        <span className="font-display text-sm font-semibold text-gold">
                          {fmtZar(m.amount_zar)}
                        </span>
                      )}
                      <span
                        className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${priorityClass(m.priority)}`}
                      >
                        {m.priority ?? "—"}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-edge bg-steel/30 px-4 py-4 text-[12px] leading-relaxed text-ink-dim">
                      <Detail label="Matter ref" value={m.matter_ref} />
                      <Detail label="Type" value={m.matter_type} />
                      <Detail label="Severity" value={m.severity} />
                      <Detail label="Status" value={m.status} />
                      <Detail label="IMED" value={m.imed_status} />
                      <Detail
                        label="Court"
                        value={m.court_label || (m.court_date ? fmtDate(m.court_date) : undefined)}
                      />
                      <Detail label="Next action" value={m.next_action} />
                      <Detail
                        label="Next due"
                        value={m.next_action_due ? fmtDate(m.next_action_due) : undefined}
                      />
                      <Detail label="Attorney" value={m.attorney_name} />
                      {m.notes && (
                        <div className="mt-3 whitespace-pre-wrap text-ink-dim">{m.notes}</div>
                      )}

                      {/* Documents linked to this creditor */}
                      {(() => {
                        const credDocs = docsForCreditor.get(m.id);
                        if (docsLoading) {
                          return (
                            <div className="mt-4 border-t border-edge pt-3">
                              <p className="flex items-center gap-2 text-[11px] text-ink-mute">
                                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Loading documents…
                              </p>
                            </div>
                          );
                        }
                        if (!credDocs || credDocs.length === 0) {
                          return (
                            <div className="mt-4 border-t border-edge pt-3">
                              <p className="flex items-center gap-2 text-[11px] text-ink-mute">
                                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                                No documents linked
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-4 border-t border-edge pt-3">
                            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                              Documents
                              <span className="font-mono text-[10px] font-normal">
                                ({credDocs.length})
                              </span>
                            </p>
                            <ul className="space-y-1.5">
                              {credDocs.map((d) => (
                                <li
                                  key={d.id}
                                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-edge bg-graphite px-3 py-2"
                                >
                                  <span
                                    className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${docTypeBadgeClass(d.doc_type)}`}
                                  >
                                    {d.doc_type ?? "doc"}
                                  </span>
                                  {d.file_path ? (
                                    <a
                                      href={`computer://${d.file_path}`}
                                      className="text-[12px] font-medium text-cyan hover:underline"
                                      title={`Open ${d.file_name}`}
                                    >
                                      {d.file_name}
                                    </a>
                                  ) : (
                                    <span className="text-[12px] font-medium text-ink">
                                      {d.file_name}
                                    </span>
                                  )}
                                  <span className="font-mono text-[10px] text-ink-mute">
                                    {fmtDate(d.doc_date)}
                                  </span>
                                  {(d.page_count != null || d.file_size_bytes != null) && (
                                    <span className="font-mono text-[10px] text-ink-ghost">
                                      {d.page_count != null && `${d.page_count}p`}
                                      {d.page_count != null && d.file_size_bytes != null && " · "}
                                      {d.file_size_bytes != null && fmtBytes(d.file_size_bytes)}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Unlinked Documents ── */}
      {unlinkedDocs.length > 0 && (
        <div className="mt-8 rounded-md border border-edge bg-surface p-5">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
            <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Unlinked Documents
            <span className="font-mono text-[10px] font-normal">
              ({unlinkedDocs.length})
            </span>
          </p>

          <ul className="space-y-2">
            {unlinkedDocs.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-sm border border-edge bg-graphite px-3 py-2"
              >
                <span
                  className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${docTypeBadgeClass(d.doc_type)}`}
                >
                  {d.doc_type ?? "doc"}
                </span>

                {d.file_path ? (
                  <a
                    href={`computer://${d.file_path}`}
                    className="text-[12px] font-medium text-cyan hover:underline"
                    title={`Open ${d.file_name}`}
                  >
                    {d.file_name}
                  </a>
                ) : (
                  <span className="text-[12px] font-medium text-ink">
                    {d.file_name}
                  </span>
                )}

                <span className="font-mono text-[10px] text-ink-mute">
                  {fmtDate(d.doc_date)}
                </span>

                {(d.page_count != null || d.file_size_bytes != null) && (
                  <span className="font-mono text-[10px] text-ink-ghost">
                    {d.page_count != null && `${d.page_count}p`}
                    {d.page_count != null && d.file_size_bytes != null && " · "}
                    {d.file_size_bytes != null && fmtBytes(d.file_size_bytes)}
                  </span>
                )}

                {/* Link-to-creditor dropdown */}
                <select
                  className="ml-auto rounded-sm border border-edge bg-matte px-2 py-1 text-[11px] text-ink disabled:opacity-40"
                  value=""
                  disabled={linkingDoc === d.id}
                  onChange={(e) => {
                    if (e.target.value) linkDocToCreditor(d.id, e.target.value);
                  }}
                >
                  <option value="">
                    {linkingDoc === d.id ? "Linking…" : "Link to creditor"}
                  </option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.creditor ?? r.title}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 text-[11px] text-ink-ghost">
        Source: <span className="font-mono">hub_braveheart</span> · 24 rows seeded
        in migration 002 · RLS enforced on read.
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3 py-0.5">
      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">
        {label}
      </span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
