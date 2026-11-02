import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StickyNote, Sparkles, Plus, Pencil, Trash2, X, Tag, Lightbulb, ArrowRight, Check } from 'lucide-react';
import { NoteItem } from '../../types/index';
import { MarkdownView } from '../MarkdownView';
import { analyzeSalesNotes } from '../../lib/aiAssistant';

interface NotesMemoryViewProps {
  notes: NoteItem[];
  onCreateNote: (note: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateNote: (note: NoteItem) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

export const NotesMemoryView: React.FC<NotesMemoryViewProps> = ({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTagsInput('');
    setIsPinned(false);
    setShowModal(true);
  };

  const handleOpenEdit = (n: NoteItem) => {
    setEditingNote(n);
    setTitle(n.title || '');
    setContent(n.content);
    setTagsInput((n.tags || []).join(', '));
    setIsPinned(Boolean(n.is_pinned));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingNote) {
      await onUpdateNote({
        ...editingNote,
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        tags,
        is_pinned: isPinned,
      });
    } else {
      await onCreateNote({
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        tags,
        is_pinned: isPinned,
      });
    }

    setShowModal(false);
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const analysisText = await analyzeSalesNotes(notes);
      setAiAnalysis(analysisText);
    } catch {
      setAiError('Unable to synthesize notes at this moment. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-heading">
            Notes &amp; AI Strategic Memory
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Working thoughts, client preferences, and strategic plans that inform your AI assistant.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={isAnalyzing}
            onClick={handleRunAiAnalysis}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>{isAnalyzing ? 'Analyzing Notes...' : 'Synthesize with AI'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </motion.button>
        </div>
      </div>

      {/* AI Analysis Result Card */}
      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-3 relative"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                AI Strategic Plan &amp; Next Action Items
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAiAnalysis(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
            <MarkdownView content={aiAnalysis} />
          </div>
        </motion.div>
      )}

      {aiError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
          Notice: {aiError}
        </div>
      )}

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <StickyNote className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">No working notes yet.</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-3 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(n => (
            <div
              key={n.id}
              className={`p-5 bg-white dark:bg-zinc-900 rounded-2xl border transition-colors shadow-xs flex flex-col justify-between ${
                n.is_pinned
                  ? 'border-zinc-900/40 dark:border-zinc-600 bg-zinc-50/40 dark:bg-zinc-800/60'
                  : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    {n.title || 'Untitled Note'}
                  </h3>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(n)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete note?')) {
                          onDeleteNote(n.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  <MarkdownView content={n.content} />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                <div className="flex items-center gap-1 flex-wrap">
                  {(n.tags || []).map(t => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[10px]">
                  {n.created_at ? n.created_at.split('T')[0] : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                {editingNote ? 'Edit Note' : 'Add Note'}
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
                  Note Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Website Upsell Strategy"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Record ideas, client feedback, or plan details..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="strategy, leads, upsell, review-cards"
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
                  Save Note
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
