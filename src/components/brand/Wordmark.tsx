/**
 * 하루핀 워드마크. 시안 2a 에서 확정된 D 안 — "핀" 위에 코랄 점을 얹어
 * 지도 핀을 암시한다. 아이콘이 필요한 자리(파비콘·앱 아이콘)는 워드마크가 아니라
 * 서브마크(코랄 점 + 핀)를 쓴다.
 *
 * flex 로 짜지 않는다. flex 아이템이 되면 자식이 block 으로 승격돼
 * "하루" 와 "핀" 이 두 덩어리로 갈리고, 스크린리더가 한 단어로 읽지 않는다.
 * 인라인 텍스트로 두면 ARIA 없이도 "하루핀" 으로 읽힌다.
 *
 * 점 크기를 em 으로 잡아 글자 크기만 바꾸면 비율이 따라온다.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-[-0.02em] text-ink ${className}`}>
      하루
      <span className="relative">
        <span
          aria-hidden
          className="absolute bottom-full left-1/2 mb-[0.15em] size-[0.35em] -translate-x-1/2 rounded-pill bg-food"
        />
        핀
      </span>
    </span>
  );
}
