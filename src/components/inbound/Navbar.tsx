import React from 'react';
import { 
  Database, 
  Bot, 
  Send, 
  Code2, 
  Zap, 
  MessageSquareText, 
  TableProperties, 
  Sparkles,
  CheckCircle2,
  Globe,
  Calendar,
  Mail,
  Radio,
  Sliders
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'pipeline' | 'calendar' | 'gmail' | 'messages' | 'agents' | 'simulator' | 'script' | 'setup';
  setActiveTab: (tab: 'pipeline' | 'calendar' | 'gmail' | 'messages' | 'agents' | 'simulator' | 'script' | 'setup') => void;
  leadsCount: number;
  unreadMessagesCount: number;
  onQuickSimulate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  leadsCount,
  unreadMessagesCount,
  onQuickSimulate
}) => {
  return (
    <header className="bg-[#0A0A0B] border-b border-white/5 text-gray-200 sticky top-0 z-40 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg text-white tracking-tight">
                  LeadFlow <span className="text-blue-400 font-bold">AI</span>
                </h1>
                <span className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                  Base44 Intake
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>Master Sheet: <span className="text-gray-300 font-medium">MASTER_PIPELINE</span></span>
                <span>•</span>
                <span>Endpoint: <span className="text-gray-300 font-medium">hi@jb3ai.com</span></span>
              </p>
            </div>
          </div>

          {/* System Status Indicators & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-gray-400">CRM Sync:</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-gray-400">Gemini AI:</span>
              <span className="text-purple-300 font-medium">3.6 Flash</span>
            </div>

            <button
              onClick={onQuickSimulate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Webhook Payload</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TableProperties className="w-4 h-4 text-blue-400" />
            <span>Master Pipeline</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
              activeTab === 'pipeline' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'
            }`}>
              {leadsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Google Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'gmail'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-400" />
            <span>Gmail Outreach</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquareText className="w-4 h-4 text-gray-400" />
            <span>Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="bg-amber-500 text-black font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                {unreadMessagesCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'agents'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>AI Super-Agents</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded">
              4 Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'script'
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border ${
              activeTab === 'setup'
                ? 'bg-blue-600/20 text-white border-blue-500/50 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Channel & API Setup</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
