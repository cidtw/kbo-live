'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { FullPlayerRecordData } from '@/lib/domain/playerApi';
import PlayerProfileHero from '@/components/player/PlayerProfileHero';
import SeasonRecordsTable from '@/components/player/SeasonRecordsTable';
import GameLogsTable from '@/components/player/GameLogsTable';
import VsTeamRecordsTable from '@/components/player/VsTeamRecordsTable';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'season' | 'gamelog' | 'vsteam';

export default function PlayerDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const playerId = resolvedParams.id;

  const [data, setData] = useState<FullPlayerRecordData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('season');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/player/${encodeURIComponent(playerId)}`);
        if (!res.ok) {
          throw new Error(`선수 데이터를 불러오지 못했습니다. (HTTP ${res.status})`);
        }
        const json: FullPlayerRecordData = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || '선수 정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    if (playerId) {
      loadData();
    }

    return () => {
      active = false;
    };
  }, [playerId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 상단 네비게이션 브레드크럼 */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/pitchers" className="hover:text-blue-400 flex items-center gap-1">
              <span>←</span>
              <span>투수 혹사 지수 데이터셋으로 돌아가기</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>KBO PLAYER ID: {playerId}</span>
          </div>
        </div>

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <span className="animate-spin text-3xl">⏳</span>
            <span>선수 상세 프로필 및 통산/일자/상대구단 기록을 불러오는 중입니다...</span>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-2xl text-center space-y-3">
            <p className="text-red-300 text-sm font-semibold">⚠️ {error}</p>
            <Link
              href="/pitchers"
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              투수 목록으로 이동
            </Link>
          </div>
        )}

        {/* 메인 컨텐츠 영역 */}
        {!isLoading && data && (
          <>
            {/* 1. 프로필 히어로 카드 */}
            <PlayerProfileHero profile={data.profile} />

            {/* 2. 탭 네비게이션 바 */}
            <div className="border-b border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('season')}
                className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'season'
                    ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>📊</span>
                <span>시즌별 통산 기록 ({data.seasons.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('gamelog')}
                className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'gamelog'
                    ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>📅</span>
                <span>최근 일자별 등판 일지 ({data.gameLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('vsteam')}
                className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'vsteam'
                    ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>⚔️</span>
                <span>상대 구단별 전적 ({data.vsTeams.length})</span>
              </button>
            </div>

            {/* 3. 탭 컨텐츠 */}
            <div className="pt-2">
              {activeTab === 'season' && <SeasonRecordsTable seasons={data.seasons} />}
              {activeTab === 'gamelog' && <GameLogsTable gameLogs={data.gameLogs} />}
              {activeTab === 'vsteam' && <VsTeamRecordsTable vsTeams={data.vsTeams} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
