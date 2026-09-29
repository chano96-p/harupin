// 서울시청. 핀이 있으면 FitPins 가 바로 옮긴다.
export const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
export const DEFAULT_ZOOM = 12;
export const SELECTED_ZOOM = 15;

// 모바일은 바텀시트가 지도 아래쪽을 덮는다. 핀이 시트 뒤로 숨지 않게 그만큼 비워두고 맞춘다.
// ItineraryPanel 의 접힌 시트 높이(h-[40%])와 같은 값이어야 한다.
export const MOBILE_SHEET_RATIO = 0.4;

// mapId가 없을 때만 쓰는 임시 스타일. 채도를 낮추고 POI 라벨 밀도를 줄여 카테고리 색 핀이 주인공이 되게 한다.
// mapId를 지정하면 Google 이 이 배열을 무시하고 콘솔 경고를 띄우므로 함께 쓰지 않는다.
export const DESATURATED_STYLES: google.maps.MapTypeStyle[] = [
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
