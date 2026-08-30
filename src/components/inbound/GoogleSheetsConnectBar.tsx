import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  googleLogout, 
  initAuth 
} from './lib/googleAuth';
import { 
  createGoogleSheet, 
  exportLeadsToGoogleSheet, 
  importLeadsFromGoogleSheet, 
  listUserGoogleSheets, 
  GoogleSpreadsheetItem 
} from './lib/googleSheets';
import { Lead } from '../../types/inbound';
import { 
  FileSpreadsheet, 
  LogOut, 
  UploadCloud, 
  DownloadCloud, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Activity,
  Wifi,
  WifiOff,
  Zap,
  Clock
} from 'lucide-react';

interface GoogleSheetsConnectBarProps {
  leads: Lead[];
  onImportLeads?: (importedLeads: Partial<Lead>[]) => void;
  onLogSync?: (action: string, details: string) => void;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: (enabled: boolean) => void;
}

export const GoogleSheetsConnectBar: React.FC<GoogleSheetsConnectBarProps> = ({
  leads,
  onImportLeads,
  onLogSync,
  autoSyncEnabled = true,
  onToggleAutoSync
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const PROVIDED_SHEET_ID = '1lBE65JBjui8HLChoZpX9vxmN2jkCrlxX7SN9RMpZxsI';
  const PROVIDED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1lBE65JBjui8HLChoZpX9vxmN2jkCrlxX7SN9RMpZxsI/edit?usp=sharing';

  // Sheet state
  const [activeSheetId, setActiveSheetId] = useState<string | null>(
    () => localStorage.getItem('google_sheet_id') || PROVIDED_SHEET_ID
  );
  const [activeSheetUrl, setActiveSheetUrl] = useState<string | null>(
    () => localStorage.getItem('google_sheet_url') || PROVIDED_SHEET_URL
  );
  const [activeSheetName, setActiveSheetName] = useState<string | null>(
    () => localStorage.getItem('google_sheet_name') || 'MASTER_PIPELINE (Provided)'
  );

  const [driveSheets, setDriveSheets] = useState<GoogleSpreadsheetItem[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Heartbeat state for GAS backend connectivity
  const [heartbeatStatus, setHeartbeatStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState<number>(0);

  const performHeartbeatCheck = async () => {
    const startMs = Date.now();
    try {
      setHeartbeatStatus('checking');
      const res = await fetch('/api/health');
      if (res.ok) {
        const elapsed = Date.now() - startMs;
        setLatencyMs(elapsed);
        setHeartbeatStatus('connected');
        setLastHeartbeat(new Date());
        setHeartbeatCount(prev => prev + 1);
      } else {
        setHeartbeatStatus('disconnected');
      }
    } catch {
      setHeartbeatStatus('disconnected');
    }
  };

  useEffect(() => {
    performHeartbeatCheck();
    const intervalId = setInterval(performHeartbeatCheck, 12000);
    return () => clearInterval(intervalId);
  }, []);

  // Confirmation modal states for destructive/mutating operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    action: () => {}
  });

  // Listen for auth state on load
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

  // Fetch user sheets from Google Drive when authenticated
  useEffect(() => {
    if (user && accessToken) {
      loadDriveSheets();
    }
  }, [user, accessToken]);

  const loadDriveSheets = async () => {
    if (!accessToken) return;
    setIsLoadingSheets(true);
    try {
      const sheets = await listUserGoogleSheets(accessToken);
      setDriveSheets(sheets);
    } catch (err: any) {
      console.warn('Could not load Google Drive sheets:', err.message);
    } finally {
      setIsLoadingSheets(false);
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
        setStatusMessage({ text: `Connected as ${res.user.email}`, type: 'success' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to sign in with Google', type: 'error' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await googleLogout();
    setUser(null);
    setAccessToken(null);
    setStatusMessage({ text: 'Signed out from Google', type: 'info' });
  };

  // Create new sheet
  const handleCreateSheet = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const result = await createGoogleSheet(accessToken, 'LeadFlow AI - MASTER_PIPELINE');
      setActiveSheetId(result.spreadsheetId);
      setActiveSheetUrl(result.spreadsheetUrl);
      setActiveSheetName('LeadFlow AI - MASTER_PIPELINE');

      localStorage.setItem('google_sheet_id', result.spreadsheetId);
      localStorage.setItem('google_sheet_url', result.spreadsheetUrl);
      localStorage.setItem('google_sheet_name', 'LeadFlow AI - MASTER_PIPELINE');

      // Export current leads into the new sheet automatically
      await exportLeadsToGoogleSheet(accessToken, result.spreadsheetId, leads);

      setStatusMessage({
        text: `Created and linked Google Sheet successfully!`,
        type: 'success'
      });
      if (onLogSync) {
        onLogSync('CREATE_SHEET', `Created spreadsheet ${result.spreadsheetId}`);
      }
      loadDriveSheets();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create sheet', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Select existing sheet
  const handleSelectSheet = (sheet: GoogleSpreadsheetItem) => {
    setActiveSheetId(sheet.id);
    const url = sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`;
    setActiveSheetUrl(url);
    setActiveSheetName(sheet.name);

    localStorage.setItem('google_sheet_id', sheet.id);
    localStorage.setItem('google_sheet_url', url);
    localStorage.setItem('google_sheet_name', sheet.name);

    setStatusMessage({ text: `Linked to spreadsheet: ${sheet.name}`, type: 'success' });
  };

  // Export leads (with confirmation modal requirement)
  const triggerExport = () => {
    if (!activeSheetId || !accessToken) return;

    setConfirmModal({
      isOpen: true,
      title: 'Overwrite Google Sheet Pipeline?',
      description: `This will push ${leads.length} lead records to Google Sheet tab "MASTER_PIPELINE". Any existing sheet rows will be updated.`,
      confirmText: 'Sync & Push All Leads',
      action: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSyncing(true);
        setStatusMessage(null);
        try {
          const res = await exportLeadsToGoogleSheet(accessToken, activeSheetId, leads);
          setStatusMessage({
            text: `Synced ${res.updatedRows} records to Google Sheet!`,
            type: 'success'
          });
          if (onLogSync) {
            onLogSync('EXPORT_SYNC', `Pushed ${leads.length} leads to sheet ${activeSheetId}`);
          }
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to sync to Google Sheet', type: 'error' });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // Import leads (with confirmation modal)
  const triggerImport = () => {
    if (!activeSheetId || !accessToken) return;

    setConfirmModal({
      isOpen: true,
      title: 'Import Leads from Google Sheet?',
      description: `This will read all rows from tab "MASTER_PIPELINE" of your Google Sheet and import new records into the LeadFlow AI matrix.`,
      confirmText: 'Import Records Now',
      action: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSyncing(true);
        setStatusMessage(null);
        try {
          const imported = await importLeadsFromGoogleSheet(accessToken, activeSheetId);
          if (onImportLeads && imported.length > 0) {
            onImportLeads(imported);
          }
          setStatusMessage({
            text: `Successfully imported ${imported.length} leads from Google Sheet!`,
            type: 'success'
          });
          if (onLogSync) {
            onLogSync('IMPORT_SYNC', `Imported ${imported.length} rows from sheet ${activeSheetId}`);
          }
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to import from Google Sheet', type: 'error' });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  return (
    <div className="bg-[#0F0F11] border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                Live Google Sheets Integration
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Official OAuth 2.0
              </span>
              <button
                type="button"
                onClick={() => onToggleAutoSync && onToggleAutoSync(!autoSyncEnabled)}
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  autoSyncEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title="Click to toggle automatic background synchronization"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>Auto-Sync: {autoSyncEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Sync real-time lead pipeline records directly with your Google Workspace Spreadsheets
            </p>
          </div>
        </div>

        {/* Auth status or sign-in button */}
        <div className="flex items-center gap-3">
          {!user ? (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="gsi-material-button flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-medium text-xs transition-all shadow-md cursor-pointer border border-gray-300 disabled:opacity-50"
            >
              <div className="w-4 h-4 shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-[#161618] border border-white/10 px-3 py-1.5 rounded-xl">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-medium text-white max-w-[140px] truncate">{user.displayName || user.email}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Authenticated
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-400 p-1 transition-colors cursor-pointer ml-1"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time GAS Connectivity Heartbeat Status Bar */}
      <div className="bg-[#141416] border border-white/5 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            {heartbeatStatus === 'connected' ? (
              <>
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            ) : heartbeatStatus === 'checking' ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse" />
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
              {heartbeatStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GAS Environment Bridge: Active</span>
                </>
              ) : heartbeatStatus === 'checking' ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Pinging GAS Environment...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span>GAS Environment Bridge: Offline</span>
                </>
              )}
            </span>

            {latencyMs !== null && heartbeatStatus === 'connected' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {latencyMs}ms
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
          {lastHeartbeat && (
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>Last heartbeat: {lastHeartbeat.toLocaleTimeString()}</span>
            </span>
          )}

          <span className="text-gray-500 hidden sm:inline">
            Heartbeats: #{heartbeatCount}
          </span>

          <button
            type="button"
            onClick={performHeartbeatCheck}
            disabled={heartbeatStatus === 'checking'}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Trigger instant heartbeat ping"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Ping Heartbeat</span>
          </button>
        </div>
      </div>

      {/* Status banner message */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : statusMessage.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-300'
            : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
        }`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Sheet Control Panel */}
      {user ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Active linked sheet card */}
          <div className="md:col-span-6 bg-[#0A0A0B] border border-white/5 p-4 rounded-xl space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
              Active Linked Spreadsheet
            </span>

            {activeSheetId ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                      {activeSheetName}
                    </span>
                  </div>
                  {activeSheetUrl && (
                    <a
                      href={activeSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <span>Open in Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="text-[10px] font-mono text-gray-500 bg-white/5 p-2 rounded border border-white/5 truncate">
                  ID: {activeSheetId}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">
                No active spreadsheet linked yet. Click 'Create New Sheet' below or select an existing one.
              </div>
            )}

            {/* Sync Action Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={triggerExport}
                disabled={!activeSheetId || isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium transition-all cursor-pointer shadow-sm"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>Sync & Push to Sheet ({leads.length})</span>
              </button>

              <button
                onClick={triggerImport}
                disabled={!activeSheetId || isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 text-gray-200 text-xs font-medium transition-all cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Import from Sheet</span>
              </button>
            </div>
          </div>

          {/* Sheet Selector & Creator */}
          <div className="md:col-span-6 bg-[#0A0A0B] border border-white/5 p-4 rounded-xl space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
              Create or Connect Google Drive Spreadsheet
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateSheet}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-all cursor-pointer shadow-sm"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Create New Sheet in Drive</span>
              </button>

              <button
                onClick={loadDriveSheets}
                disabled={isLoadingSheets}
                className="px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors border border-white/5 cursor-pointer"
                title="Refresh Drive sheets list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Existing Spreadsheets List */}
            {driveSheets.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <FolderOpen className="w-3 h-3 text-amber-400" /> Existing Spreadsheets in your Drive:
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {driveSheets.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSheet(s)}
                      className={`w-full text-left p-1.5 rounded text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        s.id === activeSheetId
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#161618] text-gray-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span className="truncate max-w-[200px] font-medium">{s.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {s.id === activeSheetId ? 'Linked' : 'Click to Link'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#0A0A0B] border border-white/5 rounded-xl p-4 text-xs text-gray-400 flex items-center justify-between flex-wrap gap-3">
          <span>
            Sign in with your Google Account to automatically create, link, push, and sync your master pipeline directly with Google Sheets.
          </span>
          <button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer shrink-0"
          >
            Authenticate with Google
          </button>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161618] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>{confirmModal.title}</span>
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors cursor-pointer border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
