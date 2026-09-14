"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { ItineraryPanel } from "@/components/itinerary/ItineraryPanel";
import { MapPanel } from "@/components/map/MapPanel";
import {
  PlaceSearch,
  type SelectedPlace,
} from "@/components/places/PlaceSearch";
import { AddPlaceForm } from "@/components/trips/AddPlaceForm";
import { formatTripRange } from "@/lib/trips/format";

export type EditorPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
};
export type EditorDay = {
  id: string;
  dayNumber: number;
  date: string;
  places: EditorPlace[];
};
export type EditorTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  region: string | null;
};

/**
 * 일정 편집 화면. 시안 1a(데스크톱 스플릿 뷰) / 1b(모바일 지도 + 바텀시트).
 *
 * 지도는 하나만 띄운다. 브레이크포인트마다 따로 두면 Maps 로드가 두 번 과금된다.
 * 모바일에서는 지도가 전면에 깔리고 패널이 그 위에 시트로 뜨며,
 * lg 부터는 같은 두 요소가 좌우 스플릿으로 배치된다.
 */
export function TripEditor({
  trip,
  days,
}: {
  trip: EditorTrip;
  days: EditorDay[];
}) {
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  // 저장은 폼이 사라진 뒤(다른 장소 선택)에도 끝까지 진행된다.
  // 늦게 끝난 저장이 그사이 고른 장소와 보던 탭을 덮지 않도록, 완료 시점의 선택과 비교한다.
  const selectedIdRef = useRef<string | null>(null);

  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0];

  function selectPlace(place: SelectedPlace | null) {
    selectedIdRef.current = place?.placeId ?? null;
    setSelected(place);
  }

  function focusSearch() {
    setSheetExpanded(false);
    searchRef.current?.focus();
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <h1 className="sr-only lg:hidden">{trip.title}</h1>
      <header className="hidden h-16 flex-none items-center gap-3.5 border-b border-line bg-surface px-5.5 lg:flex">
        <Link href="/">
          <Wordmark className="text-[16px]" />
        </Link>
        <span aria-hidden className="h-6.5 w-px bg-line" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-ink">
            {trip.title}
          </h1>
          <p className="text-[12px] text-ink-soft">
            {formatTripRange(trip.startDate, trip.endDate)}
            {trip.region ? ` · ${trip.region}` : ""}
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 lg:flex">
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:order-2 lg:flex-1">
          <MapPanel pins={activeDay?.places ?? []} selected={selected} />

          {/* 오버레이 줄 전체가 지도 드래그를 막지 않게 컨테이너는 이벤트를 통과시킨다.
              z-10: 모바일에서 검색 목록·추가 폼이 바텀시트에 가리지 않게 한다. */}
          <div className="pointer-events-none absolute inset-x-3.5 top-3.5 z-10 flex flex-col gap-2 lg:inset-x-5 lg:top-4.5">
            <div className="flex gap-2">
              <Link
                href="/"
                aria-label="내 여행 목록"
                className="pointer-events-auto grid size-11 flex-none place-items-center rounded-pill border border-line bg-surface text-ink shadow-overlay lg:hidden"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </Link>
              <div className="pointer-events-auto min-w-0 flex-1">
                <PlaceSearch inputRef={searchRef} onSelect={selectPlace} />
              </div>
            </div>

            {selected && activeDay ? (
              <div className="pointer-events-auto lg:max-w-95">
                <AddPlaceForm
                  key={selected.placeId}
                  tripId={trip.id}
                  days={days}
                  defaultDayId={activeDay.id}
                  place={selected}
                  onCancel={() => selectPlace(null)}
                  // 목록 갱신은 addPlace 의 revalidatePath 가 처리한다.
                  // 저장한 Day 로 탭을 옮겨야 방금 추가한 핀이 보인다.
                  onSaved={(dayId, placeId) => {
                    if (selectedIdRef.current !== placeId) return;
                    selectPlace(null);
                    setActiveDayId(dayId);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {activeDay ? (
          <ItineraryPanel
            days={days}
            activeDay={activeDay}
            onSelectDay={setActiveDayId}
            expanded={sheetExpanded}
            onToggleExpanded={() => setSheetExpanded((v) => !v)}
            onAddPlace={focusSearch}
          />
        ) : null}
      </div>
    </div>
  );
}
