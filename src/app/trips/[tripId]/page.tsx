import { notFound } from "next/navigation";

import { TripEditor } from "@/components/itinerary/TripEditor";
import { createClient } from "@/lib/supabase/server";

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
      "id, title, start_date, end_date, region, days(id, day_number, date, places(id, name, category, lat, lng, memo, visit_order))",
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
    lat: number;
    lng: number;
    memo: string | null;
    visit_order: number;
  };
  type DayRow = {
    id: string;
    day_number: number;
    date: string;
    places: PlaceRow[];
  };

  const days = (trip.days as DayRow[])
    .sort((a, b) => a.day_number - b.day_number)
    .map((d) => ({
      id: d.id,
      dayNumber: d.day_number,
      date: d.date,
      places: [...d.places]
        .sort((a, b) => a.visit_order - b.visit_order)
        .map(({ id, name, category, lat, lng, memo }) => ({
          id,
          name,
          category,
          lat,
          lng,
          memo,
        })),
    }));

  return (
    <TripEditor
      trip={{
        id: trip.id,
        title: trip.title,
        startDate: trip.start_date,
        endDate: trip.end_date,
        region: trip.region,
      }}
      days={days}
    />
  );
}
