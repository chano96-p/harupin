import { useRef, useState } from "react";

import { isDesktop } from "@/lib/ui/breakpoints";
import {
  SHEET_ORDER,
  SHEET_SNAPS,
  sheetHeightPx,
  type SheetSnap,
} from "@/lib/ui/sheet";

const DRAG_SLOP = 6;
// 이 속도(px/ms)보다 빠르게 튕기면 가까운 단계가 아니라 튕긴 방향의 다음 단계로 간다.
const FLICK_VELOCITY = 0.5;
// 이보다 오래 멈췄다 놓으면 튕긴 게 아니라 위치를 맞추고 놓은 것이다.
const FLICK_MAX_PAUSE_MS = 100;
// 끌기가 끝난 직후 따라오는 click(손잡이 탭 처리)을 무시하는 시간.
const CLICK_AFTER_DRAG_MS = 300;

/**
 * 모바일 일정 시트를 손가락으로 끌어 높이를 바꾼다. 놓으면 SHEET_SNAPS 중 한 단계에 붙는다.
 *
 * 잡는 곳은 시트 머리(손잡이·탭·필터)다. 세로로 먼저 움직일 때만 시트를 끌고,
 * 가로는 브라우저 스크롤에 맡긴다(touch-action: pan-x).
 * touch-action 은 스크롤 컨테이너에서 끊겨 자식에게 이어지지 않는다. 머리 안의 가로 스크롤 줄
 * (DayTabs·CategoryFilter)에도 직접 pan-x 를 줘야 그 위에서 시작한 세로 끌기를 브라우저가 가져가지 않는다.
 * 목록 영역은 세로 스크롤과 겹치므로 잡지 않는다.
 *
 * minHeight: 시트 머리 높이. peek 와 끌기 하한이 이보다 작아지지 않는다.
 */
export function useSheetDrag({
  snap,
  onSnapChange,
  minHeight,
}: {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  minHeight: number;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  // 마지막 끌기가 끝난 시각. 키보드·스크린리더는 pointerdown 없이 click 만 보내므로
  // "끌었음" 표시를 남겨두면 그 click 을 잘못 무시한다. 시각으로 직후의 click 만 거른다.
  const dragEndedAtRef = useRef(-Infinity);
  const gestureRef = useRef<{
    x: number;
    y: number;
    startHeight: number;
    areaHeight: number;
    axis: "x" | "y" | null;
    lastHeight: number;
    lastY: number;
    lastTime: number;
    velocity: number;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    const sheet = sheetRef.current;
    const area = sheet?.parentElement;
    if (!sheet || !area || isDesktop()) return;
    const height = sheet.getBoundingClientRect().height;
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      startHeight: height,
      areaHeight: area.clientHeight,
      axis: null,
      lastHeight: height,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const g = gestureRef.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.axis === null) {
      if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return;
      g.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
      if (g.axis === "y") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (g.axis !== "y") return;

    const min = sheetHeightPx("peek", g.areaHeight, minHeight);
    const max = sheetHeightPx("full", g.areaHeight, minHeight);
    const height = Math.min(max, Math.max(min, g.startHeight - dy));
    const elapsed = e.timeStamp - g.lastTime;
    // 위로 끌면 양수. 같은 시각에 온 이벤트는 0으로 나누게 되므로 건너뛴다.
    if (elapsed > 0) g.velocity = (g.lastY - e.clientY) / elapsed;
    g.lastY = e.clientY;
    g.lastTime = e.timeStamp;
    g.lastHeight = height;
    setDragHeight(height);
  }

  function onPointerUp(e: React.PointerEvent<HTMLElement>) {
    const g = gestureRef.current;
    gestureRef.current = null;
    setDragHeight(null);
    if (g?.axis !== "y") return;
    dragEndedAtRef.current = e.timeStamp;

    const heights = SHEET_ORDER.map((s) => ({
      snap: s,
      px: sheetHeightPx(s, g.areaHeight, minHeight),
    }));
    const nearest = heights.reduce((a, b) =>
      Math.abs(b.px - g.lastHeight) < Math.abs(a.px - g.lastHeight) ? b : a,
    ).snap;

    const velocity =
      e.timeStamp - g.lastTime > FLICK_MAX_PAUSE_MS ? 0 : g.velocity;
    if (Math.abs(velocity) < FLICK_VELOCITY) {
      onSnapChange(nearest);
      return;
    }
    const next =
      velocity > 0
        ? heights.find((h) => h.px > g.lastHeight)
        : [...heights].reverse().find((h) => h.px < g.lastHeight);
    onSnapChange(next?.snap ?? nearest);
  }

  // 브라우저가 제스처를 가져간 것(스크롤 등)은 사용자의 놓기가 아니다. 원래 단계로 돌아간다.
  function onPointerCancel() {
    gestureRef.current = null;
    setDragHeight(null);
  }

  /** 손잡이 탭: 접힘 → 기본 → 전체 → 기본. 방금 끌었다면 무시한다. */
  function toggle(e: React.MouseEvent<HTMLElement>) {
    if (e.timeStamp - dragEndedAtRef.current < CLICK_AFTER_DRAG_MS) return;
    onSnapChange(snap === "full" ? "half" : snap === "half" ? "full" : "half");
  }

  return {
    sheetRef,
    // 데스크톱(lg:h-auto)을 inline height 가 덮지 않도록 CSS 변수로 넘긴다.
    sheetHeight:
      dragHeight !== null
        ? `${dragHeight}px`
        : `max(${SHEET_SNAPS[snap] * 100}%, ${minHeight}px)`,
    dragging: dragHeight !== null,
    toggle,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
