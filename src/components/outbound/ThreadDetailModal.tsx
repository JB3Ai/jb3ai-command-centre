import React, { useState } from 'react';
import { Contact, Thread, Template, ThreadStatus } from '../../types/outbound';
import { 
  X, 
  Send, 
  Clock, 
  User, 
  Building, 
  Mail, 
  Tag, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Inbox,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface ThreadDetailModalProps {
  thread: Thread | null;
  onClose: () => void;
  contacts: Contact[];
  templates: Template[];
  onUpdateStatus: (threadId: string, status: ThreadStatus) => void;
  onSendEmailInThread: (threadId: string, templateId?: string, customBody?: string) => void;
}

export const ThreadDetailModal: React.FC<ThreadDetailModalProps> = ({
  thread,
  onClose,
  contacts,
  templates,
  onUpdateStatus,
  onSendEmailInThread,
}) => {
  if (!thread) return null;

  const contact = contacts.find((c) => c.id === thread.contact_id);
  if (!contact) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('t1');
  const [composerText, setComposerText] = useState<string>('');

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      let body = tpl.body_text
        .replace(/{{first_name}}/g, contact.name.split(' ')[0])
        .replace(/{{company}}/g, contact.company)
        .replace(/{{program}}/g, contact.program)
        .replace(/{{my_calendly_link}}/g, 'https://calendly.com/sponsor-jb3ai/15min')
        .replace(/{{days_since_sent}}/g, '3');
      setComposerText(body);
    }
  };

  const handleSend = () => {
    if (composerText.trim()) {
      onSendEmailInThread(thread.id, selectedTemplateId, composerText);
      setComposerText('');
    }
  };

  // Chronological sort of interaction history
  const sortedHistory = [...thread.history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return {
      dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      timeStr: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{contact.name}</h3>
              <p className="text-xs text-indigo-300">
                {contact.company} • {contact.program} ({contact.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={thread.status}
              onChange={(e) => onUpdateStatus(thread.id, e.target.value as ThreadStatus)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="draft">🟡 Draft</option>
              <option value="queued">🔵 Queued</option>
              <option value="sent">🟢 Sent</option>
              <option value="delivered">⚪ Delivered</option>
              <option value="opened">🟠 Opened</option>
              <option value="waiting">🔴 Waiting Reply</option>
              <option value="replied">🟢 Replied</option>
              <option value="meeting-booked">🟣 Meeting Booked</option>
              <option value="closed">⚫ Closed</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Contact Details & History */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Metadata Panel */}
          <div className="w-72 border-r border-slate-800 bg-slate-950 p-4 space-y-4 overflow-y-auto text-xs">
            <div>
              <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                Contact Details
              </h4>
              <p className="font-semibold text-slate-200">{contact.name}</p>
              <p className="text-slate-400 font-mono text-[11px]">{contact.email}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                Priority & Tags
              </h4>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold">
                  Priority {contact.priority}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {contact.notes && (
              <div>
                <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                  Notes
                </h4>
                <p className="text-slate-300 italic bg-slate-900 p-2 rounded border border-slate-800">
                  {contact.notes}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                Custom Variables
              </h4>
              <div className="space-y-1 font-mono text-[10px] text-slate-400">
                {Object.entries(contact.custom_vars).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-900 pb-0.5">
                    <span>{k}:</span>
                    <span className="text-indigo-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right History & Composer */}
          <div className="flex-1 flex flex-col bg-slate-900/50 overflow-y-auto">
            {/* Visual Vertical Timeline */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                    Interaction Timeline ({sortedHistory.length} messages)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Chronological Order
                </span>
              </div>

              {sortedHistory.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400">No email interactions logged yet for this thread.</p>
                  <p className="text-[11px] text-slate-500">Use the quick composer below to send or queue outreach.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {/* Timeline Start Node */}
                  <div className="relative flex items-center gap-3 text-[11px] text-slate-500">
                    <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900" />
                    <span>Outreach thread initialized for {contact.company}</span>
                  </div>

                  {sortedHistory.map((msg, index) => {
                    const isOutbound = msg.direction === 'outbound';
                    const { dateStr, timeStr } = formatDate(msg.timestamp);

                    return (
                      <div key={msg.id || index} className="relative group">
                        {/* Timeline Node Badge */}
                        <div
                          className={`absolute -left-8 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow-md ${
                            isOutbound
                              ? 'bg-indigo-600 text-indigo-100 ring-2 ring-indigo-500/20'
                              : 'bg-emerald-600 text-emerald-100 ring-2 ring-emerald-500/20'
                          }`}
                        >
                          {isOutbound ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Event Card */}
                        <div
                          className={`rounded-2xl border p-4 text-xs space-y-2 transition-all shadow-lg ${
                            isOutbound
                              ? 'bg-slate-900/90 border-indigo-900/50 hover:border-indigo-700/60'
                              : 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-700/60'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase ${
                                  isOutbound
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {isOutbound ? 'Outbound' : 'Inbound Reply'}
                              </span>
                              <span className="font-bold text-slate-200">
                                {isOutbound ? `From: ${msg.sender}` : `From: ${msg.sender}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                              <span>{dateStr}</span>
                              <span>•</span>
                              <span>{timeStr}</span>
                            </div>
                          </div>

                          {/* Subject */}
                          <div className="font-semibold text-indigo-300 text-xs flex items-center gap-1.5">
                            <span>Subject:</span>
                            <span className="text-slate-100">{msg.subject}</span>
                          </div>

                          {/* Message Body */}
                          <p className="whitespace-pre-wrap text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-sans text-xs">
                            {msg.body}
                          </p>

                          {/* Card Footer Info */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              {isOutbound ? 'Sent via Workspace Gmail API' : 'Received via Inbox Sync'}
                            </span>
                            <span>Recipient: {msg.recipient}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Email Composer
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Load Template:</span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                rows={4}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Type email body or pick a template above..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email Now via Gmail API</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
