import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { TripMapSearch } from "@/components/trips/TripMapSearch";
import { CATEGORIES, categoryLabel } from "@/lib/places/categories";
import { createClient } from "@/lib/supabase/server";

/**
 * 일정 편집 화면(시안 1a·1b)의 자리.
 * 지금은 일차 목록 + 장소 검색(4번) + Day 에 추가(5번)까지다.
 * 정식 스플릿 레이아웃과 순번 핀(6번)·dnd(7번)는 다음 단계에 들어온다.
 */
export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();

  // 중첩 임베드는 컬렉션마다 PostgREST 의 max_rows(1000)에서 잘린다.
  // 에러가 아니라 200 이라 화면에서 장소가 조용히 사라진다(실측: 1,280곳 중 1,000곳 수신).
  // 한 Day 에 1,000곳은 사실상 도달 불가라 지금은 그대로 두고,
  // 도달 가능성이 생기면 list_trips 처럼 RPC 집계로 옮긴다.
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, title, start_date, end_date, days(id, day_number, date, places(id, name, category, visit_order))",
    )
    .eq("id", tripId)
    .maybeSingle();

  // 22P02 = uuid 형식이 아닌 경로. 주소가 잘못된 것이므로 404 가 맞다.
  // 그 외 에러(RLS·DB 장애)를 404 로 뭉개면 장애가 "없는 여행" 으로 보인다.
  if (error) {
    if (error.code === "22P02") notFound();
    console.error("여행 조회 실패", { tripId, error });
    throw error;
  }
  if (!trip) notFound();

  type PlaceRow = {
    id: string;
    name: string;
    category: string;
    visit_order: number;
  };
  type DayRow = {
    id: string;
    day_number: number;
    date: string;
    places: PlaceRow[];
  };

  const days = (trip.days as DayRow[])
    .map((d) => ({
      ...d,
      places: [...d.places].sort((a, b) => a.visit_order - b.visit_order),
    }))
    .sort((a, b) => a.day_number - b.day_number);

  const dayOptions = days.map((d) => ({
    id: d.id,
    dayNumber: d.day_number,
    date: d.date,
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader />
      <main className="flex flex-col gap-5 px-5 py-7 lg:px-6.5">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
            {trip.title}
          </h1>
          <span className="text-[13px] text-ink-soft">{days.length}일차</span>
        </div>

        <TripMapSearch tripId={trip.id} days={dayOptions} />

        <ul className="flex flex-col gap-3">
          {days.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 rounded-card border border-line bg-surface px-4 py-3"
            >
              <div className="flex items-baseline gap-2.5">
                <span className="text-[13px] font-semibold text-ink">
                  {d.day_number}일차
                </span>
                <span className="text-[13px] text-ink-soft">
                  {d.date.replaceAll("-", ".")}
                </span>
                <span className="text-[12px] text-ink-mute">
                  {d.places.length}곳
                </span>
              </div>

              {d.places.length > 0 ? (
                <ol className="flex flex-col gap-1.5">
                  {d.places.map((p) => {
                    const cat = CATEGORIES.find((c) => c.value === p.category);
                    return (
                      <li key={p.id} className="flex items-center gap-2.5">
                        <span
                          className={`grid size-6.5 flex-none place-items-center rounded-pill text-[12px] font-semibold ${cat?.tint ?? "bg-lodging-tint"} ${cat?.deep ?? "text-ink"}`}
                        >
                          {p.visit_order}
                        </span>
                        <span className="text-[14px] text-ink">{p.name}</span>
                        <span className="text-[12px] text-ink-mute">
                          {categoryLabel(p.category)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
