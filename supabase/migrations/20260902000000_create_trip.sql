-- 여행 기간 상한. generate_series 가 기간만큼 days 를 만들기 때문에 상한이 없으면
-- 호출 한 번으로 테이블이 부풀 수 있다 (1900~2100 = 73,050행 / 21MB / 520ms 실측).
-- trips_date_order 는 end >= start 만 보므로 이걸 막지 못한다.
-- 날짜 입력의 연도 오타만으로도 도달하는 경로다.
alter table harupin.trips
  add constraint trips_duration_limit check (end_date - start_date <= 365);

-- 여행 생성 + 일차 자동 생성을 한 트랜잭션으로 묶는다.
--
-- supabase-js 는 여러 문장을 한 트랜잭션으로 보낼 수 없다. 클라이언트에서
-- trips 를 넣고 이어서 days 를 넣으면 그 사이에 실패했을 때 일차 없는 여행이 남는다.
-- places 가 days 를 참조하므로 그 여행은 아무것도 담을 수 없는 상태가 된다.
--
-- security invoker (기본값) 라서 RLS 가 그대로 적용된다. 호출자가 자기 행만 만든다.
-- search_path 를 고정하지 않으면 함수 안의 참조가 호출자의 search_path 에 좌우된다.
create function harupin.create_trip(
  p_title      text,
  p_start_date date,
  p_end_date   date,
  p_region     text default null
)
returns harupin.trips
language plpgsql
set search_path = harupin, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip    harupin.trips;
begin
  insert into harupin.trips (user_id, title, start_date, end_date, region)
  values (v_user_id, p_title, p_start_date, p_end_date, p_region)
  returning * into v_trip;

  insert into harupin.days (trip_id, user_id, date, day_number)
  select v_trip.id, v_user_id, d::date, (d::date - p_start_date) + 1
  from generate_series(p_start_date, p_end_date, interval '1 day') as d;

  return v_trip;
end;
$$;

-- 함수는 생성 시 PUBLIC 에 EXECUTE 가 자동으로 붙는다. to authenticated 만 적으면
-- anon 도 호출할 수 있다. init.sql 이 anon 에게 테이블 권한을 주지 않아 실제 피해는
-- 없지만, 권한을 좁게 준다는 그 파일의 의도와 어긋나므로 명시적으로 회수한다.
revoke execute on function harupin.create_trip(text, date, date, text) from public;
grant execute on function harupin.create_trip(text, date, date, text) to authenticated;

-- 홈 카드용 목록. 여행마다 장소 수와 등장한 카테고리를 DB 에서 접어 돌려준다.
--
-- 클라이언트에서 places 를 전량 받아 세면 PostgREST 의 max_rows(기본 1000)에서
-- 조용히 잘린다. 에러가 아니라 200 + Content-Range 로 끊기므로 개수가 어긋난 채
-- 화면에 나온다 (1,200행 중 1,000행만 수신되는 것을 실측).
-- 반환 행이 여행 수만큼이라 이 함수는 그 한도에 걸리지 않는다.
--
-- security invoker 라서 RLS 가 그대로 적용된다 — 본인 여행만 보인다.
-- (뷰로 만들면 security_invoker = true 를 빠뜨렸을 때 RLS 를 우회한다.)
create function harupin.list_trips()
returns table (
  id          uuid,
  title       text,
  start_date  date,
  end_date    date,
  place_count bigint,
  categories  text[]
)
language sql
stable
set search_path = harupin, pg_catalog
as $$
  select t.id, t.title, t.start_date, t.end_date,
         count(p.id),
         coalesce(array_agg(distinct p.category) filter (where p.id is not null), '{}')
  from harupin.trips t
  left join harupin.places p on p.trip_id = t.id
  group by t.id, t.title, t.start_date, t.end_date, t.created_at
  order by t.created_at desc
$$;

revoke execute on function harupin.list_trips() from public;
grant execute on function harupin.list_trips() to authenticated;
