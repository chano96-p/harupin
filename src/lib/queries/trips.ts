import { createClient } from "@/lib/supabase/server";

export type TripSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  placeCount: number;
  categories: string[];
};

const CATEGORY_ORDER = ["food", "sight", "activity", "lodging"];

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

  return ((data ?? []) as ListTripsRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    placeCount: Number(row.place_count),
    categories: CATEGORY_ORDER.filter((c) => row.categories.includes(c)),
  }));
}
