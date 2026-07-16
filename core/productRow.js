import { COLUMN } from '../google/constant.js';
import parseToNumberFromKRW from './parseToNumberFromKRW.js';
import { DELIVERY_FEE_TYPE } from './constant.js';

export const findProductRow = (productRows, productName) =>
  productRows.find((productRow) => productRow[COLUMN.NAME] === productName);

const parseVirtualPrice = (virtualPrice) => {
  if (virtualPrice === '') {
    return null;
  }

  return parseToNumberFromKRW(virtualPrice);
};

const validateFeeType = (feeType) => {
  if (!Object.values(DELIVERY_FEE_TYPE).includes(feeType)) {
    throw new Error(`알 수 없는 배송비 유형입니다: "${feeType}"`);
  }

  return feeType;
};

export const parseProductRow = (row) => ({
  name: row[COLUMN.NAME],
  catalogUrl: row[COLUMN.CATALOG_URL],
  feeType: validateFeeType(row[COLUMN.FEE_TYPE]),
  freeDeliveryPrice: parseToNumberFromKRW(row[COLUMN.FREE_DELIVERY_PRICE]),
  productPrice: parseToNumberFromKRW(row[COLUMN.PRODUCT_PRICE]),
  baseFee: parseToNumberFromKRW(row[COLUMN.BASE_FEE]),
  virtualPrice: parseVirtualPrice(row[COLUMN.VIRTUAL_PRICE]),
  excludedSellerNames: row[COLUMN.EXCLUDED_SELLERS]
    .split(',')
    .map((sellerName) => sellerName.trim()),
});
