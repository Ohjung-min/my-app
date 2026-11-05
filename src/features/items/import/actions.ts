"use server";

// Design Ref: §3.4, §5 — 일괄 등록: [미리보기] → 결과 요약(등록 가능 / 오류 / 건너뜀) → [등록]
// 미리보기와 등록 모두 서버에서 같은 검사(analyzeRows)를 거친다. 등록할 때 화면이 보낸 값을 믿지 않고 다시 검사한다
// 일괄 등록으로 새로 등록되는 물건에는 알림을 남기지 않는다 (PRD: 알림은 진행상황이 바뀔 때만)
import { createClient } from "@/lib/supabase/server";
import { analyzeRows, type ImportRowResult } from "./analyze";
import {
  IMPORT_COLUMNS,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  MAX_IMPORT_TEXT_LENGTH,
  gridToRows,
  parseDelimited,
  type ImportRawRow,
} from "./parse";
import { readXlsx } from "./xlsx";

/** 화면에 보여 줄 한 줄의 결과 */
export type ImportPreviewRow = Omit<ImportRowResult, "data">;

export type ImportPreviewState = {
  error?: string;
  preview?: {
    rows: ImportPreviewRow[];
    counts: { ok: number; duplicate: number; error: number };
    /** 첫 줄에서 알아보지 못해 무시한 열 이름 */
    ignoredHeaders: string[];
  };
};

export type ImportCommitState = {
  error?: string;
  result?: { inserted: number; duplicate: number; error: number };
};

const DUPLICATE_CHECK_FAILED =
  "같은 물건이 이미 있는지 확인하지 못했습니다. 잠시 후 다시 시도해 주세요";

/** CSV 글자 해석: UTF-8을 먼저 시도하고, 안 되면 한국어 엑셀이 저장하는 EUC-KR(CP949)로 읽는다 */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("euc-kr").decode(buffer);
  }
}

/** 미리보기: 붙여넣은 글 또는 올린 파일을 읽어 줄마다 등록 가능 / 건너뜀 / 오류를 알려 준다 (저장하지 않는다) */
export async function previewImport(
  _prevState: ImportPreviewState,
  formData: FormData,
): Promise<ImportPreviewState> {
  const pasted = String(formData.get("pasted") ?? "");
  const entry = formData.get("file");
  const file = entry instanceof File && entry.size > 0 ? entry : null;

  if (!pasted.trim() && !file) {
    return { error: "표를 붙여넣거나 파일을 선택해 주세요" };
  }
  if (pasted.trim() && file) {
    return { error: "붙여넣기와 파일 중 하나만 사용해 주세요" };
  }

  let grid: string[][];
  if (file) {
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return {
        error: `파일이 너무 큽니다. ${Math.floor(MAX_IMPORT_FILE_BYTES / 1024)}KB 이하로 올려 주세요`,
      };
    }
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".xlsx")) {
      const read = await readXlsx(await file.arrayBuffer());
      if (!read) {
        return { error: "엑셀 파일을 읽지 못했습니다. 파일이 손상되지 않았는지 확인해 주세요" };
      }
      grid = read;
    } else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      grid = parseDelimited(decodeText(await file.arrayBuffer()));
    } else {
      return {
        error: "엑셀(.xlsx)이나 CSV(.csv) 파일만 올릴 수 있습니다. .xls 파일은 .xlsx로 다시 저장해 주세요",
      };
    }
  } else {
    if (pasted.length > MAX_IMPORT_TEXT_LENGTH) {
      return { error: "붙여넣은 내용이 너무 깁니다. 나눠서 올려 주세요" };
    }
    grid = parseDelimited(pasted);
  }

  const parsed = gridToRows(grid);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const analysis = await analyzeRows(supabase, parsed.rows);
  if (!analysis.ok) return { error: DUPLICATE_CHECK_FAILED };

  const rows: ImportPreviewRow[] = analysis.results.map((r) => ({
    rowNumber: r.rowNumber,
    label: r.label,
    status: r.status,
    messages: r.messages,
    values: r.values,
  }));
  const count = (status: ImportRowResult["status"]) =>
    rows.filter((r) => r.status === status).length;

  return {
    preview: {
      rows,
      counts: { ok: count("ok"), duplicate: count("duplicate"), error: count("error") },
      ignoredHeaders: parsed.ignoredHeaders,
    },
  };
}

/** 화면이 보낸 줄 목록(JSON)을 안전하게 읽는다. 모양이 이상하면 null */
function readRowsPayload(raw: FormDataEntryValue | null): ImportRawRow[] | null {
  if (typeof raw !== "string") return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(json) || json.length === 0 || json.length > MAX_IMPORT_ROWS) {
    return null;
  }

  const rows: ImportRawRow[] = [];
  for (const item of json) {
    if (typeof item !== "object" || item === null) return null;
    const record = item as Record<string, unknown>;
    const rowNumber = Number(record.rowNumber);
    if (!Number.isInteger(rowNumber) || rowNumber < 1) return null;

    const values = Object.fromEntries(
      IMPORT_COLUMNS.map((c) => [
        c.field,
        typeof record[c.field] === "string" ? (record[c.field] as string) : "",
      ]),
    ) as ImportRawRow["values"];
    rows.push({ rowNumber, values });
  }
  return rows;
}

/** 등록: 미리보기에서 "등록 가능"이던 줄을 다시 검사한 뒤 한꺼번에 저장한다 (하나라도 실패하면 모두 저장하지 않는다) */
export async function commitImport(
  _prevState: ImportCommitState,
  formData: FormData,
): Promise<ImportCommitState> {
  const rows = readRowsPayload(formData.get("rows"));
  if (!rows) {
    return { error: "등록할 내용을 읽지 못했습니다. 미리보기부터 다시 해 주세요" };
  }

  const supabase = await createClient();

  // 미리보기 뒤에 다른 팀원이 같은 물건을 등록했을 수 있으므로 다시 검사한다
  const analysis = await analyzeRows(supabase, rows);
  if (!analysis.ok) return { error: DUPLICATE_CHECK_FAILED };

  const ready = analysis.results.flatMap((r) => (r.status === "ok" && r.data ? [r.data] : []));
  const duplicate = analysis.results.filter((r) => r.status === "duplicate").length;
  const error = analysis.results.filter((r) => r.status === "error").length;

  if (ready.length === 0) {
    return {
      error: "등록할 수 있는 물건이 없습니다. 이미 등록되었거나 고칠 내용이 있는 줄만 남았습니다",
    };
  }

  // 모든 줄이 같은 칸을 갖도록 맞춰 보낸다 (비운 선택 칸은 null)
  const payload = ready.map((d) => ({
    status: d.status,
    notice_no: d.notice_no,
    category: d.category,
    location: d.location,
    awarded_on: d.awarded_on ?? null,
    awarded_price: d.awarded_price ?? null,
    buyer_name: d.buyer_name ?? null,
    memo: d.memo ?? null,
  }));

  const { error: insertError } = await supabase.from("items").insert(payload);
  if (insertError) {
    if (insertError.code === "42501") {
      return {
        error:
          "저장할 권한이 없습니다. 서비스 설정 문제일 수 있으니 관리자에게 알려 주세요",
      };
    }
    return {
      error: "저장하지 못했습니다. 한 건도 등록되지 않았으니 잠시 후 다시 시도해 주세요",
    };
  }

  return { result: { inserted: ready.length, duplicate, error } };
}
