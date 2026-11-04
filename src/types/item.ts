// Design Ref: §4.1 — 물건(items) 테이블의 데이터 모양. 화면과 데이터 처리 코드가 같은 이름을 쓰도록 한곳에 정의한다

/** 진행상황 5단계 (PRD 5번). 테이블에서도 이 5개 값만 허용한다 */
export const ITEM_STATUSES = [
  "입찰",
  "낙찰",
  "완납",
  "등기완료",
  "유찰",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

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
