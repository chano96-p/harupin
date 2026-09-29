/** 자동완성 목록의 한 줄. */
export type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

/** 검색에서 고른, 아직 저장 전인 장소. */
export type SelectedPlace = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
};
