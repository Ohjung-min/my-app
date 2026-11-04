"use client";

// Design Ref: §3.1 — 로그인 화면: 이메일·비밀번호 입력, [로그인] 버튼, 오류 안내
import { useActionState } from "react";
import { login, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
