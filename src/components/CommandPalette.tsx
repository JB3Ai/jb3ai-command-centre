import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { NAV_ITEMS, NAV_GROUP_LABEL, type NavGroup } from "@/lib/nav-config";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Global Cmd+K palette — jump to any of the 14 routes.
 * Future: also surface tasks, creditors, links, recent notes inline.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const groupOrder: NavGroup[] = ["ops", "finance", "comms", "infra", "content", "system"];
  const grouped = NAV_ITEMS.reduce<Record<NavGroup, typeof NAV_ITEMS>>(
    (acc, item) => {
      (acc[item.group] ||= []).push(item);
      return acc;
    },
    {} as Record<NavGroup, typeof NAV_ITEMS>,
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-matte/70 pt-32 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className="w-full max-w-xl overflow-hidden rounded-lg border border-edge bg-graphite shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <Command.Input
          autoFocus
          placeholder="Jump to a panel, search a task, draft an action…"
          className="w-full border-b border-edge bg-transparent px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink-mute"
        />
        <Command.List className="max-h-80 overflow-y-auto scrollbar-thin px-1 py-2">
          <Command.Empty className="px-3 py-6 text-center text-[12px] text-ink-mute">
            No results.
          </Command.Empty>

          {groupOrder.map((g) => {
            const items = grouped[g];
            if (!items?.length) return null;
            return (
              <Command.Group
                key={g}
                heading={NAV_GROUP_LABEL[g]}
                className="px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.15em] [&_[cmdk-group-heading]]:text-ink-ghost"
              >
                {items.map(({ path, label, icon: Icon, hint, shortcut }) => (
                  <Command.Item
                    key={path}
                    value={`${label} ${hint}`}
                    onSelect={() => {
                      navigate(path);
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] text-ink-dim aria-selected:bg-cyan-15 aria-selected:text-cyan"
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="font-medium">{label}</span>
                    <span className="truncate text-[11px] text-ink-mute">— {hint}</span>
                    {shortcut && (
                      <kbd className="ml-auto rounded border border-edge bg-steel px-1.5 py-0.5 font-mono text-[10px] text-ink-mute">
                        {shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>

        <div className="flex items-center justify-between border-t border-edge bg-steel px-3 py-1.5 text-[10px] text-ink-mute">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>OS³ Command Palette</span>
        </div>
      </Command>
    </div>
  );
}
