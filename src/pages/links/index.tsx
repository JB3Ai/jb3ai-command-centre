import { useEffect, useMemo, useState } from "react";
import {
  Link2,
  RefreshCw,
  AlertTriangle,
  Pin,
  Plus,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

/**
 * OS³ Command Centre — Links (Task #15)
 *
 * Reads hub_links. Shows pinned items at the top, then groups by category.
 * Inline form to add a new link. Toggle pin via column click.
 * Edit + reorder deferred — keep this minimal-and-shipping.
 */

type LinkRow = {
  id: string;
  label: string;
  url: string;
  category?: string | null;
  pinned?: boolean | null;
  sort_order?: number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function LinksPage() {
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // add form
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_links")
      .select("*")
      .order("pinned", { ascending: false })
      .order("category", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setRows((data as LinkRow[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addLink() {
    const labelTrim = label.trim();
    const urlTrim = url.trim();
    if (!labelTrim || !urlTrim) return;
    setSaving(true);
    const { error: err } = await supabase.from("hub_links").insert({
      label: labelTrim,
      url: urlTrim,
      category: category.trim() || null,
      pinned,
    });
    if (err) {
      setError(`Add failed: ${err.message}`);
    } else {
      setLabel("");
      setUrl("");
      setCategory("");
      setPinned(false);
      await load();
    }
    setSaving(false);
  }

  async function togglePin(row: LinkRow) {
    const next = !row.pinned;
    // optimistic
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, pinned: next } : r)));
    const { error: err } = await supabase
      .from("hub_links")
      .update({ pinned: next })
      .eq("id", row.id);
    if (err) {
      setError(`Pin failed: ${err.message}`);
      // roll back
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, pinned: !next } : r)));
    }
  }

  const pinnedRows = useMemo(() => rows.filter((r) => r.pinned), [rows]);
  const grouped = useMemo(() => {
    const unpinned = rows.filter((r) => !r.pinned);
    const by = new Map<string, LinkRow[]>();
    for (const r of unpinned) {
      const k = r.category ?? "Uncategorised";
      const arr = by.get(k) ?? [];
      arr.push(r);
      by.set(k, arr);
    }
    return Array.from(by.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-edge bg-graphite">
            <Link2 className="h-6 w-6 text-cyan" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
              Links
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
              Clickable index of every URL that matters. Pinned items stick to the
              top; the rest groups by category.
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

      {/* Add form */}
      <div className="mt-6 rounded-lg border border-edge bg-graphite p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
          Add link
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_auto]">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="rounded-sm border border-edge bg-steel px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:border-cyan-30 focus:outline-none"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-sm border border-edge bg-steel px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-ghost focus:border-cyan-30 focus:outline-none"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="rounded-sm border border-edge bg-steel px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:border-cyan-30 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void addLink()}
            disabled={saving || !label.trim() || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-edge bg-steel px-4 py-2 text-xs font-medium text-ink hover:border-cyan-30 hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[12px] text-ink-dim">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="accent-cyan"
          />
          Pin to top
        </label>
      </div>

      {/* Pinned section */}
      {pinnedRows.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Pin className="h-3.5 w-3.5 text-cyan" strokeWidth={1.75} />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
              Pinned
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-edge bg-graphite">
            {pinnedRows.map((row, idx) => (
              <LinkRow key={row.id} row={row} idx={idx} onTogglePin={togglePin} />
            ))}
          </div>
        </section>
      )}

      {/* Grouped */}
      <div className="mt-8 space-y-8">
        {loading && rows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            Loading links…
          </div>
        ) : grouped.length === 0 && pinnedRows.length === 0 ? (
          <div className="rounded-lg border border-edge bg-graphite px-5 py-8 text-center text-sm text-ink-dim">
            No links yet. Add one above to get started.
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
                {list.map((row, idx) => (
                  <LinkRow key={row.id} row={row} idx={idx} onTogglePin={togglePin} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <p className="mt-10 text-[11px] text-ink-ghost">
        Source: <span className="font-mono">hub_links</span>. Click the pin icon
        on a row to pin/unpin.
      </p>
    </div>
  );
}

function LinkRow({
  row,
  idx,
  onTogglePin,
}: {
  row: LinkRow;
  idx: number;
  onTogglePin: (row: LinkRow) => void;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 ${
        idx > 0 ? "border-t border-edge" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onTogglePin(row)}
        className="text-ink-ghost hover:text-cyan"
        title={row.pinned ? "Unpin" : "Pin"}
      >
        <Pin
          className={`h-3.5 w-3.5 ${row.pinned ? "fill-cyan text-cyan" : ""}`}
          strokeWidth={2}
        />
      </button>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink break-words">{row.label}</div>
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block break-all font-mono text-[11px] text-ink-mute hover:text-cyan hover:underline"
        >
          {row.url}
        </a>
        {row.notes && (
          <div className="mt-1 text-[12px] text-ink-dim line-clamp-2">{row.notes}</div>
        )}
      </div>
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-ink-ghost hover:text-cyan"
        title="Open"
      >
        <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
      </a>
    </div>
  );
}
