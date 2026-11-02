import React, { useState } from 'react';
import { Client, Order, Category, PricingRules, PresetBundle } from '../types/index';
import { getClientStats, formatCurrency } from '../lib/calculations';
import { AddOrderForm } from './AddOrderForm';
import { AddClientForm } from './AddClientForm';
import { MarkdownView } from './MarkdownView';

interface ClientDetailViewProps {
  client: Client;
  orders: Order[];
  categories: Category[];
  pricingRules: PricingRules;
  presetBundles: PresetBundle[];
  onBack: () => void;
  onAddOrder: (order: Omit<Order, 'id' | 'created_at'>) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateClient: (updatedClient: Client) => void;
  onDeleteClient: (clientId: string, name: string) => void;
  onOpenPricingSettings?: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  orders,
  categories,
  pricingRules,
  presetBundles,
  onBack,
  onAddOrder,
  onDeleteOrder,
  onUpdateClient,
  onDeleteClient,
  onOpenPricingSettings,
}) => {
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);

  const stats = getClientStats(orders, client.id);

  const formatDealType = (dealType: string) => {
    if (dealType === 'recurring') return 'Recurring';
    if (dealType === 'one_time_upsell_later') return 'Upsell Later';
    return 'Flat One-Time';
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-medium rounded-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {client.business_name}
            </h1>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
              Added: {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowEditClientModal(true)}
            className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            Edit Details
          </button>
          <button
            type="button"
            onClick={() => setShowAddOrderModal(true)}
            className="px-4 py-1.5 bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            + Add Order / Bundle
          </button>
        </div>
      </div>

      {/* Overview Cards / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Contact Info Box */}
        <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
            Contact Details
          </h2>
          <div className="text-sm space-y-1.5 pt-1">
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Contact:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{client.contact_name || '—'}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Phone:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 text-xs">{client.contact_phone || '—'}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Email:</span>
              <span className="text-zinc-900 dark:text-zinc-100 text-xs break-all">{client.contact_email || '—'}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Website:</span>
              {client.website_url ? (
                <a
                  href={
                    client.website_url.startsWith('http')
                      ? client.website_url
                      : `https://${client.website_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#0071e3] font-medium break-all text-xs hover:text-[#0077ed]"
                >
                  {client.website_url.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <span className="text-zinc-300 dark:text-zinc-600 font-mono text-xs">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Status & Deal Type Box */}
        <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
            Purchase Profile
          </h2>
          <div className="text-sm space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Bought Website:</span>
              <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md ${client.bought_website ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'}`}>
                {client.bought_website ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Bought Accessory:</span>
              <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md ${client.bought_accessory ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'}`}>
                {client.bought_accessory ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">Deal Structure:</span>
              <span className="px-2 py-0.5 text-xs font-mono border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium rounded-md text-zinc-700 dark:text-zinc-300">
                {formatDealType(client.deal_type)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary Box */}
        <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
            Revenue Summary
          </h2>
          <div className="space-y-1.5 font-mono text-sm pt-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Revenue:</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(stats.totalPaid)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Total Orders:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.count}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Average Order:</span>
              <span className="text-zinc-700 dark:text-zinc-300">{formatCurrency(stats.averageOrder)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Last Order:</span>
              <span className="text-zinc-700 dark:text-zinc-300">{stats.lastOrderDate || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      {client.notes && (
        <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-2xs text-sm">
          <span className="font-semibold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
            Notes
          </span>
          <MarkdownView content={client.notes} />
        </div>
      )}

      {/* Order History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Order History ({stats.count} {stats.count === 1 ? 'Order' : 'Orders'})
          </h2>
          <button
            type="button"
            onClick={() => setShowAddOrderModal(true)}
            className="text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] bg-[#0071e3]/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            + Log Order / Bundle
          </button>
        </div>

        {/* Mobile orders view */}
        <div className="block sm:hidden space-y-2.5">
          {stats.orders.length === 0 ? (
            <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-6 text-center text-zinc-400 dark:text-zinc-500 font-mono text-sm bg-white dark:bg-zinc-900 shadow-2xs">
              No orders logged yet. Tap &quot;+ Log Order&quot; to record a payment.
            </div>
          ) : (
            stats.orders.map(order => (
              <div key={order.id} className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 rounded-xl shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                    {order.item_type}
                  </span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(Number(order.amount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <span>Date: {order.order_date || 'N/A'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this order?')) onDeleteOrder(order.id);
                    }}
                    className="text-red-500 hover:text-red-700 underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
                {order.notes && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    {order.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop orders table */}
        <div className="hidden sm:block border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Order Date</th>
                <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Package / Bundle</th>
                <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-right">Amount ($ USD)</th>
                <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Breakdown &amp; Notes</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400 dark:text-zinc-500 font-mono text-sm">
                    No orders logged yet for this client. Click &quot;+ Add Order&quot; above to log the first payment.
                  </td>
                </tr>
              ) : (
                stats.orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`border-b border-zinc-100 dark:border-zinc-800/80 ${idx % 2 === 1 ? 'bg-zinc-50/40 dark:bg-zinc-800/40' : 'bg-white dark:bg-zinc-900'}`}
                  >
                    <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {order.order_date || 'N/A'}
                    </td>
                    <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                        {order.item_type}
                      </span>
                    </td>
                    <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 font-mono font-bold text-right text-sm text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(Number(order.amount) || 0)}
                    </td>
                    <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                      {order.notes || <span className="text-zinc-300 dark:text-zinc-600 font-mono">—</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this order?')) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        aria-label={`Delete order ${order.id}`}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline font-mono px-2 py-1 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {stats.orders.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-50 dark:bg-zinc-800/80 font-bold border-t border-zinc-200 dark:border-zinc-800 text-sm">
                  <td colSpan={2} className="p-3.5 text-right uppercase tracking-wider text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    Total Paid:
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(stats.totalPaid)}
                  </td>
                  <td colSpan={2} className="p-3.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                    ({stats.count} {stats.count === 1 ? 'order' : 'orders'})
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Delete Client Action */}
      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center text-xs">
        <span className="text-zinc-400 dark:text-zinc-500">Remove this client record?</span>
        <button
          type="button"
          onClick={() => onDeleteClient(client.id, client.business_name)}
          className="text-red-500 hover:text-red-700 underline font-mono cursor-pointer"
        >
          Delete Client &amp; Orders
        </button>
      </div>

      {/* Modals */}
      {showAddOrderModal && (
        <AddOrderForm
          client={client}
          categories={categories}
          pricingRules={pricingRules}
          presetBundles={presetBundles}
          onSave={orderPayload => {
            onAddOrder(orderPayload);
            setShowAddOrderModal(false);
          }}
          onCancel={() => setShowAddOrderModal(false)}
          onOpenPricingSettings={onOpenPricingSettings}
        />
      )}

      {showEditClientModal && (
        <AddClientForm
          initialData={client}
          categories={categories}
          pricingRules={pricingRules}
          presetBundles={presetBundles}
          onSave={updatedFields => {
            onUpdateClient({
              ...client,
              ...updatedFields,
            });
            setShowEditClientModal(false);
          }}
          onCancel={() => setShowEditClientModal(false)}
        />
      )}
    </div>
  );
};
