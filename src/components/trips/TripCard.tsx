import Link from "next/link";

import type { TripSummary } from "@/lib/queries/trips";

const DOT: Record<string, string> = {
  food: "bg-food",
  sight: "bg-sight",
  activity: "bg-activity",
  lodging: "bg-lodging",
};

function formatRange(start: string, end: string) {
  const dot = (d: string) => d.replaceAll("-", ".");
  // 종료일의 연도는 시작일과 같을 때만 생략한다. 항상 자르면
  // "2026.12.30 – 01.02" 처럼 이듬해인지 알 수 없게 된다.
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${dot(start)} – ${sameYear ? dot(end).slice(5) : dot(end)}`;
}

export function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:bg-card-hover"
    >
      <div className="h-29.5 bg-[repeating-linear-gradient(135deg,var(--color-lodging-tint)_0_8px,var(--color-cover-stripe)_8px_16px)]" />
      <div className="flex flex-col gap-1.75 p-3.5">
        <div className="text-[15px] font-semibold text-ink">{trip.title}</div>
        <div className="text-[12px] text-ink-soft">
          {formatRange(trip.startDate, trip.endDate)}
        </div>
        <div className="flex items-center gap-1.25 pt-0.75">
          {trip.categories.map((c) => (
            <span key={c} className={`size-1.75 rounded-pill ${DOT[c]}`} />
          ))}
          <span className="ml-1 text-[11.5px] text-ink-mute">
            {trip.placeCount}곳
          </span>
        </div>
      </div>
    </Link>
  );
}
