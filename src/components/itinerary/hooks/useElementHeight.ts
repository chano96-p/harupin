import { useEffect, useState, type RefObject } from "react";

/** 요소의 border-box 높이(px)를 따라간다. 글자 크기·줄바꿈이 바뀌어도 맞춰진다. */
export function useElementHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.borderBoxSize[0]?.blockSize ?? el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
