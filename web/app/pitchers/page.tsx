'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SummaryCards from '@/components/pitchers/SummaryCards';
import FilterBar from '@/components/pitchers/FilterBar';
import OverworkTable from '@/components/pitchers/OverworkTable';
import PitcherDrawer from '@/components/pitchers/PitcherDrawer';
import ExportButtons from '@/components/pitchers/ExportButtons';
import { OverworkDatasetResponse, PitcherOverworkData } from '@/lib/domain/types';

export default function PitcherOverworkPage() {
  const [dataset, setDataset] = useState<OverworkDatasetResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('14d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyHighRisk, setOnlyHighRisk] = useState<boolean>(false);

  // 모달/드로어 상태
  const [selectedPitcher, setSelectedPitcher] = useState<PitcherOverworkData | null>(null);

  const fetchDataset = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedRange) params.set('range', selectedRange);

      const res = await fetch(`/api/pitchers?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API 요청 실패 (HTTP ${res.status})`);
      }
      const data: OverworkDatasetResponse = await res.json();
      setDataset(data);
    } catch (err: any) {
      console.error('Failed to fetch dataset:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  // 클라이언트 사이드 실시간 필터링
  const filteredPitchers = useMemo(() => {
    if (!dataset?.pitchers) return [];

    return dataset.pitchers.filter((p) => {
      // 1. 구단 필터
      if (selectedTeam && p.team !== selectedTeam) {
        return false;
      }
      // 2. 보직 필터
      if (selectedRole && p.primaryRole !== selectedRole) {
        return false;
      }
      // 3. 고위험군 필터 (점수 50점 이상: WARNING, DANGER, EXTREME)
      if (onlyHighRisk && p.overworkScore < 50) {
        return false;
      }
      // 4. 선수명 검색
      if (searchQuery) {
        const query = searchQuery.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(query) && !p.pcode.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [dataset, selectedTeam, selectedRole, onlyHighRisk, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/60">
                KBO LIVE DATASET
              </span>
              <span className="text-xs text-slate-400">10개 구단 투수 실시간 등판 분석</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              KBO 투수 혹사 지수 (Overwork Index)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              소화 이닝, 투구 수, 2~3연투 기록 및 휴식 결핍 페널티를 종합 분석하여 투수 부하를 수치화한 데이터셋입니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dataset && (
              <ExportButtons
                pitchers={filteredPitchers}
                dateRange={dataset.dateRange}
              />
            )}
          </div>
        </div>

        {/* 에러 알림 */}
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={fetchDataset}
              className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-xs"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 상단 KPI 요약 카드 */}
        <SummaryCards
          data={dataset}
          onSelectPitcher={(p) => setSelectedPitcher(p)}
        />

        {/* 필터 툴바 */}
        <FilterBar
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          selectedRange={selectedRange}
          onSelectRange={setSelectedRange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onlyHighRisk={onlyHighRisk}
          onToggleHighRisk={setOnlyHighRisk}
          isLoading={isLoading}
          onRefresh={fetchDataset}
        />

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="animate-spin text-2xl">⏳</span>
            <span>KBO 경기 및 투수 등판 기록을 크롤링·분석하는 중입니다...</span>
          </div>
        )}

        {/* 메인 데이터셋 테이블 */}
        {!isLoading && (
          <OverworkTable
            pitchers={filteredPitchers}
            onSelectPitcher={(p) => setSelectedPitcher(p)}
          />
        )}

        {/* 투수 상세 슬라이드오버 */}
        <PitcherDrawer
          pitcher={selectedPitcher}
          onClose={() => setSelectedPitcher(null)}
        />

        {/* 혹사 지수 산출 기준 안내 박스 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-400 space-y-2">
          <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span>ℹ️</span> KBO 투수 혹사 지수 (Overwork Score) 산출 알고리즘 기준
          </h4>
          <p className="leading-relaxed">
            • <strong>연투 페널티 (35점)</strong>: 0일 휴식(2연투) 시 당일 투구수의 1.4배, 2일 연속 무휴식(3연투) 시 2.0배, 4연투 이상 시 3.0배의 가중치를 부여합니다.
          </p>
          <p className="leading-relaxed">
            • <strong>단기 집중 부하 (35점)</strong>: 최근 3일간 50구 이상(경고) / 65구 이상(위험), 최근 7일간 80구 이상 / 4등판 이상 소화 시 신체 회복 결핍 페널티가 누적됩니다.
          </p>
          <p className="leading-relaxed">
            • <strong>구원 멀티이닝 (15점)</strong>: 불펜 투수가 1이닝(3아웃)을 초과하여 소화한 경기수마다 추가 부하를 가산합니다.
          </p>
          <p className="leading-relaxed">
            • <strong>과투구 PAP (15점)</strong>: 단일 경기 100구 초과 투구에 대해 지수적 부하(Pitcher Abuse Points)를 계산하여 반영합니다.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-slate-500 border-t border-slate-800/80">
            <span>🟢 정상 (0~29점)</span>
            <span>🟡 주의 (30~49점)</span>
            <span>🟠 경고 (50~69점)</span>
            <span>🔴 위험 (70~84점)</span>
            <span>🟣 혹사 경보 (85~100점)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
