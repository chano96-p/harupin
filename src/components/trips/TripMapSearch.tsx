"use client";

import { useState } from "react";

import { MapPanel } from "@/components/map/MapPanel";
import {
  PlaceSearch,
  type SelectedPlace,
} from "@/components/places/PlaceSearch";

/**
 * 로드맵 4번 자리 — 검색 → 지도에 핀만 확인한다. 아직 저장하지 않는다
 * (Day 에 저장은 5번). 그래서 선택 상태는 이 컴포넌트 안 useState 로만 두고,
 * 새로고침하면 사라지는 게 지금은 맞는 동작이다.
 *
 * 시안 1a(데스크톱 스플릿 뷰)의 정식 레이아웃은 6번에서 만든다. 지금은
 * 검색이 실제로 동작하는지 보여주는 임시 자리다.
 */
export function TripMapSearch() {
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
        <p className="text-[13px] text-ink-soft">
          <span className="font-semibold text-ink">{selected.name}</span> 선택됨
          · 아직 저장되지 않았습니다.
        </p>
      ) : null}
    </div>
  );
}
