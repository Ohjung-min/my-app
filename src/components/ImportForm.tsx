"use client";

// Design Ref: §3.4 — 일괄 등록 화면: 붙여넣기 칸 또는 파일 선택 → [미리보기] → 결과 요약(등록 가능 / 오류 / 건너뜀) → [등록]
// 오류가 있는 줄은 이유와 함께 보여 주고, 오류 줄은 건너뛰고 나머지만 등록할 수 있다
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  commitImport,
  previewImport,
  type ImportCommitState,
  type ImportPreviewRow,
  type ImportPreviewState,
} from "@/features/items/import/actions";
import {
  IMPORT_COLUMNS,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  MAX_IMPORT_TEXT_LENGTH,
} from "@/features/items/import/parse";

const previewInitial: ImportPreviewState = {};
const commitInitial: ImportCommitState = {};

/** 양식 파일: 열 이름만 들어 있는 CSV. 엑셀에서 한글이 깨지지 않도록 맨 앞에 BOM을 붙인다 */
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(
  `﻿${IMPORT_COLUMNS.map((c) => c.label).join(",")}\n`,
)}`;

const ROW_STATUS: Record<
  ImportPreviewRow["status"],
  { label: string; className: string }
> = {
  ok: { label: "등록 가능", className: "bg-green-50 text-green-700 ring-green-200" },
  duplicate: { label: "건너뜀", className: "bg-zinc-100 text-zinc-700 ring-zinc-300" },
  error: { label: "오류", className: "bg-red-50 text-red-700 ring-red-200" },
};

function RowBadge({ status }: { status: ImportPreviewRow["status"] }) {
  const { label, className } = ROW_STATUS[status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

/** 미리보기 결과와 [등록] 버튼. 미리보기 내용이 바뀌면 새로 만들어져 이전 등록 결과가 지워진다 */
function PreviewResult({
  preview,
}: {
  preview: NonNullable<ImportPreviewState["preview"]>;
}) {
  const [commit, commitAction, committing] = useActionState(
    commitImport,
    commitInitial,
  );
  const { counts, rows, ignoredHeaders } = preview;

  // 등록 단계에는 "등록 가능"인 줄의 값만 보낸다. 서버가 다시 검사한다
  const payload = JSON.stringify(
    rows
      .filter((r) => r.status === "ok")
      .map((r) => ({ rowNumber: r.rowNumber, ...r.values })),
  );

  if (commit.result) {
    const { inserted, duplicate, error } = commit.result;
    return (
      <div role="status" className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        <p className="text-base font-semibold">{inserted}건을 등록했습니다.</p>
        {duplicate > 0 || error > 0 ? (
          <p className="mt-1">
            {duplicate > 0 ? `이미 있어 건너뛴 물건 ${duplicate}건` : ""}
            {duplicate > 0 && error > 0 ? ", " : ""}
            {error > 0 ? `고쳐야 해서 제외한 줄 ${error}건` : ""}
          </p>
        ) : null}
        <Link
          href="/"
          className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white"
        >
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900">미리보기 결과</h2>

      <p className="text-sm text-zinc-700">
        <span className="font-semibold text-green-700">등록 가능 {counts.ok}건</span>
        {" · "}
        <span className="font-semibold text-zinc-700">건너뜀 {counts.duplicate}건</span>
        {" · "}
        <span className="font-semibold text-red-700">오류 {counts.error}건</span>
      </p>

      {ignoredHeaders.length > 0 ? (
        <p className="text-sm text-zinc-600">
          알아보지 못해 무시한 열: {ignoredHeaders.join(", ")}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">줄</th>
              <th scope="col" className="px-3 py-2 font-medium">결과</th>
              <th scope="col" className="px-3 py-2 font-medium">관리번호</th>
              <th scope="col" className="px-3 py-2 font-medium">소재지</th>
              <th scope="col" className="px-3 py-2 font-medium">이유</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-900">
            {rows.map((row) => (
              <tr key={row.rowNumber}>
                <td className="whitespace-nowrap px-3 py-2 text-zinc-600">{row.rowNumber}</td>
                <td className="whitespace-nowrap px-3 py-2"><RowBadge status={row.status} /></td>
                <td className="px-3 py-2 font-medium">
                  {row.values.notice_no || <span className="text-zinc-400">(비어 있음)</span>}
                </td>
                <td className="px-3 py-2">
                  {row.label || <span className="text-zinc-400">(비어 있음)</span>}
                </td>
                <td className="px-3 py-2 text-zinc-700">
                  {row.messages.length > 0 ? row.messages.join(" / ") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {commit.error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {commit.error}
        </p>
      ) : null}

      <form action={commitAction} className="flex flex-wrap items-center justify-end gap-3">
        <input type="hidden" name="rows" value={payload} />
        {counts.ok === 0 ? (
          <p className="mr-auto text-sm text-zinc-600">
            등록할 수 있는 줄이 없습니다. 위 이유를 고쳐 다시 올려 주세요.
          </p>
        ) : counts.error > 0 || counts.duplicate > 0 ? (
          <p className="mr-auto text-sm text-zinc-600">
            오류·건너뜀 줄은 빼고 &quot;등록 가능&quot; {counts.ok}건만 등록합니다.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={counts.ok === 0 || committing}
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white disabled:opacity-60"
        >
          {committing ? "등록 중..." : `${counts.ok}건 등록`}
        </button>
      </form>
    </section>
  );
}

export default function ImportForm() {
  const [state, formAction, pending] = useActionState(
    previewImport,
    previewInitial,
  );

  // 붙여넣은 글은 직접 관리해서, 미리보기·오류 뒤에도 지워지지 않게 한다
  // (직접 관리하지 않는 입력칸은 폼을 보낸 뒤 React가 비워 버린다)
  const [pasted, setPasted] = useState("");
  // 파일이 너무 크면 서버로 보내기 전에 화면에서 먼저 알려 준다 (서버는 1MB가 넘는 요청을 안내 없이 거부한다)
  const [fileError, setFileError] = useState("");

  const previewKey = state.preview
    ? state.preview.rows
        .map((r) => `${r.rowNumber}:${r.status}:${r.label}`)
        .join("|")
    : "none";

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        <p>
          엑셀(또는 구글 시트)에서 표를 복사해 붙여넣거나, .xlsx·.csv 파일을
          올려 주세요. <strong>첫 줄은 열 이름</strong>이어야 하고, 아래 줄마다
          물건 하나입니다.
        </p>
        <ul className="mt-2 list-inside list-disc text-zinc-600">
          <li>
            꼭 필요한 열:{" "}
            {IMPORT_COLUMNS.filter((c) => c.required)
              .map((c) => c.label)
              .join(", ")}
          </li>
          <li>
            선택 열:{" "}
            {IMPORT_COLUMNS.filter((c) => !c.required)
              .map((c) => c.label)
              .join(", ")}{" "}
            (진행상황이 낙찰·완납·등기소 접수·등기완료이면 낙찰일·낙찰가·매수자 이름도 필요)
          </li>
          <li>
            한 번에 {MAX_IMPORT_ROWS}건까지, 파일은{" "}
            {Math.floor(MAX_IMPORT_FILE_BYTES / 1024)}KB까지 올릴 수 있습니다.
          </li>
          <li>이미 등록된 물건은 건너뜁니다. 개인정보는 매수자 이름만 넣어 주세요.</li>
        </ul>
        <a
          href={TEMPLATE_HREF}
          download="일괄등록_양식.csv"
          className="mt-3 inline-block text-zinc-900 underline underline-offset-2"
        >
          열 이름이 들어 있는 양식 파일(CSV) 내려받기
        </a>
      </section>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="pasted" className="mb-1 block text-sm font-medium">
            표 붙여넣기
          </label>
          <textarea
            id="pasted"
            name="pasted"
            rows={8}
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            maxLength={MAX_IMPORT_TEXT_LENGTH}
            placeholder={IMPORT_COLUMNS.map((c) => c.label).join("\t")}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            또는 파일 선택 (.xlsx, .csv)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.csv,.txt"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && file.size > MAX_IMPORT_FILE_BYTES) {
                setFileError(
                  `파일이 너무 큽니다. ${Math.floor(MAX_IMPORT_FILE_BYTES / 1024)}KB 이하로 올려 주세요`,
                );
                event.target.value = "";
              } else {
                setFileError("");
              }
            }}
            aria-describedby={fileError ? "file-error" : undefined}
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-2 file:text-sm"
          />
          {fileError ? (
            <p id="file-error" role="alert" className="mt-1 text-sm text-red-600">
              {fileError}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            붙여넣기와 파일 중 하나만 사용해 주세요. 오류가 나면 파일은 다시 선택해
            주세요.
          </p>
        </div>

        {state.error ? (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
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
            {pending ? "확인 중..." : "미리보기"}
          </button>
        </div>
      </form>

      {state.preview ? (
        <PreviewResult key={previewKey} preview={state.preview} />
      ) : null}
    </div>
  );
}
