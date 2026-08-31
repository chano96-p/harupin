-- 하루핀 초기 스키마
--
-- 기존 Supabase 프로젝트에 얹기 위해 전용 스키마 `harupin` 을 쓴다.
-- 무료 플랜의 프로젝트 개수 한도 때문이며, auth.users 만 공유하고
-- 데이터는 이 스키마 안에서 완전히 분리된다.
--
-- 설계 근거는 계획서 §3 참고. 요약:
--  - days/places 에 user_id 를 비정규화해 RLS 정책이 행마다 조인을 돌지 않게 한다.
--    무결성은 복합 FK 로 DB가 강제한다.
--  - user_id 컬럼의 default auth.uid() 는 JWT 가 실린 요청에서만 값이 채워진다.
--    service_role 등 auth.uid() 가 null 인 컨텍스트에서는 not-null 위반이 나므로
--    서버 코드는 user_id 를 항상 명시해야 한다.
--  - Place Details 캐시는 place_cache 전역 테이블로 분리해 전 사용자가 공유한다.
--  - share_id 는 3단계 기능이지만 지금 넣는다 (나중에 넣으면 마이그레이션+백필).
--  - places.day_id 는 NOT NULL. 기간 축소 시 장소가 있는 Day 삭제는 앱에서 막는다.
--    ("미배정 보관함" 방식으로 바꾸려면 이 컬럼을 nullable 로 푸는 것만으로 전환 가능)

create schema if not exists harupin;

-- ─────────────────────────────────────────────────────────────
-- 여행
-- ─────────────────────────────────────────────────────────────
create table harupin.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (length(btrim(title)) > 0),
  start_date  date not null,
  end_date    date not null,
  region      text,
  -- 공유 뷰(3단계)용. trip.id 를 URL 에 쓰면 내부 ID 가 노출되고 열거의 표적이 되므로
  -- 공유 전용 랜덤 토큰을 따로 둔다. 이 토큰이 의미를 가지려면 익명이 trips 를
  -- 열거할 수 없어야 한다 — 아래 RLS 절 참고.
  share_id    uuid not null unique default gen_random_uuid(),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint trips_date_order check (end_date >= start_date),
  -- 자식 테이블의 복합 FK 대상
  constraint trips_id_user_id_key unique (id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- 일차
-- ─────────────────────────────────────────────────────────────
create table harupin.days (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null,
  user_id     uuid not null default auth.uid(),
  -- 소속 trip 의 start_date ~ end_date 범위는 DB 가 강제하지 않는다.
  -- CHECK 는 다른 테이블을 참조할 수 없다. Day 생성·기간 수정 로직에서 보장한다.
  date        date not null,
  day_number  int  not null check (day_number >= 1),

  constraint days_trip_day_number_key unique (trip_id, day_number),
  constraint days_trip_date_key       unique (trip_id, date),
  -- user_id 가 부모와 다른 값으로 들어오는 것을 DB가 막는다
  constraint days_trip_fk foreign key (trip_id, user_id)
    references harupin.trips (id, user_id) on delete cascade,
  -- 자식(places)의 복합 FK 대상. trip_id 까지 묶어야
  -- "TripA 의 Day 인데 trip_id 는 TripB" 같은 조합을 places 쪽에서 막을 수 있다.
  constraint days_id_trip_id_user_id_key unique (id, trip_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- 장소
-- ─────────────────────────────────────────────────────────────
create table harupin.places (
  id              uuid primary key default gen_random_uuid(),
  day_id          uuid not null,
  trip_id         uuid not null,
  user_id         uuid not null default auth.uid(),

  -- 이름·좌표는 스냅샷으로 보관한다. place_cache 가 비어 있어도 리스트가 그려져야 한다.
  name            text not null check (length(btrim(name)) > 0),
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  google_place_id text,

  category        text not null
                  check (category in ('food', 'sight', 'activity', 'lodging')),
  memo            text,
  visit_order     int not null check (visit_order >= 1),
  created_at      timestamptz not null default now(),

  -- day_id · trip_id · user_id 가 모두 같은 Day 행을 가리키도록 DB 가 강제한다.
  -- day_id 와 trip_id 를 각각 따로 걸면 둘이 어긋난 행이 통과하고,
  -- trip_id 만 보는 공유 뷰 정책에서 비공개 여행의 장소가 새어나간다.
  -- trips 와의 정합성은 days_trip_fk 를 통해 전이적으로 보장되므로 별도 FK 가 필요 없다.
  constraint places_day_fk foreign key (day_id, trip_id, user_id)
    references harupin.days (id, trip_id, user_id) on delete cascade,

  -- 순서 중복 방지. dnd 재정렬은 여러 행을 한 트랜잭션에서 갱신하므로
  -- DEFERRABLE 이 아니면 중간 상태에서 충돌한다.
  --
  -- 단, DEFERRABLE 제약은 ON CONFLICT 의 arbiter 가 될 수 없다:
  --   ERROR: ON CONFLICT does not support deferrable unique constraints ... as arbiters
  -- 재정렬 upsert 는 반드시 PK(id) 를 arbiter 로 쓸 것. 그러면 스왑도 한 문장에서 통과한다.
  constraint places_day_visit_order_key unique (day_id, visit_order)
    deferrable initially deferred
);

-- ─────────────────────────────────────────────────────────────
-- Place Details 캐시 (전역 공유)
-- ─────────────────────────────────────────────────────────────
-- places 행마다 캐시를 두면 같은 장소를 여행·사용자마다 중복 저장·재호출하게 되어
-- 캐싱의 목적이 사라진다. google_place_id 를 PK 로 하는 전역 테이블로 분리한다.
--
-- TODO(0단계): Google Places 약관은 place_id 외 콘텐츠의 보관 기간을 제한한다.
-- 보관 일수를 현행 약관에서 확인하고, fetched_at 기준 만료 방식을 확정할 것
-- (조회 시 fetched_at 필터 / pg_cron 삭제 잡). 지금은 만료 메커니즘이 없다.
create table harupin.place_cache (
  google_place_id text primary key,
  details         jsonb not null,
  fetched_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 인덱스
-- ─────────────────────────────────────────────────────────────
-- (trip_id, day_number) 와 (day_id, visit_order) 는 위의 unique 제약이
-- 이미 동일한 인덱스를 만든다. 따로 걸지 않는다.
create index trips_user_id_created_at_idx on harupin.trips (user_id, created_at desc);
create index days_user_id_idx             on harupin.days  (user_id);
create index places_trip_id_idx            on harupin.places (trip_id);
create index places_user_id_idx            on harupin.places (user_id);
create index place_cache_fetched_at_idx    on harupin.place_cache (fetched_at);

-- ─────────────────────────────────────────────────────────────
-- 권한
-- ─────────────────────────────────────────────────────────────
-- public 스키마와 달리 커스텀 스키마는 Supabase 가 자동으로 권한을 주지 않는다.
-- 이 grant 가 없으면 RLS 이전에 스키마 접근 자체가 막힌다.
--
-- grant 는 "누가 이 테이블에 닿을 수 있는가", RLS 는 "그중 어느 행인가" 를 정한다.
-- 두 층이 같은 의도를 말하도록 대상을 좁게 준다. RLS 가 어차피 막는다고 넓게 주면
-- 정책을 하나 잘못 고쳤을 때 곧바로 노출로 이어진다.
grant usage on schema harupin to anon, authenticated, service_role;

-- 사용자 데이터: 로그인 사용자와 서버만.
-- anon 은 정책이 하나도 없으므로 테이블 권한을 주지 않는다. 3단계 공유 뷰는
-- security definer 함수로 열 것이라 anon 에게 필요한 것은 위의 schema usage 뿐이다.
grant select, insert, update, delete
  on harupin.trips, harupin.days, harupin.places
  to authenticated, service_role;

-- 캐시: 서버 전용. 클라이언트는 Route Handler 를 거치므로 읽기도 필요 없다.
grant select, insert, update, delete on harupin.place_cache to service_role;

-- default privileges 는 두지 않는다. 테이블마다 대상이 다르므로(위 두 grant 를 비교)
-- 일괄 기본값을 두면 새 테이블이 의도보다 넓은 권한을 조용히 물려받는다.
-- 앞으로 테이블을 추가할 때는 grant 를 명시적으로 쓸 것.
-- 빠뜨리면 "정책은 맞는데 결과가 0건" 으로 나타난다.

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table harupin.trips       enable row level security;
alter table harupin.days        enable row level security;
alter table harupin.places      enable row level security;
alter table harupin.place_cache enable row level security;

-- 본인 행만. user_id 비정규화 덕분에 조인 없이 한 줄로 끝난다.
create policy trips_own on harupin.trips
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy days_own on harupin.days
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy places_own on harupin.places
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 공유 뷰(3단계)는 익명 select 정책으로 만들지 않는다.
--
-- is_public = true 만 검사하는 정책을 두면 익명이 trips 를 통째로 열거할 수 있고,
-- 그 결과 user_id 와 share_id 까지 읽힌다. share_id 를 따로 둔 이유(열거 방지)가
-- 그대로 무력화된다. days·places 도 같은 경로로 딸려 나온다.
--
-- 3단계에서 share_id 를 인자로 받는 security definer 함수로 구현할 것.
-- 함수에는 search_path 를 고정해야 한다 (미고정 시 search_path 주입에 노출).
--   create function harupin.get_shared_trip(p_share_id uuid) ...
--     security definer set search_path = harupin, pg_temp
--   -- where share_id = p_share_id and is_public = true

-- place_cache 에는 정책을 만들지 않는다. RLS 가 켜져 있고 정책이 없으므로
-- anon·authenticated 는 읽기·쓰기 모두 막히고, service_role(RLS 우회)만 접근한다.
--
-- 클라이언트는 이 테이블을 직접 읽지 않는다. 캐시 조회는 Route Handler 가
-- service_role 로 수행한다 (계획서 §2 "과금 호출은 서버 프록시 경유").
-- using (true) 로 익명 읽기를 열면 번들에 공개되는 anon 키로 캐시 전체를
-- 덤프할 수 있고, 프록시를 우회하는 읽기 경로가 생겨 §2 설계와 어긋난다.
