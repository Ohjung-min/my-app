// Design Ref: §3.2 — 물건 목록 화면 (/). 서비스의 첫 화면 (로그인 없이 누구나 볼 수 있다)
// 주소의 ?page= 값을 읽는 부분은 Suspense로 감싸야 한다 (Next.js 16 Cache Components 규칙)
import Link from "next/link";
import { Suspense } from "react";
import ItemsFilter from "@/components/ItemsFilter";
import ItemsList, { type ItemsListSearchParams } from "@/components/ItemsList";

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<ItemsListSearchParams>;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">낙찰 물건 목록</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/items/import"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            일괄 등록
          </Link>
          <Link
            href="/items/new"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            + 물건 등록
          </Link>
        </div>
      </div>
      <Suspense
        fallback={
          <>
            <ItemsFilter filters={{}} />
            <p className="text-sm text-zinc-500">목록을 불러오는 중...</p>
          </>
        }
      >
        <ItemsList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
