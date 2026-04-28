import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional bullet-list of features arriving on this panel */
  upcoming?: string[];
  /** Optional roadmap phase tag — "Phase 2", "Phase 3", "Phase 4" */
  phase?: string;
}

/**
 * Used by every panel that hasn't been built yet — keeps the shell visually
 * complete while we ship Phase 2/3/4. On-brand: no gradients, no glow,
 * cyan used only for the phase chip and the icon halo.
 */
export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  upcoming = [],
  phase,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center px-8 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-edge bg-graphite">
        <Icon className="h-7 w-7 text-cyan" strokeWidth={1.5} />
      </div>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-wide text-ink">
        {title}
      </h1>

      {phase && (
        <span className="mt-2 rounded-sm bg-cyan-15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan">
          {phase}
        </span>
      )}

      <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-ink-dim">
        {description}
      </p>

      {upcoming.length > 0 && (
        <div className="mt-8 w-full max-w-md rounded-lg border border-edge bg-graphite p-5">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-ghost">
            Coming on this panel
          </div>
          <ul className="space-y-2 text-[13px] text-ink-dim">
            {upcoming.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
