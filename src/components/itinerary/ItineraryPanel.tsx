"use client";

import type { Ref } from "react";

import { CategoryFilter } from "@/components/itinerary/CategoryFilter";
import { DayTabs } from "@/components/itinerary/DayTabs";
import { EmptyDay, FilteredEmpty } from "@/components/itinerary/EmptyStates";
import { useSheetDrag } from "@/components/itinerary/hooks/useSheetDrag";
import { PlaceList } from "@/components/itinerary/PlaceList";
import { Plus } from "@/components/ui/icons";
import { formatDayDate } from "@/lib/trips/format";
import type { Day, ShownPlace } from "@/lib/trips/types";
import type { SheetSnap } from "@/lib/ui/sheet";

/**
 * Day 탭 + 그 Day 의 장소 리스트.
 * 모바일은 지도 위 바텀시트(1b), lg 부터는 좌측 고정 패널(1a).
 * 모바일 시트 높이는 끌어서 바꾸고, 놓으면 lib/ui/sheet 의 단계 중 하나에 붙는다.
 */
export function ItineraryPanel({
  days,
  activeDay,
  shownPlaces,
  offCategories,
  onToggleCategory,
  onClearFilter,
  onSelectDay,
  focusedId,
  onFocusPlace,
  snap,
  onSnapChange,
  headRef,
  headHeight,
  onAddPlace,
  onDeletePlace,
  onReorderPlaces,
  onMovedPlace,
}: {
  days: Day[];
  activeDay: Day;
  /** activeDay 에서 카테고리 필터를 거친 장소. 목록·드래그는 이것만 다룬다. */
  shownPlaces: ShownPlace[];
  offCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearFilter: () => void;
  onSelectDay: (dayId: string) => void;
  focusedId: string | null;
  onFocusPlace: (placeId: string | null) => void;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** 시트 머리. TripEditor 가 높이를 재서 headHeight 로 돌려준다(peek 하한·지도 여백). */
  headRef: Ref<HTMLDivElement>;
  headHeight: number;
  onAddPlace: () => void;
  onDeletePlace: (placeId: string) => void;
  onReorderPlaces: (placeIds: string[]) => void;
  /** 다른 Day 로 옮기기가 저장된 뒤. 그 Day 로 탭을 옮겨 펼친 카드를 계속 보여준다. */
  onMovedPlace: (dayId: string, placeName: string) => void;
}) {
  const filtering = offCategories.length > 0;
  const { sheetRef, sheetHeight, dragging, toggle, dragHandlers } =
    useSheetDrag({ snap, onSnapChange, minHeight: headHeight });

  return (
    <section
      ref={sheetRef}
      style={{ "--sheet-h": sheetHeight } as React.CSSProperties}
      className={`absolute inset-x-0 bottom-0 flex h-(--sheet-h) flex-col overflow-hidden rounded-t-[22px] border-t border-line bg-canvas shadow-[0_-8px_28px_-6px_rgb(49_37_28/0.12)] ${dragging ? "" : "transition-[height] duration-200"} lg:static lg:h-auto lg:overflow-visible lg:w-[42%] lg:max-w-130 lg:flex-none lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:transition-none`}
    >
      {/* 시트 머리(손잡이·탭·필터)를 세로로 끌면 시트 높이가 바뀐다. 가로 스크롤은 그대로 둔다. */}
      <div
        ref={headRef}
        {...dragHandlers}
        className="flex flex-none touch-pan-x flex-col lg:touch-auto"
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={snap === "full"}
          aria-label={snap === "full" ? "목록 줄이기" : "목록 펼치기"}
          className="flex h-7 flex-none cursor-grab items-center justify-center active:cursor-grabbing lg:hidden"
        >
          <span className="h-1 w-10 rounded-pill bg-line-strong" />
        </button>

        <div className="flex flex-none flex-col gap-4 pb-4 lg:pt-6">
          <DayTabs
            days={days}
            activeDayId={activeDay.id}
            onSelect={onSelectDay}
          />

          <div className="hidden items-baseline gap-2 px-6 lg:flex">
            <span className="text-[18px] font-bold tracking-[-0.02em] text-ink">
              {formatDayDate(activeDay.date)}
            </span>
            <span className="text-[12.5px] text-ink-soft">
              {filtering
                ? `${shownPlaces.length} / ${activeDay.places.length}곳`
                : `${activeDay.places.length}곳`}
            </span>
          </div>

          <CategoryFilter
            offCategories={offCategories}
            hiddenCount={activeDay.places.length - shownPlaces.length}
            onToggle={onToggleCategory}
            onClear={onClearFilter}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-6 lg:px-6 lg:pt-1 lg:pb-6">
        {activeDay.places.length === 0 ? (
          <EmptyDay onSearch={onAddPlace} />
        ) : (
          <>
            {shownPlaces.length === 0 ? (
              <FilteredEmpty onClear={onClearFilter} />
            ) : (
              <PlaceList
                shownPlaces={shownPlaces}
                days={days}
                currentDayId={activeDay.id}
                focusedId={focusedId}
                onFocusPlace={onFocusPlace}
                onDelete={onDeletePlace}
                onReorder={onReorderPlaces}
                onMoved={onMovedPlace}
              />
            )}

            <button
              type="button"
              onClick={onAddPlace}
              className="flex h-12 flex-none items-center justify-center gap-1.5 rounded-card border border-dashed border-dashed-line text-[13.5px] font-bold text-brand-deep transition-colors hover:border-brand hover:bg-brand-tint"
            >
              <Plus className="size-4" />이 날에 장소 추가
            </button>
          </>
        )}
      </div>
    </section>
  );
}
