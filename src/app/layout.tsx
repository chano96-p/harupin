import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// 자체 호스팅. CDN 다이내믹 서브셋(약 40KB)보다 무겁지만 외부 요청이 없다.
// 직접 서브셋하지 않는 이유: 장소 이름이 Google Places 에서 오므로 어떤 음절이
// 들어올지 미리 알 수 없고, 빠진 글자는 사용자 데이터에서 두부로 깨진다.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 930",
  variable: "--font-pretendard",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "하루핀",
  description: "지도에 핀 찍으며 날짜별로 동선을 짜는 여행 계획",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
