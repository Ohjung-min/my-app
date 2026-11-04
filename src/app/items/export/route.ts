// Design Ref: §5 — 엑셀 내려받기 주소 (/items/export?q=…&status=…). 현재 검색·필터 결과 전체를 .xlsx로 내려 준다 (작업 18번)
// Design Ref: §7 — 로그인한 팀원만 받을 수 있다: proxy.ts가 한 번 막고, 여기서 로그인을 한 번 더 확인한다 (두 겹)
// PRD 7번 — 파일에 매수자 이름을 넣지 않는다 (export.ts가 조회 단계에서부터 가져오지 않는다)
import type { NextRequest } from "next/server";
import { buildItemsWorkbook, exportFileName, getItemsForExport, MAX_EXPORT_ROWS } from "@/features/items/export";
import { parseFilters } from "@/features/items/list-params";
import { createClient } from "@/lib/supabase/server";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** 한국어 안내 글을 담은 오류 응답 */
function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 로그인 확인 (proxy.ts를 통과했더라도 서버에서 다시 확인한다)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return textError("로그인이 필요합니다.", 401);
  }

  const { searchParams } = request.nextUrl;
  const filters = parseFilters({
    q: searchParams.getAll("q"),
    status: searchParams.getAll("status"),
  });

  const result = await getItemsForExport(supabase, filters);
  if (!result.ok) {
    return result.reason === "too-many"
      ? textError(
          `${MAX_EXPORT_ROWS.toLocaleString("ko-KR")}건을 넘어 내려받을 수 없습니다. 검색어나 진행상황으로 범위를 좁혀 주세요.`,
          422,
        )
      : textError("물건 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  const body = await buildItemsWorkbook(result.rows);
  const fileName = exportFileName();

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": XLSX_TYPE,
      // 한글 파일 이름은 filename*(UTF-8)로 보낸다. filename은 옛 브라우저용 영문 이름
      "Content-Disposition": `attachment; filename="items.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      // 낙찰가가 들어 있으므로 브라우저·중간 서버가 저장해 두지 않게 한다
      "Cache-Control": "no-store",
    },
  });
}
