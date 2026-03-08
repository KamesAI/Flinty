'use client';

import { Sector } from '@/lib/types';

interface FilterBarProps {
  sectorFilter: string;
  setSectorFilter: (v: string) => void;
  cityFilter: string;
  setCityFilter: (v: string) => void;
  minScore: number;
  setMinScore: (v: number) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  cities: string[];
  totalFiltered: number;
  totalLeads: number;
}

const inputBase =
  'bg-transparent border rounded-lg px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-orange-500/60';
const inputBorder = 'border-white/10 hover:border-white/20';

export default function FilterBar({
  sectorFilter,
  setSectorFilter,
  cityFilter,
  setCityFilter,
  minScore,
  setMinScore,
  searchQuery,
  setSearchQuery,
  cities,
  totalFiltered,
  totalLeads,
}: FilterBarProps) {
  const sectors: Sector[] = ['Growth', 'Digital', 'Tech-IA'];

  return (
    <div
      className="kames-card p-4 mb-6"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ opacity: 0.4 }}
          >
            ⌕
          </span>
          <input
            type="text"
            placeholder="Rechercher une agence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 ${inputBase} ${inputBorder}`}
          />
        </div>

        {/* Secteur */}
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className={`${inputBase} ${inputBorder} min-w-36`}
          style={{ backgroundColor: '#0f0f0f' }}
        >
          <option value="">Tous les secteurs</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Ville */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={`${inputBase} ${inputBorder} min-w-36`}
          style={{ backgroundColor: '#0f0f0f' }}
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Score minimum */}
        <div className="flex items-center gap-2 min-w-44">
          <span className="text-xs whitespace-nowrap" style={{ opacity: 0.5 }}>
            Score min
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f97316 ${minScore}%, rgba(255,255,255,0.1) ${minScore}%)`,
            }}
          />
          <span
            className="text-sm font-bold min-w-8 text-right"
            style={{ color: '#f97316' }}
          >
            {minScore}
          </span>
        </div>

        {/* Reset */}
        {(sectorFilter || cityFilter || minScore > 0 || searchQuery) && (
          <button
            onClick={() => {
              setSectorFilter('');
              setCityFilter('');
              setMinScore(0);
              setSearchQuery('');
            }}
            className="text-xs px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/5"
            style={{ opacity: 0.5, border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Réinitialiser
          </button>
        )}

        {/* Compteur */}
        <div
          className="ml-auto text-xs font-medium whitespace-nowrap"
          style={{ opacity: 0.45 }}
        >
          <span style={{ color: '#f97316', fontWeight: 700 }}>
            {totalFiltered}
          </span>{' '}
          / {totalLeads} leads
        </div>
      </div>
    </div>
  );
}
