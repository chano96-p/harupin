/**
 * "use server" 모듈은 async 함수만 export 할 수 있어 상수를 따로 둔다.
 * DB 의 trips_duration_limit 제약과 같은 값이어야 한다.
 */
export const MAX_TRIP_DAYS = 366;
