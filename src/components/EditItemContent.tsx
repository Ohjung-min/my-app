// Design Ref: §3.3 — 물건 수정 화면의 본문: 주소의 id로 물건을 찾아 등록 폼과 같은 폼에 처음 값을 채워 보여 준다
// 주소의 id를 읽는 부분은 Suspense 안에서 실행해야 한다 (Next.js 16 Cache Components 규칙)
import { notFound } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import { updateItem } from "@/features/items/actions";
import { getItemForEdit } from "@/features/items/queries";

export default async function EditItemContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getItemForEdit(id);

  if (result.status === "missing") notFound();

  if (result.status === "error") {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        물건을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  const { item } = result;

  return (
    <ItemForm
      action={updateItem.bind(null, item.id)}
      submitLabel="수정 저장"
      initialValues={{
        name: item.name,
        status: item.status,
        notice_no: item.notice_no,
        category: item.category,
        location: item.location,
        awarded_on: item.awarded_on ?? "",
        awarded_price:
          item.awarded_price === null ? "" : String(item.awarded_price),
        buyer_name: item.buyer_name ?? "",
        memo: item.memo ?? "",
      }}
    />
  );
}
