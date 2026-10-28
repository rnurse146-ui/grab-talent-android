import React from 'react';
import { Input } from '@/components/ui/input';
import { TALENT_CATEGORIES } from '@/lib/talentCategories';

// Who are you looking to work with? Category(s) + a city, then search.
export default function NetworkFilters({ filters, setFilters, onSearch, onClose, onSkip, firstStep = false }) {
  const toggleCategory = (value) => setFilters(prev => ({
    ...prev,
    categories: prev.categories.includes(value)
      ? prev.categories.filter(c => c !== value)
      : [...prev.categories, value]
  }));

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/60">
      <div className="max-w-lg mx-auto px-6 py-5 space-y-5">
        <div>
          <label className="text-sm text-zinc-300 mb-2 block">Who do you want to work with?</label>
          <div className="flex flex-wrap gap-2">
            {TALENT_CATEGORIES.filter(c => c.value !== 'all').map(cat => {
              const active = filters.categories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl text-base font-medium border transition-all ${
                    active
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-300 mb-1 block">Where</label>
          <Input
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Any location"
            className="bg-zinc-900 border-zinc-700 h-12 text-base"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={firstStep ? onSkip : onClose}
            className="flex-1 py-3 rounded-2xl border border-zinc-700 text-base text-zinc-200 font-semibold hover:border-white hover:text-white transition-colors"
          >
            {firstStep ? 'Show everyone' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="flex-1 py-3 rounded-2xl bg-white text-black text-base font-bold hover:bg-zinc-100 transition-colors"
          >
            {firstStep ? 'Search' : 'Show performers'}
          </button>
        </div>
      </div>
    </div>
  );
}