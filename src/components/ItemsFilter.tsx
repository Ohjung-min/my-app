// Design Ref: §3.2 — 목록 위쪽의 [검색: 관리번호·소재지] [진행상황 ▼ 전체] (작업 16번)
// 일반 검색 폼(GET)이라 [검색]을 누르면 주소가 /?q=…&status=… 로 바뀌고, 쪽은 1쪽부터 다시 시작한다
import Link from "next/link";
import { hasFilters, MAX_SEARCH_LENGTH, type ItemFilters } from "@/features/items/list-params";
import { ITEM_STATUSES } from "@/types/item";

export default function ItemsFilter({ filters }: { filters: ItemFilters }) {
  return (
    <form
      action="/"
      method="get"
      role="search"
      className="mb-4 flex flex-wrap items-end gap-2"
    >
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <label htmlFor="q" className="text-xs font-medium text-zinc-600">
          관리번호·소재지 검색
        </label>
        <input
          id="q"
          name="q"
          type="search"
          maxLength={MAX_SEARCH_LENGTH}
          defaultValue={filters.q ?? ""}
          placeholder="관리번호나 소재지의 일부를 입력"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-xs font-medium text-zinc-600">
          진행상황
        </label>
        <select
          id="status"
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        >
          <option value="">전체</option>
          {ITEM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        검색
      </button>

      {hasFilters(filters) ? (
        <Link
          href="/"
          className="px-1 py-2 text-sm text-zinc-600 underline underline-offset-2"
        >
          조건 지우기
        </Link>
      ) : null}
    </form>
  );
}
