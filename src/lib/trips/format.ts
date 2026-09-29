const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// DB 의 date 는 "YYYY-MM-DD" 문자열이다. UTC 자정으로 파싱해 getUTC* 로 읽어야
// 브라우저 시간대에 따라 하루가 밀리지 않는다.
export function formatDayDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
}

/** "2026-09-14" → "2026.09.14" */
export function formatDate(date: string): string {
  return date.replaceAll("-", ".");
}

// 종료일의 연도는 시작일과 같을 때만 생략한다. 항상 자르면
// "2026.12.30 – 01.02" 처럼 이듬해인지 알 수 없게 된다.
export function formatTripRange(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const endText = formatDate(end);
  return `${formatDate(start)} – ${sameYear ? endText.slice(5) : endText}`;
}
