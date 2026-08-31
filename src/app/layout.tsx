import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "하루핀",
  description: "지도에 핀 찍으며 날짜별로 동선을 짜는 여행 계획",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
