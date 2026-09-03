-- 장소 검색 프록시의 서버측 레이트리밋.
--
-- Vercel 서버리스는 요청마다 다른 인스턴스로 뜰 수 있어 메모리 카운터가 안 맞는다.
-- Redis 같은 새 서비스를 추가하는 대신 이미 신뢰하는 Postgres 에 고정 윈도우
-- 카운터를 둔다. (user_id, bucket, window_start) 를 PK 로 잡아 on conflict 의
-- 행 잠금으로 동시 요청도 원자적으로 처리된다.
--
-- 클라이언트가 이 테이블에 직접 닿을 이유가 없다. RLS 를 켜고 정책은 두지 않으며,
-- 접근은 오직 아래 security definer 함수를 통해서만 허용한다.
create table harupin.rate_limit_counters (
  user_id      uuid not null,
  bucket       text not null,
  window_start timestamptz not null,
  count        int not null default 0,
  primary key (user_id, bucket, window_start)
);

alter table harupin.rate_limit_counters enable row level security;

-- security definer 로 테이블 소유자 권한으로 돈다. auth.uid() 로 직접 스코핑하므로
-- 남의 카운터를 건드릴 수 없다. search_path 를 고정해 주입을 막는다.
--
-- 반환값 true = 허용, false = 한도 초과. 호출자가 429 로 매핑한다.
create function harupin.check_rate_limit(
  p_bucket         text,
  p_limit          int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = harupin, pg_catalog
as $$
declare
  v_user   uuid := auth.uid();
  v_window timestamptz;
  v_count  int;
begin
  if v_user is null then
    raise exception 'check_rate_limit 은 로그인 세션에서만 호출할 수 있다';
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  -- 이 사용자·버킷의 지난 창만 지운다. 매 호출이 자기 몫을 청소하므로
  -- 별도 배치 없이 테이블이 무한정 자라지 않는다.
  delete from harupin.rate_limit_counters
   where user_id = v_user
     and bucket = p_bucket
     and window_start < now() - interval '1 hour';

  insert into harupin.rate_limit_counters (user_id, bucket, window_start, count)
  values (v_user, p_bucket, v_window, 1)
  on conflict (user_id, bucket, window_start)
  do update set count = harupin.rate_limit_counters.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke execute on function harupin.check_rate_limit(text, int, int) from public;
grant execute on function harupin.check_rate_limit(text, int, int) to authenticated;
