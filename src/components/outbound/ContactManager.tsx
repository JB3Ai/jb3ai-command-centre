import React, { useState } from 'react';
import { Contact, Tag, Priority } from '../../types/outbound';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Tag as TagIcon, 
  ExternalLink, 
  Building, 
  Mail, 
  Globe 
} from 'lucide-react';

interface ContactManagerProps {
  contacts: Contact[];
  onOpenImportModal: () => void;
  onDeleteContact: (contactId: string) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({
  contacts,
  onOpenImportModal,
  onDeleteContact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const filteredContacts = contacts.filter((c) => {
    if (tagFilter !== 'all' && !c.tags.includes(tagFilter as Tag)) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.company.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.program.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter contacts by name, company, program, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <TagIcon className="w-3.5 h-3.5" />
            <span>Category:</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Tags</option>
              <option value="corporate">Corporate</option>
              <option value="fiscal-host">Fiscal Host</option>
              <option value="employee-nominator">Employee Nominator</option>
              <option value="local-sa">Local SA</option>
              <option value="foundation">Foundation</option>
            </select>
          </div>
        </div>

        <button
          onClick={onOpenImportModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Import / Add Contact</span>
        </button>
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Contact Database</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredContacts.length} Contacts listed
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <th className="py-2.5 px-3">Name & Email</th>
              <th className="py-2.5 px-3">Company</th>
              <th className="py-2.5 px-3">Program</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Tags</th>
              <th className="py-2.5 px-3">Custom Variables</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-950/60 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-bold text-indigo-300">{contact.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{contact.email}</div>
                </td>
                <td className="py-3 px-3 font-semibold text-slate-200">{contact.company}</td>
                <td className="py-3 px-3 text-slate-300">{contact.program}</td>
                <td className="py-3 px-3 font-mono font-bold text-amber-400">P{contact.priority}</td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-[10px] font-mono text-slate-400">
                  {Object.entries(contact.custom_vars)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(', ')}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-all"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
