"use client";

import { CategoryFilter } from "@/components/itinerary/CategoryFilter";
import { DayTabs } from "@/components/itinerary/DayTabs";
import { EmptyDay, FilteredEmpty } from "@/components/itinerary/EmptyStates";
import { PlaceList } from "@/components/itinerary/PlaceList";
import { formatDayDate } from "@/lib/trips/format";
import type { Day, ShownPlace } from "@/lib/trips/types";

/**
 * Day 탭 + 그 Day 의 장소 리스트.
 * 모바일은 지도 위 바텀시트(1b), lg 부터는 좌측 고정 패널(1a).
 * 접힌 시트 높이(h-[40%])는 lib/map/config 의 MOBILE_SHEET_RATIO 와 같아야 한다.
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
  expanded,
  onToggleExpanded,
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
  expanded: boolean;
  onToggleExpanded: () => void;
  onAddPlace: () => void;
  onDeletePlace: (placeId: string) => void;
  onReorderPlaces: (placeIds: string[]) => void;
  /** 다른 Day 로 옮기기가 저장된 뒤. 그 Day 로 탭을 옮겨 펼친 카드를 계속 보여준다. */
  onMovedPlace: (dayId: string, placeName: string) => void;
}) {
  const filtering = offCategories.length > 0;

  return (
    <section
      className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[20px] border-t border-line bg-canvas shadow-[0_-2px_12px_rgb(31_31_29/0.08)] transition-[height] duration-200 ${expanded ? "h-[85%]" : "h-[40%]"} lg:static lg:h-auto lg:w-[45%] lg:flex-none lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:transition-none`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-label={expanded ? "목록 접기" : "목록 펼치기"}
        className="flex h-6 flex-none items-center justify-center lg:hidden"
      >
        <span className="h-1 w-9.5 rounded-pill bg-dashed-line" />
      </button>

      <div className="flex flex-none flex-col gap-3.5 pb-3.5 lg:pt-4.5">
        <DayTabs
          days={days}
          activeDayId={activeDay.id}
          onSelect={onSelectDay}
        />

        <div className="hidden items-baseline gap-2 px-5.5 lg:flex">
          <span className="text-[15px] font-semibold text-ink">
            {formatDayDate(activeDay.date)}
          </span>
          <span className="text-[12px] text-ink-soft">
            {filtering
              ? `${shownPlaces.length} / ${activeDay.places.length}곳`
              : `${activeDay.places.length}곳`}
          </span>
        </div>

        <CategoryFilter
          offCategories={offCategories}
          hiddenCount={activeDay.places.length - shownPlaces.length}
          onToggle={onToggleCategory}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.25 overflow-y-auto px-4 pb-6 lg:gap-2.5 lg:px-5.5 lg:pt-1 lg:pb-5.5">
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
              className="flex-none rounded-card border border-dashed border-dashed-line p-3 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink lg:p-3.25"
            >
              + 장소 추가
            </button>
          </>
        )}
      </div>
    </section>
  );
}
