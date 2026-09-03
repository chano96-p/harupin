import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { TripMapSearch } from "@/components/trips/TripMapSearch";
import { createClient } from "@/lib/supabase/server";

/**
 * 일정 편집 화면(시안 1a·1b)의 자리.
 * 지금은 일차 목록 + 장소 검색(4번)까지다. 검색 결과는 저장되지 않는 미리보기다.
 * 저장(5번)·정식 스플릿 레이아웃과 순번 핀(6번)·dnd(7번)는 다음 단계에 들어온다.
 */
export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, title, start_date, end_date, days(day_number, date)")
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

  const days = (trip.days as { day_number: number; date: string }[]).sort(
    (a, b) => a.day_number - b.day_number,
  );

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
        <TripMapSearch />

        <ul className="flex flex-col gap-2">
          {days.map((d) => (
            <li
              key={d.day_number}
              className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3"
            >
              <span className="text-[13px] font-semibold text-ink">
                {d.day_number}일차
              </span>
              <span className="text-[13px] text-ink-soft">
                {d.date.replaceAll("-", ".")}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
