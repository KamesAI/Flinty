import { google } from 'googleapis';
import { Lead, Stats, Sector, Status } from './types';

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function getLeadsFromSheet(): Promise<Lead[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: 'Leads_Qualified!A2:N1000',
  });

  const rows = response.data.values ?? [];

  return rows
    .filter((row) => row[0]) // skip empty rows
    .map((row): Lead => ({
      name: row[0] ?? '',
      website: row[1] ?? '',
      phone: row[2] ?? '',
      city: row[3] ?? '',
      team_size: row[4] ? parseInt(row[4], 10) || null : null,
      sector: (row[5] as Sector) || 'Unknown',
      ceo_name: row[6] || null,
      email: row[7] ?? '',
      has_ia_services: row[8] === 'true' || row[8] === true,
      job_postings: row[9] === 'true' || row[9] === true,
      score: row[10] ? parseFloat(row[10]) || 0 : 0,
      score_reason: row[11] ?? '',
      status: (row[12] as Status) || 'To Contact',
      scraped_at: row[13] ?? '',
    }));
}

export async function getStatsFromSheet(): Promise<Stats> {
  const leads = await getLeadsFromSheet();

  const totalLeads = leads.length;
  const avgScore =
    totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads)
      : 0;
  const highScoreLeads = leads.filter((l) => l.score >= 80).length;

  const sectorDistribution: Record<Sector, number> = {
    Growth: 0,
    Digital: 0,
    'Tech-IA': 0,
    Unknown: 0,
  };

  for (const lead of leads) {
    const s = lead.sector in sectorDistribution ? lead.sector : 'Unknown';
    sectorDistribution[s]++;
  }

  return { totalLeads, avgScore, highScoreLeads, sectorDistribution };
}
