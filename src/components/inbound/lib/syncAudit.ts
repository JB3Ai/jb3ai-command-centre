import { Lead, LeadStatus } from '../../../types/inbound';
import { GoogleCalendarEvent } from './googleCalendar';

export interface SyncDiscrepancy {
  id: string;
  type: 'MISSING_EVENT' | 'UNSYNCED_LEAD_STATUS' | 'DATETIME_MISMATCH';
  leadId: string;
  leadName: string;
  leadEmail: string;
  currentStatus: LeadStatus | string;
  eventId?: string;
  eventTitle?: string;
  eventStartISO?: string;
  eventStartFormatted?: string;
  pipelineDate?: string;
  pipelineTime?: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

/**
 * Runs a bidirectional sync check between PipelineTable leads and Google Calendar events.
 */
export function auditBidirectionalSync(
  leads: Lead[],
  calendarEvents: GoogleCalendarEvent[]
): SyncDiscrepancy[] {
  const discrepancies: SyncDiscrepancy[] = [];
  const activeEvents = calendarEvents.filter(e => e.status !== 'cancelled');

  // Helper to match event with lead
  const findMatchingEventForLead = (lead: Lead) => {
    return activeEvents.find(ev => {
      // Match by attendee email
      if (lead.email && ev.attendees?.some(a => a.email.toLowerCase() === lead.email.toLowerCase())) {
        return true;
      }
      // Match by summary containing lead's name
      if (lead.first_name && lead.first_name.length > 2) {
        const fullName = `${lead.first_name} ${lead.last_name}`.trim().toLowerCase();
        const summaryLower = (ev.summary || '').toLowerCase();
        if (summaryLower.includes(fullName) || summaryLower.includes(lead.first_name.toLowerCase())) {
          return true;
        }
      }
      return false;
    });
  };

  // Helper to match lead with event
  const findMatchingLeadForEvent = (ev: GoogleCalendarEvent) => {
    const attendeeEmails = ev.attendees?.map(a => a.email.toLowerCase()) || [];
    const summaryLower = (ev.summary || '').toLowerCase();

    return leads.find(l => {
      if (l.email && attendeeEmails.includes(l.email.toLowerCase())) {
        return true;
      }
      if (l.first_name && l.first_name.length > 2) {
        const fullName = `${l.first_name} ${l.last_name}`.trim().toLowerCase();
        if (summaryLower.includes(fullName) || summaryLower.includes(l.first_name.toLowerCase())) {
          return true;
        }
      }
      return false;
    });
  };

  // 1. Check leads marked 'Call Scheduled' or with scheduled date
  leads.forEach(lead => {
    const isScheduledInPipeline =
      lead.current_status === 'Call Scheduled' ||
      (lead.current_status as string) === 'CALL_SCHEDULED' ||
      Boolean(lead.call_date);

    const matchingEvent = findMatchingEventForLead(lead);

    if (isScheduledInPipeline && !matchingEvent) {
      discrepancies.push({
        id: `DISC-MISSING-${lead.id}`,
        type: 'MISSING_EVENT',
        leadId: lead.id,
        leadName: `${lead.first_name} ${lead.last_name}`,
        leadEmail: lead.email,
        currentStatus: lead.current_status,
        pipelineDate: lead.call_date,
        pipelineTime: lead.call_time,
        severity: 'high',
        title: 'Google Calendar Event Missing',
        description: `Lead "${lead.first_name} ${lead.last_name}" is marked as '${lead.current_status}' in the Pipeline, but no active Google Calendar event exists.`,
        recommendation: 'Re-create calendar booking or update lead status to "Researched".'
      });
    } else if (isScheduledInPipeline && matchingEvent) {
      // Check date/time alignment if event start dateTime is present
      const eventStartStr = matchingEvent.start?.dateTime || matchingEvent.start?.date;
      if (eventStartStr && lead.call_date) {
        const eventDateObj = new Date(eventStartStr);
        const eventDateISO = eventDateObj.toISOString().split('T')[0];
        const eventHours = String(eventDateObj.getHours()).padStart(2, '0');
        const eventMinutes = String(eventDateObj.getMinutes()).padStart(2, '0');
        const eventTimeISO = `${eventHours}:${eventMinutes}`;

        if (lead.call_date !== eventDateISO) {
          discrepancies.push({
            id: `DISC-MISMATCH-${lead.id}`,
            type: 'DATETIME_MISMATCH',
            leadId: lead.id,
            leadName: `${lead.first_name} ${lead.last_name}`,
            leadEmail: lead.email,
            currentStatus: lead.current_status,
            eventId: matchingEvent.id,
            eventTitle: matchingEvent.summary,
            eventStartISO: eventStartStr,
            eventStartFormatted: eventDateObj.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            pipelineDate: lead.call_date,
            pipelineTime: lead.call_time,
            severity: 'medium',
            title: 'Schedule Date/Time Mismatch',
            description: `Pipeline call date (${lead.call_date} ${lead.call_time || ''}) differs from Google Calendar event (${eventDateISO} ${eventTimeISO}).`,
            recommendation: 'Sync pipeline schedule timestamp with Google Calendar.'
          });
        }
      }
    }
  });

  // 2. Check active Google Calendar events that are NOT reflected in Lead status
  activeEvents.forEach(ev => {
    const matchingLead = findMatchingLeadForEvent(ev);
    if (matchingLead) {
      const isLeadScheduled =
        matchingLead.current_status === 'Call Scheduled' ||
        (matchingLead.current_status as string) === 'CALL_SCHEDULED';

      if (!isLeadScheduled) {
        const eventStartStr = ev.start?.dateTime || ev.start?.date;
        const formattedStart = eventStartStr
          ? new Date(eventStartStr).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Scheduled';

        discrepancies.push({
          id: `DISC-UNSYNCED-${matchingLead.id}-${ev.id}`,
          type: 'UNSYNCED_LEAD_STATUS',
          leadId: matchingLead.id,
          leadName: `${matchingLead.first_name} ${matchingLead.last_name}`,
          leadEmail: matchingLead.email,
          currentStatus: matchingLead.current_status,
          eventId: ev.id,
          eventTitle: ev.summary,
          eventStartISO: eventStartStr,
          eventStartFormatted: formattedStart,
          severity: 'medium',
          title: 'Lead Status Out of Sync with Calendar',
          description: `Active Google Calendar event "${ev.summary}" (${formattedStart}) exists, but lead is currently marked as '${matchingLead.current_status}'.`,
          recommendation: 'Update lead status to "Call Scheduled" to match Google Calendar.'
        });
      }
    }
  });

  return discrepancies;
}
