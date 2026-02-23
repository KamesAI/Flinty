'use client';

import { Stats, Sector } from '@/lib/types';

interface KPICardsProps {
  stats: Stats;
}

function getTopSector(dist: Record<Sector, number>): string {
  const entries = Object.entries(dist) as [Sector, number][];
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]);
  return top?.[0] ?? '—';
}

const sectorColors: Record<Sector, string> = {
  Growth: '#10b981',
  Digital: '#3b82f6',
  'Tech-IA': '#a855f7',
  Unknown: '#6b7280',
};

export default function KPICards({ stats }: KPICardsProps) {
  const topSector = getTopSector(stats.sectorDistribution);

  const cards = [
    {
      label: 'TOTAL LEADS',
      value: stats.totalLeads,
      suffix: '',
      subtext: 'leads qualifiés',
      icon: '◈',
    },
    {
      label: 'SCORE MOYEN',
      value: stats.avgScore,
      suffix: '/100',
      subtext: 'moyenne globale',
      icon: '◎',
    },
    {
      label: 'HIGH SCORE',
      value: stats.highScoreLeads,
      suffix: '',
      subtext: 'score ≥ 80',
      icon: '◆',
    },
    {
      label: 'TOP SECTEUR',
      value: topSector,
      suffix: '',
      subtext: `${stats.sectorDistribution[topSector as Sector] ?? 0} agences`,
      icon: '◉',
      isText: true,
      color: sectorColors[topSector as Sector],
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className="kames-card p-6 relative overflow-hidden group"
        >
          {/* Background glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.06) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div
              className="text-xs font-semibold tracking-widest mb-3 uppercase"
              style={{ opacity: 0.5, letterSpacing: '2px' }}
            >
              {card.label}
            </div>

            <div className="flex items-end gap-1 mb-2">
              {card.isText ? (
                <span
                  className="text-3xl font-black"
                  style={{ color: card.color ?? '#f97316' }}
                >
                  {card.value}
                </span>
              ) : (
                <>
                  <span className="text-4xl font-black gradient-text">
                    {card.value}
                  </span>
                  {card.suffix && (
                    <span
                      className="text-lg font-medium mb-1"
                      style={{ opacity: 0.4 }}
                    >
                      {card.suffix}
                    </span>
                  )}
                </>
              )}
            </div>

            <div
              className="text-xs font-medium"
              style={{ opacity: 0.45, letterSpacing: '0.5px' }}
            >
              {card.subtext}
            </div>
          </div>

          {/* Decorative icon */}
          <div
            className="absolute bottom-4 right-5 text-5xl font-black select-none pointer-events-none"
            style={{ opacity: 0.04, color: '#f97316' }}
          >
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
