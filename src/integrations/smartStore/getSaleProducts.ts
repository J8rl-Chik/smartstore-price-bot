import fetch from 'node-fetch';

import type { SaleProduct } from '../../domain/product/_type.js';
import generateAccessToken from './generateAccessToken.js';
import checkSmartStoreApiSucceeded, {
  type SmartStoreApiResult,
} from './checkSmartStoreApiSucceeded.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

interface SaleProductsResult extends SmartStoreApiResult {
  contents: SaleProduct[];
}

async function getSaleProducts(): Promise<SaleProduct[]> {
  try {
    const accessToken = await generateAccessToken();
    const response = await fetch(`https://api.commerce.naver.com/external/v1/products/search`, {
      method: 'POST',
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productStatusTypes: ['SALE'],
        size: 500,
      }),
    });
    const result: SaleProductsResult = await response.json();

    checkSmartStoreApiSucceeded(result);

    return result.contents;
  } catch (error) {
    throw new Error(ERROR_MESSAGE.SALE_PRODUCTS_FETCH_FAILED, { cause: error });
  }
}

export default getSaleProducts;
