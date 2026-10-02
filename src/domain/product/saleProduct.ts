import type { ProductChannel, SaleProduct } from './_type.js';

// 현재 단일 채널로만 상품을 판매하므로 channelProducts는 요소가 1개다.
const getFirstChannelProduct = (saleProduct: SaleProduct): ProductChannel => {
  const [channelProduct] = saleProduct.channelProducts;

  if (!channelProduct) {
    throw new Error('channelProducts가 비어 있습니다.');
  }

  return channelProduct;
};

export const getProductName = (saleProduct: SaleProduct): string =>
  getFirstChannelProduct(saleProduct).name;

export const getOriginProductNo = (saleProduct: SaleProduct): number =>
  getFirstChannelProduct(saleProduct).originProductNo;

export const isNewlyRegisteredProduct = (saleProduct: SaleProduct): boolean => {
  return Boolean(getFirstChannelProduct(saleProduct).sellerManagementCode?.includes('신규'));
};

export const excludeNewlyRegisteredProducts = (saleProducts: SaleProduct[]): SaleProduct[] =>
  saleProducts.filter((saleProduct) => !isNewlyRegisteredProduct(saleProduct));
