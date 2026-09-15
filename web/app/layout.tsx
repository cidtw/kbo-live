import type { Metadata } from "next";
import "./globals.css";
import { GlobalNavbar } from "@/components/GlobalNavbar";

export const metadata: Metadata = {
  title: "KBO Live - 실시간 야구 중계 & 통합 분석 플랫폼",
  description: "KBO 리그의 실시간 문자중계, 투수 혹사 지수, 투수 등판 일지(PTS 3D 궤적), 라인업 및 FA 서비스타임 데이터셋을 한눈에 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        {/* 상단 통일된 글로벌 네비게이션 바 */}
        <GlobalNavbar />

        {children}
      </body>
    </html>
  );
}
