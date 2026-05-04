import { useEffect, useState, useCallback } from "react";
import {
  Image, Video, Music, FileText, Paintbrush, Package,
  Plus, ExternalLink, RefreshCw, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  title: string;
  kind: "image" | "video" | "audio" | "copy" | "design" | "other";
  status: "idea" | "prompt-ready" | "rendering" | "review" | "done" | "archived";
  prompt: string | null;
  asset_url: string | null;
  thumb_url: string | null;
  notes: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS: { id: MediaItem["status"]; label: string; colour: string }[] = [
  { id: "idea",         label: "Idea",         colour: "border-zinc-600" },
  { id: "prompt-ready", label: "Prompt Ready",  colour: "border-blue-500/50" },
  { id: "rendering",    label: "Rendering",     colour: "border-yellow-500/50" },
  { id: "review",       label: "Review",        colour: "border-purple-500/50" },
  { id: "done",         label: "Done",          colour: "border-green-500/50" },
];

const KIND_ICON: Record<MediaItem["kind"], React.ElementType> = {
  image:  Image,
  video:  Video,
  audio:  Music,
  copy:   FileText,
  design: Paintbrush,
  other:  Package,
};

const KIND_COLOUR: Record<MediaItem["kind"], string> = {
  image:  "text-cyan-400",
  video:  "text-purple-400",
  audio:  "text-green-400",
  copy:   "text-yellow-400",
  design: "text-pink-400",
  other:  "text-zinc-400",
};

function KindBadge({ kind }: { kind: MediaItem["kind"] }) {
  const Icon = KIND_ICON[kind];
  return (
    <span className={cn("flex items-center gap-1 text-[10px]", KIND_COLOUR[kind])}>
      <Icon className="w-3 h-3" />
      {kind}
    </span>
  );
}

function MediaCard({
  item,
  onMove,
  onDelete,
}: {
  item: MediaItem;
  onMove: (id: string, status: MediaItem["status"]) => void;
  onDelete: (id: string) => void;
}) {
  const nextStatus: Record<MediaItem["status"], MediaItem["status"] | null> = {
    "idea":         "prompt-ready",
    "prompt-ready": "rendering",
    "rendering":    "review",
    "review":       "done",
    "done":         null,
    "archived":     null,
  };
  const next = nextStatus[item.status];

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3 group hover:border-white/20 transition-all">
      {/* Thumb */}
      {item.thumb_url ? (
        <img
          src={item.thumb_url}
          alt={item.title}
          className="w-full h-24 object-cover rounded mb-2 bg-zinc-800"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-16 rounded mb-2 bg-white/5 flex items-center justify-center">
          {(() => { const Icon = KIND_ICON[item.kind]; return <Icon className={cn("w-6 h-6 opacity-30", KIND_COLOUR[item.kind])} />; })()}
        </div>
      )}

      <p className="text-xs font-medium text-zinc-200 leading-snug line-clamp-2 mb-1.5">
        {item.title}
      </p>

      <div className="flex items-center justify-between">
        <KindBadge kind={item.kind} />
        {item.asset_url && (
          <a href={item.asset_url} target="_blank" rel="noopener noreferrer"
            className="text-zinc-600 hover:text-white transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {item.prompt && (
        <p className="text-[10px] text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
          {item.prompt}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {next && (
          <Button
            size="sm" variant="ghost"
            className="h-6 px-2 text-[10px] text-[#2AF1FF] hover:bg-[#2AF1FF]/10 flex-1"
            onClick={() => onMove(item.id, next)}
          >
            → {next}
          </Button>
        )}
        <Button
          size="sm" variant="ghost"
          className="h-6 px-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const [items, setItems]     = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("hub_media_items")
      .select("*")
      .neq("status", "archived")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) setItems(data as MediaItem[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveItem = async (id: string, status: MediaItem["status"]) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    await supabase.from("hub_media_items").update({ status }).eq("id", id);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Archive this item?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("hub_media_items").update({ status: "archived" }).eq("id", id);
  };

  const colItems = (col: MediaItem["status"]) => items.filter((i) => i.status === col);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#2AF1FF]" />
          <h1 className="font-['Orbitron'] text-lg font-semibold tracking-wide">Media Kanban</h1>
          <Badge className="bg-white/5 text-zinc-400 border-white/10 text-xs">{items.length} items</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={load} disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 p-4 min-w-fit">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col w-52 shrink-0">
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2 border-b-2 mb-2", col.colour)}>
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{col.label}</span>
                <Badge className="bg-white/5 text-zinc-500 border-white/10 text-[10px] h-4 px-1.5">
                  {loading ? "—" : colItems(col.id).length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 bg-white/5 rounded-lg" />
                  ))
                ) : colItems(col.id).length === 0 ? (
                  <div className="flex items-center justify-center h-24 border border-dashed border-white/10 rounded-lg">
                    <span className="text-[10px] text-zinc-700">Empty</span>
                  </div>
                ) : (
                  colItems(col.id).map((item) => (
                    <MediaCard key={item.id} item={item} onMove={moveItem} onDelete={deleteItem} />
                  ))
                )}
              </div>

              {/* Add button (idea column only) */}
              {col.id === "idea" && (
                <button
                  className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-600 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors w-full"
                  onClick={async () => {
                    const title = prompt("Item title:");
                    if (!title?.trim()) return;
                    const kind = (prompt("Kind (image/video/audio/copy/design/other):") ?? "image") as MediaItem["kind"];
                    const { data } = await supabase
                      .from("hub_media_items")
                      .insert({ title: title.trim(), kind: kind || "image", status: "idea" })
                      .select().single();
                    if (data) setItems((prev) => [data as MediaItem, ...prev]);
                  }}
                >
                  <Plus className="w-3 h-3" /> New idea
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
