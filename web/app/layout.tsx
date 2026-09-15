import type { Metadata } from "next";
import "./globals.css";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import { GlobalFooter } from "@/components/GlobalFooter";

export const metadata: Metadata = {
  title: "KBO Live - 실시간 야구 분석 & 세이버메트릭스 랩 [3rd-Party]",
  description: "KBO 리그 실시간 문자중계, 투수 혹사 지수, 3D PTS 투구 궤적, 라인업 및 145일 FA 서비스타임 독립 서드파티 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#051124] text-slate-100 min-h-screen antialiased selection:bg-[#005BAC] selection:text-white flex flex-col font-sans">
        {/* 상단 통일된 글로벌 네비게이션 바 */}
        <GlobalNavbar />

        <div className="flex-1">
          {children}
        </div>

        {/* 하단 서드파티 텔레메트리 & 면책조항 푸터 */}
        <GlobalFooter />
      </body>
    </html>
  );
}
