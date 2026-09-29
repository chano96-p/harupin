import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { formatTripRange } from "@/lib/trips/format";
import type { Trip } from "@/lib/trips/types";

/** 데스크톱 헤더(1a). 모바일은 지도 전면이라 헤더가 없고 제목은 sr-only 로만 둔다. */
export function TripHeader({ trip }: { trip: Trip }) {
  return (
    <header className="hidden h-16 flex-none items-center gap-3.5 border-b border-line bg-surface px-5.5 lg:flex">
      <Link href="/">
        <Wordmark className="text-[16px]" />
      </Link>
      <span aria-hidden className="h-6.5 w-px bg-line" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-ink">
          {trip.title}
        </h1>
        <p className="text-[12px] text-ink-soft">
          {formatTripRange(trip.startDate, trip.endDate)}
          {trip.region ? ` · ${trip.region}` : ""}
        </p>
      </div>
    </header>
  );
}
