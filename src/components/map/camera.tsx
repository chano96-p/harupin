"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

import { MOBILE_SHEET_RATIO, SELECTED_ZOOM } from "@/lib/map/config";
import type { LatLng, MapPin } from "@/lib/map/types";
import { isDesktop } from "@/lib/ui/breakpoints";

// 지도를 controlled center 로 만들지 않는다 — 매 렌더마다 중심을 강제하면
// 사용자가 지도를 못 움직인다. 아래 컴포넌트들은 좌표가 바뀔 때만 명령형으로 움직인다.

function mobileSheetHeight(map: google.maps.Map) {
  return map.getDiv().clientHeight * MOBILE_SHEET_RATIO;
}

/**
 * 한 점으로 이동한다. 모바일은 시트에 가리지 않는 영역의 가운데로 맞춘다.
 * zoomIn: 멀리서 보고 있으면 SELECTED_ZOOM 까지 확대한다. 상세 선택처럼 보던 배율을
 * 유지해야 할 때는 끈다.
 */
function focusPoint(map: google.maps.Map, point: LatLng, zoomIn = true) {
  map.setCenter(point);
  if (zoomIn && (map.getZoom() ?? 0) < SELECTED_ZOOM) {
    map.setZoom(SELECTED_ZOOM);
  }
  if (!isDesktop()) map.panBy(0, mobileSheetHeight(map) / 2);
}

/** Day 가 바뀌거나 핀이 늘면 그 Day 의 핀이 다 보이게 맞춘다. */
export function FitPins({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  const key = pins.map((p) => `${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (!map || pins.length === 0) return;
    // 좌표가 전부 같으면(같은 장소를 두 번 추가) 넓이 0 인 bounds 가 되어
    // fitBounds 가 최대 줌까지 확대한다. 한 점으로 취급한다.
    if (new Set(pins.map((p) => `${p.lat},${p.lng}`)).size === 1) {
      focusPoint(map, pins[0]);
      return;
    }

    const bounds = {
      north: Math.max(...pins.map((p) => p.lat)),
      south: Math.min(...pins.map((p) => p.lat)),
      east: Math.max(...pins.map((p) => p.lng)),
      west: Math.min(...pins.map((p) => p.lng)),
    };
    map.fitBounds(
      bounds,
      isDesktop()
        ? { top: 90, right: 60, bottom: 60, left: 60 }
        : {
            top: 80,
            right: 40,
            bottom: mobileSheetHeight(map) + 30,
            left: 40,
          },
    );
    // pins 배열 참조가 아니라 좌표 목록이 바뀔 때만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

/** 검색에서 고른 장소·상세를 펼친 장소로 이동한다. */
export function PanTo({ point, zoomIn }: { point: LatLng; zoomIn: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    focusPoint(map, point, zoomIn);
    // point 객체 참조가 아니라 좌표값이 바뀔 때만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, point.lat, point.lng]);

  return null;
}
