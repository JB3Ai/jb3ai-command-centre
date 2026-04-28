import { useEffect, useMemo, useState } from "react";
import { FolderGit2, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase, type HubDeploy } from "@/lib/supabase";

/**
 * OS³ Command Centre — Projects (Task #15)
 *
 * Recent Vercel deploys grouped by project, plus a summary strip.
 * cPanel + GitHub commit-activity heatmap deferred to Phase 4.
 */

function stateDotClass(state?: string | null): string {
  switch ((state ?? "").toLowerCase()) {
    case "ready":
    case "succeeded":
      return "bg-emerald-400";
    case "building":
    case "queued":
    case "initializing":
      return "bg-amber-400";
    case "error":
    case "failed":
      return "bg-rose-400";
    case "canceled":
    case "cancelled":
      return "bg-ink-ghost";
    default:
      return "bg-ink-ghost";
  }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm · dd MMM");
  } catch {
    return "—";
  }
}

function fmtDuration(ms?: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

export default function ProjectsPage() {
  const [rows, setRows] = useState<HubDeploy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_deploys")
      .select("*")
      .order("deployed_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (err) {
      setError(err.message);
    } else {
      setRows((data as HubDeploy[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => {
    const ready = rows.filter((r) => (r.status ?? "").toLowerCase() === "ready").length;
    const errored = rows.filter((r) => {
      const s = (r.status ?? "").toLowerCase();
      return s === "error" || s === "failed";
    }).length;
    const projects = new Set(rows.map((r) => r.project_name).filter(Boolean));
    return { ready, errored, projects: projects.size, count: rows.length };
  }, [rows]);

  const grouped = useMemo(() => {
    const by = new Map<string, HubDeploy[]>();
    for (const r of rows) {
      const k = r.project_name ?? "(unnamed)";
      const arr = by.get(k) ?? [];
      arr.push(r);
      by.set(k, arr);
    }
    return Array.from(by.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <FolderGit2 className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              Projects
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Recent Vercel deploys across every connected project. cPanel +
              GitHub commit activity follow in Phase 4.
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
          <span className="font-display text-base font-bold text-ink">{summary.projects}</span>{" "}
          projects
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink">{summary.count}</span>{" "}
          deploys
        </span>
        <span>
          <span className="font-display text-base font-bold text-emerald-400">{summary.ready}</span>{" "}
          ready
        </span>
        <span>
          <span className="font-display text-base font-bold text-rose-400">{summary.errored}</span>{" "}
          errored
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Grouped deploys */}
      <div className="mt-8 space-y-8">
        {loading && rows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            Loading deploys…
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            No deploys synced yet. The Vercel poller will populate this on its next run.
          </div>
        ) : (
          grouped.map(([proj, list]) => (
            <section key={proj}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
                  {proj}
                </h2>
                <span className="font-mono text-[10px] text-ink-ghost">{list.length}</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-edge bg-graphite">
                {list.slice(0, 10).map((d, idx) => (
                  <div
                    key={d.id}
                    className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 ${
                      idx > 0 ? "border-t border-edge" : ""
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${stateDotClass(d.status)}`}
                      title={`state: ${d.status ?? "unknown"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-ink break-words">
                          {d.commit_message || "(no message)"}
                        </span>
                        {d.branch && (
                          <span className="rounded-sm bg-cyan-15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan">
                            {d.branch}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-mute">
                        <span>deployed {fmtDateTime(d.deployed_at)}</span>
                        {typeof d.duration_ms === "number" && (
                          <span>· built in {fmtDuration(d.duration_ms)}</span>
                        )}
                        {d.url && (
                          <a
                            href={d.url.startsWith("http") ? d.url : `https://${d.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" strokeWidth={2} />
                            open
                          </a>
                        )}
                      </div>
                      {d.error_message && (
                        <div className="mt-1 line-clamp-2 font-mono text-[11px] text-rose-400">
                          {d.error_message}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 rounded-sm border border-edge bg-steel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
                      {d.status ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <p className="mt-10 text-[11px] text-ink-ghost">
        Source: <span className="font-mono">hub_deploys</span> · pollers fill
        this on every Vercel webhook.
      </p>
    </div>
  );
}
