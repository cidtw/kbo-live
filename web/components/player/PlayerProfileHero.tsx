'use client';

import React from 'react';
import { PlayerProfile } from '@/lib/domain/playerApi';

interface PlayerProfileHeroProps {
  profile: PlayerProfile;
}

export default function PlayerProfileHero({ profile }: PlayerProfileHeroProps) {
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
              // 이미지 로드 실패 시 디폴트 플레이스홀더
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
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {profile.name}
            </h1>
          </div>

          {/* 세부 인적사항 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">생년월일</span>
              <span className="text-slate-200 font-medium">
                {profile.birthDateKor || profile.birthDate || '-'}
                {profile.age && <span className="text-slate-400 ml-1">({profile.age})</span>}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">체격 / 신체</span>
              <span className="text-slate-200 font-medium">
                {profile.height && profile.weight
                  ? `${profile.height} / ${profile.weight}`
                  : profile.height || profile.weight || '-'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">프로 입단</span>
              <span className="text-slate-200 font-medium">
                {profile.debutYear ? `${profile.debutYear}년` : '-'}
                {profile.debutTeam && <span className="text-slate-400 block truncate">{profile.debutTeam}</span>}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-0.5">출신 학교</span>
              <div className="text-slate-200 font-medium truncate" title={profile.schools.join(', ')}>
                {profile.schools.length > 0 ? profile.schools.join(', ') : '-'}
              </div>
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
