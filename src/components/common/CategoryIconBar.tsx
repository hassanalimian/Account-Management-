import React from 'react';
import {
  Boxes,
  Tag,
  Gem,
  Cpu,
  Shirt,
  Utensils,
  Wrench,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Package,
  Layers,
  Flame,
  Watch,
  Folder,
} from 'lucide-react';
import { ProductCategory } from '../../types.ts';

interface CategoryIconBarProps {
  categories: ProductCategory[];
  selectedCategoryId: string; // 'all' or category id as string
  onSelectCategory: (catId: string) => void;
  productCounts?: Record<number | string, number>;
  totalCount?: number;
  compact?: boolean;
}

// Map keywords in category name to relevant icons (reduced to approx 33% size)
export function getCategoryIconElement(name: string, className: string = 'w-3.5 h-3.5') {
  const lower = name.toLowerCase();
  if (lower.includes('all') || lower.includes('entire')) return <Boxes className={className} />;
  if (lower.includes('gold') || lower.includes('jewel') || lower.includes('gem') || lower.includes('diamond')) {
    return <Gem className={className} />;
  }
  if (lower.includes('tech') || lower.includes('elec') || lower.includes('device') || lower.includes('hardware') || lower.includes('computer')) {
    return <Cpu className={className} />;
  }
  if (lower.includes('cloth') || lower.includes('wear') || lower.includes('apparel') || lower.includes('fashion')) {
    return <Shirt className={className} />;
  }
  if (lower.includes('food') || lower.includes('drink') || lower.includes('grocery') || lower.includes('snack') || lower.includes('cafe')) {
    return <Utensils className={className} />;
  }
  if (lower.includes('tool') || lower.includes('repair') || lower.includes('part') || lower.includes('motor')) {
    return <Wrench className={className} />;
  }
  if (lower.includes('book') || lower.includes('station') || lower.includes('paper')) {
    return <BookOpen className={className} />;
  }
  if (lower.includes('watch') || lower.includes('clock') || lower.includes('time')) {
    return <Watch className={className} />;
  }
  if (lower.includes('luxury') || lower.includes('special') || lower.includes('feature')) {
    return <Sparkles className={className} />;
  }
  if (lower.includes('sale') || lower.includes('hot') || lower.includes('popular')) {
    return <Flame className={className} />;
  }
  if (lower.includes('bag') || lower.includes('retail') || lower.includes('merch')) {
    return <ShoppingBag className={className} />;
  }
  if (lower.includes('general') || lower.includes('inventory')) {
    return <Package className={className} />;
  }
  return <Tag className={className} />;
}

export const CategoryIconBar: React.FC<CategoryIconBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  productCounts = {},
  totalCount,
  compact = false,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {/* 'All' category button */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 flex items-center space-x-2 px-2.5 py-1.5 rounded-xl transition-all ${
            selectedCategoryId === 'all'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 border border-indigo-600'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 shadow-2xs'
          }`}
          title="Show All Products"
        >
          {/* Scalable Icon container */}
          <div
            className={`rounded-md flex items-center justify-center shrink-0 ${
              selectedCategoryId === 'all' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}
            style={{
              width: 'calc(1.25rem * var(--app-icon-scale, 1))',
              height: 'calc(1.25rem * var(--app-icon-scale, 1))',
            }}
          >
            <Boxes className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="block font-semibold leading-tight whitespace-nowrap text-xs">All Categories</span>
            {totalCount !== undefined && (
              <span
                className={`text-[10.5px] font-medium block leading-none mt-0.5 ${
                  selectedCategoryId === 'all' ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                {totalCount} items
              </span>
            )}
          </div>
        </button>

        {/* Category icons */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id.toString();
          const count = productCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id.toString())}
              className={`shrink-0 flex items-center space-x-2 px-2.5 py-1.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 border border-indigo-600'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 shadow-2xs'
              }`}
              title={`Show ${cat.name}`}
            >
              {/* Scalable Icon container */}
              <div
                className={`rounded-md flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
                style={{
                  width: 'calc(1.25rem * var(--app-icon-scale, 1))',
                  height: 'calc(1.25rem * var(--app-icon-scale, 1))',
                }}
              >
                {getCategoryIconElement(cat.name, 'w-3.5 h-3.5')}
              </div>
              <div className="text-left">
                <span className="block font-semibold leading-tight whitespace-nowrap text-xs">{cat.name}</span>
                <span
                  className={`text-[10.5px] font-medium block leading-none mt-0.5 ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {count} items
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
