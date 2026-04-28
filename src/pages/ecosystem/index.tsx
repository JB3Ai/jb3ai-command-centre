import { useEffect, useMemo, useState } from "react";
import { Network, RefreshCw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

/**
 * OS³ Command Centre — Connected Ecosystem (Task #15)
 *
 * Birds-eye view of every connected service. Reads the same
 * `hub_sync_status` table as CONFIG, but renders as a category-tiled
 * "node grid" — each node = a service with heartbeat + last-sync.
 *
 * For drill-down + per-row toggle, go to /config. This page is
 * read-only and meant to be glanceable.
 */

type EcoRow = {
  id: string;
  source: string;
  display_name?: string | null;
  category?: string | null;
  enabled?: boolean | null;
  endpoint?: string | null;
  latency_ms?: number | null;
  last_synced_at?: string | null;
  last_status?: string | null;
};

const CATEGORY_ORDER: Array<{ key: string; label: string }> = [
  { key: "mcp", label: "MCPs" },
  { key: "api", label: "APIs" },
  { key: "tunnel", label: "Tunnels" },
  { key: "scheduler", label: "Schedulers" },
  { key: "db", label: "Database" },
  { key: "ingest", label: "Ingest pipelines" },
  { key: "script", label: "Scripts" },
  { key: "other", label: "Other" },
];

function statusDotClass(status?: string | null, enabled?: boolean | null): string {
  if (enabled === false) return "bg-ink-ghost";
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

function fmtSync(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm · dd MMM");
  } catch {
    return "—";
  }
}

export default function EcosystemPage() {
  const [rows, setRows] = useState<EcoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_sync_status")
      .select(
        "id, source, display_name, category, enabled, endpoint, latency_ms, last_synced_at, last_status",
      )
      .order("category", { ascending: true, nullsFirst: false })
      .order("source", { ascending: true });
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data as EcoRow[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const sections = useMemo(() => {
    const buckets = new Map<string, EcoRow[]>();
    for (const r of rows) {
      const raw = (r.category ?? "other").toLowerCase();
      const known = CATEGORY_ORDER.find((c) => c.key === raw);
      const key = known ? known.key : "other";
      const arr = buckets.get(key) ?? [];
      arr.push(r);
      buckets.set(key, arr);
    }
    return CATEGORY_ORDER.map(({ key, label }) => ({
      key,
      label,
      rows: buckets.get(key) ?? [],
    })).filter((s) => s.rows.length > 0);
  }, [rows]);

  const totals = useMemo(() => {
    const enabled = rows.filter((r) => r.enabled).length;
    const healthy = rows.filter((r) => {
      const s = (r.last_status ?? "").toLowerCase();
      return s === "success" || s === "ok" || s === "healthy";
    }).length;
    const error = rows.filter((r) => {
      const s = (r.last_status ?? "").toLowerCase();
      return s === "error" || s === "failed" || s === "fail";
    }).length;
    return { count: rows.length, enabled, healthy, error };
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <Network className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              Connected Ecosystem
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Glanceable view of every service Command Centre talks to. For per-row
              toggles + edit, head to <span className="font-mono">/config</span>.
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

      {/* Summary */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-edge bg-graphite px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mute">
        <span>
          <span className="font-display text-base font-bold text-ink">{totals.count}</span>{" "}
          services
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink">{totals.enabled}</span>{" "}
          enabled
        </span>
        <span>
          <span className="font-display text-base font-bold text-emerald-400">{totals.healthy}</span>{" "}
          healthy
        </span>
        <span>
          <span className="font-display text-base font-bold text-rose-400">{totals.error}</span>{" "}
          erroring
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Sections — each is a tiled grid of node cards */}
      <div className="mt-8 space-y-8">
        {loading && rows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            Loading services…
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            No services connected yet.
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.rows.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-lg border bg-graphite px-4 py-3 ${
                      row.enabled === false
                        ? "border-edge opacity-60"
                        : "border-edge"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass(
                          row.last_status,
                          row.enabled,
                        )}`}
                        title={`status: ${row.last_status ?? "no signal"}${row.enabled === false ? " (disabled)" : ""}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink break-words">
                          {row.display_name ?? row.source}
                        </div>
                        <div className="mt-0.5 break-all font-mono text-[11px] text-ink-mute">
                          {row.source}
                        </div>
                        {row.endpoint && (
                          <div className="mt-1 break-all font-mono text-[11px] text-ink-mute">
                            {row.endpoint}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-ink-mute">
                          <span>last sync {fmtSync(row.last_synced_at)}</span>
                          {typeof row.latency_ms === "number" && <span>· {row.latency_ms} ms</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <p className="mt-10 text-[11px] text-ink-ghost">
        Source: <span className="font-mono">hub_sync_status</span> · same data as
        the CONFIG panel, optimised for at-a-glance.
      </p>
    </div>
  );
}
