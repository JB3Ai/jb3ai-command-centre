import React, { useState } from 'react';
import { Lead, LeadStatus, OriginSource } from '../../types/inbound';
import { GoogleCalendarEvent } from './lib/googleCalendar';
import { auditBidirectionalSync, SyncDiscrepancy } from './lib/syncAudit';
import { 
  Search, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Plus,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  X,
  AlertTriangle,
  ShieldAlert,
  Wrench
} from 'lucide-react';
import { formatStatusBadge, getStatusDotColor, getSourceBadgeColor, getSourceIcon, formatDate } from './utils';

interface PipelineTableProps {
  leads: Lead[];
  calendarEvents?: GoogleCalendarEvent[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onRunAgent2: (leadId: string) => void;
  onOpenMessages: (leadId: string) => void;
  onSelectLeadDetail: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenCreateModal: () => void;
  onResolveDiscrepancy?: (discrepancy: SyncDiscrepancy, action: 'UPDATE_STATUS' | 'RESET_STATUS' | 'SYNC_TIME') => void;
  loadingAgentLeadId?: string | null;
}

export const PipelineTable: React.FC<PipelineTableProps> = ({
  leads,
  calendarEvents = [],
  onStatusChange,
  onRunAgent2,
  onOpenMessages,
  onSelectLeadDetail,
  onDeleteLead,
  onOpenCreateModal,
  onResolveDiscrepancy,
  loadingAgentLeadId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [accessFilter, setAccessFilter] = useState<string>('ALL');
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Run live bidirectional sync audit against calendar events
  const syncDiscrepancies = auditBidirectionalSync(leads, calendarEvents);

  // Enhanced Search Filter logic
  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      const matchesStatus = statusFilter === 'ALL' || lead.current_status === statusFilter;
      const matchesAccess = accessFilter === 'ALL' || lead.access_type.toLowerCase().includes(accessFilter.toLowerCase());
      return matchesStatus && matchesAccess;
    }

    // 1. Name match (First name, Last name, Full name)
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    const nameMatch = lead.first_name.toLowerCase().includes(term) || 
                      lead.last_name.toLowerCase().includes(term) || 
                      fullName.includes(term);

    // 2. Company / Domain / Organization match (extracted from email or notes/AI output)
    const emailDomain = lead.email.includes('@') ? lead.email.split('@')[1].toLowerCase() : '';
    const companyFromDomain = emailDomain.replace(/\.(com|co|io|org|net|tech|za|uk|us|gov)$/i, '').replace(/[-_]/g, ' ');
    const companyMatch = companyFromDomain.includes(term) ||
                         emailDomain.includes(term) ||
                         lead.ai_output.toLowerCase().includes(term) ||
                         lead.notes.toLowerCase().includes(term);

    // 3. Source match (Origin Source, Origin Type, Access Type, Signal ID)
    const sourceMatch = lead.origin_source.toLowerCase().includes(term) ||
                        lead.origin_type.toLowerCase().includes(term) ||
                        lead.access_type.toLowerCase().includes(term) ||
                        lead.signal_id.toLowerCase().includes(term) ||
                        lead.email.toLowerCase().includes(term) ||
                        lead.phone_e164.toLowerCase().includes(term) ||
                        (lead.area_node && lead.area_node.toLowerCase().includes(term));

    const matchesSearch = nameMatch || companyMatch || sourceMatch;
    const matchesStatus = statusFilter === 'ALL' || lead.current_status === statusFilter;
    const matchesAccess = accessFilter === 'ALL' || lead.access_type.toLowerCase().includes(accessFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesAccess;
  });

  const statuses: LeadStatus[] = [
    'New',
    'In Due Diligence',
    'Researched',
    'Booking Sent',
    'Call Scheduled'
  ];

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'Signal ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Origin Source',
      'Origin Type',
      'Access Type',
      'Current Status',
      'POPIA Consent',
      'Newsletter Opt-in',
      'IP Address',
      'Area Node',
      'Notes',
      'AI Research Output',
      'Created At'
    ];

    const escapeCSV = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredLeads.map(lead => [
      escapeCSV(lead.signal_id),
      escapeCSV(lead.first_name),
      escapeCSV(lead.last_name),
      escapeCSV(lead.email),
      escapeCSV(lead.phone_e164),
      escapeCSV(lead.origin_source),
      escapeCSV(lead.origin_type),
      escapeCSV(lead.access_type),
      escapeCSV(lead.current_status),
      escapeCSV(lead.popia_consent ? 'Yes' : 'No'),
      escapeCSV(lead.newsletter_opt_in ? 'Yes' : 'No'),
      escapeCSV(lead.ip_address),
      escapeCSV(lead.area_node),
      escapeCSV(lead.notes),
      escapeCSV(lead.ai_output),
      escapeCSV(lead.created_at)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `MASTER_PIPELINE_Leads_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0F0F11] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Table Toolbar / Filters Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-[#0A0A0B] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>MASTER_PIPELINE Matrix</span>
            </h2>
            <span className="text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
              CRM Sync Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Single source of truth capturing all inbound leads across website forms, WhatsApp, VoiceGrid, and email parser.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-md pl-9 pr-8 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161618] border border-white/10 rounded-md px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Access Filter Dropdown */}
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            className="bg-[#161618] border border-white/10 rounded-md px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Access Modes</option>
            <option value="investor">Investor Access</option>
            <option value="advisory">Advisory / Client</option>
            <option value="press">Press / Media</option>
            <option value="collaborator">Collaborator</option>
            <option value="news">News Newsletter</option>
          </select>

          {/* Bidirectional Calendar Sync Audit Button */}
          <button
            onClick={() => setShowAuditModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              syncDiscrepancies.length > 0
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300 animate-pulse'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
            }`}
            title="Run bidirectional sync check between Google Calendar & Lead Pipeline"
          >
            {syncDiscrepancies.length > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Calendar Sync ({syncDiscrepancies.length} Issue{syncDiscrepancies.length === 1 ? '' : 's'})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Calendar Synced</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Export current lead list to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV ({filteredLeads.length})</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0A0A0B] border-b border-white/5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              <th className="py-3 px-4">Signal ID</th>
              <th className="py-3 px-4">Origin & Type</th>
              <th className="py-3 px-4">Lead Name</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Access Mode</th>
              <th className="py-3 px-4">POPIA</th>
              <th className="py-3 px-4">Pipeline Status</th>
              <th className="py-3 px-4 min-w-[280px]">AI Research Notes (Agent 2)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-xs">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  <p className="font-medium">No leads match your search criteria.</p>
                  <p className="text-xs text-gray-600 mt-1">Try clearing your filters or testing a new webhook intake payload.</p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isLoadingAgent = loadingAgentLeadId === lead.id;

                return (
                  <tr 
                    key={lead.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Signal ID & Sync Check */}
                    <td className="py-3 px-4 font-mono font-medium text-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-400">{lead.signal_id}</span>
                        <span title="Synced to MASTER_PIPELINE tab">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-sans font-normal mt-0.5">
                        {formatDate(lead.created_at)}
                      </div>
                    </td>

                    {/* Origin Source Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${getSourceBadgeColor(lead.origin_source)}`}>
                          <span>{getSourceIcon(lead.origin_source)}</span>
                          <span>{lead.origin_source}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 pl-0.5">
                          {lead.origin_type}
                        </span>
                      </div>
                    </td>

                    {/* Lead Name */}
                    <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                      <div>{lead.first_name} {lead.last_name}</div>
                      <div className="text-[10px] font-normal text-gray-500">{lead.area_node || 'Global'}</div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-gray-300 font-medium">{lead.email}</div>
                      <div className="text-gray-500 font-mono text-[11px]">{lead.phone_e164 || 'N/A'}</div>
                    </td>

                    {/* Access Mode */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300 text-[11px] font-medium">
                        {lead.access_type}
                      </span>
                    </td>

                    {/* POPIA Consent */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {lead.popia_consent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">No</span>
                      )}
                    </td>

                    {/* Interactive Pipeline Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {(() => {
                        const leadDisc = syncDiscrepancies.find(d => d.leadId === lead.id);
                        return (
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(lead.current_status)}`} />
                            <select
                              value={lead.current_status}
                              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                              className={`border rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm ${formatStatusBadge(lead.current_status)}`}
                            >
                              {statuses.map(s => (
                                <option key={s} value={s} className="bg-[#161618] text-gray-200">
                                  {s}
                                </option>
                              ))}
                            </select>

                            {leadDisc && (
                              <button
                                onClick={() => setShowAuditModal(true)}
                                title={`Calendar Sync Discrepancy: ${leadDisc.title} (${leadDisc.description}). Click to open Audit.`}
                                className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shrink-0"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* AI Due Diligence Output */}
                    <td className="py-3 px-4">
                      <div className="text-gray-300 text-xs leading-relaxed max-w-md line-clamp-2 font-mono whitespace-pre-line bg-[#0A0A0B] p-2 rounded border border-white/5">
                        {lead.ai_output || "No AI research output yet."}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Run Agent 2 Gemini Research */}
                        <button
                          onClick={() => onRunAgent2(lead.id)}
                          disabled={isLoadingAgent}
                          title="Run Agent 2 AI Due Diligence Research using Gemini"
                          className="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isLoadingAgent ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                          )}
                        </button>

                        {/* Open Messages / Reply Monitor */}
                        <button
                          onClick={() => onOpenMessages(lead.id)}
                          title="Open Messages & Reply Monitor"
                          className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-300" />
                        </button>

                        {/* View Lead Detail */}
                        <button
                          onClick={() => onSelectLeadDetail(lead)}
                          title="View Full Lead Details & Webhook Payload"
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Lead */}
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          title="Delete Lead Record"
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Stats */}
      <div className="p-3 bg-[#0A0A0B] border-t border-white/5 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Showing <strong className="text-gray-200">{filteredLeads.length}</strong> of <strong className="text-gray-200">{leads.length}</strong> leads in MASTER_PIPELINE
        </span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> CRM Sync active
        </span>
      </div>

      {/* BIDIRECTIONAL SYNC AUDIT MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F11] border border-amber-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 bg-[#0A0A0B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  syncDiscrepancies.length > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white flex items-center gap-2">
                    Google Calendar & Pipeline Sync Audit
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Bidirectional cross-verification between active Google Calendar events and PipelineTable statuses
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-[#161618] border border-white/5 rounded-xl p-3.5 text-xs text-gray-300 space-y-1">
                <span className="font-semibold text-white block">Audit Engine Rules:</span>
                <p>• <strong>Missing Event:</strong> Lead is marked as "Call Scheduled" in pipeline, but event was deleted from Google Calendar.</p>
                <p>• <strong>Unsynced Status:</strong> Google Calendar event exists for lead, but lead status is not marked as "Call Scheduled".</p>
                <p>• <strong>Timestamp Mismatch:</strong> Pipeline call date/time differs from the Google Calendar event schedule.</p>
              </div>

              {syncDiscrepancies.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Active Discrepancies ({syncDiscrepancies.length})</span>
                  </h4>

                  {syncDiscrepancies.map(disc => (
                    <div
                      key={disc.id}
                      className="bg-[#0A0A0B] border border-white/10 rounded-xl p-4 space-y-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                            disc.type === 'MISSING_EVENT'
                              ? 'bg-red-500/15 text-red-300 border-red-500/30'
                              : disc.type === 'UNSYNCED_LEAD_STATUS'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}>
                            {disc.title}
                          </span>
                          <span className="font-semibold text-white text-sm">{disc.leadName}</span>
                        </div>
                        <span className="text-gray-400 font-mono text-[11px]">{disc.leadEmail}</span>
                      </div>

                      <p className="text-gray-300 leading-relaxed">{disc.description}</p>
                      <p className="text-gray-500 text-[11px] italic">Action: {disc.recommendation}</p>

                      <div className="pt-1 flex justify-end">
                        {disc.type === 'UNSYNCED_LEAD_STATUS' && (
                          <button
                            onClick={() => {
                              if (onResolveDiscrepancy) {
                                onResolveDiscrepancy(disc, 'UPDATE_STATUS');
                              } else {
                                onStatusChange(disc.leadId, 'Call Scheduled');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Update Status to "Call Scheduled"</span>
                          </button>
                        )}

                        {disc.type === 'MISSING_EVENT' && (
                          <button
                            onClick={() => {
                              if (onResolveDiscrepancy) {
                                onResolveDiscrepancy(disc, 'RESET_STATUS');
                              } else {
                                onStatusChange(disc.leadId, 'Researched');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Reset Status to "Researched"</span>
                          </button>
                        )}

                        {disc.type === 'DATETIME_MISMATCH' && (
                          <button
                            onClick={() => {
                              if (onResolveDiscrepancy) {
                                onResolveDiscrepancy(disc, 'SYNC_TIME');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Sync Timestamp to Event</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">Pipeline and Google Calendar are 100% Synced!</p>
                  <p className="text-xs text-gray-400">All scheduled leads match active calendar events, with no orphaned records or timestamp discrepancies.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0A0A0B] flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Audit Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
