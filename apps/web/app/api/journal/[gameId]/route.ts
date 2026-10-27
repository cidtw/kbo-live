import { NextRequest, NextResponse } from 'next/server';
import { getGamePitcherOutings } from '@/lib/naver-parser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  if (!gameId) {
    return NextResponse.json(
      { success: false, error: 'gameId is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getGamePitcherOutings(gameId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`Error fetching game ${gameId}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch game outings' },
      { status: 500 }
    );
  }
}
