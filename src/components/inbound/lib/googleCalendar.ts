export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  startISO: string;
  endISO: string;
  attendeeEmail?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  status?: string;
}

/**
 * Creates an event on the user's primary Google Calendar.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  input: CalendarEventInput
): Promise<GoogleCalendarEvent> {
  const eventBody: any = {
    summary: input.summary,
    description: input.description || '',
    location: input.location || 'LeadFlow AI Consultation',
    start: {
      dateTime: input.startISO,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    },
    end: {
      dateTime: input.endISO,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
  };

  if (input.attendeeEmail) {
    eventBody.attendees = [{ email: input.attendeeEmail }];
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventBody)
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create event in Google Calendar');
  }

  return await response.json();
}

/**
 * Lists upcoming events from the user's primary Google Calendar.
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  maxResults = 25
): Promise<GoogleCalendarEvent[]> {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch events from Google Calendar');
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Deletes a Google Calendar event by ID.
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok && response.status !== 410) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to delete Google Calendar event');
  }
}
