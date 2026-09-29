import Link from "next/link";

import { ArrowLeft, MapPin } from "@/components/ui/icons";
import { formatTripRange } from "@/lib/trips/format";
import type { Trip } from "@/lib/trips/types";

/** 데스크톱 헤더(1a). 모바일은 지도 전면이라 헤더가 없고 제목은 sr-only 로만 둔다. */
export function TripHeader({ trip }: { trip: Trip }) {
  return (
    <header className="hidden h-18 flex-none items-center gap-3 border-b border-line bg-surface px-6 lg:flex">
      <Link
        href="/"
        aria-label="내 여행 목록"
        className="-ml-2 grid size-10 flex-none place-items-center rounded-pill text-ink transition-colors hover:bg-surface-hover"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="truncate text-[20px] leading-tight font-bold tracking-[-0.02em] text-ink">
          {trip.title}
        </h1>
        <p className="flex items-center gap-2 text-[12.5px] text-ink-soft">
          {trip.region ? (
            <>
              <span className="flex items-center gap-1 font-bold text-ink">
                <MapPin className="size-3.5 text-brand" />
                {trip.region}
              </span>
              <span aria-hidden className="h-3 w-px bg-line" />
            </>
          ) : null}
          {formatTripRange(trip.startDate, trip.endDate)}
        </p>
      </div>
    </header>
  );
}
