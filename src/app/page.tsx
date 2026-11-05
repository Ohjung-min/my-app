// 첫 화면 (/): 진행상황별 물건 건수를 한눈에 보여 준다 (2026-11-05 요청)
// [공매 낙찰 물건 한눈에] 제목과 건수 카드를 누르면 목록 화면(/items)으로 넘어간다
// 건수는 DB에서 읽으므로 Suspense로 감싼다 (Next.js 16 Cache Components 규칙)
import Link from "next/link";
import { Suspense } from "react";
import { getStatusCounts } from "@/features/items/queries";
import { buildListHref } from "@/features/items/list-params";
import { ITEM_STATUSES, type ItemStatus } from "@/types/item";

// 카드 색: 목록의 진행상황 배지 색과 같은 계열
// 입체감: 위에서 아래로 번지는 그라데이션 + 위쪽 밝은 선 + 아래쪽 굵은 색 테두리 + 그림자
const CARD_STYLES: Record<ItemStatus, string> = {
  입찰: "from-white to-zinc-200 border-zinc-400 text-zinc-800 shadow-zinc-400/60",
  낙찰: "from-sky-50 to-blue-200 border-blue-500 text-blue-900 shadow-blue-400/60",
  완납: "from-amber-50 to-orange-200 border-orange-500 text-orange-900 shadow-orange-400/60",
  "등기소 접수": "from-violet-50 to-violet-200 border-violet-500 text-violet-900 shadow-violet-400/60",
  등기완료: "from-emerald-50 to-green-200 border-green-600 text-green-900 shadow-green-400/60",
  유찰: "from-rose-50 to-red-200 border-red-500 text-red-900 shadow-red-400/60",
};

async function StatusCards() {
  const result = await getStatusCounts();
  if (!result.ok) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        건수를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-zinc-600">
        전체 <strong className="text-lg text-[#183a76]">{result.total}</strong>건
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ITEM_STATUSES.map((status) => (
          <li key={status}>
            <Link
              href={buildListHref(1, { status })}
              className={`flex flex-nowrap items-baseline justify-center gap-x-2 whitespace-nowrap rounded-xl border-2 border-b-[6px] bg-gradient-to-b px-2 py-5 shadow-lg sm:gap-x-3 sm:px-5 ring-1 ring-inset ring-white/70 transition hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5 active:border-b-2 ${CARD_STYLES[status]}`}
            >
              <span className="text-base font-bold min-[480px]:text-xl sm:text-2xl">{status}</span>
              <span className="text-2xl font-extrabold min-[480px]:text-3xl sm:text-4xl">
                {result.counts[status]}
                <span className="ml-1 text-base font-semibold sm:text-lg">건</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-8 pt-20 sm:pt-28">
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">
        <Link
          href="/items"
          className="text-[#183a76] underline-offset-4 hover:underline"
        >
          공매 낙찰 물건 한눈에
        </Link>
      </h1>

      <Suspense
        fallback={<p className="text-sm text-zinc-500">건수를 불러오는 중...</p>}
      >
        <StatusCards />
      </Suspense>

      <div className="mt-6">
        <Link
          href="/items"
          className="inline-block rounded-md bg-[#183a76] px-4 py-2 text-sm font-medium text-white hover:bg-[#122c5a]"
        >
          전체 목록 보기
        </Link>
      </div>
    </main>
  );
}
