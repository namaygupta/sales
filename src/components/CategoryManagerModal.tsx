import React, { useState } from 'react';
import { Category } from '../types/index';
import {
  Globe,
  Smartphone,
  Layers,
  TrendingUp,
  MapPin,
  Camera,
  Palette,
  Shield,
  Wrench,
  Star,
  Box,
  Tag,
  CreditCard,
  LucideIcon,
} from 'lucide-react';

interface CategoryManagerModalProps {
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
  onClose: () => void;
}

const AVAILABLE_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'globe', label: 'Globe / Web', icon: Globe },
  { id: 'smartphone', label: 'Phone / NFC', icon: Smartphone },
  { id: 'layers', label: 'Bundle / Stack', icon: Layers },
  { id: 'trending-up', label: 'Growth / SEO', icon: TrendingUp },
  { id: 'map-pin', label: 'Location / Maps', icon: MapPin },
  { id: 'camera', label: 'Photo / Video', icon: Camera },
  { id: 'palette', label: 'Design / Logo', icon: Palette },
  { id: 'shield', label: 'Security / Hosting', icon: Shield },
  { id: 'wrench', label: 'Maintenance / Tech', icon: Wrench },
  { id: 'star', label: 'Reviews / VIP', icon: Star },
  { id: 'credit-card', label: 'Payments / Subscriptions', icon: CreditCard },
  { id: 'tag', label: 'Tag / General', icon: Tag },
  { id: 'box', label: 'Package / Box', icon: Box },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  onSaveCategories,
  onClose,
}) => {
  const [list, setList] = useState<Category[]>(categories);
  const [isAdding, setIsAdding] = useState(false);

  // New category form fields
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [description, setDescription] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('99');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString().slice(-4);
    const newCategory: Category = {
      id: newId,
      name: name.trim(),
      icon,
      description: description.trim(),
      default_amount: parseFloat(defaultAmount) || 0,
    };

    const updated = [...list, newCategory];
    setList(updated);
    onSaveCategories(updated);
    setName('');
    setDescription('');
    setDefaultAmount('99');
    setIcon('tag');
    setIsAdding(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'website' || id === 'accessory') {
      return;
    }
    const updated = list.filter(c => c.id !== id);
    setList(updated);
    onSaveCategories(updated);
  };

  const getIconComponent = (iconId: string) => {
    const found = AVAILABLE_ICONS.find(i => i.id === iconId);
    const IconComp = found ? found.icon : Tag;
    return <IconComp className="w-4 h-4 inline-block mr-1 text-zinc-900" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-zinc-300 rounded-sm max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 text-zinc-900 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-tight">Product Categories</h2>
            <p className="text-xs text-zinc-600 font-mono mt-0.5">
              Customize sellable items &amp; add-on offerings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-sm font-mono px-2 py-0.5 border border-zinc-300 rounded-xs hover:bg-zinc-100"
          >
            ✕
          </button>
        </div>

        {/* Existing categories list */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Categories ({list.length})
            </span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="px-3 py-1 bg-zinc-900 text-white text-xs font-semibold uppercase hover:bg-zinc-800 rounded-xs border border-zinc-900 cursor-pointer"
              >
                + Add Category
              </button>
            )}
          </div>

          <div className="border border-zinc-200 rounded-sm divide-y divide-zinc-200">
            {list.map(category => {
              const isCore = category.id === 'website' || category.id === 'accessory';
              return (
                <div key={category.id} className="p-3 flex items-center justify-between hover:bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-zinc-300 rounded-xs bg-zinc-50 flex items-center justify-center">
                      {getIconComponent(category.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900">{category.name}</span>
                        {isCore && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 border border-zinc-300 text-zinc-600 bg-zinc-100 rounded-xs">
                            Core
                          </span>
                        )}
                        {category.default_amount ? (
                          <span className="font-mono text-xs text-zinc-600">
                            ${category.default_amount}
                          </span>
                        ) : null}
                      </div>
                      {category.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{category.description}</p>
                      )}
                    </div>
                  </div>

                  {!isCore && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-xs text-red-600 hover:text-red-900 font-mono hover:underline px-2 py-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Category Form */}
        {isAdding && (
          <form onSubmit={handleAddCategory} className="border border-zinc-300 rounded-sm p-4 bg-zinc-50 space-y-4 mb-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                Define New Category
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs underline font-mono text-zinc-600"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Photography & Aerial Video"
                  className="w-full border border-zinc-300 rounded-sm px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-700">Default Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultAmount}
                  onChange={e => setDefaultAmount(e.target.value)}
                  className="w-full border border-zinc-300 rounded-sm px-3 py-1.5 text-sm font-mono bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-zinc-700">Select Icon</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map(i => {
                  const IconComp = i.icon;
                  const isSelected = icon === i.id;
                  return (
                    <button
                      type="button"
                      key={i.id}
                      onClick={() => setIcon(i.id)}
                      className={`p-2 border rounded-xs flex flex-col items-center gap-1 text-center cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white font-bold'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-800'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      <span className="text-[10px] truncate max-w-full">{i.label.split('/')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-zinc-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. On-site staff headshots and storefront media shoots"
                className="w-full border border-zinc-300 rounded-sm px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 border border-zinc-300 rounded-xs text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-semibold uppercase rounded-xs border border-zinc-900 hover:bg-zinc-800"
              >
                Save Category
              </button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 text-white font-semibold text-sm rounded-sm border border-zinc-900 hover:bg-zinc-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
