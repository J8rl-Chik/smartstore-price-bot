import { filterMatchedSaleProducts } from './filterMatchedSaleProducts.js';
import type { ProductRowsResponse, SaleProduct, SaleProductsResponse } from './_type.js';

export const getMatchedSaleProducts = (
  saleProductsResponse: SaleProductsResponse | null,
  productRowsResponse: ProductRowsResponse | null,
): SaleProduct[] | null => {
  if (!saleProductsResponse?.isSuccess || !productRowsResponse?.isSuccess) {
    return null;
  }

  return filterMatchedSaleProducts(
    saleProductsResponse.saleProducts,
    productRowsResponse.productRows,
  );
};
