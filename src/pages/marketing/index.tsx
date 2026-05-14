import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail, Phone, Building2, Plus, ChevronRight, ExternalLink, Megaphone,
} from "lucide-react";

/**
 * OS³ Command Centre — Marketing / CRM (Phase 3)
 *
 * Reads hub_marketing_leads — schema-faithful per migration 001:
 *   stage CHECK in ('new','qualified','contacted','proposal','won','lost')
 *   exposure_zar numeric — money on the table (NOT a 0-100 score)
 *   last_touch_at timestamptz (NOT last_contacted_at)
 *   campaign, phone, source, email all present
 *
 * Brand: cyan only on icon halo + accent. Gold reserved for exposure_zar
 * (it's money) — never on chrome.
 */

type LeadStage = "new" | "qualified" | "contacted" | "proposal" | "won" | "lost";

interface MarketingLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  campaign: string | null;
  stage: LeadStage;
  exposure_zar: number | null;
  notes: string | null;
  last_touch_at: string | null;
  created_at: string;
  updated_at: string;
}

const STAGE_CONFIG: Record<LeadStage, { label: string; colour: string; bg: string }> = {
  "new":       { label: "New",       colour: "text-cyan",         bg: "bg-cyan-15 border-cyan-30" },
  "qualified": { label: "Qualified", colour: "text-amber-300",    bg: "bg-amber-500/10 border-amber-400/30" },
  "contacted": { label: "Contacted", colour: "text-blue-300",     bg: "bg-blue-500/10 border-blue-400/30" },
  "proposal":  { label: "Proposal",  colour: "text-purple-300",   bg: "bg-purple-500/10 border-purple-400/30" },
  "won":       { label: "Won",       colour: "text-emerald-300",  bg: "bg-emerald-500/10 border-emerald-400/30" },
  "lost":      { label: "Lost",      colour: "text-ink-mute",     bg: "bg-steel border-edge" },
};

const PIPELINE: LeadStage[] = ["new", "qualified", "contacted", "proposal", "won", "lost"];

function fmtZar(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

interface LeadCardProps {
  lead: MarketingLead;
  onStageChange: (id: string, stage: LeadStage) => void;
  onSelect: (lead: MarketingLead) => void;
  selected: boolean;
}

function LeadCard({ lead, onStageChange, onSelect, selected }: LeadCardProps) {
  const cfg = STAGE_CONFIG[lead.stage];
  const nextStage = PIPELINE[PIPELINE.indexOf(lead.stage) + 1] as LeadStage | undefined;
  return (
    <div
      onClick={() => onSelect(lead)}
      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
        selected
          ? "border-cyan-30 bg-cyan-10"
          : "border-edge bg-graphite hover:border-ink-ghost"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{lead.name}</p>
          {lead.company && (
            <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" /> {lead.company}
            </p>
          )}
        </div>
        {lead.exposure_zar !== null && (
          <span className="font-display text-sm font-bold shrink-0 text-gold">
            {fmtZar(lead.exposure_zar)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded border ${cfg.bg} ${cfg.colour}`}>{cfg.label}</span>
        {lead.source && (
          <span className="text-xs px-2 py-0.5 rounded border border-edge text-ink-dim">{lead.source}</span>
        )}
        <span className="text-xs text-ink-mute ml-auto">{relativeTime(lead.created_at)}</span>
      </div>
      {nextStage && lead.stage !== "won" && lead.stage !== "lost" && (
        <button
          onClick={e => { e.stopPropagation(); onStageChange(lead.id, nextStage); }}
          className="mt-3 w-full text-xs text-ink-dim hover:text-ink border border-edge hover:border-cyan-30 rounded py-1 flex items-center justify-center gap-1 transition-colors"
        >
          Move to {STAGE_CONFIG[nextStage].label} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function MarketingPage() {
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStage | "all">("all");
  const [selected, setSelected] = useState<MarketingLead | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newSource, setNewSource] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("hub_marketing_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setLeads((data as MarketingLead[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateStage(id: string, stage: LeadStage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, stage } : null);
    await supabase.from("hub_marketing_leads").update({ stage }).eq("id", id);
  }

  async function addLead() {
    if (!newName.trim()) return;
    const { data } = await supabase
      .from("hub_marketing_leads")
      .insert({
        name: newName.trim(),
        email: newEmail || null,
        company: newCompany || null,
        source: newSource || null,
        stage: "new",
      })
      .select()
      .single();
    if (data) setLeads(prev => [data as MarketingLead, ...prev]);
    setNewName(""); setNewEmail(""); setNewCompany(""); setNewSource("");
    setAdding(false);
  }

  const visible = filter === "all" ? leads : leads.filter(l => l.stage === filter);
  const counts = PIPELINE.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s).length;
    return acc;
  }, {} as Record<LeadStage, number>);

  const totalExposure = leads
    .filter(l => l.stage !== "lost" && l.stage !== "won" && l.exposure_zar !== null)
    .reduce((sum, l) => sum + (l.exposure_zar ?? 0), 0);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex flex-col w-80 shrink-0 border-r border-edge overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-edge">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-ink font-display tracking-wide">
              Marketing / CRM
            </h1>
            <button
              onClick={() => setAdding(v => !v)}
              className="p-1.5 rounded-lg border border-edge hover:border-cyan-30 text-ink-dim hover:text-cyan transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Pipeline counts */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilter("all")}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${filter === "all" ? "border-ink-dim text-ink bg-steel" : "border-edge text-ink-mute hover:text-ink-dim"}`}>
              All {leads.length}
            </button>
            {PIPELINE.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${filter === s ? `${STAGE_CONFIG[s].bg} ${STAGE_CONFIG[s].colour}` : "border-edge text-ink-mute hover:text-ink-dim"}`}>
                {STAGE_CONFIG[s].label} {counts[s]}
              </button>
            ))}
          </div>
          {totalExposure > 0 && (
            <p className="mt-3 text-[11px] text-ink-mute uppercase tracking-[0.12em]">
              Open exposure:{" "}
              <span className="font-display text-sm font-bold text-gold">{fmtZar(totalExposure)}</span>
            </p>
          )}
        </div>
        {/* Add lead form */}
        {adding && (
          <div className="p-4 border-b border-edge bg-graphite space-y-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name *"
              className="w-full bg-steel border border-edge rounded px-3 py-1.5 text-sm text-ink placeholder-ink-ghost outline-none focus:border-cyan-30" />
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email"
              className="w-full bg-steel border border-edge rounded px-3 py-1.5 text-sm text-ink placeholder-ink-ghost outline-none focus:border-cyan-30" />
            <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Company"
              className="w-full bg-steel border border-edge rounded px-3 py-1.5 text-sm text-ink placeholder-ink-ghost outline-none focus:border-cyan-30" />
            <input value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="Source (e.g. LinkedIn)"
              className="w-full bg-steel border border-edge rounded px-3 py-1.5 text-sm text-ink placeholder-ink-ghost outline-none focus:border-cyan-30" />
            <div className="flex gap-2">
              <button onClick={addLead} className="flex-1 bg-cyan-15 border border-cyan-30 text-cyan text-sm rounded py-1.5 hover:bg-cyan-30/20 transition-colors">Add Lead</button>
              <button onClick={() => setAdding(false)} className="flex-1 border border-edge text-ink-dim text-sm rounded py-1.5 hover:text-ink transition-colors">Cancel</button>
            </div>
          </div>
        )}
        {/* Lead list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <p className="text-ink-mute text-sm text-center mt-8">Loading leads…</p>
          ) : visible.length === 0 ? (
            <div className="text-center mt-8">
              <p className="text-ink-mute text-sm">No leads yet</p>
              <p className="text-ink-ghost text-xs mt-1">Add manually or run marketing_leads_ingest in Kestra</p>
            </div>
          ) : (
            visible.map(lead => (
              <LeadCard key={lead.id} lead={lead} onStageChange={updateStage}
                onSelect={setSelected} selected={selected?.id === lead.id} />
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Megaphone className="w-10 h-10 text-ink-ghost mb-3" />
            <p className="text-ink-mute">Select a lead to view details</p>
            <p className="text-ink-ghost text-xs mt-1">{leads.length} leads total</p>
          </div>
        ) : (
          <div className="max-w-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink font-display tracking-wide">
                  {selected.name}
                </h2>
                {selected.company && (
                  <p className="text-ink-dim mt-1 flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> {selected.company}
                  </p>
                )}
              </div>
              {selected.exposure_zar !== null && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold font-display">{fmtZar(selected.exposure_zar)}</p>
                  <p className="text-xs text-ink-mute uppercase tracking-[0.12em]">exposure</p>
                </div>
              )}
            </div>
            {/* Contact info */}
            <div className="space-y-2 mb-6">
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-ink hover:text-cyan transition-colors">
                  <Mail className="w-4 h-4 text-ink-mute" /> {selected.email} <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-ink hover:text-cyan transition-colors">
                  <Phone className="w-4 h-4 text-ink-mute" /> {selected.phone}
                </a>
              )}
            </div>
            {/* Pipeline */}
            <div className="mb-6">
              <p className="text-xs text-ink-mute uppercase tracking-[0.12em] mb-2">Pipeline Stage</p>
              <div className="flex gap-1">
                {PIPELINE.map((s, i) => {
                  const cur = PIPELINE.indexOf(selected.stage);
                  const cfg = STAGE_CONFIG[s];
                  return (
                    <button key={s} onClick={() => updateStage(selected.id, s)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${i <= cur ? `${cfg.bg} ${cfg.colour}` : "border-edge text-ink-ghost hover:border-ink-mute"}`}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Meta */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-graphite border border-edge rounded-lg p-3">
                <p className="text-xs text-ink-mute uppercase tracking-[0.12em] mb-1">Source</p>
                <p className="text-sm text-ink">{selected.source ?? "—"}</p>
              </div>
              <div className="bg-graphite border border-edge rounded-lg p-3">
                <p className="text-xs text-ink-mute uppercase tracking-[0.12em] mb-1">Campaign</p>
                <p className="text-sm text-ink">{selected.campaign ?? "—"}</p>
              </div>
              <div className="bg-graphite border border-edge rounded-lg p-3">
                <p className="text-xs text-ink-mute uppercase tracking-[0.12em] mb-1">Last touch</p>
                <p className="text-sm text-ink">{relativeTime(selected.last_touch_at)}</p>
              </div>
            </div>
            {/* Notes */}
            {selected.notes && (
              <div className="bg-graphite border border-edge rounded-lg p-4">
                <p className="text-xs text-ink-mute uppercase tracking-[0.12em] mb-2">Notes</p>
                <p className="text-sm text-ink-dim leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
