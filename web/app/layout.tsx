import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KBO Live - 실시간 야구 중계 & 투수 혹사 지수 데이터셋",
  description: "KBO 리그의 실시간 문자중계와 투수 등판 기록 기반 혹사 지수(Overwork Score) 데이터셋을 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {/* 상단 글로벌 네비게이션 바 */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 font-black text-lg text-white hover:text-blue-400 transition-colors">
                <span className="text-xl">⚾</span>
                <span>KBO LIVE</span>
              </Link>
              <nav className="flex items-center gap-1 text-xs md:text-sm font-medium">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  실시간 문자중계
                </Link>
                <Link
                  href="/pitchers"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
                >
                  <span>🔥</span>
                  <span>투수 혹사 지수 (Table Dataset)</span>
                </Link>
                <Link
                  href="/journal"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
                >
                  <span>🎯</span>
                  <span>투수 등판 일지 & PTS 궤적</span>
                </Link>
                <Link
                  href="/roster-fa"
                  className="px-3 py-1.5 rounded-lg text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
                >
                  <span>📋</span>
                  <span>라인업·등록말소 & FA 서비스타임</span>
                </Link>
              </nav>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              10개 구단 투수 피로도 분석 엔진
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
