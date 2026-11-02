import React, { useState } from 'react';
import { DataRepository } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface BackupModalProps {
  onClose: () => void;
  onDataReloaded: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose, onDataReloaded }) => {
  const [jsonText, setJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const json = await DataRepository.exportFullBackupJSON();
      setJsonText(json);
      navigator.clipboard?.writeText(json);
      setStatusMessage('Data exported and copied to clipboard.');
    } catch (err: any) {
      setStatusMessage(`Export failed: ${err.message}`);
    }
  };

  const handleImport = async () => {
    if (!jsonText.trim()) return;
    try {
      const success = await DataRepository.importFullBackupJSON(jsonText);
      if (success) {
        setStatusMessage('Data successfully restored.');
        onDataReloaded();
      } else {
        setStatusMessage('Error: Invalid JSON format.');
      }
    } catch (err: any) {
      setStatusMessage(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 text-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Data Backup &amp; Restore</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 flex items-center justify-center text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Connection state */}
          <div className="border border-zinc-200/80 rounded-xl p-3 bg-zinc-50 font-mono text-xs flex items-center justify-between">
            <span className="text-zinc-500">Database Connection:</span>
            <span className={`px-2.5 py-0.5 border rounded-full font-semibold ${isSupabaseConfigured ? 'bg-green-50 text-green-700 border-green-200' : 'bg-zinc-100 border-zinc-300 text-zinc-700'}`}>
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage'}
            </span>
          </div>

          {/* Backup / Export / Import */}
          <div className="border border-zinc-200/80 rounded-xl p-4 bg-zinc-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-zinc-500">
                JSON Export / Import
              </span>
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-1.5 text-xs bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-mono transition-colors cursor-pointer"
              >
                Export to Clipboard
              </button>
            </div>

            <textarea
              rows={6}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder="Click 'Export' above, or paste backup JSON here and click 'Import' below..."
              className="w-full border border-zinc-300 rounded-lg p-2.5 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            />

            {statusMessage && (
              <div className="text-xs font-mono text-zinc-800 bg-zinc-100 p-2.5 border border-zinc-200 rounded-lg">
                {statusMessage}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleImport}
                className="px-3.5 py-1.5 border border-zinc-300 bg-white hover:bg-zinc-50 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                Import Data From JSON
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
