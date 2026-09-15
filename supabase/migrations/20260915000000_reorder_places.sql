-- 한 Day 안의 장소 순서를 바꾼다 (dnd).
--
-- places_day_visit_order_key 가 DEFERRABLE INITIALLY DEFERRED 라 순서 검사는 커밋 시점에 한다.
-- 그래서 서로 자리를 바꾸는 갱신도 아래 update 한 문장으로 통과한다.
--
-- 클라이언트는 이 Day 의 전체 목록을 보낸다(삭제 대기로 화면에서만 숨긴 장소도 제자리에 포함).
-- 그래도 목록에 없는 장소(다른 탭에서 그사이 추가된 장소 등)는 기존 순서대로 뒤에 붙인다.
-- 대신 다른 Day·이미 지워진 id, 중복, null 이 섞이면 목록이 서버와 어긋난 것이므로 거부한다.
-- 앱은 거부되면 최신 목록을 다시 받아온다(TripEditor handleReorder).
--
-- 순번은 1 부터 빈틈 없이 다시 매긴다. 삭제로 생긴 빈 번호도 여기서 메워진다.
--
-- add_place 와 같은 Day 행을 잠가 같은 Day 에 대한 추가·재정렬을 직렬화한다.
-- security invoker (기본값) 라 RLS 가 그대로 적용된다. 남의 Day 는 보이지 않아 v_trip 이 null 이 된다.
-- 반환값은 trip_id — 앱이 revalidate 경로를 클라이언트 값이 아니라 DB 에서 얻기 위함.
create function harupin.reorder_places(
  p_day_id    uuid,
  p_place_ids uuid[]
)
returns uuid
language plpgsql
set search_path = harupin, pg_catalog
as $$
declare
  v_trip uuid;
begin
  select trip_id into v_trip
    from harupin.days
   where id = p_day_id
   for update;

  if v_trip is null then
    raise exception '존재하지 않거나 접근할 수 없는 Day 입니다';
  end if;

  if p_place_ids is null
     or cardinality(p_place_ids) <> (select count(distinct x) from unnest(p_place_ids) as x)
     or exists (
          select 1
            from unnest(p_place_ids) as x
           where not exists (
                   select 1 from harupin.places pl
                    where pl.id = x and pl.day_id = p_day_id
                 )
        )
  then
    raise exception '순서 목록이 이 Day 의 장소와 맞지 않습니다';
  end if;

  update harupin.places p
     set visit_order = r.new_order
    from (
      select pl.id,
             row_number() over (order by g.ord nulls last, pl.visit_order) as new_order
        from harupin.places pl
        left join unnest(p_place_ids) with ordinality as g(id, ord) on g.id = pl.id
       where pl.day_id = p_day_id
    ) r
   where p.id = r.id
     and p.visit_order <> r.new_order;

  return v_trip;
end;
$$;

revoke execute on function harupin.reorder_places(uuid, uuid[]) from public;
grant execute on function harupin.reorder_places(uuid, uuid[]) to authenticated;
