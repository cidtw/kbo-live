'use client';

import React from 'react';
import { PlayerProfile } from '@/lib/domain/playerApi';

interface PlayerProfileHeroProps {
  profile: PlayerProfile;
}

export default function PlayerProfileHero({ profile }: PlayerProfileHeroProps) {
  // 대학교 및 고등학교 우선 정렬 (최종 학력 순)
  const sortedSchools = [...profile.schools].sort((a, b) => {
    const isUnivA = a.includes('대') || a.includes('대학');
    const isUnivB = b.includes('대') || b.includes('대학');
    if (isUnivA && !isUnivB) return -1;
    if (!isUnivA && isUnivB) return 1;
    const isHighA = a.includes('고');
    const isHighB = b.includes('고');
    if (isHighA && !isHighB) return -1;
    if (!isHighA && isHighB) return 1;
    return 0;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur shadow-lg relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 top-4 text-8xl font-black text-slate-800/40 select-none pointer-events-none font-mono">
        {profile.backNumber ? `#${profile.backNumber}` : ''}
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
        {/* 선수 프로필 사진 */}
        <div className="w-32 h-40 md:w-36 md:h-48 rounded-2xl bg-slate-800/80 border-2 border-slate-700/80 overflow-hidden flex-shrink-0 shadow-md relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.imageUrl}
            alt={profile.name}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* 선수 주요 정보 */}
        <div className="flex-grow text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800/80 shadow-sm">
              {profile.teamName}
            </span>
            {profile.backNumber && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                No.{profile.backNumber}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80">
              {profile.playerDescription || profile.position}
            </span>

            {/* 선수 구분 뱃지 (외국인 / 아시아쿼터 / 국내) */}
            {profile.playerCategory === 'ASIAN_QUOTA' && (
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 shadow-sm">
                <span>{profile.nationalityFlag || '🇯🇵'}</span>
                <span>{profile.nationality || '일본'}</span>
                <span className="text-emerald-400 font-normal">| {profile.categoryLabel || '아시아쿼터'}</span>
              </span>
            )}
            {profile.playerCategory === 'FOREIGN' && (
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1 shadow-sm">
                <span>{profile.nationalityFlag || '🌐'}</span>
                <span>{profile.nationality || '외국인'}</span>
                <span className="text-purple-400 font-normal">| {profile.categoryLabel || '외국인 선수'}</span>
              </span>
            )}

            {profile.kboDraftType && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/70">
                🎯 {profile.kboDraftType}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap justify-center md:justify-start">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {profile.name}
            </h1>
            {profile.englishName && profile.englishName !== profile.name && (
              <span className="text-base md:text-lg text-slate-400 font-normal tracking-wide font-mono">
                {profile.englishName}
              </span>
            )}
          </div>

          {/* 세부 인적사항 그리드 (외국인/아시아쿼터 특화 분기) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">
                {profile.playerCategory !== 'DOMESTIC' ? '생년월일 · 국적' : '생년월일 / 나이'}
              </span>
              <span className="text-slate-200 font-medium block">
                {profile.birthDateKor || profile.birthDate || '-'}
                {profile.age && <span className="text-slate-400 ml-1">({profile.age})</span>}
              </span>
              {profile.nationality && (
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {profile.nationalityFlag} {profile.nationality}
                </span>
              )}
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">체격 · 계약조건</span>
              <span className="text-slate-200 font-medium block">
                {profile.height && profile.weight
                  ? `${profile.height} / ${profile.weight}`
                  : profile.height || profile.weight || '-'}
              </span>
              {(profile.salary || profile.payment) && (
                <span className="text-[11px] text-amber-300/90 block mt-0.5 font-mono truncate">
                  {profile.salary ? `연봉 ${profile.salary}` : ''}
                  {profile.payment ? ` (계약금 ${profile.payment})` : ''}
                </span>
              )}
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">
                {profile.playerCategory !== 'DOMESTIC' ? 'KBO 리그 입단' : '프로 입단'}
              </span>
              <span className="text-slate-200 font-medium block">
                {profile.kboDebutYear ? `${profile.kboDebutYear}년` : (profile.debutYear ? `${profile.debutYear}년` : '')}{' '}
                {profile.kboDebutTeam || profile.debutTeam || '-'}
              </span>
              {profile.draftInfo && (
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={profile.draftInfo}>
                  {profile.draftInfo}
                </span>
              )}
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">
                {profile.playerCategory !== 'DOMESTIC' ? '프로 · 해외 데뷔' : '입단 계약'}
              </span>
              {profile.playerCategory !== 'DOMESTIC' ? (
                <>
                  <span className="text-slate-200 font-medium block truncate" title={profile.proDebutTeam}>
                    {profile.proDebutYear ? `${profile.proDebutYear}년 ` : ''}
                    {profile.proDebutTeam || '-'}
                  </span>
                  <span className="text-[10px] text-indigo-300 block mt-0.5">해외/메이저 공식 데뷔</span>
                </>
              ) : (
                <>
                  <span className="text-slate-200 font-medium block">
                    {profile.payment ? `계약금 ${profile.payment}` : (profile.salary ? `연봉 ${profile.salary}` : '-')}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">KBO 공식 등록</span>
                </>
              )}
            </div>
          </div>

          {/* 출신 학교 / 아카데미 카드 (전체 폭) */}
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/70 text-xs text-left">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">
                {profile.playerCategory !== 'DOMESTIC' ? '🎓 출신 학교 및 육성 이력' : '🎓 출신 학교'}
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                ({sortedSchools.length > 0 ? `${sortedSchools.length}개 기관` : '미기재'})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {sortedSchools.map((s, idx) => {
                const isUniv = s.includes('대') || s.includes('대학') || s.includes('College') || s.includes('칼리지');
                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      isUniv
                        ? 'bg-blue-950/80 text-blue-200 border-blue-800/70 font-bold'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {s}
                  </span>
                );
              })}
              {sortedSchools.length === 0 && (
                <span className="text-slate-500 text-[11px]">등록된 출신교 정보가 없습니다.</span>
              )}
            </div>
          </div>

          {/* 수상 내역 뱃지 */}
          {profile.prizes && profile.prizes.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5 justify-center md:justify-start">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">주요 이력:</span>
              {profile.prizes.slice(0, 3).map((pr, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/50"
                  title={`${pr.year} ${pr.contents}`}
                >
                  🏆 {pr.contents}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
