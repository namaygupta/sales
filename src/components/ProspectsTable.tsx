import React, { useState, useMemo } from 'react';
import { Prospect, ProspectStatus } from '../types/index';
import { filterAndSortProspects } from '../lib/calculations';

interface ProspectsTableProps {
  prospects: Prospect[];
  onOpenAddProspect: () => void;
  onUpdateStatus: (prospectId: string, newStatus: ProspectStatus) => void;
  onConvertToClient: (prospect: Prospect) => void;
  onDeleteProspect: (prospectId: string, name: string) => void;
  onEditProspect: (prospect: Prospect) => void;
}

type SortField = 'business_name' | 'contact_name' | 'status' | 'created_at';

export const ProspectsTable: React.FC<ProspectsTableProps> = ({
  prospects,
  onOpenAddProspect,
  onUpdateStatus,
  onConvertToClient,
  onDeleteProspect,
  onEditProspect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('business_name');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredProspects = useMemo(() => {
    return filterAndSortProspects(
      prospects,
      searchQuery,
      statusFilter,
      sortField,
      sortAsc
    );
  }, [prospects, searchQuery, statusFilter, sortField, sortAsc]);

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

  const notContactedCount = prospects.filter(p => p.status === 'not_contacted').length;
  const contactedCount = prospects.filter(p => p.status === 'contacted').length;
  const followUpCount = prospects.filter(p => p.status === 'follow_up').length;

  return (
    <div className="space-y-4">
      {/* Pipeline Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Total Pipeline</span>
          <span className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{prospects.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Not Contacted</span>
          <span className="text-xl sm:text-2xl font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">{notContactedCount}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Pitch Sent</span>
          <span className="text-xl sm:text-2xl font-semibold text-sky-600 dark:text-sky-400 tracking-tight">{contactedCount}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-zinc-400 dark:text-zinc-500 block text-[11px] font-medium uppercase tracking-wider">Follow Up Needed</span>
          <span className="text-xl sm:text-2xl font-semibold text-amber-600 dark:text-amber-400 tracking-tight">{followUpCount}</span>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search prospects, phone, notes..."
              className="w-full pl-3 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by prospect status"
            className="px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] text-zinc-700 dark:text-zinc-200 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow Up</option>
          </select>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline font-mono cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAddProspect}
          className="bg-[#0071e3] text-white px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#0077ed] rounded-lg shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
        >
          + Add Prospect
        </button>
      </div>

      {/* MOBILE VIEW: Stacked cards */}
      <div className="block sm:hidden space-y-3">
        {filteredProspects.length === 0 ? (
          <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 dark:text-zinc-400 font-mono text-sm bg-white dark:bg-zinc-900 shadow-2xs">
            {prospects.length === 0 ? 'No prospects in pipeline yet.' : 'No prospects match your search.'}
          </div>
        ) : (
          filteredProspects.map(prospect => (
            <div
              key={prospect.id}
              className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {prospect.business_name}
                  </h3>
                  {prospect.contact_name && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {prospect.contact_name}
                    </span>
                  )}
                </div>
                <select
                  value={prospect.status}
                  onChange={e => onUpdateStatus(prospect.id, e.target.value as ProspectStatus)}
                  className="text-xs font-mono px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                >
                  <option value="not_contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>

              {(prospect.contact_phone || prospect.contact_email) && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 font-mono">
                  {prospect.contact_phone && <div>📞 {prospect.contact_phone}</div>}
                  {prospect.contact_email && <div>✉️ {prospect.contact_email}</div>}
                </div>
              )}

              {prospect.notes && (
                <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {prospect.notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => onConvertToClient(prospect)}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 cursor-pointer"
                >
                  Convert to Client →
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEditProspect(prospect)}
                    className="text-zinc-600 dark:text-zinc-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProspect(prospect.id, prospect.business_name)}
                    className="text-red-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE */}
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
              <th
                onClick={() => handleSort('contact_name')}
                className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
              >
                Contact Person {renderSortIndicator('contact_name')}
              </th>
              <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Phone &amp; Email</th>
              <th
                onClick={() => handleSort('status')}
                className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
              >
                Status {renderSortIndicator('status')}
              </th>
              <th className="p-3.5 border-r border-zinc-100 dark:border-zinc-800">Pitch Notes</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProspects.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-400 dark:text-zinc-500 font-mono text-sm">
                  {prospects.length === 0
                    ? 'No prospects in pipeline. Click "+ Add Prospect" above to record businesses to pitch.'
                    : 'No prospects match your filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredProspects.map((prospect, idx) => (
                <tr
                  key={prospect.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800/80 transition-colors ${
                    idx % 2 === 1
                      ? 'bg-zinc-50/40 dark:bg-zinc-850/40'
                      : 'bg-white dark:bg-zinc-900'
                  } hover:bg-zinc-100/60 dark:hover:bg-zinc-800/70`}
                >
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">
                    {prospect.business_name}
                  </td>
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                    {prospect.contact_name || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 font-mono text-xs">
                    {prospect.contact_phone && (
                      <div className="text-zinc-700 dark:text-zinc-300">{prospect.contact_phone}</div>
                    )}
                    {prospect.contact_email && (
                      <div className="text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">{prospect.contact_email}</div>
                    )}
                    {!prospect.contact_phone && !prospect.contact_email && (
                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs font-mono">
                    <select
                      value={prospect.status}
                      onChange={e => onUpdateStatus(prospect.id, e.target.value as ProspectStatus)}
                      aria-label={`Status for ${prospect.business_name}`}
                      className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded font-medium text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="contacted">Contacted</option>
                      <option value="follow_up">Follow Up</option>
                    </select>
                  </td>
                  <td className="p-3.5 border-r border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 max-w-[200px]">
                    <div className="truncate" title={prospect.notes || ''}>
                      {prospect.notes || <span className="text-zinc-300 dark:text-zinc-600 font-mono">—</span>}
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onConvertToClient(prospect)}
                        className="text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-2 py-1 rounded font-medium cursor-pointer"
                      >
                        Convert →
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditProspect(prospect)}
                        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline font-mono px-1 py-0.5 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProspect(prospect.id, prospect.business_name)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline font-mono px-1 py-0.5 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
