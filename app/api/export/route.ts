import { NextResponse } from 'next/server';
import { getLeadsFromSheet } from '@/lib/googleSheets';
import { Lead } from '@/lib/types';

function escapeCsvField(value: string | number | boolean | null): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function leadsToCSV(leads: Lead[]): string {
  const headers = [
    'Name',
    'Website',
    'Email',
    'Phone',
    'City',
    'Sector',
    'Team Size',
    'CEO',
    'Score',
    'Score Reason',
    'Has IA Services',
    'Job Postings',
    'Status',
    'Scraped At',
  ];

  const rows = leads.map((lead) =>
    [
      escapeCsvField(lead.name),
      escapeCsvField(lead.website),
      escapeCsvField(lead.email),
      escapeCsvField(lead.phone),
      escapeCsvField(lead.city),
      escapeCsvField(lead.sector),
      escapeCsvField(lead.team_size),
      escapeCsvField(lead.ceo_name),
      escapeCsvField(lead.score),
      escapeCsvField(lead.score_reason),
      escapeCsvField(lead.has_ia_services),
      escapeCsvField(lead.job_postings),
      escapeCsvField(lead.status),
      escapeCsvField(lead.scraped_at),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export async function GET() {
  try {
    const leads = await getLeadsFromSheet();
    const csv = leadsToCSV(leads);

    const today = new Date().toISOString().split('T')[0];
    const filename = `leads-${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[/api/export]', error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du CSV" },
      { status: 500 }
    );
  }
}
