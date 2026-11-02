import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { DataRepository } from '../lib/storage';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Incorrect password. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await DataRepository.verifyPassword(password.trim());
      if (isValid) {
        DataRepository.setAppUnlocked(true);
        onUnlock();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch {
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 p-4 antialiased selection:bg-zinc-900 dark:selection:bg-zinc-700 selection:text-white transition-colors duration-200">

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-7 sm:p-8 shadow-xl backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/60 flex items-center justify-center text-white mb-4 shadow-sm">
              <Lock className="w-5 h-5 text-zinc-100" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading">
              SALES TRACKER
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Enter master password to unlock your workspace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="master-password"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider"
              >
                Master Password
              </label>
              <input
                id="master-password"
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                autoFocus
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all font-mono"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !password}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted local session · Persists on this browser</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
