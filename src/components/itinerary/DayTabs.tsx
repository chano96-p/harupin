import type { Day } from "@/lib/trips/types";

/** 일차 탭(pill). 선택 = 진회색 배경 + 흰 글자, 비선택 = 보더만. */
export function DayTabs({
  days,
  activeDayId,
  onSelect,
}: {
  days: Pick<Day, "id" | "dayNumber">[];
  activeDayId: string;
  onSelect: (dayId: string) => void;
}) {
  return (
    <div className="flex gap-1.75 overflow-x-auto px-4 scrollbar-none lg:gap-2 lg:px-5.5">
      {days.map((d) => {
        const active = d.id === activeDayId;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
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
  );
}
