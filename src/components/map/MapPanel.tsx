"use client";

import { env } from "@/lib/env";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

// next/dynamic + ssr:false 를 쓰지 않는다.
//   1) ssr:false 는 Server Component 에서 금지돼 있다.
//   2) 감싸도 이득이 없다. 지도는 이 화면의 주 콘텐츠라 늦게 불러올수록 손해다.
// APIProvider 가 스크립트를 클라이언트에서만 주입하므로 'use client' 만으로 충분하다.

// 서울시청. 여행이 생기면 fitBounds 로 대체된다.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 12;

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

export function MapPanel() {
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
      />
    </APIProvider>
  );
}
