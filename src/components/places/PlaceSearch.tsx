"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Suggestion = { placeId: string; mainText: string; secondaryText: string };
export type SelectedPlace = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
};

const DEBOUNCE_MS = 300;

export function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: SelectedPlace) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google 세션 토큰: 이 검색 세션(타이핑 시작부터 선택까지) 내내 재사용하고,
  // 선택이 끝나면(Details 호출로 세션이 종료되면) 다음 검색을 위해 새로 발급한다.
  // 비밀값이 아니라 과금 그룹핑용 문자열이라 클라이언트에서 만들어도 안전하다.
  const sessionToken = useRef(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  // 언마운트 시 대기 중인 디바운스 타이머만 정리한다. setState 는 안 부른다.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const search = useCallback(async (input: string) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, sessionToken: sessionToken.current }),
      });
      const data = await res.json();

      // 느린 응답이 최신 응답보다 늦게 도착하는 경합을 막는다 — 시퀀스가
      // 어긋나면(더 최근 요청이 이미 있었으면) 이 결과는 버린다.
      if (seq !== requestSeq.current) return;

      if (!res.ok) {
        setError(data.error ?? "검색에 실패했습니다.");
        setSuggestions([]);
        return;
      }
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch {
      if (seq !== requestSeq.current) return;
      setError("검색에 실패했습니다.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      // 진행 중이던 검색 결과가 뒤늦게 와도 반영되지 않도록 시퀀스를 무효화한다.
      requestSeq.current++;
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => void search(trimmed), DEBOUNCE_MS);
  }

  const selectSuggestion = useCallback(
    async (s: Suggestion) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          placeId: s.placeId,
          sessionToken: sessionToken.current,
        });
        const res = await fetch(`/api/places/details?${params}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "장소 정보를 가져오지 못했습니다.");
          return;
        }

        onSelect(data as SelectedPlace);
        setQuery(s.mainText);
        setOpen(false);
        setSuggestions([]);
        // 세션 종료 — 다음 검색은 새 토큰으로 시작한다.
        sessionToken.current = crypto.randomUUID();
      } catch {
        setError("장소 정보를 가져오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [onSelect],
  );

  return (
    <div className="relative w-full max-w-95">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="장소, 주소 검색"
        className="h-11 w-full rounded-control border border-control-line bg-surface px-3.5 text-[14px] text-ink shadow-overlay outline-none placeholder:text-ink-mute focus:border-ink"
      />

      {open && (suggestions.length > 0 || loading || error) ? (
        // 이 목록을 누를 때 input 이 blur 되지 않게 막는다. 막지 않으면 blur 가
        // 클릭보다 먼저 발생해 목록이 닫혀버리고, 그 아래 버튼의 onClick 은
        // 아예 발동하지 않는다(실측: mousedown 을 막지 않으면 선택 자체가 실패한다).
        <ul
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 z-10 mt-1.5 w-full overflow-hidden rounded-card border border-line bg-surface shadow-overlay"
        >
          {error ? (
            <li className="px-3.5 py-3 text-[13px] text-food-deep">{error}</li>
          ) : loading && suggestions.length === 0 ? (
            <li className="px-3.5 py-3 text-[13px] text-ink-soft">검색 중…</li>
          ) : (
            suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => void selectSuggestion(s)}
                  className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-hover"
                >
                  <span className="text-[14px] font-semibold text-ink">
                    {s.mainText}
                  </span>
                  {s.secondaryText ? (
                    <span className="text-[12px] text-ink-soft">
                      {s.secondaryText}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
