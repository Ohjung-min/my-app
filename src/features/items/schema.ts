// Design Ref: §2.3 — 입력 규칙은 이 파일 한곳에 모아, 화면과 서버가 같은 규칙을 쓴다
// PRD 5번 must 1 — 필수 입력은 물건명, 진행상황, 공고번호, 물건 종류, 소재지 5개. 하나라도 비면 저장하지 않는다
// (낙찰·완납·등기완료 단계의 추가 필수 3칸 검사와 중복 경고는 작업 11·12번에서 더한다)
import { z } from "zod";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "@/types/item";

/** 화면에서 넘어온 낙찰가 글자("3,200,000" 등)에서 숫자만 남긴다 */
function cleanPrice(value: string) {
  return value.replace(/[,\s원]/g, "");
}

const requiredText = (message: string) =>
  z.string().trim().min(1, message);

/** 비어 있으면 값이 없는 것(undefined)으로 본다 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema.optional(),
  );

export const itemFormSchema = z.object({
  name: requiredText("물건명을 입력해 주세요"),
  status: z.enum(ITEM_STATUSES, { error: "진행상황을 선택해 주세요" }),
  notice_no: requiredText("공고번호를 입력해 주세요"),
  category: z.enum(ITEM_CATEGORIES, { error: "물건 종류를 선택해 주세요" }),
  location: requiredText("소재지를 입력해 주세요"),

  // 아래 3칸은 낙찰 이후 단계에서만 필수이며, 그 검사는 작업 11번에서 한다.
  // 지금은 값이 들어왔을 때 형식만 확인한다.
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
  buyer_name: optional(z.string().trim()),
});

export type ItemFormInput = z.infer<typeof itemFormSchema>;

/** 입력 칸 이름 목록 (오류 안내를 칸별로 붙이기 위해 쓴다) */
export type ItemFormField = keyof ItemFormInput;
