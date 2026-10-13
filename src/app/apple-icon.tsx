import { ImageResponse } from "next/og";

import { BrandMark } from "@/components/brand/BrandMark";

// iOS 홈 화면·Safari 즐겨찾기용. Safari 는 SVG 파비콘(app/icon.svg)을 쓰지 않는 버전이 있어
// 이 PNG 로도 아이콘이 보이게 한다.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS 가 모서리를 직접 둥글리므로 사각형 그대로 둔다.
  return new ImageResponse(<BrandMark size={180} radius={0} />, size);
}
