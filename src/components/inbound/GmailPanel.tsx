import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, initAuth } from './lib/googleAuth';
import { 
  sendGmailMessage, 
  listRecentGmailMessages, 
  GmailMessageSummary 
} from './lib/googleGmail';
import { Lead, LeadMessage } from '../../types/inbound';
import { 
  Mail, 
  Send, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Sparkles,
  Inbox,
  Zap,
  Bot
} from 'lucide-react';

interface GmailPanelProps {
  leads: Lead[];
  systemMessages?: LeadMessage[];
  onRunAgentOnLead?: (leadId: string, agentId: 'agent_2_due_diligence' | 'agent_3_engagement') => void;
  onLogSync?: (action: string, details: string) => void;
}

export const GmailPanel: React.FC<GmailPanelProps> = ({ 
  leads, 
  systemMessages = [], 
  onRunAgentOnLead, 
  onLogSync 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRunningTrigger, setIsRunningTrigger] = useState(false);

  // Email composer form state
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('Follow-up: Consultation Request - LeadFlow AI');
  const [body, setBody] = useState<string>(
    'Hi there,\n\nThank you for reaching out regarding our strategic lead consultation services. We have received your signal information and initialized due diligence.\n\nPlease let us know your preferred availability for a 15-minute strategy call.\n\nBest regards,\nLeadFlow AI Operations Team'
  );
  const [isSending, setIsSending] = useState<boolean>(false);

  // Recent messages history
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      loadGmailMessages();
    }
  }, [user, accessToken]);

  const loadGmailMessages = async () => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const msgs = await listRecentGmailMessages(accessToken);
      setMessages(msgs);
    } catch (err: any) {
      console.warn('Could not load Gmail messages:', err.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({ text: 'Connected to Gmail API!', type: 'success' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to authenticate with Gmail', type: 'error' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Lead selection prefill
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setRecipientEmail(lead.email || '');
      setSubject(`Executive Due Diligence & Briefing for ${lead.first_name} ${lead.last_name} | JB3AI`);
      setBody(
        `Dear ${lead.first_name},\n\nOur Research & Due Diligence Agent has completed a personalized analysis for ${lead.first_name} ${lead.last_name} (${lead.email}).\n\nEXECUTIVE DUE DILIGENCE SYNTHESIS:\n${lead.ai_output || 'Pending Agent 2 analysis...'}\n\nWe invite you to schedule a consultation directly on Jonathan Blackburn\'s calendar:\nhttps://calendly.com/jb3ai/intro\n\nBest regards,\nJB3AI Operations Team`
      );
    }
  };

  const handleTriggerDueDiligenceEmail = async () => {
    if (!selectedLeadId) {
      setStatusMessage({ text: 'Please select a pipeline lead first.', type: 'error' });
      return;
    }
    setIsRunningTrigger(true);
    setStatusMessage({ text: 'Running Agent 2 Research & firing automated Gmail trigger...', type: 'info' });
    try {
      if (onRunAgentOnLead) {
        await onRunAgentOnLead(selectedLeadId, 'agent_2_due_diligence');
        const lead = leads.find(l => l.id === selectedLeadId);
        setStatusMessage({ 
          text: `⚡ Automated Gmail Trigger executed successfully! Due diligence summary dispatched to ${lead?.email || recipientEmail}`, 
          type: 'success' 
        });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'Failed to execute automated trigger.', type: 'error' });
    } finally {
      setIsRunningTrigger(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setStatusMessage({ text: 'Please sign in with Google first.', type: 'error' });
      return;
    }
    if (!recipientEmail) {
      setStatusMessage({ text: 'Please provide a recipient email address.', type: 'error' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await sendGmailMessage(accessToken, {
        to: recipientEmail,
        subject,
        body
      });

      if (onLogSync) {
        onLogSync('GMAIL_SENT', `Sent email to ${recipientEmail} (Msg ID: ${res.id})`);
      }

      setStatusMessage({
        text: `Successfully dispatched email to ${recipientEmail} via Gmail API!`,
        type: 'success'
      });
      loadGmailMessages();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to send email via Gmail API', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gmail Control Header */}
      <div className="bg-[#0F0F11] border border-rose-500/20 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  Live Gmail API Integration
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Gmail REST API v1
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Send authentic, verified emails directly to pipeline leads via your connected Gmail account
              </p>
            </div>
          </div>

          {!user ? (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors cursor-pointer shrink-0 shadow-md"
            >
              {isAuthenticating ? 'Connecting...' : 'Connect Gmail Account'}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#161618] border border-white/10 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-200 font-medium">Gmail Connected ({user.email})</span>
            </div>
          )}
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-300'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
          }`}>
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Gmail Composer & Recent Mail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Email Composer Form */}
          <div className="lg:col-span-7 bg-[#0A0A0B] border border-white/5 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-rose-400" />
              Compose & Send Email via Gmail
            </h4>

            <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
              {/* Select Lead */}
              <div>
                <label className="block text-gray-400 mb-1">Select Pipeline Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Custom Email Recipient --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} ({l.email || 'No Email'}) - {l.origin_source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-gray-400 mb-1">To (Recipient Email Address)</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-gray-400 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-gray-400 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-rose-500 font-sans"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!user || isSending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs transition-all cursor-pointer shadow-md"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Email via Gmail API</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerDueDiligenceEmail}
                  disabled={isRunningTrigger || !selectedLeadId}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-all cursor-pointer shadow-md border border-purple-400/30"
                >
                  {isRunningTrigger ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>⚡ Fire Agent 2 Gmail Trigger</span>
                </button>
              </div>
            </form>
          </div>

          {/* Mailbox Snippets / Sent History */}
          <div className="lg:col-span-5 bg-[#0A0A0B] border border-white/5 rounded-xl p-4 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-amber-400" />
                  Recent Mail Messages
                </h4>
                {user && (
                  <button
                    onClick={loadGmailMessages}
                    disabled={isLoadingMessages}
                    className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Gmail inbox"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {user ? (
                <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {messages.length > 0 ? (
                    messages.map(m => (
                      <div
                        key={m.id}
                        className="bg-[#161618] border border-white/5 p-3 rounded-xl space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-gray-300 font-semibold">
                          <span className="truncate max-w-[180px]">
                            {m.headers?.Subject || '(No Subject)'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {m.internalDate
                              ? new Date(Number(m.internalDate)).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
                        </div>
                        {m.headers?.From && (
                          <div className="text-[10px] text-gray-400 truncate font-mono">
                            From: {m.headers.From}
                          </div>
                        )}
                        {m.snippet && (
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                            {m.snippet}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-500">
                      No recent Gmail messages retrieved.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-500">
                  Connect your Gmail account above to view recent message activity and send verified emails to your pipeline leads.
                </div>
              )}
            </div>

            {/* AUTOMATED GMAIL DUE DILIGENCE DISPATCH LOG */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  Automated Due Diligence Dispatches
                </span>
                <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                  {systemMessages.filter(m => m.type === 'due_diligence_email' || m.sender === 'Automated Gmail Trigger').length} Dispatched
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-xs">
                {systemMessages.filter(m => m.type === 'due_diligence_email' || m.sender === 'Automated Gmail Trigger').length > 0 ? (
                  systemMessages
                    .filter(m => m.type === 'due_diligence_email' || m.sender === 'Automated Gmail Trigger')
                    .map(m => {
                      const lead = leads.find(l => l.id === m.lead_id);
                      return (
                        <div key={m.id} className="bg-[#161618] border border-rose-500/20 p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-white font-medium text-[11px]">
                            <span className="truncate">
                              Subject: {lead ? `${lead.first_name} ${lead.last_name}` : 'Pipeline Subject'}
                            </span>
                            <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Owner Sent: jono@jonoblackburn.com
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-2 font-mono leading-tight">
                            {m.message_text.replace('[INTERNAL GMAIL DISPATCH TO OWNER]\n', '').replace('[AUTOMATED GMAIL DISPATCH]\n', '')}
                          </p>
                          <div className="text-[9px] text-gray-500 font-mono flex items-center justify-between">
                            <span className="text-amber-400 font-sans text-[10px]">🔒 Internal Use Only (Owner Inbox)</span>
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-4 text-[11px] text-gray-500">
                    No automated Due Diligence Gmail triggers executed yet. Run Agent 2 to see live dispatches here!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
