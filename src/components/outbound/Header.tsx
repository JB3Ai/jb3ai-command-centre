import React from 'react';
import { 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  FileText, 
  Sliders, 
  Inbox, 
  LayoutGrid, 
  LogOut,
  Mail,
  Zap
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'board' | 'inbox' | 'templates' | 'contacts' | 'campaigns';
  setActiveTab: (tab: 'board' | 'inbox' | 'templates' | 'contacts' | 'campaigns') => void;
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSyncInbox: () => void;
  isSyncing: boolean;
  onOpenDailyBrief: () => void;
  repliesCount: number;
  followupsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  accessToken,
  onLogin,
  onLogout,
  onSyncInbox,
  isSyncing,
  onOpenDailyBrief,
  repliesCount,
  followupsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Account Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-lg text-white">SponsorFlow</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    Isikolo AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span className="font-mono text-slate-300">sponsor@jb3ai.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'board'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline Board</span>
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox Zero</span>
              {repliesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 animate-pulse">
                  {repliesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sequencer</span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Daily Brief Button */}
            <button
              onClick={onOpenDailyBrief}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all"
              title="View Morning Brief & Action Summary"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Brief</span>
              {(repliesCount > 0 || followupsCount > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Sync Inbox Button */}
            <button
              onClick={onSyncInbox}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>

            {/* OAuth Connection Status / Sign In Button */}
            {user && accessToken ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Gmail Live</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="gsi-material-button text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Connect Gmail API</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex items-center justify-around bg-slate-950 border-t border-slate-800 py-2 px-1 text-xs">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'board' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Board</span>
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex flex-col items-center gap-1 relative ${activeTab === 'inbox' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Inbox className="w-4 h-4" />
          <span>Inbox</span>
          {repliesCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'templates' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Templates</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'contacts' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Users className="w-4 h-4" />
          <span>Contacts</span>
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'campaigns' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Queue</span>
        </button>
      </div>
    </header>
  );
};
