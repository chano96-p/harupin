import type { ReactNode } from "react";

import { Calendar, MapFold, MapPin } from "@/components/ui/icons";
import type { TripStats } from "@/lib/trips/summary";

/** 홈 상단 통계 3개. 모바일은 아이콘을 숨기고 세 칸을 한 줄에 둔다. */
export function StatCards({ stats }: { stats: TripStats }) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 lg:gap-4">
      <StatCard
        icon={<Calendar className="size-5" />}
        label="다가오는 여행"
        value={`${stats.upcomingCount}개`}
      />
      <StatCard
        icon={<MapPin className="size-5" />}
        label="저장한 장소"
        value={`${stats.placeCount}곳`}
      />
      <StatCard
        icon={<MapFold className="size-5" />}
        label="다녀온 여행"
        value={`${stats.pastCount}개`}
      />
    </ul>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-4 rounded-panel border border-line bg-surface p-3.5 shadow-card lg:p-5.5">
      <span
        aria-hidden
        className="hidden size-11 flex-none place-items-center rounded-control bg-brand-tint text-brand lg:grid"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[12px] text-ink-soft lg:text-[13px]">
          {label}
        </span>
        <span className="text-[18px] font-bold tracking-[-0.02em] text-ink lg:text-[22px]">
          {value}
        </span>
      </div>
    </li>
  );
}
