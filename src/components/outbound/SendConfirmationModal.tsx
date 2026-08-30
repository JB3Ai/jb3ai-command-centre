import React from 'react';
import { Mail, AlertTriangle, Send, CheckCircle2, X } from 'lucide-react';

interface SendConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  recipientEmail: string;
  subject: string;
  bodySnippet: string;
}

export const SendConfirmationModal: React.FC<SendConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  recipientEmail,
  subject,
  bodySnippet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400">
            <Mail className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3 text-xs">
          <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-xl space-y-1">
            <div className="text-slate-400 font-medium">Sending Account:</div>
            <div className="font-mono font-bold text-emerald-400">sponsor@jb3ai.com</div>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 font-medium">To Recipient:</div>
            <div className="font-bold text-slate-200 font-mono">{recipientEmail}</div>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 font-medium">Subject Line:</div>
            <div className="font-bold text-indigo-300">{subject}</div>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 font-medium">Body Snippet:</div>
            <p className="text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800 max-h-28 overflow-y-auto font-sans line-clamp-3">
              "{bodySnippet}"
            </p>
          </div>

          <p className="text-[11px] text-slate-400 border-l-2 border-amber-500 pl-2">
            This will dispatch a real email from your Google Workspace sponsor@jb3ai.com account using the official Gmail API.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Confirm & Send via Gmail</span>
          </button>
        </div>
      </div>
    </div>
  );
};
