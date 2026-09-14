'use client';

import React from 'react';
import { PlayerRosterItem } from '@/types/roster-fa';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  GraduationCap,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Activity,
  Layers,
} from 'lucide-react';

interface PlayerDetailModalProps {
  player: PlayerRosterItem | null;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  const isCollege = player.educationType === 'COLLEGE';
  const targetFaSeasons = isCollege ? 8 : 9; // 규약상 기준 (대졸 8/고졸 9 or 개정 7/8)
  const remainingFaSeasons = Math.max(0, targetFaSeasons - (player.accumulatedFaSeasons || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-850 via-slate-900 to-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-blue-500/20">
              {player.backnum || player.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">{player.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  {player.teamName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  {player.position}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>배번: #{player.backnum || '-'}</span>
                <span>•</span>
                <span>{player.hitType || '투타미상'}</span>
                <span>•</span>
                <span>고유코드: {player.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {/* Game Day Status Card */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                당일 경기 라인업 및 엔트리 상태
              </span>
              {player.transaction === 'IN' ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                  <UserCheck className="w-3.5 h-3.5" /> 1군 신규 등록
                </span>
              ) : player.transaction === 'OUT' ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                  <UserMinus className="w-3.5 h-3.5" /> 1군 말소 (10일 대기)
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  엔트리 정상 유지
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                  player.role === 'STARTER'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : player.role === 'SUBSTITUTE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {player.roleDetail}
              </div>
              {player.transactionNote && (
                <span className="text-xs text-slate-400">{player.transactionNote}</span>
              )}
            </div>

            {/* Today's boxscore stats if played */}
            {player.todayStats && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs">
                {player.todayStats.ab !== undefined && (
                  <div>
                    <span className="text-slate-400">타수: </span>
                    <strong className="text-white">{player.todayStats.ab}</strong>
                  </div>
                )}
                {player.todayStats.hit !== undefined && (
                  <div>
                    <span className="text-slate-400">안타: </span>
                    <strong className="text-white">{player.todayStats.hit}</strong>
                  </div>
                )}
                {player.todayStats.hr !== undefined && (
                  <div>
                    <span className="text-slate-400">홈런: </span>
                    <strong className="text-white">{player.todayStats.hr}</strong>
                  </div>
                )}
                {player.todayStats.rbi !== undefined && (
                  <div>
                    <span className="text-slate-400">타점: </span>
                    <strong className="text-white">{player.todayStats.rbi}</strong>
                  </div>
                )}
                {player.todayStats.inn !== undefined && (
                  <div>
                    <span className="text-slate-400">투구이닝: </span>
                    <strong className="text-white">{player.todayStats.inn}</strong>
                  </div>
                )}
                {player.todayStats.np !== undefined && (
                  <div>
                    <span className="text-slate-400">투구수: </span>
                    <strong className="text-white">{player.todayStats.np}</strong>
                  </div>
                )}
                {player.todayStats.so !== undefined && (
                  <div>
                    <span className="text-slate-400">탈삼진: </span>
                    <strong className="text-white">{player.todayStats.so}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1st Team Service Days & Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" />
              1군 등록일수 및 출장 내역 상세
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60 text-center">
                <div className="text-[11px] text-slate-400">1군 총 등록일수</div>
                <div className="text-xl font-black text-blue-400 mt-0.5">
                  {player.daysActive1stTeam}
                  <span className="text-xs font-normal text-slate-400 ml-1">일</span>
                </div>
              </div>
              <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60 text-center">
                <div className="text-[11px] text-slate-400">선발 출장</div>
                <div className="text-xl font-black text-slate-100 mt-0.5">
                  {player.gamesStarted}
                  <span className="text-xs font-normal text-slate-400 ml-1">경기</span>
                </div>
              </div>
              <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60 text-center">
                <div className="text-[11px] text-slate-400">교체 출장</div>
                <div className="text-xl font-black text-slate-100 mt-0.5">
                  {player.gamesSubbed}
                  <span className="text-xs font-normal text-slate-400 ml-1">경기</span>
                </div>
              </div>
              <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60 text-center">
                <div className="text-[11px] text-slate-400">벤치 미출장 대기</div>
                <div className="text-xl font-black text-slate-100 mt-0.5">
                  {player.daysOnBench}
                  <span className="text-xs font-normal text-slate-400 ml-1">일</span>
                </div>
              </div>
            </div>
          </div>

          {/* FA Criteria Evaluation (145 Days Standard) */}
          <div className="bg-gradient-to-br from-slate-850 via-slate-900 to-indigo-950/40 border border-slate-700/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">
                  당해 시즌 FA 서비스타임 평가 (KBO 규약 145일 기준)
                </h4>
              </div>
              {player.faEligible ? (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1시즌 충족 완료
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  <Clock className="w-3.5 h-3.5" /> 잔여 {player.daysNeededForFa}일 필요
                </span>
              )}
            </div>

            {/* Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>
                  현재 <strong className="text-white font-bold">{player.daysActive1stTeam}일</strong> / 기준{' '}
                  <strong className="text-blue-400">145일</strong>
                </span>
                <span className="font-bold text-emerald-400">{player.faProgressPercent}% 달성</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    player.faEligible
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, player.faProgressPercent)}%` }}
                ></div>
              </div>
            </div>

            {/* Career FA Projection */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  학력 및 기본 취득 연한
                </span>
                <div className="font-bold text-slate-200">
                  {isCollege ? '4년제 대졸 (총 7~8시즌 필요)' : '고졸/비대졸 (총 8~9시즌 필요)'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  누적 충족 시즌 현황
                </span>
                <div className="font-bold text-slate-200">
                  누적 {player.accumulatedFaSeasons || 0}시즌 충족 완료{' '}
                  <span className="text-amber-400 font-normal">
                    (자격 취득까지 약 {remainingFaSeasons}시즌 잔여)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
