import { CATEGORIES } from "@/lib/places/categories";

/** 카테고리 필터 칩(시안 1a). 켜짐 = 카테고리 연한 색, 꺼짐 = 보더만. */
export function CategoryFilter({
  offCategories,
  hiddenCount,
  onToggle,
}: {
  offCategories: string[];
  /** 필터로 가려진 장소 수. 0 이면 표시하지 않는다. */
  hiddenCount: number;
  onToggle: (category: string) => void;
}) {
  return (
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
            onClick={() => onToggle(c.value)}
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
      {offCategories.length > 0 ? (
        <span className="flex-none self-center pl-1 text-[12px] text-ink-soft lg:hidden">
          {hiddenCount}곳 가려짐
        </span>
      ) : null}
    </div>
  );
}
