import { NextResponse } from 'next/server';
import { getStatsFromSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const stats = await getStatsFromSheet();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[/api/stats]', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des statistiques' },
      { status: 500 }
    );
  }
}
