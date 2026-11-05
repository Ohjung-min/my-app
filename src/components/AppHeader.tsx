// Design Ref: §3.2 — 모든 화면 위쪽에 공통으로 보이는 틀: 서비스 이름, 알림 종
// 알림 종(🔔): 진행상황이 바뀌면 생기는 알림의 안 읽은 개수와 최근 목록 (작업 17번)
// 로그인 없이 누구나 쓰는 서비스로 바뀌었다 (2026-11-05 결정). 그래서 이메일 표시와 [로그아웃]은 없다
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import { getRecentNotifications } from "@/features/notifications/queries";

export default async function AppHeader() {
  // 알림을 불러오지 못해도 상단 틀은 그대로 보여 준다
  const recent = await getRecentNotifications();

  // 캠코 로고의 남색에 맞춰 위에 남색 선을 두고 깔끔한 흰 바탕으로 꾸민다 (2026-11-05)
  return (
    <header className="border-b border-white/10 bg-gradient-to-b from-[#0d2a63] to-[#07142e] shadow-lg">
      {/* 남색 → 빨강으로 이어지는 얇은 띠 (캠코 로고 색) */}
      <div className="h-2.5 bg-gradient-to-r from-[#183a76] via-[#183a76] to-[#ed1c24]" />
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:py-6">
        <Link href="/" className="flex items-center gap-3 sm:gap-5">
          {/* 로고 파일: public/kamco-logo.png (가로 2000 x 세로 1279) */}
          <Image
            src="/kamco-logo.png"
            alt="캠코 로고"
            width={150}
            height={96}
            className="h-14 w-auto rounded-xl bg-white px-2 py-1 sm:h-24 sm:px-3 sm:py-2"
            priority
          />
          <span className="flex flex-col gap-1 leading-tight">
            <span className="text-xl font-black text-white sm:text-3xl">
              공매 낙찰 물건 한눈에
            </span>
            <span className="text-xs text-white/70 sm:text-base">
              <strong className="font-bold text-white">서울동부지역본부</strong>
              {" · "}입찰부터 등기완료까지 진행상황을 함께 관리
            </span>
          </span>
        </Link>

        <NotificationBell notifications={recent.ok ? recent.items : null} />
      </div>
    </header>
  );
}
