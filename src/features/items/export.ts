// Design Ref: §2.3, §5 — 엑셀 내려받기: 현재 검색·필터 결과 전체를 파일로 만든다 (작업 18번)
// PRD 5번·7번 — 매수자 이름 열은 넣지 않는다. 낙찰가는 내부용이므로 파일을 팀 밖으로 공유하지 않는다.
// 매수자 이름은 파일에 안 넣는 데서 그치지 않고, 조회할 때 아예 가져오지 않는다.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ItemFilters } from "./list-params";
import { escapeLike } from "./list-params";
import type { ItemStatus } from "@/types/item";

/** 내려받을 수 있는 최대 건수. 이보다 많으면 검색 조건을 좁히도록 안내한다 */
export const MAX_EXPORT_ROWS = 10_000;

/** 한 번에 DB에서 가져오는 건수 (Supabase 한 번 응답의 기본 최대가 1000건이다) */
const FETCH_SIZE = 1000;

/** 내려받는 파일의 한 줄. 매수자 이름(buyer_name)과 메모는 의도적으로 없다 */
export type ExportRow = {
  status: ItemStatus;
  name: string;
  notice_no: string;
  category: string;
  location: string;
  awarded_on: string | null;
  awarded_price: number | null;
};

/** 조회할 칸. 여기에 buyer_name이 없다는 것이 PRD 7번 "파일에 매수자 이름 없음"의 핵심이다 */
const EXPORT_COLUMNS = "status, name, notice_no, category, location, awarded_on, awarded_price";

/** 파일의 열 (목록과 같은 순서에 공고번호를 더하고 매수자는 뺐다). 일괄 등록 열 이름과 같다 */
const SHEET_COLUMNS = [
  { header: "진행상황", key: "status", width: 10 },
  { header: "물건명", key: "name", width: 28 },
  { header: "공고번호", key: "notice_no", width: 18 },
  { header: "물건 종류", key: "category", width: 10 },
  { header: "소재지", key: "location", width: 30 },
  { header: "낙찰일", key: "awarded_on", width: 12 },
  { header: "낙찰가", key: "awarded_price", width: 16 },
] as const;

export type ExportResult =
  | { ok: true; rows: ExportRow[] }
  | { ok: false; reason: "too-many" | "error" };

/** 현재 검색·필터에 맞는 물건 전체를 목록과 같은 정렬로 가져온다 */
export async function getItemsForExport(
  supabase: SupabaseClient,
  filters: ItemFilters,
): Promise<ExportResult> {
  const rows: ExportRow[] = [];

  for (let from = 0; ; from += FETCH_SIZE) {
    let query = supabase.from("items").select(EXPORT_COLUMNS);
    if (filters.q) query = query.ilike("name", `%${escapeLike(filters.q)}%`);
    if (filters.status) query = query.eq("status", filters.status);

    const { data, error } = await query
      // 목록과 같은 정렬: 진행 중 먼저 → 낙찰일(없으면 등록일) 최신순 → 등록 시각 최신순
      .order("is_in_progress", { ascending: false })
      .order("sort_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + FETCH_SIZE - 1);

    if (error) return { ok: false, reason: "error" };

    const page = (data ?? []) as ExportRow[];
    rows.push(...page);

    if (rows.length > MAX_EXPORT_ROWS) return { ok: false, reason: "too-many" };
    if (page.length < FETCH_SIZE) break;
  }

  return { ok: true, rows };
}

/** 낙찰일(YYYY-MM-DD)을 엑셀 날짜 칸 값으로. 엑셀이 시간대로 하루 밀리지 않게 UTC 자정으로 만든다 */
function toExcelDate(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** 물건 목록을 엑셀(.xlsx) 파일 내용으로 만든다 */
export async function buildItemsWorkbook(rows: ExportRow[]): Promise<Uint8Array> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("낙찰 물건", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = SHEET_COLUMNS.map((c) => ({ ...c }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      status: row.status,
      name: row.name,
      notice_no: row.notice_no,
      category: row.category,
      location: row.location,
      awarded_on: toExcelDate(row.awarded_on),
      awarded_price: row.awarded_price,
    });
  }

  sheet.getColumn("awarded_on").numFmt = "yyyy-mm-dd";
  sheet.getColumn("awarded_price").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

/** 파일 이름: 낙찰물건_20261104.xlsx (한국 시간 기준 오늘) */
export function exportFileName(now: Date = new Date()): string {
  const ymd = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" })
    .format(now)
    .replaceAll("-", "");
  return `낙찰물건_${ymd}.xlsx`;
}
