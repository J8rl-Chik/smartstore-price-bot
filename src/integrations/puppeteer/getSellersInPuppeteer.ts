import type { Page } from 'puppeteer';

import type { Seller } from '../../core/sellers.js';
import parseSellerItem from './parseSellerItem.js';

export const SELLER_ITEM_SELECTOR = '[class^="product_seller_info_wrap__"]';

const getSellerItemHTMLList = async (
  page: Page,
  catalogURL: string,
  productName: string,
): Promise<string[]> => {
  // 제품명에 괄호가 포함된 경우 요청 에러가 나서 별도로 인코딩한다.
  const encodedName = encodeURIComponent(productName).replaceAll('(', '%28').replaceAll(')', '%29');
  const referer = `https://search.shopping.naver.com/search/all?query=${encodedName}&vertical=search`;

  await page.goto(referer, { referer: 'https://search.shopping.naver.com/home' });
  await page.goto(catalogURL, { referer });

  // 요소 객체를 가져올 수 없어 outerHTML를 가져온다.
  return page.evaluate(
    (selector) => Array.from(document.querySelectorAll(selector)).map((item) => item.outerHTML),
    SELLER_ITEM_SELECTOR,
  );
};

const getSellersInPuppeteer = async (
  page: Page,
  catalogURL: string,
  productName: string,
): Promise<Seller[]> => {
  try {
    const sellerItemHTMLList = await getSellerItemHTMLList(page, catalogURL, productName);

    return sellerItemHTMLList.flatMap(parseSellerItem);
  } catch (error) {
    throw new Error('네이버 판매처 목록을 가져오지 못했습니다.', { cause: error });
  }
};

export default getSellersInPuppeteer;
