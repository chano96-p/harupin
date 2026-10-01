import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { UserMenu } from "@/components/layout/UserMenu";
import { getCurrentUser } from "@/lib/queries/user";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="flex h-16 flex-none items-center gap-3 border-b border-line bg-surface px-5 lg:h-18 lg:px-12">
      <Link href="/">
        <Wordmark className="text-[19px] lg:text-[21px]" />
      </Link>
      <div className="flex-1" />
      {user ? <UserMenu user={user} /> : null}
    </header>
  );
}
