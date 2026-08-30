import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Contact, 
  Template, 
  Campaign, 
  Thread, 
  QueueItem, 
  ThreadStatus, 
  SuggestedActionType 
} from '../../types/outbound';
import { 
  initialContacts, 
  initialTemplates, 
  initialCampaign, 
  initialThreads 
} from './data/mockData';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './lib/auth';
import { 
  sendGmailEmail, 
  checkInboxForReplies 
} from './lib/gmail';

import { Header } from './Header';
import { TrafficLightBoard } from './TrafficLightBoard';
import { OptimalWorkflowSidebar } from './OptimalWorkflowSidebar';
import { InboxZeroView } from './InboxZeroView';
import { TemplateManager } from './TemplateManager';
import { ContactManager } from './ContactManager';
import { CampaignSequencer } from './CampaignSequencer';
import { ContactImportModal } from './ContactImportModal';
import { ThreadDetailModal } from './ThreadDetailModal';
import { DailyBriefModal } from './DailyBriefModal';
import { SendConfirmationModal } from './SendConfirmationModal';

export function OutboundView() {
  // Main Application State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('sponsorflow_contacts');
    return saved ? JSON.parse(saved) : initialContacts;
  });

  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('sponsorflow_templates');
    return saved ? JSON.parse(saved) : initialTemplates;
  });

  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);

  const [threads, setThreads] = useState<Thread[]>(() => {
    const saved = localStorage.getItem('sponsorflow_threads');
    return saved ? JSON.parse(saved) : initialThreads;
  });

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

  // Auth & Gmail API State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<'board' | 'inbox' | 'templates' | 'contacts' | 'campaigns'>('board');

  // Modal Control States
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDailyBriefOpen, setIsDailyBriefOpen] = useState<boolean>(false);
  const [selectedDetailThread, setSelectedDetailThread] = useState<Thread | null>(null);

  // Send Confirmation Dialog State (Mandatory Workspace Integration Rule)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    threadId: string;
    recipientEmail: string;
    subject: string;
    bodyText: string;
    markMeetingBooked?: boolean;
  }>({
    isOpen: false,
    threadId: '',
    recipientEmail: '',
    subject: '',
    bodyText: '',
  });

  // Save to local storage on state updates
  useEffect(() => {
    localStorage.setItem('sponsorflow_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('sponsorflow_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('sponsorflow_threads', JSON.stringify(threads));
  }, [threads]);

  // Auth initialization
  useEffect(() => {
    initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
  }, []);

  // Handle Google Sign In
  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        handleSyncInbox(res.accessToken);
      }
    } catch (err) {
      console.error('Google Auth Failed:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  // Sync Inbox with Gmail API
  const handleSyncInbox = async (tokenOverride?: string) => {
    const token = tokenOverride || accessToken;
    if (!token) {
      console.log('No access token available for Gmail API sync. Run in simulation mode.');
      return;
    }

    setIsSyncing(true);
    try {
      const knownEmails = contacts.map((c) => c.email);
      const incomingReplies = await checkInboxForReplies(token, knownEmails);

      if (incomingReplies.length > 0) {
        setThreads((prevThreads) =>
          prevThreads.map((thread) => {
            const contact = contacts.find((c) => c.id === thread.contact_id);
            if (!contact) return thread;

            const match = incomingReplies.find(
              (r) => r.fromEmail.toLowerCase() === contact.email.toLowerCase()
            );

            if (match) {
              const alreadyHas = thread.history.some((h) => h.id === match.messageId);
              if (!alreadyHas) {
                const newMsg = {
                  id: match.messageId,
                  direction: 'inbound' as const,
                  sender: match.fromEmail,
                  recipient: 'sponsor@jb3ai.com',
                  subject: match.subject,
                  body: match.snippet,
                  timestamp: match.date,
                };

                return {
                  ...thread,
                  status: 'replied' as ThreadStatus,
                  reply_detected: true,
                  sentiment: 'positive' as const,
                  next_action_suggested: 'send-calendly' as SuggestedActionType,
                  last_activity: match.date,
                  history: [...thread.history, newMsg],
                };
              }
            }
            return thread;
          })
        );
      }
    } catch (err) {
      console.error('Error syncing Gmail inbox:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Status updates
  const handleUpdateThreadStatus = (threadId: string, newStatus: ThreadStatus) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, status: newStatus, last_activity: new Date().toISOString() } : t))
    );
  };

  // Handle Contact Import
  const handleImportContacts = (newContactList: Omit<Contact, 'id' | 'created_at'>[]) => {
    const createdContacts: Contact[] = [];
    const createdThreads: Thread[] = [];

    newContactList.forEach((nc, idx) => {
      const cId = `c_${Date.now()}_${idx}`;
      const newC: Contact = {
        ...nc,
        id: cId,
        created_at: new Date().toISOString(),
      };
      createdContacts.push(newC);

      const thId = `th_${Date.now()}_${idx}`;
      const newTh: Thread = {
        id: thId,
        contact_id: cId,
        campaign_id: campaign.id,
        status: 'draft',
        last_activity: new Date().toISOString(),
        reply_detected: false,
        next_action_suggested: 'send-follow-up',
        suggested_reason: 'Draft initialized. Pending queueing.',
        suggested_template_id: 't1',
        history: [],
        follow_up_count: 0,
      };
      createdThreads.push(newTh);
    });

    setContacts((prev) => [...prev, ...createdContacts]);
    setThreads((prev) => [...prev, ...createdThreads]);
  };

  // Delete Contact
  const handleDeleteContact = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setThreads((prev) => prev.filter((t) => t.contact_id !== contactId));
  };

  // Save/Delete Template
  const handleSaveTemplate = (tpl: Template) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === tpl.id);
      if (exists) {
        return prev.map((t) => (t.id === tpl.id ? tpl : t));
      }
      return [...prev, tpl];
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  // Trigger Send Confirmation Modal
  const requestSendConfirmation = (
    threadId: string,
    templateId?: string,
    customBody?: string,
    markMeetingBooked: boolean = false
  ) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    const contact = contacts.find((c) => c.id === thread.contact_id);
    if (!contact) return;

    const tpl = templates.find((t) => t.id === (templateId || thread.suggested_template_id || 't1'));

    let subject = tpl
      ? tpl.subject_line
          .replace(/{{first_name}}/g, contact.name.split(' ')[0])
          .replace(/{{company}}/g, contact.company)
          .replace(/{{program}}/g, contact.program)
      : `Isikolo AI x ${contact.company}`;

    let body = customBody;
    if (!body && tpl) {
      body = tpl.body_text
        .replace(/{{first_name}}/g, contact.name.split(' ')[0])
        .replace(/{{company}}/g, contact.company)
        .replace(/{{program}}/g, contact.program)
        .replace(/{{my_calendly_link}}/g, 'https://calendly.com/sponsor-jb3ai/15min')
        .replace(/{{days_since_sent}}/g, '3')
        .replace(/{{custom_snippet}}/g, contact.notes || 'Strategic partnership for AI education.');
    }

    setConfirmConfig({
      isOpen: true,
      threadId,
      recipientEmail: contact.email,
      subject,
      bodyText: body || 'Outreach email body',
      markMeetingBooked,
    });
  };

  // Executing Confirmed Email Send
  const executeConfirmedSend = async () => {
    const { threadId, recipientEmail, subject, bodyText, markMeetingBooked } = confirmConfig;
    if (!threadId) return;

    // Send via Gmail API if token available
    let gMessageId = `gm_msg_${Date.now()}`;
    if (accessToken) {
      try {
        const sendRes = await sendGmailEmail(accessToken, {
          to: recipientEmail,
          subject,
          bodyHtml: bodyText.replace(/\n/g, '<br>'),
          bodyText,
        });
        if (sendRes?.id) {
          gMessageId = sendRes.id;
        }
      } catch (err) {
        console.error('Gmail API send error:', err);
      }
    }

    // Add outbound email log & update thread status
    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id === threadId) {
          const newLog = {
            id: gMessageId,
            direction: 'outbound' as const,
            sender: 'sponsor@jb3ai.com',
            recipient: recipientEmail,
            subject,
            body: bodyText,
            timestamp: new Date().toISOString(),
          };

          const newStatus: ThreadStatus = markMeetingBooked
            ? 'meeting-booked'
            : t.status === 'draft' || t.status === 'queued'
            ? 'sent'
            : 'waiting';

          return {
            ...t,
            status: newStatus,
            last_activity: new Date().toISOString(),
            sentiment: markMeetingBooked ? ('positive' as const) : t.sentiment,
            history: [...t.history, newLog],
            follow_up_count: t.follow_up_count + 1,
          };
        }
        return t;
      })
    );

    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Snooze thread
  const handleSnoozeThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, last_activity: new Date().toISOString() } : t))
    );
  };

  // Close thread
  const handleCloseThread = (threadId: string) => {
    handleUpdateThreadStatus(threadId, 'closed');
  };

  // Process next queue step in campaign sequencer
  const handleProcessNextQueueStep = () => {
    const queuedThread = threads.find((t) => t.status === 'queued' || t.status === 'draft');
    if (queuedThread) {
      requestSendConfirmation(queuedThread.id);
    }
  };

  // Batch execute followups from Daily Brief
  const handleBatchExecuteFollowups = () => {
    const followupsReady = threads.filter((t) => t.status === 'waiting' && t.sentiment === 'needs-follow-up');
    if (followupsReady.length > 0) {
      requestSendConfirmation(followupsReady[0].id);
    }
  };

  const repliesCount = threads.filter((t) => t.status === 'replied' || t.status === 'meeting-booked').length;
  const followupsCount = threads.filter((t) => t.status === 'waiting' && t.sentiment === 'needs-follow-up').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        accessToken={accessToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSyncInbox={() => handleSyncInbox()}
        isSyncing={isSyncing}
        onOpenDailyBrief={() => setIsDailyBriefOpen(true)}
        repliesCount={repliesCount}
        followupsCount={followupsCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'board' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <TrafficLightBoard
                threads={threads}
                contacts={contacts}
                templates={templates}
                onUpdateThreadStatus={handleUpdateThreadStatus}
                onSendEmailNow={(thId, tplId, body) => requestSendConfirmation(thId, tplId, body)}
                onOpenThreadDetail={(th) => setSelectedDetailThread(th)}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            </div>

            <div className="hidden lg:block">
              <OptimalWorkflowSidebar
                threads={threads}
                contacts={contacts}
                templates={templates}
                onExecuteAction={(thId, tplId) => requestSendConfirmation(thId, tplId)}
                onSnoozeThread={handleSnoozeThread}
                onCloseThread={handleCloseThread}
              />
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <InboxZeroView
            threads={threads}
            contacts={contacts}
            templates={templates}
            onReplyToContact={(thId, replyText, markMeetingBooked) =>
              requestSendConfirmation(thId, undefined, replyText, markMeetingBooked)
            }
            onOpenThreadDetail={(th) => setSelectedDetailThread(th)}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactManager
            contacts={contacts}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onDeleteContact={handleDeleteContact}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignSequencer
            campaign={campaign}
            threads={threads}
            contacts={contacts}
            queueItems={queueItems}
            onToggleCampaignStatus={(st) => setCampaign((prev) => ({ ...prev, status: st }))}
            onUpdateThrottle={(thr, del) =>
              setCampaign((prev) => ({ ...prev, throttle_per_hour: thr, random_delay_range: del }))
            }
            onProcessQueueStep={handleProcessNextQueueStep}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <ContactImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingContacts={contacts}
        onImportContacts={handleImportContacts}
        accessToken={accessToken}
      />

      <DailyBriefModal
        isOpen={isDailyBriefOpen}
        onClose={() => setIsDailyBriefOpen(false)}
        threads={threads}
        contacts={contacts}
        onOpenInbox={() => setActiveTab('inbox')}
        onBatchExecuteFollowups={handleBatchExecuteFollowups}
      />

      <ThreadDetailModal
        thread={selectedDetailThread}
        onClose={() => setSelectedDetailThread(null)}
        contacts={contacts}
        templates={templates}
        onUpdateStatus={handleUpdateThreadStatus}
        onSendEmailInThread={(thId, tplId, body) => {
          setSelectedDetailThread(null);
          requestSendConfirmation(thId, tplId, body);
        }}
      />

      <SendConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmedSend}
        title="Confirm Gmail Outreach Dispatch"
        recipientEmail={confirmConfig.recipientEmail}
        subject={confirmConfig.subject}
        bodySnippet={confirmConfig.bodyText}
      />
    </div>
  );
}
