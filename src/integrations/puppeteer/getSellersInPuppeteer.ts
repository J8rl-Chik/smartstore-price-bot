import type { Page } from 'puppeteer';

import type { Seller } from '../../core/sellers.js';
import parseSellerRow from './parseSellerRow.js';

const PRODUCT_SELLER_ROW_SELECTOR = '[class^="product_seller_info_wrap__"]';

const getSellersInPuppeteer = async (
  page: Page,
  catalogUrl: string,
  productName: string,
): Promise<Seller[]> => {
  try {
    // 제품명에 괄호가 포함된 경우 요청 에러가 나서 별도로 인코딩한다.
    const encodedName = encodeURIComponent(productName)
      .replaceAll('(', '%28')
      .replaceAll(')', '%29');
    const referer = `https://search.shopping.naver.com/search/all?query=${encodedName}&vertical=search`;

    await page.goto(referer, { referer: 'https://search.shopping.naver.com/home' });
    await page.goto(catalogUrl, { referer });

    // 파싱은 브라우저가 아니라 Node(parseSellerRow)에서 하므로, 여기서는 outerHTML만 가져온다.
    const rowsHtml = await page.evaluate(
      (selector) => Array.from(document.querySelectorAll(selector)).map((row) => row.outerHTML),
      PRODUCT_SELLER_ROW_SELECTOR,
    );

    return rowsHtml.flatMap(parseSellerRow);
  } catch (error) {
    throw new Error('네이버 판매처 목록을 가져오지 못했습니다.', { cause: error });
  }
};

export default getSellersInPuppeteer;
