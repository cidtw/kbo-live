import { NextRequest, NextResponse } from 'next/server';
import { fetchDayRosterData } from '@/lib/roster-fa-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || '2024-05-15';
  const team = searchParams.get('team') || 'ALL';
  const format = searchParams.get('format') || 'json';

  try {
    const data = await fetchDayRosterData(date, team);

    if (format === 'csv') {
      const headers = [
        '선수명',
        '소속구단',
        '등번호',
        '포지션',
        '역할구분',
        '상세역할',
        '엔트리변동',
        '1군등록일수',
        '출장경기수',
        '선발출장',
        '교체출장',
        '벤치대기',
        'FA기준일수',
        'FA충족여부',
        'FA달성률(%)',
        'FA필요일수',
        '학력구분',
        '누적FA시즌',
      ];

      const rows = data.players.map((p) => [
        p.name,
        p.teamName,
        p.backnum || '',
        p.position,
        p.role,
        `"${p.roleDetail.replace(/"/g, '""')}"`,
        p.transaction,
        p.daysActive1stTeam,
        p.gamesPlayed,
        p.gamesStarted,
        p.gamesSubbed,
        p.daysOnBench,
        p.faThreshold,
        p.faEligible ? '충족' : '미충족',
        `${p.faProgressPercent}%`,
        p.daysNeededForFa,
        p.educationType === 'COLLEGE' ? '대졸(7-8년)' : '고졸(8-9년)',
        `${p.accumulatedFaSeasons || 0}시즌`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kbo_roster_fa_${date}_${team}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching roster and FA data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch roster & FA data' },
      { status: 500 }
    );
  }
}
