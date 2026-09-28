import { getProductName, type SaleProduct } from './saleProduct.js';
import type { ProductRow } from './_type.js';

export const filterMatchedSaleProducts = (
  saleProducts: SaleProduct[],
  productRows: ProductRow[],
): SaleProduct[] =>
  saleProducts.filter((saleProduct) =>
    productRows.some(({ name }) => name === getProductName(saleProduct)),
  );
