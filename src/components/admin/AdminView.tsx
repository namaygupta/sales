import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  Boxes,
  LayoutDashboard,
  Coins,
  Database,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Download,
  Upload,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Category, InventoryItem, DashboardConfig, PricingRules, PresetBundle } from '../../types/index';
import { IconPicker, getIconComponent } from './IconPicker';
import { formatCurrency } from '../../lib/calculations';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface AdminViewProps {
  categories: Category[];
  inventoryItems: InventoryItem[];
  dashboardConfig: DashboardConfig;
  pricingRules: PricingRules;
  presetBundles: PresetBundle[];
  onSaveCategory: (cat: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onSaveInventoryItem: (item: InventoryItem | Omit<InventoryItem, 'id' | 'updated_at'>) => Promise<void>;
  onDeleteInventoryItem: (id: string) => Promise<void>;
  onSaveDashboardConfig: (cfg: DashboardConfig) => Promise<void>;
  onSavePricingRules: (rules: PricingRules) => Promise<void>;
  onSaveBundles: (bundles: PresetBundle[]) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (json: string) => Promise<boolean>;
  onLockSession: () => void;
}

type AdminSubTab = 'categories' | 'inventory' | 'dashboard' | 'pricing' | 'sync';

export const AdminView: React.FC<AdminViewProps> = ({
  categories,
  inventoryItems,
  dashboardConfig,
  pricingRules,
  presetBundles,
  onSaveCategory,
  onDeleteCategory,
  onSaveInventoryItem,
  onDeleteInventoryItem,
  onSaveDashboardConfig,
  onSavePricingRules,
  onSaveBundles,
  onExportBackup,
  onImportBackup,
  onLockSession,
}) => {
  const [subTab, setSubTab] = useState<AdminSubTab>('categories');

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catId, setCatId] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catDefaultAmount, setCatDefaultAmount] = useState<number | ''>('');
  const [catCostAmount, setCatCostAmount] = useState<number | ''>(0);
  const [catIcon, setCatIcon] = useState('tag');

  // Inventory Edit State
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [isNewInventory, setIsNewInventory] = useState(false);
  const [invName, setInvName] = useState('');
  const [invCategoryId, setInvCategoryId] = useState('');
  const [invQuantity, setInvQuantity] = useState<number>(0);
  const [invThreshold, setInvThreshold] = useState<number>(5);
  const [invNotes, setInvNotes] = useState('');

  // Dashboard Config State
  const [localDashConfig, setLocalDashConfig] = useState<DashboardConfig>(dashboardConfig);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Pricing Rules State
  const [localRules, setLocalRules] = useState<PricingRules>(pricingRules);
  const [pricingSavedNotice, setPricingSavedNotice] = useState(false);

  // Category Handlers
  const handleOpenAddCategory = () => {
    setIsNewCategory(true);
    setEditingCategory(null);
    setCatName('');
    setCatId('');
    setCatDescription('');
    setCatDefaultAmount('');
    setCatCostAmount(0);
    setCatIcon('tag');
  };

  const handleOpenEditCategory = (cat: Category) => {
    setIsNewCategory(false);
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatId(cat.id);
    setCatDescription(cat.description || '');
    setCatDefaultAmount(cat.default_amount != null ? cat.default_amount : '');
    setCatCostAmount(cat.cost_amount != null ? cat.cost_amount : 0);
    setCatIcon(cat.icon || 'tag');
  };

  const handleSaveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const finalId = catId.trim() || catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const categoryObj: Category = {
      id: finalId,
      name: catName.trim(),
      description: catDescription.trim() || undefined,
      default_amount: catDefaultAmount !== '' ? Number(catDefaultAmount) : undefined,
      cost_amount: catCostAmount !== '' ? Number(catCostAmount) : 0,
      icon: catIcon,
    };
    await onSaveCategory(categoryObj);
    setEditingCategory(null);
    setIsNewCategory(false);
  };

  // Inventory Handlers
  const handleOpenAddInventory = () => {
    setIsNewInventory(true);
    setEditingInventory(null);
    setInvName('');
    setInvCategoryId('');
    setInvQuantity(0);
    setInvThreshold(5);
    setInvNotes('');
  };

  const handleOpenEditInventory = (item: InventoryItem) => {
    setIsNewInventory(false);
    setEditingInventory(item);
    setInvName(item.item_name);
    setInvCategoryId(item.category_id || '');
    setInvQuantity(item.quantity_on_hand);
    setInvThreshold(item.reorder_threshold);
    setInvNotes(item.notes || '');
  };

  const handleSaveInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) return;
    if (editingInventory) {
      await onSaveInventoryItem({
        ...editingInventory,
        item_name: invName.trim(),
        category_id: invCategoryId || null,
        quantity_on_hand: invQuantity,
        reorder_threshold: invThreshold,
        notes: invNotes.trim() || null,
      });
    } else {
      await onSaveInventoryItem({
        item_name: invName.trim(),
        category_id: invCategoryId || null,
        quantity_on_hand: invQuantity,
        reorder_threshold: invThreshold,
        notes: invNotes.trim() || null,
      });
    }
    setEditingInventory(null);
    setIsNewInventory(false);
  };

  const handleQuickAdjustQuantity = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity_on_hand + delta);
    await onSaveInventoryItem({
      ...item,
      quantity_on_hand: newQty,
    });
  };

  // Dashboard Config Toggle
  const handleToggleWidget = async (key: keyof DashboardConfig) => {
    const updated = {
      ...localDashConfig,
      [key]: !localDashConfig[key],
    };
    setLocalDashConfig(updated);
    await onSaveDashboardConfig(updated);
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 2000);
  };

  // Pricing Rules Save
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSavePricingRules(localRules);
    setPricingSavedNotice(true);
    setTimeout(() => setPricingSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-heading">
            Admin Workspace
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage product offerings, unit costs, inventory thresholds, and dashboard preferences.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSubTab('categories')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subTab === 'categories'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('inventory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subTab === 'inventory'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory ({inventoryItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subTab === 'dashboard'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard Widgets</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pricing')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subTab === 'pricing'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Pricing Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('sync')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subTab === 'sync'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data &amp; Sync</span>
          </button>
        </div>
      </div>

      {/* 1. CATEGORIES CRUD */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Categories &amp; Products
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Products and services available for client orders. Live-synced to Supabase categories table.
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAddCategory}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </motion.button>
          </div>

          {categories.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              <Package className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No categories defined yet.</p>
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="mt-3 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categories.map(cat => {
                const IconComp = getIconComponent(cat.icon);
                const margin =
                  cat.default_amount != null && cat.cost_amount != null
                    ? cat.default_amount - (cat.cost_amount || 0)
                    : null;
                return (
                  <div
                    key={cat.id}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                              {cat.name}
                            </h3>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                              id: {cat.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                onDeleteCategory(cat.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 block">
                          Price / Cost
                        </span>
                        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {cat.default_amount != null
                            ? formatCurrency(cat.default_amount)
                            : 'Custom'}
                        </span>
                        {cat.cost_amount != null && cat.cost_amount > 0 && (
                          <span className="font-mono text-zinc-400 dark:text-zinc-500 text-[11px] ml-1">
                            (Cost: {formatCurrency(cat.cost_amount)})
                          </span>
                        )}
                      </div>

                      {margin != null && margin > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 block">
                            Net Margin
                          </span>
                          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                            +{formatCurrency(margin)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add / Edit Category Modal */}
          {(isNewCategory || editingCategory) && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    {isNewCategory ? 'Create New Category' : `Edit "${editingCategory?.name}"`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setIsNewCategory(false);
                    }}
                    className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Category / Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={e => {
                        setCatName(e.target.value);
                        if (isNewCategory && !catId) {
                          setCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                        }
                      }}
                      placeholder="e.g. NFC Stand Pack or Custom Web App"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Unique Identifier (Slug) *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isNewCategory}
                      value={catId}
                      onChange={e => setCatId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. nfc_pack"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Default Sale Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={catDefaultAmount}
                        onChange={e => setCatDefaultAmount(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 1500"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Unit Cost Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={catCostAmount}
                        onChange={e => setCatCostAmount(e.target.value ? Number(e.target.value) : 0)}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={catDescription}
                      onChange={e => setCatDescription(e.target.value)}
                      placeholder="Details of what is included in this category..."
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Select Icon
                    </label>
                    <IconPicker value={catIcon} onChange={setCatIcon} />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setIsNewCategory(false);
                      }}
                      className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white rounded-xl shadow-xs cursor-pointer"
                    >
                      {isNewCategory ? 'Create Category' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* 2. INVENTORY MANAGEMENT CRUD */}
      {subTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Physical Inventory &amp; Stock
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Track stock counts and reorder thresholds for Google NFC cards, stands, acrylics, and hardware.
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAddInventory}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock Item</span>
            </motion.button>
          </div>

          {inventoryItems.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              <Boxes className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No inventory items logged yet.</p>
              <button
                type="button"
                onClick={handleOpenAddInventory}
                className="mt-3 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Add First Inventory Item
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">In Stock</th>
                      <th className="px-4 py-3">Reorder Threshold</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {inventoryItems.map(item => {
                      const isLow = item.quantity_on_hand <= item.reorder_threshold;
                      const matchedCat = categories.find(c => c.id === item.category_id);
                      return (
                        <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/60 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                              {item.item_name}
                            </span>
                            {item.notes && (
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block line-clamp-1">
                                {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {matchedCat?.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-bold text-sm ${
                                  isLow ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {item.quantity_on_hand}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjustQuantity(item, -1)}
                                  className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-mono text-xs cursor-pointer"
                                  title="Decrease"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjustQuantity(item, 1)}
                                  className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-mono text-xs cursor-pointer"
                                  title="Increase"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-400">
                            {item.reorder_threshold} units
                          </td>
                          <td className="px-4 py-3">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                <Check className="w-2.5 h-2.5" />
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditInventory(item)}
                                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete inventory item "${item.item_name}"?`)) {
                                    onDeleteInventoryItem(item.id);
                                  }
                                }}
                                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add / Edit Inventory Modal */}
          {(isNewInventory || editingInventory) && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    {isNewInventory ? 'Add Inventory Item' : `Edit "${editingInventory?.item_name}"`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInventory(null);
                      setIsNewInventory(false);
                    }}
                    className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveInventorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={invName}
                      onChange={e => setInvName(e.target.value)}
                      placeholder="e.g. Google NFC Acrylic Stand (Black)"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Linked Category (Optional)
                    </label>
                    <select
                      value={invCategoryId}
                      onChange={e => setInvCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">None / General Stock</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Quantity on Hand
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={invQuantity}
                        onChange={e => setInvQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Reorder Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={invThreshold}
                        onChange={e => setInvThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Notes / Supplier SKU
                    </label>
                    <textarea
                      rows={2}
                      value={invNotes}
                      onChange={e => setInvNotes(e.target.value)}
                      placeholder="Supplier link, batch code, or shelf location..."
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingInventory(null);
                        setIsNewInventory(false);
                      }}
                      className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white rounded-xl shadow-xs cursor-pointer"
                    >
                      {isNewInventory ? 'Add Item' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* 3. DASHBOARD CONFIG */}
      {subTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Dashboard Widget Preferences
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose which analytical cards, charts, and modules are visible by default on the General dashboard.
              </p>
            </div>
            {configSavedNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved to Supabase
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3.5">
            {[
              {
                key: 'showQuickStats' as keyof DashboardConfig,
                title: 'Quick Business Metrics Row',
                desc: 'Summary tiles for total revenue, active clients, conversion rate, and pending pipeline.',
              },
              {
                key: 'showRevenueChart' as keyof DashboardConfig,
                title: 'Revenue Over Time Chart',
                desc: 'Interactive Recharts line chart showing daily, weekly, or monthly incoming revenue.',
              },
              {
                key: 'showProfitChart' as keyof DashboardConfig,
                title: 'Profit & Net Margin Chart',
                desc: 'Computes total revenue minus category unit costs over time.',
              },
              {
                key: 'showTopSellers' as keyof DashboardConfig,
                title: 'Top Categories & Products Bar Chart',
                desc: 'Ranked performance bar chart comparing revenue and profit per category.',
              },
              {
                key: 'showTopClients' as keyof DashboardConfig,
                title: 'Top Spending Clients Ranking',
                desc: 'Ranked leaderboard of highest value client accounts.',
              },
              {
                key: 'showCalendar' as keyof DashboardConfig,
                title: 'Monthly Order & Due-Date Calendar',
                desc: 'Month grid displaying order dates and task due dates with day inspector.',
              },
              {
                key: 'showPendingTasks' as keyof DashboardConfig,
                title: 'Pending Follow-ups & Task List',
                desc: 'Client check-in calls, onboarding help, and custom tasks.',
              },
              {
                key: 'showInventoryAlerts' as keyof DashboardConfig,
                title: 'Low Inventory Reorder Banner',
                desc: 'Automatic passive alert for stock items below their reorder threshold.',
              },
            ].map(item => {
              const isChecked = localDashConfig[item.key] !== false;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800 transition-colors"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleWidget(item.key)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      isChecked ? 'bg-zinc-900 dark:bg-sky-600' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <motion.div
                      layout
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PRICING RULES & BUNDLE DEFAULTS */}
      {subTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Pricing Rules &amp; Tiered Math
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure tiered NFC card rates, website base cost, and automatic bundle discounts.
              </p>
            </div>
            {pricingSavedNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSavePricing} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Website Base Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localRules.website_price}
                  onChange={e =>
                    setLocalRules(prev => ({
                      ...prev,
                      website_price: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  1st NFC Card Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localRules.first_nfc_price}
                  onChange={e =>
                    setLocalRules(prev => ({
                      ...prev,
                      first_nfc_price: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  2nd NFC Card Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localRules.second_nfc_price}
                  onChange={e =>
                    setLocalRules(prev => ({
                      ...prev,
                      second_nfc_price: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  3rd+ NFC Card Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localRules.additional_nfc_price}
                  onChange={e =>
                    setLocalRules(prev => ({
                      ...prev,
                      additional_nfc_price: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bundle Discount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localRules.bundle_discount}
                  onChange={e =>
                    setLocalRules(prev => ({
                      ...prev,
                      bundle_discount: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Pricing Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. DATA & SUPABASE SYNC */}
      {subTab === 'sync' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
              Data &amp; Cloud Database
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Technical connection details and backup exports live exclusively in Admin.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {isSupabaseConfigured
                      ? 'Supabase Cloud Database Connected'
                      : 'Local Storage Mode'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isSupabaseConfigured
                      ? 'All clients, orders, inventory, and tasks write directly to PostgreSQL.'
                      : 'Credentials not detected; operating in local browser cache.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Backup export and import */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExportBackup}
                className="px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200/60 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Complete JSON Backup</span>
              </button>

              <label className="px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200/60 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async event => {
                        const content = event.target?.result as string;
                        if (content) {
                          const success = await onImportBackup(content);
                          if (success) {
                            alert('Backup imported successfully.');
                          } else {
                            alert('Failed to parse backup file.');
                          }
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={onLockSession}
                className="ml-auto px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl border border-red-200/60 dark:border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Workspace Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
