/**
 * 하루핀 테이블은 public 이 아니라 전용 스키마에 있다(계획서 §3).
 * 지정하지 않으면 PostgREST 가 public 을 보고 PGRST205 로 실패한다.
 */
export const DB_SCHEMA = "harupin";
