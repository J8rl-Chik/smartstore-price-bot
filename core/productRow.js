import { COLUMN } from '../google/constant.js';
import parseToNumberFromKRW from '../util/parseToNumberFromKRW.js';

export const findProductRow = (productRows, productName) =>
  productRows.find((productRow) => productRow[COLUMN.NAME] === productName);

export const parseProductRow = (row) => ({
  name: row[COLUMN.NAME],
  catalogUrl: row[COLUMN.CATALOG_URL],
  feeType: row[COLUMN.FEE_TYPE],
  freeDeliveryPrice: parseToNumberFromKRW(row[COLUMN.FREE_DELIVERY_PRICE]),
  productPrice: parseToNumberFromKRW(row[COLUMN.PRODUCT_PRICE]),
  baseFee: parseToNumberFromKRW(row[COLUMN.BASE_FEE]),
  virtualPrice: parseToNumberFromKRW(row[COLUMN.VIRTUAL_PRICE]),
  excludedSellerNames: row[COLUMN.EXCLUDED_SELLERS]
    .split(',')
    .map((sellerName) => sellerName.trim()),
});
