import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { TALENT_CATEGORIES } from '@/lib/talentCategories';

// Who are you looking to work with? Several categories + several locations, then search.
export default function NetworkFilters({ filters, setFilters, onSearch, onClose, onSkip, firstStep = false }) {
  const [cityDraft, setCityDraft] = useState('');

  const toggleCategory = (value) => setFilters(prev => ({
    ...prev,
    categories: prev.categories.includes(value)
      ? prev.categories.filter(c => c !== value)
      : [...prev.categories, value]
  }));

  const addCity = () => {
    const value = cityDraft.trim();
    if (!value) return;
    setFilters(prev => prev.cities.some(c => c.toLowerCase() === value.toLowerCase())
      ? prev
      : { ...prev, cities: [...prev.cities, value] });
    setCityDraft('');
  };

  const removeCity = (city) => setFilters(prev => ({
    ...prev,
    cities: prev.cities.filter(c => c !== city)
  }));

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/60">
      <div className="max-w-lg mx-auto px-6 py-5 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-zinc-300">Who do you want to work with?</label>
            {filters.categories.length > 0 && (
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                className="text-xs text-zinc-400 underline"
              >
                Clear ({filters.categories.length})
              </button>
            )}
          </div>
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
          {filters.cities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {filters.cities.map(city => (
                <span
                  key={city}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-purple-600 text-white text-sm font-medium"
                >
                  {city}
                  <button
                    type="button"
                    onClick={() => removeCity(city)}
                    aria-label={`Remove ${city}`}
                    className="p-0.5 rounded-full hover:bg-black/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
              placeholder={filters.cities.length ? 'Add another location' : 'Any location'}
              className="bg-zinc-900 border-zinc-700 h-12 text-base"
            />
            <button
              type="button"
              onClick={addCity}
              disabled={!cityDraft.trim()}
              className="px-4 rounded-xl border border-zinc-700 text-base font-semibold text-zinc-200 hover:border-white hover:text-white disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
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