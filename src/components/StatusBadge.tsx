// Design Ref: §3.2 — 진행상황 5단계를 색으로 구분하는 배지 (입찰 회색, 낙찰 파랑, 완납 주황, 등기완료 초록, 유찰 빨강)
// 색만으로 구분하지 않도록 글자도 항상 함께 보여 준다
import type { ItemStatus } from "@/types/item";

const STATUS_STYLES: Record<ItemStatus, string> = {
  입찰: "bg-zinc-100 text-zinc-700 ring-zinc-300",
  낙찰: "bg-blue-50 text-blue-700 ring-blue-200",
  완납: "bg-orange-50 text-orange-700 ring-orange-200",
  등기완료: "bg-green-50 text-green-700 ring-green-200",
  유찰: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
