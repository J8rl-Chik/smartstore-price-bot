import { getOriginProductNo, getProductName } from './saleProduct.js';
import type { ProductRow, SaleProduct, TargetProduct } from './_type.js';

/**
 * saleProducts를 순회하며 이름이 같은 첫 번째 productRow를 찾아 TargetProduct로 만든다.
 * 일치하는 productRow가 없는 saleProduct는 결과에서 제외하고, saleProducts의 순서를 유지한다.
 */
export const createTargetProducts = (
  saleProducts: SaleProduct[],
  productRows: ProductRow[],
): TargetProduct[] => {
  const targetProducts: TargetProduct[] = [];

  for (const saleProduct of saleProducts) {
    const name = getProductName(saleProduct);
    const productRow = productRows.find((row) => row.name === name);

    if (!productRow) {
      continue;
    }

    targetProducts.push({
      name,
      originProductNo: getOriginProductNo(saleProduct),
      catalogURL: productRow.catalogURL,
      feeType: productRow.feeType,
      freeDeliveryPrice: productRow.freeDeliveryPrice,
      productPrice: productRow.productPrice,
      baseFee: productRow.baseFee,
      virtualPrice: productRow.virtualPrice,
      excludedSellerNames: productRow.excludedSellerNames,
    });
  }

  return targetProducts;
};
