"use client";

import { useEffect } from "react";
import { env } from "@/lib/env";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

import { HtmlMarker } from "@/components/map/HtmlMarker";
import { CATEGORIES } from "@/lib/places/categories";

// next/dynamic + ssr:false 를 쓰지 않는다.
//   1) ssr:false 는 Server Component 에서 금지돼 있다.
//   2) 감싸도 이득이 없다. 지도는 이 화면의 주 콘텐츠라 늦게 불러올수록 손해다.
// APIProvider 가 스크립트를 클라이언트에서만 주입하므로 'use client' 만으로 충분하다.

// 서울시청. 핀이 있으면 FitPins 가 바로 옮긴다.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;

// 모바일은 바텀시트(ItineraryPanel 의 h-[40%])가 지도 아래쪽을 덮는다.
// 핀이 시트 뒤로 숨지 않게 그만큼 비워두고 맞춘다.
const DESKTOP_QUERY = "(min-width: 64rem)";
const MOBILE_SHEET_RATIO = 0.4;

// mapId가 없을 때만 쓰는 임시 스타일. 채도를 낮추고 POI 라벨 밀도를 줄여 카테고리 색 핀이 주인공이 되게 한다.
// mapId를 지정하면 Google 이 이 배열을 무시하고 콘솔 경고를 띄우므로 함께 쓰지 않는다.
const DESATURATED_STYLES = [
  { elementType: "geometry", stylers: [{ saturation: -45 }] },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

export type LatLng = { lat: number; lng: number };
export type MapPin = LatLng & { id: string; name: string; category: string };

export function MapPanel({
  pins,
  selected,
}: {
  pins: MapPin[];
  selected: LatLng | null;
}) {
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
        {pins.map((pin, i) => (
          <HtmlMarker key={pin.id} lat={pin.lat} lng={pin.lng}>
            <NumberedPin
              order={i + 1}
              name={pin.name}
              category={pin.category}
              emphasized={i === 0}
            />
          </HtmlMarker>
        ))}
        {selected ? (
          <HtmlMarker lat={selected.lat} lng={selected.lng}>
            <SelectedPin />
          </HtmlMarker>
        ) : null}

        <FitPins pins={pins} />
        {selected ? <PanTo point={selected} /> : null}
      </Map>
    </APIProvider>
  );
}

function NumberedPin({
  order,
  name,
  category,
  emphasized,
}: {
  order: number;
  name: string;
  category: string;
  emphasized: boolean;
}) {
  const dot = CATEGORIES.find((c) => c.value === category)?.dot ?? "bg-lodging";

  return (
    <>
      <div
        className={`absolute top-0 left-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-2 border-surface text-[13px] font-semibold text-white shadow-[0_1px_4px_rgb(31_31_29/0.18)] ${dot} ${emphasized ? "size-8.5" : "size-7.5"}`}
      >
        {order}
      </div>
      <div
        className={`absolute left-0 hidden -translate-x-1/2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink lg:block ${emphasized ? "top-5.5" : "top-5"}`}
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

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function mobileSheetHeight(map: google.maps.Map) {
  return map.getDiv().clientHeight * MOBILE_SHEET_RATIO;
}

/** 한 점으로 이동한다. 모바일은 시트에 가리지 않는 영역의 가운데로 맞춘다. */
function focusPoint(map: google.maps.Map, point: LatLng) {
  map.setCenter(point);
  if ((map.getZoom() ?? 0) < SELECTED_ZOOM) map.setZoom(SELECTED_ZOOM);
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

function PanTo({ point }: { point: LatLng }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    focusPoint(map, point);
    // point 객체 참조가 아니라 좌표값이 바뀔 때만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, point.lat, point.lng]);

  return null;
}
