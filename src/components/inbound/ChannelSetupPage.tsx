import React, { useState } from 'react';
import { Lead, OriginSource, LeadMessage, SheetSyncLog } from '../../types/inbound';
import { 
  Radio, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Globe, 
  MessageSquare, 
  Mail, 
  Phone, 
  FileSpreadsheet, 
  ExternalLink, 
  Bot, 
  Key, 
  ArrowRight,
  Code2,
  Activity,
  Sparkles
} from 'lucide-react';
import { getSourceBadgeColor, getSourceIcon, formatDate } from './utils';

export interface ChannelConfig {
  id: OriginSource | 'GoogleSheets';
  name: string;
  source: OriginSource | 'GoogleSheets';
  originType: string;
  endpointUrl: string;
  verifyToken: string;
  apiKey: string;
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  latencyMs: number;
  uptimePct: number;
  autoResponseEnabled: boolean;
  autoResponseAgent: 'agent_1_intake' | 'agent_2_due_diligence' | 'agent_3_engagement';
  lastLeadReceived?: string;
  totalLeadsIngested: number;
  description: string;
}

interface ChannelSetupPageProps {
  leads: Lead[];
  onTriggerWebhook: (endpoint: string, payload: any) => Promise<void>;
  onLogSync?: (action: string, details: string) => void;
  onOpenMessages?: (leadId: string) => void;
  onNavigateToTab?: (tab: 'pipeline' | 'messages') => void;
}

export const INITIAL_CHANNELS: ChannelConfig[] = [
  {
    id: 'Website',
    name: 'Website Form Intake Webhook',
    source: 'Website',
    originType: 'Form Signup',
    endpointUrl: '/api/webhooks/website',
    verifyToken: 'WEB_SECRET_JB3AI_2026',
    apiKey: 'sk_live_web_9874a6b1c2d3e4f5',
    status: 'CONNECTED',
    latencyMs: 14,
    uptimePct: 99.98,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_1_intake',
    totalLeadsIngested: 42,
    description: 'Captures investor & client signups from jonoblackburn.com portal with instant POPIA consent verification.'
  },
  {
    id: 'WhatsApp',
    name: 'WhatsApp Business Graph API',
    source: 'WhatsApp',
    originType: 'Direct Message',
    endpointUrl: '/api/webhooks/meta',
    verifyToken: 'JB3AI_META_SECRET_TOKEN_2026',
    apiKey: 'EAAG9xZ...MetaGraphV18Token',
    status: 'CONNECTED',
    latencyMs: 22,
    uptimePct: 99.95,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_1_intake',
    totalLeadsIngested: 38,
    description: 'Direct Meta Cloud API webhook receiving WhatsApp customer conversations and auto-dispatching AI pre-qualification.'
  },
  {
    id: 'Email',
    name: 'Gmail & Direct Email OAuth API',
    source: 'Email',
    originType: 'Direct Email',
    endpointUrl: '/api/webhooks/email',
    verifyToken: 'GMAIL_OAUTH_TOKEN_SCOPE_READ',
    apiKey: 'oauth_client_74629810.apps.googleusercontent.com',
    status: 'CONNECTED',
    latencyMs: 38,
    uptimePct: 100.0,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_3_engagement',
    totalLeadsIngested: 29,
    description: 'Inbound email listener connected to hi@jb3ai.com. Parses subject lines, intent, and auto-drafts responses.'
  },
  {
    id: 'VoiceGrid',
    name: 'VoiceGrid Telephony API',
    source: 'VoiceGrid',
    originType: 'Voice Call',
    endpointUrl: '/api/webhooks/voicegrid',
    verifyToken: 'VG_SIGNAL_DRIVE_SECRET',
    apiKey: 'vg_live_pk_883201948571',
    status: 'CONNECTED',
    latencyMs: 45,
    uptimePct: 99.91,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_2_due_diligence',
    totalLeadsIngested: 16,
    description: 'SIP trunk call transcript webhook. Automatically triggers background due diligence for caller profiles.'
  },
  {
    id: 'Facebook',
    name: 'Facebook Lead Ads Webhook',
    source: 'Facebook',
    originType: 'Lead Ad',
    endpointUrl: '/api/webhooks/channel/facebook',
    verifyToken: 'FB_LEAD_ADS_VERIFY_2026',
    apiKey: 'fb_app_sec_49201938472',
    status: 'CONNECTED',
    latencyMs: 19,
    uptimePct: 99.89,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_1_intake',
    totalLeadsIngested: 24,
    description: 'Subscribes to Meta Lead Ad instant forms. Ingests full campaign parameter data directly to Master Pipeline.'
  },
  {
    id: 'Instagram',
    name: 'Instagram Direct Inbox API',
    source: 'Instagram',
    originType: 'Direct Message',
    endpointUrl: '/api/webhooks/channel/instagram',
    verifyToken: 'IG_DM_VERIFY_TOKEN_2026',
    apiKey: 'ig_access_token_993817264',
    status: 'CONNECTED',
    latencyMs: 28,
    uptimePct: 99.94,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_1_intake',
    totalLeadsIngested: 19,
    description: 'Instagram Business account messaging API. Routes direct message inquiries to AI intake agent.'
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn B2B Lead Gen API',
    source: 'LinkedIn',
    originType: 'Form Signup',
    endpointUrl: '/api/webhooks/channel/linkedin',
    verifyToken: 'LINKEDIN_WEBHOOK_SECRET',
    apiKey: 'li_client_sec_102938475',
    status: 'CONNECTED',
    latencyMs: 31,
    uptimePct: 99.97,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_2_due_diligence',
    totalLeadsIngested: 27,
    description: 'LinkedIn Lead Gen form integration. Instantly enriches B2B lead profiles with executive due diligence.'
  },
  {
    id: 'GoogleSheets',
    name: 'Google AppsScript Web App API',
    source: 'GoogleSheets',
    originType: 'Sheet Sync',
    endpointUrl: '/api/sheet/sync/logs',
    verifyToken: 'APPS_SCRIPT_DEPLOYMENT_ID_V2',
    apiKey: 'AKfycbz_JB3_MasterPipeline_DeploymentKey',
    status: 'CONNECTED',
    latencyMs: 110,
    uptimePct: 99.99,
    autoResponseEnabled: true,
    autoResponseAgent: 'agent_1_intake',
    totalLeadsIngested: 125,
    description: 'Bidirectional sync engine connecting Google Sheets MASTER_PIPELINE tab with LeadFlow AI runtime.'
  }
];

export const ChannelSetupPage: React.FC<ChannelSetupPageProps> = ({
  leads,
  onTriggerWebhook,
  onLogSync,
  onOpenMessages,
  onNavigateToTab
}) => {
  const [channels, setChannels] = useState<ChannelConfig[]>(INITIAL_CHANNELS);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Test Console State
  const [selectedChannelId, setSelectedChannelId] = useState<OriginSource | 'GoogleSheets'>('Website');
  const [testName, setTestName] = useState('Alexandra Vance');
  const [testEmail, setTestEmail] = useState('a.vance@apexcapital.co');
  const [testPhone, setTestPhone] = useState('+27839994411');
  const [testAccessType, setTestAccessType] = useState('Investor Access');
  const [testMessage, setTestMessage] = useState('Hi Jonathan, we would like to explore integrating JB3AI lead automation with our investment portfolio.');
  const [customJsonPayload, setCustomJsonPayload] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResponseResult, setTestResponseResult] = useState<{
    status: number;
    statusText: string;
    responseTimeMs: number;
    signalId?: string;
    leadId?: string;
    aiResponse?: string;
    rawResponseBody?: any;
  } | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleChannelStatus = (channelId: string) => {
    setChannels(prev =>
      prev.map(c => {
        if (c.id === channelId) {
          const nextStatus = 
            c.status === 'CONNECTED' ? 'DEGRADED' : c.status === 'DEGRADED' ? 'DISCONNECTED' : 'CONNECTED';
          if (onLogSync) {
            onLogSync('CHANNEL_STATUS_TOGGLE', `Channel "${c.name}" status toggled to ${nextStatus}`);
          }
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleToggleAutoResponse = (channelId: string) => {
    setChannels(prev =>
      prev.map(c => {
        if (c.id === channelId) {
          const next = !c.autoResponseEnabled;
          if (onLogSync) {
            onLogSync('AUTO_RESPONSE_TOGGLE', `Auto-Response for "${c.name}" set to ${next ? 'ENABLED' : 'DISABLED'}`);
          }
          return { ...c, autoResponseEnabled: next };
        }
        return c;
      })
    );
  };

  const handleSelectChannelTemplate = (channelId: OriginSource | 'GoogleSheets') => {
    setSelectedChannelId(channelId);
    if (channelId === 'Website') {
      setTestName('Alexandra Vance');
      setTestEmail('a.vance@apexcapital.co');
      setTestPhone('+27839994411');
      setTestAccessType('Investor Access');
      setTestMessage('Inquiring via website portal regarding custom AI lead intake architecture.');
    } else if (channelId === 'WhatsApp') {
      setTestName('Kagiso Mokoena');
      setTestEmail('k.mokoena@fintech.co.za');
      setTestPhone('+27825550199');
      setTestAccessType('Advisory / Client');
      setTestMessage('Hi Jonathan! I saw your WhatsApp AI bot post. How quickly can we setup automated lead qualification?');
    } else if (channelId === 'Email') {
      setTestName('Dr. Richard Thorne');
      setTestEmail('r.thorne@biomedtech.org');
      setTestPhone('+27814442200');
      setTestAccessType('Collaborator');
      setTestMessage('Direct Email inquiry: Proposal for joint AI research & automated CRM pipeline sync.');
    } else if (channelId === 'VoiceGrid') {
      setTestName('Captain David Khumalo');
      setTestEmail('d.khumalo@voicegrid-tech.com');
      setTestPhone('+27831110099');
      setTestAccessType('Advisory / Client');
      setTestMessage('VoiceGrid Inbound Call Transcript: Caller requested immediate consultation on telephony lead intake.');
    } else if (channelId === 'Facebook') {
      setTestName('Elena Rostova');
      setTestEmail('elena.r@meta-leads.com');
      setTestPhone('+27847773322');
      setTestAccessType('General Website Signup');
      setTestMessage('Facebook Instant Lead Ad submission from 2026 Growth Campaign.');
    } else if (channelId === 'Instagram') {
      setTestName('Tariq Al-Mansoor');
      setTestEmail('tariq@horizondev.ae');
      setTestPhone('+971501234567');
      setTestAccessType('Investor Access');
      setTestMessage('Instagram DM: Interested in venture funding opportunities via JB3AI portal.');
    } else if (channelId === 'LinkedIn') {
      setTestName('Sarah Jenkins');
      setTestEmail('sarah.j@apexcapital.co');
      setTestPhone('+27823338877');
      setTestAccessType('Investor Access');
      setTestMessage('LinkedIn Lead Gen Form: Inquiring about due diligence AI integration.');
    } else {
      setTestName('Master Sheet Import');
      setTestEmail('sheet.sync@jb3ai.com');
      setTestPhone('+27800000000');
      setTestAccessType('News Newsletter');
      setTestMessage('Automated Google Sheet sync payload test.');
    }
  };

  const handleSendTestPayload = async () => {
    setIsSendingTest(true);
    setTestResponseResult(null);
    const startTime = performance.now();

    const currentChan = channels.find(c => c.id === selectedChannelId);
    const targetEndpoint = currentChan ? currentChan.endpointUrl : '/api/webhooks/website';

    let payload: any = {
      name: testName,
      email: testEmail,
      phone: testPhone,
      origin_source: selectedChannelId === 'GoogleSheets' ? 'Website' : selectedChannelId,
      origin_type: currentChan?.originType || 'Form Signup',
      access_type: testAccessType,
      notes: testMessage,
      message: testMessage,
      newsletter_opt_in: true,
      timestamp: new Date().toISOString()
    };

    if (customJsonPayload.trim()) {
      try {
        payload = JSON.parse(customJsonPayload);
      } catch (err) {
        alert("Invalid custom JSON format. Using standard form payload instead.");
      }
    }

    try {
      await onTriggerWebhook(targetEndpoint, payload);
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);

      // Find the created lead
      const latestLead = leads[0];
      const signalId = latestLead?.signal_id || `JB3-SIG-${Math.floor(1000 + Math.random() * 9000)}`;

      setTestResponseResult({
        status: 200,
        statusText: '200 OK - Lead Successfully Ingested',
        responseTimeMs,
        signalId,
        leadId: latestLead?.id || 'NEW_LEAD',
        aiResponse: latestLead?.ai_output || `Agent 1 Intake acknowledged inbound payload from ${selectedChannelId}.`,
        rawResponseBody: {
          success: true,
          status: 'EVENT_RECEIVED',
          signal_id: signalId,
          origin_channel: selectedChannelId,
          auto_response_agent: currentChan?.autoResponseAgent || 'agent_1_intake',
          processed_at: new Date().toISOString()
        }
      });

      // Update lead count for channel
      setChannels(prev =>
        prev.map(c => (c.id === selectedChannelId ? { ...c, totalLeadsIngested: c.totalLeadsIngested + 1, lastLeadReceived: new Date().toISOString() } : c))
      );

      if (onLogSync) {
        onLogSync('TEST_PAYLOAD_SENT', `Injected test payload to ${selectedChannelId} API (${targetEndpoint}) -> ${signalId}`);
      }
    } catch (err: any) {
      setTestResponseResult({
        status: 500,
        statusText: '500 Internal Error',
        responseTimeMs: Math.round(performance.now() - startTime),
        rawResponseBody: { error: err.message || 'Failed to dispatch payload' }
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const activeConnectedCount = channels.filter(c => c.status === 'CONNECTED').length;
  const totalIngestedLeads = channels.reduce((sum, c) => sum + c.totalLeadsIngested, 0);

  return (
    <div className="space-y-6">
      {/* HEADER & OVERALL SYSTEM HEALTH BAR */}
      <div className="bg-[#0F0F11] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Origin Channels & API Integration Control Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{activeConnectedCount}/{channels.length} Channels Live</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-3xl">
                Configures real-time API webhooks, OAuth connections, and automated response routing across all incoming lead origin channels (Website, WhatsApp, Email, VoiceGrid, Facebook, Instagram, LinkedIn, Google Sheets).
              </p>
            </div>
          </div>

          {/* Quick Metrics & Master Key Display */}
          <div className="flex items-center gap-3 bg-[#0A0A0B] border border-white/10 p-3 rounded-xl shrink-0 flex-wrap sm:flex-nowrap">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Total Ingested Leads</span>
              <span className="text-sm font-bold text-white">{totalIngestedLeads} Payloads</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Average API Latency</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">18 ms</span>
            </div>
          </div>
        </div>

        {/* Global Security Secret Key Banner */}
        <div className="bg-[#0A0A0B] border border-blue-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Master Webhook Verification Secret: </span>
              <span className="font-mono text-blue-300">JB3AI_META_SECRET_TOKEN_2026</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy('JB3AI_META_SECRET_TOKEN_2026', 'master_secret')}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedField === 'master_secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'master_secret' ? 'Copied' : 'Copy Secret'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ORIGIN CHANNELS API CONFIGURATION & STATUS LIGHTS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Configured Lead Origin Channels & Response Links</span>
          </h3>
          <span className="text-xs text-gray-500">Click any status light to toggle connection operational state</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((chan) => {
            const sourceIcon = getSourceIcon(chan.source === 'GoogleSheets' ? 'Website' : (chan.source as OriginSource));
            
            return (
              <div
                key={chan.id}
                className={`bg-[#0F0F11] border rounded-2xl p-4 space-y-3.5 shadow-xl transition-all duration-200 hover:border-white/20 relative flex flex-col justify-between ${
                  chan.status === 'CONNECTED'
                    ? 'border-white/10'
                    : chan.status === 'DEGRADED'
                    ? 'border-amber-500/30'
                    : 'border-red-500/30 bg-red-950/10'
                }`}
              >
                <div>
                  {/* Channel Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                        {chan.id === 'GoogleSheets' ? <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> : <span className="text-xl" aria-hidden="true">{sourceIcon}</span>} 
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-white leading-tight">
                          {chan.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {chan.originType}
                        </span>
                      </div>
                    </div>

                    {/* STATUS LIGHT BADGE */}
                    <button
                      onClick={() => handleToggleChannelStatus(chan.id)}
                      title="Click to toggle status: CONNECTED -> DEGRADED -> DISCONNECTED"
                      className="cursor-pointer shrink-0"
                    >
                      {chan.status === 'CONNECTED' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Connected</span>
                        </div>
                      )}

                      {chan.status === 'DEGRADED' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>Degraded</span>
                        </div>
                      )}

                      {chan.status === 'DISCONNECTED' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono font-semibold">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Offline</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Channel Description */}
                  <p className="text-[11px] text-gray-400 mt-2.5 line-clamp-2">
                    {chan.description}
                  </p>

                  {/* Endpoint URL Field */}
                  <div className="mt-3 bg-[#0A0A0B] border border-white/5 p-2 rounded-lg space-y-1">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold block">Webhook Endpoint</span>
                    <div className="flex items-center justify-between gap-1 font-mono text-[10px] text-blue-300">
                      <span className="truncate">{chan.endpointUrl}</span>
                      <button
                        onClick={() => handleCopy(chan.endpointUrl, `ep_${chan.id}`)}
                        className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
                      >
                        {copiedField === `ep_${chan.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Response Linkage & Auto-Response Trigger */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">AI Response Agent:</span>
                    <span className="font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px]">
                      {chan.autoResponseAgent === 'agent_1_intake' ? 'Agent 1 Intake' : chan.autoResponseAgent === 'agent_2_due_diligence' ? 'Agent 2 Research' : 'Agent 3 Outreach'}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                  <div className="flex items-center gap-2 font-mono">
                    <span>Latency: <strong className="text-gray-300">{chan.latencyMs}ms</strong></span>
                    <span>•</span>
                    <span>Uptime: <strong className="text-emerald-400">{chan.uptimePct}%</strong></span>
                  </div>

                  <button
                    onClick={() => handleSelectChannelTemplate(chan.id)}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Test API</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE TEST SECTION ("SEND TEST MESSAGES & PAYLOADS") */}
      <div className="bg-[#0F0F11] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Origin Channel Test Message & Payload Injection Sandbox
              </h3>
              <p className="text-xs text-gray-400">
                Simulate inbound lead messages across any channel, test webhook APIs, and observe automated response generation.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-300 font-mono text-xs font-semibold shrink-0">
            Sandbox Active
          </span>
        </div>

        {/* Channel Selection Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
            1. Select Target Origin Channel to Test:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {channels.map(chan => (
              <button
                key={chan.id}
                onClick={() => handleSelectChannelTemplate(chan.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  selectedChannelId === chan.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-[#161618] text-gray-400 hover:text-white border-white/5 hover:border-white/20'
                }`}
              >
                <span>{chan.name.split(' ')[0]} ({chan.source})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payload Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0A0A0B] border border-white/5 p-4 rounded-xl">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400 font-semibold block">Lead Full Name</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-400 font-semibold block">Email Address</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-400 font-semibold block">Phone (E.164)</label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-400 font-semibold block">Access Type Category</label>
            <select
              value={testAccessType}
              onChange={(e) => setTestAccessType(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Investor Access">Investor Access</option>
              <option value="Advisory / Client">Advisory / Client</option>
              <option value="Collaborator">Collaborator</option>
              <option value="Press / Media">Press / Media</option>
              <option value="News Newsletter">News Newsletter</option>
              <option value="General Website Signup">General Website Signup</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-4 space-y-1">
            <label className="text-[11px] text-gray-400 font-semibold block">
              Inbound Test Message Content / Notes Payload
            </label>
            <textarea
              rows={2}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Type inbound lead message..."
            />
          </div>
        </div>

        {/* Submit & Dispatch Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Target Endpoint: <strong className="font-mono text-blue-300">{channels.find(c => c.id === selectedChannelId)?.endpointUrl}</strong></span>
          </div>

          <button
            onClick={handleSendTestPayload}
            disabled={isSendingTest}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Send className={`w-4 h-4 ${isSendingTest ? 'animate-bounce' : ''}`} />
            <span>{isSendingTest ? 'Ingesting Test Payload...' : '🚀 Dispatch Test Lead Payload'}</span>
          </button>
        </div>

        {/* LIVE RESPONSE INSPECTOR */}
        {testResponseResult && (
          <div className="bg-[#0A0A0B] border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white">{testResponseResult.statusText}</span>
                <span className="text-xs font-mono text-emerald-400">({testResponseResult.responseTimeMs} ms)</span>
              </div>
              {testResponseResult.signalId && (
                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-xs font-semibold">
                  Signal ID: {testResponseResult.signalId}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-300 bg-[#161618] border border-white/5 p-3 rounded-lg">
                <span className="font-semibold text-white block mb-1">Generated AI Intake Response for Channel:</span>
                <p className="text-gray-300 italic">{testResponseResult.aiResponse}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('messages')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open in Messages Center</span>
                  </button>
                )}

                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('pipeline')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>View in Master Pipeline</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
