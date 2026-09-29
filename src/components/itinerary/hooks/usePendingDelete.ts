import { startTransition, useEffect, useRef, useState } from "react";

import { deletePlace } from "@/lib/actions/places";

const UNDO_MS = 5000;

/**
 * 삭제는 되돌리기(시안 3j)를 위해 UNDO_MS 뒤에 실제로 보낸다. 그동안은 화면에서만 숨긴다.
 * 삭제 후 다시 넣는 방식은 id·순번이 바뀌어 원래대로 돌아가지 않는다.
 * 대기 중에 탭을 닫으면 삭제가 취소되는데, 지워지지 않는 쪽으로 실패하므로 받아들인다.
 *
 * 대기 중인 삭제는 하나뿐이다. 그사이 다른 장소를 지우면 앞의 것은 바로 확정한다.
 */
export function usePendingDelete({
  onError,
}: {
  onError: (message: string) => void;
}) {
  // 성공한 삭제의 id 도 여기 남는다. revalidate 된 days 에 이미 없으므로 부작용이 없고,
  // 바로 빼면 revalidate 반영 전에 장소가 잠깐 되살아나 보일 수 있다.
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [undoOpen, setUndoOpen] = useState(false);
  const pendingRef = useRef<{
    placeId: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  // 화면을 떠나면(홈으로 이동 등) 대기 중인 삭제를 바로 보낸다.
  // 이동 중이라 revalidate 는 하지 않는다 (deletePlace 주석 참고).
  useEffect(() => {
    const pending = pendingRef;
    return () => {
      if (!pending.current) return;
      clearTimeout(pending.current.timer);
      void deletePlace(pending.current.placeId, false);
    };
  }, []);

  // 폼 action 이 아닌 곳에서 Server Action 을 부를 때는 startTransition 으로 감싼다
  // (Next 문서 mutating-data). await 뒤의 업데이트는 transition 에 다시 넣어야 한다.
  function commit(placeId: string) {
    startTransition(async () => {
      const { error } = await deletePlace(placeId);
      if (!error) return;
      startTransition(() => {
        setHiddenIds((ids) => ids.filter((id) => id !== placeId));
        onError(error);
      });
    });
  }

  function requestDelete(placeId: string) {
    const prev = pendingRef.current;
    if (prev) {
      clearTimeout(prev.timer);
      commit(prev.placeId);
    }

    const timer = setTimeout(() => {
      pendingRef.current = null;
      setUndoOpen(false);
      commit(placeId);
    }, UNDO_MS);

    pendingRef.current = { placeId, timer };
    setHiddenIds((ids) => [...ids, placeId]);
    setUndoOpen(true);
  }

  function undoDelete() {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    setHiddenIds((ids) => ids.filter((id) => id !== pending.placeId));
    setUndoOpen(false);
  }

  return { hiddenIds, undoOpen, requestDelete, undoDelete };
}
