// Tailwind 의 lg(64rem)와 같은 값이어야 한다. JS 로 데스크톱/모바일 동작을 가를 때 쓴다.
export const DESKTOP_QUERY = "(min-width: 64rem)";

export function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}
