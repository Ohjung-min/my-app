// Design Ref: §2.3 — 로그인하지 않으면 로그인 화면으로 보낸다 (Next.js 16에서는 middleware.ts가 아니라 proxy.ts)
// Design Ref: §7 — 비로그인 접근 차단은 이 파일과 Supabase 접근 권한(작업 6번), 두 겹으로 막는다
// Plan SC: 1 — 로그인한 팀원만 접근할 수 있다
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** 로그인하지 않아도 볼 수 있는 화면 */
const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** 이동(redirect)할 때도 갱신된 로그인 쿠키를 잃지 않도록 함께 실어 보낸다 */
function redirectTo(
  request: NextRequest,
  pathname: string,
  sessionResponse: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies
    .getAll()
    .forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 로그인하지 않았는데 보호된 화면에 들어오면 로그인 화면으로
  if (!user && !isPublicPath(pathname)) {
    return redirectTo(request, "/login", response);
  }

  // 이미 로그인했는데 로그인 화면에 오면 첫 화면으로
  if (user && pathname === "/login") {
    return redirectTo(request, "/", response);
  }

  return response;
}

export const config = {
  // 정적 파일(_next/static, _next/image, 아이콘, 이미지)은 로그인 확인에서 제외한다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
