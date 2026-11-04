// Design Ref: §2.3 — 입력 규칙은 한곳(features/…/schema.ts)에 모아 화면과 서버가 같은 규칙을 쓴다
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
