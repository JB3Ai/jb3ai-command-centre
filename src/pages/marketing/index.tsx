import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Building2, Star, Plus, ChevronRight, ExternalLink, Tag } from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "closed-won" | "closed-lost";

interface MarketingLead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  score: number | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  last_contacted_at: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; colour: string; bg: string }> = {
  "new":          { label: "New",          colour: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/30" },
  "contacted":    { label: "Contacted",    colour: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30" },
  "qualified":    { label: "Qualified",    colour: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  "closed-won":   { label: "Won",          colour: "text-green-400",  bg: "bg-green-400/10 border-green-400/30" },
  "closed-lost":  { label: "Lost",         colour: "text-zinc-500",   bg: "bg-zinc-800 border-zinc-700" },
};

const PIPELINE: LeadStatus[] = ["new", "contacted", "qualified", "closed-won", "closed-lost"];

function scoreColour(score: number | null): string {
  if (score === null) return "text-zinc-500";
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function relativeTime(iso: string): string {
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
  onStatusChange: (id: string, status: LeadStatus) => void;
  onSelect: (lead: MarketingLead) => void;
  selected: boolean;
}

function LeadCard({ lead, onStatusChange, onSelect, selected }: LeadCardProps) {
  const cfg = STATUS_CONFIG[lead.status];
  const nextStatus = PIPELINE[PIPELINE.indexOf(lead.status) + 1] as LeadStatus | undefined;
  return (
    <div
      onClick={() => onSelect(lead)}
      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
        selected ? "border-cyan-400/50 bg-cyan-400/5" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{lead.name}</p>
          {lead.company && (
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" /> {lead.company}
            </p>
          )}
        </div>
        {lead.score !== null && (
          <span className={`font-mono text-sm font-bold shrink-0 ${scoreColour(lead.score)}`}
            style={{ fontFamily: "Orbitron, sans-serif" }}>
            {lead.score}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded border ${cfg.bg} ${cfg.colour}`}>{cfg.label}</span>
        {lead.source && (
          <span className="text-xs px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">{lead.source}</span>
        )}
        <span className="text-xs text-zinc-500 ml-auto">{relativeTime(lead.created_at)}</span>
      </div>
      {nextStatus && (
        <button
          onClick={e => { e.stopPropagation(); onStatusChange(lead.id, nextStatus); }}
          className="mt-3 w-full text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded py-1 flex items-center justify-center gap-1 transition-colors"
        >
          Move to {STATUS_CONFIG[nextStatus].label} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function MarketingPage() {
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
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
      setLeads(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(id: string, status: LeadStatus) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    await supabase.from("hub_marketing_leads").update({ status }).eq("id", id);
  }

  async function addLead() {
    if (!newName.trim()) return;
    const { data } = await supabase
      .from("hub_marketing_leads")
      .insert({ name: newName.trim(), email: newEmail || null, company: newCompany || null,
        source: newSource || null, status: "new" })
      .select()
      .single();
    if (data) setLeads(prev => [data, ...prev]);
    setNewName(""); setNewEmail(""); setNewCompany(""); setNewSource("");
    setAdding(false);
  }

  const visible = filter === "all" ? leads : leads.filter(l => l.status === filter);
  const counts = PIPELINE.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<LeadStatus, number>);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex flex-col w-80 shrink-0 border-r border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Marketing / CRM
            </h1>
            <button
              onClick={() => setAdding(v => !v)}
              className="p-1.5 rounded-lg border border-zinc-700 hover:border-cyan-400/50 text-zinc-400 hover:text-cyan-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Pipeline counts */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilter("all")}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${filter === "all" ? "border-white/30 text-white bg-white/10" : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}>
              All {leads.length}
            </button>
            {PIPELINE.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${filter === s ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].colour}` : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}>
                {STATUS_CONFIG[s].label} {counts[s]}
              </button>
            ))}
          </div>
        </div>
        {/* Add lead form */}
        {adding && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 space-y-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name *"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-400/50" />
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-400/50" />
            <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Company"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-400/50" />
            <input value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="Source (e.g. LinkedIn)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-400/50" />
            <div className="flex gap-2">
              <button onClick={addLead} className="flex-1 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm rounded py-1.5 hover:bg-cyan-400/20 transition-colors">Add Lead</button>
              <button onClick={() => setAdding(false)} className="flex-1 border border-zinc-700 text-zinc-400 text-sm rounded py-1.5 hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}
        {/* Lead list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <p className="text-zinc-500 text-sm text-center mt-8">Loading leads…</p>
          ) : visible.length === 0 ? (
            <div className="text-center mt-8">
              <p className="text-zinc-500 text-sm">No leads yet</p>
              <p className="text-zinc-600 text-xs mt-1">Add manually or run marketing_leads_ingest in Kestra</p>
            </div>
          ) : (
            visible.map(lead => (
              <LeadCard key={lead.id} lead={lead} onStatusChange={updateStatus}
                onSelect={setSelected} selected={selected?.id === lead.id} />
            ))
          )}
        </div>
      </div>
      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Star className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-zinc-500">Select a lead to view details</p>
            <p className="text-zinc-600 text-xs mt-1">{leads.length} leads total</p>
          </div>
        ) : (
          <div className="max-w-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {selected.name}
                </h2>
                {selected.company && <p className="text-zinc-400 mt-1 flex items-center gap-1"><Building2 className="w-4 h-4" /> {selected.company}</p>}
              </div>
              {selected.score !== null && (
                <div className="text-center">
                  <p className={`text-3xl font-bold ${scoreColour(selected.score)}`} style={{ fontFamily: "Orbitron, sans-serif" }}>{selected.score}</p>
                  <p className="text-xs text-zinc-500">score</p>
                </div>
              )}
            </div>
            {/* Contact info */}
            <div className="space-y-2 mb-6">
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-cyan-400 transition-colors">
                  <Mail className="w-4 h-4 text-zinc-500" /> {selected.email} <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
            </div>
            {/* Pipeline */}
            <div className="mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Pipeline Stage</p>
              <div className="flex gap-1">
                {PIPELINE.map((s, i) => {
                  const cur = PIPELINE.indexOf(selected.status);
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${i <= cur ? `${cfg.bg} ${cfg.colour}` : "border-zinc-800 text-zinc-600 hover:border-zinc-600"}`}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Source</p>
                <p className="text-sm text-white">{selected.source ?? "—"}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Added</p>
                <p className="text-sm text-white">{relativeTime(selected.created_at)}</p>
              </div>
            </div>
            {/* Tags */}
            {selected.tags && selected.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</p>
                <div className="flex gap-1 flex-wrap">
                  {selected.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Notes */}
            {selected.notes && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Notes</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
