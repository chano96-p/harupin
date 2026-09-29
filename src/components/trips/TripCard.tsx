import Link from "next/link";

import { findCategory } from "@/lib/places/categories";
import { formatTripRange } from "@/lib/trips/format";
import type { TripSummary } from "@/lib/trips/types";

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
          {formatTripRange(trip.startDate, trip.endDate)}
        </div>
        <div className="flex items-center gap-1.25 pt-0.75">
          {trip.categories.map((c) => (
            <span
              key={c}
              className={`size-1.75 rounded-pill ${findCategory(c)?.dot ?? "bg-lodging"}`}
            />
          ))}
          <span className="ml-1 text-[11.5px] text-ink-mute">
            {trip.placeCount}곳
          </span>
        </div>
      </div>
    </Link>
  );
}
