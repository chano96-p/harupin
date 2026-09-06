"use client";

import { useActionState, useState } from "react";

import { addPlace, type AddPlaceState } from "@/lib/actions/places";
import { CATEGORIES } from "@/lib/places/categories";
import type { SelectedPlace } from "@/components/places/PlaceSearch";

export type DayOption = { id: string; dayNumber: number; date: string };

export function AddPlaceForm({
  tripId,
  days,
  place,
  onSaved,
}: {
  tripId: string;
  days: DayOption[];
  place: SelectedPlace;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<AddPlaceState, FormData>(
    async (prev, formData) => {
      const result = await addPlace(prev, formData);
      if (result.ok) onSaved();
      return result;
    },
    {},
  );
  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [dayId, setDayId] = useState<string>(days[0]?.id ?? "");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="name" value={place.name} />
      <input type="hidden" name="lat" value={place.lat} />
      <input type="hidden" name="lng" value={place.lng} />
      <input type="hidden" name="googlePlaceId" value={place.placeId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="dayId" value={dayId} />

      <div className="text-[15px] font-semibold text-ink">{place.name}</div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-ink">카테고리</span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors ${
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
        <select
          id="day"
          value={dayId}
          onChange={(e) => setDayId(e.target.value)}
          className="h-10.5 rounded-control border border-control-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-ink"
        >
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.dayNumber}일차 · {d.date.replaceAll("-", ".")}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="text-[12.5px] text-food-deep">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !dayId}
        className="h-10.5 rounded-control bg-ink text-[13.5px] font-semibold text-surface disabled:opacity-60"
      >
        {pending ? "추가하는 중…" : "이 날에 추가"}
      </button>
    </form>
  );
}
