import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Order, Category, Client, InventoryItem, TaskItem } from '../../types/index';
import { formatCurrency } from '../../lib/calculations';
import { TrendingUp, DollarSign, Users, ShoppingBag, AlertTriangle } from 'lucide-react';

interface DashboardChartsProps {
  orders: Order[];
  clients: Client[];
  categories: Category[];
  inventoryItems: InventoryItem[];
  tasks: TaskItem[];
  showRevenueChart?: boolean;
  showProfitChart?: boolean;
  showTopSellers?: boolean;
  showTopClients?: boolean;
  showQuickStats?: boolean;
  showInventoryAlerts?: boolean;
  onNavigateToTab?: (tab: string) => void;
  isDark?: boolean;
}

type TimeRange = '30' | '90' | '365';

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  orders,
  clients,
  categories,
  inventoryItems,
  tasks,
  showRevenueChart = true,
  showProfitChart = true,
  showTopSellers = true,
  showTopClients = true,
  showQuickStats = true,
  showInventoryAlerts = true,
  onNavigateToTab,
  isDark: isDarkProp,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('90');

  const isDark =
    isDarkProp ??
    (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  // Low inventory items
  const lowStockItems = useMemo(() => {
    return inventoryItems.filter(item => item.quantity_on_hand <= item.reorder_threshold);
  }, [inventoryItems]);

  // Pending open tasks
  const openTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'open').length;
  }, [tasks]);

  // Date threshold based on timeRange
  const thresholdDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(timeRange, 10));
    return d.toISOString().split('T')[0];
  }, [timeRange]);

  // Filter orders by timeRange
  const filteredOrders = useMemo(() => {
    return orders.filter(o => !o.order_date || o.order_date >= thresholdDate);
  }, [orders, thresholdDate]);

  // Lifetime revenue
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [orders]);

  // Category cost mapping for profit computation
  const categoryCostMap = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach(c => {
      map.set(c.id, Number(c.cost_amount) || 0);
    });
    return map;
  }, [categories]);

  // Aggregate time series: Revenue and Profit grouped by date/period
  const { timeSeriesData, totalRangeProfit } = useMemo(() => {
    const dateMap = new Map<string, { revenue: number; profit: number; count: number }>();

    let cumulativeProfit = 0;

    // Sort ascending by order date
    const sorted = [...filteredOrders].sort((a, b) => (a.order_date || '').localeCompare(b.order_date || ''));

    sorted.forEach(o => {
      const dateStr = o.order_date || o.created_at?.split('T')[0] || 'Unknown';
      const amt = Number(o.amount) || 0;
      const cost = categoryCostMap.get(o.item_type) || 0;
      const profit = Math.max(0, amt - cost);

      cumulativeProfit += profit;

      const existing = dateMap.get(dateStr) || { revenue: 0, profit: 0, count: 0 };
      dateMap.set(dateStr, {
        revenue: existing.revenue + amt,
        profit: existing.profit + profit,
        count: existing.count + 1,
      });
    });

    const points = Array.from(dateMap.entries()).map(([date, data]) => {
      const d = new Date(date + 'T00:00:00');
      const label = isNaN(d.getTime())
        ? date
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        date,
        shortLabel: label,
        revenue: Math.round(data.revenue),
        profit: Math.round(data.profit),
        count: data.count,
      };
    });

    return {
      timeSeriesData: points,
      totalRangeProfit: Math.round(cumulativeProfit),
    };
  }, [filteredOrders, categoryCostMap]);

  // Top Sellers Breakdown
  const topSellersData = useMemo(() => {
    const itemMap = new Map<string, { revenue: number; orders: number; profit: number }>();

    filteredOrders.forEach(o => {
      const type = o.item_type || 'other';
      const amt = Number(o.amount) || 0;
      const cost = categoryCostMap.get(type) || 0;
      const profit = Math.max(0, amt - cost);

      const existing = itemMap.get(type) || { revenue: 0, orders: 0, profit: 0 };
      itemMap.set(type, {
        revenue: existing.revenue + amt,
        profit: existing.profit + profit,
        orders: existing.orders + 1,
      });
    });

    return Array.from(itemMap.entries())
      .map(([type, data]) => {
        const cat = categories.find(c => c.id === type);
        const name = cat ? cat.name : type.charAt(0).toUpperCase() + type.slice(1);
        return {
          id: type,
          name: name.length > 15 ? name.slice(0, 14) + '…' : name,
          fullName: name,
          revenue: Math.round(data.revenue),
          profit: Math.round(data.profit),
          orders: data.orders,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders, categories, categoryCostMap]);

  // Top Clients Ranking
  const topClientsData = useMemo(() => {
    const clientSpendMap = new Map<string, { name: string; total: number; count: number }>();

    orders.forEach(o => {
      const client = clients.find(c => c.id === o.client_id);
      const name = client ? client.business_name : 'Unknown Business';

      const existing = clientSpendMap.get(o.client_id) || { name, total: 0, count: 0 };
      clientSpendMap.set(o.client_id, {
        name,
        total: existing.total + (Number(o.amount) || 0),
        count: existing.count + 1,
      });
    });

    return Array.from(clientSpendMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders, clients]);

  return (
    <div className="space-y-6">
      {/* Passive Low Stock Alert Banner */}
      {showInventoryAlerts && lowStockItems.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-800 dark:text-amber-200 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 font-heading">
                Low Inventory Notice: {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} at or below threshold
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300">
                {lowStockItems
                  .map(i => `${i.item_name} (${i.quantity_on_hand} left, threshold: ${i.reorder_threshold})`)
                  .join(' • ')}
              </p>
            </div>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('admin')}
              className="px-3 py-1 bg-amber-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Restock in Admin
            </button>
          )}
        </div>
      )}

      {/* Quick Business Metrics Row */}
      {showQuickStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Lifetime Revenue
              </span>
              <DollarSign className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {orders.length} total orders logged
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Active Clients
              </span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {clients.length}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Accounts in database
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Period Net Profit
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalRangeProfit)}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Last {timeRange} days (after unit costs)
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pending Tasks
              </span>
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {openTasksCount}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Follow-ups &amp; alerts open
            </p>
          </div>
        </div>
      )}

      {/* Revenue & Profit Charts Section */}
      {(showRevenueChart || showProfitChart) && (
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Revenue &amp; Profit Over Time
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Incoming payments vs calculated profit margins based on product costs.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimeRange('30')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeRange === '30'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('90')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeRange === '90'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                90 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('365')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeRange === '365'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                1 Year
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {timeSeriesData.length === 0 || timeSeriesData.every(d => d.revenue === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                <p>No orders logged in this {timeRange}-day timeframe.</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Log client payments in the Clients tab to populate real-time charts.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? '#27272a' : '#f4f4f5'}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 10, fill: isDark ? '#a1a1aa' : '#71717a' }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: isDark ? '#a1a1aa' : '#71717a' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `$${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 dark:bg-zinc-800 text-white p-2.5 rounded-xl text-xs shadow-lg font-mono border border-zinc-800 dark:border-zinc-700">
                          <p className="text-[10px] text-zinc-400 font-sans mb-1">{data.date}</p>
                          <p className="text-zinc-100">
                            Revenue: <span className="font-bold">{formatCurrency(data.revenue)}</span>
                          </p>
                          <p className="text-emerald-400">
                            Profit: <span className="font-bold">{formatCurrency(data.profit)}</span>
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Orders: {data.count}
                          </p>
                        </div>
                      );
                    }}
                  />
                  {showRevenueChart && (
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={isDark ? '#38bdf8' : '#18181b'}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: isDark ? '#38bdf8' : '#18181b', strokeWidth: 2 }}
                    />
                  )}
                  {showProfitChart && (
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {showRevenueChart && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-sky-400 inline-block" />
                Gross Revenue
              </span>
            )}
            {showProfitChart && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Net Profit
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Sellers & Top Clients Grid */}
      {(showTopSellers || showTopClients) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Sellers Chart */}
          {showTopSellers && (
            <div className="p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading mb-1">
                  Top Categories &amp; Offerings
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  Ranked by cumulative revenue and volume.
                </p>
              </div>

              {topSellersData.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  No orders logged yet.
                </div>
              ) : (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topSellersData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke={isDark ? '#27272a' : '#f4f4f5'}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: isDark ? '#a1a1aa' : '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                        tickFormatter={val => `$${val}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 10, fill: isDark ? '#d4d4d8' : '#3f3f46' }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 dark:bg-zinc-800 text-white p-2.5 rounded-xl text-xs shadow-lg font-mono border border-zinc-800 dark:border-zinc-700">
                              <p className="font-sans font-semibold text-zinc-200 mb-1">{d.fullName}</p>
                              <p>Revenue: {formatCurrency(d.revenue)}</p>
                              <p className="text-emerald-400">Profit: {formatCurrency(d.profit)}</p>
                              <p className="text-[10px] text-zinc-400">Orders: {d.orders}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="revenue" fill={isDark ? '#38bdf8' : '#18181b'} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Top Clients Ranking */}
          {showTopClients && (
            <div className="p-5 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading mb-1">
                  Top Client Accounts
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Highest lifetime value accounts.
                </p>
              </div>

              {topClientsData.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  No client accounts with orders yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {topClientsData.map((client, idx) => (
                    <div
                      key={client.id}
                      className="py-2.5 flex items-center justify-between text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 px-1 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center font-mono text-zinc-400 font-semibold text-[11px]">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {client.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(client.total)}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          ({client.count})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
