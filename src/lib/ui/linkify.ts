export type TextPart = { kind: "text" | "link"; value: string };

// http(s) 로 시작하는 주소만 잡는다. 문자는 URL 에 쓰는 ASCII 로 한정한다 —
// 넓게 잡으면 "https://a.com에서" 처럼 붙어 쓴 한글까지 주소로 먹는다.
// 대가로 경로에 한글이 그대로 들어간 주소(…/wiki/서울)는 한글 앞에서 끊긴다.
// 퍼센트 인코딩된 주소(…/wiki/%EC%84%9C…)와 punycode 호스트는 그대로 잡힌다.
const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
// 문장 끝 문장부호는 주소가 아니다. 닫는 괄호는 짝이 안 맞을 때만 뗀다
// (위키백과처럼 주소 안에 괄호가 들어가는 경우가 있다).
const TRAILING = /[.,!?;:'"\]}]$/;

function trimTrailing(url: string): string {
  // 괄호 수는 한 번만 센다. 한 글자 뗄 때마다 다시 세면 ")" 가 많은 입력에서 O(n²) 가 된다.
  let open = 0;
  let close = 0;
  for (const ch of url) {
    if (ch === "(") open++;
    else if (ch === ")") close++;
  }

  let end = url.length;
  while (end > 0) {
    const ch = url[end - 1];
    if (TRAILING.test(ch)) {
      end--;
    } else if (ch === ")" && open < close) {
      end--;
      close--;
    } else {
      break;
    }
  }
  return url.slice(0, end);
}

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") && !!url.host
    );
  } catch {
    return false;
  }
}

/**
 * 글을 일반 글자와 링크 조각으로 나눈다. 링크는 http·https 만이다
 * (javascript: 같은 주소는 누르는 순간 스크립트가 실행될 수 있다).
 * 결과를 이어 붙이면 원문과 같다.
 */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimTrailing(match[0]);
    if (!isWebUrl(url)) continue;
    const start = match.index;
    if (start > last)
      parts.push({ kind: "text", value: text.slice(last, start) });
    parts.push({ kind: "link", value: url });
    last = start + url.length;
  }

  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}
