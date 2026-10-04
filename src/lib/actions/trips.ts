"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { countDays } from "@/lib/trips/dates";
import {
  MAX_TRIP_DAYS,
  MAX_TRIP_REGION,
  MAX_TRIP_TITLE,
} from "@/lib/trips/limits";

export async function createTrip(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!title) return { error: "여행 제목을 입력해주세요." };
  // 입력창의 maxLength 는 클라이언트 전용이라 Server Action 직접 호출로 우회된다.
  // addPlace 와 같은 수준으로 서버에서도 본다 (DB CHECK 가 최종 방어선).
  if (title.length > MAX_TRIP_TITLE) {
    return { error: `여행 제목은 ${MAX_TRIP_TITLE}자까지 가능합니다.` };
  }
  if (!startDate || !endDate) return { error: "기간을 선택해주세요." };
  if (endDate < startDate) return { error: "종료일이 시작일보다 빠릅니다." };

  if (countDays(startDate, endDate) > MAX_TRIP_DAYS) {
    return { error: `여행 기간은 최대 ${MAX_TRIP_DAYS}일까지 가능합니다.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_trip", {
    p_title: title,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  // DB 원문 메시지를 그대로 보여주면 제약 이름 같은 내부 문구가 노출된다.
  if (error) {
    console.error("create_trip 실패", error);
    return { error: "여행을 만들지 못했습니다. 입력을 확인해주세요." };
  }

  revalidatePath("/");
  redirect("/");
}

export type UpdateTripState = ActionResult & { ok?: boolean };

/**
 * 여행 설정 저장 (시안 3b). 기간은 줄일 수 없다 — update_trip 이 거부하고,
 * 화면도 종료일 하한을 걸어 막는다.
 */
export async function updateTrip(
  _prev: UpdateTripState,
  formData: FormData,
): Promise<UpdateTripState> {
  const tripId = String(formData.get("tripId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim() || null;
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!tripId) return { error: "여행을 찾을 수 없습니다." };
  if (!title) return { error: "여행 제목을 입력해주세요." };
  if (title.length > MAX_TRIP_TITLE) {
    return { error: `여행 제목은 ${MAX_TRIP_TITLE}자까지 가능합니다.` };
  }
  if (region && region.length > MAX_TRIP_REGION) {
    return { error: `지역은 ${MAX_TRIP_REGION}자까지 가능합니다.` };
  }
  if (!startDate || !endDate) return { error: "기간을 선택해주세요." };
  if (endDate < startDate) return { error: "종료일이 시작일보다 빠릅니다." };
  if (countDays(startDate, endDate) > MAX_TRIP_DAYS) {
    return { error: `여행 기간은 최대 ${MAX_TRIP_DAYS}일까지 가능합니다.` };
  }

  const supabase = await createClient();
  const { data: savedId, error } = await supabase.rpc("update_trip", {
    p_trip_id: tripId,
    p_title: title,
    p_start_date: startDate,
    p_end_date: endDate,
    p_region: region,
  });

  if (error) {
    console.error("update_trip 실패", { tripId, error });
    return { error: "여행 정보를 저장하지 못했습니다. 기간을 확인해주세요." };
  }

  revalidatePath("/");
  revalidatePath(`/trips/${savedId}`);
  return { ok: true };
}

/** 여행 삭제 (시안 3c). Day·장소는 FK cascade 로 함께 지워진다. */
export async function deleteTrip(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const tripId = String(formData.get("tripId") ?? "");
  const supabase = await createClient();
  // 남의 여행은 RLS 가 0행으로 걸러낸다. 0행이면 지운 게 없으므로 실패로 본다.
  const { data, error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId)
    .select("id");

  if (error || data.length === 0) {
    if (error) console.error("여행 삭제 실패", { tripId, error });
    return { error: "여행을 삭제하지 못했습니다." };
  }

  revalidatePath("/");
  redirect("/");
}
