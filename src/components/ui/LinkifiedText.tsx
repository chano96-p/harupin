import { splitLinks } from "@/lib/ui/linkify";

/**
 * 글 안의 http(s) 주소를 새 탭 링크로 보여준다. 저장된 글은 바꾸지 않는다.
 * HTML 을 넣지 않고 조각을 React 로 그리므로 글 안의 태그는 그대로 글자로 보인다.
 */
export function LinkifiedText({ text }: { text: string }) {
  return splitLinks(text).map((part, i) =>
    part.kind === "link" ? (
      <a
        key={i}
        href={part.value}
        target="_blank"
        // noopener: 열린 페이지가 window.opener 로 이 탭을 조작하지 못하게.
        // noreferrer: 여행 페이지 주소(여행 id 포함)를 상대에게 넘기지 않게.
        rel="noopener noreferrer"
        className="break-all text-brand-deep underline decoration-brand-deep/40 underline-offset-2 hover:decoration-brand-deep"
      >
        {part.value}
      </a>
    ) : (
      part.value
    ),
  );
}
