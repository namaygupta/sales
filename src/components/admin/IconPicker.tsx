import React from 'react';
import {
  Globe,
  Smartphone,
  Layers,
  TrendingUp,
  MapPin,
  ShoppingBag,
  Shield,
  CreditCard,
  Star,
  Tag,
  Code,
  Cpu,
  Sparkles,
  Package,
  FileText,
  CheckCircle2,
  BarChart3,
  LucideIcon,
} from 'lucide-react';

export const ICON_OPTIONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'globe', icon: Globe, label: 'Website' },
  { name: 'smartphone', icon: Smartphone, label: 'Device' },
  { name: 'layers', icon: Layers, label: 'Bundle' },
  { name: 'trending-up', icon: TrendingUp, label: 'Growth' },
  { name: 'map-pin', icon: MapPin, label: 'Location' },
  { name: 'shopping-bag', icon: ShoppingBag, label: 'Product' },
  { name: 'shield', icon: Shield, label: 'Security' },
  { name: 'credit-card', icon: CreditCard, label: 'Payment' },
  { name: 'star', icon: Star, label: 'Review' },
  { name: 'tag', icon: Tag, label: 'Tag' },
  { name: 'code', icon: Code, label: 'Development' },
  { name: 'cpu', icon: Cpu, label: 'Hardware/NFC' },
  { name: 'sparkles', icon: Sparkles, label: 'Feature' },
  { name: 'package', icon: Package, label: 'Package' },
  { name: 'file-text', icon: FileText, label: 'Document' },
  { name: 'check-circle-2', icon: CheckCircle2, label: 'Service' },
  { name: 'bar-chart-3', icon: BarChart3, label: 'Analytics' },
];

export function getIconComponent(iconName: string): LucideIcon {
  const match = ICON_OPTIONS.find(i => i.name === iconName?.toLowerCase());
  return match ? match.icon : Tag;
}

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl max-h-36 overflow-y-auto">
      {ICON_OPTIONS.map(opt => {
        const IconComp = opt.icon;
        const isSelected = value === opt.name;
        return (
          <button
            key={opt.name}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.name)}
            className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
              isSelected
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <IconComp className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};
