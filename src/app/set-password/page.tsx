// Design Ref: §3.1 — 초대 메일 링크로 들어온 팀원이 비밀번호를 처음 정하는 화면 (/set-password)
// 로그인되지 않은 사람은 proxy.ts가 /login으로 돌려보내므로, 초대 링크를 거친 사람만 볼 수 있다
import type { Metadata } from "next";
import SetPasswordForm from "@/components/SetPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 설정 | 공매 낙찰 물건 한눈에",
};

export default function SetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-center text-xl font-semibold text-zinc-900">
          비밀번호 설정
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-600">
          초대받은 것을 환영합니다. 앞으로 사용할 비밀번호를 정해 주세요.
        </p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
