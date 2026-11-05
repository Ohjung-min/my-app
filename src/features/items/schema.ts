// Design Ref: §2.3 — 입력 규칙은 이 파일 한곳에 모아, 화면과 서버가 같은 규칙을 쓴다
// PRD 5번 must 1 — 필수 입력은 관리번호, 진행상황, 물건 종류, 소재지 4개. 하나라도 비면 저장하지 않는다
// (2026-11-05: 공고번호는 이름이 관리번호로 바뀌었고, 물건명 칸은 없어졌다. DB 칸 이름 notice_no·location은 그대로)
// 낙찰 이후 단계(낙찰·완납·등기소 접수·등기완료)에서는 낙찰일·낙찰가·매수자 이름도 필수 (작업 11번)
import { z } from "zod";
import { ITEM_CATEGORIES, ITEM_STATUSES, isAwardedStatus } from "@/types/item";

/** 메모 최대 글자 수 */
export const MAX_MEMO_LENGTH = 1000;

/** 칸별 최대 글자 수. 너무 긴 글이 저장되어 목록이 깨지는 것을 막는다 (2026-11-05 점검에서 추가) */
export const MAX_NOTICE_NO_LENGTH = 100;
export const MAX_LOCATION_LENGTH = 200;
export const MAX_BUYER_NAME_LENGTH = 100;

/** 화면에서 넘어온 낙찰가 글자("3,200,000" 등)에서 숫자만 남긴다 */
function cleanPrice(value: string) {
  return value.replace(/[,\s원]/g, "");
}

const requiredText = (message: string, max: number, tooLongMessage: string) =>
  z.string().trim().min(1, message).max(max, tooLongMessage);

/** 비어 있으면 값이 없는 것(undefined)으로 본다 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema.optional(),
  );

export const itemFormSchema = z.object({
  status: z.enum(ITEM_STATUSES, { error: "진행상황을 선택해 주세요" }),
  notice_no: requiredText(
    "관리번호를 입력해 주세요",
    MAX_NOTICE_NO_LENGTH,
    `관리번호는 ${MAX_NOTICE_NO_LENGTH}자 이하로 입력해 주세요`,
  ),
  category: z.enum(ITEM_CATEGORIES, { error: "물건 종류를 선택해 주세요" }),
  location: requiredText(
    "소재지를 입력해 주세요",
    MAX_LOCATION_LENGTH,
    `소재지는 ${MAX_LOCATION_LENGTH}자 이하로 입력해 주세요`,
  ),

  // 아래 3칸은 낙찰 이후 단계에서만 필수다. 필수 여부는 아래 .check()에서, 여기서는 값이 들어왔을 때의 형식만 확인한다.
  awarded_on: optional(
    z.iso.date({ error: "낙찰일을 날짜 형식(YYYY-MM-DD)으로 입력해 주세요" }),
  ),
  awarded_price: optional(
    z
      .string()
      .transform(cleanPrice)
      .pipe(
        z
          .string()
          .regex(/^\d+$/, "낙찰가는 0 이상의 숫자로 입력해 주세요")
          .transform(Number)
          .refine(Number.isSafeInteger, "낙찰가가 너무 큽니다"),
      ),
  ),
  buyer_name: optional(
    z
      .string()
      .trim()
      .max(
        MAX_BUYER_NAME_LENGTH,
        `매수자 이름은 ${MAX_BUYER_NAME_LENGTH}자 이하로 입력해 주세요`,
      ),
  ),

  // 메모(선택). 개인정보를 쓰지 않도록 화면에 안내한다 (작업 14번). 너무 긴 글은 막는다
  memo: optional(
    z
      .string()
      .trim()
      .max(MAX_MEMO_LENGTH, `메모는 ${MAX_MEMO_LENGTH}자 이하로 입력해 주세요`),
  ),
})
  // 낙찰 이후 단계이면 낙찰일·낙찰가·매수자 이름도 필수 (입찰·유찰은 비어도 된다). 작업 11번
  // 다른 칸에 오류가 있어도 이 검사가 함께 실행되어, 고칠 것을 한 번에 보여 준다 (시험으로 확인함)
  .check(
    z.superRefine((data, ctx) => {
      if (!isAwardedStatus(data.status)) return;
      const missing: [keyof typeof data, string][] = [
        ["awarded_on", "낙찰일을 입력해 주세요"],
        ["awarded_price", "낙찰가를 입력해 주세요"],
        ["buyer_name", "매수자 이름을 입력해 주세요"],
      ];
      for (const [field, message] of missing) {
        if (data[field] === undefined) {
          ctx.addIssue({ code: "custom", path: [field], message });
        }
      }
    }),
  );

export type ItemFormInput = z.infer<typeof itemFormSchema>;

/** 입력 칸 이름 목록 (오류 안내를 칸별로 붙이기 위해 쓴다) */
export type ItemFormField = keyof ItemFormInput;
