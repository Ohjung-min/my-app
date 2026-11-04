"use server";

// Design Ref: §5 — 물건 저장·수정은 서버에서 실행되는 동작(Server Action)으로 처리한다: 규칙 검사 → 중복 확인 → 저장
// Design Ref: §6 — 필수 칸이 비면 저장하지 않고 칸별 오류 문구를 보여 준다. 입력한 값은 지우지 않는다
// 낙찰·완납·등기완료의 필수 3칸 검사는 schema.ts에 있다 (작업 11번)
// 중복 확인(작업 12번): 같은 물건이 있을 수 있으면 저장하지 않고 경고를 돌려주며, 사용자가 "그래도 저장"을 누르면 저장한다
// 수정(작업 13번): 진행상황을 어느 단계로든 바꿀 수 있다 (PRD 5번). 단계 변경 알림은 작업 17번에서 더한다
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findDuplicates, type DuplicateMatch } from "./duplicates";
import {
  itemFormSchema,
  type ItemFormField,
  type ItemFormInput,
} from "./schema";

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
  "memo",
];

export type ItemFormState = {
  /** 칸별 오류 문구 */
  errors?: Partial<Record<ItemFormField, string>>;
  /** 칸에 속하지 않는 전체 오류 문구 */
  formError?: string;
  /** 오류가 나도 입력한 값은 지우지 않기 위해 되돌려 준다 (수정 화면에서는 처음 값으로도 쓴다) */
  values?: Partial<Record<ItemFormField, string>>;
  /** 같은 물건이 이미 있을 수 있을 때: 사용자가 "그래도 저장"을 고르기 전까지 저장하지 않는다 */
  duplicates?: DuplicateMatch[];
};

type FormValues = Record<ItemFormField, string>;

function readValues(formData: FormData): FormValues {
  return Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as FormValues;
}

type Validated =
  | { ok: true; data: ItemFormInput }
  | { ok: false; state: ItemFormState };

/** 입력값은 서버에서 다시 검사한다 (화면 검사만 믿지 않는다) */
function validate(values: FormValues): Validated {
  const parsed = itemFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };

  const errors: ItemFormState["errors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as ItemFormField;
    // 한 칸에 오류가 여러 개여도 첫 번째만 보여 준다
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, state: { errors, values } };
}

/**
 * 중복 확인. "그래도 저장"(confirm_duplicate=1)을 누른 경우에는 건너뛴다.
 * 저장을 멈춰야 하면 화면에 돌려줄 상태를, 계속 저장해도 되면 null을 돌려준다.
 */
async function checkDuplicates(
  supabase: SupabaseClient,
  formData: FormData,
  data: ItemFormInput,
  values: FormValues,
  excludeId?: string,
): Promise<ItemFormState | null> {
  if (formData.get("confirm_duplicate") === "1") return null;

  const result = await findDuplicates(
    supabase,
    {
      name: data.name,
      notice_no: data.notice_no,
      awarded_on: data.awarded_on,
    },
    excludeId,
  );

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
  return null;
}

/** 저장 중 DB가 돌려준 오류를 화면에 보여 줄 문구로 바꾼다 */
function saveErrorState(
  error: { code?: string; message: string },
  values: FormValues,
): ItemFormState {
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

/** 물건 등록 (Design §3.3 /items/new) */
export async function createItem(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const values = readValues(formData);

  const validated = validate(values);
  if (!validated.ok) return validated.state;

  const supabase = await createClient();

  const duplicateState = await checkDuplicates(
    supabase,
    formData,
    validated.data,
    values,
  );
  if (duplicateState) return duplicateState;

  const { error } = await supabase.from("items").insert(validated.data);
  if (error) return saveErrorState(error, values);

  redirect("/");
}

/** 물건 수정 (Design §3.3 /items/[id]/edit). 첫 인자 id는 화면에서 bind로 미리 넣는다 */
export async function updateItem(
  id: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const values = readValues(formData);

  if (!z.uuid().safeParse(id).success) {
    return { formError: "수정할 물건을 찾을 수 없습니다", values };
  }

  const validated = validate(values);
  if (!validated.ok) return validated.state;

  const supabase = await createClient();

  // 수정할 때는 자기 자신을 제외하고 중복을 확인한다
  const duplicateState = await checkDuplicates(
    supabase,
    formData,
    validated.data,
    values,
    id,
  );
  if (duplicateState) return duplicateState;

  // 수정에서는 칸을 비우면 값이 지워져야 하므로, 값이 없는 선택 칸은 null로 보낸다
  // (등록처럼 생략하면 예전 값이 그대로 남는다)
  const { data, error } = await supabase
    .from("items")
    .update({
      ...validated.data,
      awarded_on: validated.data.awarded_on ?? null,
      awarded_price: validated.data.awarded_price ?? null,
      buyer_name: validated.data.buyer_name ?? null,
      memo: validated.data.memo ?? null,
    })
    .eq("id", id)
    .select("id");

  if (error) return saveErrorState(error, values);

  // 오류는 없는데 바뀐 줄이 0개라면: 그 사이 없어졌거나 권한이 없는 경우
  if (!data || data.length === 0) {
    return {
      formError: "수정할 물건을 찾을 수 없습니다. 목록에서 다시 선택해 주세요",
      values,
    };
  }

  redirect("/");
}
