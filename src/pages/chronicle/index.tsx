import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, BarChart2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Chronicle = {
  id: string;
  for_month: string;        // YYYY-MM-DD (first of month)
  title: string | null;
  highlights: string | null;
  metrics: Record<string, unknown>;
  body_md: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

function monthLabel(iso: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-ZA", {
    month: "long", year: "numeric",
  });
}

function MetricPill({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col items-center bg-white/5 rounded-lg px-4 py-3 min-w-[80px]">
      <span className="font-['Orbitron'] text-lg font-semibold text-[#2AF1FF]">
        {typeof value === "number" ? value : String(value)}
      </span>
      <span className="text-[10px] text-zinc-500 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function ChroniclePage() {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [selected, setSelected]     = useState<Chronicle | null>(null);
  const [loading, setLoading]        = useState(true);
  const [refreshing, setRefreshing]  = useState(false);

  const load = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("hub_monthly_chronicles")
      .select("*")
      .order("for_month", { ascending: false })
      .limit(24);

    if (!error && data && data.length > 0) {
      setChronicles(data as Chronicle[]);
      setSelected(data[0] as Chronicle);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const metrics = selected?.metrics as Record<string, unknown> | null;

  return (
    <div className="flex h-full">
      {/* ── Archive sidebar ─────────────────────────────────────────── */}
      <div className="w-52 shrink-0 border-r border-white/10 flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#2AF1FF]" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Archive</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mx-3 my-1.5 h-8 bg-white/5 rounded" />
            ))
          ) : chronicles.length === 0 ? (
            <p className="text-xs text-zinc-600 p-4">No chronicles yet — run chronicle_generator in Kestra.</p>
          ) : (
            chronicles.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between group transition-colors",
                  selected?.id === c.id
                    ? "bg-[#2AF1FF]/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div>
                  <div className="font-medium">{monthLabel(c.for_month)}</div>
                  {c.is_current && (
                    <Badge className="text-[9px] px-1 py-0 bg-[#2AF1FF]/15 text-[#2AF1FF] border-[#2AF1FF]/30 mt-0.5">
                      Current
                    </Badge>
                  )}
                </div>
                <ChevronRight className={cn(
                  "w-3.5 h-3.5 transition-opacity",
                  selected?.id === c.id ? "opacity-100 text-[#2AF1FF]" : "opacity-0 group-hover:opacity-50"
                )} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chronicle body ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h1 className="font-['Orbitron'] text-lg font-semibold">
              {selected ? monthLabel(selected.for_month) : "Monthly Chronicle"}
            </h1>
            {selected?.highlights && (
              <p className="text-xs text-zinc-500 mt-0.5">{selected.highlights}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={load} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-20 bg-white/5 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-4 w-full bg-white/5 rounded" />
            <Skeleton className="h-4 w-5/6 bg-white/5 rounded" />
            <Skeleton className="h-4 w-4/6 bg-white/5 rounded" />
          </div>
        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
            <CalendarDays className="w-10 h-10 opacity-30" />
            <p className="text-sm">No chronicles yet — run chronicle_generator in Kestra first.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-2xl">
            {/* Metrics row */}
            {metrics && Object.keys(metrics).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Month at a Glance</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metrics.tasks_completed !== undefined && (
                    <MetricPill label="Tasks Done" value={metrics.tasks_completed} />
                  )}
                  {metrics.deploys !== undefined && (
                    <MetricPill label="Deploys" value={metrics.deploys} />
                  )}
                  {metrics.daily_reviews !== undefined && (
                    <MetricPill label="Daily Reviews" value={metrics.daily_reviews} />
                  )}
                  {metrics.avg_mood !== undefined && (
                    <MetricPill label="Avg Mood" value={`${metrics.avg_mood}/5`} />
                  )}
                  {metrics.starred_news !== undefined && (
                    <MetricPill label="Starred News" value={metrics.starred_news} />
                  )}
                </div>
              </div>
            )}

            {/* AI narrative */}
            {selected.body_md ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Chronicle</span>
                  <Badge className="text-[9px] bg-purple-500/10 text-purple-300 border-purple-500/20">
                    claude-sonnet-4-6
                  </Badge>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  {selected.body_md.split("\n\n").map((para, i) => (
                    <p key={i} className="text-zinc-300 leading-relaxed text-sm mb-3">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No narrative generated yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
