import React, { useState } from 'react';
import { OriginSource } from '../../types/inbound';
import { 
  Send, 
  Globe, 
  MessageSquare, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Code2, 
  Play 
} from 'lucide-react';

interface WebhookSimulatorProps {
  onTriggerWebhook: (endpoint: string, payload: any) => Promise<void>;
  isLoading?: boolean;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({
  onTriggerWebhook,
  isLoading = false
}) => {
  const [selectedSource, setSelectedSource] = useState<OriginSource>('Website');
  const [successResponse, setSuccessResponse] = useState<any>(null);

  // Form states for custom simulator
  const [formData, setFormData] = useState({
    name: 'Jonathan Blackburn',
    email: 'jono@jonoblackburn.com',
    phone: '+27793120688',
    mode: 'Investor Access',
    optIn: true,
    message: 'Requesting instant entry to private due diligence portal & advisory session.',
    ip: '105.245.108.186'
  });

  const getPresetPayload = () => {
    switch (selectedSource) {
      case 'Website':
        return {
          endpoint: '/api/webhooks/website',
          payload: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            mode: formData.mode,
            newsletter_opt_in: formData.optIn,
            notes: formData.message,
            ip: formData.ip
          }
        };

      case 'WhatsApp':
        return {
          endpoint: '/api/webhooks/meta',
          payload: {
            name: 'Sarah Jenkins',
            phone: '+27829910022',
            email: 'sarah.j@apexcapital.co',
            message: 'Hi Jonathan, interested in seeing demo of AI lead intake engine for our sales team.',
            ip: '41.160.22.91'
          }
        };

      case 'VoiceGrid':
        return {
          endpoint: '/api/webhooks/voicegrid',
          payload: {
            caller_name: 'David Khumalo',
            phone_e164: '+27834451122',
            email: 'd.khumalo@voicegrid-tech.com',
            duration: '3m 42s',
            summary: 'Caller wants to streamline 500+ monthly leads from Meta ads straight into Google Sheets with AI pre-qualification.'
          }
        };

      case 'Email':
        return {
          endpoint: '/api/webhooks/email',
          payload: {
            sender_name: 'Michael Vanderbilt',
            sender: 'mv@vanderbilt-media.io',
            subject: 'Interview Request: AI Lead Automation Sheet Engine',
            body: 'Hi team, loved the VoiceGrid and Base44 intake flow demo. Would love to feature Jonathan on our podcast next week.'
          }
        };

      case 'YouTube':
        return {
          endpoint: '/api/webhooks/website',
          payload: {
            name: 'Elena Rostova',
            email: 'elena@novatech-growth.com',
            origin_type: 'Comment',
            mode: 'Collaborator',
            notes: 'Comment on YouTube video: "Where can I get the Apps Script snippet for MASTER_PIPELINE sync? Awesome setup!"'
          }
        };

      default:
        return { endpoint: '/api/webhooks/website', payload: formData };
    }
  };

  const preset = getPresetPayload();

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessResponse(null);
    try {
      await onTriggerWebhook(preset.endpoint, preset.payload);
      setSuccessResponse({
        status: 'SUCCESS',
        signal_id: `JB3-SIG-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
        endpoint: preset.endpoint,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Multi-Source Inbound Webhook Simulator</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Fire test lead payloads directly into your backend endpoints to verify Agent 1 verification, Agent 2 due diligence, and Google Sheet sync!
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded font-medium">
            5 Channels Supported
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Source Selector & Custom Inputs */}
        <div className="lg:col-span-6 bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-4">
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest block">
            Select Channel Source:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { id: 'Website', label: 'Website Form', icon: '🌐' },
              { id: 'WhatsApp', label: 'Meta WhatsApp', icon: '💬' },
              { id: 'VoiceGrid', label: 'VoiceGrid Call', icon: '🎙️' },
              { id: 'Email', label: 'Direct Email', icon: '✉️' },
              { id: 'YouTube', label: 'YouTube Comment', icon: '▶️' },
            ].map(source => (
              <button
                key={source.id}
                type="button"
                onClick={() => setSelectedSource(source.id as OriginSource)}
                className={`p-3 rounded-lg border text-left font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                  selectedSource === source.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-[#0A0A0B] border-white/10 text-gray-300 hover:border-white/20'
                }`}
              >
                <span className="text-base">{source.icon}</span>
                <span className="truncate">{source.label}</span>
              </button>
            ))}
          </div>

          {/* Form customization if Website */}
          {selectedSource === 'Website' && (
            <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 block mb-1 text-[11px]">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#161618] border border-white/10 rounded-md p-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-1 text-[11px]">Email</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#161618] border border-white/10 rounded-md p-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 block mb-1 text-[11px]">Phone (E.164)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#161618] border border-white/10 rounded-md p-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-1 text-[11px]">Access Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-[#161618] border border-white/10 rounded-md p-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Investor Access">Investor Access</option>
                    <option value="Advisory / Client">Advisory / Client</option>
                    <option value="Collaborator">Collaborator</option>
                    <option value="Press / Media">Press / Media</option>
                    <option value="News SIGN UP">News SIGN UP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-500 block mb-1 text-[11px]">Notes / Inbound Text</label>
                <textarea
                  rows={2}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#161618] border border-white/10 rounded-md p-2 text-gray-200 resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleRunSimulation}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isLoading ? 'Processing Payload...' : `Trigger ${selectedSource} Webhook`}</span>
          </button>
        </div>

        {/* Right: Live Payload Code Preview & Output Response */}
        <div className="lg:col-span-6 bg-[#0F0F11] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Outgoing Webhook JSON Body
              </span>
              <span className="font-mono text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                POST {preset.endpoint}
              </span>
            </div>

            <pre className="bg-[#0A0A0B] border border-white/10 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[300px]">
              {JSON.stringify(preset.payload, null, 2)}
            </pre>
          </div>

          {/* Success Response Alert */}
          {successResponse && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Webhook Landed Successfully!</span>
              </div>
              <p className="text-xs text-emerald-300 font-mono">
                Assigned Signal_ID: <strong className="text-white">{successResponse.signal_id}</strong>
              </p>
              <p className="text-[11px] text-emerald-400/80">
                Pushed to MASTER_PIPELINE tab & Agent 1 pre-qualification completed. Check Master Pipeline table!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
