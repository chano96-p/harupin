"use client";

import { startTransition, useActionState, useId, useState } from "react";

import { updatePlaceMemo } from "@/lib/actions/places";
import type { ActionResult } from "@/lib/actions/types";
import { MAX_PLACE_MEMO } from "@/lib/places/limits";

/**
 * 편집할 때만 마운트한다. 다시 열면 지난 실패의 에러와 입력이 남지 않는다.
 *
 * textarea 는 controlled 로 둔다. form action 은 성공·실패와 관계없이 transition 이 끝날 때
 * 폼을 리셋하므로(react-dom startHostTransition → requestFormReset), defaultValue 로 두면
 * 저장이 실패했을 때 입력한 내용이 옛 메모로 되돌아간다.
 */
export function MemoForm({
  placeId,
  initialMemo,
  onClose,
}: {
  placeId: string;
  initialMemo: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialMemo);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await updatePlaceMemo(
        placeId,
        String(formData.get("memo") ?? ""),
      );
      // await 뒤의 업데이트를 transition 에 넣어야 revalidate 된 새 메모와 함께 반영된다.
      // 밖에서 닫으면 편집창이 먼저 닫히고 옛 메모가 잠깐 보인다.
      if (!result.error) startTransition(onClose);
      return result;
    },
    {},
  );
  const memoId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={memoId} className="text-[12.5px] text-ink-mute">
        메모
      </label>
      <textarea
        id={memoId}
        name="memo"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_PLACE_MEMO}
        rows={3}
        autoFocus
        className="resize-none rounded-control border border-control-line bg-surface px-3 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none focus:border-ink"
      />
      {state.error ? (
        <p role="alert" className="text-[12.5px] text-food-deep">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-11 rounded-control border border-control-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-11 flex-1 rounded-control bg-ink text-[13px] font-semibold text-surface disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          {pending ? "저장하는 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
