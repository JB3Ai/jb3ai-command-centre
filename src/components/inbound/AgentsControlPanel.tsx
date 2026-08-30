import React, { useState } from 'react';
import { AgentConfig, Lead } from '../../types/inbound';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Play, 
  Settings, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  FileCode, 
  Search, 
  Send 
} from 'lucide-react';

interface AgentsControlPanelProps {
  agents: AgentConfig[];
  leads: Lead[];
  onUpdateAgentPrompt: (agentId: string, prompt: string, enabled: boolean) => void;
  onRunAgentOnLead: (leadId: string, agentId: 'agent_2_due_diligence' | 'agent_3_engagement') => void;
  isLoadingAgent?: boolean;
}

export const AgentsControlPanel: React.FC<AgentsControlPanelProps> = ({
  agents,
  leads,
  onUpdateAgentPrompt,
  onRunAgentOnLead,
  isLoadingAgent = false
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [testOutput, setTestOutput] = useState<string>('');
  const [editingPrompts, setEditingPrompts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    agents.forEach(a => { map[a.agent_id] = a.system_prompt; });
    return map;
  });
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const handleSavePrompt = (agentId: string) => {
    const prompt = editingPrompts[agentId];
    const agent = agents.find(a => a.agent_id === agentId);
    if (agent) {
      onUpdateAgentPrompt(agentId, prompt, agent.enabled);
      setSavedSuccess(agentId);
      setTimeout(() => setSavedSuccess(null), 2500);
    }
  };

  const handleTestRun = async (agentId: 'agent_2_due_diligence' | 'agent_3_engagement') => {
    if (!selectedLeadId) return;
    setTestOutput('⏳ Executing Gemini AI Agent on selected lead...');
    onRunAgentOnLead(selectedLeadId, agentId);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Lead Intake AI Super-Agents</h2>
                <span className="text-[10px] uppercase tracking-widest bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
                Autonomous 4-stage pipeline orchestrating pre-qualification, background research synthesis, automated Gmail Due Diligence email dispatch, and Google Sheet MASTER_PIPELINE sync.
              </p>
            </div>
          </div>

          {/* Test Lab Drawer Button */}
          <div className="bg-[#0A0A0B] p-3 rounded-xl border border-white/5 text-xs space-y-2 shrink-0 min-w-[260px]">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium block">Interactive Test Runner</span>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.signal_id} - {l.first_name} ({l.origin_source})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleTestRun('agent_2_due_diligence')}
                disabled={isLoadingAgent}
                className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                <span>Run Agent 2</span>
              </button>
              <button
                onClick={() => handleTestRun('agent_3_engagement')}
                disabled={isLoadingAgent}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>Run Agent 3</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AUTOMATED GMAIL TRIGGER CONTROL BANNER */}
      <div className="bg-[#0A0A0B] border border-rose-500/30 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Send className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  Automated Gmail Trigger: Internal Due Diligence Operator Report
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>INTERNAL TRIGGER ACTIVE</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically formats and dispatches the internal Executive Due Diligence report directly to the Owner User (<strong className="text-rose-300 font-mono">jono@jonoblackburn.com</strong>) via Gmail API upon Agent 2 research completion. Strictly confidential — for internal review, risk assessment, and decision making (not client facing).
              </p>
            </div>
          </div>

          <button
            onClick={() => handleTestRun('agent_2_due_diligence')}
            disabled={isLoadingAgent}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>🚀 Run Agent 2 & Fire Internal Gmail Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#161618] border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block mb-1">Trigger Condition</span>
            <span className="text-gray-200 font-medium">Agent 2 Due Diligence Completion (`/api/agents/run`)</span>
          </div>
          <div className="bg-[#161618] border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block mb-1">Target Recipient</span>
            <span className="text-rose-300 font-mono font-medium">Owner User (`jono@jonoblackburn.com`) — Internal Use Only</span>
          </div>
          <div className="bg-[#161618] border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block mb-1">Action & Pipeline Log</span>
            <span className="text-emerald-300 font-medium">Dispatches Gmail API Email + Syncs MASTER_PIPELINE Sheet</span>
          </div>
        </div>
      </div>

      {/* Grid of 4 Super-Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agents.map(agent => {
          const isSaved = savedSuccess === agent.agent_id;

          return (
            <div
              key={agent.agent_id}
              className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-purple-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{agent.name}</h3>
                      <span className="text-[11px] font-normal text-gray-400">{agent.role}</span>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase tracking-widest font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  {agent.description}
                </p>

                {/* System Prompt Code Box */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest block">
                    System Instruction Prompt:
                  </label>
                  <textarea
                    rows={4}
                    value={editingPrompts[agent.agent_id] || ''}
                    onChange={(e) => setEditingPrompts({ ...editingPrompts, [agent.agent_id]: e.target.value })}
                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl p-3 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Save Row */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Settings className="w-3 h-3" /> Auto-trigger on inbound payload
                </span>

                <button
                  onClick={() => handleSavePrompt(agent.agent_id)}
                  className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Saved!</span>
                    </>
                  ) : (
                    <span>Save Prompt</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
