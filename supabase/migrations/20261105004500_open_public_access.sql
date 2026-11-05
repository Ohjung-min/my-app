-- 로그인 없이 누구나 쓰는 서비스로 바꾼다 (2026-11-05 사용자 결정, PRD 7번 변경)
--   - 로그인하지 않은 사용자(anon)도 물건 읽기·등록·수정, 알림 읽기가 가능하다
--   - 삭제는 여전히 아무에게도 열지 않는다 (PRD 6번: 삭제 기능 없음)
--   - 알림은 계속 데이터베이스가 자동으로만 남긴다 (직접 만들기·고치기·지우기 불가)
-- 주의: 공개 키(anon)는 앱을 통해 브라우저에 전달되는 값이라, 주소를 아는 누구나 이 권한을 쓸 수 있다.
--       낙찰가와 매수자 이름을 포함한 모든 물건 정보가 공개된다.

-- 1) 권한(grant): 로그인하지 않은 사용자에게도 읽기·등록·수정을 준다. 삭제는 주지 않는다
grant select, insert, update on public.items to anon;
grant select on public.notifications to anon;

-- 2) 행 단위 규칙(RLS 정책): 로그인 여부와 상관없이 읽기·등록·수정 허용
--    (정책 이름도 "로그인한 팀원은"에서 현재 상태에 맞게 바꾼다)
drop policy "로그인한 팀원은 물건을 읽을 수 있다" on public.items;
drop policy "로그인한 팀원은 물건을 등록할 수 있다" on public.items;
drop policy "로그인한 팀원은 물건을 수정할 수 있다" on public.items;
drop policy "로그인한 팀원은 알림을 읽을 수 있다" on public.notifications;

create policy "누구나 물건을 읽을 수 있다"
  on public.items
  for select
  to anon, authenticated
  using (true);

create policy "누구나 물건을 등록할 수 있다"
  on public.items
  for insert
  to anon, authenticated
  with check (true);

create policy "누구나 물건을 수정할 수 있다"
  on public.items
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "누구나 알림을 읽을 수 있다"
  on public.notifications
  for select
  to anon, authenticated
  using (true);

-- 삭제 정책은 일부러 만들지 않는다. (정책이 없으면 삭제는 항상 거부된다)
