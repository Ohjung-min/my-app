// 첫 화면 (/): 진행상황별 물건 건수를 한눈에 보여 준다 (2026-11-05 요청)
// [공매 낙찰 물건 한눈에] 제목과 건수 카드를 누르면 목록 화면(/items)으로 넘어간다
// 건수는 DB에서 읽으므로 Suspense로 감싼다 (Next.js 16 Cache Components 규칙)
import Link from "next/link";
import { Suspense } from "react";
import { getStatusCounts } from "@/features/items/queries";
import { buildListHref } from "@/features/items/list-params";
import { ITEM_STATUSES, type ItemStatus } from "@/types/item";

// 카드 색: 목록의 진행상황 배지 색과 같은 계열
const CARD_STYLES: Record<ItemStatus, string> = {
  입찰: "border-zinc-300 text-zinc-700",
  낙찰: "border-blue-300 text-blue-700",
  완납: "border-orange-300 text-orange-700",
  "등기소 접수": "border-violet-300 text-violet-700",
  등기완료: "border-green-300 text-green-700",
  유찰: "border-red-300 text-red-700",
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
              className={`block rounded-lg border-2 bg-white px-4 py-4 shadow-sm transition hover:shadow-md ${CARD_STYLES[status]}`}
            >
              <span className="block text-sm font-medium">{status}</span>
              <span className="mt-1 block text-3xl font-bold">
                {result.counts[status]}
                <span className="ml-1 text-base font-normal">건</span>
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
        <Link
          href="/items"
          className="text-[#183a76] underline-offset-4 hover:underline"
        >
          공매 낙찰 물건 한눈에 →
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
