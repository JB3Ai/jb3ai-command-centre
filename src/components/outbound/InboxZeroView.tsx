import React, { useState } from 'react';
import { Contact, Thread, Template, Sentiment } from '../../types/outbound';
import { 
  Inbox, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  Smile, 
  Meh, 
  Frown, 
  Clock, 
  Mail,
  User,
  Zap,
  XCircle,
  CornerUpRight,
  FileText
} from 'lucide-react';

interface InboxZeroViewProps {
  threads: Thread[];
  contacts: Contact[];
  templates: Template[];
  onReplyToContact: (threadId: string, replyText: string, markMeetingBooked?: boolean) => void;
  onOpenThreadDetail: (thread: Thread) => void;
}

export const InboxZeroView: React.FC<InboxZeroViewProps> = ({
  threads,
  contacts,
  templates,
  onReplyToContact,
  onOpenThreadDetail,
}) => {
  const replyThreads = threads.filter(
    (t) => t.status === 'replied' || t.status === 'meeting-booked' || t.reply_detected
  );

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    replyThreads.length > 0 ? replyThreads[0].id : null
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('t6');
  const [customReplyText, setCustomReplyText] = useState<string>('');

  const activeThread = replyThreads.find((t) => t.id === selectedThreadId) || replyThreads[0];
  const activeContact = activeThread ? contacts.find((c) => c.id === activeThread.contact_id) : null;

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && activeContact) {
      let body = tpl.body_text
        .replace(/{{first_name}}/g, activeContact.name.split(' ')[0])
        .replace(/{{company}}/g, activeContact.company)
        .replace(/{{program}}/g, activeContact.program)
        .replace(/{{my_calendly_link}}/g, 'https://calendly.com/sponsor-jb3ai/15min');
      setCustomReplyText(body);
    }
  };

  const handleQuickResponse = (type: 'meeting' | 'decline' | 'forward' | 'proposal') => {
    if (!activeContact) return;
    const firstName = activeContact.name.split(' ')[0] || activeContact.name;
    const company = activeContact.company || 'your organization';
    const program = activeContact.program || 'sponsorship';

    let text = '';
    switch (type) {
      case 'meeting':
        text = `Hi ${firstName},\n\nThanks for reaching out! We are excited about the possibilities with ${company} for ${program}.\n\nWould you have 15 minutes for a quick intro call next week? You can pick a convenient time directly on my calendar here:\nhttps://calendly.com/sponsor-jb3ai/15min\n\nLooking forward to speaking soon!\n\nBest regards,\nSponsorship Team`;
        break;
      case 'decline':
        text = `Hi ${firstName},\n\nThank you for reaching out regarding ${program} at ${company}.\n\nAfter carefully reviewing our current grant & sponsorship allocation, we don't have available capacity for new commitments this quarter. We really appreciate your work and hope to keep in touch for future cycles.\n\nBest regards,\nSponsorship Team`;
        break;
      case 'forward':
        text = `Hi ${firstName},\n\nThanks for your message regarding ${program}.\n\nI have forwarded your proposal and contact details to our Partnerships Lead & Sponsorship Manager for internal review. Someone from our team will follow up with you shortly.\n\nBest regards,\nSponsorship Team`;
        break;
      case 'proposal':
        text = `Hi ${firstName},\n\nThanks for reaching out! Could you please send over a detailed sponsorship deck or prospectus for ${program} at ${company}?\n\nOnce received, I'll review it with our selection committee.\n\nBest regards,\nSponsorship Team`;
        break;
    }
    setCustomReplyText(text);
  };

  const renderSentimentBadge = (sentiment?: Sentiment) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Smile className="w-3.5 h-3.5" />
            <span>Positive / Interested</span>
          </span>
        );
      case 'neutral':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Meh className="w-3.5 h-3.5" />
            <span>Neutral / Reviewing</span>
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Frown className="w-3.5 h-3.5" />
            <span>Not Now / Closed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
            Needs Review
          </span>
        );
    }
  };

  if (!replyThreads.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-100">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-2">Inbox Zero Achieved!</h2>
        <p className="text-sm text-slate-400 max-w-md text-center">
          No unhandled replies awaiting your attention. All automated sequences and follow-ups are running smoothly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left List of Replies */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Inbox Zero Queue
            </h3>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold border border-emerald-500/20">
            {replyThreads.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {replyThreads.map((thread) => {
            const contact = contacts.find((c) => c.id === thread.contact_id);
            if (!contact) return null;

            const isSelected = thread.id === activeThread?.id;
            const lastMsg = thread.history[thread.history.length - 1];

            return (
              <div
                key={thread.id}
                onClick={() => {
                  setSelectedThreadId(thread.id);
                  setCustomReplyText('');
                }}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-100 truncate">
                    {contact.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(thread.last_activity).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-medium truncate mb-1">
                  {contact.company} — {contact.program}
                </p>

                {lastMsg && (
                  <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950/60 p-1.5 rounded border border-slate-800/60 mb-2">
                    "{lastMsg.body}"
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {renderSentimentBadge(thread.sentiment)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Conversation View & Composer */}
      {activeThread && activeContact && (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">{activeContact.name}</h2>
                <span className="text-xs font-mono text-slate-400">({activeContact.email})</span>
              </div>
              <p className="text-xs text-indigo-300 font-medium">
                {activeContact.company} • {activeContact.program}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {renderSentimentBadge(activeThread.sentiment)}
              <button
                onClick={() => onOpenThreadDetail(activeThread)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all"
              >
                Full History & Details
              </button>
            </div>
          </div>

          {/* Email Messages Thread Log */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {activeThread.history.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-2xl p-4 rounded-xl border text-xs leading-relaxed ${
                  msg.direction === 'outbound'
                    ? 'ml-auto bg-indigo-950/30 border-indigo-800/50 text-indigo-100'
                    : 'mr-auto bg-slate-900 border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-slate-300">
                    {msg.direction === 'outbound' ? 'From: You (sponsor@jb3ai.com)' : `From: ${msg.sender}`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <h5 className="font-semibold text-indigo-300 mb-1">{msg.subject}</h5>
                <p className="whitespace-pre-wrap text-slate-300">{msg.body}</p>
              </div>
            ))}
          </div>

          {/* Response Quick Composer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Reply Composer</span>
              </div>

              {/* Template Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Load Template:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  {templates
                    .filter((t) => t.category === 'reply-template' || t.category === 'pitch')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Quick Response Actions Row */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Quick Actions:
              </span>

              <button
                onClick={() => handleQuickResponse('meeting')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Pre-populate response with Calendly scheduling link"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request Meeting</span>
              </button>

              <button
                onClick={() => handleQuickResponse('decline')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Pre-populate polite decline email"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Decline Politely</span>
              </button>

              <button
                onClick={() => handleQuickResponse('forward')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Pre-populate message noting internal escalation to manager"
              >
                <CornerUpRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Forward to Manager</span>
              </button>

              <button
                onClick={() => handleQuickResponse('proposal')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Pre-populate request for prospectus / deck"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Request Deck</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={customReplyText}
              onChange={(e) => setCustomReplyText(e.target.value)}
              placeholder="Type your reply or click a template above..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (customReplyText.trim()) {
                      onReplyToContact(activeThread.id, customReplyText, true);
                      setCustomReplyText('');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Send & Mark "Meeting Booked"</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (customReplyText.trim()) {
                    onReplyToContact(activeThread.id, customReplyText, false);
                    setCustomReplyText('');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply via Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
