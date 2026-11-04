// Design Ref: §3.2 — 물건 목록 화면 (/). 로그인한 팀원의 첫 화면
// 주소의 ?page= 값을 읽는 부분은 Suspense로 감싸야 한다 (Next.js 16 Cache Components 규칙)
import { Suspense } from "react";
import ItemsList from "@/components/ItemsList";

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">낙찰 물건 목록</h1>
      <Suspense
        fallback={<p className="text-sm text-zinc-500">목록을 불러오는 중...</p>}
      >
        <ItemsList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
