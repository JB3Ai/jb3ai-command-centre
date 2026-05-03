import { useEffect, useState, useCallback } from "react";
import {
  Newspaper, Star, ExternalLink, RefreshCw,
  Filter, Circle, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
type NewsItem = {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  source_ref: string | null;
  summary: string | null;
  published_at: string | null;
  read: boolean;
  starred: boolean;
  tags: string[];
  created_at: string;
};

// ── Source display config ──────────────────────────────────────────────────
const SOURCE_META: Record<string, { label: string; colour: string }> = {
  "rss:hn":       { label: "HN",        colour: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  "rss:tc-ai":    { label: "TechCrunch",colour: "bg-green-500/20  text-green-300  border-green-500/30"  },
  "rss:verge-ai": { label: "The Verge", colour: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "rss:vb-ai":    { label: "VentureBeat",colour:"bg-blue-500/20   text-blue-300   border-blue-500/30"   },
  "rss:dl-batch": { label: "The Batch", colour: "bg-cyan-500/20   text-cyan-300   border-cyan-500/30"   },
  "gmail:ai-news":{ label: "Gmail",     colour: "bg-red-500/20    text-red-300    border-red-500/30"     },
};

function sourceMeta(source: string | null) {
  if (!source) return { label: source ?? "?", colour: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" };
  return SOURCE_META[source] ?? { label: source, colour: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" };
}

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return `${Math.floor(diff / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function NewsPage() {
  const [items, setItems]       = useState<NewsItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "unread" | "starred">("unread");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sources, setSources]   = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("hub_news_items")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setItems(data as NewsItem[]);
      const seen = new Set<string>();
      data.forEach((d: NewsItem) => { if (d.source) seen.add(d.source); });
      setSources(Array.from(seen).sort());
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered view
  const visible = items.filter((item) => {
    if (filter === "unread"  && item.read)    return false;
    if (filter === "starred" && !item.starred) return false;
    if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
    return true;
  });

  // Optimistic star toggle
  const toggleStar = async (id: string, current: boolean) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, starred: !current } : i));
    await supabase.from("hub_news_items").update({ starred: !current }).eq("id", id);
  };

  // Mark read on click-through
  const markRead = async (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, read: true } : i));
    await supabase.from("hub_news_items").update({ read: true }).eq("id", id);
  };

  const unreadCount = items.filter((i) => !i.read).length;


  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-[#2AF1FF]" />
          <h1 className="font-['Orbitron'] text-lg font-semibold tracking-wide">News</h1>
          {unreadCount > 0 && (
            <Badge className="bg-[#2AF1FF]/15 text-[#2AF1FF] border-[#2AF1FF]/30 font-['Orbitron'] text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <Button
          variant="ghost" size="sm"
          className="text-zinc-400 hover:text-white"
          onClick={load}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-white/10 bg-black/20">
        {/* Read state */}
        <div className="flex items-center gap-1 mr-2">
          {(["all", "unread", "starred"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "bg-[#2AF1FF]/15 text-[#2AF1FF] border border-[#2AF1FF]/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Source filter */}
        {sources.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-3 h-3 text-zinc-500" />
            <button
              onClick={() => setSourceFilter("all")}
              className={cn(
                "px-2 py-1 rounded text-xs transition-colors",
                sourceFilter === "all"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              All sources
            </button>
            {sources.map((s) => {
              const meta = sourceMeta(s);
              return (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s === sourceFilter ? "all" : s)}
                  className={cn(
                    "px-2 py-0.5 rounded border text-xs transition-colors",
                    sourceFilter === s ? meta.colour : "text-zinc-500 border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Feed ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-4 h-4 mt-1 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/5 rounded" />
                  <Skeleton className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
            <Newspaper className="w-10 h-10 opacity-30" />
            <p className="text-sm">
              {items.length === 0
                ? "No news yet — run news_rss_poller in Kestra to fetch the first batch."
                : "Nothing matches the current filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {visible.map((item) => {
              const meta = sourceMeta(item.source);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 px-6 py-3 group hover:bg-white/[0.03] transition-colors",
                    item.read && "opacity-50"
                  )}
                >
                  {/* Read indicator */}
                  <button
                    className="mt-1 shrink-0 text-zinc-600 hover:text-[#2AF1FF] transition-colors"
                    onClick={() => !item.read && markRead(item.id)}
                    title={item.read ? "Read" : "Mark read"}
                  >
                    {item.read
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : <Circle className="w-3.5 h-3.5 fill-[#2AF1FF]/30 text-[#2AF1FF]" />
                    }
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Badge className={cn("text-[10px] px-1.5 py-0 border shrink-0", meta.colour)}>
                        {meta.label}
                      </Badge>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markRead(item.id)}
                          className="text-sm font-medium text-zinc-200 hover:text-white leading-snug group-hover:underline underline-offset-2 line-clamp-2"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-zinc-200 leading-snug line-clamp-2">
                          {item.title}
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-600">
                        {relativeTime(item.published_at ?? item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleStar(item.id, item.starred)}
                      className={cn(
                        "p-1 rounded transition-colors",
                        item.starred
                          ? "text-yellow-400 hover:text-yellow-300"
                          : "text-zinc-600 hover:text-yellow-400"
                      )}
                      title={item.starred ? "Unstar" : "Star"}
                    >
                      <Star className={cn("w-3.5 h-3.5", item.starred && "fill-current")} />
                    </button>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markRead(item.id)}
                        className="p-1 rounded text-zinc-600 hover:text-white transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
