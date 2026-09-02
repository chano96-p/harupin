"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createTrip, type CreateTripState } from "@/lib/actions/trips";
import { MAX_TRIP_DAYS } from "@/lib/trips/limits";

const FIELD =
  "h-12 w-full rounded-control border border-control-line bg-surface px-3.25 text-[15px] text-ink outline-none placeholder:text-ink-mute focus:border-ink lg:h-10.5 lg:px-3 lg:text-[14px]";
const LABEL = "text-[12.5px] font-semibold text-ink";
const DAY_MS = 86_400_000;

function shiftDate(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function NewTripDialog({ open }: { open: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // 백드롭 클릭으로 닫기.
  function closeOnBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    const el = ref.current;
    if (!el || e.target !== el) return;
    const r = el.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) el.close();
  }

  return (
    <dialog
      ref={ref}
      onClick={closeOnBackdrop}
      onClose={() => router.replace("/", { scroll: false })}
      className="rounded-card m-0 mt-auto w-full max-w-none rounded-b-none bg-surface p-6 text-ink shadow-[0_8px_28px_rgb(31_31_29/0.18)] backdrop:bg-[rgb(31_31_29/0.32)] lg:m-auto lg:w-105 lg:rounded-b-card"
    >
      {/* 열릴 때마다 새로 마운트한다. 이전 제출의 에러와 입력값이 남지 않는다. */}
      {open ? <NewTripForm onCancel={() => ref.current?.close()} /> : null}
    </dialog>
  );
}

function NewTripForm({ onCancel }: { onCancel: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<CreateTripState, FormData>(
    createTrip,
    {},
  );
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const days =
    start && end && end >= start
      ? Math.round(
          (new Date(end).getTime() - new Date(start).getTime()) / DAY_MS,
        ) + 1
      : 0;

  function resetAll() {
    formRef.current?.reset();
    setStart("");
    setEnd("");
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4.5">
      <h2 className="text-[18px] font-semibold tracking-[-0.01em]">새 여행</h2>

      <div className="flex flex-col gap-1.75">
        <label className={LABEL} htmlFor="title">
          여행 제목
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={100}
          placeholder="예: 제주 봄 3박 4일"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1.75">
        <span className={LABEL}>기간</span>
        <div className="flex gap-2.5 lg:gap-3">
          <input
            type="date"
            name="startDate"
            required
            aria-label="시작일"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={FIELD}
          />
          <input
            type="date"
            name="endDate"
            required
            aria-label="종료일"
            min={start || undefined}
            max={start ? shiftDate(start, MAX_TRIP_DAYS - 1) : undefined}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed text-ink-soft lg:text-[12px]">
        {days > 0
          ? `저장하면 ${days}일차까지 자동 생성됩니다.`
          : `기간을 정하면 일차가 자동으로 만들어집니다. 최대 ${MAX_TRIP_DAYS}일.`}
      </p>

      {state.error ? (
        <p role="alert" className="text-[12.5px] text-food-deep">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5 lg:flex-row lg:justify-end">
        <button
          type="submit"
          disabled={pending}
          className="order-first h-13 rounded-control bg-ink px-5 text-[15px] font-semibold text-surface disabled:opacity-60 lg:order-last lg:h-10.5 lg:text-[13.5px]"
        >
          {pending ? "만드는 중…" : "만들기"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-control px-3.5 text-[14.5px] font-semibold text-ink-soft transition-colors hover:bg-surface-hover lg:hidden"
        >
          취소
        </button>
        {/* type="reset" 은 DOM 값만 되돌려서 제어 컴포넌트인 날짜가 즉시 복원된다.
            state 도 함께 비운다. */}
        <button
          type="button"
          onClick={resetAll}
          className="hidden rounded-control px-3.5 text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-surface-hover lg:block"
        >
          초기화
        </button>
      </div>
    </form>
  );
}
