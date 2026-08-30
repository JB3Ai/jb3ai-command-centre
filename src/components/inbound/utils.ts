import { LeadStatus, OriginSource } from '../../types/inbound';

export function formatStatusBadge(status: LeadStatus | string) {
  switch (status) {
    case 'New':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25';
    case 'In Due Diligence':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25';
    case 'Researched':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25';
    case 'Booking Sent':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25';
    case 'Call Scheduled':
    case 'CALL_SCHEDULED':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

export function getStatusDotColor(status: LeadStatus | string) {
  switch (status) {
    case 'New':
      return 'bg-blue-400 animate-pulse';
    case 'In Due Diligence':
      return 'bg-amber-400';
    case 'Researched':
      return 'bg-purple-400';
    case 'Booking Sent':
      return 'bg-indigo-400';
    case 'Call Scheduled':
    case 'CALL_SCHEDULED':
      return 'bg-emerald-400 animate-pulse';
    default:
      return 'bg-slate-400';
  }
}

export function getSourceIcon(source: OriginSource) {
  switch (source) {
    case 'Website': return '🌐';
    case 'WhatsApp': return '💬';
    case 'Facebook': return '👥';
    case 'Instagram': return '📸';
    case 'LinkedIn': return '💼';
    case 'YouTube': return '▶️';
    case 'Email': return '✉️';
    case 'VoiceGrid': return '🎙️';
    default: return '📍';
  }
}

export function getSourceBadgeColor(source: OriginSource) {
  switch (source) {
    case 'Website': return 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:text-cyan-400';
    case 'WhatsApp': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400';
    case 'Facebook': return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400';
    case 'Instagram': return 'bg-pink-500/10 text-pink-600 border-pink-200 dark:text-pink-400';
    case 'LinkedIn': return 'bg-sky-500/10 text-sky-600 border-sky-200 dark:text-sky-400';
    case 'YouTube': return 'bg-rose-500/10 text-rose-600 border-rose-200 dark:text-rose-400';
    case 'Email': return 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400';
    case 'VoiceGrid': return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
  }
}

export function formatDate(dateString: string) {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateString;
  }
}
