import React, { useState } from 'react';
import { Lead, LeadMessage, LeadStatus } from '../../types/inbound';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Phone, 
  Mail, 
  FileText, 
  Copy, 
  Check, 
  Send,
  RefreshCw,
  Zap,
  CheckCircle2,
  History,
  ArrowRight,
  User
} from 'lucide-react';
import { formatStatusBadge, getSourceBadgeColor, getSourceIcon, formatDate } from './utils';

interface LeadDetailModalProps {
  lead: Lead | null;
  messages: LeadMessage[];
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onRunAgent: (leadId: string, agentId: 'agent_2_due_diligence' | 'agent_3_engagement') => void;
  onSendReply: (leadId: string, text: string) => void;
  isLoadingAgent?: boolean;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  messages,
  onClose,
  onStatusChange,
  onRunAgent,
  onSendReply,
  isLoadingAgent = false
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'ai' | 'messages' | 'payload'>('details');

  if (!lead) return null;

  const leadMessages = messages.filter(m => m.lead_id === lead.id);

  const statusHistoryList = lead.status_history && lead.status_history.length > 0
    ? lead.status_history
    : [
        {
          id: `SH-default-1`,
          to_status: lead.current_status,
          changed_by: 'Agent 1 Intake',
          timestamp: lead.created_at,
          note: `Lead ingested into MASTER_PIPELINE with status ${lead.current_status}`
        }
      ];

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(lead.raw_payload || lead, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(lead.id, replyText);
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F0F11] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 bg-[#0A0A0B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              {getSourceIcon(lead.origin_source)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  {lead.first_name} {lead.last_name}
                </h3>
                <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
                  {lead.signal_id}
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span>{lead.origin_source} ({lead.origin_type})</span>
                <span>•</span>
                <span>Mode: {lead.access_type}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs Navigation */}
        <div className="flex border-b border-white/5 bg-[#0A0A0B] px-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Lead Info & Status
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'timeline'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Status Timeline ({statusHistoryList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ai'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Due Diligence (Agent 2)</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Activity & Replies ({leadMessages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'payload'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Raw Webhook Payload
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Pipeline Status Selector Bar */}
              <div className="bg-[#0A0A0B] border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest block">
                    Current Stage in MASTER_PIPELINE
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Advance lead through pre-qualification, research, outreach, and call scheduling.
                  </p>
                </div>
                <select
                  value={lead.current_status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                  className={`border rounded-md px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer ${formatStatusBadge(lead.current_status)}`}
                >
                  <option value="New">New</option>
                  <option value="In Due Diligence">In Due Diligence</option>
                  <option value="Researched">Researched</option>
                  <option value="Booking Sent">Booking Sent</option>
                  <option value="Call Scheduled">Call Scheduled</option>
                </select>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#161618] p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Address
                  </span>
                  <span className="font-medium text-gray-100 block text-sm">{lead.email}</span>
                </div>

                <div className="bg-[#161618] p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number (E.164)
                  </span>
                  <span className="font-mono font-medium text-gray-100 block text-sm">{lead.phone_e164 || 'Not provided'}</span>
                </div>

                <div className="bg-[#161618] p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> IP & Location Node
                  </span>
                  <span className="font-medium text-gray-300 block">{lead.ip_address} • {lead.area_node || 'Global'}</span>
                </div>

                <div className="bg-[#161618] p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> POPIA & Newsletter Opt-In
                  </span>
                  <span className="font-medium text-gray-300 block">
                    POPIA: {lead.popia_consent ? 'Yes (Consented)' : 'No'} | Opt-In: {lead.newsletter_opt_in ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Form Notes / Context
                </span>
                <p className="text-xs text-gray-300 leading-relaxed font-mono">
                  {lead.notes || 'No custom submission notes provided.'}
                </p>
              </div>

              {/* Status Timeline Preview */}
              <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" /> Recent Status Timeline
                  </span>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
                  >
                    View full timeline ({statusHistoryList.length}) →
                  </button>
                </div>

                <div className="space-y-2">
                  {statusHistoryList.slice(-2).map((item, idx) => (
                    <div key={item.id || idx} className="bg-[#161618] border border-white/5 p-2.5 rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.from_status ? (
                          <>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${formatStatusBadge(item.from_status)}`}>
                              {item.from_status}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${formatStatusBadge(item.to_status)}`}>
                              {item.to_status}
                            </span>
                          </>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${formatStatusBadge(item.to_status)}`}>
                            {item.to_status}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono">via {item.changed_by}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{formatDate(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATUS TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0B] border border-white/5 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      Status Audit History
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Immutable timeline of stage progressions and agent triggers for signal ID {lead.signal_id}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded border border-white/5">
                    Total Events: {statusHistoryList.length}
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  {statusHistoryList.map((item, idx) => (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline Node Icon */}
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#161618] border border-white/20 flex items-center justify-center text-xs shadow-sm">
                        {item.changed_by.includes('Agent 2') ? (
                          <Sparkles className="w-3 h-3 text-purple-400" />
                        ) : item.changed_by.includes('Agent 3') ? (
                          <Send className="w-3 h-3 text-blue-400" />
                        ) : item.changed_by.includes('Operator') ? (
                          <User className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-400" />
                        )}
                      </div>

                      <div className="bg-[#161618] border border-white/5 p-3 rounded-xl text-xs space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.from_status ? (
                              <>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${formatStatusBadge(item.from_status)}`}>
                                  {item.from_status}
                                </span>
                                <ArrowRight className="w-3 h-3 text-gray-500" />
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${formatStatusBadge(item.to_status)}`}>
                                  {item.to_status}
                                </span>
                              </>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${formatStatusBadge(item.to_status)}`}>
                                Stage: {item.to_status}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-gray-400 font-mono">
                            {formatDate(item.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                          <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 text-gray-300">
                            {item.changed_by}
                          </span>
                          {item.note && (
                            <span className="text-xs text-gray-300">
                              {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI DUE DILIGENCE */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Agent 2 Background Due Diligence
                  </h4>
                  <p className="text-xs text-purple-300/70 mt-0.5">
                    Generates executive research, domain lookup, and commercial angle using Gemini API.
                  </p>
                </div>

                <button
                  onClick={() => onRunAgent(lead.id, 'agent_2_due_diligence')}
                  disabled={isLoadingAgent}
                  className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isLoadingAgent ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isLoadingAgent ? 'Analyzing...' : 'Run Gemini AI Agent'}</span>
                </button>
              </div>

              {/* Research Notes Output */}
              <div className="bg-[#0A0A0B] border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest block">
                  AI_Output Column Content (MASTER_PIPELINE):
                </span>
                <div className="text-xs text-purple-200 font-mono whitespace-pre-line leading-relaxed bg-[#161618] p-3 rounded-lg border border-white/5">
                  {lead.ai_output || "Click 'Run Gemini AI Agent' above to synthesize background research."}
                </div>
              </div>

              {/* Action trigger for Agent 3 Engagement */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onRunAgent(lead.id, 'agent_3_engagement')}
                  disabled={isLoadingAgent}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Draft Agent 3 Outreach Message</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY & MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {leadMessages.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No message records logged yet.</p>
                ) : (
                  leadMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        msg.sender === 'Lead' 
                          ? 'bg-[#161618] border-white/10 text-gray-200' 
                          : msg.sender.includes('Agent') 
                            ? 'bg-purple-950/30 border-purple-500/20 text-purple-200' 
                            : 'bg-blue-950/30 border-blue-500/20 text-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5">
                          <span>{msg.sender}</span>
                          <span className="text-[10px] text-gray-500 font-normal">via {msg.channel}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{formatDate(msg.timestamp)}</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed font-sans">{msg.message_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Type direct reply to lead..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#161618] border border-white/10 rounded-md px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: RAW WEBHOOK PAYLOAD */}
          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Inbound Webhook JSON Body:</span>
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer border border-white/5"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="bg-[#0A0A0B] border border-white/10 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[320px]">
                {JSON.stringify(lead.raw_payload || lead, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0A0A0B] flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mirror Status: Synced to Google Sheet MASTER_PIPELINE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer border border-white/5"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
