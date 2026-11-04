// Design Ref: §2.1, §7 — 로그인 확인은 proxy.ts가 맡고, 이 파일은 "로그인 상태를 읽고 갱신"하는 부분만 맡는다
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 요청에 실린 로그인 정보(쿠키)를 읽어 로그인한 사용자를 알아내고,
 * 로그인 유지 기간이 갱신되면 새 쿠키를 응답에 실어 보낸다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      ".env에 NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.",
    );
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser()는 Supabase 서버에 물어 로그인 정보가 진짜인지 확인한다.
  // (쿠키만 읽는 방식보다 안전해서, 접근 차단 판단에는 이 방식을 쓴다.)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
