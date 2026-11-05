import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "공매 낙찰 물건 한눈에",
  description: "공매 낙찰 물건의 진행상황을 팀이 함께 관리하는 서비스",
};

// Design Ref: §2.3 — layout.tsx는 모든 화면의 공통 틀(상단 메뉴·알림 종)을 맡는다
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 알림을 불러오는 부분은 Suspense로 감싼다 (Next.js 16 Cache Components 규칙) */}
        <Suspense fallback={null}>
          <AppHeader />
        </Suspense>
        <div className="flex-1">{children}</div>
        {/* 공식 서비스로 오해하지 않도록 작게 안내한다 */}
        <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500">
          서울동부지역본부 팀 내부용 비공식 서비스입니다. 캠코 로고를 사용했지만 캠코의 공식 서비스가 아닙니다.
        </footer>
      </body>
    </html>
  );
}
