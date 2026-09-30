import { CATEGORIES } from "@/lib/places/categories";

const CHIP =
  "flex h-8.5 flex-none items-center gap-1.75 rounded-pill border px-3.25 text-[12.5px] font-bold transition-colors";

/** 카테고리 필터 칩. "전체" 는 필터 해제, 켜짐 = 카테고리 연한 색, 꺼짐 = 보더만. */
export function CategoryFilter({
  offCategories,
  hiddenCount,
  onToggle,
  onClear,
}: {
  offCategories: string[];
  /** 필터로 가려진 장소 수. 0 이면 표시하지 않는다. */
  hiddenCount: number;
  onToggle: (category: string) => void;
  onClear: () => void;
}) {
  const filtering = offCategories.length > 0;

  return (
    <div
      role="group"
      aria-label="카테고리 필터"
      className="flex touch-pan-x gap-2 overflow-x-auto px-4 scrollbar-none lg:touch-auto lg:px-6"
    >
      <button
        type="button"
        onClick={onClear}
        aria-pressed={!filtering}
        className={`${CHIP} ${
          filtering
            ? "border-line bg-surface text-ink-soft hover:bg-surface-hover"
            : "border-ink bg-ink text-white"
        }`}
      >
        전체
      </button>
      {CATEGORIES.map((c) => {
        const on = !offCategories.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onToggle(c.value)}
            aria-pressed={on}
            className={`${CHIP} ${
              on
                ? `${c.tint} ${c.deep} border-transparent`
                : "border-line bg-surface text-ink-mute hover:bg-surface-hover"
            }`}
          >
            <span aria-hidden className={`size-1.75 rounded-pill ${c.dot}`} />
            {c.label}
          </button>
        );
      })}
      {/* 데스크톱은 날짜 줄에 "보이는 수 / 전체" 가 있다. 모바일은 그 줄이 없어 여기서 알린다. */}
      {filtering ? (
        <span className="flex-none self-center pl-1 text-[12px] text-ink-soft lg:hidden">
          {hiddenCount}곳 가려짐
        </span>
      ) : null}
    </div>
  );
}
