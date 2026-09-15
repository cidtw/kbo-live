'use client';

import React, { useState } from 'react';
import { PlayerRosterItem, TeamRosterSummary } from '@/types/roster-fa';
import { isMatchingTeam } from '@/lib/roster-fa-service';
import {
  Users,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';

interface LineupBoardProps {
  players: PlayerRosterItem[];
  teams: TeamRosterSummary[];
  selectedTeam: string;
  onSelectTeam: (teamName: string) => void;
  onSelectPlayer: (player: PlayerRosterItem) => void;
}

export const LineupBoard: React.FC<LineupBoardProps> = ({
  players,
  teams,
  selectedTeam,
  onSelectTeam,
  onSelectPlayer,
}) => {
  // If selectedTeam is 'ALL' or not present in teams on this date, pick the first team
  const hasSelectedTeam = teams.some((t) => isMatchingTeam(t.teamName, t.teamCode, selectedTeam));
  const activeTeamName = (selectedTeam === 'ALL' || !hasSelectedTeam) && teams.length > 0
    ? teams[0].teamName
    : selectedTeam;

  const teamPlayers = players.filter((p) =>
    isMatchingTeam(p.teamName, p.teamCode, activeTeamName)
  );

  const starters = teamPlayers
    .filter((p) => p.role === 'STARTER')
    .sort((a, b) => {
      if (a.position === '선발투수') return -1;
      if (b.position === '선발투수') return 1;
      return (a.batOrder || 99) - (b.batOrder || 99);
    });

  const subs = teamPlayers.filter((p) => p.role === 'SUBSTITUTE');
  const benchBatters = teamPlayers.filter(
    (p) => p.role === 'BENCH' && p.posCategory !== 'PITCHER' && p.transaction !== 'OUT'
  );
  const benchPitchers = teamPlayers.filter(
    (p) => p.role === 'BENCH' && p.posCategory === 'PITCHER' && p.transaction !== 'OUT'
  );
  const deregistered = teamPlayers.filter((p) => p.transaction === 'OUT');
  const newlyRegistered = teamPlayers.filter((p) => p.transaction === 'IN');

  const currentTeamSummary = teams.find((t) =>
    isMatchingTeam(t.teamName, t.teamCode, activeTeamName)
  ) || (teams.length > 0 ? teams[0] : null);

  return (
    <div className="space-y-5">
      {/* Team Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {teams.map((t) => {
          const isSelected = isMatchingTeam(t.teamName, t.teamCode, activeTeamName);
          return (
            <button
              key={t.teamCode}
              onClick={() => onSelectTeam(t.teamName)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: t.teamColor || '#3b82f6' }}
              ></span>
              {t.teamName}
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
                {t.totalActiveRoster}명
              </span>
            </button>
          );
        })}
      </div>

      {/* Team Overview Card */}
      {currentTeamSummary && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg"
              style={{ backgroundColor: currentTeamSummary.teamColor }}
            >
              {currentTeamSummary.teamName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{currentTeamSummary.teamName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                  1군 현역 등록 {currentTeamSummary.totalActiveRoster}명
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                선발 {currentTeamSummary.startersCount}명 • 교체출장 {currentTeamSummary.subsCount}명 • 미출장 대기{' '}
                {currentTeamSummary.benchCount}명
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 text-center">
              <div className="text-[11px] text-slate-400">FA 서비스타임 충족</div>
              <div className="text-sm font-black text-emerald-400">
                {currentTeamSummary.faQualifiedCount}명{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({Math.round((currentTeamSummary.faQualifiedCount / (currentTeamSummary.totalActiveRoster || 1)) * 100)}%)
                </span>
              </div>
            </div>
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 text-center">
              <div className="text-[11px] text-slate-400">당일 엔트리 변동</div>
              <div className="text-sm font-black flex items-center justify-center gap-2">
                <span className="text-green-400 font-bold">▲ {newlyRegistered.length}</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400 font-bold">▼ {deregistered.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Starters vs Substitutes vs Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Starting Lineup (1~9 + SP) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <h3 className="font-bold text-sm text-slate-100">선발 라인업 (Starters)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {starters.length}명
            </span>
          </div>

          <div className="space-y-2">
            {starters.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">선발 명단이 없습니다.</div>
            ) : (
              starters.map((p) => {
                const isPitcher = p.position === '선발투수';
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          isPitcher
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-600 text-white shadow-sm'
                        }`}
                      >
                        {isPitcher ? 'P' : p.batOrder}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 group-hover:text-blue-400 transition text-sm flex items-center gap-1.5">
                          {p.name}
                          <span className="text-xs font-normal text-slate-400">#{p.backnum || '-'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.position} • {p.hitType || '우투우타'}
                        </div>
                      </div>
                    </div>

                    {/* Service & FA Badge */}
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-200">
                        {p.daysActive1stTeam}일
                      </div>
                      <div className="text-[10px]">
                        {p.faEligible ? (
                          <span className="text-emerald-400 font-bold">FA 충족</span>
                        ) : (
                          <span className="text-amber-400">{p.daysNeededForFa}일 필요</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Substitutes who entered game */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <h3 className="font-bold text-sm text-slate-100">교체 출장 선수 (Substitutes)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {subs.length}명
            </span>
          </div>

          <div className="space-y-2">
            {subs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                경기 중 교체 출장 선수가 없습니다 (또는 경기 시작 전).
              </div>
            ) : (
              subs.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p)}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {p.posCategory === 'PITCHER' ? 'RP' : '대'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition text-sm">
                        {p.name} <span className="text-xs font-normal text-slate-400">#{p.backnum || '-'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{p.roleDetail}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-200">{p.daysActive1stTeam}일</div>
                    <div className="text-[10px]">
                      {p.faEligible ? (
                        <span className="text-emerald-400 font-bold">FA 충족</span>
                      ) : (
                        <span className="text-slate-400">{p.faProgressPercent}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Bench & Bullpen Reserves + Transactions */}
        <div className="space-y-5">
          {/* Bench Reserves */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                <h3 className="font-bold text-sm text-slate-100">1군 벤치·불펜 후보 (Reserves)</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {benchBatters.length + benchPitchers.length}명
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {benchBatters.length + benchPitchers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">미출장 후보 선수가 없습니다.</div>
              ) : (
                [...benchBatters, ...benchPitchers].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="p-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                        {p.posCategory === 'PITCHER' ? '투' : '야'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition text-xs">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{p.position}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{p.daysActive1stTeam}일 등록</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transactions (IN / OUT) Notice */}
          {(newlyRegistered.length > 0 || deregistered.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h4 className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                오늘의 1군 등록 / 말소 공시
              </h4>
              <div className="space-y-1.5 text-xs">
                {newlyRegistered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-green-400 font-bold">
                      <UserCheck className="w-3.5 h-3.5" /> ▲ {p.name} ({p.position})
                    </span>
                    <span className="text-[11px] text-slate-400">1군 신규 등록</span>
                  </div>
                ))}
                {deregistered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <UserMinus className="w-3.5 h-3.5" /> ▼ {p.name} ({p.position})
                    </span>
                    <span className="text-[11px] text-rose-300">말소 (10일 후 재등록)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
