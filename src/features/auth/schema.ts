// Design Ref: §2.3 — 입력 규칙은 한곳(features/…/schema.ts)에 모아 화면과 서버가 같은 규칙을 쓴다
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** 비밀번호를 처음 정할 때의 규칙: 8자 이상, 두 칸이 같아야 한다 */
export const MIN_PASSWORD_LENGTH = 8;

export const setPasswordSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, { path: ["confirm"] });
