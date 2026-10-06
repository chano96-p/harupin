import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { name: string; email: string };

/**
 * 헤더·홈 인사용. 이름은 구글 프로필 이름, 없으면 이메일 앞부분.
 * 한 요청에서 헤더와 페이지가 함께 부르므로 cache 로 한 번만 조회한다.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email ?? "";
  const meta = user.user_metadata as { full_name?: string; name?: string };
  const name =
    meta.full_name?.trim() ||
    meta.name?.trim() ||
    email.split("@")[0] ||
    "사용자";
  return { name, email };
});
