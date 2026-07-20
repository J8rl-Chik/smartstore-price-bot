export interface ProductChannel {
  name: string;
  originProductNo: number;
  sellerManagementCode?: string;
}

export interface SaleProduct {
  channelProducts: ProductChannel[];
}

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

// 채널이 비어 있으면 신규 등록 여부를 판단할 수 없으니 안전하게 undefined로 취급한다.
const getSellerManagementCode = (saleProduct: SaleProduct): string | undefined =>
  saleProduct.channelProducts[0]?.sellerManagementCode;

export const isNewlyRegisteredProduct = (saleProduct: SaleProduct): boolean =>
  Boolean(getSellerManagementCode(saleProduct)?.includes('신규'));

export const excludeNewlyRegisteredProducts = (saleProducts: SaleProduct[]): SaleProduct[] =>
  saleProducts.filter((saleProduct) => !isNewlyRegisteredProduct(saleProduct));
