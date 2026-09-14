'use client';

import React, { useState, useMemo } from 'react';
import { PlayerRosterItem, LineupRole, TransactionStatus, FaStatus } from '@/types/roster-fa';
import {
  Search,
  ArrowUpDown,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface RosterTableProps {
  players: PlayerRosterItem[];
  date: string;
  selectedTeam: string;
  onSelectPlayer: (player: PlayerRosterItem) => void;
}

type SortField =
  | 'name'
  | 'teamName'
  | 'position'
  | 'role'
  | 'transaction'
  | 'daysActive1stTeam'
  | 'faProgressPercent'
  | 'gamesPlayed';

export const RosterTable: React.FC<RosterTableProps> = ({
  players,
  date,
  selectedTeam,
  onSelectPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [transFilter, setTransFilter] = useState<string>('ALL');
  const [faFilter, setFaFilter] = useState<string>('ALL');

  const [sortField, setSortField] = useState<SortField>('daysActive1stTeam');
  const [sortAsc, setSortAsc] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for stats
    }
  };

  // Filtered & Sorted list
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = p.name.toLowerCase().includes(term);
          const matchTeam = p.teamName.toLowerCase().includes(term);
          const matchPos = p.position.toLowerCase().includes(term);
          const matchBacknum = p.backnum?.includes(term);
          if (!matchName && !matchTeam && !matchPos && !matchBacknum) return false;
        }
        // Role filter
        if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
        // Position filter
        if (posFilter !== 'ALL' && p.posCategory !== posFilter) return false;
        // Transaction filter
        if (transFilter !== 'ALL' && p.transaction !== transFilter) return false;
        // FA Status filter
        if (faFilter !== 'ALL' && p.faStatus !== faFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'role') {
          const roleWeight = { STARTER: 3, SUBSTITUTE: 2, BENCH: 1 };
          valA = roleWeight[a.role];
          valB = roleWeight[b.role];
        } else if (sortField === 'transaction') {
          const transWeight = { IN: 3, OUT: 2, STABLE: 1 };
          valA = transWeight[a.transaction];
          valB = transWeight[b.transaction];
        }

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [players, searchTerm, roleFilter, posFilter, transFilter, faFilter, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / pageSize) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlayers.slice(start, start + pageSize);
  }, [filteredPlayers, currentPage, pageSize]);

  // CSV Download Handler
  const handleExportCsv = () => {
    window.location.href = `/api/roster-fa?date=${date}&team=${selectedTeam}&format=csv`;
  };

  // JSON Download Handler
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredPlayers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kbo_roster_fa_${date}_${selectedTeam}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Top Controls: Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="선수명, 등번호, 포지션, 구단 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">출장 구분: 전체</option>
            <option value="STARTER">선발 출장 (Starter)</option>
            <option value="SUBSTITUTE">교체 출장 (Sub)</option>
            <option value="BENCH">후보 벤치 대기 (Bench)</option>
          </select>

          {/* Position Category Filter */}
          <select
            value={posFilter}
            onChange={(e) => {
              setPosFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">포지션: 전체</option>
            <option value="PITCHER">투수 (P)</option>
            <option value="CATCHER">포수 (C)</option>
            <option value="INFIELDER">내야수 (IF)</option>
            <option value="OUTFIELDER">외야수 (OF)</option>
            <option value="DH">지명타자 (DH)</option>
          </select>

          {/* Transaction Filter */}
          <select
            value={transFilter}
            onChange={(e) => {
              setTransFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">등록/말소: 전체</option>
            <option value="IN">▲ 1군 신규등록 (IN)</option>
            <option value="OUT">▼ 1군 말소 (OUT)</option>
            <option value="STABLE">1군 유지</option>
          </select>

          {/* FA Status Filter */}
          <select
            value={faFilter}
            onChange={(e) => {
              setFaFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">FA 충족 여부: 전체</option>
            <option value="QUALIFIED">✅ 145일 충족 완료</option>
            <option value="IN_PROGRESS">⏳ 진행중 (75%+)</option>
            <option value="SHORTFALL">❌ 미충족</option>
          </select>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold transition"
              title="CSV 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              CSV 내보내기
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-semibold transition"
              title="JSON 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-800 pb-2">
        <div>
          총 <span className="text-blue-400 font-bold">{filteredPlayers.length}</span>명의 선수 데이터셋
          (전체 {players.length}명 중 필터링됨)
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> 선발 출장
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 교체 출장
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> 벤치 대기
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> 말소 공시
          </span>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 select-none">
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  선수 정보
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('teamName')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  구단
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('position')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  포지션
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('role')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  당일 라인업 역할
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('transaction')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  엔트리 변동
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('daysActive1stTeam')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  1군 등록일수
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gamesPlayed')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  출장 내역 (선발/교체/벤치)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('faProgressPercent')}
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  FA 서비스타임 (145일 기준)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 font-semibold text-center">비고 / 재등록 기한</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {paginatedPlayers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  해당 조건에 일치하는 선수 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              paginatedPlayers.map((p) => {
                const isOut = p.transaction === 'OUT';
                const isNewIn = p.transaction === 'IN';

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    {/* Player Info */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:border-blue-500 transition">
                          {p.backnum || '-'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-blue-400 transition flex items-center gap-1.5">
                            {p.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-400 transition" />
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.hitType || '투타미상'} • {p.birth?.slice(0, 4) || '출생연도'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Team */}
                    <td className="py-3 px-3 font-medium text-slate-200">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {p.teamName}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      <span>{p.position}</span>
                    </td>

                    {/* Role & Batting Order */}
                    <td className="py-3 px-3">
                      {p.role === 'STARTER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {p.roleDetail}
                        </span>
                      ) : p.role === 'SUBSTITUTE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {p.roleDetail}
                        </span>
                      ) : isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          1군 말소
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          {p.roleDetail}
                        </span>
                      )}
                    </td>

                    {/* Transaction (등록/말소) */}
                    <td className="py-3 px-3">
                      {isNewIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                          <UserCheck className="w-3 h-3" />
                          1군 등록
                        </span>
                      ) : isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                          <UserMinus className="w-3 h-3" />
                          1군 말소
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">유지</span>
                      )}
                    </td>

                    {/* 1st Team Active Days */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-black text-slate-100 text-sm">
                        {p.daysActive1stTeam}
                        <span className="text-xs font-normal text-slate-400 ml-0.5">일</span>
                      </div>
                      <div className="text-[10px] text-slate-500">시즌 누적 등록</div>
                    </td>

                    {/* Appearance Breakdown */}
                    <td className="py-3 px-3 text-center">
                      <div className="text-slate-300 font-medium">
                        총 <span className="font-bold text-white">{p.gamesPlayed}</span>경기
                      </div>
                      <div className="text-[10px] text-slate-400">
                        선발 {p.gamesStarted} • 교체 {p.gamesSubbed} • 대기 {p.daysOnBench}
                      </div>
                    </td>

                    {/* FA Service Time & Progress */}
                    <td className="py-3 px-3.5">
                      <div className="space-y-1.5 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-bold">
                            {p.faEligible ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 1시즌 충족
                              </span>
                            ) : p.faStatus === 'IN_PROGRESS' ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {p.daysNeededForFa}일 부족
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" /> {p.daysNeededForFa}일 필요
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 font-semibold">{p.faProgressPercent}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              p.faEligible
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : p.faStatus === 'IN_PROGRESS'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                            }`}
                            style={{ width: `${Math.min(100, p.faProgressPercent)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Notes / KBO Regulations */}
                    <td className="py-3 px-3 text-center text-[11px]">
                      {isOut ? (
                        <div className="text-rose-400 font-medium bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                          {p.reEligibleDate} 재등록 가능
                        </div>
                      ) : (
                        <div className="text-slate-400">
                          {p.educationType === 'COLLEGE' ? '대졸(7-8년)' : '고졸(8-9년)'} • FA {p.accumulatedFaSeasons}년차
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>페이지당 행 수:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none"
          >
            <option value={10}>10개</option>
            <option value={25}>25개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            {currentPage} / {totalPages} 페이지
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
