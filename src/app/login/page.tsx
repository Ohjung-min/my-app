// Design Ref: §3.1 — 로그인 화면 (/login). 가입 화면은 없고, 초대받은 팀원만 사용한다
import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 | 공매 낙찰 물건 한눈에",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900">
          공매 낙찰 물건 한눈에
        </h1>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-zinc-500">
          초대받은 팀원만 사용할 수 있습니다
        </p>
      </div>
    </main>
  );
}
