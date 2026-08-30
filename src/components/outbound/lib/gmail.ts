// Utility to encode string to base64url format for Gmail API
function unicodeToBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  threadId?: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}

export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile | null> {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      console.warn('Failed to fetch Gmail profile', await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching Gmail profile:', err);
    return null;
  }
}

export async function sendGmailEmail(
  accessToken: string,
  payload: SendEmailPayload
): Promise<{ id: string; threadId: string } | null> {
  const { to, subject, bodyHtml, threadId } = payload;

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyHtml,
  ].join('\r\n');

  const encodedMessage = unicodeToBase64Url(rawMessage);

  const bodyData: any = { raw: encodedMessage };
  if (threadId) {
    bodyData.threadId = threadId;
  }

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gmail API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return { id: data.id, threadId: data.threadId };
  } catch (err) {
    console.error('Error sending email via Gmail API:', err);
    throw err;
  }
}

export interface IncomingReplyMatch {
  messageId: string;
  threadId: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
}

export async function checkInboxForReplies(
  accessToken: string,
  knownEmails: string[]
): Promise<IncomingReplyMatch[]> {
  try {
    if (!knownEmails.length) return [];

    // Construct query for messages in inbox from known contact emails
    const query = `in:inbox (${knownEmails.map((e) => `from:${e}`).join(' OR ')})`;
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listRes.ok) {
      console.warn('Gmail list messages failed');
      return [];
    }

    const listData = await listRes.json();
    if (!listData.messages || !listData.messages.length) {
      return [];
    }

    const matches: IncomingReplyMatch[] = [];

    for (const msgRef of listData.messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (msgRes.ok) {
        const msg = await msgRes.json();
        const headers = msg.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

        // Extract email address from From header (e.g., "Sarah Chen <sarah.chen@microsoft.com>")
        const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
        const senderEmail = emailMatch[1] ? emailMatch[1].toLowerCase() : fromHeader.toLowerCase();

        matches.push({
          messageId: msg.id,
          threadId: msg.threadId,
          fromEmail: senderEmail,
          subject: subjectHeader,
          snippet: msg.snippet || '',
          body: msg.snippet || '',
          date: new Date(dateHeader).toISOString(),
        });
      }
    }

    return matches;
  } catch (err) {
    console.error('Error checking inbox replies:', err);
    return [];
  }
}
