"use client";

import { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useSwipeReveal } from "@/components/itinerary/hooks/useSwipeReveal";
import { PlaceDetail } from "@/components/itinerary/PlaceDetail";
import { ChevronUp } from "@/components/ui/icons";
import { categoryLabel, findCategory } from "@/lib/places/categories";
import type { Day, ShownPlace } from "@/lib/trips/types";

/**
 * 누르면 제자리에서 펼쳐져 상세를 보여준다(데스크톱 3d, 모바일 3h).
 * 삭제: 데스크톱은 카드의 × 버튼(1a), 모바일은 왼쪽으로 밀어 여는 삭제 버튼(3j).
 * 순서 변경: 오른쪽 끝 핸들(점 6개)을 잡고 끈다. 카드 전체가 아니라 핸들만 끌리게 해서
 * 모바일의 세로 스크롤·스와이프 삭제와 겹치지 않는다.
 * 펼친 동안에는 핸들과 스와이프를 끈다. 상세 안에 삭제 버튼이 따로 있다.
 */
export function PlaceCard({
  place,
  days,
  currentDayId,
  onMoved,
  expanded,
  onToggleExpanded,
  swiped,
  onSwipedChange,
  onDelete,
}: {
  place: ShownPlace;
  days: Day[];
  currentDayId: string;
  onMoved: (dayId: string, placeName: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  swiped: boolean;
  onSwipedChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: place.id,
    attributes: { roleDescription: "순서 변경 가능한 장소" },
  });

  const cardRef = useRef<HTMLDivElement>(null);
  // 펼치기 버튼은 펼치든 접든 남아 있는 요소라, "상세 닫기" 뒤 포커스를 돌려줄 곳으로 쓴다.
  const toggleRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipeReveal({
    open: swiped,
    enabled: !expanded,
    onOpenChange: onSwipedChange,
  });

  // 펼친 카드가 목록(특히 모바일의 낮은 시트) 밖으로 잘리지 않게 보이는 곳으로 당긴다.
  useEffect(() => {
    if (expanded) {
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [expanded]);

  const cat = findCategory(place.category);
  const tint = cat?.tint ?? "bg-lodging-tint";
  const deep = cat?.deep ?? "text-lodging-deep";
  const dot = cat?.dot ?? "bg-lodging";
  const { offset } = swipe;

  function handleToggle() {
    // 스와이프로 열린 상태에서 누르면 펼치기 대신 삭제 버튼을 닫는다.
    if (swiped) {
      onSwipedChange(false);
      return;
    }
    onToggleExpanded();
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative overflow-hidden rounded-card ${isDragging ? "z-10 shadow-[0_4px_16px_rgb(31_31_29/0.12)]" : ""}`}
    >
      {/* 스와이프 제스처 전용 버튼. 키보드·스크린리더는 카드 안의 삭제 버튼을 쓴다. */}
      <button
        type="button"
        onClick={onDelete}
        aria-hidden
        tabIndex={-1}
        className={`absolute inset-0 flex justify-end bg-food text-white lg:hidden ${offset === 0 ? "invisible" : ""}`}
      >
        <span className="flex w-18 flex-col items-center justify-center gap-0.75">
          <span aria-hidden className="text-[17px] leading-none">
            ×
          </span>
          <span className="text-[12px] font-semibold">삭제</span>
        </span>
      </button>

      {/* 밀어낼 때 카드를 translate 하지 않고 폭을 줄인다(시안 3j).
          translate 하면 왼쪽 보더와 모서리가 li 의 overflow 에 잘린다. */}
      <div
        ref={cardRef}
        {...swipe.handlers}
        onClick={() => swiped && onSwipedChange(false)}
        style={{ width: `calc(100% + ${offset}px)` }}
        className={`relative flex touch-pan-y flex-col rounded-card border bg-surface ${expanded ? "gap-3.5 border-ink p-3.5 lg:p-3.75" : "border-line p-3.25 lg:p-3.5"} ${swipe.dragging ? "" : "transition-[width] duration-200"}`}
      >
        <div
          className={`flex gap-2.75 lg:gap-3 ${expanded ? "items-start" : "items-center lg:items-start"}`}
        >
          <button
            ref={toggleRef}
            type="button"
            onClick={handleToggle}
            aria-expanded={expanded}
            className={`flex min-w-0 flex-1 gap-2.75 text-left lg:gap-3 ${expanded ? "items-start" : "items-center lg:items-start"}`}
          >
            <span
              className={`grid flex-none place-items-center rounded-pill font-semibold ${
                expanded
                  ? `size-7 text-[13.5px] text-white ${dot}`
                  : `size-6.5 text-[13px] ${tint} ${deep}`
              }`}
            >
              {place.order}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 lg:gap-1.5">
              <span
                className={`font-semibold tracking-[-0.01em] text-ink ${expanded ? "text-[16px] wrap-break-word" : "truncate text-[14.5px] lg:text-[15px]"}`}
              >
                {place.name}
              </span>
              {expanded ? null : (
                <span className="text-[12px] text-ink-soft lg:hidden">
                  {categoryLabel(place.category)}
                </span>
              )}
              <span
                className={`self-start rounded-pill px-2 py-0.75 text-[11px] font-semibold ${tint} ${deep} ${expanded ? "inline" : "hidden lg:inline"}`}
              >
                {categoryLabel(place.category)}
              </span>
            </span>
          </button>

          {expanded ? (
            <button
              type="button"
              onClick={() => {
                onToggleExpanded();
                toggleRef.current?.focus();
              }}
              aria-label={`${place.name} 상세 닫기`}
              className="grid size-7.5 flex-none place-items-center rounded-pill text-ink-mute transition-colors hover:bg-surface-hover lg:flex lg:size-auto lg:gap-1 lg:px-2 lg:py-1 lg:text-[12px]"
            >
              <span aria-hidden className="hidden lg:inline">
                닫기
              </span>
              <ChevronUp className="size-3.5 lg:size-3" />
            </button>
          ) : (
            <>
              {/* 모바일에서는 보이지 않지만 키보드·스크린리더로 닿는다. 키보드 포커스 시에만 드러난다.
                  sr-only + lg:not-sr-only 로 풀면 not-sr-only 의 width/height:auto 가 size-5.5 뒤에
                  생성돼 크기를 덮어쓴다. 숨길 조건 쪽을 좁혀서 되돌릴 일을 없앤다. */}
              <button
                type="button"
                onClick={onDelete}
                aria-label={`${place.name} 삭제`}
                className="grid size-5.5 flex-none place-items-center rounded-pill text-[15px] text-ink-mute transition-colors hover:bg-surface-hover hover:text-food max-lg:not-focus-visible:sr-only"
              >
                <span aria-hidden>×</span>
              </button>
              {/* touch-none: 핸들 위에서는 브라우저 스크롤 대신 드래그가 포인터를 받는다.
                  카드의 스와이프 판정이 같은 포인터를 잡지 않도록 전파를 끊는다. */}
              <button
                type="button"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                onPointerDown={(e) => {
                  listeners?.onPointerDown?.(e);
                  e.stopPropagation();
                }}
                aria-label={`${place.name} 순서 변경`}
                className="-m-2 grid flex-none cursor-grab touch-none grid-cols-[repeat(2,3px)] gap-1 p-2 active:cursor-grabbing lg:-mt-0.5"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <span
                    key={i}
                    className="size-0.75 rounded-pill bg-line-strong"
                  />
                ))}
              </button>
            </>
          )}
        </div>

        {expanded ? (
          <PlaceDetail
            place={place}
            days={days}
            currentDayId={currentDayId}
            onMoved={onMoved}
            onDelete={onDelete}
          />
        ) : null}
      </div>
    </li>
  );
}
