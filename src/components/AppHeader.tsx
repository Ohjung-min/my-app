// Design Ref: §3.2 — 모든 화면 위쪽에 공통으로 보이는 틀: 서비스 이름, 로그인한 이메일, [로그아웃]
// 알림 종(🔔)은 nice 기능이라 작업 17에서 이 자리에 추가한다
// Plan SC: 1 — 로그인한 팀원에게만 보인다 (로그인 화면·비밀번호 설정 화면에는 나타나지 않는다)
import Link from "next/link";
import { logout } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인하지 않은 사람에게는 상단 틀을 보여 주지 않는다
  if (!user) return null;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-base font-semibold text-zinc-900 sm:text-lg"
        >
          공매 낙찰 물건 한눈에
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          <span
            className="hidden max-w-[16rem] truncate text-sm text-zinc-600 sm:inline"
            title={user.email ?? undefined}
          >
            {user.email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
