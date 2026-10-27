import { NextResponse } from 'next/server';
import { fetchGame } from '@/lib/domain/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const game = await fetchGame(id);
    return NextResponse.json({ game });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
