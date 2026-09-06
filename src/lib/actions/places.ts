"use server";

import { revalidatePath } from "next/cache";

import { isCategory } from "@/lib/places/categories";
import { MAX_GOOGLE_PLACE_ID, MAX_PLACE_NAME } from "@/lib/places/limits";
import { createClient } from "@/lib/supabase/server";

export type AddPlaceState = { error?: string; ok?: boolean };

export async function addPlace(
  _prev: AddPlaceState,
  formData: FormData,
): Promise<AddPlaceState> {
  const tripId = String(formData.get("tripId") ?? "");
  const dayId = String(formData.get("dayId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const googlePlaceId = String(formData.get("googlePlaceId") ?? "") || null;

  if (!dayId) return { error: "어느 날에 추가할지 선택해주세요." };
  if (!name) return { error: "장소 이름이 비어 있습니다." };
  // Server Action 은 공개 HTTP 엔드포인트다. 클라이언트의 hidden input 을
  // 우회한 직접 호출을 전제로 서버에서 다시 본다 (DB CHECK 가 최종 방어선).
  if (name.length > MAX_PLACE_NAME) {
    return { error: "장소 이름이 너무 깁니다." };
  }
  if (googlePlaceId && googlePlaceId.length > MAX_GOOGLE_PLACE_ID) {
    return { error: "장소 식별자가 올바르지 않습니다." };
  }
  if (!isCategory(category)) return { error: "카테고리를 선택해주세요." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "장소 좌표가 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_place", {
    p_day_id: dayId,
    p_name: name,
    p_lat: lat,
    p_lng: lng,
    p_category: category,
    p_google_place_id: googlePlaceId,
  });

  if (error) {
    console.error("add_place 실패", { dayId, error });
    return { error: "장소를 추가하지 못했습니다." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}
