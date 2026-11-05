"use client";

// Design Ref: §3.3 — 물건 등록 화면의 입력 칸: 관리번호, 소재지, 진행상황, 물건 종류 (* 필수). 2026-11-05 변경: 공고번호→관리번호로 이름 변경, 물건명 칸 삭제
// + 낙찰일, 낙찰가, 매수자 이름: 낙찰·완납·등기소 접수·등기완료를 고르면 필수(*)가 되고, 입찰·유찰이면 선택 사항으로 흐리게 보인다 (작업 11번)
// + 같은 물건이 이미 있을 수 있으면 경고 상자와 [그래도 저장] 버튼을 보여 준다 (작업 12번)
// + 등록과 수정이 같은 폼을 쓴다: 수정은 저장 동작·버튼 글자·처음 값을 넘겨 받는다 (작업 13번)
// + 메모(선택) 칸과, 매수자 이름 외 개인정보를 쓰지 말라는 안내 문구 (작업 14번)
import Link from "next/link";
import { useActionState, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { createItem, type ItemFormState } from "@/features/items/actions";
import { MAX_MEMO_LENGTH } from "@/features/items/schema";
import { ITEM_CATEGORIES, ITEM_STATUSES, isAwardedStatus } from "@/types/item";

type ItemFormProps = {
  /** 저장 동작. 등록은 createItem(기본), 수정은 updateItem을 id와 묶어서(bind) 넘긴다 */
  action?: (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  /** 저장 버튼 글자 */
  submitLabel?: string;
  /** 수정 화면에서 처음에 채워 넣을 값 */
  initialValues?: ItemFormState["values"];
};

const inputClass =
  "w-full rounded-md border bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-[#183a76] focus:ring-2 focus:ring-[#183a76]/20";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function ItemForm({
  action = createItem,
  submitLabel = "저장",
  initialValues,
}: ItemFormProps) {
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(
    action,
    { values: initialValues },
  );
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  // 선택한 진행상황에 따라 낙찰일·낙찰가·매수자 이름이 필수인지 화면에 보여 준다.
  // (저장할 때는 서버가 같은 규칙으로 다시 검사한다)
  const [status, setStatus] = useState(values.status ?? "");
  const awardedRequired = isAwardedStatus(status);
  const requiredMark = awardedRequired ? (
    <span className="text-red-600"> *</span>
  ) : null;

  const borderOf = (field: keyof typeof errors) =>
    errors[field] ? "border-red-500" : "border-zinc-300";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {/* 관리번호 (예전 이름: 공고번호). 목록에서도 맨 앞에 보이므로 폼에서도 맨 위에 둔다 */}
      <div>
        <label htmlFor="notice_no" className="mb-1 block text-sm font-medium">
          관리번호 <span className="text-red-600">*</span>
        </label>
        <input
          id="notice_no"
          name="notice_no"
          type="text"
          defaultValue={values.notice_no}
          aria-invalid={Boolean(errors.notice_no)}
          aria-describedby={errors.notice_no ? "notice_no-error" : undefined}
          className={`${inputClass} ${borderOf("notice_no")}`}
        />
        <FieldError id="notice_no-error" message={errors.notice_no} />
      </div>

      {/* 소재지: 목록에서 관리번호 아래에 보이므로 폼에서도 관리번호 바로 아래에 둔다 (물건명 칸은 2026-11-05에 없어졌다) */}
      <div>
        <label htmlFor="location" className="mb-1 block text-sm font-medium">
          소재지 <span className="text-red-600">*</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={values.location}
          aria-invalid={Boolean(errors.location)}
          aria-describedby={errors.location ? "location-error" : undefined}
          className={`${inputClass} ${borderOf("location")}`}
        />
        <FieldError id="location-error" message={errors.location} />
      </div>

      {/* 진행상황 */}
      <fieldset>
        <legend className="mb-1 text-sm font-medium">
          진행상황 <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {ITEM_STATUSES.map((option) => (
            <label key={option} className="flex items-center gap-1.5 text-base">
              <input
                type="radio"
                name="status"
                value={option}
                defaultChecked={values.status === option}
                onChange={() => setStatus(option)}
                aria-describedby={errors.status ? "status-error" : undefined}
              />
              {option}
            </label>
          ))}
        </div>
        <FieldError id="status-error" message={errors.status} />
      </fieldset>

      {/* 물건 종류 */}
      <fieldset>
        <legend className="mb-1 text-sm font-medium">
          물건 종류 <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {ITEM_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-1.5 text-base">
              <input
                type="radio"
                name="category"
                value={category}
                defaultChecked={values.category === category}
                aria-describedby={errors.category ? "category-error" : undefined}
              />
              {category}
            </label>
          ))}
        </div>
        <FieldError id="category-error" message={errors.category} />
      </fieldset>

      {/* 낙찰 이후 단계에서 쓰는 3칸 */}
      <div
        className={`rounded-lg border p-4 ${
          awardedRequired
            ? "border-zinc-300 bg-white"
            : "border-zinc-200 bg-zinc-50 opacity-70"
        }`}
      >
        <p className="mb-3 text-sm text-zinc-600">
          {awardedRequired ? (
            <>
              진행상황이 <strong>{status}</strong>이므로 아래 3칸을 모두
              입력해야 합니다.
            </>
          ) : (
            <>
              진행상황이 <strong>낙찰·완납·등기소 접수·등기완료</strong>이면 아래 3칸을
              입력해야 합니다. 입찰·유찰은 비워 두어도 됩니다. (선택 사항)
            </>
          )}
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="awarded_on" className="mb-1 block text-sm font-medium">
              낙찰일{requiredMark}
            </label>
            <input
              id="awarded_on"
              name="awarded_on"
              type="date"
              defaultValue={values.awarded_on}
              aria-required={awardedRequired}
              aria-invalid={Boolean(errors.awarded_on)}
              aria-describedby={errors.awarded_on ? "awarded_on-error" : undefined}
              className={`${inputClass} ${borderOf("awarded_on")}`}
            />
            <FieldError id="awarded_on-error" message={errors.awarded_on} />
          </div>

          <div>
            <label htmlFor="awarded_price" className="mb-1 block text-sm font-medium">
              낙찰가 (원){requiredMark}
            </label>
            <input
              id="awarded_price"
              name="awarded_price"
              type="text"
              inputMode="numeric"
              defaultValue={values.awarded_price}
              aria-required={awardedRequired}
              aria-invalid={Boolean(errors.awarded_price)}
              aria-describedby={errors.awarded_price ? "awarded_price-error" : undefined}
              className={`${inputClass} ${borderOf("awarded_price")}`}
            />
            <FieldError id="awarded_price-error" message={errors.awarded_price} />
          </div>

          <div>
            <label htmlFor="buyer_name" className="mb-1 block text-sm font-medium">
              매수자 이름{requiredMark}
            </label>
            <input
              id="buyer_name"
              name="buyer_name"
              type="text"
              defaultValue={values.buyer_name}
              aria-required={awardedRequired}
              aria-invalid={Boolean(errors.buyer_name)}
              aria-describedby={errors.buyer_name ? "buyer_name-error" : undefined}
              className={`${inputClass} ${borderOf("buyer_name")}`}
            />
            <FieldError id="buyer_name-error" message={errors.buyer_name} />
          </div>
        </div>
      </div>

      {/* 메모 (선택) + 개인정보 입력 금지 안내 (작업 14번, Design §3.3) */}
      <div>
        <label htmlFor="memo" className="mb-1 block text-sm font-medium">
          메모 <span className="font-normal text-zinc-500">(선택, {MAX_MEMO_LENGTH}자까지)</span>
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={values.memo}
          aria-invalid={Boolean(errors.memo)}
          aria-describedby={
            errors.memo ? "memo-error privacy-notice" : "privacy-notice"
          }
          className={`${inputClass} ${borderOf("memo")}`}
        />
        <FieldError id="memo-error" message={errors.memo} />
      </div>

      <p
        id="privacy-notice"
        className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        ※ <strong>매수자 이름</strong> 외의 개인정보(연락처·주민번호·계좌번호·개인
        주소)는 입력하지 마세요. 메모칸도 마찬가지입니다.
      </p>

      {state.formError ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.formError}
        </p>
      ) : null}

      {/* 중복 경고 (작업 12번): 막지는 않고, [그래도 저장]을 눌러야 저장된다 */}
      {state.duplicates && state.duplicates.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-semibold">중복일 수 있습니다. 그래도 저장할까요?</p>
          <p className="mt-1 text-amber-800">
            같은 물건이 이미 등록되어 있습니다. (낙찰일이 있으면 소재지와 낙찰일이,
            없으면 관리번호가 같을 때)
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {state.duplicates.map((match) => (
              <li
                key={match.id}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-white px-3 py-2 text-zinc-900"
              >
                <StatusBadge status={match.status} />
                <span className="font-medium">{match.location}</span>
                <span className="text-zinc-600">
                  관리번호 {match.notice_no}
                  {match.awarded_on ? ` · 낙찰일 ${match.awarded_on}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <p className="mr-auto self-center text-amber-800">
              다른 물건이면 [그래도 저장]을, 같은 물건이면 내용을 고치거나 취소해
              주세요.
            </p>
            <input type="hidden" name="duplicate_key" value={state.duplicateKey ?? ""} />
            <button
              type="submit"
              name="confirm_duplicate"
              value="1"
              disabled={pending}
              className="rounded-md bg-amber-600 px-4 py-2 text-base font-medium text-white disabled:opacity-60"
            >
              그래도 저장
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 hover:bg-zinc-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#183a76] hover:bg-[#122c5a] px-4 py-2 text-base font-medium text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
