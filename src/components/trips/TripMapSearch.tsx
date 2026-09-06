"use client";

import { useState } from "react";

import { MapPanel } from "@/components/map/MapPanel";
import {
  PlaceSearch,
  type SelectedPlace,
} from "@/components/places/PlaceSearch";
import { AddPlaceForm, type DayOption } from "@/components/trips/AddPlaceForm";

/**
 * 로드맵 4~5번 자리 — 검색 → 지도에 핀 → Day 에 저장.
 * 시안 1a(데스크톱 스플릿 뷰)의 정식 레이아웃은 6번에서 만든다.
 */
export function TripMapSearch({
  tripId,
  days,
}: {
  tripId: string;
  days: DayOption[];
}) {
  const [selected, setSelected] = useState<SelectedPlace | null>(null);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative h-95 overflow-hidden rounded-card border border-line">
        <MapPanel marker={selected ?? undefined} />
        <div className="absolute top-3.5 left-3.5">
          <PlaceSearch onSelect={setSelected} />
        </div>
      </div>

      {selected ? (
        <AddPlaceForm
          tripId={tripId}
          days={days}
          place={selected}
          // 목록 갱신은 addPlace 의 revalidatePath 가 이미 처리한다.
          // 여기서 router.refresh() 까지 부르면 RSC 왕복이 한 번 더 생긴다.
          onSaved={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
