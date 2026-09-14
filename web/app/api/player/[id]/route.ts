import { NextResponse } from 'next/server';
import { fetchFullPlayerData } from '@/lib/domain/playerApi';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const data = await fetchFullPlayerData(id);
    if (!data) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (err: any) {
    console.error('[API /api/player/[id]] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}
