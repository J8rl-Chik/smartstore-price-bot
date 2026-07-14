import fetch from 'node-fetch';

import generateAccessToken from './generateAccessToken.js';
import isManualTestRun from '../util/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  getSaleProducts().then((saleProducts) =>
    console.log(`getSaleProducts 함수 테스트: ${saleProducts.length}개 판매 중`),
  );
}

export default async function getSaleProducts() {
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

  const { contents } = await response.json();

  return contents.filter((content) => {
    const productCode = content.channelProducts[0].sellerManagementCode;

    return !productCode?.includes('신규');
  });
}
