import React, { useState, useMemo } from 'react';
import { Order, Category, Client, PricingRules, PresetBundle } from '../types/index';
import { calculateCustomBundle, formatCurrency } from '../lib/calculations';

interface AddOrderFormProps {
  client: Client;
  categories: Category[];
  pricingRules: PricingRules;
  presetBundles: PresetBundle[];
  onSave: (order: Omit<Order, 'id' | 'created_at'>) => void;
  onCancel: () => void;
  onOpenPricingSettings?: () => void;
}

export const AddOrderForm: React.FC<AddOrderFormProps> = ({
  client,
  categories,
  pricingRules,
  presetBundles,
  onSave,
  onCancel,
  onOpenPricingSettings,
}) => {
  const [activeMode, setActiveMode] = useState<'bundle' | 'custom'>('bundle');

  // Custom Builder State
  const [hasWebsite, setHasWebsite] = useState(true);
  const [websitePrice, setWebsitePrice] = useState(pricingRules.website_price.toString());
  const [nfcCount, setNfcCount] = useState(2);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customDiscount, setCustomDiscount] = useState('0');
  const [customPriceOverride, setCustomPriceOverride] = useState<string | null>(null);

  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customNotes, setCustomNotes] = useState('');

  // Selected preset bundle
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presetBundles[0]?.id || 'bundle_website_2nfc'
  );

  // Compute addons objects
  const selectedAddons = useMemo(() => {
    return categories
      .filter(c => selectedAddonIds.includes(c.id))
      .map(c => ({ name: c.name, price: c.default_amount || 0 }));
  }, [categories, selectedAddonIds]);

  // Compute calculated values
  const calculation = useMemo(() => {
    if (activeMode === 'bundle') {
      const preset = presetBundles.find(b => b.id === selectedPresetId);
      if (preset) {
        if (preset.custom_amount !== undefined) {
          return {
            websiteAmount: preset.has_website ? pricingRules.website_price : 0,
            nfcAmount: 0,
            addonsAmount: 0,
            bundleDiscount: 0,
            subtotal: preset.custom_amount,
            finalTotal: preset.custom_amount,
            summaryTitle: preset.name,
            notesDescription: `${preset.name} (${preset.description})`,
          };
        }
        return calculateCustomBundle({
          hasWebsite: preset.has_website,
          websitePrice: pricingRules.website_price,
          nfcCount: preset.nfc_count,
          rules: pricingRules,
          customDiscount: 0,
        });
      }
    }

    return calculateCustomBundle({
      hasWebsite,
      websitePrice: parseFloat(websitePrice) || 0,
      nfcCount,
      rules: pricingRules,
      customDiscount: parseFloat(customDiscount) || 0,
      addons: selectedAddons,
    });
  }, [
    activeMode,
    selectedPresetId,
    presetBundles,
    hasWebsite,
    websitePrice,
    nfcCount,
    pricingRules,
    customDiscount,
    selectedAddons,
  ]);

  // Effective price: manual override if typed, otherwise live calculated
  const effectivePrice =
    customPriceOverride !== null
      ? parseFloat(customPriceOverride) || 0
      : calculation.finalTotal;

  const handlePresetSelect = (preset: PresetBundle) => {
    setSelectedPresetId(preset.id);
    setHasWebsite(preset.has_website);
    setNfcCount(preset.nfc_count);
    setCustomPriceOverride(null);
  };

  const handleToggleAddon = (catId: string) => {
    if (selectedAddonIds.includes(catId)) {
      setSelectedAddonIds(selectedAddonIds.filter(id => id !== catId));
    } else {
      setSelectedAddonIds([...selectedAddonIds, catId]);
    }
    setCustomPriceOverride(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectivePrice < 0) return;

    const itemLabel = calculation.summaryTitle;
    const finalNotes = customNotes.trim()
      ? `${customNotes.trim()} (${calculation.notesDescription})`
      : calculation.notesDescription;

    onSave({
      client_id: client.id,
      item_type: itemLabel,
      amount: effectivePrice,
      order_date: orderDate,
      notes: finalNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Create Order &amp; Bundle
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Client: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{client.business_name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Apple Segmented Control: Presets vs Custom Combo */}
          <div className="flex items-center justify-between gap-2">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg flex border border-zinc-200/60 dark:border-zinc-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('bundle');
                  setCustomPriceOverride(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeMode === 'bundle'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Preset Packages
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('custom');
                  setCustomPriceOverride(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeMode === 'custom'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Custom Builder
              </button>
            </div>

            {onOpenPricingSettings && (
              <button
                type="button"
                onClick={onOpenPricingSettings}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium underline cursor-pointer"
              >
                Edit Pricing Tiers
              </button>
            )}
          </div>

          {/* Mode 1: Preset Bundles Selection */}
          {activeMode === 'bundle' && (
            <div className="space-y-2.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Select a package (e.g. 2 NFC + Website, 2 NFC, etc.):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetBundles.map(bundle => {
                  const isSelected = selectedPresetId === bundle.id;
                  const previewTotal = bundle.custom_amount !== undefined
                    ? bundle.custom_amount
                    : calculateCustomBundle({
                        hasWebsite: bundle.has_website,
                        websitePrice: pricingRules.website_price,
                        nfcCount: bundle.nfc_count,
                        rules: pricingRules,
                      }).finalTotal;

                  return (
                    <div
                      key={bundle.id}
                      onClick={() => handlePresetSelect(bundle)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-xs'
                          : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{bundle.name}</span>
                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(previewTotal)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{bundle.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Live Custom Combo Builder (Infinite combinations) */}
          {activeMode === 'custom' && (
            <div className="space-y-3.5 bg-zinc-50/70 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-700/80">
              {/* Website selection */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <input
                    type="checkbox"
                    checked={hasWebsite}
                    onChange={e => {
                      setHasWebsite(e.target.checked);
                      setCustomPriceOverride(null);
                    }}
                    className="w-4 h-4 rounded text-zinc-900 accent-[#0071e3]"
                  />
                  Custom Business Website
                </label>

                {hasWebsite && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={websitePrice}
                      onChange={e => {
                        setWebsitePrice(e.target.value);
                        setCustomPriceOverride(null);
                      }}
                      className="w-24 px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 text-right"
                    />
                  </div>
                )}
              </div>

              {/* NFC Cards Stepper & Volume Rule */}
              <div className="space-y-1.5 pb-3 border-b border-zinc-200/60 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 block">
                      Google NFC Review Cards
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tiered: 1st ${pricingRules.first_nfc_price} · 2nd ${pricingRules.second_nfc_price} · 3rd+ ${pricingRules.additional_nfc_price}/ea
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setNfcCount(Math.max(0, nfcCount - 1));
                          setCustomPriceOverride(null);
                        }}
                        className="px-2.5 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 min-w-[28px] text-center">
                        {nfcCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNfcCount(nfcCount + 1);
                          setCustomPriceOverride(null);
                        }}
                        className="px-2.5 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {nfcCount > 0 && (
                  <div className="text-right text-xs font-mono text-zinc-600 dark:text-zinc-400">
                    Cards Subtotal: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(calculation.nfcAmount)}</span>
                  </div>
                )}
              </div>

              {/* Addons from categories */}
              {categories.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-zinc-200/60 dark:border-zinc-700">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                    Optional Add-ons / Retainers
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {categories
                      .filter(c => c.id !== 'website' && c.id !== 'accessory' && c.id !== 'both')
                      .map(cat => {
                        const isSelected = selectedAddonIds.includes(cat.id);
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => handleToggleAddon(cat.id)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            {cat.name} {cat.default_amount ? `(+$${cat.default_amount})` : ''}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Discount field */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-600 dark:text-zinc-400">Additional Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={customDiscount}
                  onChange={e => {
                    setCustomDiscount(e.target.value);
                    setCustomPriceOverride(null);
                  }}
                  className="w-20 px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 text-right"
                />
              </div>
            </div>
          )}

          {/* Pricing Summary & Final Negotiated Amount */}
          <div className="bg-zinc-100/70 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Items Breakdown:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 text-right">{calculation.summaryTitle}</span>
            </div>

            {calculation.bundleDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-green-700 dark:text-emerald-400 font-medium">
                <span>Bundle Pairing Savings:</span>
                <span>-{formatCurrency(calculation.bundleDiscount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-700">
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">Final Negotiated Price</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Edit directly for custom quote</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={customPriceOverride !== null ? customPriceOverride : effectivePrice}
                  onChange={e => setCustomPriceOverride(e.target.value)}
                  className="w-28 px-2.5 py-1 text-base font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
                />
              </div>
            </div>
          </div>

          {/* Order Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Order Date</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Custom Notes</label>
              <input
                type="text"
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                placeholder="e.g. Paid via Zelle, ship 1 stand to location B..."
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0071e3] text-white text-xs font-medium rounded-lg hover:bg-[#0077ed] transition-colors shadow-xs cursor-pointer"
            >
              Confirm &amp; Log Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
