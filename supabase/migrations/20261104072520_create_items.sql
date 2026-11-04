-- 작업 3번: 공매 낙찰 물건 테이블 (DESIGN.md §4.1)
-- 접근 권한 규칙(RLS 정책)은 작업 6번에서 추가한다.
-- 그 전까지는 RLS를 켜 두기만 해서, 정책이 없으므로 공개 키로는 아무것도 읽거나 쓸 수 없다. (안전한 기본값)

create table public.items (
  id uuid primary key default gen_random_uuid(),

  -- 항상 필수 (PRD 5번 must 1)
  name text not null,
  status text not null,
  notice_no text not null,
  category text not null,
  location text not null,

  -- 낙찰·완납·등기완료 단계에서만 필수 (아래 check 참고)
  awarded_on date,
  awarded_price bigint,
  buyer_name text,

  -- 선택
  memo text,

  -- 정렬용: 낙찰일, 없으면 등록일(한국 시간 기준) (DESIGN.md §4.1, §5)
  sort_date date generated always as (
    coalesce(awarded_on, (created_at at time zone 'Asia/Seoul')::date)
  ) stored,

  -- 마지막 수정자 표시와 알림 용도로만 쓴다 (PRD 6번 예외)
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 진행상황은 5개 값만 허용
  constraint items_status_check
    check (status in ('입찰', '낙찰', '완납', '등기완료', '유찰')),

  -- 물건 종류는 2개 값만 허용
  constraint items_category_check
    check (category in ('부동산', '차량')),

  -- 필수 글자 칸은 빈 문자열·공백만으로 채울 수 없다
  constraint items_required_text_check
    check (
      btrim(name) <> ''
      and btrim(notice_no) <> ''
      and btrim(location) <> ''
    ),

  -- 낙찰가는 0 이상
  constraint items_awarded_price_check
    check (awarded_price is null or awarded_price >= 0),

  -- 낙찰·완납·등기완료이면 낙찰일·낙찰가·매수자 이름이 필수 (입찰·유찰은 비어도 됨)
  constraint items_awarded_fields_check
    check (
      status in ('입찰', '유찰')
      or (
        awarded_on is not null
        and awarded_price is not null
        and buyer_name is not null
        and btrim(buyer_name) <> ''
      )
    )
);

comment on table public.items is '공매 낙찰 물건. 개인정보는 매수자 이름(buyer_name)만 저장한다.';

-- 빠른 조회용 색인 (DESIGN.md §4.1)
create index items_status_idx on public.items (status);
create index items_sort_date_idx on public.items (sort_date desc);
create index items_name_awarded_on_idx on public.items (name, awarded_on);
create index items_notice_no_idx on public.items (notice_no);

-- 수정할 때마다 수정 시각과 마지막 수정자를 자동으로 채운다
create function public.set_items_updated()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger items_set_updated
  before update on public.items
  for each row execute function public.set_items_updated();

-- RLS를 켠다. 정책은 작업 6번에서 추가하므로, 지금은 로그인 여부와 상관없이 접근이 모두 막힌다.
alter table public.items enable row level security;
