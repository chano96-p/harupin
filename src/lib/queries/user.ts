import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { name: string; email: string };

/** 헤더 표시용. 이름은 구글 프로필 이름, 없으면 이메일 앞부분. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
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
}
