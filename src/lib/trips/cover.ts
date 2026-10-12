/**
 * 여행 대표 사진. 버킷·크기 제한은 20261012000000_trip_cover.sql 과 같은 값이어야 한다.
 * 경로 형식 "{user_id}/{trip_id}/{uuid}.{webp|jpg}" 는 DB 의 trips_cover_path_format CHECK 와 같다.
 */
export const COVER_BUCKET = "harupin-trip-covers";
export const COVER_MAX_BYTES = 2 * 1024 * 1024;
/** 긴 변 기준. 카드(약 300px)를 2배 밀도로 그려도 남는다. */
export const COVER_MAX_EDGE = 1200;

export type CoverExt = "webp" | "jpg";

export function buildCoverPath(userId: string, tripId: string, ext: CoverExt) {
  return `${userId}/${tripId}/${crypto.randomUUID()}.${ext}`;
}

const UUID = "[0-9a-f-]{36}";

/** 이 사용자의 이 여행 폴더에 있는, 우리가 만든 형식의 경로인지. */
export function isCoverPathFor(path: string, userId: string, tripId: string) {
  return (
    new RegExp(`^${UUID}/${UUID}/${UUID}\\.(webp|jpg)$`).test(path) &&
    path.startsWith(`${userId}/${tripId}/`)
  );
}

/**
 * 서명 URL 유효 시간. 화면을 그릴 때마다 새로 받으므로 길 필요는 없고,
 * 페이지를 오래 열어둔 채 다시 그려도(지도 이동 등) 이미 받은 이미지는 그대로 남는다.
 */
export const COVER_URL_TTL_SECONDS = 60 * 60;
