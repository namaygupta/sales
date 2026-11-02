import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Users, UserPlus, Briefcase, FileText, StickyNote, ArrowRight } from 'lucide-react';
import { Client, Prospect, Employee, SalesScript, NoteItem } from '../../types/index';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  prospects: Prospect[];
  employees: Employee[];
  scripts: SalesScript[];
  notes: NoteItem[];
  onSelectClient: (clientId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  clients,
  prospects,
  employees,
  scripts,
  notes,
  onSelectClient,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return null;

    const matchedClients = clients.filter(
      c =>
        c.business_name.toLowerCase().includes(q) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(q)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(q)) ||
        (c.contact_phone && c.contact_phone.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );

    const matchedProspects = prospects.filter(
      p =>
        p.business_name.toLowerCase().includes(q) ||
        (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
        (p.contact_email && p.contact_email.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );

    const matchedEmployees = employees.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.contact_email && e.contact_email.toLowerCase().includes(q))
    );

    const matchedScripts = scripts.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    );

    const matchedNotes = notes.filter(
      n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
    );

    const totalCount =
      matchedClients.length +
      matchedProspects.length +
      matchedEmployees.length +
      matchedScripts.length +
      matchedNotes.length;

    return {
      clients: matchedClients,
      prospects: matchedProspects,
      employees: matchedEmployees,
      scripts: matchedScripts,
      notes: matchedNotes,
      totalCount,
    };
  }, [searchTerm, clients, prospects, employees, scripts, notes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search clients, prospects, team, scripts & notes..."
            className="w-full text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
          {!results ? (
            <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
              Type keywords to search across Namay&apos;s records.
            </div>
          ) : results.totalCount === 0 ? (
            <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
              No results found for &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <>
              {/* Clients Results */}
              {results.clients.length > 0 && (
                <div className="py-2">
                  <span className="px-2 text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Clients ({results.clients.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.clients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectClient(c.id);
                          onClose();
                        }}
                        className="w-full p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{c.business_name}</span>
                          {c.contact_name && (
                            <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">({c.contact_name})</span>
                          )}
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prospects Results */}
              {results.prospects.length > 0 && (
                <div className="py-2">
                  <span className="px-2 text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Prospects ({results.prospects.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.prospects.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('prospects');
                          onClose();
                        }}
                        className="w-full p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.business_name}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">[{p.status}]</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees Results */}
              {results.employees.length > 0 && (
                <div className="py-2">
                  <span className="px-2 text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Team ({results.employees.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.employees.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('team');
                          onClose();
                        }}
                        className="w-full p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{e.name}</span>
                          {e.role && <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">({e.role})</span>}
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scripts Results */}
              {results.scripts.length > 0 && (
                <div className="py-2">
                  <span className="px-2 text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Sales Scripts ({results.scripts.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.scripts.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('scripts');
                          onClose();
                        }}
                        className="w-full p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[11px] truncate max-w-xs">
                            {s.content.slice(0, 45)}...
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Results */}
              {results.notes.length > 0 && (
                <div className="py-2">
                  <span className="px-2 text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Notes ({results.notes.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.notes.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('notes');
                          onClose();
                        }}
                        className="w-full p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <StickyNote className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{n.title || 'Note'}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[11px] truncate max-w-xs">
                            {n.content.slice(0, 45)}...
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
