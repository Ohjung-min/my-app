// Design Ref: §2.3, §5 — 목록 조회는 이 파일(데이터 처리)이 맡고, 화면은 Supabase를 직접 부르지 않는다
// Design Ref: §5 — 목록 정렬: 1순위 진행 중(입찰·낙찰·완납) 먼저 → 2순위 sort_date(낙찰일, 없으면 등록일) 최신순
// 쪽 나누기는 이 순서대로 전체를 이어서 20건씩 자른다 (PRD 5번)
// Plan SC: 4 — 한 화면에 20건씩, 3초 이내
import { createClient } from "@/lib/supabase/server";
import type { ItemListRow } from "@/types/item";

/** 한 화면에 보여 주는 건수 (PRD 5번) */
export const PAGE_SIZE = 20;

/** 주소의 ?page= 값을 1 이상의 정수로 바로잡는다. 이상한 값이면 1쪽 */
export function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** 전체 건수로 쪽 수를 계산한다. 물건이 없어도 최소 1쪽 */
export function getPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export type ItemsPage =
  | { ok: true; items: ItemListRow[]; total: number; page: number; pageCount: number }
  | { ok: false };

const LIST_COLUMNS =
  "id, name, status, notice_no, category, location, awarded_on, awarded_price, buyer_name, sort_date";

export async function getItemsPage(page: number): Promise<ItemsPage> {
  const supabase = await createClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("items")
    .select(LIST_COLUMNS, { count: "exact" })
    // 진행 중(true)이 먼저 오도록 내림차순
    .order("is_in_progress", { ascending: false })
    .order("sort_date", { ascending: false })
    // 같은 날짜끼리는 먼저 등록한 것이 뒤로 가도록 등록 시각으로 한 번 더 정렬한다
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { ok: false };
  }

  const total = count ?? 0;
  return {
    ok: true,
    items: (data ?? []) as ItemListRow[],
    total,
    page,
    pageCount: getPageCount(total),
  };
}
