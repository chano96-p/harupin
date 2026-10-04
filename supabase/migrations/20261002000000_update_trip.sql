-- 여행 설정 저장 (시안 3b): 제목·지역·기간.
--
-- 기간 축소: 잘려 나가는 뒤쪽 Day 가 비어 있을 때만 그 Day 를 지운다. 장소가 하나라도 있으면
-- 거부한다 (init.sql: places.day_id NOT NULL, "장소가 있는 Day 삭제는 막는다").
-- 날짜 연도 오타로 길어진 여행을 지우지 않고 고칠 수 있게 하려는 것이다.
-- 남는 Day 는 지우지 않으므로 id 와 장소가 그대로 남고, 날짜만 새 시작일 기준으로
-- 다시 매긴 뒤 늘어난 만큼 Day 를 뒤에 붙인다.
--
-- days_trip_date_key unique (trip_id, date) 는 deferrable 이 아니라 행마다 즉시 검사한다.
-- "date = 새 날짜" 한 문장으로 하루씩 밀면 갱신 순서에 따라 아직 안 옮긴 옆 행과 부딪힌다
-- (실측: duplicate key). 그래서 먼저 옛 범위·새 범위 모두보다 뒤인 날짜로 비켜 놓은 뒤
-- 제자리로 옮긴다. 비켜 둔 날짜는 두 범위 어느 쪽과도 겹치지 않는다.
--
-- 잠금: 여행 행 → Day 행(id 순서). move_place 와 같은 id 순서로 Day 를 잡아 교착을 피한다.
-- security invoker (기본값) 라 RLS 가 그대로 적용된다. 남의 여행은 보이지 않아 null 로 걸린다.
create function harupin.update_trip(
  p_trip_id    uuid,
  p_title      text,
  p_start_date date,
  p_end_date   date,
  p_region     text default null
)
returns uuid
language plpgsql
set search_path = harupin, pg_catalog
as $$
declare
  v_user      uuid;
  v_old_count int;
  v_old_end   date;
  v_new_count int := (p_end_date - p_start_date) + 1;
begin
  select user_id into v_user
    from harupin.trips
   where id = p_trip_id
     for update;

  if v_user is null then
    raise exception '존재하지 않거나 접근할 수 없는 여행입니다';
  end if;

  perform 1
     from harupin.days
    where trip_id = p_trip_id
    order by id
      for update;

  select count(*), max(date) into v_old_count, v_old_end
    from harupin.days
   where trip_id = p_trip_id;

  if v_new_count < 1 then
    raise exception '종료일이 시작일보다 빠릅니다';
  end if;

  if exists (
    select 1
      from harupin.places pl
      join harupin.days d on d.id = pl.day_id
     where d.trip_id = p_trip_id
       and d.day_number > v_new_count
  ) then
    raise exception '장소가 있는 일차는 기간에서 뺄 수 없습니다';
  end if;

  delete from harupin.days
   where trip_id = p_trip_id
     and day_number > v_new_count;

  -- 기간 상한·종료일 순서·길이 제한은 trips 의 CHECK 가 막는다.
  update harupin.trips
     set title = p_title,
         start_date = p_start_date,
         end_date = p_end_date,
         region = p_region
   where id = p_trip_id;

  update harupin.days
     set date = greatest(v_old_end, p_end_date) + day_number
   where trip_id = p_trip_id;

  update harupin.days
     set date = p_start_date + (day_number - 1)
   where trip_id = p_trip_id;

  insert into harupin.days (trip_id, user_id, date, day_number)
  select p_trip_id, v_user, p_start_date + (n - 1), n
    from generate_series(least(v_old_count, v_new_count) + 1, v_new_count) as n;

  return p_trip_id;
end;
$$;

revoke execute on function harupin.update_trip(uuid, text, date, date, text) from public;
grant execute on function harupin.update_trip(uuid, text, date, date, text) to authenticated;
