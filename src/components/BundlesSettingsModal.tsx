import React, { useState } from 'react';
import { PricingRules, PresetBundle } from '../types/index';
import { DEFAULT_PRICING_RULES } from '../lib/calculations';

interface BundlesSettingsModalProps {
  rules: PricingRules;
  bundles: PresetBundle[];
  onSave: (rules: PricingRules, bundles: PresetBundle[]) => void;
  onClose: () => void;
}

export const BundlesSettingsModal: React.FC<BundlesSettingsModalProps> = ({
  rules,
  bundles,
  onSave,
  onClose,
}) => {
  const [currentRules, setCurrentRules] = useState<PricingRules>({ ...rules });
  const [bundleList, setBundleList] = useState<PresetBundle[]>([...bundles]);
  const [activeTab, setActiveTab] = useState<'rules' | 'presets'>('rules');

  // New preset form
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetWebsite, setNewPresetWebsite] = useState(true);
  const [newPresetNfcCount, setNewPresetNfcCount] = useState(2);
  const [newPresetPrice, setNewPresetPrice] = useState('');

  const handleSave = () => {
    onSave(currentRules, bundleList);
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm('Reset pricing rules to defaults ($1500 website, $79 1st NFC, $60 2nd NFC, $40 3rd+ NFC)?')) {
      setCurrentRules(DEFAULT_PRICING_RULES);
    }
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newBundle: PresetBundle = {
      id: `bundle_${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim(),
      has_website: newPresetWebsite,
      nfc_count: Math.max(0, newPresetNfcCount),
      custom_amount: newPresetPrice ? parseFloat(newPresetPrice) : undefined,
      tags: ['Custom'],
    };

    setBundleList([...bundleList, newBundle]);
    setNewPresetName('');
    setNewPresetDesc('');
    setNewPresetWebsite(true);
    setNewPresetNfcCount(2);
    setNewPresetPrice('');
    setIsAddingPreset(false);
  };

  const handleDeletePreset = (id: string) => {
    setBundleList(bundleList.filter(b => b.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
              Pricing Rules &amp; Bundles
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customize tier pricing, multi-NFC volume discounts, and preset packages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 flex items-center justify-center text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Apple HIG Segmented Control */}
        <div className="my-4">
          <div className="bg-zinc-100 p-0.5 rounded-lg flex max-w-xs border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'rules'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Base Pricing Tiers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'presets'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Preset Bundles ({bundleList.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-zinc-50/80 p-4 rounded-xl border border-zinc-200/70 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Google NFC Review Cards (Tiered Rules)
              </h3>
              <p className="text-xs text-zinc-600">
                Every subsequent card can have distinct discounted pricing (e.g. 1st card $79, 2nd card $60, every 3rd+ card $40).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">1st NFC Card</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-zinc-400 text-sm font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={currentRules.first_nfc_price}
                      onChange={e =>
                        setCurrentRules({ ...currentRules, first_nfc_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">2nd NFC Card</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-zinc-400 text-sm font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={currentRules.second_nfc_price}
                      onChange={e =>
                        setCurrentRules({ ...currentRules, second_nfc_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">3rd+ Card Each</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-zinc-400 text-sm font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={currentRules.additional_nfc_price}
                      onChange={e =>
                        setCurrentRules({ ...currentRules, additional_nfc_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50/80 p-4 rounded-xl border border-zinc-200/70 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Website &amp; Bundle Savings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Default Website Base Price</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-zinc-400 text-sm font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={currentRules.website_price}
                      onChange={e =>
                        setCurrentRules({ ...currentRules, website_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Bundle Discount (Website + NFC)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-zinc-400 text-sm font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={currentRules.bundle_discount}
                      onChange={e =>
                        setCurrentRules({ ...currentRules, bundle_discount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-zinc-500 hover:text-zinc-800 underline font-mono"
              >
                Reset to default values
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">Saved Combination Presets</span>
              {!isAddingPreset && (
                <button
                  type="button"
                  onClick={() => setIsAddingPreset(true)}
                  className="px-3 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  + Add Preset
                </button>
              )}
            </div>

            <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden bg-white">
              {bundleList.map(bundle => (
                <div key={bundle.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900">{bundle.name}</span>
                      {bundle.tags?.map(t => (
                        <span key={t} className="text-[10px] font-medium px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {bundle.has_website ? 'Website + ' : ''}
                      {bundle.nfc_count} NFC card{bundle.nfc_count === 1 ? '' : 's'}
                      {bundle.custom_amount ? ` · Fixed: $${bundle.custom_amount}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(bundle.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-mono px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {isAddingPreset && (
              <form onSubmit={handleAddPreset} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-800">New Combination Preset</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingPreset(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Preset Name *</label>
                    <input
                      type="text"
                      required
                      value={newPresetName}
                      onChange={e => setNewPresetName(e.target.value)}
                      placeholder="e.g. 3 NFC Stand Kit"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Fixed Price (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      value={newPresetPrice}
                      onChange={e => setNewPresetPrice(e.target.value)}
                      placeholder="Leave blank for auto-pricing"
                      className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPresetWebsite}
                      onChange={e => setNewPresetWebsite(e.target.checked)}
                      className="w-4 h-4 rounded text-zinc-900 accent-zinc-900"
                    />
                    Includes Website Build
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">NFC Cards:</span>
                    <div className="flex items-center border border-zinc-300 rounded-md bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setNewPresetNfcCount(Math.max(0, newPresetNfcCount - 1))}
                        className="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold min-w-[24px] text-center">
                        {newPresetNfcCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewPresetNfcCount(newPresetNfcCount + 1)}
                        className="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800"
                  >
                    Save Preset
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-lg hover:bg-[#0077ed] transition-colors shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
