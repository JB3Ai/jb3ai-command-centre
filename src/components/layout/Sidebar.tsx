import { NavLink } from "react-router-dom";
import { NAV_ITEMS, NAV_GROUP_LABEL, type NavGroup } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

/**
 * Left rail — 14 routes grouped by domain.
 * Cyan is the active accent only (≤15% rule). Idle items use ink-mute.
 */
export function Sidebar() {
  // Group items in original order while preserving the array sequence per group
  const groups = NAV_ITEMS.reduce<Record<NavGroup, typeof NAV_ITEMS>>(
    (acc, item) => {
      (acc[item.group] ||= []).push(item);
      return acc;
    },
    {} as Record<NavGroup, typeof NAV_ITEMS>,
  );
  const groupOrder: NavGroup[] = ["ops", "finance", "comms", "infra", "content", "system"];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-edge bg-graphite">
      {/* Wordmark */}
      <div className="flex h-14 items-center gap-2 border-b border-edge px-5">
        <span className="font-display text-xl font-bold tracking-[0.2em] text-ink">
          JB³Ai
        </span>
        <span className="rounded-sm bg-cyan-15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan">
          OS³
        </span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4">
        {groupOrder.map((g) => {
          const items = groups[g];
          if (!items?.length) return null;
          return (
            <div key={g} className="mb-5">
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-ghost">
                {NAV_GROUP_LABEL[g]}
              </div>
              <ul className="space-y-0.5">
                {items.map(({ path, label, icon: Icon }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-cyan-15 text-cyan"
                            : "text-ink-dim hover:bg-steel hover:text-ink",
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer — region locator */}
      <div className="border-t border-edge px-5 py-3 text-[10px] leading-tight text-ink-ghost">
        <div>Pretoria · Gauteng</div>
        <div>South Africa</div>
      </div>
    </aside>
  );
}
