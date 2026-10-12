-- 여행 대표 사진 (홈 카드 커버).
--
-- 파일은 Storage 버킷 harupin-trip-covers 에 "{user_id}/{trip_id}/{무작위 uuid}.{webp|jpg}" 로 둔다.
-- 브라우저가 줄인 사진을 직접 올리고, trips.cover_path 에 경로만 저장한다.
--
-- 버킷은 private 이다. 화면은 서버가 그때그때 발급한 서명 URL(만료 있음)로만 사진을 보여준다.
--   - 개인 여행 사진이라 본인 계정에서만 보이는 게 맞다 (여행 데이터와 같은 기준).
--   - public 이면 auth.users 를 공유하는 기존 앱 계정이 이 버킷을 무제한 공개 호스팅으로 쓸 수 있고,
--     공개 URL 에 user_id·trip_id 가 그대로 드러난다 (share_id 를 따로 둔 이유와 어긋난다).
--   - 사진을 지우면 서명이 만료되는 대로 더는 열리지 않는다.
-- 서명 URL 에도 경로(ID)가 들어 있으므로, 3단계 공유·OG 이미지는 Storage 주소를 내주지 말고
-- 서버 경로(/share/{shareId}/cover 등)로 프록시할 것.
-- 대가: 화면마다 서명 요청 1번(일괄), 서명이 매번 바뀌어 브라우저 캐시가 덜 먹는다.
-- 기존 앱과 같은 프로젝트를 쓰므로 버킷 이름에 harupin 을 붙여 구분한다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'harupin-trip-covers',
  'harupin-trip-covers',
  false,
  2097152, -- 2MB. 브라우저에서 1200px 로 줄이므로 보통 수백 KB 다.
  array['image/webp', 'image/jpeg']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 올리기: 우리가 만드는 형식의 이름이고, 첫 폴더가 본인, 둘째 폴더가 본인 여행일 때만.
-- 첫 폴더만 보면 하루핀 여행이 없는 계정도 아무 이름으로 올릴 수 있다.
-- 덮어쓰기(update)는 쓰지 않으므로(매번 새 uuid) 정책을 두지 않는다.
create policy harupin_trip_covers_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'harupin-trip-covers'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1
        from harupin.trips t
       where t.id::text = (storage.foldername(name))[2]
         and t.user_id = (select auth.uid())
    )
  );

-- 나열·서명 URL 발급·지우기: 본인 폴더만. 여행이 지워진 뒤에도 그 폴더를 정리할 수 있도록
-- 여행 존재 여부는 보지 않는다.
create policy harupin_trip_covers_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'harupin-trip-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy harupin_trip_covers_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'harupin-trip-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- 경로가 이 여행·이 사용자의 폴더를 가리키는지 DB 가 강제한다.
-- 앱(setTripCover)도 같은 검사를 하지만, 직접 update 로 남의 파일 경로를 걸어두는 것을 막는다.
alter table harupin.trips
  add column cover_path text,
  add constraint trips_cover_path_format check (
    cover_path is null
    or (
      cover_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
      and split_part(cover_path, '/', 1) = user_id::text
      and split_part(cover_path, '/', 2) = id::text
    )
  );

-- 홈 카드가 커버를 그리려면 목록에 경로가 있어야 한다. 반환 열이 바뀌어 replace 가 안 되므로
-- 지우고 다시 만든다 (본문은 20260902000000_create_trip.sql 과 같고 cover_path 만 늘었다).
drop function harupin.list_trips();

create function harupin.list_trips()
returns table (
  id          uuid,
  title       text,
  start_date  date,
  end_date    date,
  cover_path  text,
  place_count bigint,
  categories  text[]
)
language sql
stable
set search_path = harupin, pg_catalog
as $$
  select t.id, t.title, t.start_date, t.end_date, t.cover_path,
         count(p.id),
         coalesce(array_agg(distinct p.category) filter (where p.id is not null), '{}')
  from harupin.trips t
  left join harupin.places p on p.trip_id = t.id
  group by t.id, t.title, t.start_date, t.end_date, t.cover_path, t.created_at
  order by t.created_at desc
$$;

revoke execute on function harupin.list_trips() from public;
grant execute on function harupin.list_trips() to authenticated;
