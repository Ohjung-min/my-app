// Design Ref: §2.3 — Supabase 접속 코드는 src/lib/supabase/ 에 모은다
// 로그인 없이 누구나 쓰는 서비스라서(2026-11-05 결정), 공개 키(anon)의 권한으로 Supabase에 요청한다.
// 접근 규칙은 데이터베이스(supabase/migrations)가 정한다: 읽기·등록·수정 가능, 삭제 불가
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(저장·조회 코드)에서 쓰는 Supabase 접속 도구를 만든다.
 * 요청마다 새로 읽어 오도록 쿠키 읽기를 거친다. (로그인 정보를 쓰지는 않는다)
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
          // 화면(Server Component)에서 부르면 쿠키를 쓸 수 없어 여기로 온다. 무시해도 된다.
        }
      },
    },
  });
}
