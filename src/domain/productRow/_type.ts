import { DeliveryFeeType } from '../delivery/_type.js';

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

export type RowValues = readonly [
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
