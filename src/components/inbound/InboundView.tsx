import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { MetricsOverview } from './MetricsOverview';
import { PipelineTable } from './PipelineTable';
import { LeadDetailModal } from './LeadDetailModal';
import { MessagesCenter } from './MessagesCenter';
import { AgentsControlPanel } from './AgentsControlPanel';
import { WebhookSimulator } from './WebhookSimulator';
import { AppsScriptPanel } from './AppsScriptPanel';
import { GoogleCalendarPanel } from './GoogleCalendarPanel';
import { GmailPanel } from './GmailPanel';
import { CreateLeadModal } from './CreateLeadModal';
import { ChannelSetupPage } from './ChannelSetupPage';
import { GoogleSheetsConnectBar } from './GoogleSheetsConnectBar';

import { 
  Lead, 
  LeadMessage, 
  SheetSyncLog, 
  AgentConfig, 
  LeadStatus 
} from '../../types/inbound';
import { 
  INITIAL_LEADS, 
  INITIAL_MESSAGES, 
  INITIAL_SYNC_LOGS, 
  INITIAL_AGENTS,
  INITIAL_CALENDAR_EVENTS
} from './data/mockData';
import { GoogleCalendarEvent } from './lib/googleCalendar';
import { SyncDiscrepancy } from './lib/syncAudit';
import { getAccessToken } from './lib/googleAuth';

export function InboundView() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'calendar' | 'gmail' | 'messages' | 'agents' | 'simulator' | 'script' | 'setup'>('pipeline');
  
  // Data state
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [messages, setMessages] = useState<LeadMessage[]>(INITIAL_MESSAGES);
  const [syncLogs, setSyncLogs] = useState<SheetSyncLog[]>(INITIAL_SYNC_LOGS);
  const [agents, setAgents] = useState<AgentConfig[]>(INITIAL_AGENTS);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(INITIAL_CALENDAR_EVENTS);

  // Selected lead & modal states
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [selectedLeadForMessages, setSelectedLeadForMessages] = useState<string | null>(INITIAL_LEADS[0]?.id || null);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingAgentLeadId, setLoadingAgentLeadId] = useState<string | null>(null);
  const [gmailNotification, setGmailNotification] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Fetch initial data from server API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resLeads = await fetch('/api/leads');
        if (resLeads.ok) {
          const data = await resLeads.json();
          if (data.leads && data.leads.length > 0) setLeads(data.leads);
        }

        const resMsgs = await fetch('/api/messages');
        if (resMsgs.ok) {
          const data = await resMsgs.json();
          if (data.messages) setMessages(data.messages);
        }

        const resLogs = await fetch('/api/sheet/sync/logs');
        if (resLogs.ok) {
          const data = await resLogs.json();
          if (data.logs) setSyncLogs(data.logs);
        }

        const resAgents = await fetch('/api/agents');
        if (resAgents.ok) {
          const data = await resAgents.json();
          if (data.agents) setAgents(data.agents);
        }
      } catch (err) {
        console.warn("Using fallback initial state while backend connects:", err);
      }
    };

    fetchData();
  }, []);

  // Handler: Change lead status
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const now = new Date().toISOString();

    // Optimistic UI update
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const history = l.status_history ? [...l.status_history] : [];
        if (l.current_status !== newStatus) {
          history.push({
            id: `SH-${Date.now()}`,
            from_status: l.current_status,
            to_status: newStatus,
            changed_by: 'Operator',
            timestamp: now,
            note: `Status manually updated to ${newStatus}`
          });
        }
        const updatedLead = {
          ...l,
          current_status: newStatus,
          updated_at: now,
          status_history: history
        };
        if (selectedLeadForDetail?.id === leadId) {
          setSelectedLeadForDetail(updatedLead);
        }
        return updatedLead;
      }
      return l;
    }));

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_status: newStatus, changed_by: 'Operator' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
          if (selectedLeadForDetail?.id === leadId) {
            setSelectedLeadForDetail(data.lead);
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  };

  // Handler: Run Gemini AI Agent on Lead
  const handleRunAgent = async (leadId: string, agentId: 'agent_2_due_diligence' | 'agent_3_engagement' = 'agent_2_due_diligence') => {
    setLoadingAgentLeadId(leadId);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead_id: leadId, 
          agent_id: agentId, 
          access_token: accessToken,
          owner_email: 'jono@jonoblackburn.com'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
          if (selectedLeadForDetail?.id === leadId) {
            setSelectedLeadForDetail(data.lead);
          }

          if (agentId === 'agent_2_due_diligence') {
            setGmailNotification(`⚡ Automated Gmail Trigger Fired! Dispatched INTERNAL Due Diligence report for ${data.lead.first_name} ${data.lead.last_name} to Owner User (jono@jonoblackburn.com).`);
            setTimeout(() => setGmailNotification(null), 8000);
          }
        }
        // Refetch messages and sync logs
        const msgsRes = await fetch('/api/messages');
        if (msgsRes.ok) {
          const mData = await msgsRes.json();
          if (mData.messages) setMessages(mData.messages);
        }

        const logsRes = await fetch('/api/sheet/sync/logs');
        if (logsRes.ok) {
          const lData = await logsRes.json();
          if (lData.logs) setSyncLogs(lData.logs);
        }
      }
    } catch (err) {
      console.error("Failed to run agent:", err);
    } finally {
      setLoadingAgentLeadId(null);
    }
  };

  // Handler: Send Reply
  const handleSendReply = async (leadId: string, text: string) => {
    const lead = leads.find(l => l.id === leadId);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          sender: 'Operator',
          channel: lead?.origin_source || 'WhatsApp',
          type: 'manual_reply',
          message_text: text
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }
        // Re-fetch leads for status updates
        const lRes = await fetch('/api/leads');
        if (lRes.ok) {
          const lData = await lRes.json();
          if (lData.leads) setLeads(lData.leads);
        }
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  // Handler: Trigger Webhook Simulation
  const handleTriggerWebhook = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.lead) {
        setLeads(prev => [data.lead, ...prev]);
        setSelectedLeadForMessages(data.lead.id);
      }
      // Refresh messages & logs
      const msgsRes = await fetch('/api/messages');
      if (msgsRes.ok) {
        const mData = await msgsRes.json();
        if (mData.messages) setMessages(mData.messages);
      }
      const logsRes = await fetch('/api/sheet/sync/logs');
      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (lData.logs) setSyncLogs(lData.logs);
      }
    }
  };

  // Handler: Reconcile Bidirectional Sync Discrepancy
  const handleResolveDiscrepancy = (
    discrepancy: SyncDiscrepancy,
    action: 'UPDATE_STATUS' | 'RESET_STATUS' | 'SYNC_TIME'
  ) => {
    const now = new Date().toISOString();

    if (action === 'UPDATE_STATUS') {
      setLeads(prev =>
        prev.map(l => {
          if (l.id === discrepancy.leadId) {
            let callDate = l.call_date;
            let callTime = l.call_time;
            if (discrepancy.eventStartISO) {
              const dt = new Date(discrepancy.eventStartISO);
              callDate = dt.toISOString().split('T')[0];
              callTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
            }
            return {
              ...l,
              current_status: 'Call Scheduled',
              call_date: callDate,
              call_time: callTime,
              updated_at: now
            };
          }
          return l;
        })
      );
      handleLogSync(
        'CALENDAR_SYNC_RECONCILE',
        `Reconciled discrepancy: Updated lead "${discrepancy.leadName}" status to Call Scheduled based on Google Calendar event.`
      );
    } else if (action === 'RESET_STATUS') {
      setLeads(prev =>
        prev.map(l => {
          if (l.id === discrepancy.leadId) {
            return {
              ...l,
              current_status: 'Researched',
              call_date: undefined,
              call_time: undefined,
              updated_at: now
            };
          }
          return l;
        })
      );
      handleLogSync(
        'CALENDAR_SYNC_RECONCILE',
        `Reconciled discrepancy: Reset status for lead "${discrepancy.leadName}" to Researched due to deleted/missing Google Calendar event.`
      );
    } else if (action === 'SYNC_TIME') {
      if (discrepancy.eventStartISO) {
        const dt = new Date(discrepancy.eventStartISO);
        const callDate = dt.toISOString().split('T')[0];
        const callTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        setLeads(prev =>
          prev.map(l => (l.id === discrepancy.leadId ? { ...l, call_date: callDate, call_time: callTime, updated_at: now } : l))
        );
        handleLogSync(
          'CALENDAR_SYNC_RECONCILE',
          `Reconciled discrepancy: Synced pipeline timestamp for "${discrepancy.leadName}" to ${callDate} ${callTime}.`
        );
      }
    }
  };

  // Handler: Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    try {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  // Handler: Create Lead manually
  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads(prev => [data.lead, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
  };

  // Handler: Update Agent System Prompt
  const handleUpdateAgentPrompt = async (agentId: string, systemPrompt: string, enabled: boolean) => {
    setAgents(prev => prev.map(a => a.agent_id === agentId ? { ...a, system_prompt: systemPrompt, enabled } : a));
    try {
      await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: systemPrompt, enabled })
      });
    } catch (err) {
      console.error("Failed to update agent prompt:", err);
    }
  };

  // Handler: Import Leads from Google Sheet
  const handleImportLeads = (imported: Partial<Lead>[]) => {
    const newLeads: Lead[] = imported.map((item, idx) => ({
      id: item.id || `GSHEET-IMPORT-${Date.now()}-${idx}`,
      signal_id: item.signal_id || `JB3-SIG-${Math.floor(1000 + Math.random() * 9000)}`,
      first_name: item.first_name || 'Imported',
      last_name: item.last_name || 'Lead',
      phone_e164: item.phone_e164 || '',
      email: item.email || '',
      origin_source: item.origin_source || 'Website',
      origin_type: item.origin_type || 'Form Signup',
      access_type: item.access_type || 'General Website Signup',
      newsletter_opt_in: item.newsletter_opt_in ?? true,
      ip_address: item.ip_address || '127.0.0.1',
      lang_code: item.lang_code || 'en',
      area_node: item.area_node || 'Import Node',
      notes: item.notes || 'Imported live from Google Sheet tab MASTER_PIPELINE',
      current_status: item.current_status || 'New',
      ai_output: item.ai_output || 'Imported via Google Sheets API',
      call_date: item.call_date,
      call_time: item.call_time,
      popia_consent: item.popia_consent ?? true,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setLeads(prev => {
      // Avoid duplicate signal_ids if re-importing
      const existingIds = new Set(prev.map(l => l.signal_id));
      const filteredNew = newLeads.filter(l => !existingIds.has(l.signal_id));
      return [...filteredNew, ...prev];
    });
  };

  // Handler: Log sync transaction
  const handleLogSync = (action: string, details: string) => {
    const newLog: SheetSyncLog = {
      id: `SYNC-GS-${Date.now().toString().slice(-6)}`,
      signal_id: 'ALL_RECORDS',
      lead_name: 'Google Sheets API',
      action: action as any,
      sheet_tab: 'MASTER_PIPELINE',
      status: 'SUCCESS',
      response_ms: Math.floor(120 + Math.random() * 180),
      timestamp: new Date().toISOString(),
      details
    };
    setSyncLogs(prev => [newLog, ...prev]);
  };

  // Filter leads by channel filter from MetricsOverview
  const filteredLeadsByChannel = selectedChannelFilter === 'ALL' || !selectedChannelFilter
    ? leads
    : leads.filter(l => l.origin_source === selectedChannelFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-12">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leadsCount={leads.length}
        unreadMessagesCount={messages.filter(m => m.sender === 'Lead').length}
        onQuickSimulate={() => setActiveTab('simulator')}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* AUTOMATED GMAIL TRIGGER TOAST NOTIFICATION */}
        {gmailNotification && (
          <div className="bg-[#0A0A0B] border border-emerald-500/40 rounded-2xl p-4 text-xs shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                ⚡
              </div>
              <div>
                <span className="font-bold text-white block">Automated Gmail Trigger Execution</span>
                <p className="text-emerald-300">{gmailNotification}</p>
              </div>
            </div>
            <button
              onClick={() => setGmailNotification(null)}
              className="text-gray-400 hover:text-white px-2 py-1 cursor-pointer font-mono"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI & Metrics Bar (Shown across tabs or main view) */}
        <MetricsOverview
          leads={leads}
          selectedChannel={selectedChannelFilter}
          onSelectChannelFilter={(channel) => setSelectedChannelFilter(channel)}
        />

        {/* TAB 1: MASTER PIPELINE MATRIX */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <GoogleSheetsConnectBar
              leads={leads}
              onImportLeads={handleImportLeads}
              onLogSync={handleLogSync}
              autoSyncEnabled={autoSyncEnabled}
              onToggleAutoSync={setAutoSyncEnabled}
            />
            <PipelineTable
              leads={filteredLeadsByChannel}
              calendarEvents={calendarEvents}
              onStatusChange={handleStatusChange}
              onRunAgent2={(leadId) => handleRunAgent(leadId, 'agent_2_due_diligence')}
              onOpenMessages={(leadId) => {
                setSelectedLeadForMessages(leadId);
                setActiveTab('messages');
              }}
              onSelectLeadDetail={(lead) => setSelectedLeadForDetail(lead)}
              onDeleteLead={handleDeleteLead}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onResolveDiscrepancy={handleResolveDiscrepancy}
              loadingAgentLeadId={loadingAgentLeadId}
            />
          </div>
        )}

        {/* TAB 2: GOOGLE CALENDAR INTEGRATION */}
        {activeTab === 'calendar' && (
          <GoogleCalendarPanel
            leads={leads}
            calendarEvents={calendarEvents}
            onUpdateCalendarEvents={setCalendarEvents}
            onUpdateLeadStatus={(leadId, status, callDate, callTime) => {
              handleStatusChange(leadId, status);
              if (callDate || callTime) {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, call_date: callDate, call_time: callTime } : l));
              }
            }}
            onLogSync={handleLogSync}
            onResolveDiscrepancy={handleResolveDiscrepancy}
          />
        )}

        {/* TAB 3: GMAIL OUTREACH INTEGRATION */}
        {activeTab === 'gmail' && (
          <GmailPanel
            leads={leads}
            systemMessages={messages}
            onRunAgentOnLead={handleRunAgent}
            onLogSync={handleLogSync}
          />
        )}

        {/* TAB 4: INBOUND MESSAGES & REPLY MONITOR */}
        {activeTab === 'messages' && (
          <MessagesCenter
            leads={leads}
            messages={messages}
            selectedLeadId={selectedLeadForMessages}
            onSelectLead={(leadId) => setSelectedLeadForMessages(leadId)}
            onSendReply={handleSendReply}
            onRunAgent3={(leadId) => handleRunAgent(leadId, 'agent_3_engagement')}
            onStatusChange={handleStatusChange}
            isLoadingAgent={loadingAgentLeadId === selectedLeadForMessages}
          />
        )}

        {/* TAB 3: AI SUPER-AGENTS CONTROL PANEL */}
        {activeTab === 'agents' && (
          <AgentsControlPanel
            agents={agents}
            leads={leads}
            onUpdateAgentPrompt={handleUpdateAgentPrompt}
            onRunAgentOnLead={(leadId, agentId) => handleRunAgent(leadId, agentId)}
            isLoadingAgent={!!loadingAgentLeadId}
          />
        )}

        {/* TAB 4: WEBHOOK SIMULATOR */}
        {activeTab === 'simulator' && (
          <WebhookSimulator
            onTriggerWebhook={handleTriggerWebhook}
          />
        )}

        {/* TAB 5: GOOGLE APPS SCRIPT & SHEET SYNC */}
        {activeTab === 'script' && (
          <AppsScriptPanel
            leads={leads}
            syncLogs={syncLogs}
            onImportLeads={handleImportLeads}
            onLogSync={handleLogSync}
          />
        )}

        {/* TAB 6: ORIGIN CHANNELS & API SETUP */}
        {activeTab === 'setup' && (
          <ChannelSetupPage
            leads={leads}
            onTriggerWebhook={handleTriggerWebhook}
            onLogSync={handleLogSync}
            onOpenMessages={(leadId) => {
              setSelectedLeadForMessages(leadId);
              setActiveTab('messages');
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

      </main>

      {/* Lead Detail Modal / Drawer */}
      <LeadDetailModal
        lead={selectedLeadForDetail}
        messages={messages}
        onClose={() => setSelectedLeadForDetail(null)}
        onStatusChange={handleStatusChange}
        onRunAgent={(leadId, agentId) => handleRunAgent(leadId, agentId)}
        onSendReply={handleSendReply}
        isLoadingAgent={loadingAgentLeadId === selectedLeadForDetail?.id}
      />

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLead={handleCreateLead}
      />
    </div>
  );
}
