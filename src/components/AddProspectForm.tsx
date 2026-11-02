import React, { useState } from 'react';
import { Prospect, ProspectStatus } from '../types/index';

interface AddProspectFormProps {
  onSave: (prospect: Omit<Prospect, 'id' | 'created_at'>) => void;
  onCancel: () => void;
  initialData?: Partial<Prospect>;
}

export const AddProspectForm: React.FC<AddProspectFormProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  const [businessName, setBusinessName] = useState(initialData?.business_name || '');
  const [contactName, setContactName] = useState(initialData?.contact_name || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [status, setStatus] = useState<ProspectStatus>(initialData?.status || 'not_contacted');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    onSave({
      business_name: businessName.trim(),
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      status,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 text-zinc-900 dark:text-zinc-100 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {initialData?.business_name ? 'Edit Prospect' : 'Add New Prospect'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold mb-1 text-xs text-zinc-700 dark:text-zinc-300">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Uptown Chiropractic"
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-xs text-zinc-700 dark:text-zinc-300">Contact Person</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Dr. Gary White"
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-xs text-zinc-700 dark:text-zinc-300">Phone Number</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="e.g. (555) 765-4321"
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-xs text-zinc-700 dark:text-zinc-300">Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="e.g. contact@uptownchiro.com"
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-xs text-zinc-700 dark:text-zinc-300">Outreach Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProspectStatus)}
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              >
                <option value="not_contacted">not_contacted</option>
                <option value="contacted">contacted</option>
                <option value="follow_up">follow_up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-xs text-zinc-700 dark:text-zinc-300">Notes &amp; Pitch Context</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Pitch NFC review cards first then website revamp..."
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
            >
              {initialData?.business_name ? 'Update Prospect' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
