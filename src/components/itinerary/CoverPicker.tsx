"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { setTripCover } from "@/lib/actions/trips";
import { createClient } from "@/lib/supabase/client";
import {
  buildCoverPath,
  COVER_BUCKET,
  COVER_MAX_BYTES,
  COVER_MAX_EDGE,
} from "@/lib/trips/cover";
import { resizeImage } from "@/lib/ui/image";

/**
 * 여행 대표 사진 고르기 (홈 카드 커버). 고르는 즉시 올리고 저장한다 — 설정 폼의 "저장" 과 따로 간다.
 * 사진은 브라우저에서 줄인 뒤 Storage 에 바로 올린다(Server Action 은 본문 1MB 제한이 있다).
 * 저장(setTripCover)이 실패하면 방금 올린 파일을 지워 버킷에 고아 파일이 남지 않게 한다.
 */
export function CoverPicker({
  tripId,
  coverUrl,
}: {
  tripId: string;
  coverUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 실패하면 사용자에게 보여줄 문구를, 성공하면 null 을 돌려준다.
  async function upload(file: File): Promise<string | null> {
    let image;
    try {
      image = await resizeImage(file, COVER_MAX_EDGE);
    } catch {
      return "이 사진은 열 수 없어요. JPG나 PNG 사진으로 골라주세요.";
    }
    if (image.blob.size > COVER_MAX_BYTES) return "사진이 너무 커요.";

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "로그인이 필요합니다.";

    const path = buildCoverPath(user.id, tripId, image.ext);
    const bucket = supabase.storage.from(COVER_BUCKET);
    // 파일 이름이 매번 새 uuid 라 같은 주소의 내용이 바뀌지 않는다. 오래 캐시해도 된다.
    const { error: uploadError } = await bucket.upload(path, image.blob, {
      contentType: image.blob.type,
      cacheControl: "31536000",
    });
    if (uploadError) {
      console.error("대표 사진 업로드 실패", uploadError);
      return "사진을 올리지 못했습니다.";
    }

    const result = await setTripCover(tripId, path);
    if (result.error) {
      await bucket.remove([path]);
      return result.error;
    }
    return null;
  }

  // 폼 action 밖에서 Server Action 을 부르므로 transition 으로 감싼다(삭제·순서 저장과 같은 방식).
  function run(task: () => Promise<string | null>) {
    setError(null);
    startTransition(async () => {
      const message = await task();
      if (message) startTransition(() => setError(message));
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 change 가 나도록 비운다.
    e.target.value = "";
    if (file) run(() => upload(file));
  }

  return (
    <div className="flex flex-col gap-1.75">
      <span className="text-[13px] font-bold text-ink">대표 사진</span>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-24 flex-none overflow-hidden rounded-control border border-line bg-sunken">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              unoptimized
              sizes="96px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="h-10 rounded-control border border-control-line px-3.5 text-[13px] font-bold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            {pending ? "처리하는 중…" : coverUrl ? "사진 변경" : "사진 선택"}
          </button>
          {coverUrl ? (
            <button
              type="button"
              onClick={() =>
                run(
                  async () => (await setTripCover(tripId, null)).error ?? null,
                )
              }
              disabled={pending}
              className="h-10 rounded-control px-3 text-[13px] font-bold text-danger transition-colors hover:bg-danger-tint disabled:opacity-60"
            >
              사진 삭제
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          aria-label="대표 사진 파일"
        />
      </div>
      {error ? (
        <p role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
