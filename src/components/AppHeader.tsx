// Design Ref: §3.2 — 모든 화면 위쪽에 공통으로 보이는 틀: 서비스 이름, 알림 종
// 알림 종(🔔): 진행상황이 바뀌면 생기는 알림의 안 읽은 개수와 최근 목록 (작업 17번)
// 로그인 없이 누구나 쓰는 서비스로 바뀌었다 (2026-11-05 결정). 그래서 이메일 표시와 [로그아웃]은 없다
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import { getRecentNotifications } from "@/features/notifications/queries";

export default async function AppHeader() {
  // 알림을 불러오지 못해도 상단 틀은 그대로 보여 준다
  const recent = await getRecentNotifications();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-base font-semibold text-zinc-900 sm:text-lg"
        >
          공매 낙찰 물건 한눈에
        </Link>

        <NotificationBell notifications={recent.ok ? recent.items : null} />
      </div>
    </header>
  );
}
