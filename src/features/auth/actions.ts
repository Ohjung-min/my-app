"use server";

// Design Ref: §5 — 로그인은 서버에서 실행되는 동작(Server Action)으로 처리한다
// Design Ref: §6 — 로그인 정보가 틀리면 "이메일 또는 비밀번호를 확인해 주세요"를 보여 준다
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, MIN_PASSWORD_LENGTH, setPasswordSchema } from "./schema";

export type LoginState = {
  /** 화면에 보여 줄 오류 문구 (없으면 오류 없음) */
  error?: string;
  /** 오류가 나도 입력한 이메일은 지우지 않는다 */
  email?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // 입력값은 서버에서 다시 검사한다 (화면 검사만 믿지 않는다)
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "이메일과 비밀번호를 입력해 주세요", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // 이메일이 없는지 비밀번호가 틀린지는 알려 주지 않는다 (계정 존재 여부 노출 방지)
    return { error: "이메일 또는 비밀번호를 확인해 주세요", email };
  }

  redirect("/");
}

export type SetPasswordState = {
  /** 화면에 보여 줄 오류 문구 (없으면 오류 없음) */
  error?: string;
};

/** 초대 링크로 들어온 팀원이 비밀번호를 처음 정한다 (Design §3.1 /set-password) */
export async function setPassword(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다` };
  }

  const parsed = setPasswordSchema.safeParse({ password, confirm });
  if (!parsed.success) {
    return { error: "두 비밀번호가 같지 않습니다" };
  }

  const supabase = await createClient();

  // 초대 링크로 로그인된 상태인지 확인한다 (proxy.ts가 한 번 막지만 서버에서도 다시 확인)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?error=invite");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      error:
        "비밀번호를 정하지 못했습니다. 잠시 후 다시 시도하거나, 초대 링크가 만료되었다면 다시 초대를 요청해 주세요",
    };
  }

  redirect("/");
}
