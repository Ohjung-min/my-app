-- 작업 17번: 알림 테이블과 "진행상황이 바뀌면 자동으로 알림을 남기는" 규칙 (DESIGN.md §4.2, §3.5)
--   - 알림은 물건의 진행상황이 실제로 바뀔 때만 생긴다. 새로 등록(일괄 등록 포함)할 때는 생기지 않는다 (PRD 5번)
--   - 알림은 앱 코드가 아니라 데이터베이스가 직접 남긴다. 그래서 어떤 경로로 바꿔도 빠지지 않고,
--     팀원이 API로 가짜 알림을 만들 수도 없다 (로그인한 사용자에게 알림 "읽기"만 허용)
--   - 변경 이력 기록이 아니라 알림 용도다 (PRD 6번 예외). 이력 화면은 만들지 않는다

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  message text not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  '진행상황 변경 알림. 변경 이력 화면이 아니라 상단 알림 종 용도다.';

-- 최근 알림 20건을 빠르게 가져오기 위한 색인
create index notifications_created_at_idx
  on public.notifications (created_at desc);

-- 접근 권한: 로그인하지 않은 사용자는 아무것도 못 하고, 로그인한 사용자는 읽기만 가능하다 (등록·수정·삭제 없음)
alter table public.notifications enable row level security;

revoke all on public.notifications from anon;
revoke all on public.notifications from authenticated;
grant select on public.notifications to authenticated;

create policy "로그인한 팀원은 알림을 읽을 수 있다"
  on public.notifications
  for select
  to authenticated
  using (true);

-- 진행상황이 바뀌면 알림을 남기는 함수.
-- 알림을 쓰는 권한은 이 함수(security definer)에만 있고, 팀원 계정에는 없다.
-- 문구 예: "서울 아파트: 낙찰 → 완납 (kim)"  (바꾼 사람은 로그인 이메일의 @ 앞부분)
create function public.notify_item_status_change()
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
    new.name || ': ' || old.status || ' → ' || new.status
      || case when actor is not null then ' (' || actor || ')' else '' end,
    auth.uid()
  );
  return new;
end;
$$;

revoke execute on function public.notify_item_status_change() from public, anon, authenticated;

-- 진행상황 값이 실제로 바뀐 경우에만 실행한다
create trigger items_notify_status_change
  after update of status on public.items
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_item_status_change();
