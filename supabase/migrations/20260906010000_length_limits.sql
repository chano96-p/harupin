-- 문자열 길이 상한.
--
-- Server Action 과 RPC 는 공개 HTTP 엔드포인트다. 클라이언트의 maxLength 는
-- hidden input 을 우회한 직접 호출로 그냥 뚫린다 (실측: 장소 이름 50만 자,
-- 여행 제목 30만 자가 그대로 저장됐다).
-- 마지막 방어선은 DB 여야 한다.
--
-- 값은 실제 데이터 상한에 여유를 둔 수치다.
--   - 장소 이름: Google displayName 이 보통 100자 미만
--   - Google place ID: 보통 30~250자
--   - 여행 제목: UI 가 이미 100자로 잡고 있다
-- ⚠️ add constraint ... check 는 기존 행을 즉시 검증한다. 상한을 넘는 행이
-- 하나라도 있으면 이 마이그레이션이 실패한다. 적용 전에 확인할 것:
--
--   select count(*) from harupin.places where length(name) > 200;
--   select count(*) from harupin.places where length(google_place_id) > 512;
--   select count(*) from harupin.places where length(memo) > 2000;
--   select count(*) from harupin.trips  where length(title) > 100;
--   select count(*) from harupin.trips  where length(region) > 100;
--
-- 전부 0 이어야 한다. 0 이 아니면 해당 행을 먼저 정리해야 하며, 그 판단은
-- 사용자 데이터라 사람이 해야 한다(자동 삭제·절단하지 않는다).
--
-- 이 파일의 alter 는 두 문장이다. 트랜잭션 없이 실행하면 앞 문장이 실패해도
-- 뒤 문장이 적용되어 절반만 걸린 상태가 된다(실측). 반드시 begin/commit 안에서
-- 실행할 것 — 감싸면 실패 시 전부 롤백된다(실측).
alter table harupin.places
  add constraint places_name_length check (length(name) <= 200),
  add constraint places_google_place_id_length
    check (google_place_id is null or length(google_place_id) <= 512),
  add constraint places_memo_length check (memo is null or length(memo) <= 2000);

alter table harupin.trips
  add constraint trips_title_length check (length(title) <= 100),
  add constraint trips_region_length check (region is null or length(region) <= 100);
