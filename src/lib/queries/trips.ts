import { CATEGORIES } from "@/lib/places/categories";
import { createClient } from "@/lib/supabase/server";
import type { TripSummary } from "@/lib/trips/types";

type ListTripsRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  place_count: number;
  categories: string[];
};

export async function listTrips(): Promise<TripSummary[]> {
  const supabase = await createClient();

  // 집계를 DB 에서 끝낸다. places 를 클라이언트로 끌어와 세면 PostgREST 의
  // max_rows 에서 조용히 잘려(200 응답) 개수가 어긋난다.
  const { data, error } = await supabase.rpc("list_trips");
  if (error) throw error;

  // 여행 날짜 최신순(시작일이 늦은 것부터). 정렬 메뉴는 두지 않는다.
  return ((data ?? []) as ListTripsRow[])
    .map((row) => ({
      id: row.id,
      title: row.title,
      startDate: row.start_date,
      endDate: row.end_date,
      placeCount: Number(row.place_count),
      categories: CATEGORIES.map((c) => c.value).filter((c) =>
        row.categories.includes(c),
      ),
    }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export type TripProgress = {
  region: string | null;
  dayCount: number;
  /** 장소가 1곳 이상 있는 일차 수. 완성도 = filledDayCount / dayCount */
  filledDayCount: number;
};

/**
 * 홈의 다가오는 여행 카드용. 중첩 임베드는 컬렉션마다 max_rows(1000)에서 잘리지만
 * days 는 trips_duration_limit 로 최대 366행이고, places 는 "1곳 이상인가"만 보므로
 * 잘려도 결과가 같다. 장소 수를 세는 용도로 쓰지 말 것 (list_trips 의 place_count 사용).
 */
export async function getTripProgress(
  tripId: string,
): Promise<TripProgress | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("region, days(id, places(id))")
    .eq("id", tripId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const days = data.days as { id: string; places: { id: string }[] }[];
  return {
    region: data.region,
    dayCount: days.length,
    filledDayCount: days.filter((d) => d.places.length > 0).length,
  };
}
