import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { NewTripDialog } from "@/components/trips/NewTripDialog";
import { TripCard } from "@/components/trips/TripCard";
import { listTrips } from "@/lib/queries/trips";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [trips, params] = await Promise.all([listTrips(), searchParams]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader />

      {trips.length === 0 ? <EmptyTrips /> : <TripGrid trips={trips} />}

      <NewTripDialog open={params.new !== undefined} />
    </div>
  );
}

function TripGrid({ trips }: { trips: Awaited<ReturnType<typeof listTrips>> }) {
  return (
    <main className="flex flex-col gap-5 px-5 py-7 lg:px-6.5 lg:py-7.5">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
          내 여행
        </h1>
        <span className="text-[13px] text-ink-soft">{trips.length}개</span>
      </div>

      <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
        <NewTripTile />
      </div>
    </main>
  );
}

function NewTripTile() {
  return (
    <Link
      href="/?new=1"
      scroll={false}
      className="flex min-h-52.5 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-dashed-line text-ink-soft transition-colors hover:bg-surface-hover"
    >
      <span aria-hidden className="text-[22px] text-ink-mute">
        +
      </span>
      <span className="text-[13px] font-semibold">새 여행 만들기</span>
    </Link>
  );
}

function EmptyTrips() {
  return (
    <main className="flex flex-1 p-6 lg:p-6.5">
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 rounded-card border border-dashed border-dashed-line bg-sunken px-6 py-14">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
          첫 여행을 만들어 보세요
        </h1>
        <p className="max-w-75 text-center text-[13.5px] leading-relaxed text-ink-soft text-pretty">
          제목과 기간만 입력하면 일차가 자동으로 만들어집니다.
        </p>
        <Link
          href="/?new=1"
          scroll={false}
          className="rounded-control bg-ink px-5 py-2.75 text-[13.5px] font-semibold text-surface"
        >
          + 새 여행
        </Link>
      </div>
    </main>
  );
}
