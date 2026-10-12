"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { COVER_BUCKET, isCoverPathFor } from "@/lib/trips/cover";
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
    .select("id, user_id");

  if (error || data.length === 0) {
    if (error) console.error("여행 삭제 실패", { tripId, error });
    return { error: "여행을 삭제하지 못했습니다." };
  }

  // 사진 파일은 FK cascade 대상이 아니다. 현재 커버만 지우면 업로드 도중 실패·두 탭 동시 변경으로
  // 생긴 파일이 남으므로 여행 폴더를 통째로 비운다. 여행이 지워진 뒤라 실패해도 되돌리지 않는다.
  const folder = `${data[0].user_id}/${data[0].id}`;
  const bucket = supabase.storage.from(COVER_BUCKET);
  const { data: files } = await bucket.list(folder);
  if (files?.length) {
    const { error: removeError } = await bucket.remove(
      files.map((f) => `${folder}/${f.name}`),
    );
    if (removeError) {
      console.error("대표 사진 삭제 실패", { folder, removeError });
    }
  }

  revalidatePath("/");
  redirect("/");
}

/**
 * 대표 사진을 바꾸거나(path) 지운다(null). 파일은 브라우저가 Storage 에 먼저 올린다.
 * 바꾼 뒤 이전 파일을 지운다 — 남겨두면 버킷에 쓰지 않는 파일이 쌓인다.
 */
export async function setTripCover(
  tripId: string,
  path: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  // Server Action 은 직접 호출될 수 있다. 남의 폴더 경로를 걸지 못하게 서버에서 다시 본다
  // (DB 의 trips_cover_path_format CHECK 가 최종 방어선).
  if (
    typeof tripId !== "string" ||
    (path !== null &&
      (typeof path !== "string" || !isCoverPathFor(path, user.id, tripId)))
  ) {
    return { error: "사진을 저장하지 못했습니다." };
  }

  const { data: before, error: readError } = await supabase
    .from("trips")
    .select("cover_path")
    .eq("id", tripId)
    .maybeSingle();
  if (readError || !before) {
    if (readError) console.error("대표 사진 조회 실패", { tripId, readError });
    return { error: "여행을 찾을 수 없습니다." };
  }

  // 그사이 여행이 지워졌으면 0행이다. 성공으로 넘기면 방금 올린 파일이 고아로 남으므로
  // 실패로 돌려 호출한 쪽(CoverPicker)이 파일을 지우게 한다.
  const { data: saved, error } = await supabase
    .from("trips")
    .update({ cover_path: path })
    .eq("id", tripId)
    .select("id")
    .maybeSingle();
  if (error || !saved) {
    if (error) console.error("대표 사진 저장 실패", { tripId, error });
    return { error: "사진을 저장하지 못했습니다." };
  }

  if (before.cover_path && before.cover_path !== path) {
    const { error: removeError } = await supabase.storage
      .from(COVER_BUCKET)
      .remove([before.cover_path]);
    if (removeError) console.error("이전 대표 사진 삭제 실패", { removeError });
  }

  revalidatePath("/");
  revalidatePath(`/trips/${saved.id}`);
  return {};
}
