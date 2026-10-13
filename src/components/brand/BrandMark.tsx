/**
 * 하루핀 앱 아이콘(오렌지 사각형 + 흰 핀). app/icon.svg 와 같은 도형이다.
 * apple-icon·OG 이미지(next/og)에서 쓰므로 CSS 변수가 아닌 값으로 칠한다
 * — globals.css 의 --color-brand 와 같아야 한다.
 */
export const BRAND_ORANGE = "#F26A3D";

export function BrandMark({
  size,
  radius = 8,
}: {
  size: number;
  /** 32 격자 기준 모서리. iOS 홈 화면은 OS 가 직접 둥글리므로 0 을 준다. */
  radius?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx={radius} fill={BRAND_ORANGE} />
      <g transform="translate(2.8 2.8) scale(1.1)">
        <path
          d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"
          fill="#fff"
        />
        <circle cx="12" cy="10" r="3" fill={BRAND_ORANGE} />
      </g>
    </svg>
  );
}
