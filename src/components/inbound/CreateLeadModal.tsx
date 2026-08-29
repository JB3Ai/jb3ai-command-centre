import React, { useState } from 'react';
import { Lead, OriginSource, AccessType } from '../../types/inbound';
import { X, Plus, User, Mail, Phone, Globe, ShieldCheck } from 'lucide-react';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLead: (leadData: Partial<Lead>) => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onCreateLead
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<OriginSource>('Website');
  const [accessType, setAccessType] = useState<string>('Investor Access');
  const [popiaConsent, setPopiaConsent] = useState(true);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;

    onCreateLead({
      first_name: firstName,
      last_name: lastName || 'Lead',
      email,
      phone_e164: phone.startsWith('+') ? phone : (phone ? `+${phone}` : '+27700000000'),
      origin_source: source,
      origin_type: 'Form Signup',
      access_type: accessType,
      popia_consent: popiaConsent,
      newsletter_opt_in: newsletterOptIn,
      notes,
      current_status: 'New',
      ai_output: 'Awaiting Agent 2 due diligence research.'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F0F11] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-white/5 bg-[#0A0A0B] flex items-center justify-between">
          <h3 className="font-semibold text-base text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add New Lead to Pipeline</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 font-medium block mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jonathan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 font-medium block mb-1">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Blackburn"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 font-medium block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="jono@jonoblackburn.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 font-medium block mb-1">Phone (E.164 format)</label>
              <input
                type="text"
                placeholder="+27793120688"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 font-medium block mb-1">Origin Channel</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as OriginSource)}
                className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Website">Website</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="VoiceGrid">VoiceGrid</option>
                <option value="Email">Email</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 font-medium block mb-1">Access Mode / Intent</label>
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Investor Access">Investor Access</option>
                <option value="Advisory / Client">Advisory / Client</option>
                <option value="Collaborator">Collaborator</option>
                <option value="Press / Media">Press / Media</option>
                <option value="News SIGN UP">News SIGN UP</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={popiaConsent}
                onChange={(e) => setPopiaConsent(e.target.checked)}
                className="rounded bg-[#161618] border-white/10 text-blue-600 focus:ring-0"
              />
              <span>POPIA Consent Granted</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                className="rounded bg-[#161618] border-white/10 text-blue-600 focus:ring-0"
              />
              <span>Newsletter Opt-in</span>
            </label>
          </div>

          <div>
            <label className="text-gray-400 font-medium block mb-1">Notes / Context</label>
            <textarea
              rows={2}
              placeholder="Context notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-md p-2.5 text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 text-gray-300 rounded-md font-medium hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-500 transition-colors cursor-pointer shadow-sm"
            >
              Add to MASTER_PIPELINE
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
