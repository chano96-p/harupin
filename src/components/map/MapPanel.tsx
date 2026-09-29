"use client";

import { useEffect } from "react";
import { env } from "@/lib/env";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

import { HtmlMarker } from "@/components/map/HtmlMarker";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  DESATURATED_STYLES,
  MOBILE_SHEET_RATIO,
  SELECTED_ZOOM,
} from "@/lib/map/config";
import type { LatLng, MapPin } from "@/lib/map/types";
import { findCategory } from "@/lib/places/categories";
import { isDesktop } from "@/lib/ui/breakpoints";

// next/dynamic + ssr:false 를 쓰지 않는다.
//   1) ssr:false 는 Server Component 에서 금지돼 있다.
//   2) 감싸도 이득이 없다. 지도는 이 화면의 주 콘텐츠라 늦게 불러올수록 손해다.
// APIProvider 가 스크립트를 클라이언트에서만 주입하므로 'use client' 만으로 충분하다.

export function MapPanel({
  pins,
  selected,
  focusedId,
}: {
  pins: MapPin[];
  selected: LatLng | null;
  /** 상세를 펼친 장소(시안 3d). 이 핀만 확대하고 나머지는 흐리게 한다. */
  focusedId: string | null;
}) {
  const focusedPin = pins.find((p) => p.id === focusedId) ?? null;

  return (
    <APIProvider apiKey={env.NEXT_PUBLIC_MAPS_KEY} language="ko" region="KR">
      <Map
        className="h-full w-full"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        styles={DESATURATED_STYLES}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
      >
        {pins.map((pin) => (
          <HtmlMarker key={pin.id} lat={pin.lat} lng={pin.lng}>
            <NumberedPin
              order={pin.order}
              name={pin.name}
              category={pin.category}
              emphasized={pin.order === 1}
              focused={pin.id === focusedPin?.id}
              dimmed={focusedPin !== null && pin.id !== focusedPin.id}
            />
          </HtmlMarker>
        ))}
        {selected ? (
          <HtmlMarker lat={selected.lat} lng={selected.lng}>
            <SelectedPin />
          </HtmlMarker>
        ) : null}

        <FitPins pins={pins} />
        {selected ? <PanTo point={selected} zoomIn /> : null}
        {focusedPin ? <PanTo point={focusedPin} zoomIn={false} /> : null}
      </Map>
    </APIProvider>
  );
}

function NumberedPin({
  order,
  name,
  category,
  emphasized,
  focused,
  dimmed,
}: {
  order: number;
  name: string;
  category: string;
  emphasized: boolean;
  focused: boolean;
  dimmed: boolean;
}) {
  const dot = findCategory(category)?.dot ?? "bg-lodging";

  if (focused) {
    // 선택 핀은 다른 핀 위에 그린다. 컨테이너가 쌓임 맥락을 만들지 않아 z-10 이 핀끼리 비교된다.
    return (
      <>
        <div
          className={`absolute top-0 left-0 z-10 grid size-11.5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-[3px] border-surface text-[18px] font-semibold text-white shadow-[0_2px_10px_rgb(31_31_29/0.24)] ${dot}`}
        >
          {order}
        </div>
        <div className="absolute top-7.5 left-0 z-10 -translate-x-1/2 rounded-md bg-white px-2 py-1 text-[12px] font-semibold whitespace-nowrap text-ink shadow-[0_1px_3px_rgb(31_31_29/0.1)]">
          {name}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`absolute top-0 left-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-2 border-surface text-[13px] font-semibold text-white shadow-[0_1px_4px_rgb(31_31_29/0.18)] ${dot} ${emphasized ? "size-8.5" : "size-7.5"} ${dimmed ? "opacity-55" : ""}`}
      >
        {order}
      </div>
      <div
        className={`absolute left-0 hidden -translate-x-1/2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink lg:block ${emphasized ? "top-5.5" : "top-5"} ${dimmed ? "opacity-55" : ""}`}
      >
        {name}
      </div>
    </>
  );
}

/** 검색에서 고른, 아직 저장 전인 장소. 순번이 없으니 카테고리 색도 쓰지 않는다. */
function SelectedPin() {
  return (
    <div className="absolute top-0 left-0 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-pill border-[3px] border-surface bg-ink shadow-[0_1px_4px_rgb(31_31_29/0.3)]" />
  );
}

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

/**
 * Day 가 바뀌거나 핀이 늘면 그 Day 의 핀이 다 보이게 맞춘다.
 * 지도를 controlled center 로 만들지 않는다 — 매 렌더마다 중심을 강제하면
 * 사용자가 지도를 못 움직인다. 좌표가 바뀔 때만 명령형으로 움직인다.
 */
function FitPins({ pins }: { pins: MapPin[] }) {
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

function PanTo({ point, zoomIn }: { point: LatLng; zoomIn: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    focusPoint(map, point, zoomIn);
    // point 객체 참조가 아니라 좌표값이 바뀔 때만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, point.lat, point.lng]);

  return null;
}
