import Link from "next/link";

import { ArrowUpRight } from "@/components/ui/icons";
import type { TripProgress } from "@/lib/queries/trips";
import {
  formatNights,
  tripCountdown,
  type TripCountdown,
} from "@/lib/trips/summary";
import type { TripSummary } from "@/lib/trips/types";

/**
 * 가장 가까운(또는 진행 중인) 여행 하나를 강조한다.
 * 완성도 = 장소가 1곳 이상 있는 일차 ÷ 전체 일차.
 */
export function UpcomingTripCard({
  trip,
  progress,
  today,
}: {
  trip: TripSummary;
  progress: TripProgress;
  today: string;
}) {
  const countdown = tripCountdown(trip, today);
  const completion =
    progress.dayCount > 0
      ? Math.round((progress.filledDayCount / progress.dayCount) * 100)
      : 0;

  return (
    <section
      aria-label="다가오는 여행"
      className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5 shadow-card lg:max-w-200 lg:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-control bg-brand-tint px-2 py-0.5 text-[11px] font-bold tracking-[0.06em] text-brand-deep">
              {countdown.kind === "before" ? "UPCOMING" : "NOW"}
            </span>
            {progress.region ? (
              <span className="truncate text-[12.5px] text-ink-soft">
                {progress.region}
              </span>
            ) : null}
          </div>
          <h2 className="text-[18px] leading-snug font-bold tracking-[-0.02em] text-ink text-pretty lg:text-[20px]">
            {headline(trip.title, countdown)}
          </h2>
        </div>
        <span className="flex-none rounded-control bg-brand-tint px-2.5 py-1 text-[13px] font-bold text-brand-deep">
          {countdown.kind === "before"
            ? countdown.daysLeft === 0
              ? "D-DAY"
              : `D-${countdown.daysLeft}`
            : `${countdown.dayNumber}일차`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
          <Stat label="일정" value={formatNights(trip)} />
          <Stat label="장소" value={`${trip.placeCount}곳`} />
          <Stat label="완성도" value={`${completion}%`} />
        </dl>
        <Link
          href={`/trips/${trip.id}`}
          className="ml-auto flex items-center gap-1 text-[13px] font-bold text-brand-deep hover:text-brand-deeper"
        >
          일정 이어서 만들기
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function headline(title: string, countdown: TripCountdown) {
  if (countdown.kind === "during") return `${title} 여행 중이에요`;
  if (countdown.daysLeft === 0) return `오늘 ${title} 떠나는 날이에요`;
  return `${title}까지 ${countdown.daysLeft}일 남았어요`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
