import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Copy, Check, Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { SalesScript, ScriptEffectiveness, Category } from '../../types/index';

interface ScriptsTrackerProps {
  scripts: SalesScript[];
  categories: Category[];
  onCreateScript: (script: Omit<SalesScript, 'id' | 'updated_at'>) => Promise<void>;
  onUpdateScript: (script: SalesScript) => Promise<void>;
  onDeleteScript: (id: string) => Promise<void>;
}

export const ScriptsTracker: React.FC<ScriptsTrackerProps> = ({
  scripts,
  categories,
  onCreateScript,
  onUpdateScript,
  onDeleteScript,
}) => {
  const [filterEffectiveness, setFilterEffectiveness] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<SalesScript | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [effectiveness, setEffectiveness] = useState<ScriptEffectiveness>('testing');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingScript(null);
    setTitle('');
    setContent('');
    setCategoryId('');
    setEffectiveness('testing');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (script: SalesScript) => {
    setEditingScript(script);
    setTitle(script.title);
    setContent(script.content);
    setCategoryId(script.category_id || '');
    setEffectiveness(script.effectiveness);
    setNotes(script.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingScript) {
      await onUpdateScript({
        ...editingScript,
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId || null,
        effectiveness,
        notes: notes.trim() || null,
      });
    } else {
      await onCreateScript({
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId || null,
        effectiveness,
        notes: notes.trim() || null,
      });
    }

    setShowModal(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredScripts = scripts.filter(s => {
    if (filterEffectiveness !== 'all' && s.effectiveness !== filterEffectiveness) return false;
    if (filterCategory !== 'all' && s.category_id !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getEffectivenessBadge = (eff: ScriptEffectiveness) => {
    switch (eff) {
      case 'working':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
            Working Well
          </span>
        );
      case 'not_working':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800">
            Needs Revision
          </span>
        );
      case 'testing':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
            Testing
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-heading">
            Sales Scripts &amp; Cold Pitch Library
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tested objection handlers, walk-in pitches, and follow-up templates for websites &amp; NFC stands.
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Script</span>
        </motion.button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterEffectiveness('all')}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterEffectiveness === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            All ({scripts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEffectiveness('working')}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterEffectiveness === 'working'
                ? 'bg-emerald-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-emerald-900 dark:border-emerald-500'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Working
          </button>
          <button
            type="button"
            onClick={() => setFilterEffectiveness('testing')}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterEffectiveness === 'testing'
                ? 'bg-amber-900 dark:bg-amber-500 text-white dark:text-zinc-950 border-amber-900 dark:border-amber-500'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Testing
          </button>
          <button
            type="button"
            onClick={() => setFilterEffectiveness('not_working')}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterEffectiveness === 'not_working'
                ? 'bg-red-900 dark:bg-red-500 text-white dark:text-zinc-950 border-red-900 dark:border-red-500'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Needs Revision
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter scripts..."
          className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 sm:w-56 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
        />
      </div>

      {/* Scripts Grid */}
      {filteredScripts.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">No sales scripts found.</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-3 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Add First Script
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScripts.map(script => {
            const cat = categories.find(c => c.id === script.category_id);
            const isCopied = copiedId === script.id;

            return (
              <div
                key={script.id}
                className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                        {script.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {getEffectivenessBadge(script.effectiveness)}
                        {cat && (
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            {cat.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(script.id, script.content)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        }`}
                        title="Copy Script to Clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(script)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete script "${script.title}"?`)) {
                            onDeleteScript(script.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-750 rounded-xl my-3 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-zinc-200 dark:selection:bg-zinc-700">
                    &quot;{script.content}&quot;
                  </div>

                  {script.notes && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic mt-1">
                      Context: {script.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Script Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                {editingScript ? 'Edit Sales Script' : 'Add New Sales Script'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Script Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. In-Person NFC Stand Demo Pitch"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Script / Pitch Text *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="What you say to the business owner verbatim..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Product / Category Link
                  </label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">General Pitch</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Effectiveness Tag
                  </label>
                  <select
                    value={effectiveness}
                    onChange={e => setEffectiveness(e.target.value as ScriptEffectiveness)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="working">Working Well</option>
                    <option value="testing">Testing</option>
                    <option value="not_working">Needs Revision</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes / Best Used For
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Best when speaking directly with restaurant manager during slow hours"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingScript ? 'Save Script' : 'Create Script'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
