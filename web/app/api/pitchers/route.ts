import { NextResponse } from 'next/server';
import { crawlPitcherOverworkDataset } from '@/lib/domain/crawler';
import { kstDateStr, addDays, mapTeamCode } from '@/lib/domain/util';
import { OverworkDatasetResponse } from '@/lib/domain/types';

// 최근 요청 결과 인메모리 캐시 (key: `${from}_${to}`)
const memoryCache = new Map<string, { timestamp: number; data: OverworkDatasetResponse }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '14d';
    const teamFilter = searchParams.get('team') || '';
    const roleFilter = searchParams.get('role') || '';

    let toDate = searchParams.get('toDate');
    let fromDate = searchParams.get('fromDate');

    const todayStr = kstDateStr();

    if (!toDate) {
      toDate = todayStr;
    }

    if (!fromDate) {
      if (range === '7d') {
        fromDate = addDays(toDate, -6);
      } else if (range === '14d') {
        fromDate = addDays(toDate, -13);
      } else if (range === '30d') {
        fromDate = addDays(toDate, -29);
      } else if (range === 'season') {
        // 해당 연도 3월 20일 기준
        const year = toDate.slice(0, 4);
        fromDate = `${year}-03-20`;
      } else {
        fromDate = addDays(toDate, -13);
      }
    }

    // 날짜 유효성
    if (fromDate > toDate) {
      const tmp = fromDate;
      fromDate = toDate;
      toDate = tmp;
    }

    const cacheKey = `${fromDate}_${toDate}`;
    let dataset: OverworkDatasetResponse;

    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      dataset = cached.data;
    } else {
      dataset = await crawlPitcherOverworkDataset(fromDate, toDate);
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: dataset });
    }

    // 필터링 적용 (team, role)
    let filteredPitchers = dataset.pitchers;
    if (teamFilter) {
      const normalizedTeam = mapTeamCode(teamFilter);
      filteredPitchers = filteredPitchers.filter((p) => p.team === normalizedTeam || p.team === teamFilter);
    }
    if (roleFilter) {
      filteredPitchers = filteredPitchers.filter((p) => p.primaryRole === roleFilter);
    }

    const responseData = {
      ...dataset,
      pitchers: filteredPitchers,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('[API /api/pitchers] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to crawl pitcher overwork dataset' },
      { status: 500 }
    );
  }
}
