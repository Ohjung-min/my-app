// Design Ref: §3.2 — 목록의 검색(관리번호·소재지)·진행상황 필터. 조건은 주소(?q=…&status=…)에 담아서,
// 새로고침·쪽 이동·링크 공유에도 같은 결과가 나오게 한다
// 서버·화면 어디서나 쓰는 순수한 코드만 둔다 (DB 조회는 queries.ts)
import { ITEM_STATUSES, type ItemStatus } from "@/types/item";

/** 검색어 최대 글자 수 */
export const MAX_SEARCH_LENGTH = 100;

export type ItemFilters = {
  /** 관리번호나 소재지에 들어 있는 글자 (비어 있으면 없음) */
  q?: string;
  /** 진행상황 하나 (없으면 전체) */
  status?: ItemStatus;
};

/** 주소의 값은 글자 하나일 수도, 같은 이름이 여러 번 있으면 목록일 수도 있다. 첫 번째만 쓴다 */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** 주소의 ?q=, ?status= 값을 안전한 조건으로 바꾼다. 이상한 값은 무시한다(전체) */
export function parseFilters(params: {
  q?: string | string[];
  status?: string | string[];
}): ItemFilters {
  const filters: ItemFilters = {};

  const q = first(params.q)?.trim().slice(0, MAX_SEARCH_LENGTH);
  if (q) filters.q = q;

  const status = first(params.status);
  if ((ITEM_STATUSES as readonly string[]).includes(status ?? "")) {
    filters.status = status as ItemStatus;
  }
  return filters;
}

export function hasFilters(filters: ItemFilters): boolean {
  return Boolean(filters.q || filters.status);
}

/** 조건과 쪽 번호를 담은 목록 주소. 1쪽은 ?page를 생략하고, 조건이 없으면 "/items" */
export function buildListHref(page: number, filters: ItemFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/items?${query}` : "/items";
}

/** 엑셀 내려받기 주소. 현재 검색·필터 조건을 담고, 쪽 번호는 담지 않는다(결과 전체를 받는다) */
export function buildExportHref(filters: ItemFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return query ? `/items/export?${query}` : "/items/export";
}

/**
 * 검색어가 관리번호나 소재지에 들어 있는 물건을 찾는 조건(PostgREST or 조건 글자)을 만든다.
 * or(...) 안에서는 쉼표와 괄호가 구분 기호라서, 값 전체를 큰따옴표로 감싸고 \ 와 " 는 앞에 \ 를 붙인다.
 * (검색어에 쉼표·괄호·따옴표·%·_ 가 들어 있어도 글자 그대로 찾는다)
 */
export function buildSearchFilter(q: string): string {
  const pattern = `%${escapeLike(q)}%`;
  const quoted = `"${pattern.replace(/[\\"]/g, (ch) => `\\${ch}`)}"`;
  return `notice_no.ilike.${quoted},location.ilike.${quoted}`;
}

/**
 * 검색어를 LIKE 검색에 그대로 넣을 수 있게 바꾼다.
 * 사용자가 입력한 %, _, \ 는 특수문자가 아니라 글자 그대로 찾도록 앞에 \ 를 붙인다.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
