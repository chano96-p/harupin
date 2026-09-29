/** 일정 편집 화면이 받는 여행 정보. */
export type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  region: string | null;
};

export type Day = {
  id: string;
  dayNumber: number;
  date: string;
  places: Place[];
};

export type Place = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  memo: string | null;
};

/** 화면에 그리는 장소. order 는 삭제 대기를 뺀 방문 순번이고, 카테고리 필터와 무관하다. */
export type ShownPlace = Place & { order: number };

/** 홈의 여행 카드. */
export type TripSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  placeCount: number;
  categories: string[];
};
