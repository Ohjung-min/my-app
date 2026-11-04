"use server";

// Design Ref: §5 — 물건 저장은 서버에서 실행되는 동작(Server Action)으로 처리한다: 규칙 검사 → 저장
// Design Ref: §6 — 필수 칸이 비면 저장하지 않고 칸별 오류 문구를 보여 준다. 입력한 값은 지우지 않는다
// 낙찰·완납·등기완료의 필수 3칸 검사는 schema.ts에 있다 (작업 11번)
// 중복 확인(작업 12번): 같은 물건이 있을 수 있으면 저장하지 않고 경고를 돌려주며, 사용자가 "그래도 저장"을 누르면 저장한다
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findDuplicates, type DuplicateMatch } from "./duplicates";
import { itemFormSchema, type ItemFormField } from "./schema";

/** 폼에서 읽어 올 입력 칸 이름 */
const FIELDS: ItemFormField[] = [
  "name",
  "status",
  "notice_no",
  "category",
  "location",
  "awarded_on",
  "awarded_price",
  "buyer_name",
];

export type ItemFormState = {
  /** 칸별 오류 문구 */
  errors?: Partial<Record<ItemFormField, string>>;
  /** 칸에 속하지 않는 전체 오류 문구 */
  formError?: string;
  /** 오류가 나도 입력한 값은 지우지 않기 위해 되돌려 준다 */
  values?: Partial<Record<ItemFormField, string>>;
  /** 같은 물건이 이미 있을 수 있을 때: 사용자가 "그래도 저장"을 고르기 전까지 저장하지 않는다 */
  duplicates?: DuplicateMatch[];
};

export async function createItem(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<ItemFormField, string>;

  // 입력값은 서버에서 다시 검사한다 (화면 검사만 믿지 않는다)
  const parsed = itemFormSchema.safeParse(values);
  if (!parsed.success) {
    const errors: ItemFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ItemFormField;
      // 한 칸에 오류가 여러 개여도 첫 번째만 보여 준다
      if (!errors[field]) errors[field] = issue.message;
    }
    return { errors, values };
  }

  const supabase = await createClient();

  // 중복 확인: "그래도 저장"(confirm_duplicate=1)을 누르지 않았다면 먼저 같은 물건이 있는지 본다
  const confirmedDuplicate = formData.get("confirm_duplicate") === "1";
  if (!confirmedDuplicate) {
    const result = await findDuplicates(supabase, {
      name: parsed.data.name,
      notice_no: parsed.data.notice_no,
      awarded_on: parsed.data.awarded_on,
    });
    if (!result.ok) {
      return {
        formError:
          "같은 물건이 이미 있는지 확인하지 못했습니다. 입력한 내용은 그대로 두었으니 잠시 후 다시 시도해 주세요",
        values,
      };
    }
    if (result.matches.length > 0) {
      return { duplicates: result.matches, values };
    }
  }

  const { error } = await supabase.from("items").insert(parsed.data);

  if (error) {
    // 로그인이 풀렸거나 권한이 없을 때
    if (error.code === "42501") {
      redirect("/login");
    }
    // 낙찰·완납·등기완료인데 낙찰일·낙찰가·매수자 이름이 비어 있을 때 (DB 규칙에 걸림)
    if (
      error.code === "23514" &&
      error.message.includes("items_awarded_fields_check")
    ) {
      return {
        formError:
          "낙찰·완납·등기완료 단계에서는 낙찰일, 낙찰가, 매수자 이름을 모두 입력해야 합니다",
        values,
      };
    }
    return {
      formError:
        "저장하지 못했습니다. 입력한 내용은 그대로 두었으니 잠시 후 다시 시도해 주세요",
      values,
    };
  }

  redirect("/");
}
