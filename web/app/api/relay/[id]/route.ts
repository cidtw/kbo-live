import { NextResponse } from 'next/server';
import { fetchRelay } from '@/lib/domain/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const inning = searchParams.get('inning') || undefined;

  try {
    const relay = await fetchRelay(id, inning);
    return NextResponse.json({ relay });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
