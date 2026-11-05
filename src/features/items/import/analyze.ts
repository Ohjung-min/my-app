// Design Ref: §3.4, §5 — 일괄 등록 미리보기: 줄마다 규칙 검사 → 파일 안 중복 → 이미 등록된 물건(DB) 확인
// 중복 기준은 한 건씩 등록할 때와 같다 (PRD 5번, duplicates.ts):
//   낙찰일이 있으면 소재지+낙찰일이 같은 물건, 낙찰일이 없으면 관리번호가 같은 물건
//   (2026-11-05: 물건명 칸이 없어져 소재지가 그 역할을 이어받았고, 공고번호는 관리번호로 이름이 바뀌었다)
// 일괄 등록에서는 경고 대신 "건너뜀"으로 처리한다 (이미 있는 물건은 건너뛰어 누락·중복을 줄인다)
import type { SupabaseClient } from "@supabase/supabase-js";
import { itemFormSchema, type ItemFormField, type ItemFormInput } from "@/features/items/schema";
import type { ImportRawRow } from "./parse";

export type ImportRowStatus = "ok" | "duplicate" | "error";

export type ImportRowResult = {
  rowNumber: number;
  /** 화면에 보여 줄 이름: 소재지 (비어 있으면 빈 글자) */
  label: string;
  status: ImportRowStatus;
  /** 오류·건너뜀 이유 (등록 가능이면 빈 목록) */
  messages: string[];
  /** 입력한 값 그대로 (등록 단계에서 다시 검사한다) */
  values: Record<ItemFormField, string>;
  /** 규칙 검사를 통과한 값. status가 ok일 때만 있다 */
  data?: ItemFormInput;
};

export type AnalyzeResult =
  | { ok: true; results: ImportRowResult[] }
  | { ok: false };

/** 한 번에 DB에 물어볼 소재지·관리번호 개수 (주소가 너무 길어지지 않게 나눈다) */
const CHUNK_SIZE = 50;

/** 같은 물건인지 판단하는 열쇠 */
function dateKey(location: string, awardedOn: string) {
  return `d|${location}|${awardedOn}`;
}
function noticeKey(noticeNo: string) {
  return `n|${noticeNo}`;
}
function keyOf(data: ItemFormInput) {
  return data.awarded_on
    ? dateKey(data.location, data.awarded_on)
    : noticeKey(data.notice_no);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** DB에서 이미 등록된 물건의 열쇠를 모은다. 조회가 실패하면 null */
async function loadExistingKeys(
  supabase: SupabaseClient,
  candidates: ItemFormInput[],
): Promise<Set<string> | null> {
  const locations = [...new Set(candidates.filter((c) => c.awarded_on).map((c) => c.location))];
  const notices = [...new Set(candidates.filter((c) => !c.awarded_on).map((c) => c.notice_no))];

  const existing = new Set<string>();

  const jobs: Promise<boolean>[] = [
    ...chunk(locations, CHUNK_SIZE).map(async (part) => {
      const { data, error } = await supabase
        .from("items")
        .select("location, awarded_on")
        .in("location", part);
      if (error) return false;
      for (const row of data ?? []) {
        // 낙찰일이 있는 물건만 "소재지+낙찰일"로 비교한다
        if (row.awarded_on) existing.add(dateKey(row.location, row.awarded_on));
      }
      return true;
    }),
    ...chunk(notices, CHUNK_SIZE).map(async (part) => {
      const { data, error } = await supabase
        .from("items")
        .select("notice_no")
        .in("notice_no", part);
      if (error) return false;
      for (const row of data ?? []) existing.add(noticeKey(row.notice_no));
      return true;
    }),
  ];

  const done = await Promise.all(jobs);
  return done.every(Boolean) ? existing : null;
}

/** 파일에서 읽은 줄들을 검사하고, 줄마다 등록 가능 / 건너뜀 / 오류를 정한다 */
export async function analyzeRows(
  supabase: SupabaseClient,
  rows: ImportRawRow[],
): Promise<AnalyzeResult> {
  // 1) 줄마다 규칙 검사 (필수 칸, 단계별 필수 3칸, 형식)
  const results: ImportRowResult[] = rows.map(({ rowNumber, values }) => {
    const parsed = itemFormSchema.safeParse(values);
    if (parsed.success) {
      return { rowNumber, label: values.location, status: "ok", messages: [], values, data: parsed.data };
    }
    const messages = [...new Set(parsed.error.issues.map((i) => i.message))];
    return { rowNumber, label: values.location, status: "error", messages, values };
  });

  // 2) 파일 안에서 같은 물건이 두 번 나오면 뒤의 줄을 건너뛴다
  //    DB와 비교할 때와 같은 기준이다: 낙찰일이 있으면 소재지+낙찰일, 낙찰일이 없으면 관리번호.
  //    낙찰일이 없는 줄은 앞선 "모든" 줄(낙찰일이 있는 줄 포함)의 관리번호와 비교한다
  const firstSeen = new Map<string, number>();
  const firstSeenNotice = new Map<string, number>();
  for (const result of results) {
    if (result.status !== "ok" || !result.data) continue;
    const key = keyOf(result.data);
    const first = result.data.awarded_on
      ? firstSeen.get(key)
      : firstSeenNotice.get(result.data.notice_no);
    if (first !== undefined) {
      result.status = "duplicate";
      result.messages = [`파일 안의 ${first}번째 줄과 같은 물건입니다`];
      delete result.data;
    } else {
      firstSeen.set(key, result.rowNumber);
      if (!firstSeenNotice.has(result.data.notice_no)) {
        firstSeenNotice.set(result.data.notice_no, result.rowNumber);
      }
    }
  }

  // 3) 이미 등록된 물건은 건너뛴다
  const candidates = results.flatMap((r) => (r.status === "ok" && r.data ? [r.data] : []));
  if (candidates.length > 0) {
    const existing = await loadExistingKeys(supabase, candidates);
    if (existing === null) return { ok: false };

    for (const result of results) {
      if (result.status !== "ok" || !result.data) continue;
      if (existing.has(keyOf(result.data))) {
        result.status = "duplicate";
        result.messages = ["이미 등록된 물건입니다"];
        delete result.data;
      }
    }
  }

  return { ok: true, results };
}
