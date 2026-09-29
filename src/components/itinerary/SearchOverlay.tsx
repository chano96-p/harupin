import Link from "next/link";
import type { Ref } from "react";

import { AddPlaceForm } from "@/components/itinerary/AddPlaceForm";
import { PlaceSearch } from "@/components/places/PlaceSearch";
import { ArrowLeft } from "@/components/ui/icons";
import type { SelectedPlace } from "@/lib/places/types";
import type { Day } from "@/lib/trips/types";

/**
 * 지도 위 오버레이: 모바일 뒤로가기 + 장소 검색 + 고른 장소의 추가 폼.
 * 오버레이 줄 전체가 지도 드래그를 막지 않게 컨테이너는 이벤트를 통과시킨다.
 * z-10: 모바일에서 검색 목록·추가 폼이 바텀시트에 가리지 않게 한다.
 */
export function SearchOverlay({
  tripId,
  days,
  activeDayId,
  selected,
  searchRef,
  onSelect,
  onSaved,
}: {
  tripId: string;
  days: Day[];
  activeDayId: string | null;
  selected: SelectedPlace | null;
  searchRef: Ref<HTMLInputElement>;
  onSelect: (place: SelectedPlace | null) => void;
  onSaved: (dayId: string, placeId: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-3.5 top-3.5 z-10 flex flex-col gap-2 lg:inset-x-6 lg:top-5">
      <div className="flex gap-2">
        <Link
          href="/"
          aria-label="내 여행 목록"
          className="pointer-events-auto grid size-12 flex-none place-items-center rounded-pill border border-line bg-surface text-ink shadow-overlay lg:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="pointer-events-auto min-w-0 flex-1">
          <PlaceSearch inputRef={searchRef} onSelect={onSelect} />
        </div>
      </div>

      {selected && activeDayId ? (
        <div className="pointer-events-auto lg:max-w-95">
          <AddPlaceForm
            key={selected.placeId}
            tripId={tripId}
            days={days}
            defaultDayId={activeDayId}
            place={selected}
            onCancel={() => onSelect(null)}
            onSaved={onSaved}
          />
        </div>
      ) : null}
    </div>
  );
}
