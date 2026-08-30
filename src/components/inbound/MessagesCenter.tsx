import React, { useState } from 'react';
import { Lead, LeadMessage, LeadStatus } from '../../types/inbound';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  User, 
  Bot, 
  RefreshCw,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react';
import { getSourceBadgeColor, getSourceIcon, formatStatusBadge, formatDate } from './utils';

interface MessagesCenterProps {
  leads: Lead[];
  messages: LeadMessage[];
  selectedLeadId?: string | null;
  onSelectLead: (leadId: string) => void;
  onSendReply: (leadId: string, text: string) => void;
  onRunAgent3: (leadId: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  isLoadingAgent?: boolean;
}

export const MessagesCenter: React.FC<MessagesCenterProps> = ({
  leads,
  messages,
  selectedLeadId,
  onSelectLead,
  onSendReply,
  onRunAgent3,
  onStatusChange,
  isLoadingAgent = false
}) => {
  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];
  const [replyText, setReplyText] = useState('');

  const activeMessages = activeLead 
    ? messages.filter(m => m.lead_id === activeLead.id)
    : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeLead) return;
    onSendReply(activeLead.id, replyText);
    setReplyText('');
  };

  const insertQuickTemplate = (template: string) => {
    if (!activeLead) return;
    if (template === 'calendly') {
      setReplyText(`Hi ${activeLead.first_name},\n\nThank you for reaching out to JB3AI. Jonathan would be glad to discuss your project. You can schedule a 15-minute call directly on his diary here: https://calendly.com/jb3ai/intro\n\nBest regards,\nJonathan Blackburn`);
    } else if (template === 'investor') {
      setReplyText(`Hi ${activeLead.first_name},\n\nYour Investor Access request has been processed. Access credentials and room links have been prepared.\n\nPlease pick a time for an intro briefing: https://calendly.com/jb3ai/investor-briefing\n\nBest,\nJB3AI Team`);
    } else if (template === 'followup') {
      setReplyText(`Hi ${activeLead.first_name}, following up on your ${activeLead.origin_source} inquiry regarding ${activeLead.access_type}. Let us know if Thursday afternoon CAT works for a quick VoiceGrid demo.`);
    }
  };

  return (
    <div className="bg-[#0F0F11] border border-white/5 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
      
      {/* Left Column: Lead Conversation List */}
      <div className="lg:col-span-4 border-r border-white/5 bg-[#0A0A0B] flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Inbound Leads Stream</span>
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">All channel messages & AI logs</p>
          </div>
          <span className="text-[10px] bg-white/5 text-gray-400 border border-white/5 px-2 py-0.5 rounded font-mono font-medium">
            {leads.length} Active
          </span>
        </div>

        {/* Lead Items */}
        <div className="divide-y divide-white/5 overflow-y-auto max-h-[550px] flex-1">
          {leads.map(lead => {
            const isSelected = activeLead?.id === lead.id;
            const leadMsgs = messages.filter(m => m.lead_id === lead.id);
            const lastMsg = leadMsgs[leadMsgs.length - 1];

            return (
              <button
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                  isSelected 
                    ? 'bg-blue-600/10 border-l-2 border-l-blue-500' 
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#161618] border border-white/10 flex items-center justify-center text-gray-300 font-medium shrink-0 text-sm">
                  {getSourceIcon(lead.origin_source)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-medium text-xs text-white truncate">
                      {lead.first_name} {lead.last_name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">
                      {formatDate(lead.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${getSourceBadgeColor(lead.origin_source)}`}>
                      {lead.origin_source}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${formatStatusBadge(lead.current_status)}`}>
                      {lead.current_status}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 truncate line-clamp-1">
                    {lastMsg ? lastMsg.message_text : lead.notes || lead.ai_output}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Conversation & Reply Workspace */}
      <div className="lg:col-span-8 flex flex-col bg-[#0F0F11]">
        {activeLead ? (
          <>
            {/* Header for Active Lead */}
            <div className="p-4 border-b border-white/5 bg-[#0A0A0B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-white">
                    {activeLead.first_name} {activeLead.last_name}
                  </h3>
                  <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {activeLead.signal_id}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Mail className="w-3.5 h-3.5 text-blue-400" /> {activeLead.email}
                  </span>
                  {activeLead.phone_e164 && (
                    <span className="flex items-center gap-1 font-mono text-gray-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> {activeLead.phone_e164}
                    </span>
                  )}
                  <span>Mode: <strong className="text-gray-200 font-medium">{activeLead.access_type}</strong></span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest text-[10px]">Stage:</span>
                <select
                  value={activeLead.current_status}
                  onChange={(e) => onStatusChange(activeLead.id, e.target.value as LeadStatus)}
                  className={`border rounded-md px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${formatStatusBadge(activeLead.current_status)}`}
                >
                  <option value="New">New</option>
                  <option value="In Due Diligence">In Due Diligence</option>
                  <option value="Researched">Researched</option>
                  <option value="Booking Sent">Booking Sent</option>
                  <option value="Call Scheduled">Call Scheduled</option>
                </select>
              </div>
            </div>

            {/* Conversation Timeline */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 max-h-[420px]">
              {/* Context Summary Box */}
              <div className="bg-[#0A0A0B] border border-white/5 p-3.5 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500 font-medium text-[10px] uppercase tracking-widest">
                  <span>Agent 2 AI Due Diligence Output</span>
                  <span className="text-purple-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini Synthesized
                  </span>
                </div>
                <p className="text-purple-200 font-mono whitespace-pre-line leading-relaxed text-xs">
                  {activeLead.ai_output || "Awaiting Agent 2 due diligence research."}
                </p>
              </div>

              {/* Messages Stream */}
              {activeMessages.map(msg => {
                const isLead = msg.sender === 'Lead';
                const isAgent = msg.sender.includes('Agent');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isLead ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-500">
                      {isAgent ? <Bot className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-blue-400" />}
                      <span className="font-medium text-gray-400">{msg.sender}</span>
                      <span>•</span>
                      <span>{formatDate(msg.timestamp)}</span>
                    </div>

                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        isLead
                          ? 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                          : isAgent
                            ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 rounded-tr-none'
                            : 'bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-tr-none'
                      }`}
                    >
                      {msg.message_text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions & Reply Toolbar */}
            <div className="p-4 border-t border-white/5 bg-[#0A0A0B] space-y-3">
              <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest whitespace-nowrap">
                  Quick Actions:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRunAgent3(activeLead.id)}
                    disabled={isLoadingAgent}
                    className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isLoadingAgent ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>Generate Agent 3 Response</span>
                  </button>

                  <button
                    onClick={() => insertQuickTemplate('calendly')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] rounded border border-white/10 transition-colors cursor-pointer"
                  >
                    Insert Calendar Link
                  </button>

                  <button
                    onClick={() => insertQuickTemplate('investor')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] rounded border border-white/10 transition-colors cursor-pointer"
                  >
                    Investor Access Template
                  </button>

                  <button
                    onClick={() => insertQuickTemplate('followup')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] rounded border border-white/10 transition-colors cursor-pointer"
                  >
                    Quick Demo Followup
                  </button>
                </div>
              </div>

              {/* Text Reply Input */}
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Respond directly to ${activeLead.first_name}...`}
                  className="flex-1 bg-[#1A1A1C] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 h-full"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <MessageSquare className="w-10 h-10 text-gray-600 mb-2" />
            <p className="text-sm">Select a lead from the intake stream on the left to monitor messages and respond.</p>
          </div>
        )}
      </div>

    </div>
  );
};
