import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * /api/places/* 공통 관문. 인증 확인과 레이트리밋 체크를 한곳에 묶는다.
 *
 * proxy.ts 가 미들웨어 단에서도 미인증 요청을 401 로 끊지만, 그것만 믿지
 * 않는다(proxy.ts 자체 주석 참고). 실제 인가 판정은 여기, 라우트 핸들러에서 한다.
 *
 * 성공 시 아무것도 반환하지 않는다 — 호출자가 필요하면 자기 createClient() 로
 * 새로 클라이언트를 만들면 된다. 여기서 만든 인스턴스를 그대로 넘기면 반환
 * 타입에 스키마 제네릭("harupin")이 새어나가 호출부 타입을 오염시킨다.
 */
export async function guardPlacesRequest(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }

  const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("check_rate_limit 실패", { bucket, error });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "요청을 처리하지 못했습니다." },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      ),
    };
  }

  return { ok: true };
}
