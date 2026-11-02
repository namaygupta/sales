import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Plus, UserPlus, PhoneCall, ArrowUpRight, TrendingUp, Globe, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../lib/calculations';

interface NamayWelcomeBannerProps {
  totalRevenue: number;
  clientsCount: number;
  prospectsCount: number;
  openTasksCount: number;
  websiteCount: number;
  accessoryCount: number;
  onOpenAddClient: () => void;
  onOpenAddProspect: () => void;
  onOpenAiAssistant: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const NamayWelcomeBanner: React.FC<NamayWelcomeBannerProps> = ({
  totalRevenue,
  clientsCount,
  prospectsCount,
  openTasksCount,
  websiteCount,
  accessoryCount,
  onOpenAddClient,
  onOpenAddProspect,
  onOpenAiAssistant,
  onNavigateToTab,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Greeting & Friendly Tone */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-600 dark:text-sky-400 font-mono">
              Founder Dashboard
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading">
            {getGreeting()}, Namay 👋
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Welcome back to your workspace. Here is a pulse on your custom website builds and Google NFC review cards today.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 flex items-center gap-3 sm:gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Revenue:</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Websites:</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {websiteCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60">
              <CreditCard className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-zinc-500 dark:text-zinc-400">NFC Cards:</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {accessoryCount}
              </span>
            </div>

            {openTasksCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateToTab('tasks')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold">{openTasksCount} follow-ups pending</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-row lg:flex-col items-stretch gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onOpenAddClient}
              className="flex-1 lg:flex-initial px-3.5 py-2 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onOpenAddProspect}
              className="flex-1 lg:flex-initial px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Pitch Lead</span>
            </motion.button>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAiAssistant}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>AI Assistant</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
