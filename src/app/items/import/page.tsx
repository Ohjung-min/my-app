// Design Ref: §3.4 — 일괄 등록 화면 (/items/import). 로그인한 팀원만 볼 수 있다 (proxy.ts가 막는다)
import type { Metadata } from "next";
import ImportForm from "@/components/ImportForm";

export const metadata: Metadata = {
  title: "일괄 등록 | 공매 낙찰 물건 한눈에",
};

export default function ImportItemsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">물건 일괄 등록</h1>
      <ImportForm />
    </main>
  );
}
