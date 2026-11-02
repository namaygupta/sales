import React, { useState, useMemo } from 'react';
import { Client, DealType, Category, PricingRules, PresetBundle } from '../types/index';
import { calculateCustomBundle, formatCurrency } from '../lib/calculations';

interface AddClientFormProps {
  onSave: (clientData: Omit<Client, 'id' | 'created_at'>, initialOrder?: { item_type: string; amount: number; notes: string }) => void;
  onCancel: () => void;
  categories: Category[];
  pricingRules: PricingRules;
  presetBundles: PresetBundle[];
  initialData?: Partial<Client>;
}

export const AddClientForm: React.FC<AddClientFormProps> = ({
  onSave,
  onCancel,
  categories,
  pricingRules,
  presetBundles,
  initialData,
}) => {
  const [businessName, setBusinessName] = useState(initialData?.business_name || '');
  const [contactName, setContactName] = useState(initialData?.contact_name || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url || '');
  const [dealType, setDealType] = useState<DealType>(initialData?.deal_type || 'one_time_flat');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Initial order builder state
  const [logInitialOrder, setLogInitialOrder] = useState(!initialData?.business_name);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presetBundles[0]?.id || 'bundle_website_1nfc'
  );
  const [nfcCount, setNfcCount] = useState(1);
  const [hasWebsite, setHasWebsite] = useState(true);
  const [customPriceOverride, setCustomPriceOverride] = useState<string | null>(null);

  // Derive purchase flags from current order configuration
  const boughtWebsite = initialData?.bought_website ?? (logInitialOrder ? hasWebsite : false);
  const boughtAccessory = initialData?.bought_accessory ?? (logInitialOrder ? nfcCount > 0 : false);

  const currentPreset = presetBundles.find(b => b.id === selectedPresetId);

  const calculation = useMemo(() => {
    return calculateCustomBundle({
      hasWebsite,
      websitePrice: pricingRules.website_price,
      nfcCount,
      rules: pricingRules,
    });
  }, [hasWebsite, nfcCount, pricingRules]);

  const effectivePrice =
    customPriceOverride !== null
      ? parseFloat(customPriceOverride) || 0
      : calculation.finalTotal;

  const handleSelectPreset = (preset: PresetBundle) => {
    setSelectedPresetId(preset.id);
    setHasWebsite(preset.has_website);
    setNfcCount(preset.nfc_count);
    if (preset.custom_amount !== undefined) {
      setCustomPriceOverride(preset.custom_amount.toString());
    } else {
      setCustomPriceOverride(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    const clientPayload: Omit<Client, 'id' | 'created_at'> = {
      business_name: businessName.trim(),
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      website_url: websiteUrl.trim(),
      bought_website: boughtWebsite,
      bought_accessory: boughtAccessory,
      deal_type: dealType,
      notes: notes.trim(),
    };

    let orderPayload: { item_type: string; amount: number; notes: string } | undefined = undefined;
    if (logInitialOrder && effectivePrice > 0) {
      orderPayload = {
        item_type: calculation.summaryTitle,
        amount: effectivePrice,
        notes: calculation.notesDescription,
      };
    }

    onSave(clientPayload, orderPayload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {initialData?.business_name ? 'Edit Client Details' : 'Add New Client'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Apex Auto Body"
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">Contact Person</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Dave Miller"
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">Phone Number</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="e.g. (555) 123-4567"
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="e.g. dave@apexautobody.com"
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">Client Website URL</label>
              <input
                type="text"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://apexautobody.com"
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
              />
            </div>
          </div>

          {/* Deal Structure */}
          <div>
            <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">Deal Structure</label>
            <select
              value={dealType}
              onChange={e => setDealType(e.target.value as DealType)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            >
              <option value="one_time_flat">one_time_flat (Single upfront payment)</option>
              <option value="recurring">recurring (Monthly hosting / maintenance / SEO)</option>
              <option value="one_time_upsell_later">one_time_upsell_later (Initial buy with repeat reorder potential)</option>
            </select>
          </div>

          {/* Initial Order & Bundle Builder */}
          {!initialData?.business_name && (
            <div className="bg-zinc-50/80 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logInitialOrder}
                    onChange={e => setLogInitialOrder(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-900 accent-[#0071e3]"
                  />
                  Log Initial Package / Sale
                </label>
              </div>

              {logInitialOrder && (
                <div className="space-y-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-700">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Choose package combination:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {presetBundles.map(bundle => {
                      const isSelected = selectedPresetId === bundle.id;
                      return (
                        <button
                          type="button"
                          key={bundle.id}
                          onClick={() => handleSelectPreset(bundle)}
                          className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0071e3] bg-[#0071e3]/10 font-semibold text-sky-600 dark:text-sky-400'
                              : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          <div className="truncate">{bundle.name}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Micro Stepper for Customization */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-850 p-3 rounded-lg border border-zinc-200/70 dark:border-zinc-700 text-xs">
                    <label className="flex items-center gap-1.5 font-medium cursor-pointer text-zinc-800 dark:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={hasWebsite}
                        onChange={e => {
                          setHasWebsite(e.target.checked);
                          setCustomPriceOverride(null);
                        }}
                        className="w-3.5 h-3.5 rounded text-zinc-900 accent-[#0071e3]"
                      />
                      Website Included
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">NFC Cards:</span>
                      <div className="flex items-center border border-zinc-300 dark:border-zinc-600 rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setNfcCount(Math.max(0, nfcCount - 1));
                            setCustomPriceOverride(null);
                          }}
                          className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-mono font-bold text-center min-w-[20px] text-zinc-900 dark:text-zinc-100">
                          {nfcCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNfcCount(nfcCount + 1);
                            setCustomPriceOverride(null);
                          }}
                          className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-bold">
                      <span className="text-zinc-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={customPriceOverride !== null ? customPriceOverride : effectivePrice}
                        onChange={e => setCustomPriceOverride(e.target.value)}
                        className="w-20 px-1.5 py-0.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-right font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-medium mb-1 text-xs text-zinc-700 dark:text-zinc-300">Internal Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Lead details, custom requests, delivery timelines..."
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            />
          </div>

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
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
