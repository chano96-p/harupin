/**
 * 검색 프록시 레이트리밋. 값 튜닝이 필요해지면 여기만 고치면 된다.
 *
 * 자동완성은 타이핑마다(디바운스 300ms) 불리므로 여유를 둔다.
 * "제주 봄여행" 처럼 10자를 천천히 치면 8~10회가 자연스러운 최대치라
 * 60초에 40회면 실사용 타이핑을 막지 않으면서 스크립트성 남용은 확실히 막는다.
 * 상세조회는 실제 선택할 때만 불리므로 훨씬 적게 잡는다.
 */
export const AUTOCOMPLETE_LIMIT = {
  bucket: "places_autocomplete",
  limit: 40,
  windowSeconds: 60,
};
export const DETAILS_LIMIT = {
  bucket: "places_details",
  limit: 20,
  windowSeconds: 60,
};

export const MAX_INPUT_LENGTH = 200;
