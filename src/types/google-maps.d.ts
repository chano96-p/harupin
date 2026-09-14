// 전역 google.maps 네임스페이스는 @types/google.maps 가 제공한다.
// tsc CLI 는 node_modules/@types 를 암묵적으로 전부 포함해 통과하지만,
// 에디터의 TS 서버는 이 암묵 포함에 기대면 못 찾는 경우가 있어 명시한다.
/// <reference types="google.maps" />
