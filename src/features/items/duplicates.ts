// Design Ref: §4.1 — 중복은 막지 않고 경고만 한다. 저장 직전에 같은 물건이 이미 있는지 조회한다
// PRD 5번 — 같은 물건명과 낙찰일이 이미 있으면 "중복일 수 있다"고 경고한다.
//           낙찰일이 없는 물건(입찰·유찰)은 공고번호가 같으면 중복으로 본다.
// 등록(작업 10번)과 수정(작업 13번), 일괄 등록(작업 15번)이 같은 기준을 쓰도록 이 파일에 모아 둔다
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ItemStatus } from "@/types/item";

/** 경고 화면에 보여 줄 이미 등록된 물건 */
export type DuplicateMatch = {
  id: string;
  name: string;
  status: ItemStatus;
  notice_no: string;
  awarded_on: string | null;
};

/** 경고 화면에 보여 줄 최대 건수 */
const MAX_MATCHES = 3;

type DuplicateCandidate = {
  name: string;
  notice_no: string;
  /** 낙찰일 (YYYY-MM-DD). 없으면 undefined */
  awarded_on?: string;
};

export type DuplicateResult =
  | { ok: true; matches: DuplicateMatch[] }
  | { ok: false };

/**
 * 같은 물건이 이미 있는지 찾는다.
 * - 낙찰일이 있으면: 물건명과 낙찰일이 모두 같은 물건
 * - 낙찰일이 없으면: 공고번호가 같은 물건
 * @param excludeId 수정할 때 자기 자신은 중복으로 보지 않기 위해 넘긴다 (작업 13번)
 */
export async function findDuplicates(
  supabase: SupabaseClient,
  candidate: DuplicateCandidate,
  excludeId?: string,
): Promise<DuplicateResult> {
  let query = supabase
    .from("items")
    .select("id, name, status, notice_no, awarded_on");

  query = candidate.awarded_on
    ? query.eq("name", candidate.name).eq("awarded_on", candidate.awarded_on)
    : query.eq("notice_no", candidate.notice_no);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(MAX_MATCHES);

  if (error) {
    return { ok: false };
  }
  return { ok: true, matches: (data ?? []) as DuplicateMatch[] };
}
