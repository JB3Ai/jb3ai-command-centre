import React, { useState } from 'react';
import { Campaign, QueueItem, Contact, Thread } from '../../types/outbound';
import { 
  Sliders, 
  Play, 
  Pause, 
  Clock, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ListOrdered 
} from 'lucide-react';

interface CampaignSequencerProps {
  campaign: Campaign;
  threads: Thread[];
  contacts: Contact[];
  queueItems: QueueItem[];
  onToggleCampaignStatus: (newStatus: 'sending' | 'paused') => void;
  onUpdateThrottle: (throttlePerHour: number, delayRange: [number, number]) => void;
  onProcessQueueStep: () => void;
}

export const CampaignSequencer: React.FC<CampaignSequencerProps> = ({
  campaign,
  threads,
  contacts,
  queueItems,
  onToggleCampaignStatus,
  onUpdateThrottle,
  onProcessQueueStep,
}) => {
  const [throttle, setThrottle] = useState<number>(campaign.throttle_per_hour);
  const [minDelay, setMinDelay] = useState<number>(campaign.random_delay_range[0]);
  const [maxDelay, setMaxDelay] = useState<number>(campaign.random_delay_range[1]);

  const queuedThreads = threads.filter((t) => t.status === 'queued' || t.status === 'draft');
  const sentThreadsCount = threads.filter(
    (t) => t.status === 'sent' || t.status === 'delivered' || t.status === 'opened' || t.status === 'waiting' || t.status === 'replied' || t.status === 'meeting-booked'
  ).length;

  const totalContacts = threads.length;
  const progressPct = totalContacts > 0 ? Math.round((sentThreadsCount / totalContacts) * 100) : 0;

  const handleSaveSettings = () => {
    onUpdateThrottle(throttle, [minDelay, maxDelay]);
  };

  const getContact = (contactId: string) => contacts.find((c) => c.id === contactId);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Campaign Header & Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-bold text-lg text-white">{campaign.name}</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                campaign.status === 'sending'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              ● {campaign.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Human-like email sequencer for sponsor@jb3ai.com with rate-limit protection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleCampaignStatus(campaign.status === 'sending' ? 'paused' : 'sending')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
              campaign.status === 'sending'
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {campaign.status === 'sending' ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Sequencer</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Sequencer</span>
              </>
            )}
          </button>

          <button
            onClick={onProcessQueueStep}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Process Next Email</span>
          </button>
        </div>
      </div>

      {/* Progress & Safety Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Bar Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Sequencer Progress</span>
            <span className="text-indigo-400 font-bold">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Sent: {sentThreadsCount}</span>
            <span>Queued: {queuedThreads.length}</span>
            <span>Total: {totalContacts}</span>
          </div>
        </div>

        {/* Deliverability Throttle Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Gmail Rate Limits & Safety</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hourly Cap:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={throttle}
              onChange={(e) => setThrottle(Number(e.target.value))}
              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-right font-mono text-emerald-400 text-xs"
            />
            <span className="text-[10px]">emails/hr</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Random Delay:</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <input
                type="number"
                value={minDelay}
                onChange={(e) => setMinDelay(Number(e.target.value))}
                className="w-12 bg-slate-950 border border-slate-800 rounded px-1 text-center text-slate-200"
              />
              <span>-</span>
              <input
                type="number"
                value={maxDelay}
                onChange={(e) => setMaxDelay(Number(e.target.value))}
                className="w-12 bg-slate-950 border border-slate-800 rounded px-1 text-center text-slate-200"
              />
              <span className="text-[10px]">sec</span>
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            className="w-full py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-all"
          >
            Update Safety Limits
          </button>
        </div>

        {/* Send Window Schedule */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Sending Window (SAST)</span>
          </div>
          <p className="text-slate-400">
            Sends occur during human business hours (08:00–18:00 South African Standard Time) to optimize response rates.
          </p>
          <div className="pt-2 flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Currently inside active window (10:27 SAST)</span>
          </div>
        </div>
      </div>

      {/* Outbox Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Outbox Queue Items</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {queuedThreads.length} items scheduled
          </span>
        </div>

        {queuedThreads.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-xl">
            No emails currently in queue. Import contacts or move drafts to 'Queued'.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Est. Send</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {queuedThreads.map((thread) => {
                  const contact = getContact(thread.contact_id);
                  if (!contact) return null;

                  return (
                    <tr key={thread.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-indigo-300">{contact.name}</td>
                      <td className="py-3 px-3 text-slate-300">{contact.company}</td>
                      <td className="py-3 px-3 text-slate-400">{contact.program}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">P{contact.priority}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {thread.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        +{Math.floor(Math.random() * 5 + 1)}m (Next Queue)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
