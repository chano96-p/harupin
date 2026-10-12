import { createClient } from "@/lib/supabase/server";
import { COVER_BUCKET, COVER_URL_TTL_SECONDS } from "@/lib/trips/cover";

/**
 * 대표 사진 경로들의 서명 URL 을 한 번에 받는다. 버킷이 private 이라 주소는 이걸로만 만든다.
 * 서명은 본인 폴더만 된다(storage 정책). 실패한 경로는 결과에서 빠지고 화면은 기본 커버로 그린다.
 */
export async function signCoverUrls(
  paths: (string | null)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(COVER_BUCKET)
    .createSignedUrls(unique, COVER_URL_TTL_SECONDS);
  if (error) {
    console.error("대표 사진 서명 실패", error);
    return new Map();
  }

  return new Map(
    data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])),
  );
}
