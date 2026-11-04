// Design Ref: §2.3 — Supabase 접속 코드는 src/lib/supabase/ 에 모은다
// Design Ref: §2.1 — 서버(Next.js)는 "로그인한 사용자 권한"으로 Supabase에 요청한다
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(저장·조회 코드)에서 쓰는 Supabase 접속 도구를 만든다.
 * 브라우저의 로그인 정보(쿠키)를 읽어 로그인한 팀원 권한으로 요청한다.
 * Next.js 16에서는 cookies()가 비동기라서 await가 필요하다.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      ".env에 NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // 화면(Server Component)에서 부르면 쿠키를 쓸 수 없어 여기로 온다.
          // 로그인 상태 갱신은 proxy.ts(작업 4번)가 맡으므로 무시해도 된다.
        }
      },
    },
  });
}
