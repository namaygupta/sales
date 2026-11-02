import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, ArrowRight } from 'lucide-react';
import { Client, Order, TaskItem, InventoryItem } from '../../types/index';
import { MarkdownView } from '../MarkdownView';
import { querySalesAssistant } from '../../lib/aiAssistant';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  orders: Order[];
  tasks: TaskItem[];
  inventoryItems: InventoryItem[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  clients,
  orders,
  tasks,
  inventoryItems,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello. I've analyzed your current client accounts, orders, inventory stock, and follow-ups. Ask me anything about pipeline opportunities, website upsells, or NFC review card pitches.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Business snapshot to supply to the sales assistant
  const buildContextSnapshot = () => {
    const totalRev = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const lowStock = inventoryItems.filter(i => i.quantity_on_hand <= i.reorder_threshold);
    const openTasks = tasks.filter(t => t.status === 'open');

    return {
      totalClients: clients.length,
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRev),
      lowStockItemsCount: lowStock.length,
      openTasksCount: openTasks.length,
      recentClients: clients.slice(0, 5).map(c => ({
        name: c.business_name,
        bought_website: c.bought_website,
        bought_accessory: c.bought_accessory,
        deal_type: c.deal_type,
      })),
      recentOpenTasks: openTasks.slice(0, 5).map(t => ({
        type: t.task_type,
        description: t.description,
        due_date: t.due_date,
      })),
    };
  };

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: q,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const answerText = await querySalesAssistant(q, buildContextSnapshot());

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: answerText,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: 'The sales assistant is currently reconnecting. Please send your question again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Which clients are prime candidates for an NFC upsell?',
    'What are my highest priority follow-ups right now?',
    'How can I pitch NFC stands to local coffee shops & restaurants?',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="fixed inset-y-0 right-0 w-full sm:max-w-md flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between h-full"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#0071e3] dark:text-sky-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                      AI Sales Assistant
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Grounded on your live clients, orders &amp; pipeline
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#0071e3] text-white'
                          : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      }`}
                    >
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#0071e3] text-white whitespace-pre-wrap font-medium'
                          : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 font-sans shadow-2xs'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        msg.text
                      ) : (
                        <MarkdownView content={msg.text} />
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 py-2">
                    <Bot className="w-4 h-4 animate-pulse text-[#0071e3]" />
                    <span>AI is analyzing your accounts...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts & Input Area */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 space-y-3 shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(qp)}
                      className="text-[11px] px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-left transition-colors cursor-pointer"
                    >
                      {qp}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={e => setInputQuery(e.target.value)}
                    placeholder="Ask about clients, sales, or strategy..."
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#0071e3]"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading || !inputQuery.trim()}
                    className="p-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl disabled:opacity-40 cursor-pointer transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
