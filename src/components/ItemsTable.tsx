// Design Ref: §3.2 — 물건 목록 표: 맨 앞 칸은 위에 관리번호, 아래에 소재지(2026-11-05 물건명 칸 삭제), 그다음 단계 배지, 종류, 낙찰일, 낙찰가, 매수자
// 진행 중(입찰·낙찰·완납·등기소 접수) 물건이 먼저 나오고, 그 뒤에 종료(등기완료·유찰) 물건이 나온다.
// 20건씩 쪽을 나누므로, 그룹이 바뀌는 곳과 각 쪽의 첫 줄에 그룹 제목 줄을 넣는다.
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { isInProgress, type ItemListRow } from "@/types/item";

const COLUMN_COUNT = 6;

function formatPrice(price: number | null) {
  return price === null ? "-" : `${price.toLocaleString("ko-KR")}원`;
}

function groupTitle(inProgress: boolean) {
  return inProgress
    ? "진행 중 (입찰·낙찰·완납·등기소 접수)"
    : "종료 (등기완료·유찰)";
}

export default function ItemsTable({ items }: { items: ItemListRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">관리번호 / 소재지</th>
            <th scope="col" className="px-3 py-2 font-medium">단계</th>
            <th scope="col" className="px-3 py-2 font-medium">종류</th>
            <th scope="col" className="px-3 py-2 font-medium">낙찰일</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">낙찰가</th>
            <th scope="col" className="px-3 py-2 font-medium">매수자</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-900">
          {items.map((item, index) => {
            const inProgress = isInProgress(item.status);
            const startsGroup =
              index === 0 ||
              isInProgress(items[index - 1].status) !== inProgress;

            return [
              startsGroup ? (
                <tr key={`group-${item.id}`} className="bg-zinc-50">
                  <th
                    scope="colgroup"
                    colSpan={COLUMN_COUNT}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-600"
                  >
                    ▼ {groupTitle(inProgress)}
                  </th>
                </tr>
              ) : null,
              <tr key={item.id}>
                <td className="px-3 py-2">
                  {/* 위: 관리번호, 아래: 소재지. 소재지를 누르면 수정 화면(상세 확인 겸용)으로 간다 */}
                  <div className="text-xs text-zinc-500">{item.notice_no}</div>
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                  >
                    {item.location}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <StatusBadge status={item.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2">{item.category}</td>
                <td className="whitespace-nowrap px-3 py-2">{item.awarded_on ?? "-"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {formatPrice(item.awarded_price)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{item.buyer_name ?? "-"}</td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
