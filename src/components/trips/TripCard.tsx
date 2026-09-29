import Link from "next/link";

import { ArrowUpRight, MapPin } from "@/components/ui/icons";
import { findCategory } from "@/lib/places/categories";
import { formatTripRange } from "@/lib/trips/format";
import type { TripSummary } from "@/lib/trips/types";

export function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card transition-shadow hover:shadow-pop"
    >
      {/* 대표 이미지가 아직 없어 지도 격자 위에 핀을 얹은 커버로 대신한다. */}
      <div className="relative grid h-36 place-items-center bg-sunken bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-size-[28px_28px] lg:h-42">
        <span className="grid size-11 place-items-center rounded-pill bg-brand text-white shadow-card">
          <MapPin className="size-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-col gap-1.5">
          <div className="truncate text-[18px] font-bold tracking-[-0.01em] text-ink lg:text-[19px]">
            {trip.title}
          </div>
          <div className="text-[12.5px] text-ink-soft">
            {formatTripRange(trip.startDate, trip.endDate)}
          </div>
        </div>
        <div className="mt-auto flex items-center gap-1.5">
          {trip.categories.map((c) => (
            <span
              key={c}
              className={`size-2 rounded-pill ${findCategory(c)?.dot ?? "bg-lodging"}`}
            />
          ))}
          <span className="ml-0.5 text-[12.5px] font-medium text-ink-soft">
            {trip.placeCount}곳
          </span>
          <ArrowUpRight className="ml-auto size-4.25 text-ink-soft transition-colors group-hover:text-brand" />
        </div>
      </div>
    </Link>
  );
}
