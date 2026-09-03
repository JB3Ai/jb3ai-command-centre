import { useState } from "react";
import { Layers, Send, ShieldCheck, Activity, Database, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { InboundView } from "@/components/inbound/InboundView";
import { OutboundView } from "@/components/outbound/OutboundView";

export function ExecutiveSuitePage() {
  const [activeTab, setActiveTab] = useState<"inbound" | "outbound">("inbound");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { signOut } = useAuth();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wider uppercase text-white">JB3AI Executive Suite</h1>
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>GAS Engine Connected</span>
              </div>
            </div>
          </div>

          <nav className="flex space-x-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab("inbound")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "inbound"
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Inbound Leads & AI Briefings</span>
            </button>

            <button
              onClick={() => setActiveTab("outbound")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "outbound"
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>SponcerFlow Outbound</span>
            </button>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors"
              title="Sync Pipeline"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-500" : ""}`} />
            </button>
            <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>MASTER_PIPELINE</span>
            </div>
            <div className="hidden lg:flex items-center space-x-2 text-xs text-neutral-400">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === "inbound" ? <InboundView /> : <OutboundView />}
      </main>
    </div>
  );
}

export default ExecutiveSuitePage;