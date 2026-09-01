import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * 환경변수 단일 진입점. 코드에서 process.env 를 직접 읽지 않고 env.XXX 만 쓴다.
 *
 * - server: 서버 전용. 클라이언트에서 접근하면 명확한 에러로 throw 된다.
 * - client: 브라우저 노출. NEXT_PUBLIC_ 접두사를 라이브러리가 강제한다.
 * - runtimeEnv: 전 항목을 리터럴로 다시 나열한다. Next 가 빌드 시점에
 *   `process.env.NEXT_PUBLIC_XXX` 라는 리터럴만 값으로 치환하기 때문에
 *   구조분해·동적 접근으로는 줄일 수 없다 (T3 Env 문서도 같은 설명).
 *
 * .optional() 은 "그 값이 생기는 단계 전까지"의 임시 표시다:
 * - SUPABASE_*             → 1단계 #2 (인증) 에서 값 채우고 .optional() 제거
 * - MAPS_SERVER_KEY        → 1단계 #4 (검색 프록시) 에서 제거
 * 제거하면 그 시점부터 값 누락이 빌드 실패로 잡힌다.
 */
export const env = createEnv({
  server: {
    MAPS_SERVER_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_MAPS_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    MAPS_SERVER_KEY: process.env.MAPS_SERVER_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_MAPS_KEY: process.env.NEXT_PUBLIC_MAPS_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // ".env 에 KEY= 처럼 빈 줄" 을 undefined 취급 → optional/필수 판정이 정확해진다
  emptyStringAsUndefined: true,
  // env 가 주입되지 않는 파이프라인(시크릿 없는 CI 의 lint/typecheck, Docker 빌드
  // 단계 등)에서만 SKIP_ENV_VALIDATION=1 로 검증을 건너뛴다.
  // Vercel 환경에는 절대 설정하지 말 것 — 검증이 꺼진 배포는 fail-fast 목적을 잃는다.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
