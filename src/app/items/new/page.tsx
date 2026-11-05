// Design Ref: §3.3 — 물건 등록 화면 (/items/new)
import type { Metadata } from "next";
import ItemForm from "@/components/ItemForm";

export const metadata: Metadata = {
  title: "물건 등록 | 공매 낙찰 물건 한눈에",
};

export default function NewItemPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">물건 등록</h1>
      <p className="mb-6 text-sm text-zinc-600">
        <span className="text-red-600">*</span> 표시는 꼭 입력해야 하는 칸입니다.
      </p>
      <ItemForm />
    </main>
  );
}
