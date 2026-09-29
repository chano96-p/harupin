"use client";

import { useRef, useState } from "react";

import { usePendingDelete } from "@/components/itinerary/hooks/usePendingDelete";
import { useOptimisticOrder } from "@/components/itinerary/hooks/useOptimisticOrder";
import { ItineraryPanel } from "@/components/itinerary/ItineraryPanel";
import { SearchOverlay } from "@/components/itinerary/SearchOverlay";
import { TripHeader } from "@/components/itinerary/TripHeader";
import { MapPanel } from "@/components/map/MapPanel";
import { Toast } from "@/components/ui/Toast";
import type { SelectedPlace } from "@/lib/places/types";
import type { Day, ShownPlace, Trip } from "@/lib/trips/types";

/**
 * 일정 편집 화면. 시안 1a(데스크톱 스플릿 뷰) / 1b(모바일 지도 + 바텀시트).
 *
 * 지도는 하나만 띄운다. 브레이크포인트마다 따로 두면 Maps 로드가 두 번 과금된다.
 * 모바일에서는 지도가 전면에 깔리고 패널이 그 위에 시트로 뜨며,
 * lg 부터는 같은 두 요소가 좌우 스플릿으로 배치된다.
 */
export function TripEditor({ trip, days }: { trip: Trip; days: Day[] }) {
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // 상세를 펼친 장소. 목록에 없으면(다른 Day, 삭제 대기) focusedId 가 null 이 된다.
  // 되돌리기로 다시 나타나면 펼친 상태로 돌아온다.
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  // 꺼둔 카테고리(시안 1a 필터 칩). Day 를 바꿔도 유지한다.
  const [offCategories, setOffCategories] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  // 저장은 폼이 사라진 뒤(다른 장소 선택)에도 끝까지 진행된다.
  // 늦게 끝난 저장이 그사이 고른 장소와 보던 탭을 덮지 않도록, 완료 시점의 선택과 비교한다.
  const selectedIdRef = useRef<string | null>(null);

  // 되돌리기와 에러는 따로 띄운다. 에러가 되돌리기를 덮으면 대기 중인 삭제를 취소할 수 없다.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 화면 변화(탭 전환)로만 드러나는 결과를 스크린리더에 알린다.
  // 같은 문구가 연달아 오면 다시 읽지 않으므로 장소 이름을 넣는다.
  const [statusMessage, setStatusMessage] = useState("");

  const { hiddenIds, undoOpen, requestDelete, undoDelete } = usePendingDelete({
    onError: setErrorMessage,
  });
  const { orderedDays, reorder } = useOptimisticOrder({
    days,
    onError: setErrorMessage,
  });

  const visibleDays = orderedDays.map((d) => ({
    ...d,
    places: d.places
      .filter((p) => !hiddenIds.includes(p.id))
      .map((p, i): ShownPlace => ({ ...p, order: i + 1 })),
  }));
  const activeDay =
    visibleDays.find((d) => d.id === activeDayId) ?? visibleDays[0];
  // 필터는 보여주기만 거른다. 순번은 위에서 매긴 값을 그대로 써서
  // "3번째 방문지" 가 필터를 켜도 3번으로 남는다.
  const shownPlaces =
    activeDay?.places.filter((p) => !offCategories.includes(p.category)) ?? [];
  const focusedId =
    shownPlaces.find((p) => p.id === focusedPlaceId)?.id ?? null;

  function toggleCategory(category: string) {
    setOffCategories((off) =>
      off.includes(category)
        ? off.filter((c) => c !== category)
        : [...off, category],
    );
  }

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
      {/* 라이브 영역은 내용이 바뀌기 전부터 DOM 에 있어야 읽힌다. */}
      <p role="status" className="sr-only">
        {statusMessage}
      </p>
      <TripHeader trip={trip} />

      <div className="relative min-h-0 flex-1 lg:flex">
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:order-2 lg:flex-1">
          <MapPanel
            pins={shownPlaces}
            selected={selected}
            focusedId={focusedId}
          />
          <SearchOverlay
            tripId={trip.id}
            days={days}
            activeDayId={activeDay?.id ?? null}
            selected={selected}
            searchRef={searchRef}
            onSelect={selectPlace}
            // 목록 갱신은 addPlace 의 revalidatePath 가 처리한다.
            // 저장한 Day 로 탭을 옮겨야 방금 추가한 핀이 보인다.
            onSaved={(dayId, placeId) => {
              if (selectedIdRef.current !== placeId) return;
              selectPlace(null);
              setActiveDayId(dayId);
            }}
          />
        </div>

        {activeDay ? (
          <ItineraryPanel
            days={visibleDays}
            activeDay={activeDay}
            shownPlaces={shownPlaces}
            offCategories={offCategories}
            onToggleCategory={toggleCategory}
            onClearFilter={() => setOffCategories([])}
            onSelectDay={(dayId) => {
              setActiveDayId(dayId);
              setFocusedPlaceId(null);
            }}
            focusedId={focusedId}
            onFocusPlace={setFocusedPlaceId}
            expanded={sheetExpanded}
            onToggleExpanded={() => setSheetExpanded((v) => !v)}
            onAddPlace={focusSearch}
            onDeletePlace={requestDelete}
            onMovedPlace={(dayId, placeName) => {
              setActiveDayId(dayId);
              const day = days.find((d) => d.id === dayId);
              setStatusMessage(
                day
                  ? `${placeName}을(를) ${day.dayNumber}일차로 옮겼습니다`
                  : "",
              );
            }}
            onReorderPlaces={(placeIds) =>
              reorder(
                activeDay.id,
                placeIds,
                (p) =>
                  !hiddenIds.includes(p.id) &&
                  !offCategories.includes(p.category),
              )
            }
          />
        ) : null}

        {errorMessage || undoOpen ? (
          <div className="absolute inset-x-4 bottom-4 z-20 flex flex-col gap-2 lg:right-auto lg:left-5.5 lg:w-90">
            {errorMessage ? (
              <Toast
                role="alert"
                message={errorMessage}
                actionLabel="닫기"
                onAction={() => setErrorMessage(null)}
              />
            ) : null}
            {undoOpen ? (
              <Toast
                role="status"
                message="장소를 삭제했습니다"
                actionLabel="되돌리기"
                onAction={undoDelete}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
