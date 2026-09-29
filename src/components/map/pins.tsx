import { findCategory } from "@/lib/places/categories";

export function NumberedPin({
  order,
  name,
  category,
  emphasized,
  focused,
  dimmed,
}: {
  order: number;
  name: string;
  category: string;
  emphasized: boolean;
  focused: boolean;
  dimmed: boolean;
}) {
  const dot = findCategory(category)?.dot ?? "bg-lodging";

  if (focused) {
    // 선택 핀은 다른 핀 위에 그린다. 컨테이너가 쌓임 맥락을 만들지 않아 z-10 이 핀끼리 비교된다.
    return (
      <>
        <div
          className={`absolute top-0 left-0 z-10 grid size-11.5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-[3px] border-surface text-[18px] font-semibold text-white shadow-[0_2px_10px_rgb(31_31_29/0.24)] ${dot}`}
        >
          {order}
        </div>
        <div className="absolute top-7.5 left-0 z-10 -translate-x-1/2 rounded-md bg-white px-2 py-1 text-[12px] font-semibold whitespace-nowrap text-ink shadow-[0_1px_3px_rgb(31_31_29/0.1)]">
          {name}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`absolute top-0 left-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-2 border-surface text-[13px] font-semibold text-white shadow-[0_1px_4px_rgb(31_31_29/0.18)] ${dot} ${emphasized ? "size-8.5" : "size-7.5"} ${dimmed ? "opacity-55" : ""}`}
      >
        {order}
      </div>
      <div
        className={`absolute left-0 hidden -translate-x-1/2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink lg:block ${emphasized ? "top-5.5" : "top-5"} ${dimmed ? "opacity-55" : ""}`}
      >
        {name}
      </div>
    </>
  );
}

/** 검색에서 고른, 아직 저장 전인 장소. 순번이 없으니 카테고리 색도 쓰지 않는다. */
export function SelectedPin() {
  return (
    <div className="absolute top-0 left-0 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-pill border-[3px] border-surface bg-ink shadow-[0_1px_4px_rgb(31_31_29/0.3)]" />
  );
}
