import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";

import { reorderPlaces } from "@/lib/actions/places";
import type { Day, Place } from "@/lib/trips/types";

/**
 * 놓는 즉시 새 순서를 보여준다. 저장 transition 이 끝나면 서버 값(revalidate 된 days)으로
 * 자연히 대체되고, 실패하면 원래 순서로 돌아간다.
 */
export function useOptimisticOrder({
  days,
  onError,
}: {
  days: Day[];
  onError: (message: string) => void;
}) {
  const router = useRouter();

  // placeIds 는 숨긴 장소까지 포함한 Day 전체 목록이다(reorder).
  // 그사이 새로 추가돼 목록에 없는 장소는 서버 reorder_places 와 똑같이 뒤에 붙인다.
  const [orderedDays, applyOrder] = useOptimistic(
    days,
    (state, next: { dayId: string; placeIds: string[] }) =>
      state.map((d) => {
        if (d.id !== next.dayId) return d;
        const byId = new Map(d.places.map((p) => [p.id, p]));
        const ordered = next.placeIds.flatMap((id) => byId.get(id) ?? []);
        const rest = d.places.filter((p) => !next.placeIds.includes(p.id));
        return { ...d, places: [...ordered, ...rest] };
      }),
  );

  /**
   * visibleIds: 화면에 보이는 장소의 새 순서.
   * isShown 이 false 인 장소(삭제 대기·필터로 꺼둔 카테고리)는 제자리에 두고,
   * 보이는 칸만 새 순서로 채운 전체 목록을 보낸다.
   * 빼고 보내면 맨 뒤로 밀려서, 되돌리거나 필터를 풀었을 때 원래 자리에 있지 않다.
   */
  function reorder(
    dayId: string,
    visibleIds: string[],
    isShown: (place: Place) => boolean,
  ) {
    const queue = [...visibleIds];
    const placeIds = (
      orderedDays.find((d) => d.id === dayId)?.places ?? []
    ).map((p) => (isShown(p) ? (queue.shift() ?? p.id) : p.id));

    startTransition(async () => {
      applyOrder({ dayId, placeIds });
      const { error } = await reorderPlaces(dayId, placeIds);
      if (!error) return;
      // 다른 탭에서 지운 장소가 목록에 남아 있으면 서버가 거부한다. 실패 시에는
      // revalidate 가 일어나지 않아 새로고침 전까지 같은 실패가 반복되므로 최신 목록을 다시 받는다.
      startTransition(() => {
        onError(error);
        router.refresh();
      });
    });
  }

  return { orderedDays, reorder };
}
