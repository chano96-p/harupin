"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ChevronDown, LogOut } from "@/components/ui/icons";
import { signOut } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/queries/user";

/** 헤더 오른쪽 계정 메뉴. 이름 첫 글자 아바타 + 이름 → 펼치면 이메일과 로그아웃. */
export function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  // slice(0, 1) 은 UTF-16 한 칸이라 이모지·확장 한자 첫 글자가 깨진다. 코드포인트 단위로 자른다.
  const initial = Array.from(user.name)[0];

  // 바깥을 누르거나 Esc 로 닫는다. Esc 는 포커스를 메뉴 버튼으로 돌려준다.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${user.name} 계정 메뉴`}
        className="flex items-center gap-2 rounded-pill p-0.5 pr-1 transition-colors hover:bg-surface-hover lg:pr-2"
      >
        <Avatar initial={initial} />
        <span className="hidden max-w-32 truncate text-[14px] font-semibold text-ink lg:inline">
          {user.name}
        </span>
        <ChevronDown className="hidden size-3.5 text-ink-soft lg:block" />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute top-full right-0 z-30 mt-2 flex w-65 flex-col rounded-panel border border-line bg-surface p-2 shadow-pop"
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar initial={initial} large />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-semibold text-ink">
                {user.name}
              </span>
              <span className="truncate text-[12px] text-ink-soft">
                {user.email}
              </span>
            </div>
          </div>
          <div aria-hidden className="mx-1 my-1.5 h-px bg-line" />
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2.5 text-[13.5px] font-semibold text-brand-deep transition-colors hover:bg-brand-tint"
            >
              <LogOut className="size-4" />
              로그아웃
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ initial, large }: { initial: string; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid flex-none place-items-center rounded-pill bg-ink font-semibold text-surface ${large ? "size-10 text-[14px]" : "size-8 text-[13px]"}`}
    >
      {initial}
    </span>
  );
}
