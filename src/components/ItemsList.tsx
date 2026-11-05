// Design Ref: §3.2 — 물건 목록 화면의 본문: 검색 상자, 표, 쪽 번호, 빈 화면, 오류 안내
// Design Ref: §6 — 불러오지 못하면 "잠시 후 다시 시도해 주세요"를 보여 준다
// 검색·필터(작업 16번)는 주소의 ?q=, ?status= 로 받는다
import Link from "next/link";
import { redirect } from "next/navigation";
import ItemsFilter from "@/components/ItemsFilter";
import ItemsTable from "@/components/ItemsTable";
import Pagination from "@/components/Pagination";
import {
  buildExportHref,
  buildListHref,
  hasFilters,
  parseFilters,
} from "@/features/items/list-params";
import { getItemsPage, parsePage } from "@/features/items/queries";

export type ItemsListSearchParams = {
  page?: string;
  q?: string | string[];
  status?: string | string[];
};

export default async function ItemsList({
  searchParams,
}: {
  searchParams: Promise<ItemsListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const result = await getItemsPage(parsePage(params.page), filters);

  if (!result.ok) {
    return (
      <>
        <ItemsFilter filters={filters} />
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          물건 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </>
    );
  }

  // 물건이 있는데 쪽 번호가 너무 크면 마지막 쪽으로 보낸다 (검색 조건은 유지)
  if (result.total > 0 && result.page > result.pageCount) {
    redirect(buildListHref(result.pageCount, filters));
  }

  const filtered = hasFilters(filters);

  return (
    <>
      <ItemsFilter filters={filters} />

      {result.total === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-600">
          <p>
            {filtered
              ? "조건에 맞는 물건이 없습니다. 검색어나 진행상황을 바꿔 보세요."
              : "아직 등록된 물건이 없습니다."}
          </p>
          {filtered ? null : (
            <Link
              href="/items/new"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              + 물건 등록
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-sm text-zinc-600">
              {filtered ? "검색 결과" : "전체"}{" "}
              {result.total.toLocaleString("ko-KR")}건
            </p>
            {/* 엑셀 내려받기 (작업 18번): 지금 보는 검색·필터 결과 전체. 일반 링크라 파일이 바로 내려온다 */}
            <div className="text-right">
              <a
                href={buildExportHref(filters)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                엑셀 내려받기{filtered ? " (검색 결과 전체)" : " (전체)"}
              </a>
              <p className="mt-1 text-xs text-zinc-500">
                파일에는 낙찰가가 들어 있습니다. 팀 밖으로 공유하지 마세요. (매수자
                이름은 들어가지 않습니다)
              </p>
            </div>
          </div>
          <ItemsTable items={result.items} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            filters={filters}
          />
        </>
      )}
    </>
  );
}
