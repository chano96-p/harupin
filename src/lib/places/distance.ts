import type { LatLng } from "@/lib/map/types";

const EARTH_RADIUS_M = 6_371_000;

/**
 * 두 좌표 사이의 직선(대권) 거리, 미터.
 * 실제 이동 거리가 아니다 — Google 경로 API 는 국내 자동차·도보 경로를 지원하지 않아
 * 1차는 비용 없이 좌표만으로 계산한다. 화면에는 반드시 "직선" 이라고 밝힌다.
 */
export function straightDistance(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** 350m · 1.2km · 23km · 1,204km. 10m 미만은 같은 곳으로 본다. */
export function formatDistance(meters: number): string {
  if (meters < 10) return "바로 옆";
  // 경계는 반올림한 뒤의 값으로 가른다. 995m 가 "1000m", 9.96km 가 "10.0km" 로 나오지 않게.
  const tens = Math.round(meters / 10) * 10;
  if (tens < 1000) return `${tens}m`;
  const tenthKm = Math.round(meters / 100) / 10;
  if (tenthKm < 10) return `${tenthKm.toFixed(1)}km`;
  return `${Math.round(meters / 1000).toLocaleString("ko-KR")}km`;
}
