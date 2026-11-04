// Design Ref: §3.1 — 로그인 화면 (/login). 가입 화면은 없고, 초대받은 팀원만 사용한다
import type { Metadata } from "next";
import { Suspense } from "react";
import InviteLinkHandler from "@/components/InviteLinkHandler";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 | 공매 낙찰 물건 한눈에",
};

/**
 * 초대 링크가 잘못되었거나 만료되어 돌아왔을 때(?error=invite) 안내를 보여 준다.
 * 주소의 값을 읽는 부분은 Suspense로 감싸야 한다 (Next.js 16 Cache Components 규칙).
 */
async function InviteError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (error !== "invite") return null;

  return (
    <p
      role="alert"
      className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      초대 링크가 올바르지 않거나 만료되었습니다. 오정민에게 다시 초대를 요청해
      주세요.
    </p>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900">
          공매 낙찰 물건 한눈에
        </h1>
        <InviteLinkHandler />
        <Suspense fallback={null}>
          <InviteError searchParams={searchParams} />
        </Suspense>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-zinc-500">
          초대받은 팀원만 사용할 수 있습니다
        </p>
      </div>
    </main>
  );
}
