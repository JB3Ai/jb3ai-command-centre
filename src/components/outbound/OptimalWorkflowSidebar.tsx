import React from 'react';
import { Contact, Thread, Template } from '../../types/outbound';
import { 
  Sparkles, 
  Send, 
  Clock, 
  Check, 
  XCircle, 
  ArrowRight, 
  AlertCircle, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';

interface OptimalWorkflowSidebarProps {
  threads: Thread[];
  contacts: Contact[];
  templates: Template[];
  onExecuteAction: (threadId: string, templateId?: string) => void;
  onSnoozeThread: (threadId: string) => void;
  onCloseThread: (threadId: string) => void;
}

export const OptimalWorkflowSidebar: React.FC<OptimalWorkflowSidebarProps> = ({
  threads,
  contacts,
  templates,
  onExecuteAction,
  onSnoozeThread,
  onCloseThread,
}) => {
  // Filter threads that have active suggestions (e.g. waiting reply, replied needing action, or draft)
  const actionableThreads = threads.filter(
    (t) => t.status === 'waiting' || t.status === 'replied' || t.status === 'draft'
  );

  const getContact = (contactId: string) => contacts.find((c) => c.id === contactId);
  const getTemplate = (templateId?: string) => templates.find((t) => t.id === templateId);

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/90 text-slate-100 flex flex-col h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Optimal Workflow
            </h3>
            <p className="text-[11px] text-slate-400">AI-suggested next steps</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
          {actionableThreads.length} Ready
        </span>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
        {actionableThreads.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
            <p className="font-semibold text-slate-400">All clear!</p>
            <p className="text-[11px] mt-1">No pending follow-ups or replies requiring immediate action.</p>
          </div>
        ) : (
          actionableThreads.map((thread) => {
            const contact = getContact(thread.contact_id);
            if (!contact) return null;

            const suggestedTemplate = getTemplate(thread.suggested_template_id);

            return (
              <div
                key={thread.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-md relative group hover:border-slate-700 transition-all"
              >
                {/* Contact Title */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-xs text-indigo-300">
                      {contact.company} — {contact.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{contact.program}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-400">
                    P{contact.priority}
                  </span>
                </div>

                {/* Flow Diagram Representation */}
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80 mb-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Status:</span>
                    <span className="font-bold text-rose-400">
                      {thread.status === 'waiting' ? '🔴 Waiting for Reply' : thread.status === 'replied' ? '🟢 Replied' : '🟡 Draft'}
                    </span>
                  </div>

                  {suggestedTemplate && (
                    <div className="text-slate-300 truncate">
                      <span className="text-slate-500">Template: </span>
                      <span className="text-indigo-300 font-sans font-medium">{suggestedTemplate.name}</span>
                    </div>
                  )}

                  {thread.suggested_reason && (
                    <div className="text-[10px] text-slate-400 font-sans italic border-l-2 border-indigo-500 pl-2 my-1">
                      "{thread.suggested_reason}"
                    </div>
                  )}

                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Optimal send: SAST 09:00</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onExecuteAction(thread.id, thread.suggested_template_id)}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Send className="w-3 h-3" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => onSnoozeThread(thread.id)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                    title="Snooze 2 days"
                  >
                    Snooze
                  </button>

                  <button
                    onClick={() => onCloseThread(thread.id)}
                    className="p-1.5 bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 rounded-lg transition-all"
                    title="Mark Closed"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
