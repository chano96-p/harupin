import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";

export function AppHeader() {
  return (
    <header className="flex h-16 flex-none items-center gap-3 border-b border-line bg-surface px-5 lg:h-18 lg:px-12">
      <Link href="/">
        <Wordmark className="text-[19px] lg:text-[21px]" />
      </Link>
      <div className="flex-1" />
      <div className="size-8 rounded-pill border border-line bg-sunken" />
    </header>
  );
}
