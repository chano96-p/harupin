/**
 * DB 의 places_category_check 와 같은 값이어야 한다.
 * 색은 시안 §9 의 카테고리 3톤 체계를 그대로 쓴다.
 */
export const CATEGORIES = [
  {
    value: "food",
    label: "먹거리",
    dot: "bg-food",
    tint: "bg-food-tint",
    deep: "text-food-deep",
  },
  {
    value: "sight",
    label: "볼거리",
    dot: "bg-sight",
    tint: "bg-sight-tint",
    deep: "text-sight-deep",
  },
  {
    value: "activity",
    label: "놀거리",
    dot: "bg-activity",
    tint: "bg-activity-tint",
    deep: "text-activity-deep",
  },
  {
    value: "lodging",
    label: "숙소",
    dot: "bg-lodging",
    tint: "bg-lodging-tint",
    deep: "text-lodging-deep",
  },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

const VALUES = CATEGORIES.map((c) => c.value) as readonly string[];

export function isCategory(value: string): value is CategoryValue {
  return VALUES.includes(value);
}

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
