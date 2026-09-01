import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

// Next 16 에서 Middleware 는 Proxy 로 이름이 바뀌었다 (v16.0.0 deprecated·rename).
// 파일명은 proxy.ts, 함수명은 proxy 여야 하며 기본 런타임이 Node.js 다.
//
// 여기서 하는 일은 두 가지뿐이다.
//   1) 만료된 액세스 토큰 갱신 후 응답에 쿠키를 다시 심는다 (서버 컴포넌트는 쿠키를 못 쓴다)
//   2) 쿠키 기반의 낙관적(optimistic) 리다이렉트
// Next 문서가 경고하듯 Proxy 는 prefetch 를 포함해 모든 라우트에서 돌기 때문에
// 여기에 DB 조회를 넣으면 안 되고, 이것만으로 인가를 끝냈다고 봐서도 안 된다.
// 실제 권한 판정은 각 페이지·쿼리와 RLS 가 한다.

// prefix 매칭은 쓰지 않는다. startsWith 로 두면 나중에 /login-debug 같은 경로가
// 생겼을 때 의도치 않게 공개된다. 정확 일치를 기본으로 하고, 하위 경로가 필요한
// 콜백만 명시적으로 예외를 둔다.
const PUBLIC_PATHS = ["/login"];
const PUBLIC_PREFIXES = ["/auth/callback"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() 를 반드시 호출한다. 이 호출이 토큰 갱신을 유발하고 setAll 로 이어진다.
  // 생략하면 세션이 조용히 만료된다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicRoute(pathname);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 반드시 이 response 를 반환한다. 새 NextResponse 를 만들어 반환하면
  // 위에서 심은 갱신 쿠키가 사라져 매 요청마다 재갱신이 일어난다.
  return response;
}

export const config = {
  // 정적 자산과 이미지 최적화 경로는 제외한다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
