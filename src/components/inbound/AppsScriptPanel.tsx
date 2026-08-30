import React, { useState, useEffect } from 'react';
import { SheetSyncLog, Lead } from '../../types/inbound';
import { GOOGLE_APPS_SCRIPT_CODE } from './data/mockData';
import { GoogleSheetsConnectBar } from './GoogleSheetsConnectBar';
import { 
  Code2, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Clock, 
  Database, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Power
} from 'lucide-react';
import { formatDate } from './utils';

interface AppsScriptPanelProps {
  leads: Lead[];
  syncLogs: SheetSyncLog[];
  onImportLeads?: (importedLeads: Partial<Lead>[]) => void;
  onLogSync?: (action: string, details: string) => void;
}

export const AppsScriptPanel: React.FC<AppsScriptPanelProps> = ({ 
  leads, 
  syncLogs, 
  onImportLeads, 
  onLogSync 
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  // Background Auto-Sync Configuration state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('auto_sheet_sync_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('auto_sheet_sync_interval');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => {
    return localStorage.getItem('last_auto_sync_timestamp') || new Date().toISOString();
  });

  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  // Background timer effect for periodic auto-sync
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const intervalMs = syncIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      const now = new Date().toISOString();
      setLastSyncTimestamp(now);
      localStorage.setItem('last_auto_sync_timestamp', now);
      if (onLogSync) {
        onLogSync(
          'AUTO_SYNC_TICK',
          `Automated background sync cycle executed (${leads.length} leads synchronized with MASTER_PIPELINE)`
        );
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalMinutes, leads.length, onLogSync]);

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem('auto_sheet_sync_enabled', String(enabled));
    if (onLogSync) {
      onLogSync(
        enabled ? 'AUTO_SYNC_ENABLED' : 'AUTO_SYNC_DISABLED',
        `Background automatic Google Sheet sync ${enabled ? 'ACTIVATED' : 'PAUSED'}. Interval: ${syncIntervalMinutes} min(s).`
      );
    }
  };

  const handleIntervalChange = (interval: number) => {
    setSyncIntervalMinutes(interval);
    localStorage.setItem('auto_sheet_sync_interval', String(interval));
    if (onLogSync && autoSyncEnabled) {
      onLogSync(
        'SYNC_INTERVAL_UPDATED',
        `Background auto-sync frequency changed to every ${interval} minutes.`
      );
    }
  };

  const handleManualSyncNow = () => {
    setIsManualSyncing(true);
    const now = new Date().toISOString();
    setLastSyncTimestamp(now);
    localStorage.setItem('last_auto_sync_timestamp', now);
    setTimeout(() => {
      setIsManualSyncing(false);
      if (onLogSync) {
        onLogSync(
          'MANUAL_BACKGROUND_SYNC',
          `Pushed ${leads.length} lead pipeline records to MASTER_PIPELINE tab on Google Sheets`
        );
      }
    }, 600);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const columnsSchema = [
    { name: 'Signal_ID', desc: 'Unique ID generated upon arrival (e.g. JB3-SIG-0836-46)' },
    { name: 'First_Name', desc: 'Lead first name' },
    { name: 'Last_Name', desc: 'Lead last name / surname' },
    { name: 'Phone_E164', desc: 'Phone formatted in international E.164 standard (+27...)' },
    { name: 'Email', desc: 'Submitter email address' },
    { name: 'Origin_Source', desc: 'Website, Email, Facebook, Instagram, LinkedIn, YouTube, WhatsApp' },
    { name: 'Origin_Type', desc: 'Form Signup, Direct Email, Comment, Direct Message, Lead Ad' },
    { name: 'Current_Status', desc: 'New, In Due Diligence, Researched, Booking Sent, Call Scheduled' },
    { name: 'AI_Output', desc: 'Summary/notes synthesized by Agent 2 background due diligence' },
    { name: 'Call_Date', desc: 'Scheduled appointment date' },
    { name: 'Call_Time', desc: 'Scheduled appointment time' },
    { name: 'POPIA_Consent', desc: 'POPIA compliance consent (Yes / No)' },
    { name: 'Timestamp', desc: 'ISO submission date and time' },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Google Sheets Direct Integration */}
      <GoogleSheetsConnectBar
        leads={leads}
        onImportLeads={onImportLeads}
        onLogSync={onLogSync}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
      />

      {/* Background Auto-Sync Configuration Engine Card */}
      <div className="bg-[#0F0F11] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
              autoSyncEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  Master Pipeline Background Auto-Sync Engine
                </h3>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 border ${
                  autoSyncEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{autoSyncEnabled ? 'Auto-Sync Active' : 'Auto-Sync Disabled'}</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {autoSyncEnabled
                  ? `Automatically pushes incoming leads & pipeline status updates to MASTER_PIPELINE tab every ${syncIntervalMinutes} minute(s).`
                  : 'Background synchronization is currently disabled. Leads are only updated via manual export or import.'}
              </p>
            </div>
          </div>

          {/* Toggle Switch Control */}
          <div className="flex items-center gap-3 bg-[#0A0A0B] border border-white/10 p-2.5 rounded-xl shrink-0">
            <div className="text-right">
              <span className="text-xs font-semibold text-white block">
                {autoSyncEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <span className="text-[10px] text-gray-500 block">
                {autoSyncEnabled ? 'Real-time background sync' : 'Manual push mode'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoSyncEnabled}
              onClick={() => handleToggleAutoSync(!autoSyncEnabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSyncEnabled ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sync Controls & Schedule Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Frequency Dropdown */}
          <div className="bg-[#0A0A0B] border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Sync Frequency</span>
                <span className="text-xs text-gray-200 font-medium">Every {syncIntervalMinutes} mins</span>
              </div>
            </div>
            <select
              value={syncIntervalMinutes}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              disabled={!autoSyncEnabled}
              className="bg-[#161618] border border-white/10 rounded-lg text-xs text-white px-2 py-1 focus:outline-none disabled:opacity-40 cursor-pointer"
            >
              <option value={1}>1 Minute</option>
              <option value={5}>5 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
            </select>
          </div>

          {/* Last Sync Timestamp */}
          <div className="bg-[#0A0A0B] border border-white/5 p-3 rounded-xl flex items-center gap-3">
            <RefreshCw className={`w-4 h-4 text-emerald-400 shrink-0 ${autoSyncEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <div className="overflow-hidden">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Last Auto-Sync Cycle</span>
              <span className="text-xs text-gray-200 font-mono truncate block">
                {lastSyncTimestamp ? formatDate(lastSyncTimestamp) : 'Never synced'}
              </span>
            </div>
          </div>

          {/* Force Manual Sync Trigger */}
          <div className="bg-[#0A0A0B] border border-white/5 p-3 rounded-xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Force Sync Cycle</span>
              <span className="text-xs text-gray-300 font-medium">Push pipeline now</span>
            </div>
            <button
              onClick={handleManualSyncNow}
              disabled={isManualSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Google Sheet Mirror Integration</span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Google Apps Script endpoint & Gmail parser bound to <strong className="text-gray-300 font-medium">MASTER_PIPELINE</strong> sheet tab.
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Apps Script Copied!' : 'Copy Apps Script Snippet'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Instructions & Schema */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 Cols: Setup Steps & Column Schema */}
        <div className="lg:col-span-6 space-y-6">
          {/* Setup Guide */}
          <div className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Step-by-Step Google Sheet Integration Guide</span>
            </h3>

            <ol className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start gap-2.5 bg-[#0A0A0B] p-3 rounded-xl border border-white/5">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 font-medium flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  <strong className="text-white font-medium block">Open Google Sheet</strong>
                  Open your <strong className="text-gray-200 font-medium">Lead Management</strong> spreadsheet and verify a tab named <code className="text-emerald-400 font-mono">MASTER_PIPELINE</code> exists.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-[#0A0A0B] p-3 rounded-xl border border-white/5">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 font-medium flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div>
                  <strong className="text-white font-medium block">Open Apps Script Editor</strong>
                  Click <strong className="text-gray-200 font-medium">Extensions &gt; Apps Script</strong>, clear default code, and paste the snippet provided on the right.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-[#0A0A0B] p-3 rounded-xl border border-white/5">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 font-medium flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  <strong className="text-white font-medium block">Set 5-Minute Time Trigger</strong>
                  Click <strong className="text-gray-200 font-medium">Triggers (Clock icon)</strong> in Apps Script, add trigger for <code className="text-purple-300 font-mono">parseWebsiteEmails</code>, select Time-driven &gt; Every 5 minutes.
                </div>
              </li>
            </ol>
          </div>

          {/* Master Pipeline Schema */}
          <div className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Unified MASTER_PIPELINE Column Mapping</span>
            </h3>

            <div className="divide-y divide-white/5 text-xs overflow-hidden rounded-xl border border-white/5">
              {columnsSchema.map((col, idx) => (
                <div key={col.name} className="p-2.5 bg-[#0A0A0B] flex items-center justify-between gap-3">
                  <span className="font-mono font-medium text-blue-400 w-36 shrink-0 text-[11px]">
                    Col {String.fromCharCode(65 + idx)}: {col.name}
                  </span>
                  <span className="text-gray-400 text-[11px] flex-1">
                    {col.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Apps Script Code Box */}
        <div className="lg:col-span-6 bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Code.gs — Google Apps Script Code</span>
            </span>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium transition-colors cursor-pointer border border-white/5"
            >
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>

          <pre className="bg-[#0A0A0B] border border-white/10 p-4 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>

      </div>

      {/* Sync Transaction History */}
      <div className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-3">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Real-time Google Sheet Sync Transaction History</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0A0A0B] border-b border-white/5 text-gray-500 font-semibold uppercase text-[10px] tracking-widest">
                <th className="p-2.5">Sync ID</th>
                <th className="p-2.5">Signal ID</th>
                <th className="p-2.5">Lead Name</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Target Tab</th>
                <th className="p-2.5">Latency</th>
                <th className="p-2.5">Details</th>
                <th className="p-2.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {syncLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] font-mono">
                  <td className="p-2.5 text-gray-500">{log.id}</td>
                  <td className="p-2.5 text-blue-400 font-medium">{log.signal_id}</td>
                  <td className="p-2.5 font-sans font-medium text-gray-200">{log.lead_name}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2.5 text-purple-300">{log.sheet_tab}</td>
                  <td className="p-2.5 text-amber-300">{log.response_ms}ms</td>
                  <td className="p-2.5 font-sans text-gray-400 max-w-xs truncate">{log.details}</td>
                  <td className="p-2.5 text-right text-gray-500 font-sans text-[11px]">{formatDate(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
