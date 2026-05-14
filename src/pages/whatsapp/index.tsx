import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, AlertCircle, Check, ChevronDown } from "lucide-react";

/**
 * OS³ Command Centre — WhatsApp (Phase 3)
 *
 * Reads hub_whatsapp_messages (schema: direction = 'in' | 'out'). Groups
 * messages into threads by jid, flags needs-reply via the `flagged` column,
 * and pulls an optional daily digest from hub_notes_dump where
 * source = 'kestra-whatsapp'.
 *
 * Brand: cyan only on heartbeat/icon halo. Gold reserved for money (none here).
 */

type Direction = "in" | "out";

interface WaMessage {
  id: string;
  jid: string;            // e.g. 27711234567@s.whatsapp.net
  display_name: string | null;
  direction: Direction;
  body: string;
  sent_at: string;
  flagged: boolean;       // needs_reply equivalent
  has_media: boolean;
  created_at: string;
}

interface Thread {
  phone: string;
  name: string;
  messages: WaMessage[];
  needsReply: boolean;
  lastAt: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function ThreadRow({
  thread,
  selected,
  onClick,
}: {
  thread: Thread;
  selected: boolean;
  onClick: () => void;
}) {
  const last = thread.messages[thread.messages.length - 1];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-edge transition-colors ${
        selected ? "bg-cyan-10 border-l-2 border-l-cyan" : "hover:bg-steel/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="font-medium text-ink text-sm truncate">{thread.name}</span>
        <span className="text-xs text-ink-mute shrink-0">{relativeTime(thread.lastAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-ink-mute truncate flex-1">
          {last.direction === "out" && <span className="text-ink-ghost">You: </span>}
          {last.body}
        </p>
        {thread.needsReply && (
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
      </div>
    </button>
  );
}

function MessageBubble({ msg }: { msg: WaMessage }) {
  const isOut = msg.direction === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isOut
            ? "bg-cyan-15 text-ink rounded-br-sm"
            : "bg-steel text-ink rounded-bl-sm"
        }`}
      >
        <p>{msg.body}</p>
        <p className={`text-xs mt-1 ${isOut ? "text-cyan-60 text-right" : "text-ink-mute"}`}>
          {formatTime(msg.sent_at ?? msg.created_at ?? "")}
        </p>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "needs_reply" | "inbound">("all");
  const [digest, setDigest] = useState<string | null>(null);
  const [showDigest, setShowDigest] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("hub_whatsapp_messages")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(500);
      setMessages((data as WaMessage[]) ?? []);
      setLoading(false);

      // Load today's digest from hub_notes_dump
      const today = new Date().toISOString().slice(0, 10);
      const { data: note } = await supabase
        .from("hub_notes_dump")
        .select("body")
        .eq("source", "kestra-whatsapp")
        .gte("created_at", `${today}T00:00:00Z`)
        .maybeSingle();
      if (note) setDigest(note.body);
    }
    load();
  }, []);

  // Group messages into threads by JID (strip @s.whatsapp.net suffix for display)
  const threads = useMemo((): Thread[] => {
    const map = new Map<string, WaMessage[]>();
    for (const msg of [...messages].reverse()) {
      const arr = map.get(msg.jid) ?? [];
      arr.push(msg);
      map.set(msg.jid, arr);
    }
    return Array.from(map.entries())
      .map(([phone, msgs]) => {
        const last = msgs[msgs.length - 1];
        const displayPhone = phone.replace(/@s\.whatsapp\.net$/, "");
        return {
          phone,
          name: last.display_name ?? displayPhone,
          messages: msgs,
          needsReply: msgs.some(m => m.flagged),
          lastAt: last.sent_at ?? last.created_at ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  }, [messages]);

  const visibleThreads = useMemo(() => {
    if (filter === "needs_reply") return threads.filter(t => t.needsReply);
    if (filter === "inbound") return threads.filter(t =>
      t.messages[t.messages.length - 1].direction === "in");
    return threads;
  }, [threads, filter]);

  const activeThread = selectedPhone
    ? threads.find(t => t.phone === selectedPhone) ?? null
    : null;

  async function markReplied(phone: string) {
    setMessages(prev => prev.map(m =>
      m.jid === phone ? { ...m, flagged: false } : m));
    await supabase
      .from("hub_whatsapp_messages")
      .update({ flagged: false })
      .eq("jid", phone)
      .eq("flagged", true);
  }

  const needsReplyCount = threads.filter(t => t.needsReply).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: thread list */}
      <div className="flex flex-col w-72 shrink-0 border-r border-edge overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-edge">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-ink font-display tracking-wide">
              WhatsApp
            </h1>
            {needsReplyCount > 0 && (
              <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                {needsReplyCount} pending
              </span>
            )}
          </div>
          {/* Filters */}
          <div className="flex gap-1">
            {(["all", "needs_reply", "inbound"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-xs py-1 rounded border transition-colors ${
                  filter === f
                    ? "border-cyan-30 bg-cyan-15 text-cyan"
                    : "border-edge text-ink-mute hover:text-ink-dim"
                }`}>
                {f === "all" ? `All ${threads.length}` : f === "needs_reply" ? "Reply" : "Inbound"}
              </button>
            ))}
          </div>
        </div>

        {/* Digest banner */}
        {digest && (
          <div className="border-b border-edge">
            <button onClick={() => setShowDigest(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs text-ink-dim hover:text-ink transition-colors">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-cyan" />
                Today's digest
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showDigest ? "rotate-180" : ""}`} />
            </button>
            {showDigest && (
              <div className="px-4 pb-3">
                <p className="text-xs text-ink-dim leading-relaxed">{digest}</p>
              </div>
            )}
          </div>
        )}

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-ink-mute text-sm text-center mt-8">Loading…</p>
          ) : visibleThreads.length === 0 ? (
            <div className="text-center mt-8 px-4">
              <p className="text-ink-mute text-sm">No conversations</p>
              <p className="text-ink-ghost text-xs mt-1">Start the WhatsApp bridge to sync messages</p>
            </div>
          ) : (
            visibleThreads.map(t => (
              <ThreadRow key={t.phone} thread={t}
                selected={selectedPhone === t.phone}
                onClick={() => setSelectedPhone(t.phone)} />
            ))
          )}
        </div>
      </div>

      {/* Right: message thread */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeThread ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-ink-ghost mb-3" />
            <p className="text-ink-mute">Select a conversation</p>
            <p className="text-ink-ghost text-xs mt-1">{threads.length} threads loaded</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
              <div>
                <p className="font-semibold text-ink">{activeThread.name}</p>
                <p className="text-xs text-ink-mute">{activeThread.phone} · {activeThread.messages.length} messages</p>
              </div>
              {activeThread.needsReply && (
                <button onClick={() => markReplied(activeThread.phone)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors">
                  <Check className="w-3.5 h-3.5" /> Mark replied
                </button>
              )}
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {activeThread.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
