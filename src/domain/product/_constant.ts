import type { Column } from './_type.js';

// 구글 시트 "A~L" 범위 12개 컬럼의 인덱스(프로그램 실행에 불필요한 범위는 제외).
export const COLUMN: Column = {
  name: 0,
  catalogURL: 1,
  activate: 2,
  feeType: 6,
  freeDeliveryPrice: 7,
  productPrice: 8,
  baseFee: 9,
  virtualPrice: 10,
  excludedSellerNames: 11,
} as const;
