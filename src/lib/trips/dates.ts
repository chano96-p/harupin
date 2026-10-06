const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" 에 days 일을 더한다. UTC 기준이라 시간대와 무관하다. */
export function shiftDate(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** 시작일~종료일의 일수(양끝 포함). 순서가 뒤집혔으면 0 이하가 된다. */
export function countDays(start: string, end: string): number {
  return (
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS) +
    1
  );
}

/**
 * 오늘 날짜("YYYY-MM-DD"). 한국 시간 기준이다 — 서버(Vercel)는 UTC 라
 * 그대로 쓰면 오전 9시 전까지 하루 전 날짜가 된다.
 */
export function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
}
