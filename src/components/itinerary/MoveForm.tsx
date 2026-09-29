"use client";

import { startTransition, useActionState, useId, useState } from "react";

import { SelectField } from "@/components/ui/SelectField";
import { movePlace } from "@/lib/actions/places";
import type { ActionResult } from "@/lib/actions/types";
import { formatDayDate } from "@/lib/trips/format";
import type { Day } from "@/lib/trips/types";

/**
 * 편집할 때만 마운트한다(MemoForm 과 같은 이유). select 도 controlled 로 둔다.
 * 옮긴 장소는 받는 Day 의 맨 뒤에 붙는다(move_place).
 */
export function MoveForm({
  placeId,
  days,
  currentDayId,
  onMoved,
  onClose,
}: {
  placeId: string;
  days: Day[];
  currentDayId: string;
  onMoved: (dayId: string) => void;
  onClose: () => void;
}) {
  const targets = days.filter((d) => d.id !== currentDayId);
  // 기본값은 다음 날. 마지막 날이면 첫 후보(보통 전날까지 중 첫째 날)로.
  const currentIndex = days.findIndex((d) => d.id === currentDayId);
  const [toDayId, setToDayId] = useState(
    days[currentIndex + 1]?.id ?? targets[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async () => {
      const result = await movePlace(placeId, toDayId);
      // 탭 이동을 revalidate 된 새 목록과 같은 transition 에 넣는다.
      // 따로 반영되면 옮겨 간 Day 탭이 잠깐 이 장소 없이 보인다.
      if (!result.error) {
        startTransition(() => {
          onMoved(toDayId);
          onClose();
        });
      }
      return result;
    },
    {},
  );
  const selectId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-[12.5px] text-ink-mute">
        옮길 일차
      </label>
      <SelectField
        id={selectId}
        value={toDayId}
        onChange={(e) => setToDayId(e.target.value)}
        disabled={pending}
        autoFocus
        className="h-11 lg:h-10"
      >
        {targets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.dayNumber}일차 · {formatDayDate(d.date)}
          </option>
        ))}
      </SelectField>
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
          disabled={pending || !toDayId}
          className="h-11 flex-1 rounded-control bg-ink text-[13px] font-semibold text-surface disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          {pending ? "옮기는 중…" : "옮기기"}
        </button>
      </div>
    </form>
  );
}
