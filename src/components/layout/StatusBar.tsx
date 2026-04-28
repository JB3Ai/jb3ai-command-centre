import { useEffect, useState } from "react";

/**
 * Bottom status bar — sync indicators, environment, build hash.
 * Hard-coded placeholders for now; CONFIG panel (Task #13) will wire to
 * `hub_sync_status` for live state.
 */
const PLACEHOLDER_FEEDS = [
  { label: "Supabase",  state: "ok"   as const, ts: "2s" },
  { label: "ClickUp",   state: "ok"   as const, ts: "1m" },
  { label: "Gmail",     state: "ok"   as const, ts: "3m" },
  { label: "GCal",      state: "ok"   as const, ts: "3m" },
  { label: "Vercel",    state: "ok"   as const, ts: "12m" },
  { label: "WhatsApp",  state: "warn" as const, ts: "—"  },
  { label: "Apple-MCP", state: "ok"   as const, ts: "8m" },
];

const dotClass: Record<"ok" | "warn" | "err" | "idle", string> = {
  ok:   "dot-ok",
  warn: "dot-warn",
  err:  "dot-err",
  idle: "dot-idle",
};

export function StatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-edge bg-graphite px-4 text-[10.5px] text-ink-mute">
      <div className="flex items-center gap-4">
        {PLACEHOLDER_FEEDS.map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <span className={dotClass[f.state]} />
            <span>{f.label}</span>
            <span className="text-ink-ghost">{f.ts}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span>OS³ v0.1 · dev</span>
        <span className="font-mono">{timeStr}</span>
      </div>
    </footer>
  );
}
