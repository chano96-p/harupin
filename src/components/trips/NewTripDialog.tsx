"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  closeDialog,
  Dialog,
  FIELD_CLASS,
  LABEL_CLASS,
} from "@/components/ui/Dialog";
import { createTrip } from "@/lib/actions/trips";
import type { ActionResult } from "@/lib/actions/types";
import { countDays, shiftDate } from "@/lib/trips/dates";
import { MAX_TRIP_DAYS, MAX_TRIP_TITLE } from "@/lib/trips/limits";

export function NewTripDialog({ open }: { open: boolean }) {
  const router = useRouter();

  return (
    <Dialog open={open} onClose={() => router.replace("/", { scroll: false })}>
      <NewTripForm />
    </Dialog>
  );
}

function NewTripForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createTrip,
    {},
  );
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const days = start && end && end >= start ? countDays(start, end) : 0;

  function resetAll() {
    formRef.current?.reset();
    setStart("");
    setEnd("");
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4.5">
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">새 여행</h2>

      <div className="flex flex-col gap-1.75">
        <label className={LABEL_CLASS} htmlFor="title">
          여행 제목
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={MAX_TRIP_TITLE}
          placeholder="예: 제주 봄 3박 4일"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.75">
        <span className={LABEL_CLASS}>기간</span>
        <div className="flex gap-2.5 lg:gap-3">
          <input
            type="date"
            name="startDate"
            required
            aria-label="시작일"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={FIELD_CLASS}
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
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed text-ink-soft lg:text-[12px]">
        {days > 0
          ? `저장하면 ${days}일차까지 자동 생성됩니다.`
          : `기간을 정하면 일차가 자동으로 만들어집니다. 최대 ${MAX_TRIP_DAYS}일.`}
      </p>

      {state.error ? (
        <p role="alert" className="text-[12.5px] text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5 lg:flex-row lg:justify-end">
        <button
          type="submit"
          disabled={pending}
          className="order-first h-13 rounded-control bg-brand-deep px-5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deeper disabled:opacity-60 lg:order-last lg:h-11 lg:text-[14px]"
        >
          {pending ? "만드는 중…" : "만들기"}
        </button>
        <button
          type="button"
          onClick={closeDialog}
          className="h-12 rounded-control px-3.5 text-[14.5px] font-bold text-ink transition-colors hover:bg-surface-hover lg:hidden"
        >
          취소
        </button>
        {/* type="reset" 은 DOM 값만 되돌려서 제어 컴포넌트인 날짜가 즉시 복원된다.
            state 도 함께 비운다. */}
        <button
          type="button"
          onClick={resetAll}
          className="hidden rounded-control px-4 text-[14px] font-bold text-ink transition-colors hover:bg-surface-hover lg:block"
        >
          초기화
        </button>
      </div>
    </form>
  );
}
