import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { guardPlacesRequest } from "@/lib/places/guard";
import { AUTOCOMPLETE_LIMIT, MAX_INPUT_LENGTH } from "@/lib/places/limits";

type Suggestion = { placeId: string; mainText: string; secondaryText: string };

// Places API (New). 서버 전용 키로만 부른다.
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const FIELD_MASK =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat.mainText,suggestions.placePrediction.structuredFormat.secondaryText";

export async function POST(request: NextRequest) {
  const guard = await guardPlacesRequest(
    AUTOCOMPLETE_LIMIT.bucket,
    AUTOCOMPLETE_LIMIT.limit,
    AUTOCOMPLETE_LIMIT.windowSeconds,
  );
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  const sessionToken =
    typeof body?.sessionToken === "string" ? body.sessionToken : "";

  if (!input || !sessionToken) {
    return NextResponse.json(
      { error: "input과 sessionToken이 필요합니다." },
      { status: 400 },
    );
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "검색어가 너무 깁니다." },
      { status: 400 },
    );
  }

  const googleRes = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.MAPS_SERVER_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: "ko",
      regionCode: "kr",
      includeQueryPredictions: false,
    }),
  });

  if (!googleRes.ok) {
    // 원문(키·요청 세부사항 포함 가능)을 클라이언트로 흘리지 않는다.
    console.error("Places autocomplete 실패", {
      status: googleRes.status,
      body: await googleRes.text().catch(() => ""),
    });
    return NextResponse.json(
      { error: "검색을 처리하지 못했습니다." },
      { status: 502 },
    );
  }

  const data = await googleRes.json();
  const suggestions: Suggestion[] = (data.suggestions ?? [])
    .map((s: { placePrediction?: PlacePredictionShape }) => s.placePrediction)
    .filter(
      (p: PlacePredictionShape | undefined): p is PlacePredictionShape => !!p,
    )
    .map((p: PlacePredictionShape) => ({
      placeId: p.placeId,
      mainText: p.structuredFormat?.mainText?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));

  return NextResponse.json({ suggestions });
}

type PlacePredictionShape = {
  placeId: string;
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
};
