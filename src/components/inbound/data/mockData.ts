import { Lead, LeadMessage, SheetSyncLog, AgentConfig } from '../../../types/inbound';

export const INITIAL_AGENTS: AgentConfig[] = [
  {
    agent_id: 'agent_1_intake',
    name: 'Agent 1: Intake & Pre-Qualification',
    role: 'Verification & Deduplication',
    description: 'Verifies phone numbers to E.164 format, checks duplicate emails in MASTER_PIPELINE, confirms POPIA compliance, and assigns a unique Signal_ID.',
    system_prompt: `You are Agent 1 (Pre-Qualification & Verification). Inspect incoming lead payloads from Website, Meta, VoiceGrid, Email, and YouTube. Standardize contact name, format phone into +[country_code][number] E.164, check POPIA compliance consent, assign a unique Signal_ID (e.g. JB3-SIG-XXXX-XX), and set initial Current_Status to "New" or "In Progress".`,
    enabled: true,
    auto_trigger: true,
  },
  {
    agent_id: 'agent_2_due_diligence',
    name: 'Agent 2: Due Diligence & Research',
    role: 'Background Intelligence Synthesizer',
    description: 'Uses Gemini AI to research company background, industry positioning, potential commercial angle, and synthesizes executive notes into AI_Output.',
    system_prompt: `You are Agent 2 (Due Diligence & Research). Analyze the lead's email domain, company name, form mode/access type, and initial notes. Generate a concise 3-bullet executive background summary covering: 1) Organization & Industry, 2) Potential Strategic / Advisory Fit for JB3AI, 3) Recommended Next Engagement Strategy. Output crisp, actionable bullet points.`,
    enabled: true,
    auto_trigger: true,
  },
  {
    agent_id: 'agent_3_engagement',
    name: 'Agent 3: Engagement & Outreach',
    role: 'Personalized Conversational Agent',
    description: 'Drafts tailored WhatsApp and Email responses, attaches Calendly booking link, and generates personalized pitch assets.',
    system_prompt: `You are Agent 3 (Engagement & Booking). Based on the lead's profile, mode, and Agent 2 Due Diligence summary, draft a warm, professional personalized response email / WhatsApp message on behalf of Jonathan. Include a direct call-to-action to schedule a 15-minute introductory call via Calendly link (https://calendly.com/jb3ai/intro) and address their specific interest area.`,
    enabled: true,
    auto_trigger: true,
  },
  {
    agent_id: 'agent_4_handoff',
    name: 'Agent 4: CRM & Google Sheet Mirror',
    role: 'MASTER_PIPELINE Sync Engine',
    description: 'Pushes standardized lead record into the MASTER_PIPELINE tab in Google Sheets (JB3AI Lead Management ENGINE) via Google Apps Script.',
    system_prompt: `You are Agent 4 (Handoff & Sheet Sync). Format the finalized lead payload into the exact 13-column schema required by Google Sheet "JB3AI Lead Management ENGINE" -> "MASTER_PIPELINE". Ensure no null fields break Apps Script execution.`,
    enabled: true,
    auto_trigger: true,
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'LEAD-1001',
    signal_id: 'JB3-SIG-0836-46',
    first_name: 'Jonathan',
    last_name: 'Blackburn',
    email: 'jono@jonoblackburn.com',
    phone_e164: '+27793120688',
    origin_source: 'Website',
    origin_type: 'Form Signup',
    access_type: 'Investor Access',
    newsletter_opt_in: true,
    ip_address: '105.245.108.186',
    current_status: 'Researched',
    ai_output: '• Principal at JB3AI ventures & technology advisory.\n• High intent: Requested instant investor portal access & advisory session.\n• Recommended Action: Share private pitch room credentials & schedule 1-on-1 strategy call.',
    popia_consent: true,
    lang_code: 'EN-ZA',
    area_node: 'Cape Town, ZA',
    notes: 'Submitted via jonoblackburn.com website form. Mode: Investor Access Instant entry to private due diligence portal.',
    created_at: '2026-08-04T02:14:21Z',
    updated_at: '2026-08-04T02:20:00Z',
    status_history: [
      {
        id: 'SH-1001-1',
        to_status: 'New',
        changed_by: 'Agent 1 Intake',
        timestamp: '2026-08-04T02:14:21Z',
        note: 'Lead created via Website Form'
      },
      {
        id: 'SH-1001-2',
        from_status: 'New',
        to_status: 'In Due Diligence',
        changed_by: 'System Trigger',
        timestamp: '2026-08-04T02:14:30Z',
        note: 'Queued for Gemini background synthesis'
      },
      {
        id: 'SH-1001-3',
        from_status: 'In Due Diligence',
        to_status: 'Researched',
        changed_by: 'Agent 2 Research',
        timestamp: '2026-08-04T02:15:00Z',
        note: 'Executive profile synthesized into AI_Output'
      }
    ],
    raw_payload: {
      "Form": "Investor Access Request",
      "Full Name": "Jonathan Blackburn",
      "Access Type": "Investor",
      "Opt-in": "Yes",
      "Server IP": "105.245.108.186"
    }
  },
  {
    id: 'LEAD-1002',
    signal_id: 'JB3-SIG-1818-47',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'sarah.j@apexcapital.co',
    phone_e164: '+27829910022',
    origin_source: 'WhatsApp',
    origin_type: 'Direct Message',
    access_type: 'Advisory / Client',
    newsletter_opt_in: true,
    ip_address: '41.160.22.91',
    current_status: 'Booking Sent',
    ai_output: '• Managing Director at Apex Capital Africa ($50M AUM).\n• Inquiry: Looking for AI lead automation & VoiceGrid integration for portfolio companies.\n• Recommended Action: Follow up with Calendly booking link for advisory intake.',
    popia_consent: true,
    lang_code: 'EN-ZA',
    area_node: 'Johannesburg, ZA',
    notes: 'Inbound message on Meta WhatsApp Business API: "Hi Jonathan, interested in seeing demo of AI lead intake engine for our sales team."',
    created_at: '2026-08-04T03:05:12Z',
    updated_at: '2026-08-04T03:12:00Z',
    status_history: [
      {
        id: 'SH-1002-1',
        to_status: 'New',
        changed_by: 'WhatsApp Webhook',
        timestamp: '2026-08-04T03:05:12Z',
        note: 'Inbound WhatsApp message received'
      },
      {
        id: 'SH-1002-2',
        from_status: 'New',
        to_status: 'Researched',
        changed_by: 'Agent 2 Research',
        timestamp: '2026-08-04T03:06:00Z',
        note: 'Background research compiled for Apex Capital Africa'
      },
      {
        id: 'SH-1002-3',
        from_status: 'Researched',
        to_status: 'Booking Sent',
        changed_by: 'Agent 3 Outreach',
        timestamp: '2026-08-04T03:12:00Z',
        note: 'Calendly booking link sent via WhatsApp'
      }
    ],
    raw_payload: {
      "wa_id": "27829910022",
      "profile_name": "Sarah Jenkins",
      "message": "Hi Jonathan, interested in seeing demo of AI lead intake engine for our sales team."
    }
  },
  {
    id: 'LEAD-1003',
    signal_id: 'JB3-SIG-2041-89',
    first_name: 'Michael',
    last_name: 'Vanderbilt',
    email: 'mv@vanderbilt-media.io',
    phone_e164: '+14155550198',
    origin_source: 'Email',
    origin_type: 'Direct Email',
    access_type: 'Press / Media',
    newsletter_opt_in: false,
    ip_address: '198.51.100.42',
    current_status: 'In Due Diligence',
    ai_output: '• Senior Tech Reporter at Vanderbilt Media & Future AI Podcast.\n• Context: Email received at hi@jb3ai.com regarding interview on multi-agent CRM automation.\n• Agent 2 actively synthesizing company background and media reach.',
    popia_consent: true,
    lang_code: 'EN-US',
    area_node: 'San Francisco, US',
    notes: 'Parsed via Gmail Apps Script trigger from subject: "Interview Request: AI Lead Automation Sheet Engine".',
    created_at: '2026-08-04T03:40:00Z',
    updated_at: '2026-08-04T03:41:15Z',
    status_history: [
      {
        id: 'SH-1003-1',
        to_status: 'New',
        changed_by: 'Gmail Script Parser',
        timestamp: '2026-08-04T03:40:00Z',
        note: 'Direct email received at hi@jb3ai.com'
      },
      {
        id: 'SH-1003-2',
        from_status: 'New',
        to_status: 'In Due Diligence',
        changed_by: 'Agent 1 Intake',
        timestamp: '2026-08-04T03:41:15Z',
        note: 'Assigned Signal_ID and queued for media research'
      }
    ],
    raw_payload: {
      "Sender": "mv@vanderbilt-media.io",
      "Subject": "Interview Request: AI Lead Automation Sheet Engine",
      "Body": "Hi team, loved the VoiceGrid and Base44 intake flow demo. Would love to feature Jonathan on our podcast next week."
    }
  },
  {
    id: 'LEAD-1004',
    signal_id: 'JB3-SIG-3301-12',
    first_name: 'David',
    last_name: 'Khumalo',
    email: 'd.khumalo@voicegrid-tech.com',
    phone_e164: '+27834451122',
    origin_source: 'VoiceGrid',
    origin_type: 'Voice Call',
    access_type: 'Advisory / Client',
    newsletter_opt_in: true,
    ip_address: '102.132.88.10',
    current_status: 'Call Scheduled',
    ai_output: '• Lead Signal Drive voice call completed (Duration: 3m 42s).\n• Audio Summary: Caller requested custom demo of automated sheet sync and WhatsApp pre-qualification.\n• Confirmed Diary Booking for Thursday 14:00 CAT.',
    popia_consent: true,
    lang_code: 'EN-ZA',
    area_node: 'Durban, ZA',
    notes: 'Automated webhook from VoiceGrid Signal Drive upon call completion.',
    created_at: '2026-08-04T04:00:10Z',
    updated_at: '2026-08-04T04:15:00Z',
    status_history: [
      {
        id: 'SH-1004-1',
        to_status: 'New',
        changed_by: 'VoiceGrid Webhook',
        timestamp: '2026-08-04T04:00:10Z',
        note: 'Call completed and transcript ingested'
      },
      {
        id: 'SH-1004-2',
        from_status: 'New',
        to_status: 'Researched',
        changed_by: 'Agent 2 Research',
        timestamp: '2026-08-04T04:05:00Z',
        note: 'Voice call summary synthesized'
      },
      {
        id: 'SH-1004-3',
        from_status: 'Researched',
        to_status: 'Call Scheduled',
        changed_by: 'Calendly Integration',
        timestamp: '2026-08-04T04:15:00Z',
        note: '15-min advisory call scheduled in diary'
      }
    ],
    raw_payload: {
      "call_id": "VG-88192",
      "duration": "222",
      "summary": "Caller wants to streamline 500+ monthly leads from Meta ads straight into Google Sheets with AI pre-qualification."
    }
  },
  {
    id: 'LEAD-1005',
    signal_id: 'JB3-SIG-4412-55',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena@novatech-growth.com',
    phone_e164: '+442079460912',
    origin_source: 'YouTube',
    origin_type: 'Comment',
    access_type: 'Collaborator',
    newsletter_opt_in: true,
    ip_address: '81.2.69.142',
    current_status: 'New',
    ai_output: '• New YouTube comment flagged for follow-up in video "Building a Free AI CRM in Google Sheets".\n• Lead requested Google Apps Script template and Base44 webhook endpoint setup.',
    popia_consent: true,
    lang_code: 'EN-GB',
    area_node: 'London, UK',
    notes: 'Comment text: "Where can I get the Apps Script snippet for MASTER_PIPELINE sync? Awesome setup!"',
    created_at: '2026-08-04T04:25:00Z',
    updated_at: '2026-08-04T04:25:00Z',
    status_history: [
      {
        id: 'SH-1005-1',
        to_status: 'New',
        changed_by: 'YouTube API Webhook',
        timestamp: '2026-08-04T04:25:00Z',
        note: 'Comment ingested into pipeline matrix'
      }
    ],
    raw_payload: {
      "video_id": "yt_build_ai_crm",
      "user_handle": "@ElenaRostovaGrowth",
      "comment_text": "Where can I get the Apps Script snippet for MASTER_PIPELINE sync? Awesome setup!"
    }
  }
];

export const INITIAL_MESSAGES: LeadMessage[] = [
  {
    id: 'MSG-001',
    lead_id: 'LEAD-1001',
    sender: 'Lead',
    channel: 'Website',
    type: 'incoming_msg',
    message_text: 'Requested Investor Access Instant entry to private due diligence portal on jonoblackburn.com.',
    timestamp: '2026-08-04T02:14:21Z',
    status: 'delivered'
  },
  {
    id: 'MSG-002',
    lead_id: 'LEAD-1001',
    sender: 'Agent 1 Intake',
    channel: 'System',
    type: 'system_event',
    message_text: 'Verified phone (+27793120688), POPIA consent confirmed. Assigned Signal_ID: JB3-SIG-0836-46.',
    timestamp: '2026-08-04T02:14:25Z',
    status: 'delivered'
  },
  {
    id: 'MSG-003',
    lead_id: 'LEAD-1001',
    sender: 'Agent 2 Research',
    channel: 'System',
    type: 'due_diligence',
    message_text: 'Synthesized executive summary: Principal at JB3AI ventures. High intent for private investor deck.',
    timestamp: '2026-08-04T02:15:00Z',
    status: 'delivered'
  },
  {
    id: 'MSG-004',
    lead_id: 'LEAD-1001',
    sender: 'Agent 3 Outreach',
    channel: 'Email',
    type: 'outreach_draft',
    message_text: 'Hi Jonathan,\n\nThank you for requesting instant investor access. Your private due diligence credentials have been prepared. Would you like to schedule a 15-minute briefing?\n\nSchedule here: https://calendly.com/jb3ai/investor-briefing\n\nBest regards,\nJB3AI Engine',
    timestamp: '2026-08-04T02:16:30Z',
    status: 'sent'
  },
  {
    id: 'MSG-005',
    lead_id: 'LEAD-1002',
    sender: 'Lead',
    channel: 'WhatsApp',
    type: 'incoming_msg',
    message_text: 'Hi Jonathan, interested in seeing demo of AI lead intake engine for our sales team.',
    timestamp: '2026-08-04T03:05:12Z',
    status: 'delivered'
  },
  {
    id: 'MSG-006',
    lead_id: 'LEAD-1002',
    sender: 'Agent 3 Outreach',
    channel: 'WhatsApp',
    type: 'ai_response',
    message_text: 'Hi Sarah! Thanks for reaching out via WhatsApp. Great to hear from Apex Capital. Jonathan would be glad to show you the VoiceGrid and Google Sheets automation live. Here is a direct booking link for a 15-min call: https://calendly.com/jb3ai/intro',
    timestamp: '2026-08-04T03:06:10Z',
    status: 'sent'
  }
];

export const INITIAL_SYNC_LOGS: SheetSyncLog[] = [
  {
    id: 'SYNC-101',
    lead_id: 'LEAD-1001',
    lead_name: 'Jonathan Blackburn',
    signal_id: 'JB3-SIG-0836-46',
    action: 'INSERT_ROW',
    sheet_tab: 'MASTER_PIPELINE',
    status: 'SUCCESS',
    timestamp: '2026-08-04T02:14:26Z',
    response_ms: 142,
    details: 'Appended row [JB3-SIG-0836-46, Jonathan, Blackburn, +27793120688, jono@jonoblackburn.com, Website, Form Signup, Researched]'
  },
  {
    id: 'SYNC-102',
    lead_id: 'LEAD-1002',
    lead_name: 'Sarah Jenkins',
    signal_id: 'JB3-SIG-1818-47',
    action: 'INSERT_ROW',
    sheet_tab: 'MASTER_PIPELINE',
    status: 'SUCCESS',
    timestamp: '2026-08-04T03:05:15Z',
    response_ms: 188,
    details: 'Appended row [JB3-SIG-1818-47, Sarah, Jenkins, +27829910022, sarah.j@apexcapital.co, WhatsApp, Direct Message, Booking Sent]'
  },
  {
    id: 'SYNC-103',
    lead_id: 'LEAD-1003',
    lead_name: 'Michael Vanderbilt',
    signal_id: 'JB3-SIG-2041-89',
    action: 'INSERT_ROW',
    sheet_tab: 'MASTER_PIPELINE',
    status: 'SUCCESS',
    timestamp: '2026-08-04T03:40:05Z',
    response_ms: 210,
    details: 'Gmail Apps Script parser pushed row to MASTER_PIPELINE.'
  },
  {
    id: 'SYNC-104',
    lead_id: 'LEAD-1004',
    lead_name: 'David Khumalo',
    signal_id: 'JB3-SIG-3301-12',
    action: 'UPDATE_STATUS',
    sheet_tab: 'MASTER_PIPELINE',
    status: 'SUCCESS',
    timestamp: '2026-08-04T04:15:01Z',
    response_ms: 95,
    details: 'Updated status to "Call Scheduled" for Signal_ID: JB3-SIG-3301-12'
  }
];

export const INITIAL_CALENDAR_EVENTS = [
  {
    id: 'cal-event-1004',
    summary: 'JB3AI Consultation Call: David Khumalo',
    description: 'VoiceGrid Signal Drive consultation call regarding custom lead automation & sheet sync.',
    location: 'Google Meet / VoiceGrid Call',
    htmlLink: 'https://calendar.google.com',
    start: { dateTime: '2026-08-06T14:00:00Z' },
    end: { dateTime: '2026-08-06T14:30:00Z' },
    attendees: [{ email: 'd.khumalo@voicegrid-tech.com', responseStatus: 'accepted' }],
    status: 'confirmed'
  },
  {
    id: 'cal-event-1002',
    summary: 'Apex Capital Africa AI Demo: Sarah Jenkins',
    description: 'Demo of AI lead intake engine and WhatsApp Business API pre-qualification.',
    location: 'Google Meet',
    htmlLink: 'https://calendar.google.com',
    start: { dateTime: '2026-08-07T11:00:00Z' },
    end: { dateTime: '2026-08-07T11:45:00Z' },
    attendees: [{ email: 'sarah.j@apexcapital.co', responseStatus: 'needsAction' }],
    status: 'confirmed'
  }
];

export const GOOGLE_APPS_SCRIPT_CODE = `// ============================================================================
// CONFIGURATION & GLOBAL CONSTANTS
// ============================================================================
const CONFIG = {
  SHEET_NAME: "MASTER_PIPELINE",
  GEMINI_MODEL: "gemini-2.5-flash", // Primary model endpoint
  FALLBACK_MODEL: "gemini-2.0-flash", // Secondary fallback model endpoint
  CALENDAR_ID: "c_b7b519d565c9180d77e2fde41dc5aa1954b398a42fdcecdc8e4a486aa4d302d4@group.calendar.google.com"
};

function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
}

// ============================================================================
// 1. INBOUND WEBHOOK ENDPOINTS (doGet & doPost)
// ============================================================================
function doGet(e) {
  // Meta Webhook Verification Handshake
  const verifyToken = "JB3AI_META_SECRET_TOKEN_2026";
  const mode = e.parameter["hub.mode"];
  const token = e.parameter["hub.verify_token"];
  const challenge = e.parameter["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    return ContentService.createTextOutput(challenge);
  }
  return ContentService.createTextOutput("JB3AI Webhook Active");
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let leadData;

    if (payload.object === "whatsapp_business_account" || payload.object === "page") {
      leadData = parseMetaWebhook(payload);
    } else {
      leadData = payload;
    }

    const result = processIncomingLead(leadData);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
                          .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
                          .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// 2. MAIN LEAD PROCESSING CONTROLLER
// ============================================================================
function processIncomingLead(leadData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  const signalId = "JB3-SIG-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(10 + Math.random() * 90);
  const firstName = leadData.first_name || leadData.name?.split(" ")[0] || "";
  const lastName = leadData.last_name || leadData.name?.split(" ").slice(1).join(" ") || "";
  const phone = leadData.phone || "";
  const email = leadData.email || "";
  const source = (leadData.source || "WEBSITE").toUpperCase();
  const nodeType = leadData.mode || leadData.origin_type || "Form Submission";

  // Step A: Run Gemini 2.5 Flash Due Diligence
  const aiResearch = runGeminiDueDiligence(firstName, lastName, email, source, nodeType);

  // Step B: Auto-Schedule Calendar Booking if Email Provided
  let calendarDetails = null;
  if (email) {
    calendarDetails = createLeadCalendarBooking({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      source: source,
      mode: nodeType
    }, 1, 10); // Tomorrow at 10:00 AM
  }

  // Step C: Append to MASTER_PIPELINE
  sheet.appendRow([
    signalId,
    firstName,
    lastName,
    phone,
    email,
    source,
    nodeType,
    "en-ZA",
    calendarDetails ? "CALL_SCHEDULED" : "RESEARCHED",
    aiResearch,
    calendarDetails ? calendarDetails.startTime : "",
    calendarDetails ? calendarDetails.eventId : "",
    1800,
    leadData.optIn !== undefined ? leadData.optIn : true,
    new Date()
  ]);

  return {
    signalId: signalId,
    status: "SUCCESS",
    lead: leadData,
    aiResearch: aiResearch,
    booking: calendarDetails
  };
}

// ============================================================================
// 3. AI DUE DILIGENCE (GEMINI 2.5 FLASH / 2.0 FLASH)
// ============================================================================
function runGeminiDueDiligence(firstName, lastName, email, source, nodeType) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return "• Verified contact profile (" + email + ").\n• Strategic Fit: High commercial advisory potential for JB3AI Engine.\n• Actionable Next Step: Dispatch internal briefing & schedule strategy session.";

  const modelsToTry = [CONFIG.GEMINI_MODEL || "gemini-2.5-flash", CONFIG.FALLBACK_MODEL || "gemini-2.0-flash", "gemini-1.5-flash"];
  const systemInstruction = "You are the Executive Due Diligence Agent for JB3AI working for Jonathan Blackburn. Provide a concise 3-bullet research summary and recommended commercial angle. Skip intros and deliver the bullets directly.";
  
  const prompt = "Lead Details:\nName: " + firstName + " " + lastName + "\nEmail: " + email + "\nOrigin Source: " + source + "\nChannel Type: " + nodeType;

  const payload = {
    "contents": [{ "parts": [{ "text": prompt }] }],
    "systemInstruction": { "parts": [{ "text": systemInstruction }] },
    "generationConfig": { 
      "temperature": 0.2, 
      "maxOutputTokens": 500 
    }
  };

  for (var i = 0; i < modelsToTry.length; i++) {
    var modelName = modelsToTry[i];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
    
    try {
      var response = UrlFetchApp.fetch(url, {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      });
      
      var json = JSON.parse(response.getContentText());
      if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
        return json.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      Logger.log("Model " + modelName + " failed: " + e.toString());
    }
  }

  // Graceful fallback synthesis if Gemini API call is unavailable
  return "• Verified profile for " + firstName + " " + lastName + " (" + (email || 'Direct') + ").\n• Strategic Fit: Active interest via " + source + " (" + nodeType + ").\n• Actionable Next Step: Review lead notes & schedule advisory intake call.";
}

// ============================================================================
// 4. GOOGLE CALENDAR SCHEDULER
// ============================================================================
function createLeadCalendarBooking(lead, daysAhead = 1, hourOfDay = 10) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + daysAhead);
    startTime.setHours(hourOfDay, 0, 0, 0);

    // Skip weekends (Sat -> Mon, Sun -> Mon)
    if (startTime.getDay() === 6) startTime.setDate(startTime.getDate() + 2);
    if (startTime.getDay() === 0) startTime.setDate(startTime.getDate() + 1);

    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const leadName = \`\${lead.first_name || 'Prospect'} \${lead.last_name || ''}\`.trim();

    const event = calendar.createEvent(
      \`JB3AI Discovery Call: \${leadName}\`,
      startTime,
      endTime,
      {
        description: \`Automated Discovery Call scheduled by JB3AI Engine.\\n\\nLead Contact: \${lead.email}\\nPhone: \${lead.phone}\\nSource: \${lead.source}\\nNotes: \${lead.mode}\`,
        guests: lead.email ? lead.email : undefined,
        sendInvites: true
      }
    );

    return {
      status: "SCHEDULED",
      eventId: event.getId(),
      startTime: startTime.toISOString()
    };
  } catch (error) {
    Logger.log("Calendar Scheduling Error: " + error.toString());
    return { status: "FAILED", error: error.toString() };
  }
}

// ============================================================================
// 5. META / WHATSAPP PAYLOAD PARSER
// ============================================================================
function parseMetaWebhook(metaJson) {
  let extractedLead = {
    first_name: "Meta Lead",
    last_name: "",
    email: "",
    phone: "",
    source: "META",
    mode: "Inbound Message",
    optIn: true
  };

  try {
    if (metaJson.entry && metaJson.entry[0].changes && metaJson.entry[0].changes[0].value.messages) {
      const value = metaJson.entry[0].changes[0].value;
      const contact = value.contacts[0];
      const message = value.messages[0];

      extractedLead.first_name = contact.profile.name || "WhatsApp User";
      extractedLead.phone = "+" + contact.wa_id;
      extractedLead.source = "WHATSAPP";
      extractedLead.mode = message.text ? message.text.body : "WhatsApp Media/Interactive";
    } else if (metaJson.entry && metaJson.entry[0].changes && metaJson.entry[0].changes[0].value.leadgen_id) {
      extractedLead.source = "FACEBOOK_LEAD_AD";
      extractedLead.mode = "LeadGen ID: " + metaJson.entry[0].changes[0].value.leadgen_id;
    }
  } catch (err) {
    Logger.log("Meta Parsing Error: " + err.toString());
  }

  return extractedLead;
}

// ============================================================================
// 6. MANUAL TEST FUNCTION
// ============================================================================
function testFullLeadEngine() {
  const testPayload = {
    first_name: "Jonathan",
    last_name: "Blackburn",
    email: "jono@jonoblackburn.com",
    phone: "+27793120688",
    source: "WEBSITE",
    mode: "Investor Access Inquiry",
    optIn: true
  };

  const response = processIncomingLead(testPayload);
  Logger.log("Full Engine Test Output: " + JSON.stringify(response, null, 2));
}
`;
