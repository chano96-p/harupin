"use client";

import type { EditorDay } from "@/components/itinerary/TripEditor";
import { CATEGORIES, categoryLabel } from "@/lib/places/categories";
import { formatDayDate } from "@/lib/trips/format";

/**
 * Day 탭 + 그 Day 의 장소 리스트.
 * 모바일은 지도 위 바텀시트(1b), lg 부터는 좌측 고정 패널(1a).
 */
export function ItineraryPanel({
  days,
  activeDay,
  onSelectDay,
  expanded,
  onToggleExpanded,
  onAddPlace,
}: {
  days: EditorDay[];
  activeDay: EditorDay;
  onSelectDay: (dayId: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onAddPlace: () => void;
}) {
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
        <div className="flex gap-1.75 overflow-x-auto px-4 scrollbar-none lg:gap-2 lg:px-5.5">
          {days.map((d) => {
            const active = d.id === activeDay.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDay(d.id)}
                aria-pressed={active}
                className={`flex-none rounded-pill border px-3.25 py-1.75 text-[12.5px] font-semibold transition-colors lg:px-3.75 lg:py-2 lg:text-[13px] ${
                  active
                    ? "border-ink bg-ink text-surface"
                    : "border-line text-ink hover:bg-surface-hover"
                }`}
              >
                {d.dayNumber}일차
              </button>
            );
          })}
        </div>

        <div className="hidden items-baseline gap-2 px-5.5 lg:flex">
          <span className="text-[15px] font-semibold text-ink">
            {formatDayDate(activeDay.date)}
          </span>
          <span className="text-[12px] text-ink-soft">
            {activeDay.places.length}곳
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.25 overflow-y-auto px-4 pb-6 lg:gap-2.5 lg:px-5.5 lg:pt-1 lg:pb-5.5">
        {activeDay.places.length === 0 ? (
          <EmptyDay onSearch={onAddPlace} />
        ) : (
          <>
            <ol className="flex flex-col gap-2.25 lg:gap-2.5">
              {activeDay.places.map((p, i) => {
                const cat = CATEGORIES.find((c) => c.value === p.category);
                const tint = cat?.tint ?? "bg-lodging-tint";
                const deep = cat?.deep ?? "text-lodging-deep";
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-2.75 rounded-card border border-line bg-surface p-3.25 lg:items-start lg:gap-3 lg:p-3.5"
                  >
                    <span
                      className={`grid size-6.5 flex-none place-items-center rounded-pill text-[13px] font-semibold ${tint} ${deep}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 lg:gap-1.5">
                      <span className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink lg:text-[15px]">
                        {p.name}
                      </span>
                      <span className="text-[12px] text-ink-soft lg:hidden">
                        {categoryLabel(p.category)}
                      </span>
                      <span
                        className={`hidden self-start rounded-pill px-2 py-0.75 text-[11px] font-semibold lg:inline ${tint} ${deep}`}
                      >
                        {categoryLabel(p.category)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

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

/** 시안 3f */
function EmptyDay({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-dashed-line bg-sunken p-5">
      <p className="text-[15px] font-semibold text-ink">아직 장소가 없어요</p>
      <p className="max-w-60 text-center text-[13px] leading-relaxed text-ink-soft text-pretty">
        지도 상단 검색창에서 장소를 찾아 이 일차에 추가하세요.
      </p>
      <button
        type="button"
        onClick={onSearch}
        className="rounded-control border border-control-line bg-surface px-3.5 py-2.25 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-hover"
      >
        장소 검색하기
      </button>
    </div>
  );
}
