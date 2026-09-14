"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

/**
 * React 요소를 지도 좌표에 붙이는 마커.
 *
 * AdvancedMarker 는 mapId 가 필수인데, mapId 를 지정하면 MapPanel 의 styles 배열
 * (저채도 스타일)이 무시된다. 레거시 Marker 는 deprecated 라 OverlayView 로 직접 붙인다.
 *
 * 컨테이너의 좌상단이 좌표 지점이다. 자식이 스스로 가운데 정렬해야 한다.
 */
export function HtmlMarker({
  lat,
  lng,
  children,
}: {
  lat: number;
  lng: number;
  children: ReactNode;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  const overlay = useMemo(() => {
    if (!mapsLib) return null;

    class Overlay extends mapsLib.OverlayView {
      readonly container = document.createElement("div");
      private position: google.maps.LatLngLiteral = { lat: 0, lng: 0 };

      setPosition(position: google.maps.LatLngLiteral) {
        this.position = position;
        this.draw();
      }

      onAdd() {
        this.container.style.position = "absolute";
        this.getPanes()?.overlayMouseTarget.appendChild(this.container);
      }

      draw() {
        // onAdd 전에는 projection 이 없다 (setPosition 이 먼저 불릴 수 있음).
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.position);
        if (!point) return;
        this.container.style.left = `${point.x}px`;
        this.container.style.top = `${point.y}px`;
      }

      onRemove() {
        this.container.remove();
      }
    }

    return new Overlay();
  }, [mapsLib]);

  useEffect(() => {
    if (!overlay || !map) return;
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [overlay, map]);

  useEffect(() => {
    overlay?.setPosition({ lat, lng });
  }, [overlay, lat, lng]);

  if (!overlay) return null;
  return createPortal(children, overlay.container);
}
