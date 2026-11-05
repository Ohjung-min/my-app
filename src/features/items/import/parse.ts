// Design Ref: §3.4, §5 — 일괄 등록: 붙여넣은 글·CSV·엑셀에서 읽은 표(칸의 격자)를 물건 입력값으로 바꾼다
// 서버·브라우저 어디서나 쓸 수 있는 순수한 코드만 둔다 (DB·파일 읽기는 다른 파일)
import type { ItemFormField } from "@/features/items/schema";

/** 한 번에 올릴 수 있는 최대 줄 수 */
export const MAX_IMPORT_ROWS = 200;
/** 파일 최대 크기. Server Action 본문 한도(1MB)보다 작게 잡는다 */
export const MAX_IMPORT_FILE_BYTES = 800 * 1024;
/**
 * 붙여넣은 글 최대 글자 수.
 * Server Action 본문 한도(1MB)를 넘지 않게, 한글이 한 글자에 3바이트인 것을 감안해 잡았다 (30만 자 × 3 = 약 900KB)
 */
export const MAX_IMPORT_TEXT_LENGTH = 300_000;

type ImportColumn = {
  field: ItemFormField;
  /** 화면과 안내에 보여 주는 열 이름 */
  label: string;
  /** 이 열이 없으면 올릴 수 없다 */
  required: boolean;
  /** 같은 뜻으로 받아 주는 다른 이름 (띄어쓰기는 무시한다) */
  aliases: string[];
};

/**
 * 파일의 첫 줄(열 이름)로 받는 항목. DESIGN §5 일괄 등록
 * (2026-11-05: 공고번호 → 관리번호로 이름이 바뀌었고, 옛 이름도 받아 준다. 물건명 열은 없어졌다)
 */
export const IMPORT_COLUMNS: ImportColumn[] = [
  { field: "notice_no", label: "관리번호", required: true, aliases: ["공고번호"] },
  { field: "location", label: "소재지", required: true, aliases: [] },
  { field: "status", label: "진행상황", required: true, aliases: ["단계"] },
  { field: "category", label: "물건 종류", required: true, aliases: ["물건종류", "종류"] },
  { field: "awarded_on", label: "낙찰일", required: false, aliases: [] },
  { field: "awarded_price", label: "낙찰가", required: false, aliases: ["낙찰가(원)"] },
  { field: "buyer_name", label: "매수자 이름", required: false, aliases: ["매수자", "매수자이름"] },
  { field: "memo", label: "메모", required: false, aliases: [] },
];

/** 열 이름 비교용: 띄어쓰기를 없애고 소문자로 */
function normalizeHeader(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

/** 칸 값을 글자로 맞춘다 (null·undefined는 빈 글자) */
function clean(value: string | undefined) {
  return (value ?? "").trim();
}

/**
 * 글(붙여넣기·CSV 파일 내용)을 칸의 격자로 나눈다.
 * 첫 줄에 탭이 있으면 탭(엑셀에서 복사해 붙여넣은 글), 없으면 쉼표(CSV)로 나눈다.
 * 큰따옴표로 감싼 칸 안의 쉼표·줄바꿈·"" (따옴표 하나)를 처리한다.
 */
export function parseDelimited(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  // 마지막 줄 (줄바꿈 없이 끝난 경우)
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * 날짜를 YYYY-MM-DD로 맞춘다.
 * 2026-11-1, 2026/11/01, 2026.11.01, 20261101, 2026년 11월 1일을 받는다. 못 읽으면 원래 글자 그대로 둔다(검사에서 오류가 된다)
 */
export function normalizeDate(value: string): string {
  const v = value.trim();
  const pad = (n: string) => n.padStart(2, "0");

  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\.?$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

  m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = v.match(/^(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

  return v;
}

/** 파일의 한 줄을 화면 폼과 같은 칸 이름의 글 값으로 */
export type ImportRawRow = {
  /** 파일에서 몇 번째 줄인지 (첫 줄=열 이름이 1) */
  rowNumber: number;
  values: Record<ItemFormField, string>;
};

export type GridToRowsResult =
  | { ok: true; rows: ImportRawRow[]; ignoredHeaders: string[] }
  | { ok: false; error: string };

/** 칸의 격자(첫 줄은 열 이름)를 물건 입력값 목록으로 바꾼다 */
export function gridToRows(grid: string[][]): GridToRowsResult {
  // 완전히 빈 줄은 건너뛴다. 줄 번호는 원래 위치를 유지한다
  const numbered = grid.map((cells, index) => ({ cells, rowNumber: index + 1 }));
  const nonEmpty = numbered.filter((r) => r.cells.some((c) => clean(c) !== ""));

  if (nonEmpty.length === 0) {
    return { ok: false, error: "읽을 내용이 없습니다. 첫 줄에 열 이름을 넣고 아래에 물건을 적어 주세요" };
  }

  const [headerRow, ...dataRows] = nonEmpty;

  // 열 이름 → 어느 칸(필드)인지
  const columnIndex = new Map<ItemFormField, number>();
  const ignoredHeaders: string[] = [];
  headerRow.cells.forEach((cell, index) => {
    const header = normalizeHeader(cell);
    if (header === "") return;
    const column = IMPORT_COLUMNS.find(
      (c) =>
        normalizeHeader(c.label) === header ||
        c.aliases.some((a) => normalizeHeader(a) === header),
    );
    if (column && !columnIndex.has(column.field)) {
      columnIndex.set(column.field, index);
    } else {
      ignoredHeaders.push(clean(cell));
    }
  });

  const missing = IMPORT_COLUMNS.filter(
    (c) => c.required && !columnIndex.has(c.field),
  ).map((c) => c.label);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `첫 줄(열 이름)에 꼭 필요한 열이 없습니다: ${missing.join(", ")}`,
    };
  }

  if (dataRows.length === 0) {
    return { ok: false, error: "열 이름 아래에 물건이 없습니다" };
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `한 번에 ${MAX_IMPORT_ROWS}건까지 올릴 수 있습니다. 지금은 ${dataRows.length}건입니다. 나눠서 올려 주세요`,
    };
  }

  const rows = dataRows.map(({ cells, rowNumber }) => {
    const get = (field: ItemFormField) => {
      const index = columnIndex.get(field);
      return index === undefined ? "" : clean(cells[index]);
    };
    const values = {
      status: get("status"),
      notice_no: get("notice_no"),
      category: get("category"),
      location: get("location"),
      awarded_on: normalizeDate(get("awarded_on")),
      awarded_price: get("awarded_price"),
      buyer_name: get("buyer_name"),
      memo: get("memo"),
    } satisfies Record<ItemFormField, string>;
    return { rowNumber, values };
  });

  return { ok: true, rows, ignoredHeaders };
}
