import { useEffect, useMemo, useState } from "react";
import { ToggleLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase, type HubSubscription } from "@/lib/supabase";

/**
 * OS³ Command Centre — Subscriptions (Task #15)
 *
 * Reads hub_subscriptions, groups by category, shows status light, monthly
 * cost, next renewal. Total monthly + annual exposure shown in gold (it's
 * money out the door).
 */

function statusDotClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "live":
      return "bg-emerald-400";
    case "trial":
    case "pending":
      return "bg-amber-400";
    case "paused":
      return "bg-cyan";
    case "cancelled":
    case "canceled":
    case "expired":
      return "bg-rose-400";
    default:
      return "bg-ink-ghost";
  }
}

function fmtMoney(n?: number | null, currency?: string | null): string {
  if (n == null) return "—";
  const cur = (currency ?? "ZAR").toUpperCase();
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${cur} ${n}`;
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yy");
  } catch {
    return "—";
  }
}

// monthly ZAR already stored in DB; billing_cycle used only as fallback label
function monthlyZarEstimate(s: HubSubscription): number {
  if (s.monthly_zar != null) return s.monthly_zar;
  if (s.monthly_usd != null) return s.monthly_usd * 19; // rough USD→ZAR
  return 0;
}

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<HubSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_subscriptions")
      .select("*")
      .order("category", { ascending: true, nullsFirst: false })
      .order("service_name", { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setRows((data as HubSubscription[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    const monthlyZar = rows
      .filter((r) => (r.status ?? "").toLowerCase() === "active")
      .reduce((sum, r) => sum + monthlyZarEstimate(r), 0);
    const active = rows.filter((r) => (r.status ?? "").toLowerCase() === "active").length;
    const cancelled = rows.filter((r) => {
      const s = (r.status ?? "").toLowerCase();
      return s === "cancelled" || s === "canceled" || s === "expired";
    }).length;
    return { monthlyZar, annualZar: monthlyZar * 12, active, cancelled, count: rows.length };
  }, [rows]);

  const grouped = useMemo(() => {
    const by = new Map<string, HubSubscription[]>();
    for (const r of rows) {
      const k = r.category ?? "Uncategorised";
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
            <ToggleLeft className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              Subscriptions
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Every paid service — status, monthly cost, next renewal. Grouped
              by category.
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

      {/* Summary strip */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-edge bg-graphite px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mute">
        <span>
          <span className="font-display text-base font-bold text-ink">{totals.count}</span>{" "}
          services
        </span>
        <span>
          <span className="font-display text-base font-bold text-emerald-400">{totals.active}</span>{" "}
          active
        </span>
        <span>
          <span className="font-display text-base font-bold text-rose-400">{totals.cancelled}</span>{" "}
          cancelled
        </span>
        <span>
          <span className="font-display text-base font-bold text-gold">{fmtMoney(totals.monthlyZar, "ZAR")}</span>{" "}
          / mo
        </span>
        <span>
          <span className="font-display text-base font-bold text-gold">{fmtMoney(totals.annualZar, "ZAR")}</span>{" "}
          / yr
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Grouped list */}
      <div className="mt-8 space-y-8">
        {loading && rows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            Loading subscriptions…
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            No subscriptions yet.
          </div>
        ) : (
          grouped.map(([cat, list]) => (
            <section key={cat}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
                  {cat}
                </h2>
                <span className="font-mono text-[10px] text-ink-ghost">{list.length}</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-edge bg-graphite">
                {list.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 ${
                      idx > 0 ? "border-t border-edge" : ""
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass(s.status)}`}
                      title={`status: ${s.status ?? "unknown"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-ink break-words">{s.service_name}</span>
                        {s.tier && (
                          <span className="font-mono text-[11px] text-ink-mute">{s.tier}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-mute">
                        {s.billing_cycle && <span>{s.billing_cycle}</span>}
                        {s.renewal_date && <span>· renews {fmtDate(s.renewal_date)}</span>}
                        {s.payment_method && <span>· {s.payment_method}</span>}
                      </div>
                      {s.notes && (
                        <div className="mt-1 line-clamp-1 text-[12px] text-ink-dim">
                          {s.notes}
                        </div>
                      )}
                    </div>
                    {(s.monthly_zar != null || s.monthly_usd != null) && (
                      <span className="shrink-0 font-display text-sm font-semibold text-gold">
                        {s.monthly_zar != null
                          ? fmtMoney(s.monthly_zar, "ZAR")
                          : fmtMoney(s.monthly_usd, "USD")}
                        <span className="ml-1 font-mono text-[10px] font-normal text-ink-ghost">/mo</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <p className="mt-10 text-[11px] text-ink-ghost">
        Source: <span className="font-mono">hub_subscriptions</span>. Monthly
        rollup estimates annual/quarterly/weekly cycles by simple division.
      </p>
    </div>
  );
}
