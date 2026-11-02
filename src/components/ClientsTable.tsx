import React, { useState, useMemo } from 'react';
import { Client, Order, ClientWithComputedStats } from '../types/index';
import {
  computeClientListWithStats,
  filterAndSortClients,
  formatCurrency,
} from '../lib/calculations';

interface ClientsTableProps {
  clients: Client[];
  orders: Order[];
  onSelectClient: (clientId: string) => void;
  onOpenAddClient: () => void;
  onDeleteClient: (clientId: string, clientName: string) => void;
}

type SortField = 'business_name' | 'deal_type' | 'total_paid' | 'last_order_date' | 'created_at';

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  orders,
  onSelectClient,
  onOpenAddClient,
  onDeleteClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dealFilter, setDealFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('business_name');
  const [sortAsc, setSortAsc] = useState(true);

  const clientsWithStats = useMemo(() => {
    return computeClientListWithStats(clients, orders);
  }, [clients, orders]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [orders]);

  const filteredClients = useMemo(() => {
    return filterAndSortClients(
      clientsWithStats,
      searchQuery,
      dealFilter,
      sortField,
      sortAsc
    );
  }, [clientsWithStats, searchQuery, dealFilter, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <span className="text-zinc-300 dark:text-zinc-600 ml-1">↕</span>;
    return <span className="font-bold ml-1 text-zinc-900 dark:text-zinc-100">{sortAsc ? '↑' : '↓'}</span>;
  };

  const formatDealType = (dealType: string) => {
    if (dealType === 'recurring') return 'Recurring';
    if (dealType === 'one_time_upsell_later') return 'Upsell Later';
    return 'Flat One-Time';
  };

  return (
    <div className="space-y-4">
      {/* Apple Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Total Clients</span>
          <span className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{clients.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Total Orders</span>
          <span className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{orders.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Total Revenue</span>
          <span className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Avg Revenue</span>
          <span className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {clients.length > 0 ? formatCurrency(totalRevenue / clients.length) : '$0.00'}
          </span>
        </div>
      </div>

      {/* Control bar: Search, Filter, Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search clients, phone, notes..."
              className="w-full pl-3 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            />
          </div>

          <select
            value={dealFilter}
            onChange={e => setDealFilter(e.target.value)}
            aria-label="Filter by deal type"
            className="px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] text-zinc-700 dark:text-zinc-200 font-medium"
          >
            <option value="all">All Deal Types</option>
            <option value="recurring">Recurring</option>
            <option value="one_time_flat">One Time Flat</option>
            <option value="one_time_upsell_later">One Time Upsell Later</option>
          </select>

          {(searchQuery || dealFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDealFilter('all');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline font-mono cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAddClient}
          className="bg-[#0071e3] text-white px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#0077ed] rounded-lg shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
        >
          + Add Client
        </button>
      </div>

      {/* MOBILE VIEW: Stacked cards */}
      <div className="block sm:hidden space-y-3">
        {filteredClients.length === 0 ? (
          <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 dark:text-zinc-400 font-mono text-sm bg-white dark:bg-zinc-900 shadow-2xs">
            {clients.length === 0 ? 'No clients added yet. Tap "+ Add Client" to begin.' : 'No clients match your filter.'}
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-2xs space-y-2.5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {client.business_name}
                  </h3>
                  {client.contact_name && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {client.contact_name}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                  {formatDealType(client.deal_type)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Total Paid:</span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(client.total_paid)}
                  </span>
                  <span className="text-zinc-400 text-[10px] ml-1">
                    ({client.orders_count} {client.orders_count === 1 ? 'order' : 'orders'})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Last Order:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {client.last_order_date || 'None'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">Website:</span>
                  <span className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${client.bought_website ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-300 dark:border-zinc-700' : 'text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}>
                    {client.bought_website ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">Accessory:</span>
                  <span className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${client.bought_accessory ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-300 dark:border-zinc-700' : 'text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}>
                    {client.bought_accessory ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              {(client.contact_phone || client.contact_email || client.website_url) && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 pt-1">
                  {client.contact_phone && <div>📞 {client.contact_phone}</div>}
                  {client.contact_email && <div>✉️ {client.contact_email}</div>}
                  {client.website_url && (
                    <div className="truncate">
                      🌐 <span className="underline">{client.website_url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <span className="text-[#0071e3] font-medium">View Details &amp; Orders →</span>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteClient(client.id, client.business_name);
                  }}
                  className="text-red-500 hover:text-red-700 font-mono py-1 px-2 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE: Apple HIG styled table */}
      <div className="hidden sm:block border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('business_name')}
                className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
              >
                Business Name {renderSortIndicator('business_name')}
              </th>
              <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Contact Info</th>
              <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Website</th>
              <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-center">Website</th>
              <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-center">Accessory</th>
              <th
                onClick={() => handleSort('deal_type')}
                className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
              >
                Deal Type {renderSortIndicator('deal_type')}
              </th>
              <th
                onClick={() => handleSort('total_paid')}
                className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-right cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
              >
                Total Paid {renderSortIndicator('total_paid')}
              </th>
              <th
                onClick={() => handleSort('last_order_date')}
                className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-right cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
              >
                Last Order {renderSortIndicator('last_order_date')}
              </th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-400 dark:text-zinc-500 font-mono text-sm">
                  {clients.length === 0
                    ? 'No clients logged yet. Click "+ Add Client" above to create your first client.'
                    : 'No clients match your filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className={`border-b border-zinc-100 dark:border-zinc-800/80 transition-colors cursor-pointer ${
                    idx % 2 === 1
                      ? 'bg-zinc-50/40 dark:bg-zinc-800/40'
                      : 'bg-white dark:bg-zinc-900'
                  } hover:bg-zinc-100/60 dark:hover:bg-zinc-800/70`}
                >
                  {/* Business Name */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {client.business_name}
                    </span>
                    {client.contact_name && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-normal">
                        Attn: {client.contact_name}
                      </span>
                    )}
                  </td>

                  {/* Contact Info */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 font-mono text-xs">
                    {client.contact_phone && (
                      <div className="text-zinc-700 dark:text-zinc-300">{client.contact_phone}</div>
                    )}
                    {client.contact_email && (
                      <div className="text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">{client.contact_email}</div>
                    )}
                    {!client.contact_phone && !client.contact_email && (
                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Website URL */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs max-w-[160px] truncate">
                    {client.website_url ? (
                      <a
                        href={
                          client.website_url.startsWith('http')
                            ? client.website_url
                            : `https://${client.website_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="underline text-[#0071e3] hover:text-[#0077ed]"
                      >
                        {client.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600 font-mono">—</span>
                    )}
                  </td>

                  {/* Bought Website */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-mono font-bold rounded-md ${
                        client.bought_website
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700'
                          : 'text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {client.bought_website ? 'YES' : 'NO'}
                    </span>
                  </td>

                  {/* Bought Accessory */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-mono font-bold rounded-md ${
                        client.bought_accessory
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700'
                          : 'text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {client.bought_accessory ? 'YES' : 'NO'}
                    </span>
                  </td>

                  {/* Deal Type */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs font-mono">
                    <span className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium rounded-md text-zinc-700 dark:text-zinc-300">
                      {formatDealType(client.deal_type)}
                    </span>
                  </td>

                  {/* Total Paid */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-right font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    <div>{formatCurrency(client.total_paid)}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                      {client.orders_count} {client.orders_count === 1 ? 'order' : 'orders'}
                    </div>
                  </td>

                  {/* Last Order Date */}
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {client.last_order_date || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(client.id, client.business_name)}
                      aria-label={`Delete client ${client.business_name}`}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline font-mono px-2 py-1 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredClients.length > 0 && (
            <tfoot>
              <tr className="bg-zinc-50 dark:bg-zinc-800/80 font-bold border-t border-zinc-200 dark:border-zinc-800 text-sm">
                <td colSpan={6} className="p-3.5 text-right uppercase tracking-wider text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  Total Revenue Displayed:
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(filteredClients.reduce((sum, c) => sum + c.total_paid, 0))}
                </td>
                <td colSpan={2} className="p-3.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  ({filteredClients.length} clients)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
