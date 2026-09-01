import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth 콜백. Supabase 가 붙여 보낸 code 를 세션으로 교환한다.
 * 교환이 성공하면 server 클라이언트의 setAll 이 응답에 세션 쿠키를 심는다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("인증 코드가 없습니다")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}

/**
 * `next` 파라미터를 앱 내부 경로로만 제한한다.
 *
 * 검증 없이 `${origin}${next}` 로 이어 붙이면 open redirect 가 된다.
 * next="@evil.com" 이면 "https://myapp.com@evil.com" 이 되고, myapp.com 이
 * userinfo 로 파싱되어 실제 host 는 evil.com 이다 (new URL() 로 실증).
 * 로그인 직후라 사용자가 가장 방심하는 시점이므로 피싱에 그대로 쓰인다.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  // 단일 슬래시로 시작하는 경로만 허용한다.
  //   "@evil.com"    → 슬래시로 시작하지 않음 (userinfo 주입)
  //   "//evil.com"   → 프로토콜 상대 URL
  //   "/\evil.com"   → 일부 파서가 // 와 동일하게 취급
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  return raw;
}
