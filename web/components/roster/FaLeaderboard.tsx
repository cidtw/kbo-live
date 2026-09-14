'use client';

import React from 'react';
import { PlayerRosterItem, TeamRosterSummary } from '@/types/roster-fa';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';

interface FaLeaderboardProps {
  players: PlayerRosterItem[];
  teams: TeamRosterSummary[];
  onSelectPlayer: (player: PlayerRosterItem) => void;
}

export const FaLeaderboard: React.FC<FaLeaderboardProps> = ({
  players,
  teams,
  onSelectPlayer,
}) => {
  // 1. Qualified players (145+ days)
  const qualifiedPlayers = [...players]
    .filter((p) => p.faEligible)
    .sort((a, b) => b.daysActive1stTeam - a.daysActive1stTeam);

  // 2. In Progress (115 ~ 144 days)
  const inProgressPlayers = [...players]
    .filter((p) => !p.faEligible && p.faProgressPercent >= 75)
    .sort((a, b) => b.daysActive1stTeam - a.daysActive1stTeam);

  // 3. Team FA Statistics
  const teamFaStats = teams.map((t) => {
    const qualified = players.filter(
      (p) => (p.teamName === t.teamName || p.teamCode === t.teamCode) && p.faEligible
    ).length;
    const total = players.filter(
      (p) => (p.teamName === t.teamName || p.teamCode === t.teamCode)
    ).length || 1;
    const rate = Math.round((qualified / total) * 100);
    return {
      ...t,
      qualified,
      rate,
    };
  }).sort((a, b) => b.qualified - a.qualified);

  return (
    <div className="space-y-6">
      {/* KBO Rule Guide Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                KBO 야구규약 제164조: FA(자유계약선수) 서비스타임 산정 원칙
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                공식 규약
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              • <strong className="text-blue-300">1시즌 인정 기준</strong>: 정규시즌 1군 현역선수 엔트리 등록일수가 <strong className="text-emerald-400">145일 이상</strong>인 경우 당해 연도를 <strong>FA 1시즌(1년)</strong>으로 산정합니다.
              <br />
              • <strong className="text-blue-300">타자 특례 규정</strong>: 1군 등록일수가 145일 미만이라 하더라도, 정규시즌 총 경기수의 2/3 이상(144경기 기준 96경기) 출장한 경우에도 1시즌으로 인정합니다.
              <br />
              • <strong className="text-blue-300">최종 FA 취득 자격</strong>: 고졸(비대졸) 선수는 <strong>8~9시즌</strong>, 4년제 대졸 선수는 <strong>7~8시즌</strong>의 1시즌 인정 서비스타임을 완주해야 FA 자격을 취득합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Team Comparison & Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Team FA Qualified Ranking */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-100">구단별 FA 서비스타임 충족 현황</h4>
            </div>
            <span className="text-xs text-slate-400">145일 달성 선수</span>
          </div>

          <div className="space-y-3">
            {teamFaStats.map((t, idx) => (
              <div key={t.teamCode} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <span className="text-slate-500 font-bold w-4">{idx + 1}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.teamColor }}
                    ></span>
                    {t.teamName}
                  </span>
                  <span className="font-bold text-slate-100">
                    <span className="text-emerald-400">{t.qualified}명</span>
                    <span className="text-slate-500 font-normal ml-1">({t.rate}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, t.rate)}%`,
                      backgroundColor: t.teamColor || '#3b82f6',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: FA 145일 충족 달성자 리스트 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-100">FA 서비스타임 충족 완료</h4>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {qualifiedPlayers.length}명
            </span>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
            {qualifiedPlayers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                현재 조회된 일자 기준 145일 충족 선수가 없습니다.
              </div>
            ) : (
              qualifiedPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p)}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 w-4 text-center">{idx + 1}</span>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition text-sm">
                        {p.name}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">({p.teamName})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.position} • {p.educationType === 'COLLEGE' ? '대졸' : '고졸'} • 누적 {p.accumulatedFaSeasons}시즌
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400">{p.daysActive1stTeam}일</div>
                    <div className="text-[10px] text-emerald-500 font-semibold">1시즌 인정 ✅</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: FA 달성 임박자 (75%+ Progress) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-sm text-slate-100">FA 서비스타임 달성 임박자</h4>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              {inProgressPlayers.length}명
            </span>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
            {inProgressPlayers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">임박 선수가 없습니다.</div>
            ) : (
              inProgressPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p)}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 w-4 text-center">{idx + 1}</span>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-amber-400 transition text-sm">
                        {p.name}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">({p.teamName})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        현재 {p.daysActive1stTeam}일 / 145일
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400">
                      -{p.daysNeededForFa}일
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      진행률 {p.faProgressPercent}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
