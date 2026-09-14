const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// DB 의 date 는 "YYYY-MM-DD" 문자열이다. UTC 자정으로 파싱해 getUTC* 로 읽어야
// 브라우저 시간대에 따라 하루가 밀리지 않는다.
export function formatDayDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
}

export function formatTripRange(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const endText = sameYear ? end.slice(5) : end;
  return `${start.replaceAll("-", ".")} – ${endText.replaceAll("-", ".")}`;
}
