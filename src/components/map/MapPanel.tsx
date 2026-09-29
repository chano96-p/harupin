"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { FitPins, PanTo } from "@/components/map/camera";
import { HtmlMarker } from "@/components/map/HtmlMarker";
import { NumberedPin, SelectedPin } from "@/components/map/pins";
import { env } from "@/lib/env";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  DESATURATED_STYLES,
} from "@/lib/map/config";
import type { LatLng, MapPin } from "@/lib/map/types";

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
