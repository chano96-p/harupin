import type { CoverExt } from "@/lib/trips/cover";

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
}

/**
 * 사진을 긴 변 maxEdge 이하로 줄여 WebP 로 만든다. 브라우저가 WebP 인코딩을 못 하면
 * (toBlob 이 다른 형식을 돌려주면) JPEG 로 만든다.
 * 휴대폰 사진의 회전 정보(EXIF)는 createImageBitmap 의 imageOrientation 으로 적용한다.
 * 흰 바탕을 먼저 칠한다 — JPEG 로 저장하면 투명한 부분이 검정이 된다.
 * 브라우저가 열 수 없는 형식(예: 일부 브라우저의 HEIC)이면 예외를 던진다.
 */
export async function resizeImage(
  file: File,
  maxEdge: number,
): Promise<{ blob: Blob; ext: CoverExt }> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 변환하지 못했습니다.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp", 0.82);
  if (webp?.type === "image/webp") return { blob: webp, ext: "webp" };
  const jpeg = await toBlob(canvas, "image/jpeg", 0.85);
  if (!jpeg) throw new Error("사진을 변환하지 못했습니다.");
  return { blob: jpeg, ext: "jpg" };
}
