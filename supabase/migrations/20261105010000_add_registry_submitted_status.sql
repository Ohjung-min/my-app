-- 진행상황에 "등기소 접수" 추가 (2026-11-05 사용자 요청)
--   순서: 입찰 → 낙찰 → 완납 → 등기소 접수 → 등기완료 (유찰은 따로)
--   - 허용하는 진행상황이 6개가 된다
--   - "진행 중"으로 센다 (입찰·낙찰·완납·등기소 접수). 종료는 등기완료·유찰
--   - 낙찰 이후 단계라서 낙찰일·낙찰가·매수자 이름이 필수다
--     (기존 items_awarded_fields_check는 "입찰·유찰이 아니면 3칸 필수"라서 바꿀 필요가 없다)

-- 1) 진행상황 허용 값
alter table public.items drop constraint items_status_check;
alter table public.items
  add constraint items_status_check
  check (status in ('입찰', '낙찰', '완납', '등기소 접수', '등기완료', '유찰'));

-- 2) 진행 중 정렬용 자동 계산 칸: 식을 바꿀 수 없어서 지우고 다시 만든다 (딸린 색인도 다시 만든다)
drop index if exists public.items_list_order_idx;
alter table public.items drop column is_in_progress;

alter table public.items
  add column is_in_progress boolean
  generated always as (status in ('입찰', '낙찰', '완납', '등기소 접수')) stored;

comment on column public.items.is_in_progress is
  '진행 중(입찰·낙찰·완납·등기소 접수)이면 true, 종료(등기완료·유찰)이면 false. 목록 정렬용 자동 계산 칸.';

create index items_list_order_idx
  on public.items (is_in_progress desc, sort_date desc, created_at desc);
