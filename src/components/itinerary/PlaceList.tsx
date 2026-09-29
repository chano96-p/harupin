"use client";

import { useId, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { PlaceCard } from "@/components/itinerary/PlaceCard";
import type { Day, ShownPlace } from "@/lib/trips/types";

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "스페이스나 엔터로 잡고, 위아래 방향키로 옮긴 뒤 다시 스페이스나 엔터로 놓습니다. Esc 로 취소합니다.",
};

/** 한 Day 의 장소 카드 목록. 핸들로 순서를 바꾸고(dnd), 모바일은 스와이프로 삭제한다. */
export function PlaceList({
  shownPlaces,
  days,
  currentDayId,
  focusedId,
  onFocusPlace,
  onDelete,
  onReorder,
  onMoved,
}: {
  shownPlaces: ShownPlace[];
  days: Day[];
  currentDayId: string;
  focusedId: string | null;
  onFocusPlace: (placeId: string | null) => void;
  onDelete: (placeId: string) => void;
  onReorder: (placeIds: string[]) => void;
  onMoved: (dayId: string, placeName: string) => void;
}) {
  // 스와이프로 삭제 버튼이 열린 카드. 한 번에 하나만 연다.
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // SSR 과 클라이언트의 aria-describedby id 가 어긋나지 않게 고정한다.
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const placeIds = shownPlaces.map((p) => p.id);

  function nameOf(id: UniqueIdentifier) {
    return shownPlaces.find((p) => p.id === id)?.name ?? "장소";
  }
  // 필터가 켜지면 목록 인덱스와 방문 순번이 다르다. 카드에 보이는 번호로 알린다.
  function positionOf(id: UniqueIdentifier) {
    return shownPlaces.find((p) => p.id === id)?.order ?? 0;
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `${nameOf(active.id)}을(를) 잡았습니다. 현재 ${positionOf(active.id)}번째입니다.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(active.id)}이(가) ${positionOf(over.id)}번째 위치로 이동했습니다.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)}을(를) ${positionOf(over.id)}번째에 놓았습니다.`
        : undefined,
    onDragCancel: ({ active }) =>
      `이동을 취소했습니다. ${nameOf(active.id)}은(는) 원래 위치에 있습니다.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onReorder(
      arrayMove(
        placeIds,
        placeIds.indexOf(String(active.id)),
        placeIds.indexOf(String(over.id)),
      ),
    );
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        announcements,
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      onDragStart={() => setSwipedId(null)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2.25 lg:gap-2.5">
          {shownPlaces.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              days={days}
              currentDayId={currentDayId}
              onMoved={onMoved}
              expanded={focusedId === p.id}
              onToggleExpanded={() =>
                onFocusPlace(focusedId === p.id ? null : p.id)
              }
              swiped={swipedId === p.id}
              onSwipedChange={(open) => setSwipedId(open ? p.id : null)}
              onDelete={() => {
                setSwipedId(null);
                onDelete(p.id);
              }}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
