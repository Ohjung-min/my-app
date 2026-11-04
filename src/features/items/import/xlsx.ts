// Design Ref: §5 — 엑셀(.xlsx) 파일을 칸의 격자로 읽는다. 서버에서만 쓴다 (exceljs는 DESIGN §8.2에서 승인됨)
import type { CellValue } from "exceljs";

/** 엑셀 칸 하나의 값을 글자로 바꾼다 (날짜는 YYYY-MM-DD, 수식은 계산된 값) */
export function cellToString(value: CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return cellToString(value.result as CellValue);
    if ("text" in value) return String(value.text);
    if ("error" in value) return "";
  }
  return String(value);
}

/** .xlsx 파일 내용에서 첫 번째 시트를 읽어 칸의 격자로 돌려준다. 읽지 못하면 null */
export async function readXlsx(buffer: ArrayBuffer): Promise<string[][] | null> {
  try {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const grid: string[][] = [];
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      // 줄 번호를 유지하기 위해 빈 줄도 자리를 채운다
      while (grid.length < rowNumber - 1) grid.push([]);
      const cells: string[] = [];
      for (let col = 1; col <= row.cellCount; col++) {
        cells.push(cellToString(row.getCell(col).value));
      }
      grid.push(cells);
    });
    return grid;
  } catch {
    return null;
  }
}
