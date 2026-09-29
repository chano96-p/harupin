import { formatDayShort } from "@/lib/trips/format";
import type { Day } from "@/lib/trips/types";

/** 일차 탭. 선택 = 잉크 배경 + 흰 글자, 비선택 = 흰 면 + 보더. */
export function DayTabs({
  days,
  activeDayId,
  onSelect,
}: {
  days: Pick<Day, "id" | "dayNumber" | "date">[];
  activeDayId: string;
  onSelect: (dayId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 scrollbar-none lg:px-6">
      {days.map((d) => {
        const active = d.id === activeDayId;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            aria-pressed={active}
            className={`flex h-14 min-w-18 flex-none flex-col items-center justify-center gap-0.5 rounded-card border px-3 transition-colors ${
              active
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-ink hover:bg-surface-hover"
            }`}
          >
            <span className="text-[13.5px] font-bold">{d.dayNumber}일차</span>
            <span
              className={`text-[10.5px] ${active ? "text-white/72" : "text-ink-soft"}`}
            >
              {formatDayShort(d.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
