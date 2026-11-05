// Design Ref: §4.1 — 물건(items) 테이블의 데이터 모양. 화면과 데이터 처리 코드가 같은 이름을 쓰도록 한곳에 정의한다

/** 진행상황 6단계 (PRD 5번, 2026-11-05 "등기소 접수" 추가). 테이블에서도 이 6개 값만 허용한다 */
export const ITEM_STATUSES = [
  "입찰",
  "낙찰",
  "완납",
  "등기소 접수",
  "등기완료",
  "유찰",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** 진행 중으로 보는 단계 (PRD 5번: 입찰·낙찰·완납·등기소 접수). 나머지(등기완료·유찰)는 종료 */
export const IN_PROGRESS_STATUSES: readonly ItemStatus[] = [
  "입찰",
  "낙찰",
  "완납",
  "등기소 접수",
];

export function isInProgress(status: ItemStatus): boolean {
  return IN_PROGRESS_STATUSES.includes(status);
}

/** 낙찰 이후 단계 (PRD 5번). 이 단계에서는 낙찰일·낙찰가·매수자 이름이 필수다 */
export const AWARDED_STATUSES: readonly ItemStatus[] = [
  "낙찰",
  "완납",
  "등기소 접수",
  "등기완료",
];

export function isAwardedStatus(status: string): boolean {
  return (AWARDED_STATUSES as readonly string[]).includes(status);
}

/** 물건 종류 2가지 (PRD 5번) */
export const ITEM_CATEGORIES = ["부동산", "차량"] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

/** 목록에 보여 주는 물건 한 건 */
export type ItemListRow = {
  id: string;
  name: string;
  status: ItemStatus;
  notice_no: string;
  category: ItemCategory;
  location: string;
  /** 낙찰일 (YYYY-MM-DD). 입찰·유찰은 비어 있을 수 있다 */
  awarded_on: string | null;
  /** 낙찰가(원). 입찰·유찰은 비어 있을 수 있다 */
  awarded_price: number | null;
  /** 매수자 이름. 입찰·유찰은 비어 있을 수 있다 */
  buyer_name: string | null;
  /** 정렬용 날짜: 낙찰일, 없으면 등록일 */
  sort_date: string;
};
