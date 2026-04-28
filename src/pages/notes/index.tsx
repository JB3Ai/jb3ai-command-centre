import { useEffect, useMemo, useState } from "react";
import {
  StickyNote,
  RefreshCw,
  AlertTriangle,
  Pin,
  Plus,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

/**
 * OS³ Command Centre — Notes & Dropbox (Task #15)
 *
 * Quick-capture dump. Read + add for now. Source = 'manual' for entries
 * created here; apple-mcp + Dropbox poller will write rows with their own
 * source tags later (Phase 3).
 *
 * Behaviour:
 *   • Pinned at top, then most-recent-first.
 *   • Archive toggle hides without deleting.
 *   • Filter: All · Pinned · Archived
 */

type NoteRow = {
  id: string;
  body: string;
  source?: string | null;
  source_ref?: string | null;
  pinned?: boolean | null;
  archived?: boolean | null;
  tags?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Filter = "all" | "pinned" | "archived";

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm · dd MMM");
  } catch {
    return "—";
  }
}

export default function NotesPage() {
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const [draft, setDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_notes_dump")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setRows((data as NoteRow[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addNote() {
    const body = draft.trim();
    if (!body) return;
    setSaving(true);
    const tags = tagsDraft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error: err } = await supabase.from("hub_notes_dump").insert({
      body,
      source: "manual",
      tags,
    });
    if (err) {
      setError(`Add failed: ${err.message}`);
    } else {
      setDraft("");
      setTagsDraft("");
      await load();
    }
    setSaving(false);
  }

  async function togglePin(row: NoteRow) {
    const next = !row.pinned;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, pinned: next } : r)));
    const { error: err } = await supabase
      .from("hub_notes_dump")
      .update({ pinned: next })
      .eq("id", row.id);
    if (err) {
      setError(`Pin failed: ${err.message}`);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, pinned: !next } : r)));
    }
  }

  async function toggleArchive(row: NoteRow) {
    const next = !row.archived;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, archived: next } : r)));
    const { error: err } = await supabase
      .from("hub_notes_dump")
      .update({ archived: next })
      .eq("id", row.id);
    if (err) {
      setError(`Archive failed: ${err.message}`);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, archived: !next } : r)));
    }
  }

  const filtered = useMemo(() => {
    switch (filter) {
      case "pinned":
        return rows.filter((r) => r.pinned && !r.archived);
      case "archived":
        return rows.filter((r) => r.archived);
      case "all":
      default:
        return rows.filter((r) => !r.archived);
    }
  }, [rows, filter]);

  const counts = useMemo(
    () => ({
      all: rows.filter((r) => !r.archived).length,
      pinned: rows.filter((r) => r.pinned && !r.archived).length,
      archived: rows.filter((r) => r.archived).length,
    }),
    [rows],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <StickyNote className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              Notes &amp; Dropbox
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Quick-capture dump. Manual entries land here now; apple-mcp +
              Dropbox poller will join in Phase 3.
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

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Quick capture */}
      <div className="mt-6 rounded-lg border border-edge bg-graphite p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
          Quick capture
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Drop the thought. One line, paragraph, whatever — it lives in hub_notes_dump."
          className="w-full resize-none rounded-sm border border-edge bg-steel px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:border-cyan-30 focus:outline-none"
        />
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={tagsDraft}
            onChange={(e) => setTagsDraft(e.target.value)}
            placeholder="tags, comma, separated"
            className="rounded-sm border border-edge bg-steel px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:border-cyan-30 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void addNote()}
            disabled={saving || !draft.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-edge bg-steel px-4 py-2 text-xs font-medium text-ink hover:border-cyan-30 hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {saving ? "Saving…" : "Capture"}
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "pinned", "archived"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-sm border px-3 py-1 text-[11px] font-medium capitalize ${
              filter === f
                ? "border-cyan-30 bg-cyan-15 text-cyan"
                : "border-edge bg-steel text-ink-dim hover:text-ink"
            }`}
          >
            {f}{" "}
            <span className="ml-1 font-mono text-[10px] text-ink-mute">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {loading && rows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            Loading notes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            {filter === "archived"
              ? "Nothing archived."
              : "No notes here. Drop one above."}
          </div>
        ) : (
          filtered.map((n) => (
            <article
              key={n.id}
              className="rounded-lg border border-edge bg-graphite px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-mute">
                  <span>{fmtDateTime(n.created_at)}</span>
                  {n.source && (
                    <span className="rounded-sm bg-cyan-15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan">
                      {n.source}
                    </span>
                  )}
                  {n.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm border border-edge bg-steel px-1.5 py-0.5 text-[10px] text-ink-dim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => togglePin(n)}
                    className={`text-ink-ghost hover:text-cyan ${n.pinned ? "text-cyan" : ""}`}
                    title={n.pinned ? "Unpin" : "Pin"}
                  >
                    <Pin
                      className={`h-3.5 w-3.5 ${n.pinned ? "fill-cyan text-cyan" : ""}`}
                      strokeWidth={2}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchive(n)}
                    className="text-ink-ghost hover:text-ink"
                    title={n.archived ? "Restore" : "Archive"}
                  >
                    {n.archived ? (
                      <ArchiveRestore className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                      <Archive className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                {n.body}
              </p>
            </article>
          ))
        )}
      </div>

      <p className="mt-10 text-[11px] text-ink-ghost">
        Source: <span className="font-mono">hub_notes_dump</span> · all entries
        from this UI tagged <span className="font-mono">source = manual</span>.
      </p>
    </div>
  );
}
