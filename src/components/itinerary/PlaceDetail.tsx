"use client";

import { useEffect, useRef, useState } from "react";

import { MemoForm } from "@/components/itinerary/MemoForm";
import { MoveForm } from "@/components/itinerary/MoveForm";
import type { Day, ShownPlace } from "@/lib/trips/types";

/**
 * 펼친 카드의 본문. 메모와 일차 이동.
 * 주소·영업시간(시안 3d)은 Place Details 상위 등급 호출 + place_cache 가 필요해 2단계 캐시 작업과 함께 넣는다.
 */
export function PlaceDetail({
  place,
  days,
  currentDayId,
  onMoved,
  onDelete,
}: {
  place: ShownPlace;
  days: Day[];
  currentDayId: string;
  onMoved: (dayId: string, placeName: string) => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<"view" | "memo" | "move">("view");
  // 폼을 닫으면(저장·취소) 그 안의 버튼이 사라져 포커스가 body 로 빠진다.
  // 폼을 연 버튼이 다시 나타나면 그리로 돌려준다.
  const memoButtonRef = useRef<HTMLButtonElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<"memo" | "move" | null>(null);

  useEffect(() => {
    if (mode !== "view" || !returnFocusRef.current) return;
    const target =
      returnFocusRef.current === "memo" ? memoButtonRef : moveButtonRef;
    returnFocusRef.current = null;
    target.current?.focus();
  }, [mode]);

  function closeForm() {
    returnFocusRef.current = mode === "view" ? null : mode;
    setMode("view");
  }

  if (mode === "memo") {
    return (
      <MemoForm
        placeId={place.id}
        initialMemo={place.memo ?? ""}
        onClose={closeForm}
      />
    );
  }

  if (mode === "move") {
    return (
      <MoveForm
        placeId={place.id}
        days={days}
        currentDayId={currentDayId}
        onMoved={(dayId) => onMoved(dayId, place.name)}
        onClose={closeForm}
      />
    );
  }

  return (
    <>
      <dl className="flex gap-2.5">
        <dt className="w-14.5 flex-none text-[12.5px] leading-normal text-ink-mute">
          메모
        </dt>
        <dd
          className={`min-w-0 flex-1 text-[13px] leading-normal wrap-break-word whitespace-pre-wrap ${place.memo ? "text-ink" : "text-ink-mute"}`}
        >
          {place.memo ?? "메모 없음"}
        </dd>
      </dl>
      <div className="flex items-center gap-2 lg:gap-2.25">
        <button
          ref={memoButtonRef}
          type="button"
          onClick={() => setMode("memo")}
          className="h-11 flex-1 rounded-control border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover lg:h-auto lg:flex-none lg:px-3 lg:py-2 lg:text-[12.5px]"
        >
          {place.memo ? "메모 수정" : "메모 추가"}
        </button>
        {days.length > 1 ? (
          <button
            ref={moveButtonRef}
            type="button"
            onClick={() => setMode("move")}
            className="h-11 flex-1 rounded-control border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover lg:h-auto lg:flex-none lg:px-3 lg:py-2 lg:text-[12.5px]"
          >
            <span className="lg:hidden">일차 이동</span>
            <span className="hidden lg:inline">다른 일차로 이동</span>
          </button>
        ) : null}
        <span aria-hidden className="hidden flex-1 lg:block" />
        <button
          type="button"
          onClick={onDelete}
          className="h-11 rounded-control px-3 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-tint lg:h-auto lg:py-2 lg:text-[12.5px]"
        >
          삭제
        </button>
      </div>
    </>
  );
}
