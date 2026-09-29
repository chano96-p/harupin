export type LatLng = { lat: number; lng: number };

export type MapPin = LatLng & {
  id: string;
  name: string;
  category: string;
  /** 방문 순번. 필터로 일부 핀이 빠져도 번호는 그대로다. */
  order: number;
};
