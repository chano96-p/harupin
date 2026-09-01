import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * 서버 컴포넌트·Route Handler·Server Action 용 클라이언트.
 * 요청마다 새로 만든다 (쿠키가 요청에 묶여 있어 모듈 전역으로 재사용하면 세션이 섞인다).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 토큰 갱신은 proxy 가 담당하므로
            // 여기서 삼켜도 세션이 유실되지 않는다.
          }
        },
      },
    },
  );
}
