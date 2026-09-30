/**
 * 모바일 일정 시트의 높이 단계. 지도 영역 높이에 대한 비율이다.
 * peek: 탭·필터만 보이게 접음 (장소를 고르는 동안 지도를 넓게)
 * half: 기본 / full: 목록 위주
 */
export const SHEET_SNAPS = { peek: 0.22, half: 0.5, full: 0.88 } as const;

export type SheetSnap = keyof typeof SHEET_SNAPS;

export const SHEET_ORDER: SheetSnap[] = ["peek", "half", "full"];

/**
 * 시트의 현재 단계와 최소 높이. minHeight 는 시트 머리(손잡이·탭·필터)의 실제 높이다.
 * 비율만 쓰면 낮은 화면에서 peek 가 머리보다 작아져 필터 줄이 잘린다.
 */
export type SheetState = { snap: SheetSnap; minHeight: number };

/** 지도 영역 높이가 areaHeight 일 때 시트가 차지하는 높이(px). */
export function sheetHeightPx(
  snap: SheetSnap,
  areaHeight: number,
  minHeight: number,
) {
  return Math.max(SHEET_SNAPS[snap] * areaHeight, minHeight);
}
