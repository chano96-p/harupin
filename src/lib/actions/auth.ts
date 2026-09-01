"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 구글 OAuth 시작. Supabase 가 돌려준 provider URL 로 보낸다.
 *
 * redirectTo 를 요청 헤더의 origin 으로 만든다. 하드코딩하면 로컬·프리뷰·프로덕션
 * 도메인마다 값이 달라 어긋난다 (Vercel 프리뷰는 배포마다 도메인이 바뀐다).
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  // Origin 헤더가 없으면 여기서 끊는다. 그대로 두면 "null/auth/callback" 이라는
  // 잘못된 redirectTo 가 만들어지고, 에러가 Supabase 쪽에서 나 원인이 흐려진다.
  const origin = (await headers()).get("origin");
  if (!origin) {
    throw new Error("Origin 헤더가 없어 OAuth redirectTo 를 만들 수 없습니다.");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(data.url);
}
