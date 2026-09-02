import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { DB_SCHEMA } from "@/lib/supabase/schema";

/**
 * 브라우저용 Supabase 클라이언트.
 * anon 키는 번들에 노출되는 전제이며, 실제 방어선은 RLS.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { db: { schema: DB_SCHEMA } },
  );
}
