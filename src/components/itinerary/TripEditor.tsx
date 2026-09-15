"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { ItineraryPanel } from "@/components/itinerary/ItineraryPanel";
import { MapPanel } from "@/components/map/MapPanel";
import {
  PlaceSearch,
  type SelectedPlace,
} from "@/components/places/PlaceSearch";
import { AddPlaceForm } from "@/components/trips/AddPlaceForm";
import { deletePlace, reorderPlaces } from "@/lib/actions/places";
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

const UNDO_MS = 5000;

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
  const router = useRouter();
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  // 저장은 폼이 사라진 뒤(다른 장소 선택)에도 끝까지 진행된다.
  // 늦게 끝난 저장이 그사이 고른 장소와 보던 탭을 덮지 않도록, 완료 시점의 선택과 비교한다.
  const selectedIdRef = useRef<string | null>(null);

  // 삭제는 되돌리기(시안 3j)를 위해 UNDO_MS 뒤에 실제로 보낸다. 그동안은 화면에서만 숨긴다.
  // 삭제 후 다시 넣는 방식은 id·순번이 바뀌어 원래대로 돌아가지 않는다.
  // 대기 중에 탭을 닫으면 삭제가 취소되는데, 지워지지 않는 쪽으로 실패하므로 받아들인다.
  // 성공한 삭제의 id 도 여기 남는다. revalidate 된 days 에 이미 없으므로 부작용이 없고,
  // 바로 빼면 revalidate 반영 전에 장소가 잠깐 되살아나 보일 수 있다.
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  // 되돌리기와 에러는 따로 띄운다. 에러가 되돌리기를 덮으면 대기 중인 삭제를 취소할 수 없다.
  const [undoOpen, setUndoOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingRef = useRef<{
    placeId: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  // 놓는 즉시 새 순서를 보여준다. 저장 transition 이 끝나면 서버 값(revalidate 된 days)으로
  // 자연히 대체되고, 실패하면 원래 순서로 돌아간다.
  // placeIds 는 숨긴 장소까지 포함한 Day 전체 목록이다(handleReorder).
  // 그사이 새로 추가돼 목록에 없는 장소는 서버 reorder_places 와 똑같이 뒤에 붙인다.
  const [optimisticDays, applyOrder] = useOptimistic(
    days,
    (state, next: { dayId: string; placeIds: string[] }) =>
      state.map((d) => {
        if (d.id !== next.dayId) return d;
        const byId = new Map(d.places.map((p) => [p.id, p]));
        const ordered = next.placeIds.flatMap((id) => byId.get(id) ?? []);
        const rest = d.places.filter((p) => !next.placeIds.includes(p.id));
        return { ...d, places: [...ordered, ...rest] };
      }),
  );

  const visibleDays = optimisticDays.map((d) => ({
    ...d,
    places: d.places.filter((p) => !hiddenIds.includes(p.id)),
  }));
  const activeDay =
    visibleDays.find((d) => d.id === activeDayId) ?? visibleDays[0];

  // 화면을 떠나면(홈으로 이동 등) 대기 중인 삭제를 바로 보낸다.
  // 이동 중이라 revalidate 는 하지 않는다 (deletePlace 주석 참고).
  useEffect(() => {
    const pending = pendingRef;
    return () => {
      if (!pending.current) return;
      clearTimeout(pending.current.timer);
      void deletePlace(pending.current.placeId, false);
    };
  }, []);

  function selectPlace(place: SelectedPlace | null) {
    selectedIdRef.current = place?.placeId ?? null;
    setSelected(place);
  }

  function focusSearch() {
    setSheetExpanded(false);
    searchRef.current?.focus();
  }

  // 폼 action 이 아닌 곳에서 Server Action 을 부를 때는 startTransition 으로 감싼다
  // (Next 문서 mutating-data). await 뒤의 업데이트는 transition 에 다시 넣어야 한다.
  function commitDelete(placeId: string) {
    startTransition(async () => {
      const { error } = await deletePlace(placeId);
      if (!error) return;
      startTransition(() => {
        setHiddenIds((ids) => ids.filter((id) => id !== placeId));
        setErrorMessage(error);
      });
    });
  }

  function requestDelete(placeId: string) {
    const prev = pendingRef.current;
    if (prev) {
      clearTimeout(prev.timer);
      commitDelete(prev.placeId);
    }

    const timer = setTimeout(() => {
      pendingRef.current = null;
      setUndoOpen(false);
      commitDelete(placeId);
    }, UNDO_MS);

    pendingRef.current = { placeId, timer };
    setHiddenIds((ids) => [...ids, placeId]);
    setUndoOpen(true);
  }

  function handleReorder(dayId: string, visibleIds: string[]) {
    // 삭제 대기로 숨긴 장소는 제자리에 두고, 보이는 칸만 새 순서로 채운 전체 목록을 보낸다.
    // 숨긴 장소를 빼고 보내면 맨 뒤로 밀려서, 되돌렸을 때 원래 자리로 돌아오지 않는다.
    const queue = [...visibleIds];
    const placeIds = (
      optimisticDays.find((d) => d.id === dayId)?.places ?? []
    ).map((p) => (hiddenIds.includes(p.id) ? p.id : (queue.shift() ?? p.id)));

    startTransition(async () => {
      applyOrder({ dayId, placeIds });
      const { error } = await reorderPlaces(dayId, placeIds);
      if (!error) return;
      // 다른 탭에서 지운 장소가 목록에 남아 있으면 서버가 거부한다. 실패 시에는
      // revalidate 가 일어나지 않아 새로고침 전까지 같은 실패가 반복되므로 최신 목록을 다시 받는다.
      startTransition(() => {
        setErrorMessage(error);
        router.refresh();
      });
    });
  }

  function undoDelete() {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    setHiddenIds((ids) => ids.filter((id) => id !== pending.placeId));
    setUndoOpen(false);
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
            days={visibleDays}
            activeDay={activeDay}
            onSelectDay={setActiveDayId}
            expanded={sheetExpanded}
            onToggleExpanded={() => setSheetExpanded((v) => !v)}
            onAddPlace={focusSearch}
            onDeletePlace={requestDelete}
            onReorderPlaces={(placeIds) =>
              handleReorder(activeDay.id, placeIds)
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

function Toast({
  role,
  message,
  actionLabel,
  onAction,
}: {
  role: "status" | "alert";
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      role={role}
      className="flex items-center gap-3 rounded-[10px] bg-ink px-4 py-3.5 shadow-[0_4px_16px_rgb(31_31_29/0.22)]"
    >
      <p className="flex-1 text-[13.5px] text-surface">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="text-[13.5px] font-semibold text-surface underline decoration-white/50 underline-offset-2"
      >
        {actionLabel}
      </button>
    </div>
  );
}
