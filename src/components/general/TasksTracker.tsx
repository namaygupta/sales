import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  PhoneCall,
  HelpCircle,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react';
import { TaskItem, TaskType, Client, InventoryItem } from '../../types/index';

interface TasksTrackerProps {
  tasks: TaskItem[];
  clients: Client[];
  inventoryItems: InventoryItem[];
  onCreateTask: (task: Omit<TaskItem, 'id' | 'created_at' | 'status'>) => Promise<void>;
  onToggleStatus: (id: string, newStatus: 'open' | 'done') => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onNavigateToAdmin?: () => void;
}

export const TasksTracker: React.FC<TasksTrackerProps> = ({
  tasks,
  clients,
  inventoryItems,
  onCreateTask,
  onToggleStatus,
  onDeleteTask,
  onNavigateToAdmin,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'done'>('open');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [taskType, setTaskType] = useState<TaskType>('follow_up_call');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Passive inventory reorder alerts
  const lowStockItems = inventoryItems.filter(i => i.quantity_on_hand <= i.reorder_threshold);

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.task_type !== filterType) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    await onCreateTask({
      task_type: taskType,
      description: description.trim(),
      client_id: clientId || null,
      due_date: dueDate || null,
    });

    setDescription('');
    setClientId('');
    setDueDate('');
    setShowAddModal(false);
  };

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'follow_up_call':
        return <PhoneCall className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case 'needs_help':
        return <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'reorder':
        return <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  const getTaskLabel = (type: TaskType) => {
    switch (type) {
      case 'follow_up_call':
        return 'Follow-up Call';
      case 'needs_help':
        return 'Client Help';
      case 'reorder':
        return 'Reorder Alert';
      default:
        return 'Task';
    }
  };

  return (
    <div className="space-y-6">
      {/* Passive Stock Alert Notice */}
      {lowStockItems.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 font-heading">
                Reorder Reminder: {lowStockItems.length} inventory item{lowStockItems.length > 1 ? 's' : ''} running low
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300">
                {lowStockItems
                  .map(i => `${i.item_name} (${i.quantity_on_hand} left, threshold: ${i.reorder_threshold})`)
                  .join(' • ')}
              </p>
            </div>
          </div>
          {onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-3.5 py-1.5 bg-amber-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white text-xs font-semibold rounded-xl self-start sm:self-auto cursor-pointer shadow-xs transition-colors"
            >
              Adjust in Admin
            </button>
          )}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-heading">
            Pending Tasks &amp; Follow-ups
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Keep track of client follow-up calls, support inquiries, and supply reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setFilterStatus('open')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterStatus === 'open' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('done')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterStatus === 'done' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              All
            </button>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </motion.button>
        </div>
      </div>

      {/* Task Type Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
          Type:
        </span>
        {[
          { key: 'all', label: 'All Types' },
          { key: 'follow_up_call', label: 'Follow-up Calls' },
          { key: 'needs_help', label: 'Client Help' },
          { key: 'reorder', label: 'Reorder Flags' },
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilterType(opt.key)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterType === opt.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <CheckCircle2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">No {filterStatus !== 'all' ? filterStatus : ''} tasks found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-xs">
          {filteredTasks.map(t => {
            const client = clients.find(c => c.id === t.client_id);
            const isDone = t.status === 'done';

            return (
              <div
                key={t.id}
                className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                  isDone ? 'bg-zinc-50/50 dark:bg-zinc-950/40 opacity-75' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(t.id, isDone ? 'open' : 'done')}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs sm:text-sm font-semibold ${isDone ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {t.description}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        {getTaskIcon(t.task_type)}
                        <span>{getTaskLabel(t.task_type)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 flex-wrap">
                      {client && (
                        <span>
                          Account: <strong className="text-zinc-700 dark:text-zinc-300">{client.business_name}</strong>
                        </span>
                      )}
                      {t.due_date && (
                        <span className="font-mono">
                          Due: {t.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteTask(t.id)}
                  className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Create New Task
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Task Type *
                </label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value as TaskType)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="follow_up_call">Follow-up Call</option>
                  <option value="needs_help">Client Help / Support</option>
                  <option value="reorder">Reorder Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Call Apex Fitness about NFC review stand upgrade"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Related Client
                  </label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">None / General</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.business_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-xl shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
