import Image from "next/image";

import { Wordmark } from "@/components/brand/Wordmark";
import { Calendar, Cloud, MapFold } from "@/components/ui/icons";
import { signInWithGoogle } from "@/lib/actions/auth";

export const metadata = {
  title: "로그인 · 하루핀",
};

const FEATURES = [
  { Icon: MapFold, text: "지도에서 동선을 한눈에 확인" },
  { Icon: Calendar, text: "날짜별 일정을 빠르게 정리" },
  { Icon: Cloud, text: "모든 기기에서 안전하게 동기화" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col bg-warm lg:flex-row">
      <TravelStory />

      <div className="flex flex-1 flex-col items-center px-5 pt-0 pb-10 lg:justify-center lg:px-12 lg:py-12">
        {/* 모바일은 카드가 사진 아래쪽을 살짝 덮는다. */}
        <div className="relative -mt-8 flex w-full max-w-110 flex-col gap-6 rounded-panel border border-line bg-surface p-6 shadow-pop lg:mt-0 lg:gap-7 lg:p-9">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[24px] leading-[1.3] font-bold tracking-[-0.02em] text-ink lg:text-[30px]">
              다시 만나 반가워요
            </h1>
            <p className="text-[14px] leading-relaxed text-ink-soft text-pretty lg:text-[15px]">
              Google 계정으로 간편하게 시작하고 내 여행 일정을 어디서든 이어서
              정리하세요.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-control border border-control-line bg-surface text-[15px] font-bold text-ink transition-colors hover:bg-surface-hover"
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
                className="text-[12.5px] leading-relaxed text-danger text-pretty"
              >
                로그인에 실패했습니다: {error}
              </p>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2.5">
            {FEATURES.map(({ Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-[13.5px] text-ink-soft"
              >
                <Icon className="size-4 flex-none text-brand" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function TravelStory() {
  return (
    <div className="relative flex h-90 flex-none flex-col justify-between overflow-hidden p-5 pb-14 lg:h-auto lg:w-[54%] lg:p-12">
      <MapIllustration />
      {/* 아래쪽 카피가 도로·핀과 겹쳐도 읽히게 바탕색으로 덮는다. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent via-warm/85 to-warm"
      />

      <Wordmark className="relative text-[21px]" />

      <div className="relative flex flex-col gap-3 lg:max-w-155 lg:gap-5">
        <span className="self-start rounded-pill border border-line bg-surface/80 px-3 py-1.75 text-[12px] font-bold text-brand-deep">
          여행의 모든 순간을 한눈에
        </span>
        <p className="text-[30px] leading-[1.15] font-bold tracking-[-0.03em] text-ink lg:text-[54px] lg:leading-[1.12]">
          설렘은 그대로,
          <br />
          일정은 더 가볍게.
        </p>
        <p className="hidden max-w-130 text-[17px] leading-[1.65] text-ink-soft lg:block">
          지도 위에서 장소를 모으고, 날짜별 동선을 정리하세요. 하루핀이 복잡한
          여행 준비를 즐거운 계획으로 바꿔드려요.
        </p>
      </div>
    </div>
  );
}

const ROUTE = [
  { x: 250, y: 250, fill: "var(--color-sight)", text: "white" },
  { x: 470, y: 330, fill: "var(--color-food)", text: "var(--color-ink)" },
  { x: 600, y: 190, fill: "var(--color-activity)", text: "white" },
  { x: 650, y: 460, fill: "var(--color-lodging)", text: "white" },
];

/**
 * 장식용 지도. 실제 지도가 아니라 SVG 로 그린 일러스트라 Maps API 를 호출하지 않는다.
 * slice 로 채워서 모바일(가로로 넓음)·데스크톱(세로로 김) 어느 비율에서도 빈틈이 없다.
 * 핀과 동선은 위쪽 절반에 모아 아래쪽 카피와 겹치지 않게 한다.
 */
function MapIllustration() {
  const [first, ...rest] = ROUTE;
  const route = `M${first.x} ${first.y} ${rest.map((p) => `L${p.x} ${p.y}`).join(" ")}`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMin slice"
      className="absolute inset-0 size-full"
    >
      <rect width="800" height="1000" fill="var(--color-map-land)" />

      <path
        d="M520 -20 C560 70 640 110 700 150 C760 190 800 240 820 250 L820 -20 Z"
        fill="var(--color-map-water)"
      />
      <path
        d="M-20 330 C60 360 110 420 90 520 C80 580 20 610 -20 620 Z"
        fill="var(--color-map-water)"
      />
      <rect
        x="290"
        y="100"
        width="170"
        height="120"
        rx="28"
        fill="var(--color-map-park)"
      />
      <rect
        x="420"
        y="420"
        width="150"
        height="110"
        rx="24"
        fill="var(--color-map-park)"
      />

      <g stroke="white" strokeLinecap="round" fill="none">
        <g strokeWidth="6">
          {[140, 300, 420, 560].map((y) => (
            <path key={`h${y}`} d={`M-20 ${y} L820 ${y - 40}`} />
          ))}
          {[120, 360, 540].map((x) => (
            <path key={`v${x}`} d={`M${x} -20 L${x + 50} 1020`} />
          ))}
        </g>
        <path d="M-20 700 C200 620 420 380 820 260" strokeWidth="16" />
        <path d="M200 -20 C260 300 180 600 300 1020" strokeWidth="12" />
      </g>

      <path
        d={route}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 14"
      />

      {ROUTE.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y + 4} r="24" fill="rgb(49 37 28 / 0.12)" />
          <circle
            cx={p.x}
            cy={p.y}
            r="24"
            fill={p.fill}
            stroke="white"
            strokeWidth="5"
          />
          <text
            x={p.x}
            y={p.y}
            dy="0.35em"
            textAnchor="middle"
            fill={p.text}
            fontSize="20"
            fontWeight="700"
          >
            {i + 1}
          </text>
        </g>
      ))}

      <g transform={`translate(${first.x - 62} ${first.y - 78})`}>
        <rect
          y="3"
          width="124"
          height="36"
          rx="10"
          fill="rgb(49 37 28 / 0.08)"
        />
        <rect width="124" height="36" rx="10" fill="white" />
        <text
          x="62"
          y="18"
          dy="0.35em"
          textAnchor="middle"
          fill="var(--color-ink)"
          fontSize="15"
          fontWeight="700"
        >
          1일차 · 4곳
        </text>
      </g>
    </svg>
  );
}
