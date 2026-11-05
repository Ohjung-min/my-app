"use client";

// 예상하지 못한 오류가 났을 때(큰 파일 업로드 거부, 서버 오류 등) Next.js 기본 영어 화면 대신 보이는 한국어 안내 화면
import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">
        문제가 생겼습니다
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        잠시 후 다시 시도해 주세요. 계속되면 관리자에게 알려 주세요. 파일을
        올리던 중이었다면 파일이 너무 큰 것일 수 있습니다.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#183a76] hover:bg-[#122c5a] px-4 py-2 text-base font-medium text-white"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 hover:bg-zinc-50"
        >
          목록으로 가기
        </Link>
      </div>
    </main>
  );
}
