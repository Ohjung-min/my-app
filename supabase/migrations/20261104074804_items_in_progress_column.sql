-- 작업 9번: "진행 중(입찰·낙찰·완납) 물건을 맨 위에 모아 보기" 를 위한 정렬용 칸 (DESIGN.md §5)
-- 진행상황이 바뀌면 자동으로 다시 계산되는 칸이라, 앱이 따로 채우지 않는다.
-- 목록은 "진행 중 먼저 → 낙찰일(없으면 등록일) 최신순"으로 전체를 이어서 20건씩 자른다.

alter table public.items
  add column is_in_progress boolean
  generated always as (status in ('입찰', '낙찰', '완납')) stored;

comment on column public.items.is_in_progress is
  '진행 중(입찰·낙찰·완납)이면 true, 종료(등기완료·유찰)이면 false. 목록 정렬용 자동 계산 칸.';

-- 목록 정렬(진행 중 먼저 → sort_date 최신순 → 등록 시각 최신순)을 빠르게 하는 색인
create index items_list_order_idx
  on public.items (is_in_progress desc, sort_date desc, created_at desc);
