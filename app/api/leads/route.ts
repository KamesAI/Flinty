import { NextResponse } from 'next/server';
import { getLeadsFromSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const leads = await getLeadsFromSheet();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[/api/leads]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des leads' },
      { status: 500 }
    );
  }
}
