"use client";

// Design Ref: §3.1 — 초대받은 팀원이 비밀번호를 처음 정하는 화면의 입력 칸
import { useActionState } from "react";
import {
  setPassword,
  type SetPasswordState,
} from "@/features/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/schema";

const initialState: SetPasswordState = {};

export default function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    setPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          새 비밀번호 ({MIN_PASSWORD_LENGTH}자 이상)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className="text-sm font-medium">
          새 비밀번호 확인
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
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
        {pending ? "저장 중..." : "비밀번호 저장"}
      </button>
    </form>
  );
}
