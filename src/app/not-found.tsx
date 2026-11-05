// 없는 주소나 없는 물건(수정 화면의 번호가 틀림 등)으로 들어왔을 때 보이는 한국어 안내 화면
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">
        찾을 수 없는 화면입니다
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        주소가 잘못되었거나 없어진 물건일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white"
      >
        목록으로 가기
      </Link>
    </main>
  );
}
