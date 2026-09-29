import { useRef, useState } from "react";

import { isDesktop } from "@/lib/ui/breakpoints";

export const SWIPE_REVEAL = 72;
const SWIPE_SLOP = 6;

/**
 * 모바일 카드를 왼쪽으로 밀어 뒤의 버튼을 드러낸다(시안 3j).
 * 마우스·데스크톱에서는 동작하지 않는다. 세로로 먼저 움직이면 스크롤에 양보한다.
 *
 * offset: 카드를 줄일 폭(0 ~ -SWIPE_REVEAL). dragging 동안은 손가락을 그대로 따라가고,
 * 놓으면 반 이상 밀었는지로 열림/닫힘을 정해 onOpenChange 로 알린다.
 */
export function useSwipeReveal({
  open,
  enabled,
  onOpenChange,
}: {
  open: boolean;
  enabled: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [dragX, setDragX] = useState<number | null>(null);
  // 가로/세로 판정 전에는 axis 가 null 이다. 세로로 판정되면 스크롤에 양보한다.
  // 손을 뗄 때는 state 가 아니라 여기 기록한 마지막 위치로 판정한다.
  // 빠르게 밀면 마지막 pointermove 의 setDragX 가 렌더되기 전에 pointerup 이 온다.
  const gestureRef = useRef<{
    x: number;
    y: number;
    base: number;
    axis: "x" | "y" | null;
    lastX: number;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (!enabled || e.pointerType === "mouse" || isDesktop()) return;
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      base: open ? -SWIPE_REVEAL : 0,
      axis: null,
      lastX: open ? -SWIPE_REVEAL : 0,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const g = gestureRef.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.axis === null) {
      if (Math.abs(dx) < SWIPE_SLOP && Math.abs(dy) < SWIPE_SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "x") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (g.axis !== "x") return;
    g.lastX = Math.min(0, Math.max(-SWIPE_REVEAL, g.base + dx));
    setDragX(g.lastX);
  }

  function onPointerEnd() {
    const g = gestureRef.current;
    gestureRef.current = null;
    setDragX(null);
    if (g?.axis !== "x") return;
    onOpenChange(g.lastX < -SWIPE_REVEAL / 2);
  }

  return {
    offset: dragX ?? (open ? -SWIPE_REVEAL : 0),
    dragging: dragX !== null,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}
