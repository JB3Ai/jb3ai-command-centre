import { useEffect, useMemo, useState } from "react";
import { Settings2, RefreshCw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

/**
 * OS³ Command Centre — Config & Integrations panel (Task #13)
 *
 * Single pane for every connected service. Reads `hub_sync_status` (extended
 * by migration 001 with display_name, category, enabled, endpoint, latency_ms)
 * and renders one row per integration grouped by category.
 *
 * Behaviour
 *   • Manual refresh only — no polling. Last refresh timestamp shown top-right.
 *   • Heartbeat dot colour-mapped from `last_status`:
 *         success → emerald, pending → amber, error → rose, null → ink-ghost
 *   • Per-row enable/disable toggle persists via supabase.update().
 *     Optimistic UI: flips immediately, rolls back on error.
 *   • Brand: cyan capped — only used on icon halo and heartbeat-success dots.
 *           No gradients, no glow.
 */

// ── Row type — extends base SyncStatus with the 5 migration-001 columns ───
type IntegrationRow = {
  id: string;
  source: string;
  display_name?: string | null;
  category?: string | null;
  enabled?: boolean | null;
  endpoint?: string | null;
  latency_ms?: number | null;
  last_synced_at?: string | null;
  last_status?: string | null;
  error_message?: string | null;
  record_count?: number | null;
  updated_at: string;
};

// Display order for the section headers
const CATEGORY_ORDER: Array<{ key: string; label: string }> = [
  { key: "mcp",       label: "MCPs" },
  { key: "api",       label: "APIs" },
  { key: "tunnel",    label: "Tunnels" },
  { key: "scheduler", label: "Schedulers" },
  { key: "db",        label: "Database" },
  { key: "ingest",    label: "Ingest pipelines" },
  { key: "script",    label: "Scripts" },
  { key: "other",     label: "Other" },
];

// last_status → tailwind bg class
function statusDotClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "success":
    case "ok":
    case "healthy":
      return "bg-emerald-400";
    case "pending":
    case "running":
    case "syncing":
      return "bg-amber-400";
    case "error":
    case "failed":
    case "fail":
      return "bg-rose-400";
    default:
      return "bg-ink-ghost";
  }
}

function statusLabel(status?: string | null): string {
  if (!status) return "no signal";
  return status;
}

// "14:30 · 27 Apr" — en-ZA-friendly compact stamp
function fmtSync(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm · dd MMM");
  } catch {
    return "—";
  }
}

export default function ConfigPage() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [togglingSource, setTogglingSource] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_sync_status")
      .select(
        "id, source, display_name, category, enabled, endpoint, latency_ms, last_synced_at, last_status, error_message, record_count, updated_at"
      )
      .order("category", { ascending: true, nullsFirst: false })
      .order("source", { ascending: true });

    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data as IntegrationRow[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleEnabled(row: IntegrationRow) {
    if (togglingSource) return;
    const next = !(row.enabled ?? false);

    // Optimistic UI
    setTogglingSource(row.source);
    setRows((prev) =>
      prev.map((r) =>
        r.source === row.source ? { ...r, enabled: next } : r
      )
    );

    const { error: err } = await supabase
      .from("hub_sync_status")
      .update({ enabled: next })
      .eq("source", row.source);

    if (err) {
      // Roll back
      setRows((prev) =>
        prev.map((r) =>
          r.source === row.source ? { ...r, enabled: !next } : r
        )
      );
      setError(`Toggle failed for ${row.source}: ${err.message}`);
    }
    setTogglingSource(null);
  }

  // Group + sort rows by CATEGORY_ORDER. null/unknown categories → "other".
  const sections = useMemo(() => {
    const buckets = new Map<string, IntegrationRow[]>();
    for (const r of rows) {
      const raw = (r.category ?? "other").toLowerCase();
      const known = CATEGORY_ORDER.find((c) => c.key === raw);
      const key = known ? known.key : "other";
      const list = buckets.get(key) ?? [];
      list.push(r);
      buckets.set(key, list);
    }
    return CATEGORY_ORDER
      .map(({ key, label }) => ({
        key,
        label,
        rows: buckets.get(key) ?? [],
      }))
      .filter((section) => section.rows.length > 0);
  }, [rows]);

  const totalEnabled = rows.filter((r) => r.enabled).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <Settings2 className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              Config &amp; Integrations
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Single pane for every connected service in OS³ — MCPs, APIs,
              tunnels, schedulers, ingest pipelines. Heartbeat dot, last sync,
              and per-row enable toggle.
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
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-4 rounded-lg border border-edge bg-graphite px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mute">
        <span>
          <span className="font-display text-base font-bold text-ink">
            {rows.length}
          </span>{" "}
          integrations
        </span>
        <span>
          <span className="font-display text-base font-bold text-emerald-400">
            {totalEnabled}
          </span>{" "}
          enabled
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink-dim">
            {rows.length - totalEnabled}
          </span>{" "}
          standby
        </span>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* ── Sections ─────────────────────────────────────────────────── */}
      <div className="mt-8 space-y-8">
        {loading && rows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            Loading integrations…
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            No integrations seeded yet. Run migration 003.
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.key}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
                  {section.label}
                </h2>
                <span className="font-mono text-[10px] text-ink-ghost">
                  {section.rows.length}
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-edge bg-graphite">
                {section.rows.map((row, idx) => {
                  const isToggling = togglingSource === row.source;
                  const enabled = row.enabled ?? false;
                  return (
                    <div
                      key={row.id}
                      className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 ${
                        idx > 0 ? "border-t border-edge" : ""
                      }`}
                    >
                      {/* Heartbeat dot */}
                      <div
                        className="flex h-8 w-8 items-center justify-center"
                        title={`status: ${statusLabel(row.last_status)}`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${statusDotClass(
                            row.last_status
                          )} ${
                            row.last_status === "success" ||
                            row.last_status === "ok"
                              ? "animate-pulse-dot"
                              : ""
                          }`}
                        />
                      </div>

                      {/* Name + source key + endpoint + meta — stacked, never truncated */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-medium text-ink break-words">
                            {row.display_name ?? row.source}
                          </span>
                          <span className="font-mono text-[11px] text-ink-mute break-all">
                            {row.source}
                          </span>
                        </div>
                        {row.endpoint && (
                          <div className="mt-0.5 font-mono text-[11px] text-ink-mute break-all">
                            {row.endpoint}
                          </div>
                        )}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-mute">
                          <span>last sync {fmtSync(row.last_synced_at)}</span>
                          {typeof row.latency_ms === "number" && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{row.latency_ms} ms</span>
                            </>
                          )}
                          {typeof row.record_count === "number" && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{row.record_count} rows</span>
                            </>
                          )}
                        </div>
                        {row.error_message && (
                          <div className="mt-1 font-mono text-[11px] text-rose-400 break-words">
                            {row.error_message}
                          </div>
                        )}
                      </div>

                      {/* Enable toggle */}
                      <button
                        type="button"
                        onClick={() => void toggleEnabled(row)}
                        disabled={isToggling}
                        aria-pressed={enabled}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          enabled
                            ? "border-emerald-400/40 bg-emerald-500/20"
                            : "border-edge bg-steel"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full transition-transform ${
                            enabled
                              ? "translate-x-6 bg-emerald-400"
                              : "translate-x-1 bg-ink-mute"
                          }`}
                        />
                        <span className="sr-only">
                          {enabled ? "Disable" : "Enable"} {row.source}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Footer note ──────────────────────────────────────────────── */}
      <p className="mt-10 text-[11px] text-ink-ghost">
        Data source: <span className="font-mono">hub_sync_status</span> ·
        Project <span className="font-mono">uxeolplwhtyyefpmwktw</span> ·
        Phase 1 · Manual refresh only — pollers will write back into this table
        in Phase 3.
      </p>
    </div>
  );
}
