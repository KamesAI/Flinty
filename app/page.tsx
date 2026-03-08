'use client';

import { useEffect, useState, useMemo } from 'react';
import { Lead, Stats } from '@/lib/types';
import KPICards from '@/components/KPICards';
import LeadsTable from '@/components/LeadsTable';
import FilterBar from '@/components/FilterBar';
import ExportButton from '@/components/ExportButton';

const DEFAULT_STATS: Stats = {
  totalLeads: 0,
  avgScore: 0,
  highScoreLeads: 0,
  sectorDistribution: { Growth: 0, Digital: 0, 'Tech-IA': 0, Unknown: 0 },
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [sectorFilter, setSectorFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [leadsRes, statsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/stats'),
        ]);

        if (!leadsRes.ok || !statsRes.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const { leads: leadsData } = await leadsRes.json();
        const { stats: statsData } = await statsRes.json();

        setLeads(leadsData ?? []);
        setStats(statsData ?? DEFAULT_STATS);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Extract unique cities
  const cities = useMemo(() => {
    const set = new Set(leads.map((l) => l.city).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  // Apply filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (sectorFilter && lead.sector !== sectorFilter) return false;
      if (cityFilter && lead.city !== cityFilter) return false;
      if (lead.score < minScore) return false;
      if (
        searchQuery &&
        !lead.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [leads, sectorFilter, cityFilter, minScore, searchQuery]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse at 50% -20%, rgba(249, 115, 22, 0.07) 0%, #0a0a0a 60%)',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo / Brand */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-black"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
              boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)',
            }}
          >
            K
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">
              Lead Qualifier
            </div>
            <div
              className="text-xs leading-none mt-0.5"
              style={{ opacity: 0.4 }}
            >
              Kames AI
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!loading && !error && (
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ opacity: 0.45 }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: '#10b981' }}
              />
              Live — Google Sheets
            </div>
          )}
          <ExportButton />
        </div>
      </header>

      {/* Main content */}
      <main className="px-8 py-8 max-w-screen-2xl mx-auto">
        {/* Page title */}
        <div className="mb-8">
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ opacity: 0.35, letterSpacing: '3px', color: '#f97316' }}
          >
            Dashboard
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Leads{' '}
            <span className="gradient-text">Qualifiés</span>
          </h1>
          <p className="text-sm mt-1" style={{ opacity: 0.4 }}>
            Agences B2B — scorées et enrichies par IA
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'rgba(249, 115, 22, 0.2)',
                borderTopColor: '#f97316',
              }}
            />
            <div className="text-sm" style={{ opacity: 0.4 }}>
              Chargement depuis Google Sheets...
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            className="kames-card p-8 text-center"
            style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <div className="text-4xl mb-4">⚠</div>
            <div className="text-base font-semibold text-red-400 mb-2">
              Erreur de connexion
            </div>
            <div className="text-sm" style={{ opacity: 0.5 }}>
              {error}
            </div>
            <div className="text-xs mt-4" style={{ opacity: 0.35 }}>
              Vérifiez vos variables d'environnement (.env.local)
            </div>
          </div>
        )}

        {/* Dashboard content */}
        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <KPICards stats={stats} />

            {/* Filter Bar */}
            <FilterBar
              sectorFilter={sectorFilter}
              setSectorFilter={setSectorFilter}
              cityFilter={cityFilter}
              setCityFilter={setCityFilter}
              minScore={minScore}
              setMinScore={setMinScore}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              cities={cities}
              totalFiltered={filteredLeads.length}
              totalLeads={leads.length}
            />

            {/* Leads Table */}
            <LeadsTable leads={filteredLeads} />

            {/* Footer */}
            {leads.length > 0 && (
              <div
                className="mt-4 text-center text-xs"
                style={{ opacity: 0.25 }}
              >
                {filteredLeads.length} leads affichés · Données en temps réel
                depuis Leads_Qualified · Spreadsheet ID:{' '}
                1jLRsF7jMTFFTRdStRpDtilhE01H1NCBQBXMuh1ELOOI
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
