// app/icon.svg 로 app/favicon.ico(16·32·48px PNG 를 담은 ICO)를 만든다.
// <link> 를 읽지 않고 /favicon.ico 를 바로 요청하는 크롤러·구형 클라이언트용이다.
// Next 는 favicon 을 코드로 생성할 수 없어(파일만 지원) 미리 만들어 커밋한다.
// icon.svg 를 바꾸면 다시 실행한다:  node scripts/build-favicon.mjs
import { readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
// next 는 exports 맵이 없어 ESM 에서는 확장자까지 적어야 한다.
import { ImageResponse } from "next/og.js";

const SIZES = [16, 32, 48];
const svg = await readFile("src/app/icon.svg", "utf8");
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const pngs = await Promise.all(
  SIZES.map(async (size) => {
    const res = new ImageResponse(
      createElement("img", { src, width: size, height: size }),
      { width: size, height: size },
    );
    return Buffer.from(await res.arrayBuffer());
  }),
);

// ICO = 헤더(6) + 항목(16 × n) + PNG 본문들. 항목의 크기 0 은 256 을 뜻하므로 그대로 쓴다.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length;
const entries = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(SIZES[i], 0);
  e.writeUInt8(SIZES[i], 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});

await writeFile(
  "src/app/favicon.ico",
  Buffer.concat([header, ...entries, ...pngs]),
);
console.log("src/app/favicon.ico", SIZES.join("·"));
