import { Lead } from '../../../types/inbound';

export interface GoogleSpreadsheetItem {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

const HEADER_ROW = [
  'Signal_ID',
  'First_Name',
  'Last_Name',
  'Phone_E164',
  'Email',
  'Origin_Source',
  'Origin_Type',
  'Current_Status',
  'AI_Output',
  'Call_Date',
  'Call_Time',
  'POPIA_Consent',
  'Timestamp'
];

export function leadToRow(lead: Lead): string[] {
  return [
    lead.signal_id || '',
    lead.first_name || '',
    lead.last_name || '',
    lead.phone_e164 || '',
    lead.email || '',
    lead.origin_source || '',
    lead.origin_type || '',
    lead.current_status || 'New',
    lead.ai_output || '',
    lead.call_date || '',
    lead.call_time || '',
    lead.popia_consent ? 'Yes' : 'No',
    lead.created_at || new Date().toISOString()
  ];
}

export function rowToLead(row: string[], index: number): Partial<Lead> {
  return {
    id: `LEAD-GSHEET-${index + 1}`,
    signal_id: row[0] || `JB3-SIG-${Math.floor(1000 + Math.random() * 9000)}`,
    first_name: row[1] || 'Unknown',
    last_name: row[2] || 'Lead',
    phone_e164: row[3] || '',
    email: row[4] || '',
    origin_source: (row[5] as any) || 'General Website Signup',
    origin_type: (row[6] as any) || 'Form Signup',
    current_status: (row[7] as any) || 'New',
    ai_output: row[8] || 'Ingested from Google Sheet import',
    call_date: row[9] || undefined,
    call_time: row[10] || undefined,
    popia_consent: row[11]?.toLowerCase() === 'yes',
    created_at: row[12] || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: 'Imported live from Google Sheet tab MASTER_PIPELINE'
  };
}

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive.
 */
export async function createGoogleSheet(accessToken: string, title = 'LeadFlow AI - MASTER_PIPELINE'): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: 'MASTER_PIPELINE',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write the header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MASTER_PIPELINE!A1:M1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [HEADER_ROW]
      })
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Writes/overwrites all leads to the specified Google Sheet (MASTER_PIPELINE tab).
 */
export async function exportLeadsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  leads: Lead[]
): Promise<{ updatedRows: number }> {
  const rows = [HEADER_ROW, ...leads.map(leadToRow)];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MASTER_PIPELINE!A1:M${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to export leads to Google Sheet');
  }

  const data = await response.json();
  return { updatedRows: data.updatedRows || rows.length };
}

/**
 * Appends a single lead row to the user's Google Sheet.
 */
export async function appendLeadToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  lead: Lead
): Promise<void> {
  const row = leadToRow(lead);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MASTER_PIPELINE!A:M:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to append lead to Google Sheet');
  }
}

/**
 * Imports leads from the MASTER_PIPELINE tab of the user's Google Sheet.
 */
export async function importLeadsFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Partial<Lead>[]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MASTER_PIPELINE!A2:M1000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to import values from Google Sheet');
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  return rows
    .filter(row => row && row.length > 0 && row[0])
    .map((row, idx) => rowToLead(row, idx));
}

/**
 * Lists Google Spreadsheets in the user's Google Drive.
 */
export async function listUserGoogleSheets(accessToken: string): Promise<GoogleSpreadsheetItem[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=25`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to list Google Spreadsheets from Drive');
  }

  const data = await response.json();
  return data.files || [];
}
