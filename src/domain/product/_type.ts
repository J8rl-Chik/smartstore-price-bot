import type { Delivery, DeliveryFeeType } from '../delivery/_type.js';
// COLUMN은 값이지만 ColumnKey의 typeof로만 쓰므로, 런타임에 _constant.js를 불러오지 않도록 import type으로 가져온다.
import type { COLUMN } from './_constant.js';

export interface ProductChannel {
  name: string;
  originProductNo: number;
  salePrice: number;
  stockQuantity: number;
  deliveryFee: number;
  sellerManagementCode?: string;
}

export interface SaleProduct {
  channelProducts: ProductChannel[];
}

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

export type ColumnKey = keyof typeof COLUMN;

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

export interface TargetProduct {
  name: ProductChannel['name'];
  originProductNo: ProductChannel['originProductNo'];
  store: Pick<ProductChannel, 'salePrice' | 'stockQuantity' | 'deliveryFee'>;
  sheet: Pick<
    ProductRow,
    'catalogURL' | 'virtualPrice' | 'freeDeliveryPrice' | 'productPrice' | 'excludedSellerNames'
  > & { delivery: Delivery };
}

/**
 * 가격 수정 상태에 따라 가진 값이 달라서 status로 구분하는 유니온으로 둔다.
 * price: 배송비를 제외한 수정 판매가, time: 수정(또는 실패)한 시각의 타임스탬프(ms)
 */
export type TargetProductUpdate =
  | { status: 'wait' }
  | { status: 'complete'; price: number; baseFee: number; time: number }
  | { status: 'error'; time: number };

export interface TargetProductWithUpdate extends TargetProduct {
  update: TargetProductUpdate;
}

/**
 * main이 가격 수정 순회 중 상태가 바뀔 때마다 통째로 보내는 상태.
 * currentIndex: 지금 처리 중인 상품의 targetProducts 인덱스. 순회 중이 아니면 null.
 */
export interface UpdateState {
  targetProducts: TargetProductWithUpdate[];
  currentIndex: number | null;
  isRunning: boolean;
}
