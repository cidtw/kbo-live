import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KBO Live - 실시간 야구 문자중계",
  description: "KBO 리그의 실시간 문자중계와 이닝 스코어보드를 한눈에 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

