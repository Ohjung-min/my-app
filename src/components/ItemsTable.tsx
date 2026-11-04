// Design Ref: §3.2 — 물건 목록 표: 단계, 물건명, 종류, 소재지, 낙찰일, 낙찰가, 매수자
// (단계를 색으로 구분하는 배지와 "진행 중 모아 보기"는 작업 9번에서 더한다)
import type { ItemListRow } from "@/types/item";

function formatPrice(price: number | null) {
  return price === null ? "-" : `${price.toLocaleString("ko-KR")}원`;
}

export default function ItemsTable({ items }: { items: ItemListRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">단계</th>
            <th scope="col" className="px-3 py-2 font-medium">물건명</th>
            <th scope="col" className="px-3 py-2 font-medium">종류</th>
            <th scope="col" className="px-3 py-2 font-medium">소재지</th>
            <th scope="col" className="px-3 py-2 font-medium">낙찰일</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">낙찰가</th>
            <th scope="col" className="px-3 py-2 font-medium">매수자</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-900">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap px-3 py-2">{item.status}</td>
              <td className="px-3 py-2 font-medium">{item.name}</td>
              <td className="whitespace-nowrap px-3 py-2">{item.category}</td>
              <td className="px-3 py-2">{item.location}</td>
              <td className="whitespace-nowrap px-3 py-2">{item.awarded_on ?? "-"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                {formatPrice(item.awarded_price)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{item.buyer_name ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
