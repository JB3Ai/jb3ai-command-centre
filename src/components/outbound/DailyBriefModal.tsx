import React from 'react';
import { Thread, Contact, DailyBrief } from '../../types/outbound';
import { 
  X, 
  Sparkles, 
  Inbox, 
  Clock, 
  UserCheck, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface DailyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: Thread[];
  contacts: Contact[];
  onOpenInbox: () => void;
  onBatchExecuteFollowups: () => void;
}

export const DailyBriefModal: React.FC<DailyBriefModalProps> = ({
  isOpen,
  onClose,
  threads,
  contacts,
  onOpenInbox,
  onBatchExecuteFollowups,
}) => {
  if (!isOpen) return null;

  const repliesCount = threads.filter((t) => t.status === 'replied' || t.status === 'meeting-booked').length;
  const followupsReadyCount = threads.filter((t) => t.status === 'waiting' && t.sentiment === 'needs-follow-up').length;
  const draftCount = threads.filter((t) => t.status === 'draft').length;

  const getContact = (contactId: string) => contacts.find((c) => c.id === contactId);

  const pendingReplies = threads
    .filter((t) => t.status === 'replied')
    .slice(0, 3)
    .map((t) => {
      const c = getContact(t.contact_id);
      const lastMsg = t.history[t.history.length - 1];
      return {
        threadId: t.id,
        contactName: c?.name || 'Contact',
        company: c?.company || 'Organization',
        snippet: lastMsg?.body || 'Replied to campaign',
      };
    });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Daily Brief Summary</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  08:00 SAST
                </span>
              </div>
              <p className="text-xs text-slate-400">SponsorFlow Daily Intelligence & Actions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digest Body */}
        <div className="p-6 space-y-5">
          {/* 4 Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{repliesCount}</div>
                <div className="text-[11px] text-slate-400">Replies Awaiting</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{followupsReadyCount}</div>
                <div className="text-[11px] text-slate-400">Follow-Ups Ready</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{contacts.length}</div>
                <div className="text-[11px] text-slate-400">Total Contacts</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{draftCount + followupsReadyCount}</div>
                <div className="text-[11px] text-slate-400">Suggested Sends</div>
              </div>
            </div>
          </div>

          {/* Incoming Replies Preview List */}
          {pendingReplies.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Urgent Replies Requiring Human Action
              </h4>
              <div className="space-y-2">
                {pendingReplies.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{r.contactName}</span>{' '}
                      <span className="text-slate-400 font-medium">({r.company})</span>
                      <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                        "{r.snippet}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenInbox();
              }}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Inbox className="w-4 h-4" />
              <span>Go to Inbox Zero</span>
            </button>

            <button
              onClick={() => {
                onBatchExecuteFollowups();
                onClose();
              }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Approve All {followupsReadyCount} Follow-Ups</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
