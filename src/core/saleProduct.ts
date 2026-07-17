export interface SaleProductChannel {
  name: string;
  originProductNo: number;
  sellerManagementCode?: string;
}

export interface SaleProduct {
  channelProducts: SaleProductChannel[];
}

// 현재 나의 스토어는 단일 채널로만 상품을 등록하므로 channelProducts는 항상 원소 1개다.
export const getProductName = (saleProduct: SaleProduct): string =>
  saleProduct.channelProducts[0].name;

export const getOriginProductNo = (saleProduct: SaleProduct): number =>
  saleProduct.channelProducts[0].originProductNo;
