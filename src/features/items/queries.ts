// Design Ref: §2.3, §5 — 목록 조회는 이 파일(데이터 처리)이 맡고, 화면은 Supabase를 직접 부르지 않는다
// Design Ref: §5 — 목록 정렬: 1순위 진행 중(입찰·낙찰·완납·등기소 접수) 먼저 → 2순위 sort_date(낙찰일, 없으면 등록일) 최신순
// 쪽 나누기는 이 순서대로 전체를 이어서 20건씩 자른다 (PRD 5번)
// 검색(관리번호·소재지)과 진행상황 필터(작업 16번)를 적용한 결과도 같은 정렬·쪽 나누기를 쓴다
// Plan SC: 4 — 한 화면에 20건씩, 3초 이내
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ItemListRow } from "@/types/item";
import { buildSearchFilter, type ItemFilters } from "./list-params";

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
  "id, status, notice_no, category, location, awarded_on, awarded_price, buyer_name, sort_date";

/** 수정 화면에 처음 채워 넣을 물건 한 건 (Design §3.3) */
export type ItemForEdit = Pick<
  ItemListRow,
  | "id"
  | "status"
  | "notice_no"
  | "category"
  | "location"
  | "awarded_on"
  | "awarded_price"
  | "buyer_name"
> & {
  /** 메모 (선택) */
  memo: string | null;
};

export type ItemForEditResult =
  | { status: "found"; item: ItemForEdit }
  | { status: "missing" }
  | { status: "error" };

const EDIT_COLUMNS =
  "id, status, notice_no, category, location, awarded_on, awarded_price, buyer_name, memo";

export async function getItemForEdit(id: string): Promise<ItemForEditResult> {
  // 주소의 id가 올바른 형식(UUID)이 아니면 DB에 묻지 않고 "없음"으로 본다
  if (!z.uuid().safeParse(id).success) return { status: "missing" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(EDIT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return { status: "error" };
  if (!data) return { status: "missing" };
  return { status: "found", item: data as ItemForEdit };
}

export async function getItemsPage(
  page: number,
  filters: ItemFilters = {},
): Promise<ItemsPage> {
  const supabase = await createClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  /** 검색·필터 조건을 건 조회. 목록과 건수 세기가 같은 조건을 쓰도록 한곳에 둔다 */
  const filteredQuery = (options: { head?: boolean } = {}) => {
    let query = supabase
      .from("items")
      .select(options.head ? "id" : LIST_COLUMNS, {
        count: "exact",
        head: options.head,
      });
    // 검색: 관리번호나 소재지에 글자가 들어 있으면 대소문자 구분 없이 찾는다 (작업 16번, 2026-11-05 물건명 삭제로 변경)
    if (filters.q) {
      query = query.or(buildSearchFilter(filters.q));
    }
    // 진행상황 필터: 고른 단계 하나만 (작업 16번)
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    return query;
  };

  const { data, count, error } = await filteredQuery()
    // 진행 중(true)이 먼저 오도록 내림차순
    .order("is_in_progress", { ascending: false })
    .order("sort_date", { ascending: false })
    // 같은 날짜끼리는 먼저 등록한 것이 뒤로 가도록 등록 시각으로 한 번 더 정렬한다
    .order("created_at", { ascending: false })
    .range(from, to);

  // 쪽 번호가 전체 건수보다 크면 Supabase가 "요청한 범위가 없다"(PGRST103)는 오류를 돌려준다.
  // 오류 화면 대신, 건수만 다시 세어서 돌려주면 화면이 마지막 쪽으로 보내 준다
  if (error?.code === "PGRST103") {
    const { count: total, error: countError } = await filteredQuery({ head: true });
    if (countError) return { ok: false };
    return {
      ok: true,
      items: [],
      total: total ?? 0,
      page,
      pageCount: getPageCount(total ?? 0),
    };
  }

  if (error) {
    return { ok: false };
  }

  const total = count ?? 0;
  return {
    ok: true,
    // 조회하는 칸이 상황에 따라 달라 Supabase가 모양을 미리 알 수 없어서, LIST_COLUMNS의 모양으로 직접 지정한다
    items: (data ?? []) as unknown as ItemListRow[],
    total,
    page,
    pageCount: getPageCount(total),
  };
}
