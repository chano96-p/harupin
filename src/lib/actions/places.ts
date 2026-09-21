"use server";

import { revalidatePath } from "next/cache";

import { isCategory } from "@/lib/places/categories";
import {
  MAX_GOOGLE_PLACE_ID,
  MAX_PLACE_MEMO,
  MAX_PLACE_NAME,
} from "@/lib/places/limits";
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

export type DeletePlaceResult = { error?: string };

/**
 * revalidate: 화면을 떠나는 중(unmount)에 보내는 삭제는 false 로 부른다.
 * 이동 중에 revalidate 응답이 오면 어느 화면에 반영될지 정의돼 있지 않다.
 */
export async function deletePlace(
  placeId: string,
  revalidate = true,
): Promise<DeletePlaceResult> {
  const supabase = await createClient();
  // 남의 장소는 RLS(places_own)가 0행으로 걸러낸다. 이미 지워진 장소도 0행이라
  // 같은 결과(삭제된 상태)이므로 에러로 보지 않는다.
  // revalidate 경로는 클라이언트가 보낸 값이 아니라 실제로 지운 행에서 얻는다.
  const { data, error } = await supabase
    .from("places")
    .delete()
    .eq("id", placeId)
    .select("trip_id");

  if (error) {
    console.error("장소 삭제 실패", { placeId, error });
    return { error: "장소를 삭제하지 못했습니다." };
  }

  const tripId = data[0]?.trip_id;
  if (revalidate && tripId) revalidatePath(`/trips/${tripId}`);
  return {};
}

export type UpdateMemoState = { error?: string };

export async function updatePlaceMemo(
  placeId: string,
  memo: string,
): Promise<UpdateMemoState> {
  if (typeof placeId !== "string" || typeof memo !== "string") {
    return { error: "메모를 저장하지 못했습니다." };
  }
  const trimmed = memo.trim();
  // JS length 는 UTF-16 단위라 DB 의 char_length(코드포인트)보다 엄격하다. 통과하면 DB 도 통과한다.
  if (trimmed.length > MAX_PLACE_MEMO) {
    return { error: `메모는 ${MAX_PLACE_MEMO}자까지 쓸 수 있습니다.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .update({ memo: trimmed || null })
    .eq("id", placeId)
    .select("trip_id");

  if (error) {
    console.error("메모 저장 실패", { placeId, error });
    return { error: "메모를 저장하지 못했습니다." };
  }

  // 0행 = 그사이 다른 곳에서 지워졌거나(RLS 로) 남의 장소다.
  const tripId = data[0]?.trip_id;
  if (!tripId) return { error: "장소를 찾을 수 없습니다." };

  revalidatePath(`/trips/${tripId}`);
  return {};
}

// 페이지 조회가 PostgREST max_rows(1000)에서 잘리므로 화면이 이보다 많이 보낼 일은 없다.
const MAX_REORDER_IDS = 1000;

export type ReorderPlacesResult = { error?: string };

export async function reorderPlaces(
  dayId: string,
  placeIds: string[],
): Promise<ReorderPlacesResult> {
  // Server Action 은 공개 엔드포인트라 인자 형태를 다시 본다.
  // 목록이 그 Day 의 장소와 맞는지는 reorder_places 가 검사한다.
  if (
    typeof dayId !== "string" ||
    !Array.isArray(placeIds) ||
    placeIds.length > MAX_REORDER_IDS ||
    !placeIds.every((id) => typeof id === "string")
  ) {
    return { error: "순서를 저장하지 못했습니다." };
  }

  const supabase = await createClient();
  const { data: tripId, error } = await supabase.rpc("reorder_places", {
    p_day_id: dayId,
    p_place_ids: placeIds,
  });

  if (error) {
    console.error("reorder_places 실패", { dayId, error });
    return { error: "순서를 저장하지 못했습니다." };
  }

  if (tripId) revalidatePath(`/trips/${tripId}`);
  return {};
}
