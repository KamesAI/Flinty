'use client';

import { Lead, Sector } from '@/lib/types';

interface LeadsTableProps {
  leads: Lead[];
}

const sectorConfig: Record<Sector, { color: string; bg: string; label: string }> = {
  Growth: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    label: 'Growth',
  },
  Digital: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    label: 'Digital',
  },
  'Tech-IA': {
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    label: 'Tech-IA',
  },
  Unknown: {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.12)',
    label: 'Unknown',
  },
};

function ScoreBadge({ score }: { score: number }) {
  let color: string;
  let bg: string;

  if (score >= 80) {
    color = '#10b981';
    bg = 'rgba(16, 185, 129, 0.12)';
  } else if (score >= 60) {
    color = '#f59e0b';
    bg = 'rgba(245, 158, 11, 0.12)';
  } else {
    color = '#6b7280';
    bg = 'rgba(107, 114, 128, 0.12)';
  }

  return (
    <span
      className="inline-flex items-center justify-center w-12 h-7 rounded-md text-xs font-bold"
      style={{ color, background: bg, border: `1px solid ${color}30` }}
    >
      {score}
    </span>
  );
}

function SectorBadge({ sector }: { sector: Sector }) {
  const config = sectorConfig[sector] ?? sectorConfig.Unknown;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}30`,
      }}
    >
      {config.label}
    </span>
  );
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div
        className="kames-card flex flex-col items-center justify-center py-20 text-center"
        style={{ minHeight: 300 }}
      >
        <div className="text-5xl mb-4" style={{ opacity: 0.15 }}>
          ◈
        </div>
        <div className="text-base font-medium" style={{ opacity: 0.4 }}>
          Aucun lead ne correspond aux filtres
        </div>
        <div className="text-sm mt-2" style={{ opacity: 0.25 }}>
          Modifiez les filtres pour afficher des résultats
        </div>
      </div>
    );
  }

  return (
    <div className="kames-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {[
                'AGENCE',
                'VILLE',
                'SECTEUR',
                'ÉQUIPE',
                'SCORE',
                'CONTACT',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold"
                  style={{
                    opacity: 0.4,
                    letterSpacing: '1.5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr
                key={i}
                className="leads-row"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Agence */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white leading-tight">
                      {lead.name || '—'}
                    </span>
                    {lead.website && (
                      <a
                        href={
                          lead.website.startsWith('http')
                            ? lead.website
                            : `https://${lead.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs truncate max-w-48 transition-colors duration-150"
                        style={{ color: '#f97316', opacity: 0.7 }}
                      >
                        {lead.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </td>

                {/* Ville */}
                <td className="px-4 py-3">
                  <span className="text-sm" style={{ opacity: 0.7 }}>
                    {lead.city || '—'}
                  </span>
                </td>

                {/* Secteur */}
                <td className="px-4 py-3">
                  <SectorBadge sector={lead.sector} />
                </td>

                {/* Équipe */}
                <td className="px-4 py-3">
                  <span className="text-sm" style={{ opacity: 0.7 }}>
                    {lead.team_size ? `${lead.team_size} pers.` : '—'}
                  </span>
                </td>

                {/* Score */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <ScoreBadge score={lead.score} />
                    {lead.score_reason && (
                      <span
                        className="text-xs max-w-48 leading-tight hidden group-hover:block"
                        style={{ opacity: 0.4 }}
                        title={lead.score_reason}
                      >
                        {lead.score_reason.slice(0, 50)}
                        {lead.score_reason.length > 50 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-xs transition-colors duration-150 hover:text-orange-400"
                        style={{ opacity: 0.6 }}
                      >
                        {lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <span className="text-xs" style={{ opacity: 0.4 }}>
                        {lead.phone}
                      </span>
                    )}
                    {!lead.email && !lead.phone && (
                      <span className="text-xs" style={{ opacity: 0.3 }}>
                        —
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
