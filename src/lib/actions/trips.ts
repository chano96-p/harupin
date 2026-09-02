"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { MAX_TRIP_DAYS } from "@/lib/trips/limits";

export type CreateTripState = { error?: string };

export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!title) return { error: "여행 제목을 입력해주세요." };
  if (!startDate || !endDate) return { error: "기간을 선택해주세요." };
  if (endDate < startDate) return { error: "종료일이 시작일보다 빠릅니다." };

  const days =
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        86_400_000,
    ) + 1;
  if (days > MAX_TRIP_DAYS) {
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
