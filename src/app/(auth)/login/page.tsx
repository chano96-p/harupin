import Image from "next/image";

import { Wordmark } from "@/components/brand/Wordmark";
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
    <main className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      <MapBackdrop />

      {/* 시안(2b)의 패널:지도 = 380:520 ≒ 42:58 비율을 폭에 상관없이 유지한다.
          380px 로 고정하면 넓은 화면에서 지도가 70% 를 넘어 화면을 잡아먹는다.
          다만 패널이 무한정 넓어지면 글줄이 길어지므로 안쪽 콘텐츠는 폭을 묶는다. */}
      <div className="flex flex-1 flex-col gap-6 px-6 pt-8 pb-10 lg:order-first lg:w-[42%] lg:max-w-180 lg:min-w-100 lg:flex-none lg:items-center lg:gap-7 lg:border-r lg:border-line lg:bg-surface lg:px-10 lg:py-12">
        <Wordmark className="text-[19px] lg:w-full lg:max-w-75 lg:text-[20px]" />

        {/* 모바일: 헤드라인은 워드마크 바로 아래, 버튼은 하단(스페이서로 밀어냄).
            데스크톱: 세로 중앙에 한 덩어리로 모은다. */}
        <div className="flex w-full flex-1 flex-col gap-5 lg:max-w-75 lg:justify-center lg:gap-6.5">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[24px] leading-[1.35] font-semibold tracking-[-0.02em] text-ink lg:text-[26px]">
              지도에 핀 찍고
              <br />
              날짜별로 정리하세요
            </h1>
            <p className="text-[14px] leading-relaxed text-ink-soft text-pretty">
              검색 → 핀 → 날짜별 정리. 여행 계획에 필요한 딱 그만큼만.
            </p>
          </div>

          <div aria-hidden className="flex-1 lg:hidden" />

          <div className="flex flex-col gap-3">
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-control border border-control-line bg-surface text-[15px] font-semibold text-ink transition-colors hover:bg-surface-hover lg:h-12 lg:text-[14.5px]"
              >
                <Image
                  src="/logo/google-g.svg"
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                  className="size-4.5 shrink-0"
                />
                Google로 계속하기
              </button>
            </form>

            {error ? (
              <p
                role="alert"
                className="text-[12.5px] leading-relaxed text-food-deep text-pretty"
              >
                로그인에 실패했습니다: {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * 지도 배경. — 실제 지도가 아니라 정적 장식이다.
 * 로그인 화면에서 Maps API 를 호출하지 않으므로 과금·키 노출이 없다.
 */
function MapBackdrop() {
  const pins = [
    { order: 1, cls: "bg-sight", left: "32%", top: "34%", size: "size-8" },
    { order: 2, cls: "bg-food", left: "60%", top: "50%", size: "size-[30px]" },
    {
      order: 3,
      cls: "bg-activity",
      left: "40%",
      top: "70%",
      size: "size-[30px]",
    },
  ];

  return (
    <div
      aria-hidden
      className="relative h-75 flex-none overflow-hidden bg-map-land lg:h-auto lg:flex-1"
    >
      {/* 수면 */}
      <div className="absolute left-[-5%] top-[60%] h-[60%] w-[120%] bg-map-water" />
      {/* 녹지 */}
      <div className="absolute left-[9%] top-[17%] h-[24%] w-[34%] rounded-md bg-map-park" />
      {/* 도로 */}
      <div className="absolute left-[-5%] top-[45%] h-2.5 w-[120%] -rotate-3 bg-map-road" />
      <div className="absolute left-[60%] top-[-5%] h-[120%] w-2 rotate-6 bg-map-road" />

      {pins.map((p) => (
        <div
          key={p.order}
          style={{ left: p.left, top: p.top }}
          className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-2 border-surface text-[13px] font-semibold text-white shadow-[0_1px_4px_rgb(31_31_29/0.18)] ${p.cls} ${p.size}`}
        >
          {p.order}
        </div>
      ))}
    </div>
  );
}
