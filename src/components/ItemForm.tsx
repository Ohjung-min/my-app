"use client";

// Design Ref: §3.3 — 물건 등록 화면의 입력 칸: 물건명, 진행상황, 공고번호, 물건 종류, 소재지 (* 필수)
// + 낙찰일, 낙찰가, 매수자 이름 (낙찰·완납·등기완료 단계에서 필요. 단계별 필수 검사는 작업 11번)
import Link from "next/link";
import { useActionState } from "react";
import { createItem, type ItemFormState } from "@/features/items/actions";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "@/types/item";

const initialState: ItemFormState = {};

const inputClass =
  "w-full rounded-md border bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function ItemForm() {
  const [state, formAction, pending] = useActionState(createItem, initialState);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  const borderOf = (field: keyof typeof errors) =>
    errors[field] ? "border-red-500" : "border-zinc-300";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {/* 물건명 */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          물건명 <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={values.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${inputClass} ${borderOf("name")}`}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>

      {/* 진행상황 */}
      <fieldset>
        <legend className="mb-1 text-sm font-medium">
          진행상황 <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {ITEM_STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-1.5 text-base">
              <input
                type="radio"
                name="status"
                value={status}
                defaultChecked={values.status === status}
                aria-describedby={errors.status ? "status-error" : undefined}
              />
              {status}
            </label>
          ))}
        </div>
        <FieldError id="status-error" message={errors.status} />
      </fieldset>

      {/* 공고번호 */}
      <div>
        <label htmlFor="notice_no" className="mb-1 block text-sm font-medium">
          공고번호 <span className="text-red-600">*</span>
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

      {/* 소재지 */}
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

      {/* 낙찰 이후 단계에서 쓰는 3칸 */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="mb-3 text-sm text-zinc-600">
          진행상황이 <strong>낙찰·완납·등기완료</strong>이면 아래 3칸을
          입력해야 합니다. 입찰·유찰은 비워 두어도 됩니다.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="awarded_on" className="mb-1 block text-sm font-medium">
              낙찰일
            </label>
            <input
              id="awarded_on"
              name="awarded_on"
              type="date"
              defaultValue={values.awarded_on}
              aria-invalid={Boolean(errors.awarded_on)}
              aria-describedby={errors.awarded_on ? "awarded_on-error" : undefined}
              className={`${inputClass} ${borderOf("awarded_on")}`}
            />
            <FieldError id="awarded_on-error" message={errors.awarded_on} />
          </div>

          <div>
            <label htmlFor="awarded_price" className="mb-1 block text-sm font-medium">
              낙찰가 (원)
            </label>
            <input
              id="awarded_price"
              name="awarded_price"
              type="text"
              inputMode="numeric"
              defaultValue={values.awarded_price}
              aria-invalid={Boolean(errors.awarded_price)}
              aria-describedby={errors.awarded_price ? "awarded_price-error" : undefined}
              className={`${inputClass} ${borderOf("awarded_price")}`}
            />
            <FieldError id="awarded_price-error" message={errors.awarded_price} />
          </div>

          <div>
            <label htmlFor="buyer_name" className="mb-1 block text-sm font-medium">
              매수자 이름
            </label>
            <input
              id="buyer_name"
              name="buyer_name"
              type="text"
              defaultValue={values.buyer_name}
              className={`${inputClass} border-zinc-300`}
            />
          </div>
        </div>
      </div>

      {state.formError ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.formError}
        </p>
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
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
