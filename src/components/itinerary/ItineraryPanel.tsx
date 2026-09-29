"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { EditorDay, ShownPlace } from "@/components/itinerary/TripEditor";
import {
  movePlace,
  updatePlaceMemo,
  type MovePlaceState,
  type UpdateMemoState,
} from "@/lib/actions/places";
import { CATEGORIES, categoryLabel } from "@/lib/places/categories";
import { MAX_PLACE_MEMO } from "@/lib/places/limits";
import { formatDayDate } from "@/lib/trips/format";

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "스페이스나 엔터로 잡고, 위아래 방향키로 옮긴 뒤 다시 스페이스나 엔터로 놓습니다. Esc 로 취소합니다.",
};

/**
 * Day 탭 + 그 Day 의 장소 리스트.
 * 모바일은 지도 위 바텀시트(1b), lg 부터는 좌측 고정 패널(1a).
 */
export function ItineraryPanel({
  days,
  activeDay,
  shownPlaces,
  offCategories,
  onToggleCategory,
  onClearFilter,
  onSelectDay,
  focusedId,
  onFocusPlace,
  expanded,
  onToggleExpanded,
  onAddPlace,
  onDeletePlace,
  onReorderPlaces,
  onMovedPlace,
}: {
  days: EditorDay[];
  activeDay: EditorDay;
  /** activeDay 에서 카테고리 필터를 거친 장소. 목록·드래그는 이것만 다룬다. */
  shownPlaces: ShownPlace[];
  offCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearFilter: () => void;
  onSelectDay: (dayId: string) => void;
  focusedId: string | null;
  onFocusPlace: (placeId: string | null) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onAddPlace: () => void;
  onDeletePlace: (placeId: string) => void;
  onReorderPlaces: (placeIds: string[]) => void;
  /** 다른 Day 로 옮기기가 저장된 뒤. 그 Day 로 탭을 옮겨 펼친 카드를 계속 보여준다. */
  onMovedPlace: (dayId: string, placeName: string) => void;
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
  const filtering = offCategories.length > 0;

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
    onReorderPlaces(
      arrayMove(
        placeIds,
        placeIds.indexOf(String(active.id)),
        placeIds.indexOf(String(over.id)),
      ),
    );
  }

  return (
    <section
      className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[20px] border-t border-line bg-canvas shadow-[0_-2px_12px_rgb(31_31_29/0.08)] transition-[height] duration-200 ${expanded ? "h-[85%]" : "h-[40%]"} lg:static lg:h-auto lg:w-[45%] lg:flex-none lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:transition-none`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-label={expanded ? "목록 접기" : "목록 펼치기"}
        className="flex h-6 flex-none items-center justify-center lg:hidden"
      >
        <span className="h-1 w-9.5 rounded-pill bg-dashed-line" />
      </button>

      <div className="flex flex-none flex-col gap-3.5 pb-3.5 lg:pt-4.5">
        <div className="flex gap-1.75 overflow-x-auto px-4 scrollbar-none lg:gap-2 lg:px-5.5">
          {days.map((d) => {
            const active = d.id === activeDay.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDay(d.id)}
                aria-pressed={active}
                className={`flex-none rounded-pill border px-3.25 py-1.75 text-[12.5px] font-semibold transition-colors lg:px-3.75 lg:py-2 lg:text-[13px] ${
                  active
                    ? "border-ink bg-ink text-surface"
                    : "border-line text-ink hover:bg-surface-hover"
                }`}
              >
                {d.dayNumber}일차
              </button>
            );
          })}
        </div>

        <div className="hidden items-baseline gap-2 px-5.5 lg:flex">
          <span className="text-[15px] font-semibold text-ink">
            {formatDayDate(activeDay.date)}
          </span>
          <span className="text-[12px] text-ink-soft">
            {filtering
              ? `${shownPlaces.length} / ${activeDay.places.length}곳`
              : `${activeDay.places.length}곳`}
          </span>
        </div>

        <div
          role="group"
          aria-label="카테고리 필터"
          className="flex gap-1.75 overflow-x-auto px-4 scrollbar-none lg:px-5.5"
        >
          {CATEGORIES.map((c) => {
            const on = !offCategories.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onToggleCategory(c.value)}
                aria-pressed={on}
                className={`flex flex-none items-center gap-1.5 rounded-pill border py-1.5 pr-3 pl-2.5 text-[12px] font-semibold transition-colors ${
                  on
                    ? `${c.tint} ${c.deep} border-transparent`
                    : "border-line text-ink-mute hover:bg-surface-hover"
                }`}
              >
                <span aria-hidden className={`size-2 rounded-pill ${c.dot}`} />
                {c.label}
              </button>
            );
          })}
          {/* 데스크톱은 날짜 줄에 "보이는 수 / 전체" 가 있다. 모바일은 그 줄이 없어 여기서 알린다. */}
          {filtering ? (
            <span className="flex-none self-center pl-1 text-[12px] text-ink-soft lg:hidden">
              {activeDay.places.length - shownPlaces.length}곳 가려짐
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.25 overflow-y-auto px-4 pb-6 lg:gap-2.5 lg:px-5.5 lg:pt-1 lg:pb-5.5">
        {activeDay.places.length === 0 ? (
          <EmptyDay onSearch={onAddPlace} />
        ) : (
          <>
            {shownPlaces.length === 0 ? (
              <FilteredEmpty onClear={onClearFilter} />
            ) : (
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
                <SortableContext
                  items={placeIds}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="flex flex-col gap-2.25 lg:gap-2.5">
                    {shownPlaces.map((p) => (
                      <PlaceCard
                        key={p.id}
                        place={p}
                        days={days}
                        currentDayId={activeDay.id}
                        onMoved={onMovedPlace}
                        expanded={focusedId === p.id}
                        onToggleExpanded={() =>
                          onFocusPlace(focusedId === p.id ? null : p.id)
                        }
                        swiped={swipedId === p.id}
                        onSwipedChange={(open) =>
                          setSwipedId(open ? p.id : null)
                        }
                        onDelete={() => {
                          setSwipedId(null);
                          onDeletePlace(p.id);
                        }}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            )}

            <button
              type="button"
              onClick={onAddPlace}
              className="flex-none rounded-card border border-dashed border-dashed-line p-3 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink lg:p-3.25"
            >
              + 장소 추가
            </button>
          </>
        )}
      </div>
    </section>
  );
}

const SWIPE_REVEAL = 72;
const SWIPE_SLOP = 6;
const DESKTOP_QUERY = "(min-width: 64rem)";

/**
 * 누르면 제자리에서 펼쳐져 상세를 보여준다(데스크톱 3d, 모바일 3h).
 * 삭제: 데스크톱은 카드의 × 버튼(1a), 모바일은 왼쪽으로 밀어 여는 삭제 버튼(3j).
 * 순서 변경: 오른쪽 끝 핸들(점 6개)을 잡고 끈다. 카드 전체가 아니라 핸들만 끌리게 해서
 * 모바일의 세로 스크롤·스와이프 삭제와 겹치지 않는다.
 * 펼친 동안에는 핸들과 스와이프를 끈다. 상세 안에 삭제 버튼이 따로 있다.
 */
function PlaceCard({
  place,
  days,
  currentDayId,
  onMoved,
  expanded,
  onToggleExpanded,
  swiped,
  onSwipedChange,
  onDelete,
}: {
  place: ShownPlace;
  days: EditorDay[];
  currentDayId: string;
  onMoved: (dayId: string, placeName: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  swiped: boolean;
  onSwipedChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: place.id,
    attributes: { roleDescription: "순서 변경 가능한 장소" },
  });

  const cardRef = useRef<HTMLDivElement>(null);
  // 펼치기 버튼은 펼치든 접든 남아 있는 요소라, "상세 닫기" 뒤 포커스를 돌려줄 곳으로 쓴다.
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  // 가로/세로 판정 전에는 axis 가 null 이다. 세로로 판정되면 스크롤에 양보한다.
  // 손을 뗄 때는 state 가 아니라 여기 기록한 마지막 위치로 판정한다.
  // 빠르게 밀면 마지막 pointermove 의 setDragX 가 렌더되기 전에 pointerup 이 온다.
  const gestureRef = useRef<{
    x: number;
    y: number;
    base: number;
    axis: "x" | "y" | null;
    lastX: number;
  } | null>(null);

  // 펼친 카드가 목록(특히 모바일의 낮은 시트) 밖으로 잘리지 않게 보이는 곳으로 당긴다.
  useEffect(() => {
    if (expanded) {
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [expanded]);

  const cat = CATEGORIES.find((c) => c.value === place.category);
  const tint = cat?.tint ?? "bg-lodging-tint";
  const deep = cat?.deep ?? "text-lodging-deep";
  const dot = cat?.dot ?? "bg-lodging";
  const offset = dragX ?? (swiped ? -SWIPE_REVEAL : 0);

  function handleToggle() {
    // 스와이프로 열린 상태에서 누르면 펼치기 대신 삭제 버튼을 닫는다.
    if (swiped) {
      onSwipedChange(false);
      return;
    }
    onToggleExpanded();
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (
      expanded ||
      e.pointerType === "mouse" ||
      window.matchMedia(DESKTOP_QUERY).matches
    )
      return;
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      base: swiped ? -SWIPE_REVEAL : 0,
      axis: null,
      lastX: swiped ? -SWIPE_REVEAL : 0,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const g = gestureRef.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.axis === null) {
      if (Math.abs(dx) < SWIPE_SLOP && Math.abs(dy) < SWIPE_SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "x") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (g.axis !== "x") return;
    g.lastX = Math.min(0, Math.max(-SWIPE_REVEAL, g.base + dx));
    setDragX(g.lastX);
  }

  function handlePointerEnd() {
    const g = gestureRef.current;
    gestureRef.current = null;
    setDragX(null);
    if (g?.axis !== "x") return;
    onSwipedChange(g.lastX < -SWIPE_REVEAL / 2);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative overflow-hidden rounded-card ${isDragging ? "z-10 shadow-[0_4px_16px_rgb(31_31_29/0.12)]" : ""}`}
    >
      {/* 스와이프 제스처 전용 버튼. 키보드·스크린리더는 카드 안의 삭제 버튼을 쓴다. */}
      <button
        type="button"
        onClick={onDelete}
        aria-hidden
        tabIndex={-1}
        className={`absolute inset-0 flex justify-end bg-food text-white lg:hidden ${offset === 0 ? "invisible" : ""}`}
      >
        <span className="flex w-18 flex-col items-center justify-center gap-0.75">
          <span aria-hidden className="text-[17px] leading-none">
            ×
          </span>
          <span className="text-[12px] font-semibold">삭제</span>
        </span>
      </button>

      {/* 밀어낼 때 카드를 translate 하지 않고 폭을 줄인다(시안 3j).
          translate 하면 왼쪽 보더와 모서리가 li 의 overflow 에 잘린다. */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={() => swiped && onSwipedChange(false)}
        style={{ width: `calc(100% + ${offset}px)` }}
        className={`relative flex touch-pan-y flex-col rounded-card border bg-surface ${expanded ? "gap-3.5 border-ink p-3.5 lg:p-3.75" : "border-line p-3.25 lg:p-3.5"} ${dragX === null ? "transition-[width] duration-200" : ""}`}
      >
        <div
          className={`flex gap-2.75 lg:gap-3 ${expanded ? "items-start" : "items-center lg:items-start"}`}
        >
          <button
            ref={toggleRef}
            type="button"
            onClick={handleToggle}
            aria-expanded={expanded}
            className={`flex min-w-0 flex-1 gap-2.75 text-left lg:gap-3 ${expanded ? "items-start" : "items-center lg:items-start"}`}
          >
            <span
              className={`grid flex-none place-items-center rounded-pill font-semibold ${
                expanded
                  ? `size-7 text-[13.5px] text-white ${dot}`
                  : `size-6.5 text-[13px] ${tint} ${deep}`
              }`}
            >
              {place.order}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 lg:gap-1.5">
              <span
                className={`font-semibold tracking-[-0.01em] text-ink ${expanded ? "text-[16px] wrap-break-word" : "truncate text-[14.5px] lg:text-[15px]"}`}
              >
                {place.name}
              </span>
              {expanded ? null : (
                <span className="text-[12px] text-ink-soft lg:hidden">
                  {categoryLabel(place.category)}
                </span>
              )}
              <span
                className={`self-start rounded-pill px-2 py-0.75 text-[11px] font-semibold ${tint} ${deep} ${expanded ? "inline" : "hidden lg:inline"}`}
              >
                {categoryLabel(place.category)}
              </span>
            </span>
          </button>

          {expanded ? (
            <button
              type="button"
              onClick={() => {
                onToggleExpanded();
                toggleRef.current?.focus();
              }}
              aria-label={`${place.name} 상세 닫기`}
              className="grid size-7.5 flex-none place-items-center rounded-pill text-ink-mute transition-colors hover:bg-surface-hover lg:flex lg:size-auto lg:gap-1 lg:px-2 lg:py-1 lg:text-[12px]"
            >
              <span aria-hidden className="hidden lg:inline">
                닫기
              </span>
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="size-3.5 lg:size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m4 10 4-4 4 4" />
              </svg>
            </button>
          ) : (
            <>
              {/* 모바일에서는 보이지 않지만 키보드·스크린리더로 닿는다. 키보드 포커스 시에만 드러난다.
                  sr-only + lg:not-sr-only 로 풀면 not-sr-only 의 width/height:auto 가 size-5.5 뒤에
                  생성돼 크기를 덮어쓴다. 숨길 조건 쪽을 좁혀서 되돌릴 일을 없앤다. */}
              <button
                type="button"
                onClick={onDelete}
                aria-label={`${place.name} 삭제`}
                className="grid size-5.5 flex-none place-items-center rounded-pill text-[15px] text-ink-mute transition-colors hover:bg-surface-hover hover:text-food max-lg:not-focus-visible:sr-only"
              >
                <span aria-hidden>×</span>
              </button>
              {/* touch-none: 핸들 위에서는 브라우저 스크롤 대신 드래그가 포인터를 받는다.
                  카드의 스와이프 판정이 같은 포인터를 잡지 않도록 전파를 끊는다. */}
              <button
                type="button"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                onPointerDown={(e) => {
                  listeners?.onPointerDown?.(e);
                  e.stopPropagation();
                }}
                aria-label={`${place.name} 순서 변경`}
                className="-m-2 grid flex-none cursor-grab touch-none grid-cols-[repeat(2,3px)] gap-1 p-2 active:cursor-grabbing lg:-mt-0.5"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <span
                    key={i}
                    className="size-0.75 rounded-pill bg-line-strong"
                  />
                ))}
              </button>
            </>
          )}
        </div>

        {expanded ? (
          <PlaceDetail
            place={place}
            days={days}
            currentDayId={currentDayId}
            onMoved={onMoved}
            onDelete={onDelete}
          />
        ) : null}
      </div>
    </li>
  );
}

/**
 * 펼친 카드의 본문. 메모와 일차 이동.
 * 주소·영업시간(시안 3d)은 Place Details 상위 등급 호출 + place_cache 가 필요해 2단계 캐시 작업과 함께 넣는다.
 */
function PlaceDetail({
  place,
  days,
  currentDayId,
  onMoved,
  onDelete,
}: {
  place: ShownPlace;
  days: EditorDay[];
  currentDayId: string;
  onMoved: (dayId: string, placeName: string) => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<"view" | "memo" | "move">("view");
  // 폼을 닫으면(저장·취소) 그 안의 버튼이 사라져 포커스가 body 로 빠진다.
  // 폼을 연 버튼이 다시 나타나면 그리로 돌려준다.
  const memoButtonRef = useRef<HTMLButtonElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<"memo" | "move" | null>(null);

  useEffect(() => {
    if (mode !== "view" || !returnFocusRef.current) return;
    const target =
      returnFocusRef.current === "memo" ? memoButtonRef : moveButtonRef;
    returnFocusRef.current = null;
    target.current?.focus();
  }, [mode]);

  function closeForm() {
    returnFocusRef.current = mode === "view" ? null : mode;
    setMode("view");
  }

  if (mode === "memo") {
    return (
      <MemoForm
        placeId={place.id}
        initialMemo={place.memo ?? ""}
        onClose={closeForm}
      />
    );
  }

  if (mode === "move") {
    return (
      <MoveForm
        placeId={place.id}
        days={days}
        currentDayId={currentDayId}
        onMoved={(dayId) => onMoved(dayId, place.name)}
        onClose={closeForm}
      />
    );
  }

  return (
    <>
      <dl className="flex gap-2.5">
        <dt className="w-14.5 flex-none text-[12.5px] leading-normal text-ink-mute">
          메모
        </dt>
        <dd
          className={`min-w-0 flex-1 text-[13px] leading-normal wrap-break-word whitespace-pre-wrap ${place.memo ? "text-ink" : "text-ink-mute"}`}
        >
          {place.memo ?? "메모 없음"}
        </dd>
      </dl>
      <div className="flex items-center gap-2 lg:gap-2.25">
        <button
          ref={memoButtonRef}
          type="button"
          onClick={() => setMode("memo")}
          className="h-11 flex-1 rounded-control border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover lg:h-auto lg:flex-none lg:px-3 lg:py-2 lg:text-[12.5px]"
        >
          {place.memo ? "메모 수정" : "메모 추가"}
        </button>
        {days.length > 1 ? (
          <button
            ref={moveButtonRef}
            type="button"
            onClick={() => setMode("move")}
            className="h-11 flex-1 rounded-control border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover lg:h-auto lg:flex-none lg:px-3 lg:py-2 lg:text-[12.5px]"
          >
            <span className="lg:hidden">일차 이동</span>
            <span className="hidden lg:inline">다른 일차로 이동</span>
          </button>
        ) : null}
        <span aria-hidden className="hidden flex-1 lg:block" />
        <button
          type="button"
          onClick={onDelete}
          className="h-11 rounded-control px-3 text-[13px] font-semibold text-food-deep transition-colors hover:bg-food-tint lg:h-auto lg:py-2 lg:text-[12.5px]"
        >
          삭제
        </button>
      </div>
    </>
  );
}

/**
 * 편집할 때만 마운트한다. 다시 열면 지난 실패의 에러와 입력이 남지 않는다.
 *
 * textarea 는 controlled 로 둔다. form action 은 성공·실패와 관계없이 transition 이 끝날 때
 * 폼을 리셋하므로(react-dom startHostTransition → requestFormReset), defaultValue 로 두면
 * 저장이 실패했을 때 입력한 내용이 옛 메모로 되돌아간다.
 */
function MemoForm({
  placeId,
  initialMemo,
  onClose,
}: {
  placeId: string;
  initialMemo: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialMemo);
  const [state, formAction, pending] = useActionState<
    UpdateMemoState,
    FormData
  >(async (_prev, formData) => {
    const result = await updatePlaceMemo(
      placeId,
      String(formData.get("memo") ?? ""),
    );
    // await 뒤의 업데이트를 transition 에 넣어야 revalidate 된 새 메모와 함께 반영된다.
    // 밖에서 닫으면 편집창이 먼저 닫히고 옛 메모가 잠깐 보인다.
    if (!result.error) startTransition(onClose);
    return result;
  }, {});
  const memoId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={memoId} className="text-[12.5px] text-ink-mute">
        메모
      </label>
      <textarea
        id={memoId}
        name="memo"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_PLACE_MEMO}
        rows={3}
        autoFocus
        className="resize-none rounded-control border border-control-line bg-surface px-3 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none focus:border-ink"
      />
      {state.error ? (
        <p role="alert" className="text-[12.5px] text-food-deep">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-11 rounded-control border border-control-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-11 flex-1 rounded-control bg-ink text-[13px] font-semibold text-surface disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          {pending ? "저장하는 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

/**
 * 편집할 때만 마운트한다(MemoForm 과 같은 이유). select 도 controlled 로 둔다.
 * 옮긴 장소는 받는 Day 의 맨 뒤에 붙는다(move_place).
 */
function MoveForm({
  placeId,
  days,
  currentDayId,
  onMoved,
  onClose,
}: {
  placeId: string;
  days: EditorDay[];
  currentDayId: string;
  onMoved: (dayId: string) => void;
  onClose: () => void;
}) {
  const targets = days.filter((d) => d.id !== currentDayId);
  // 기본값은 다음 날. 마지막 날이면 첫 후보(보통 전날까지 중 첫째 날)로.
  const currentIndex = days.findIndex((d) => d.id === currentDayId);
  const [toDayId, setToDayId] = useState(
    days[currentIndex + 1]?.id ?? targets[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState<MovePlaceState, FormData>(
    async () => {
      const result = await movePlace(placeId, toDayId);
      // 탭 이동을 revalidate 된 새 목록과 같은 transition 에 넣는다.
      // 따로 반영되면 옮겨 간 Day 탭이 잠깐 이 장소 없이 보인다.
      if (!result.error) {
        startTransition(() => {
          onMoved(toDayId);
          onClose();
        });
      }
      return result;
    },
    {},
  );
  const selectId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-[12.5px] text-ink-mute">
        옮길 일차
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={toDayId}
          onChange={(e) => setToDayId(e.target.value)}
          disabled={pending}
          autoFocus
          className="h-11 w-full appearance-none rounded-control border border-control-line bg-surface pr-10 pl-3 text-[14px] text-ink outline-none focus:border-ink lg:h-10"
        >
          {targets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.dayNumber}일차 · {formatDayDate(d.date)}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-ink-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
      {state.error ? (
        <p role="alert" className="text-[12.5px] text-food-deep">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-11 rounded-control border border-control-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending || !toDayId}
          className="h-11 flex-1 rounded-control bg-ink text-[13px] font-semibold text-surface disabled:opacity-60 lg:h-9.5 lg:text-[12.5px]"
        >
          {pending ? "옮기는 중…" : "옮기기"}
        </button>
      </div>
    </form>
  );
}

/** Day 에 장소는 있지만 필터로 전부 가려진 상태. 3f(장소 0개)와 구분한다. */
function FilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-dashed-line bg-sunken p-5">
      <p className="text-[15px] font-semibold text-ink">
        선택한 카테고리의 장소가 없어요
      </p>
      <button
        type="button"
        onClick={onClear}
        className="rounded-control border border-control-line bg-surface px-3.5 py-2.25 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-hover"
      >
        필터 해제
      </button>
    </div>
  );
}

/** 시안 3f */
function EmptyDay({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-dashed-line bg-sunken p-5">
      <p className="text-[15px] font-semibold text-ink">아직 장소가 없어요</p>
      <p className="max-w-60 text-center text-[13px] leading-relaxed text-ink-soft text-pretty">
        지도 상단 검색창에서 장소를 찾아 이 일차에 추가하세요.
      </p>
      <button
        type="button"
        onClick={onSearch}
        className="rounded-control border border-control-line bg-surface px-3.5 py-2.25 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-hover"
      >
        장소 검색하기
      </button>
    </div>
  );
}
