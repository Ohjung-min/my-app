-- 물건명(name) 칸을 없애고 소재지(location)로 대체한다 (2026-11-05 사용자 요청)
--   - 목록 맨 앞 칸은 "관리번호(notice_no, 예전 이름 공고번호) / 소재지"로 보인다
--   - 물건명이 하던 일: 중복 확인(낙찰일이 있을 때) → 소재지+낙찰일, 알림 문구 → 소재지, 검색 → 관리번호·소재지
--   - 이 마이그레이션을 적용할 때 DB에는 물건이 0건이라 사라지는 데이터는 없다
-- 주의: 이미 물건이 들어 있는 DB에 적용하면 물건명이 영구히 사라진다 (되돌릴 수 없다)

-- 1) 알림 문구를 소재지로 바꾼다. 칸을 지우기 전에 먼저 함수를 바꿔 둔다
--    (함수 안의 칸 이름은 실행될 때 확인되므로, 순서를 지키지 않으면 칸을 지운 뒤 알림이 실패한다)
--    문구 예: "서울 강남구 ○○아파트: 낙찰 → 완납"
create or replace function public.notify_item_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor text := nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), '');
begin
  insert into public.notifications (item_id, message, created_by)
  values (
    new.id,
    new.location || ': ' || old.status || ' → ' || new.status
      || case when actor is not null then ' (' || actor || ')' else '' end,
    auth.uid()
  );
  return new;
end;
$$;

-- 2) 물건명이 들어 있던 규칙·색인을 정리한다
alter table public.items drop constraint items_required_text_check;
drop index public.items_name_awarded_on_idx;

-- 3) 물건명 칸 삭제
alter table public.items drop column name;

-- 4) 필수 글자 칸 규칙: 관리번호·소재지는 빈 글자나 공백만으로 채울 수 없다
alter table public.items
  add constraint items_required_text_check
  check (btrim(notice_no) <> '' and btrim(location) <> '');

-- 5) 중복 확인(낙찰일이 있을 때: 소재지+낙찰일)과 검색(소재지)을 빠르게 하는 색인
create index items_location_awarded_on_idx
  on public.items (location, awarded_on);
