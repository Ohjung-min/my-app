// Design Ref: §3.3 — 물건 수정 화면 (/items/[id]/edit). 수정 화면이 물건 상세 확인을 겸한다
import type { Metadata } from "next";
import { Suspense } from "react";
import EditItemContent from "@/components/EditItemContent";

export const metadata: Metadata = {
  title: "물건 수정 | 공매 낙찰 물건 한눈에",
};

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">물건 수정</h1>
      <p className="mb-6 text-sm text-zinc-600">
        <span className="text-red-600">*</span> 표시는 꼭 입력해야 하는 칸입니다.
        진행상황은 어느 단계로든 바꿀 수 있습니다.
      </p>
      <Suspense
        fallback={<p className="text-sm text-zinc-500">물건을 불러오는 중...</p>}
      >
        <EditItemContent params={params} />
      </Suspense>
    </main>
  );
}
