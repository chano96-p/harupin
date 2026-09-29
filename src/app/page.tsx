import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { Plus } from "@/components/ui/icons";
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
    <main className="mx-auto flex w-full max-w-360 flex-col gap-7 px-5 py-8 lg:gap-9 lg:px-12 lg:py-12">
      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] font-bold tracking-[0.12em] text-brand-deep">
          MY JOURNEYS
        </span>
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink lg:text-[32px]">
            내 여행
          </h1>
          <span className="text-[14px] font-medium text-ink-soft">
            {trips.length}개
          </span>
        </div>
        <p className="text-[14px] text-ink-soft">
          떠날 날을 기다리는 여행부터 오래 간직할 추억까지 한곳에 모았어요.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      className="group flex min-h-60 flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-dashed-line bg-warm text-ink transition-colors hover:border-brand"
    >
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-pill bg-brand-tint text-brand transition-colors group-hover:bg-brand group-hover:text-white"
      >
        <Plus className="size-5" />
      </span>
      <span className="text-[14px] font-bold">새 여행 만들기</span>
    </Link>
  );
}

function EmptyTrips() {
  return (
    <main className="flex flex-1 p-5 lg:p-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 rounded-panel border border-dashed border-dashed-line bg-warm px-6 py-14">
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">
          첫 여행을 만들어 보세요
        </h1>
        <p className="max-w-75 text-center text-[14px] leading-relaxed text-ink-soft text-pretty">
          제목과 기간만 입력하면 일차가 자동으로 만들어집니다.
        </p>
        <Link
          href="/?new=1"
          scroll={false}
          className="mt-1 flex h-12 items-center gap-2 rounded-control bg-brand-deep px-4.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deeper"
        >
          <Plus className="size-4.25" />새 여행 만들기
        </Link>
      </div>
    </main>
  );
}
