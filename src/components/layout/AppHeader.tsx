import { Wordmark } from "@/components/brand/Wordmark";

export function AppHeader() {
  return (
    <header className="flex h-16 flex-none items-center gap-3 border-b border-line bg-surface px-5 lg:px-6.5">
      <Wordmark className="text-[17px]" />
      <div className="flex-1" />
      <div className="size-7.5 rounded-pill border border-line bg-lodging-tint" />
    </header>
  );
}
