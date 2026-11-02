import React from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Sparkles,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';

export type AppSection = 'general' | 'admin';
export type GeneralSubTab =
  | 'dashboard'
  | 'clients'
  | 'prospects'
  | 'tasks'
  | 'scripts'
  | 'team'
  | 'notes';

interface NavbarProps {
  section: AppSection;
  onSectionChange: (sec: AppSection) => void;
  generalTab: GeneralSubTab;
  onGeneralTabChange: (tab: GeneralSubTab) => void;
  clientsCount: number;
  prospectsCount: number;
  openTasksCount: number;
  onOpenSearch: () => void;
  onOpenAiAssistant: () => void;
  selectedClientId: string | null;
  onClearSelectedClient: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  section,
  onSectionChange,
  generalTab,
  onGeneralTabChange,
  clientsCount,
  prospectsCount,
  openTasksCount,
  onOpenSearch,
  onOpenAiAssistant,
  selectedClientId,
  onClearSelectedClient,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
      {/* Top Bar: Navigation & Action Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Section Switcher (General vs Admin) */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                onClearSelectedClient();
                onSectionChange('general');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                section === 'general'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => {
                onClearSelectedClient();
                onSectionChange('admin');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                section === 'admin'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Right: Theme Toggle, Search, and AI Assistant */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onToggleDarkMode}
            className="p-1.5 sm:p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer border border-zinc-200/60 dark:border-zinc-800"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </motion.button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Search clients, leads, orders..."
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search...</span>
          </button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 dark:text-sky-600" />
            <span>Ask AI</span>
          </motion.button>
        </div>
      </div>

      {/* Secondary Bar: General Navigation Tabs with smooth indicator */}
      {section === 'general' && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/60 transition-colors">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x">
            {[
              { id: 'dashboard' as GeneralSubTab, label: 'Dashboard' },
              { id: 'clients' as GeneralSubTab, label: `Clients (${clientsCount})` },
              { id: 'prospects' as GeneralSubTab, label: `Prospects (${prospectsCount})` },
              {
                id: 'tasks' as GeneralSubTab,
                label: openTasksCount > 0 ? `Tasks (${openTasksCount})` : 'Tasks',
              },
              { id: 'scripts' as GeneralSubTab, label: 'Sales Scripts' },
              { id: 'team' as GeneralSubTab, label: 'Team' },
              { id: 'notes' as GeneralSubTab, label: 'Notes & AI Memory' },
            ].map(tab => {
              const isActive = generalTab === tab.id && !selectedClientId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onClearSelectedClient();
                    onGeneralTabChange(tab.id);
                  }}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
