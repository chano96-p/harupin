/**
 * 모바일 일정 시트의 높이 단계. 지도 영역 높이에 대한 비율이다.
 * peek: 탭·필터만 보이게 접음 (장소를 고르는 동안 지도를 넓게)
 * half: 기본 / full: 목록 위주
 */
export const SHEET_SNAPS = { peek: 0.22, half: 0.5, full: 0.88 } as const;

export type SheetSnap = keyof typeof SHEET_SNAPS;

export const SHEET_ORDER: SheetSnap[] = ["peek", "half", "full"];

/**
 * 시트를 끝까지 펼쳐도 지도에 남기는 높이(px). 지도 위쪽의 검색 줄(위 여백 포함 62px)과
 * 아래쪽 Google 로고·저작권 표기(약 22px)가 겹치지 않아야 한다. 로고를 가리면 Maps Platform 정책 위반이다.
 * full(88%)만으로는 낮은 화면(영역 약 684px 미만)에서 지도가 이보다 작아진다.
 */
export const MAP_MIN_HEIGHT = 96;

/**
 * 지도 영역 높이가 areaHeight 일 때 시트가 차지하는 높이(px).
 * minHeight 는 시트 머리(손잡이·탭·필터)의 실제 높이다.
 * 비율만 쓰면 낮은 화면에서 peek 가 머리보다 작아져 필터 줄이 잘린다.
 * 둘이 부딪히는 아주 낮은 화면(가로 모드 등)에서는 지도 최소 높이가 이긴다.
 * useSheetDrag 의 CSS 높이(sheetHeight)와 같은 식이어야 한다.
 */
export function sheetHeightPx(
  snap: SheetSnap,
  areaHeight: number,
  minHeight: number,
) {
  return Math.min(
    Math.max(SHEET_SNAPS[snap] * areaHeight, minHeight),
    areaHeight - MAP_MIN_HEIGHT,
  );
}
