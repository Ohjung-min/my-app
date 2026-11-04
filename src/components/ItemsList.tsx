// Design Ref: §3.2 — 물건 목록 화면의 본문: 표, 쪽 번호, 빈 화면, 오류 안내
// Design Ref: §6 — 불러오지 못하면 "잠시 후 다시 시도해 주세요"를 보여 준다
import { redirect } from "next/navigation";
import ItemsTable from "@/components/ItemsTable";
import Pagination from "@/components/Pagination";
import { getItemsPage, parsePage } from "@/features/items/queries";

export default async function ItemsList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const result = await getItemsPage(parsePage(pageParam));

  if (!result.ok) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        물건 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  // 물건이 있는데 쪽 번호가 너무 크면 마지막 쪽으로 보낸다
  if (result.total > 0 && result.page > result.pageCount) {
    redirect(result.pageCount === 1 ? "/" : `/?page=${result.pageCount}`);
  }

  if (result.total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-600">
        아직 등록된 물건이 없습니다.
      </p>
    );
  }

  return (
    <>
      <p className="mb-2 text-sm text-zinc-600">전체 {result.total.toLocaleString("ko-KR")}건</p>
      <ItemsTable items={result.items} />
      <Pagination page={result.page} pageCount={result.pageCount} />
    </>
  );
}
