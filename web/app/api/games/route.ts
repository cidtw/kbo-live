import { NextResponse } from 'next/server';
import { fetchGamesByDate } from '@/lib/domain/api';
import { kstDateStr } from '@/lib/domain/util';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || kstDateStr();
  try {
    const games = await fetchGamesByDate(date);
    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
