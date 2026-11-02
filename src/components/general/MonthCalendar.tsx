import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, DollarSign, X } from 'lucide-react';
import { Order, TaskItem, Client } from '../../types/index';
import { formatCurrency } from '../../lib/calculations';

interface MonthCalendarProps {
  orders: Order[];
  tasks: TaskItem[];
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  orders,
  tasks,
  clients,
  onSelectClient,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().toISOString().split('T')[0]);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Group orders by date (YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach(o => {
      if (!o.order_date) return;
      const list = map.get(o.order_date) || [];
      list.push(o);
      map.set(o.order_date, list);
    });
    return map;
  }, [orders]);

  // Group tasks by due_date (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach(t => {
      if (!t.due_date) return;
      const list = map.get(t.due_date) || [];
      list.push(t);
      map.set(t.due_date, list);
    });
    return map;
  }, [tasks]);

  // Generate grid days for the month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        orders: ordersByDate.get(dateStr) || [],
        tasks: tasksByDate.get(dateStr) || [],
        totalRevenue: (ordersByDate.get(dateStr) || []).reduce((s, o) => s + (Number(o.amount) || 0), 0),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = ordersByDate.get(dateStr) || [];
      const dayTasks = tasksByDate.get(dateStr) || [];
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        orders: dayOrders,
        tasks: dayTasks,
        totalRevenue: dayOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      });
    }

    // Next month filler days to complete rows (up to multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        orders: ordersByDate.get(dateStr) || [],
        tasks: tasksByDate.get(dateStr) || [],
        totalRevenue: (ordersByDate.get(dateStr) || []).reduce((s, o) => s + (Number(o.amount) || 0), 0),
      });
    }

    return days;
  }, [year, month, ordersByDate, tasksByDate]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Mobile collapsed view: Only days with events or orders
  const agendaDays = useMemo(() => {
    return calendarDays.filter(d => d.isCurrentMonth && (d.orders.length > 0 || d.tasks.length > 0));
  }, [calendarDays]);

  // Selected Day Details
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    return calendarDays.find(d => d.dateStr === selectedDay) || null;
  }, [selectedDay, calendarDays]);

  return (
    <div className="p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
              {monthName}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Payments received and client task deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DESKTOP & TABLET: Standard Month Grid (sm and above) */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div
              key={d}
              className="bg-zinc-50 dark:bg-zinc-800/80 py-2 text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            const isToday = day.dateStr === todayStr;
            const isSelected = day.dateStr === selectedDay;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day.dateStr)}
                className={`min-h-[78px] p-1.5 transition-colors cursor-pointer flex flex-col justify-between ${
                  day.isCurrentMonth
                    ? 'bg-white dark:bg-zinc-900'
                    : 'bg-zinc-50/60 dark:bg-zinc-950/60'
                } ${
                  isSelected
                    ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ring-inset bg-zinc-50 dark:bg-zinc-800/70'
                    : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs ${
                      isToday
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                        : day.isCurrentMonth
                        ? 'text-zinc-800 dark:text-zinc-200'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {day.totalRevenue > 0 && (
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${Math.round(day.totalRevenue)}
                    </span>
                  )}
                </div>

                {/* Day Dots / Badges */}
                <div className="space-y-0.5 mt-1">
                  {day.orders.slice(0, 2).map(o => (
                    <div
                      key={o.id}
                      className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[9px] font-medium truncate flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{o.item_type}</span>
                    </div>
                  ))}

                  {day.tasks.slice(0, 1).map(t => (
                    <div
                      key={t.id}
                      className="px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-medium truncate flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate">{t.description}</span>
                    </div>
                  ))}

                  {day.orders.length + day.tasks.length > 3 && (
                    <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono pl-1">
                      +{day.orders.length + day.tasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE: Collapsible Single-Column List of Days with Activity (below sm) */}
      <div className="sm:hidden space-y-2">
        {agendaDays.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
            No orders or scheduled tasks for this month.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {agendaDays.map(d => {
              const isToday = d.dateStr === todayStr;
              return (
                <div
                  key={d.dateStr}
                  onClick={() => setSelectedDay(d.dateStr)}
                  className="p-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {d.dateStr}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {d.orders.map(o => (
                        <p key={o.id} className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Order: {o.item_type} ({formatCurrency(o.amount)})</span>
                        </p>
                      ))}
                      {d.tasks.map(t => (
                        <p key={t.id} className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Task: {t.description}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {d.totalRevenue > 0 && (
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{formatCurrency(d.totalRevenue)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Inspector Modal / Drawer */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                  Schedule for {selectedDayData.dateStr}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedDayData.orders.length} order{selectedDayData.orders.length !== 1 ? 's' : ''} •{' '}
                  {selectedDayData.tasks.length} task{selectedDayData.tasks.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Orders Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Orders Placed
                </h4>
                {selectedDayData.totalRevenue > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Total: {formatCurrency(selectedDayData.totalRevenue)}
                  </span>
                )}
              </div>

              {selectedDayData.orders.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">No orders on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayData.orders.map(o => {
                    const client = clients.find(c => c.id === o.client_id);
                    return (
                      <div
                        key={o.id}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                            {client ? client.business_name : 'Unknown Client'}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                            {o.item_type}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(o.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Tasks Due
              </h4>

              {selectedDayData.tasks.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">No deadlines scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayData.tasks.map(t => {
                    const client = clients.find(c => c.id === t.client_id);
                    return (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                            {t.description}
                          </span>
                          {client && (
                            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                              Client: {client.business_name}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            t.status === 'done'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {t.status === 'done' ? 'Completed' : 'Open'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
