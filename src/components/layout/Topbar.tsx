import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, RefreshCw, LogOut, User2 } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { useAuth } from "@/lib/auth-context";

interface TopbarProps {
  onOpenPalette: () => void;
}

/**
 * Top strip — current route label, palette trigger, refresh, date,
 * user pill + sign-out.
 *
 * The page itself supplies its own page-level header below this.
 */
export function Topbar({ onOpenPalette }: TopbarProps) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.path));
  const dateStr = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Show the local part of the email so the pill stays compact.
  // Falls back to "session" if the email is somehow unset.
  const emailLabel = user?.email ?? "session";
  const shortLabel = emailLabel.includes("@")
    ? emailLabel.split("@")[0]
    : emailLabel;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // ProtectedRoute will catch the cleared session and bounce to /login.
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-edge bg-graphite px-5">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
          {current ? current.label : "Command Centre"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2 rounded-md border border-edge bg-steel px-3 py-1.5 text-[12px] text-ink-dim transition-colors hover:border-cyan-30 hover:text-ink"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Search or jump…</span>
          <kbd className="ml-2 rounded border border-edge bg-graphite px-1.5 py-0.5 font-mono text-[10px] text-ink-mute">
            ⌘K
          </kbd>
        </button>

        <span className="text-[11px] text-ink-mute">{dateStr}</span>

        <button
          aria-label="Refresh data"
          className="rounded-md border border-edge bg-steel p-1.5 text-ink-dim transition-colors hover:border-cyan-30 hover:text-cyan"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        {/* User pill — quiet, monospace-ish, full email on hover */}
        <div
          title={emailLabel}
          className="flex items-center gap-1.5 rounded-md border border-edge bg-steel px-2.5 py-1.5 text-[11px] text-ink-dim"
        >
          <User2 className="h-3.5 w-3.5 text-ink-mute" strokeWidth={2} />
          <span className="font-mono">{shortLabel}</span>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-md border border-edge bg-steel p-1.5 text-ink-dim transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
