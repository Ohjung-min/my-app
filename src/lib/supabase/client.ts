// Design Ref: §2.3 — Supabase 접속 코드는 src/lib/supabase/ 에 모은다 (화면은 이 코드를 직접 부르지 않고 데이터 처리 코드를 거친다)
// Design Ref: §7 — 브라우저에는 로그인한 사용자 권한으로만 동작하는 공개 키만 보낸다
import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(화면)에서 쓰는 Supabase 접속 도구를 만든다.
 * 로그인 화면처럼 브라우저에서 직접 Supabase와 대화해야 할 때만 쓴다.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      ".env에 NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.",
    );
  }

  return createBrowserClient(url, anonKey);
}
