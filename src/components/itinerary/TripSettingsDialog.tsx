"use client";

import { startTransition, useActionState, useState } from "react";

import {
  closeDialog,
  Dialog,
  FIELD_CLASS,
  LABEL_CLASS,
} from "@/components/ui/Dialog";
import {
  deleteTrip,
  updateTrip,
  type UpdateTripState,
} from "@/lib/actions/trips";
import type { ActionResult } from "@/lib/actions/types";
import { countDays, shiftDate } from "@/lib/trips/dates";
import {
  MAX_TRIP_DAYS,
  MAX_TRIP_REGION,
  MAX_TRIP_TITLE,
} from "@/lib/trips/limits";
import type { Trip } from "@/lib/trips/types";

/**
 * 여행 설정(시안 3b) → 같은 다이얼로그 안에서 삭제 확인(3c)으로 넘어간다.
 * minDayCount: 장소가 있는 마지막 일차. 기간은 여기까지만 줄일 수 있다(update_trip).
 * dayCount·placeCount 는 삭제 확인 문구에도 쓴다.
 */
export function TripSettingsDialog({
  open,
  onClose,
  trip,
  dayCount,
  minDayCount,
  placeCount,
}: {
  open: boolean;
  onClose: () => void;
  trip: Trip;
  dayCount: number;
  minDayCount: number;
  placeCount: number;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <SettingsBody
        trip={trip}
        dayCount={dayCount}
        minDayCount={minDayCount}
        placeCount={placeCount}
        onSaved={onClose}
      />
    </Dialog>
  );
}

function SettingsBody({
  trip,
  dayCount,
  minDayCount,
  placeCount,
  onSaved,
}: {
  trip: Trip;
  dayCount: number;
  minDayCount: number;
  placeCount: number;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<"edit" | "delete">("edit");

  return step === "edit" ? (
    <EditForm
      trip={trip}
      dayCount={dayCount}
      minDayCount={minDayCount}
      onSaved={onSaved}
      onDelete={() => setStep("delete")}
    />
  ) : (
    <DeleteConfirm
      trip={trip}
      dayCount={dayCount}
      placeCount={placeCount}
      onBack={() => setStep("edit")}
    />
  );
}

function EditForm({
  trip,
  dayCount,
  minDayCount,
  onSaved,
  onDelete,
}: {
  trip: Trip;
  dayCount: number;
  minDayCount: number;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [state, action, pending] = useActionState<UpdateTripState, FormData>(
    async (prev, formData) => {
      const result = await updateTrip(prev, formData);
      // 새 기간·제목이 반영된 화면과 함께 닫히도록 transition 안에서 닫는다.
      if (result.ok) startTransition(onSaved);
      return result;
    },
    {},
  );
  // 날짜는 controlled 로 둔다. form action 은 제출 뒤 폼을 리셋해서
  // defaultValue 로 두면 저장이 실패했을 때 고친 날짜가 원래 값으로 돌아간다.
  const [title, setTitle] = useState(trip.title);
  const [region, setRegion] = useState(trip.region ?? "");
  const [start, setStart] = useState(trip.startDate);
  const [end, setEnd] = useState(trip.endDate);

  const days = start && end && end >= start ? countDays(start, end) : 0;

  // 시작일을 옮기면 지금 일수를 유지한 채 종료일도 따라간다(여행을 통째로 옮김).
  function changeStart(next: string) {
    setStart(next);
    if (next) setEnd(shiftDate(next, (days || dayCount) - 1));
  }

  return (
    <form action={action} className="flex flex-col gap-4.5">
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">여행 설정</h2>
      <input type="hidden" name="tripId" value={trip.id} />

      <div className="flex flex-col gap-1.75">
        <label className={LABEL_CLASS} htmlFor="trip-title">
          여행 제목
        </label>
        <input
          id="trip-title"
          name="title"
          required
          maxLength={MAX_TRIP_TITLE}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.75">
        <label className={LABEL_CLASS} htmlFor="trip-region">
          지역 <span className="font-normal text-ink-mute">(선택)</span>
        </label>
        <input
          id="trip-region"
          name="region"
          maxLength={MAX_TRIP_REGION}
          placeholder="예: 제주"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
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
            onChange={(e) => changeStart(e.target.value)}
            className={FIELD_CLASS}
          />
          <input
            type="date"
            name="endDate"
            required
            aria-label="종료일"
            min={start ? shiftDate(start, minDayCount - 1) : undefined}
            max={start ? shiftDate(start, MAX_TRIP_DAYS - 1) : undefined}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-soft lg:text-[12px]">
          {days > dayCount
            ? `${days - dayCount}일이 뒤에 추가됩니다. 지금 일정은 그대로 남습니다.`
            : days > 0 && days < dayCount
              ? `뒤의 빈 일차 ${dayCount - days}일이 삭제됩니다.`
              : minDayCount > 1
                ? `${minDayCount}일차에 장소가 있어 ${minDayCount}일보다 짧게 줄일 수는 없어요.`
                : "기간을 바꾸면 일차가 새 날짜에 맞춰 다시 매겨집니다."}
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="text-[12.5px] text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="order-last h-12 rounded-control px-3.5 text-[14px] font-bold text-danger transition-colors hover:bg-danger-tint disabled:opacity-60 lg:order-first lg:mr-auto lg:h-11"
        >
          여행 삭제
        </button>
        <button
          type="button"
          onClick={closeDialog}
          disabled={pending}
          className="hidden h-11 rounded-control px-4 text-[14px] font-bold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60 lg:block"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="order-first h-13 rounded-control bg-brand-deep px-5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deeper disabled:opacity-60 lg:order-0 lg:h-11 lg:text-[14px]"
        >
          {pending ? "저장하는 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({
  trip,
  dayCount,
  placeCount,
  onBack,
}: {
  trip: Trip;
  dayCount: number;
  placeCount: number;
  onBack: () => void;
}) {
  // 성공하면 deleteTrip 이 홈으로 redirect 한다.
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    deleteTrip,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tripId" value={trip.id} />
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">
        이 여행을 삭제할까요?
      </h2>
      <p className="text-[14px] leading-relaxed text-ink-soft text-pretty">
        <strong className="font-bold text-ink">{trip.title}</strong>의{" "}
        {dayCount}일차와 장소 {placeCount}곳이 함께 삭제됩니다. 되돌릴 수
        없습니다.
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
          className="order-first h-13 rounded-control bg-danger px-5 text-[15px] font-bold text-white transition-colors hover:opacity-90 disabled:opacity-60 lg:order-last lg:h-11 lg:text-[14px]"
        >
          {pending ? "삭제하는 중…" : "삭제"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          autoFocus
          className="h-12 rounded-control px-4 text-[14.5px] font-bold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60 lg:h-11 lg:text-[14px]"
        >
          취소
        </button>
      </div>
    </form>
  );
}
