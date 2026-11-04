-- 작업 6번: items 테이블 접근 권한 (DESIGN.md §4.3)
--   - 로그인한 사용자(= 초대받은 팀원)만 읽기·쓰기 가능
--   - 로그인하지 않은 사용자(공개 키만 가진 사람)는 읽기·쓰기 모두 불가
--   - 삭제는 아무에게도 열지 않는다 (PRD 6번: 삭제 기능 없음)
-- 공개 가입은 꺼져 있으므로(작업 5번) "로그인한 사용자 = 오정민이 초대한 팀원"이다.

-- 1) 로그인하지 않은 사용자(anon)에게서 권한을 아예 회수한다. (정책이 없어도 막히지만 한 겹 더)
revoke all on public.items from anon;

-- 2) 로그인한 사용자(authenticated)에게는 읽기·등록·수정만 허용한다. 삭제 권한은 주지 않는다.
revoke all on public.items from authenticated;
grant select, insert, update on public.items to authenticated;

-- 3) 행 단위 규칙(RLS 정책): 로그인한 사용자만 읽기·등록·수정
create policy "로그인한 팀원은 물건을 읽을 수 있다"
  on public.items
  for select
  to authenticated
  using (true);

create policy "로그인한 팀원은 물건을 등록할 수 있다"
  on public.items
  for insert
  to authenticated
  with check (true);

create policy "로그인한 팀원은 물건을 수정할 수 있다"
  on public.items
  for update
  to authenticated
  using (true)
  with check (true);

-- 삭제 정책은 일부러 만들지 않는다. (정책이 없으면 삭제는 항상 거부된다)
