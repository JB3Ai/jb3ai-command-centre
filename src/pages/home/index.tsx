import { useEffect, useMemo, useState } from "react";
import {
  Home as HomeIcon,
  RefreshCw,
  Calendar,
  Mail,
  ListChecks,
  Sparkles,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import {
  supabase,
  type HubTask,
  type HubCalendarEvent,
  type HubEmail,
  type HubBriefing,
} from "@/lib/supabase";

/**
 * OS³ Command Centre — HOME (Task #15)
 *
 * The daily landing surface. Aggregates five live data sources into one
 * scannable view, in priority order:
 *   1. Today's calendar          → hub_calendar  (next 5 events from now)
 *   2. Action-required emails    → hub_emails    (unread, latest 5)
 *   3. Top tasks                 → hub_tasks     (open, priority + due asc, 8)
 *   4. Daily intention           → hub_daily_intentions (today; inline form)
 *   5. Latest briefing           → hub_briefings (newest single row)
 *
 * Manual refresh only — no auto-polling. Brand: cyan only on icon halo +
 * heartbeat-style indicators; gold reserved for money/exposure callouts
 * (none on this page yet).
 */

type DailyIntention = {
  id: string;
  for_date: string;
  intention: string;
  created_at?: string;
};

const todayStr = () => format(new Date(), "yyyy-MM-dd");

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm · dd MMM");
  } catch {
    return "—";
  }
}

function fmtTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "—";
  }
}

function priorityClass(p?: number): string {
  if (p === 1) return "border-rose-400/40 bg-rose-500/10 text-rose-300";
  if (p === 2) return "border-amber-400/40 bg-amber-500/10 text-amber-300";
  if (p === 3) return "border-cyan-30 bg-cyan-10 text-cyan";
  return "border-edge bg-steel text-ink-mute";
}

function priorityLabel(p?: number): string {
  if (p === 1) return "Urgent";
  if (p === 2) return "High";
  if (p === 3) return "Normal";
  return "Low";
}

export default function HomePage() {
  const [calendar, setCalendar] = useState<HubCalendarEvent[]>([]);
  const [emails, setEmails] = useState<HubEmail[]>([]);
  const [tasks, setTasks] = useState<HubTask[]>([]);
  const [intention, setIntention] = useState<DailyIntention | null>(null);
  const [briefing, setBriefing] = useState<HubBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [intentionDraft, setIntentionDraft] = useState("");
  const [savingIntention, setSavingIntention] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [cal, em, tk, di, br] = await Promise.all([
        supabase
          .from("hub_calendar")
          .select("*")
          .gte("start_time", startOfToday.toISOString())
          .order("start_time", { ascending: true })
          .limit(5),
        supabase
          .from("hub_emails")
          .select("*")
          .eq("is_unread", true)
          .order("received_at", { ascending: false })
          .limit(5),
        supabase
          .from("hub_tasks")
          .select("*")
          .neq("status", "closed")
          .order("priority", { ascending: true, nullsFirst: false })
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(8),
        supabase
          .from("hub_daily_intentions")
          .select("*")
          .eq("for_date", todayStr())
          .maybeSingle(),
        supabase
          .from("hub_briefings")
          .select("*")
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cal.error) throw cal.error;
      if (em.error) throw em.error;
      if (tk.error) throw tk.error;

      setCalendar((cal.data as HubCalendarEvent[]) ?? []);
      setEmails((em.data as HubEmail[]) ?? []);
      setTasks((tk.data as HubTask[]) ?? []);
      setIntention((di.data as DailyIntention | null) ?? null);
      setBriefing((br.data as HubBriefing | null) ?? null);
      setLastRefresh(new Date());
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }

  async function saveIntention() {
    const text = intentionDraft.trim();
    if (!text) return;
    setSavingIntention(true);
    const { data, error: err } = await supabase
      .from("hub_daily_intentions")
      .upsert({ for_date: todayStr(), intention: text }, { onConflict: "for_date" })
      .select()
      .single();
    if (err) {
      setError(`Save failed: ${err.message}`);
    } else if (data) {
      setIntention(data as DailyIntention);
      setIntentionDraft("");
    }
    setSavingIntention(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter((t) => t.due_date && new Date(t.due_date).getTime() < now).length;
  }, [tasks]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <HomeIcon className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              {format(new Date(), "EEEE, dd MMM").toUpperCase()}
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Today at a glance — calendar, inbox, tasks, intention, and the latest
              briefing. Manual refresh only.
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

      {/* ── Summary strip ────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-edge bg-graphite px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mute">
        <span>
          <span className="font-display text-base font-bold text-ink">
            {calendar.length}
          </span>{" "}
          events
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink">
            {emails.length}
          </span>{" "}
          unread
        </span>
        <span>
          <span className="font-display text-base font-bold text-ink">
            {tasks.length}
          </span>{" "}
          tasks
        </span>
        <span>
          <span className={`font-display text-base font-bold ${overdueCount > 0 ? "text-rose-400" : "text-ink-dim"}`}>
            {overdueCount}
          </span>{" "}
          overdue
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: calendar + emails */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Today's calendar */}
          <Section icon={Calendar} title="Today">
            {loading && calendar.length === 0 ? (
              <Empty>Loading…</Empty>
            ) : calendar.length === 0 ? (
              <Empty>Nothing on the calendar.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {calendar.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-[auto_1fr] items-start gap-4 px-4 py-3">
                    <div className="flex flex-col items-start font-mono text-[11px] text-ink-mute">
                      <span className="text-ink">{fmtTime(ev.start_time)}</span>
                      <span>{fmtTime(ev.end_time)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink break-words">
                        {ev.title || "(no title)"}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-mute">
                        {ev.calendar_name && <span>{ev.calendar_name}</span>}
                        {ev.location && <span>· {ev.location}</span>}
                        {ev.meet_link && (
                          <a
                            href={ev.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan hover:underline"
                          >
                            · meet link
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 2. Unread emails */}
          <Section icon={Mail} title="Action required">
            {loading && emails.length === 0 ? (
              <Empty>Loading…</Empty>
            ) : emails.length === 0 ? (
              <Empty>Inbox is clear.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {emails.map((m) => (
                  <li key={m.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="text-sm font-medium text-ink break-words">
                        {m.subject || "(no subject)"}
                      </span>
                      <span className="font-mono text-[11px] text-ink-mute">
                        {fmtDateTime(m.received_at)}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-mute break-words">
                      {m.sender || m.sender_email || "—"}
                    </div>
                    {m.snippet && (
                      <div className="mt-1 line-clamp-2 text-[12px] text-ink-dim">
                        {m.snippet}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 3. Top tasks */}
          <Section icon={ListChecks} title="Top tasks">
            {loading && tasks.length === 0 ? (
              <Empty>Loading…</Empty>
            ) : tasks.length === 0 ? (
              <Empty>All clear.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {tasks.map((t) => {
                  const isOverdue =
                    t.due_date && new Date(t.due_date).getTime() < Date.now();
                  return (
                    <li
                      key={t.id}
                      className="grid grid-cols-[1fr_auto] items-start gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink break-words">
                          {t.title || "—"}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-ink-mute">
                          {t.list_name && <span>{t.list_name}</span>}
                          {t.due_date && (
                            <span className={isOverdue ? "text-rose-400" : ""}>
                              · due {fmtDateTime(t.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${priorityClass(t.priority)}`}
                      >
                        {priorityLabel(t.priority)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        {/* Right column: intention + briefing */}
        <div className="space-y-6">
          {/* 4. Daily intention */}
          <Section icon={Sparkles} title="Today's intention">
            {intention ? (
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed text-ink">
                  {intention.intention}
                </p>
                <p className="mt-2 font-mono text-[10px] text-ink-ghost">
                  set {fmtDateTime(intention.created_at)}
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-3">
                <p className="text-[12px] text-ink-dim">
                  What's the one thing today is for?
                </p>
                <textarea
                  value={intentionDraft}
                  onChange={(e) => setIntentionDraft(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-sm border border-edge bg-steel px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:border-cyan-30 focus:outline-none"
                  placeholder="One line. Keep it sharp."
                />
                <button
                  type="button"
                  onClick={() => void saveIntention()}
                  disabled={savingIntention || !intentionDraft.trim()}
                  className="w-full rounded-sm border border-edge bg-graphite px-3 py-1.5 text-xs font-medium text-ink hover:border-cyan-30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingIntention ? "Saving…" : "Set intention"}
                </button>
              </div>
            )}
          </Section>

          {/* 5. Latest briefing */}
          <Section icon={BookOpen} title="Latest briefing">
            {loading && !briefing ? (
              <Empty>Loading…</Empty>
            ) : briefing ? (
              <div className="px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-sm bg-cyan-15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan">
                    {briefing.briefing_type}
                  </span>
                  <span className="font-mono text-[11px] text-ink-mute">
                    {fmtDateTime(briefing.generated_at)}
                  </span>
                </div>
                {briefing.title && (
                  <div className="mt-2 text-sm font-medium text-ink">
                    {briefing.title}
                  </div>
                )}
                {briefing.body_md && (
                  <div className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-ink-dim">
                    {briefing.body_md}
                  </div>
                )}
              </div>
            ) : (
              <Empty>No briefing yet.</Empty>
            )}
          </Section>
        </div>
      </div>

      <p className="mt-10 text-[11px] text-ink-ghost">
        Sources: <span className="font-mono">hub_calendar</span> ·{" "}
        <span className="font-mono">hub_emails</span> ·{" "}
        <span className="font-mono">hub_tasks</span> ·{" "}
        <span className="font-mono">hub_daily_intentions</span> ·{" "}
        <span className="font-mono">hub_briefings</span>
      </p>
    </div>
  );
}

// ── shared subcomponents ────────────────────────────────────────────────
import type { LucideIcon } from "lucide-react";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-ink-mute" strokeWidth={1.75} />
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
          {title}
        </h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-edge bg-graphite">
        {children}
      </div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-6 text-center text-[12px] text-ink-dim">{children}</div>
  );
}
