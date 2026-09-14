import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KBO Live - 실시간 야구 문자중계 & 투수 등판 일지",
  description: "KBO 리그의 실시간 문자중계와 투수 등판 기록 및 PTS 3D 투구 궤적을 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
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
                  href="/journal"
                  className="px-3 py-1.5 rounded-lg text-blue-400 font-semibold bg-blue-950/50 border border-blue-800/50 hover:bg-blue-900/50 transition-colors flex items-center gap-1.5"
                >
                  <span>🎯</span>
                  <span>투수 등판 일지 & PTS 궤적</span>
                </Link>
              </nav>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              PTS 9-파라미터 3D 궤적 및 구종 분석
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
