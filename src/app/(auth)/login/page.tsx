import { signInWithGoogle } from "@/lib/actions/auth";

export const metadata = {
  title: "로그인 · 하루핀",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold text-ink">하루핀</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          지도에 핀 찍으며 날짜별로 동선을 짜는 여행 계획
        </p>

        <form action={signInWithGoogle} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-control border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            구글로 시작하기
          </button>
        </form>

        {error ? (
          <p
            role="alert"
            className="mt-4 text-xs leading-relaxed text-food-deep"
          >
            로그인에 실패했습니다: {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
