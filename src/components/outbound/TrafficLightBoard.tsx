import React, { useState } from 'react';
import { 
  Contact, 
  Thread, 
  ThreadStatus, 
  Template,
  SuggestedActionType 
} from '../../types/outbound';
import { 
  Mail, 
  Calendar, 
  Send, 
  CheckCircle, 
  Eye, 
  Clock, 
  MessageSquare, 
  CheckCheck, 
  XCircle, 
  ChevronRight, 
  MoreHorizontal, 
  Tag, 
  Sparkles,
  ArrowRight,
  User,
  Building,
  ExternalLink,
  Plus
} from 'lucide-react';

interface TrafficLightBoardProps {
  threads: Thread[];
  contacts: Contact[];
  templates: Template[];
  onUpdateThreadStatus: (threadId: string, newStatus: ThreadStatus) => void;
  onSendEmailNow: (threadId: string, templateId?: string, customBody?: string) => void;
  onOpenThreadDetail: (thread: Thread) => void;
  onOpenImportModal: () => void;
}

interface ColumnConfig {
  status: ThreadStatus;
  label: string;
  lightEmoji: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  lightDot: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'draft',
    label: 'Draft',
    lightEmoji: '🟡',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
    lightDot: 'bg-amber-400',
  },
  {
    status: 'queued',
    label: 'Queued',
    lightEmoji: '🔵',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-400',
    lightDot: 'bg-blue-400',
  },
  {
    status: 'sent',
    label: 'Sent',
    lightEmoji: '🟢',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    lightDot: 'bg-emerald-400',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    lightEmoji: '⚪',
    badgeBg: 'bg-slate-500/10',
    badgeBorder: 'border-slate-500/30',
    badgeText: 'text-slate-300',
    lightDot: 'bg-slate-300',
  },
  {
    status: 'opened',
    label: 'Opened',
    lightEmoji: '🟠',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
    lightDot: 'bg-orange-400',
  },
  {
    status: 'waiting',
    label: 'Waiting Reply',
    lightEmoji: '🔴',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400',
    lightDot: 'bg-rose-500 animate-pulse',
  },
  {
    status: 'replied',
    label: 'Replied',
    lightEmoji: '🟢',
    badgeBg: 'bg-teal-500/10',
    badgeBorder: 'border-teal-500/30',
    badgeText: 'text-teal-300 font-bold',
    lightDot: 'bg-teal-400',
  },
  {
    status: 'meeting-booked',
    label: 'Meeting Booked',
    lightEmoji: '🟣',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300 font-bold',
    lightDot: 'bg-purple-400',
  },
  {
    status: 'closed',
    label: 'Closed',
    lightEmoji: '⚫',
    badgeBg: 'bg-slate-800/40',
    badgeBorder: 'border-slate-700/50',
    badgeText: 'text-slate-400',
    lightDot: 'bg-slate-600',
  },
];

export const TrafficLightBoard: React.FC<TrafficLightBoardProps> = ({
  threads,
  contacts,
  templates,
  onUpdateThreadStatus,
  onSendEmailNow,
  onOpenThreadDetail,
  onOpenImportModal,
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getContact = (contactId: string): Contact | undefined => {
    return contacts.find((c) => c.id === contactId);
  };

  const getDaysAgo = (dateIso: string): number => {
    const diffMs = Date.now() - new Date(dateIso).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Filter & Toolbar */}
      <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search contacts, companies, or programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Tag className="w-3.5 h-3.5" />
            <span>Tag:</span>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Tags</option>
              <option value="corporate">Corporate</option>
              <option value="fiscal-host">Fiscal Host</option>
              <option value="employee-nominator">Employee Nominator</option>
              <option value="local-sa">Local SA</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Contacts</span>
          </button>
        </div>
      </div>

      {/* Traffic Light Kanban Horizontal Scroll Board */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-3 align-start scrollbar-thin scrollbar-thumb-slate-800">
        {COLUMNS.map((col) => {
          const columnThreads = threads.filter((t) => {
            if (t.status !== col.status) return false;
            const contact = getContact(t.contact_id);
            if (!contact) return false;

            if (filterTag !== 'all' && !contact.tags.includes(filterTag as any)) {
              return false;
            }

            if (searchTerm.trim()) {
              const term = searchTerm.toLowerCase();
              const nameMatch = contact.name.toLowerCase().includes(term);
              const companyMatch = contact.company.toLowerCase().includes(term);
              const progMatch = contact.program.toLowerCase().includes(term);
              if (!nameMatch && !companyMatch && !progMatch) return false;
            }

            return true;
          });

          return (
            <div
              key={col.status}
              className="w-72 flex-shrink-0 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.lightDot}`} />
                  <span className="text-xs font-bold tracking-tight text-slate-200">
                    {col.label}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badgeBg} ${col.badgeText} ${col.badgeBorder} border`}>
                  {columnThreads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                {columnThreads.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-slate-600 text-xs italic border border-dashed border-slate-800/60 rounded-lg">
                    No contacts
                  </div>
                ) : (
                  columnThreads.map((thread) => {
                    const contact = getContact(thread.contact_id);
                    if (!contact) return null;
                    const daysAgo = getDaysAgo(thread.last_activity);

                    return (
                      <div
                        key={thread.id}
                        className="group bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 shadow-md transition-all cursor-pointer relative"
                        onClick={() => onOpenThreadDetail(thread)}
                      >
                        {/* Top Priority & Tags */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                          <span className="font-semibold text-slate-300 truncate max-w-[140px]">
                            {contact.company}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-mono text-[10px]">
                            P{contact.priority}
                          </span>
                        </div>

                        {/* Contact Name & Program */}
                        <div className="mb-2">
                          <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {contact.name}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">
                            {contact.program}
                          </p>
                        </div>

                        {/* Sentiment or Next Suggested Action pill */}
                        {thread.sentiment && (
                          <div className="mb-2">
                            {thread.sentiment === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                ✨ Interested / Book Call
                              </span>
                            )}
                            {thread.sentiment === 'needs-follow-up' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                ⏰ 72h Window Open
                              </span>
                            )}
                            {thread.sentiment === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                Closed / Passed
                              </span>
                            )}
                          </div>
                        )}

                        {/* Last Activity Time */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-600" />
                            {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                          </span>

                          {/* Quick Status Dropdown */}
                          <select
                            value={thread.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              onUpdateThreadStatus(thread.id, e.target.value as ThreadStatus);
                            }}
                            className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.status} value={c.status}>
                                {c.lightEmoji} {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
