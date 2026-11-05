// Design Ref: §3.2 — 목록 아래 쪽 번호 (‹ 1 2 3 ›), 20건씩
import Link from "next/link";
import { buildListHref, type ItemFilters } from "@/features/items/list-params";

const WINDOW = 2; // 현재 쪽 앞뒤로 보여 줄 쪽 번호 개수

/** 1 … 4 5 [6] 7 8 … 20 처럼 현재 쪽 주변만 보여 주기 위한 번호 목록 */
function visiblePages(current: number, pageCount: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - current) <= WINDOW) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }
  return pages;
}

export default function Pagination({
  page,
  pageCount,
  filters,
}: {
  page: number;
  pageCount: number;
  /** 검색·필터 조건. 쪽을 옮겨도 조건이 유지되도록 링크에 함께 담는다 (작업 16번) */
  filters: ItemFilters;
}) {
  if (pageCount <= 1) return null;

  const pageHref = (target: number) => buildListHref(target, filters);

  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm";

  return (
    <nav aria-label="쪽 이동" className="mt-4 flex flex-wrap justify-center gap-1">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className={`${base} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`} aria-label="이전 쪽">
          ‹
        </Link>
      ) : null}

      {visiblePages(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className={`${base} text-zinc-400`}>…</span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={`${base} bg-[#183a76] hover:bg-[#122c5a] font-medium text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={pageHref(p)} className={`${base} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`}>
            {p}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link href={pageHref(page + 1)} className={`${base} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`} aria-label="다음 쪽">
          ›
        </Link>
      ) : null}
    </nav>
  );
}
