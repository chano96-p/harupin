import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { guardPlacesRequest } from "@/lib/places/guard";
import { DETAILS_LIMIT } from "@/lib/places/limits";

// place_cache 는 아직 안 쓴다 (2단계 항목). 지금은 매 선택마다 Google 을 직접
// 부른다 — 검색당 최대 1회(자동완성은 여러 번, 상세조회는 선택 시 한 번뿐)라
// 캐싱 없이도 비용이 자동완성만큼 늘지 않는다.
const FIELD_MASK = "id,displayName,location";

export async function GET(request: NextRequest) {
  const guard = await guardPlacesRequest(
    DETAILS_LIMIT.bucket,
    DETAILS_LIMIT.limit,
    DETAILS_LIMIT.windowSeconds,
  );
  if (!guard.ok) return guard.response;

  const { searchParams } = request.nextUrl;
  const placeId = searchParams.get("placeId");
  const sessionToken = searchParams.get("sessionToken");

  if (!placeId || !sessionToken) {
    return NextResponse.json(
      { error: "placeId와 sessionToken이 필요합니다." },
      { status: 400 },
    );
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("sessionToken", sessionToken);

  const googleRes = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": env.MAPS_SERVER_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
  });

  if (!googleRes.ok) {
    console.error("Places details 실패", {
      status: googleRes.status,
      body: await googleRes.text().catch(() => ""),
    });
    return NextResponse.json(
      { error: "장소 정보를 가져오지 못했습니다." },
      { status: 502 },
    );
  }

  const data = await googleRes.json();
  const lat = data.location?.latitude;
  const lng = data.location?.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "장소 좌표를 확인할 수 없습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    placeId: data.id as string,
    name: (data.displayName?.text as string | undefined) ?? "",
    lat,
    lng,
  });
}
