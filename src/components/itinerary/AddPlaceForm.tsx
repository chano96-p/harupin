"use client";

import { useActionState, useState } from "react";

import { SelectField } from "@/components/ui/SelectField";
import { addPlace, type AddPlaceState } from "@/lib/actions/places";
import { CATEGORIES } from "@/lib/places/categories";
import type { SelectedPlace } from "@/lib/places/types";
import { formatDate } from "@/lib/trips/format";
import type { Day } from "@/lib/trips/types";

export function AddPlaceForm({
  tripId,
  days,
  defaultDayId,
  place,
  onSaved,
  onCancel,
}: {
  tripId: string;
  days: Pick<Day, "id" | "dayNumber" | "date">[];
  defaultDayId: string;
  place: SelectedPlace;
  onSaved: (dayId: string, placeId: string) => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState<AddPlaceState, FormData>(
    async (prev, formData) => {
      const result = await addPlace(prev, formData);
      if (result.ok) onSaved(String(formData.get("dayId")), place.placeId);
      return result;
    },
    {},
  );
  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [dayId, setDayId] = useState<string>(defaultDayId);

  return (
    <form
      action={action}
      className="flex flex-col gap-3.5 rounded-panel border border-line bg-surface p-5 shadow-pop"
    >
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="name" value={place.name} />
      <input type="hidden" name="lat" value={place.lat} />
      <input type="hidden" name="lng" value={place.lng} />
      <input type="hidden" name="googlePlaceId" value={place.placeId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="dayId" value={dayId} />

      <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">
        {place.name}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-ink">카테고리</span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12.5px] font-bold transition-colors ${
                category === c.value
                  ? `${c.tint} ${c.deep}`
                  : "border border-line text-ink-soft hover:bg-surface-hover"
              }`}
            >
              <span className={`size-1.75 rounded-pill ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold text-ink" htmlFor="day">
          어느 날
        </label>
        <SelectField
          id="day"
          value={dayId}
          onChange={(e) => setDayId(e.target.value)}
          className="h-11"
        >
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.dayNumber}일차 · {formatDate(d.date)}
            </option>
          ))}
        </SelectField>
      </div>

      {state.error ? (
        <p role="alert" className="text-[12.5px] text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-11 rounded-control border border-control-line px-4 text-[13.5px] font-bold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending || !dayId}
          className="h-11 flex-1 rounded-control bg-brand-deep text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deeper disabled:opacity-60"
        >
          {pending ? "추가하는 중…" : "이 날에 추가"}
        </button>
      </div>
    </form>
  );
}
