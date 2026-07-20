import fetch from 'node-fetch';

import type { SaleProduct } from '../../core/saleProduct.js';
import generateAccessToken from './generateAccessToken.js';
import checkNaverApiSucceeded, { type NaverApiResult } from './checkNaverApiSucceeded.js';

interface SaleProductsResult extends NaverApiResult {
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

    checkNaverApiSucceeded(result);

    return result.contents;
  } catch (error) {
    throw new Error('네이버 판매 상품 목록을 가져오지 못했습니다.', { cause: error });
  }
}

export default getSaleProducts;
