import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, initAuth } from './lib/googleAuth';
import { 
  createGoogleCalendarEvent, 
  listGoogleCalendarEvents, 
  deleteGoogleCalendarEvent, 
  GoogleCalendarEvent 
} from './lib/googleCalendar';
import { Lead } from '../../types/inbound';
import { auditBidirectionalSync, SyncDiscrepancy } from './lib/syncAudit';
import { INITIAL_CALENDAR_EVENTS } from './data/mockData';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User as UserIcon, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Video,
  Send,
  Building
} from 'lucide-react';

interface GoogleCalendarPanelProps {
  leads: Lead[];
  calendarEvents?: GoogleCalendarEvent[];
  onUpdateCalendarEvents?: (events: GoogleCalendarEvent[]) => void;
  onUpdateLeadStatus?: (leadId: string, status: any, callDate?: string, callTime?: string) => void;
  onLogSync?: (action: string, details: string) => void;
  onResolveDiscrepancy?: (discrepancy: SyncDiscrepancy, action: 'UPDATE_STATUS' | 'RESET_STATUS' | 'SYNC_TIME') => void;
}

export const GoogleCalendarPanel: React.FC<GoogleCalendarPanelProps> = ({
  leads,
  calendarEvents,
  onUpdateCalendarEvents,
  onUpdateLeadStatus,
  onLogSync,
  onResolveDiscrepancy
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>(calendarEvents || INITIAL_CALENDAR_EVENTS);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync with prop when parent updates
  useEffect(() => {
    if (calendarEvents && calendarEvents.length > 0) {
      setEvents(calendarEvents);
    }
  }, [calendarEvents]);

  // Compute live bidirectional sync audit discrepancies
  const discrepancies = auditBidirectionalSync(leads, events);

  // Form state to schedule new call
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [summary, setSummary] = useState<string>('Due Diligence & Strategy Consultation');
  const [eventDate, setEventDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState<string>('14:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [attendeeEmail, setAttendeeEmail] = useState<string>('');
  const [location, setLocation] = useState<string>('Google Meet / VoiceGrid Call');
  const [description, setDescription] = useState<string>('Consultation call regarding lead acquisition pipeline & due diligence.');
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);

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
      loadCalendarEvents();
    }
  }, [user, accessToken]);

  const loadCalendarEvents = async () => {
    if (!accessToken) return;
    setIsLoadingEvents(true);
    try {
      const fetchedEvents = await listGoogleCalendarEvents(accessToken);
      setEvents(fetchedEvents);
    } catch (err: any) {
      console.warn('Could not fetch calendar events:', err.message);
    } finally {
      setIsLoadingEvents(false);
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
        setStatusMessage({ text: 'Connected to Google Calendar API!', type: 'success' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to authenticate with Google', type: 'error' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // When lead is selected in dropdown, prefill attendee email & summary
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setAttendeeEmail(lead.email || '');
      setSummary(`Consultation Call: ${lead.first_name} ${lead.last_name}`);
      setDescription(`Lead Source: ${lead.origin_source}\nType: ${lead.origin_type}\nAI Assessment: ${lead.ai_output}`);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setStatusMessage({ text: 'Please sign in with Google first.', type: 'error' });
      return;
    }

    setIsCreatingEvent(true);
    setStatusMessage(null);

    try {
      const startISO = new Date(`${eventDate}T${eventTime}:00`).toISOString();
      const endTimeObj = new Date(new Date(`${eventDate}T${eventTime}:00`).getTime() + durationMinutes * 60000);
      const endISO = endTimeObj.toISOString();

      const created = await createGoogleCalendarEvent(accessToken, {
        summary,
        description,
        location,
        startISO,
        endISO,
        attendeeEmail: attendeeEmail || undefined
      });

      // Update lead status in state to Call Scheduled
      if (selectedLeadId && onUpdateLeadStatus) {
        onUpdateLeadStatus(selectedLeadId, 'Call Scheduled', eventDate, eventTime);
      }

      if (onLogSync) {
        onLogSync('CALENDAR_EVENT_CREATED', `Scheduled event "${summary}" on Google Calendar`);
      }

      setStatusMessage({ text: `Successfully scheduled event: "${summary}" on Google Calendar!`, type: 'success' });
      loadCalendarEvents();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to schedule event on Google Calendar', type: 'error' });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!accessToken) return;
    try {
      await deleteGoogleCalendarEvent(accessToken, eventId);
      setStatusMessage({ text: `Removed event: "${eventTitle}" from Google Calendar`, type: 'info' });
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete event', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar Control Header */}
      <div className="bg-[#0F0F11] border border-blue-500/20 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  Live Google Calendar Integration
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Google Calendar API v3
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Schedule lead consultations, automatically send invites, and manage calendar events in real time
              </p>
            </div>
          </div>

          {!user ? (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer shrink-0 shadow-md"
            >
              {isAuthenticating ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#161618] border border-white/10 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-200 font-medium">Calendar Connected ({user.email})</span>
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

        {/* BIDIRECTIONAL SYNC AUDIT & RECONCILIATION CARD */}
        <div className="bg-[#0A0A0B] border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className={`w-5 h-5 ${discrepancies.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  Bidirectional Calendar & Pipeline Sync Audit
                </h4>
                <p className="text-[11px] text-gray-400">
                  Cross-checks active Google Calendar events against PipelineTable lead statuses to catch deleted events, unsynced statuses, or date/time mismatches.
                </p>
              </div>
            </div>

            <div>
              {discrepancies.length > 0 ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  <span>{discrepancies.length} Discrepanc{discrepancies.length === 1 ? 'y' : 'ies'} Found</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pipeline & Calendar 100% Synced</span>
                </span>
              )}
            </div>
          </div>

          {discrepancies.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {discrepancies.map(disc => (
                <div
                  key={disc.id}
                  className="bg-[#161618] border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                        disc.type === 'MISSING_EVENT'
                          ? 'bg-red-500/15 text-red-300 border-red-500/30'
                          : disc.type === 'UNSYNCED_LEAD_STATUS'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}>
                        {disc.title}
                      </span>
                      <span className="font-semibold text-white">{disc.leadName}</span>
                      <span className="text-gray-400 font-mono text-[11px]">({disc.leadEmail})</span>
                    </div>

                    <p className="text-gray-300 text-[11px]">
                      {disc.description}
                    </p>
                    <p className="text-gray-500 text-[10px] italic">
                      Recommendation: {disc.recommendation}
                    </p>
                  </div>

                  {/* Auto-Fix Resolution Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {disc.type === 'UNSYNCED_LEAD_STATUS' && (
                      <button
                        onClick={() => {
                          if (onResolveDiscrepancy) {
                            onResolveDiscrepancy(disc, 'UPDATE_STATUS');
                          } else if (onUpdateLeadStatus) {
                            onUpdateLeadStatus(disc.leadId, 'Call Scheduled');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Update Lead to Call Scheduled</span>
                      </button>
                    )}

                    {disc.type === 'MISSING_EVENT' && (
                      <button
                        onClick={() => {
                          if (onResolveDiscrepancy) {
                            onResolveDiscrepancy(disc, 'RESET_STATUS');
                          } else if (onUpdateLeadStatus) {
                            onUpdateLeadStatus(disc.leadId, 'Researched');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Reset Status to Researched</span>
                      </button>
                    )}

                    {disc.type === 'DATETIME_MISMATCH' && (
                      <button
                        onClick={() => {
                          if (onResolveDiscrepancy) {
                            onResolveDiscrepancy(disc, 'SYNC_TIME');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Sync Timestamp to Calendar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-gray-400">
              No calendar discrepancies detected. All leads marked as 'Call Scheduled' match active Google Calendar events, and all events are properly recorded in the pipeline table.
            </div>
          )}
        </div>

        {/* Schedule Form & Upcoming Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Schedule New Call Form */}
          <div className="lg:col-span-6 bg-[#0A0A0B] border border-white/5 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Schedule Lead Call on Google Calendar
            </h4>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              {/* Select Lead */}
              <div>
                <label className="block text-gray-400 mb-1">Select Lead from Pipeline</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Custom Attendee (No Lead Selected) --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} ({l.current_status}) - {l.email || l.phone_e164}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-gray-400 mb-1">Event Summary / Title</label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-[#161618] border border-white/10 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              {/* Attendee Email */}
              <div>
                <label className="block text-gray-400 mb-1">Attendee Email (Calendar Invite)</label>
                <input
                  type="email"
                  placeholder="lead@company.com"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-gray-400 mb-1">Location / Video Call Link</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={!user || isCreatingEvent}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs transition-all cursor-pointer shadow-md"
              >
                {isCreatingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>Create & Sync to Google Calendar</span>
              </button>
            </form>
          </div>

          {/* Upcoming Google Calendar Events List */}
          <div className="lg:col-span-6 bg-[#0A0A0B] border border-white/5 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Upcoming Calendar Events ({events.length})
                </h4>
                {user && (
                  <button
                    onClick={loadCalendarEvents}
                    disabled={isLoadingEvents}
                    className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Calendar"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {user ? (
                <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {events.length > 0 ? (
                    events.map(ev => {
                      const startStr = ev.start?.dateTime || ev.start?.date;
                      const formattedStart = startStr
                        ? new Date(startStr).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })
                        : 'Scheduled';

                      return (
                        <div
                          key={ev.id}
                          className="bg-[#161618] border border-white/5 p-3 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-100 flex items-center gap-2">
                              <span>{ev.summary}</span>
                            </p>
                            <p className="text-[11px] text-blue-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{formattedStart}</span>
                            </p>
                            {ev.attendees && ev.attendees.length > 0 && (
                              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <UserIcon className="w-3 h-3 text-emerald-400" />
                                <span>{ev.attendees.map(a => a.email).join(', ')}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                title="Open in Google Calendar"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.summary)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                              title="Delete from Calendar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-gray-500">
                      No upcoming Google Calendar events found for this account.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-gray-500">
                  Connect your Google Calendar account above to view and sync upcoming consultation calls.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
