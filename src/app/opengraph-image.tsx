import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { BrandMark } from "@/components/brand/BrandMark";

// 서비스 소개용 공용 썸네일. 하위 경로에 따로 두지 않으면 모든 페이지가 이걸 쓴다.
// 여행별 썸네일(제목·대표 사진)은 공유 링크를 만들 때 /share 아래에 따로 둔다.
// 빌드 때 한 번 만들어 정적 이미지로 내보낸다.
export const alt = "하루핀 — 지도에 핀 찍고 날짜별로 정리하는 여행 계획";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// globals.css 토큰과 같은 값. next/og 는 CSS 변수를 읽지 못한다.
const INK = "#171A18";
const INK_SOFT = "#5E625D";
const CANVAS = "#F6F5F1";
const MAP = {
  land: "#EBE7DE",
  water: "#D3E2E6",
  park: "#DCE6D4",
  road: "#F5F4F1",
};
const PINS = [
  { order: 1, color: "#318460", text: "#fff", left: 300, top: 190, size: 76 },
  { order: 2, color: "#F2A93B", text: INK, left: 360, top: 330, size: 68 },
  { order: 3, color: "#8362CC", text: "#fff", left: 210, top: 450, size: 68 },
];

export default async function OpengraphImage() {
  // OG 에 쓰는 글자만 남긴 Pretendard 서브셋(이름은 HarupinOG, scripts/build-og-fonts.py). 문구를 바꾸면 다시 만든다.
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), "src/app/fonts/og/HarupinOG-Bold.ttf")),
    readFile(join(process.cwd(), "src/app/fonts/og/HarupinOG-Regular.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: CANVAS,
        fontFamily: "HarupinOG",
      }}
    >
      <div
        style={{
          width: 640,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 48px 76px 76px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <BrandMark size={64} />
          <span style={{ fontSize: 40, fontWeight: 700, color: INK }}>
            하루핀
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: -1.5,
              color: INK,
            }}
          >
            <span>지도에 핀 찍고</span>
            <span>날짜별로 정리하세요</span>
          </div>
          {/* 한 줄로 두면 어절 중간("그만/큼만")에서 꺾인다. 의미 단위로 직접 나눈다. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.5,
              color: INK_SOFT,
            }}
          >
            <span>검색 → 핀 → 날짜별 정리.</span>
            <span>여행 계획에 필요한 딱 그만큼만.</span>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          overflow: "hidden",
          background: MAP.land,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -30,
            top: 400,
            width: 640,
            height: 300,
            background: MAP.water,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 70,
            width: 220,
            height: 160,
            borderRadius: 10,
            background: MAP.park,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -40,
            top: 290,
            width: 680,
            height: 16,
            background: MAP.road,
            transform: "rotate(-4deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 380,
            top: -40,
            width: 14,
            height: 720,
            background: MAP.road,
            transform: "rotate(6deg)",
          }}
        />
        {PINS.map((p) => (
          <div
            key={p.order}
            style={{
              position: "absolute",
              left: p.left - p.size / 2,
              top: p.top - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: p.size,
              background: p.color,
              border: "5px solid #fff",
              color: p.text,
              fontSize: p.size * 0.42,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(49, 37, 28, 0.2)",
            }}
          >
            {p.order}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "HarupinOG", data: bold, weight: 700, style: "normal" },
        { name: "HarupinOG", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
