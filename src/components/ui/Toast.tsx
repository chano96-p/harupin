/**
 * 화면 아래에 뜨는 알림 한 줄 + 동작 버튼 하나(되돌리기·닫기).
 * role: 결과 알림은 status, 실패는 alert.
 */
export function Toast({
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
      className="flex items-center gap-3 rounded-card bg-ink px-4 py-3.5 shadow-pop"
    >
      <p className="flex-1 text-[13.5px] text-surface">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="text-[13.5px] font-bold text-brand"
      >
        {actionLabel}
      </button>
    </div>
  );
}
