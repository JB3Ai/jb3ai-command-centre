import React, { useState } from 'react';
import { Contact, Tag, Priority } from '../../types/outbound';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Clipboard, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  FileText
} from 'lucide-react';

interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingContacts: Contact[];
  onImportContacts: (newContacts: Omit<Contact, 'id' | 'created_at'>[]) => void;
  accessToken?: string | null;
}

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  isOpen,
  onClose,
  existingContacts,
  onImportContacts,
  accessToken,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets_csv' | 'paste' | 'manual'>('sheets_csv');
  
  // Google Sheets / CSV State
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Copy-Paste Text State
  const [rawText, setRawText] = useState<string>('');

  // Manual Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [program, setProgram] = useState('');
  const [source, setSource] = useState('Research');
  const [priority, setPriority] = useState<Priority>(4);
  const [selectedTag, setSelectedTag] = useState<Tag>('corporate');
  const [customLanguage, setCustomLanguage] = useState('');
  const [customTier, setCustomTier] = useState('');

  if (!isOpen) return null;

  // Smart CSV & Google Sheets Parser
  const parseCSVToContacts = (csvString: string): Omit<Contact, 'id' | 'created_at'>[] => {
    const lines = csvString
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 1) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const rows = lines.map(parseLine);
    if (rows.length === 0) return [];

    const header = rows[0].map((h) => h.toLowerCase());
    const hasEmailHeader = header.some((h) => h.includes('email') || h.includes('e-mail') || h.includes('mail'));

    let nameIdx = -1;
    let emailIdx = -1;
    let companyIdx = -1;
    let programIdx = -1;
    let priorityIdx = -1;
    let tagIdx = -1;
    let languageIdx = -1;
    let tierIdx = -1;

    if (hasEmailHeader) {
      header.forEach((h, idx) => {
        if ((h.includes('name') || h.includes('contact')) && !h.includes('company') && nameIdx === -1) nameIdx = idx;
        if ((h.includes('email') || h.includes('e-mail') || h.includes('mail')) && emailIdx === -1) emailIdx = idx;
        if ((h.includes('company') || h.includes('organization') || h.includes('org')) && companyIdx === -1) companyIdx = idx;
        if ((h.includes('program') || h.includes('grant') || h.includes('project')) && programIdx === -1) programIdx = idx;
        if ((h.includes('priority') || h.includes('rank') || h.includes('prio')) && priorityIdx === -1) priorityIdx = idx;
        if ((h.includes('tag') || h.includes('category')) && tagIdx === -1) tagIdx = idx;
        if (h.includes('lang') && languageIdx === -1) languageIdx = idx;
        if (h.includes('tier') && tierIdx === -1) tierIdx = idx;
      });
    }

    const startRow = hasEmailHeader ? 1 : 0;
    const parsedContacts: Omit<Contact, 'id' | 'created_at'>[] = [];

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0) continue;

      let emailVal = '';
      let nameVal = '';
      let companyVal = '';
      let programVal = '';
      let priorityVal: Priority = 4;
      let tagVal: Tag = 'corporate';
      let langVal = 'English';
      let tierVal = 'Tier 1 Sponsor';

      if (hasEmailHeader) {
        if (emailIdx !== -1 && row[emailIdx]) emailVal = row[emailIdx];
        if (nameIdx !== -1 && row[nameIdx]) nameVal = row[nameIdx];
        if (companyIdx !== -1 && row[companyIdx]) companyVal = row[companyIdx];
        if (programIdx !== -1 && row[programIdx]) programVal = row[programIdx];
        if (priorityIdx !== -1 && row[priorityIdx]) {
          const pNum = parseInt(row[priorityIdx], 10);
          if ([1, 2, 3, 4, 5].includes(pNum)) priorityVal = pNum as Priority;
        }
        if (tagIdx !== -1 && row[tagIdx]) {
          const tLower = row[tagIdx].toLowerCase();
          if (tLower.includes('fiscal')) tagVal = 'fiscal-host';
          else if (tLower.includes('employee') || tLower.includes('nominator')) tagVal = 'employee-nominator';
          else if (tLower.includes('sa') || tLower.includes('local')) tagVal = 'local-sa';
          else if (tLower.includes('found')) tagVal = 'foundation';
        }
        if (languageIdx !== -1 && row[languageIdx]) langVal = row[languageIdx];
        if (tierIdx !== -1 && row[tierIdx]) tierVal = row[tierIdx];
      } else {
        row.forEach((cell) => {
          if (cell.includes('@') && !emailVal) {
            emailVal = cell;
          } else if (!nameVal && !cell.includes('@')) {
            nameVal = cell;
          } else if (!companyVal) {
            companyVal = cell;
          }
        });
      }

      if (emailVal) {
        emailVal = emailVal.toLowerCase().replace(/[<>"]/g, '').trim();
        const domain = emailVal.split('@')[1] || '';

        if (!nameVal) nameVal = emailVal.split('@')[0];
        if (!companyVal) {
          const comp = domain.split('.')[0] || 'Organization';
          companyVal = comp.charAt(0).toUpperCase() + comp.slice(1);
        }
        if (!programVal) programVal = `${companyVal} Sponsorship`;

        parsedContacts.push({
          name: nameVal,
          email: emailVal,
          company: companyVal,
          program: programVal,
          source: 'Google Sheets / CSV Import',
          priority: priorityVal,
          tags: [tagVal],
          custom_vars: {
            language: langVal,
            tier: tierVal,
          },
        });
      }
    }

    return parsedContacts;
  };

  // Fetch Google Sheet Data
  const handleFetchGoogleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsLoadingSheet(true);
    setSheetError(null);

    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Invalid Google Sheets URL format. Please paste a valid sheet link.');
      }
      const spreadsheetId = match[1];

      let fetchedCsv = '';

      if (accessToken) {
        try {
          const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z100`;
          const res = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.values && Array.isArray(data.values)) {
              fetchedCsv = data.values
                .map((row: string[]) => row.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))
                .join('\n');
            }
          }
        } catch (e) {
          console.warn('Sheets API direct fetch fallback to gviz endpoint:', e);
        }
      }

      if (!fetchedCsv) {
        const csvExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
        const res = await fetch(csvExportUrl);
        if (!res.ok) {
          throw new Error('Could not fetch sheet. Verify the link is valid or accessible.');
        }
        fetchedCsv = await res.text();
      }

      setCsvContent(fetchedCsv);
    } catch (err: any) {
      console.error('Google Sheets fetch error:', err);
      setSheetError(err.message || 'Failed to fetch Google Sheet.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Auto-Parse Paste Box with Regex
  const parseRawText = (): Omit<Contact, 'id' | 'created_at'>[] => {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const parsed: Omit<Contact, 'id' | 'created_at'>[] = [];
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;

    lines.forEach((line) => {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        const foundEmail = emailMatch[1].toLowerCase();

        let extractedName = 'Sponsorship Lead';
        if (line.includes('<')) {
          extractedName = line.split('<')[0].replace(/['"]/g, '').trim();
        } else if (line.includes('-')) {
          extractedName = line.split('-')[0].replace(foundEmail, '').trim();
        } else {
          extractedName = line.split(foundEmail)[0].trim() || 'Sponsorship Lead';
        }

        let extractedCompany = 'Target Organization';
        let extractedProgram = 'Open Source Grant';

        const emailDomain = foundEmail.split('@')[1];
        if (emailDomain.includes('microsoft')) {
          extractedCompany = 'Microsoft';
          extractedProgram = 'Microsoft FOSS Fund';
        } else if (emailDomain.includes('opencollective')) {
          extractedCompany = 'Open Source Collective';
          extractedProgram = 'OSC Fiscal Host';
        } else if (emailDomain.includes('github')) {
          extractedCompany = 'GitHub';
          extractedProgram = 'GitHub Sponsors';
        } else if (emailDomain.includes('canonical') || emailDomain.includes('ubuntu')) {
          extractedCompany = 'Canonical / Ubuntu';
          extractedProgram = 'Ubuntu Community Sponsorship';
        } else if (emailDomain.includes('linuxfoundation')) {
          extractedCompany = 'Linux Foundation';
          extractedProgram = 'LF Training Grant';
        } else {
          const domainName = emailDomain.split('.')[0];
          extractedCompany = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          extractedProgram = `${extractedCompany} Sponsorship`;
        }

        parsed.push({
          name: extractedName || 'Sponsorship Lead',
          email: foundEmail,
          company: extractedCompany,
          program: extractedProgram,
          source: 'Pasted Research List',
          priority: 4,
          tags: [emailDomain.includes('opencollective') ? 'fiscal-host' : 'corporate'],
          custom_vars: {
            language: 'English',
            tier: 'Tier 1 Sponsor',
          },
        });
      }
    });

    return parsed;
  };

  const parsedPastedContacts = parseRawText();
  const parsedCsvContacts = parseCSVToContacts(csvContent);

  const handleExecuteImport = () => {
    if (activeTab === 'sheets_csv') {
      if (parsedCsvContacts.length > 0) {
        onImportContacts(parsedCsvContacts);
        onClose();
      }
    } else if (activeTab === 'paste') {
      if (parsedPastedContacts.length > 0) {
        onImportContacts(parsedPastedContacts);
        onClose();
      }
    } else if (activeTab === 'manual') {
      if (email && company) {
        onImportContacts([
          {
            name: name || 'Sponsorship Lead',
            email: email.toLowerCase().trim(),
            company,
            program: program || 'Sponsorship Program',
            source: source || 'Manual Add',
            priority,
            tags: [selectedTag],
            custom_vars: {
              language: customLanguage || 'English',
              tier: customTier || 'Champion',
            },
          },
        ]);
        onClose();
      }
    }
  };

  // CSV File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Import Contacts</h3>
              <p className="text-xs text-slate-400">Import Google Sheets, CSV files, or text lists into SponsorFlow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Import Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sheets_csv')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sheets_csv'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets & CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Copy-Paste Text</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Manual Form</span>
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'sheets_csv' && (
            <div className="space-y-4">
              {/* Google Sheets URL Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Google Sheets Link Import
                  </span>
                  {accessToken && (
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      ✓ Workspace Sheets OAuth Authorized
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleFetchGoogleSheet}
                    disabled={isLoadingSheet || !sheetUrl.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {isLoadingSheet ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Fetch Sheet</span>
                  </button>
                </div>
                {sheetError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {sheetError}
                  </p>
                )}
              </div>

              {/* CSV Content / File Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    CSV Content or File Upload
                  </span>
                  <label className="cursor-pointer text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline">
                    Upload .csv file
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`Name, Email, Company, Program, Priority, Tags\nSarah Chen, sarah.chen@microsoft.com, Microsoft, Microsoft FOSS Fund, 5, corporate\nPia Mancini, pia@opencollective.com, Open Source Collective, OSC Fiscal Host, 4, fiscal-host`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Preview Parsed Contacts */}
              {parsedCsvContacts.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Parsed {parsedCsvContacts.length} Contact(s) from CSV / Sheet
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {parsedCsvContacts.map((c, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-900 p-2 rounded border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-200">{c.name}</span>{' '}
                          <span className="text-slate-400 font-mono">({c.email})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-amber-400">P{c.priority}</span>
                          <span className="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded">
                            {c.company}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Paste any raw research text or email list below. SponsorFlow auto-parses name, email, company, and program using smart regex:
              </p>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Example:\nSarah Chen <sarah.chen@microsoft.com> - Microsoft FOSS Fund\nPia Mancini pia@opencollective.com - OSC Host\nAlex Rivera <arivera@github.com>`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              {parsedPastedContacts.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-parsed {parsedPastedContacts.length} Contact(s)
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {parsedPastedContacts.map((c, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-900 p-2 rounded border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-200">{c.name}</span>{' '}
                          <span className="text-slate-400">({c.email})</span>
                        </div>
                        <span className="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded">
                          {c.company}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="sarah.chen@microsoft.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  placeholder="Microsoft"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Program / Grant Name</label>
                <input
                  type="text"
                  placeholder="Microsoft FOSS Fund"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priority (1-5)</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) as Priority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>Priority 5 (Highest)</option>
                  <option value={4}>Priority 4 (High)</option>
                  <option value={3}>Priority 3 (Medium)</option>
                  <option value={2}>Priority 2 (Low)</option>
                  <option value={1}>Priority 1 (Nurture)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tag Category</label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value as Tag)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="corporate">Corporate</option>
                  <option value="fiscal-host">Fiscal Host</option>
                  <option value="employee-nominator">Employee Nominator</option>
                  <option value="local-sa">Local SA</option>
                  <option value="foundation">Foundation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Custom Var: Language</label>
                <input
                  type="text"
                  placeholder="isiZulu / isiXhosa / English"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Custom Var: Tier</label>
                <input
                  type="text"
                  placeholder="Tier 1 Champion"
                  value={customTier}
                  onChange={(e) => setCustomTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Confirm & Import</span>
          </button>
        </div>
      </div>
    </div>
  );
};
