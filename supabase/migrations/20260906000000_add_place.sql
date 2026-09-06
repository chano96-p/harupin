-- 선택한 장소를 특정 Day 에 추가한다.
--
-- visit_order 를 앱에서 계산하면 안 된다. "현재 최대값 + 1" 을 읽고 쓰는 사이에
-- 다른 요청이 끼어들면 같은 순번이 두 번 생기고, unique (day_id, visit_order) 가
-- 커밋 시점에 터진다(DEFERRABLE 이라 더 늦게 드러난다).
-- Day 행을 잠가 같은 Day 에 대한 추가를 직렬화한다.
--
-- security invoker (기본값) 라 RLS 가 그대로 적용된다. 남의 Day 는 아래 select 에서
-- 아예 보이지 않으므로 v_trip 이 null 이 되어 차단된다.
create function harupin.add_place(
  p_day_id          uuid,
  p_name            text,
  p_lat             double precision,
  p_lng             double precision,
  p_category        text,
  p_google_place_id text default null,
  p_memo            text default null
)
returns harupin.places
language plpgsql
set search_path = harupin, pg_catalog
as $$
declare
  v_user  uuid := auth.uid();
  v_trip  uuid;
  v_order int;
  v_place harupin.places;
begin
  select trip_id into v_trip
    from harupin.days
   where id = p_day_id
   for update;

  if v_trip is null then
    raise exception '존재하지 않거나 접근할 수 없는 Day 입니다';
  end if;

  select coalesce(max(visit_order), 0) + 1 into v_order
    from harupin.places
   where day_id = p_day_id;

  insert into harupin.places (
    day_id, trip_id, user_id, name, lat, lng,
    google_place_id, category, memo, visit_order
  )
  values (
    p_day_id, v_trip, v_user, p_name, p_lat, p_lng,
    p_google_place_id, p_category, p_memo, v_order
  )
  returning * into v_place;

  return v_place;
end;
$$;

revoke execute on function harupin.add_place(
  uuid, text, double precision, double precision, text, text, text
) from public;
grant execute on function harupin.add_place(
  uuid, text, double precision, double precision, text, text, text
) to authenticated;
