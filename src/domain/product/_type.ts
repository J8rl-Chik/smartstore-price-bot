import type { DeliveryFeeType } from '../delivery/_type.js';

// 구글 시트에서 가져온 행들을 프로그램 내에서 편하게 사용할 수 있도록 변환한 형태.
export interface ProductRow {
  name: string;
  catalogURL: string;
  activate: string;
  feeType: DeliveryFeeType;
  freeDeliveryPrice: number;
  productPrice: number;
  baseFee: number;
  virtualPrice: number | null;
  excludedSellerNames: string[];
}

export type ColumnKey = keyof ProductRow;

export type Column = {
  [K in ColumnKey]: number;
};

export type RawProductRow = {
  [K in ColumnKey]: string;
};

// 값이 빈 셀은 행에 포함되지 않는다. 그래서 크기가 고정이 아니다.
export type EmptyRowValues = string[];

// 값이 빈 셀로 인해 크기를 고정시키는 과정을 거칠 경우 아래 타입이된다.
export type RowValues = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
