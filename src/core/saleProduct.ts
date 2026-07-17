export interface ProductChannel {
  name: string;
  originProductNo: number;
}

export interface SaleProduct {
  channelProducts: ProductChannel[];
}

export const getProductName = (saleProduct: SaleProduct): string =>
  // 현재 단일 채널로만 상품을 판매하므로 channelProducts는 요소가 1개다.
  saleProduct.channelProducts[0].name;

export const getOriginProductNo = (saleProduct: SaleProduct): number =>
  saleProduct.channelProducts[0].originProductNo;
