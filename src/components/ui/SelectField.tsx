import type { ComponentProps } from "react";

import { ChevronDown } from "@/components/ui/icons";

/**
 * 브라우저 기본 화살표는 위치를 조절할 수 없어 숨기고 직접 그린다.
 * 높이·글자 크기는 쓰는 곳마다 달라 className 으로 받는다.
 */
export function SelectField({
  className = "",
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-control border border-control-line bg-surface pr-10 pl-3 text-[14px] text-ink outline-none focus:border-ink ${className}`}
      />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}
