-- 장소를 같은 여행의 다른 Day 로 옮긴다. 받는 Day 의 맨 뒤에 붙는다.
--
-- 잠금: add_place·reorder_places 와 같은 Day 행 잠금을 쓴다. 두 Day 를 잠가야 하므로
-- 항상 id 순서로 잠가 교착을 피한다(A→B 이동과 B→A 이동이 동시에 와도 같은 순서로 기다린다).
-- 장소 행은 Day 를 잠근 뒤에 잠근다. 먼저 잠그면 Day 를 잡고 장소를 갱신하는
-- reorder_places 와 반대 순서가 되어 교착이 난다. 그래서 처음 읽은 day_id 가
-- 잠금 사이에 바뀌었으면(다른 요청이 먼저 옮김) 거부한다.
--
-- 떠난 Day 에 생기는 빈 순번은 메우지 않는다. 화면 번호는 목록 순서로 매기고,
-- 다음 reorder_places 가 1 부터 다시 매긴다.
--
-- security invoker (기본값) 라 RLS 가 그대로 적용된다. 남의 장소·Day 는 보이지 않아 null 로 걸린다.
-- 반환값은 trip_id — 앱이 revalidate 경로를 클라이언트 값이 아니라 DB 에서 얻기 위함.
create function harupin.move_place(
  p_place_id  uuid,
  p_to_day_id uuid
)
returns uuid
language plpgsql
set search_path = harupin, pg_catalog
as $$
declare
  v_from_day uuid;
  v_trip     uuid;
  v_to_trip  uuid;
  v_locked   uuid;
  v_order    int;
begin
  select day_id, trip_id into v_from_day, v_trip
    from harupin.places
   where id = p_place_id;

  if v_from_day is null then
    raise exception '존재하지 않거나 접근할 수 없는 장소입니다';
  end if;

  select trip_id into v_to_trip
    from harupin.days
   where id = p_to_day_id;

  if v_to_trip is null or v_to_trip <> v_trip then
    raise exception '같은 여행의 Day 로만 옮길 수 있습니다';
  end if;

  if v_from_day = p_to_day_id then
    return v_trip;
  end if;

  perform 1
     from harupin.days
    where id in (v_from_day, p_to_day_id)
    order by id
      for update;

  select day_id into v_locked
    from harupin.places
   where id = p_place_id
     for update;

  if v_locked is distinct from v_from_day then
    raise exception '장소가 그사이 옮겨졌거나 삭제되었습니다';
  end if;

  select coalesce(max(visit_order), 0) + 1 into v_order
    from harupin.places
   where day_id = p_to_day_id;

  update harupin.places
     set day_id = p_to_day_id,
         visit_order = v_order
   where id = p_place_id;

  return v_trip;
end;
$$;

revoke execute on function harupin.move_place(uuid, uuid) from public;
grant execute on function harupin.move_place(uuid, uuid) to authenticated;
