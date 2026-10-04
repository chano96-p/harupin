"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 네이티브 <dialog> 모달. 모바일은 아래에서 올라오는 시트, lg 부터는 가운데 카드.
 * Esc·백드롭 클릭으로 닫히고, 닫히면 onClose 로 알린다.
 * 내용은 열려 있을 때만 그린다 — 다시 열면 이전 입력과 에러가 남지 않는다.
 *
 * 안쪽의 취소 버튼은 closeDialog 를 쓴다(아래).
 */
export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // 백드롭은 dialog 요소 자신이 받는다. 클릭 좌표가 상자 밖이면 백드롭을 누른 것이다.
  function closeOnBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    const el = ref.current;
    if (!el || e.target !== el) return;
    const r = el.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) el.close();
  }

  return (
    <dialog
      ref={ref}
      onClick={closeOnBackdrop}
      onClose={onClose}
      className="m-0 mt-auto w-full max-w-none rounded-t-panel bg-surface p-6 text-ink shadow-pop backdrop:bg-[rgb(23_26_24/0.36)] lg:m-auto lg:w-110 lg:rounded-panel lg:p-7"
    >
      {open ? children : null}
    </dialog>
  );
}

/**
 * 취소 버튼용: 버튼이 들어 있는 <dialog> 를 네이티브로 닫는다.
 * Esc·백드롭과 같은 "즉시 닫힘 → onClose" 한 경로로 닫힌다. open 을 바깥에서 바꾸면
 * 상위 렌더(라우팅 등)가 끝날 때까지 닫히지 않고, 닫힌 뒤 close 이벤트로 onClose 가 한 번 더 불린다.
 */
export function closeDialog(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.closest("dialog")?.close();
}

/** 모달 폼의 입력칸·라벨 공용 스타일. */
export const FIELD_CLASS =
  "h-12 w-full rounded-control border border-control-line bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-mute focus:border-ink lg:px-4 lg:text-[14px]";
export const LABEL_CLASS = "text-[13px] font-bold text-ink";
