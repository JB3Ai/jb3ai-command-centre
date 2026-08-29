export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  headers?: Record<string, string>;
}

/**
 * Encodes a string into base64url format for RFC 2822 raw messages.
 */
function base64UrlEncode(str: string): string {
  // Convert string to UTF-8 array then to Base64
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sends an email using the Gmail API.
 */
export async function sendGmailMessage(
  accessToken: string,
  input: SendEmailInput
): Promise<{ id: string; threadId: string }> {
  const emailLines: string[] = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0'
  ];

  if (input.cc) emailLines.push(`Cc: ${input.cc}`);
  if (input.bcc) emailLines.push(`Bcc: ${input.bcc}`);

  emailLines.push('', input.body);

  const rawEmail = emailLines.join('\r\n');
  const encodedRaw = base64UrlEncode(rawEmail);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedRaw
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to send email via Gmail API');
  }

  return await response.json();
}

/**
 * Fetches recent sent/received messages from Gmail.
 */
export async function listRecentGmailMessages(
  accessToken: string,
  maxResults = 10
): Promise<GmailMessageSummary[]> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch messages from Gmail');
  }

  const data = await response.json();
  const messages: Array<{ id: string; threadId: string }> = data.messages || [];

  const detailedMessages: GmailMessageSummary[] = await Promise.all(
    messages.slice(0, 5).map(async msg => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
        const detail = await detailRes.json();
        const headersMap: Record<string, string> = {};
        (detail.payload?.headers || []).forEach((h: GmailMessageHeader) => {
          headersMap[h.name] = h.value;
        });

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet,
          internalDate: detail.internalDate,
          headers: headersMap
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return detailedMessages;
}
