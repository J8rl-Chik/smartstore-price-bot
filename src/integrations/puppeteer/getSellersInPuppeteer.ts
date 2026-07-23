import type { Page } from 'puppeteer';

import type { Seller } from '../../domain/sellers.js';
import delayRandomSeconds from '../../utils/delayRandomSeconds.js';
import loginNaver from './loginNaver.js';
import parseSellerItem from './parseSellerItem.js';

export const SELLER_ITEM_SELECTOR = '[class^="product_seller_info_wrap__"]';

/**
 * 세션이 rate limit 등으로 끊기면 카탈로그 페이지 대신 네이버 로그인 페이지
 * (nid.naver.com/nidlogin.login?url=...)로 리다이렉트된다.
 */
const isRedirectedToLogin = (page: Page): boolean =>
  page.url().startsWith('https://nid.naver.com/');

const navigateToCatalog = async (
  page: Page,
  catalogURL: string,
  referer: string,
): Promise<void> => {
  await page.goto('https://www.naver.com/');
  await delayRandomSeconds(2, 5);

  await page.goto('https://search.shopping.naver.com/home', { referer: 'https://www.naver.com/' });
  await delayRandomSeconds(2, 5);

  await page.goto(referer, { referer: 'https://search.shopping.naver.com/home' });
  await delayRandomSeconds(2, 5);

  await page.goto(catalogURL, { referer });
  await delayRandomSeconds(2, 5);
};

const getSellerItemHTMLList = async (
  page: Page,
  catalogURL: string,
  productName: string,
): Promise<string[]> => {
  // 제품명에 괄호가 포함된 경우 요청 에러가 나서 별도로 인코딩한다.
  const encodedName = encodeURIComponent(productName).replaceAll('(', '%28').replaceAll(')', '%29');
  const referer = `https://search.shopping.naver.com/search/all?query=${encodedName}&vertical=search`;

  await navigateToCatalog(page, catalogURL, referer);

  if (isRedirectedToLogin(page)) {
    // 세션이 끊긴 것으로 판단해, 다른 페이지로 이동하지 않고 현재 로그인 화면에서 바로
    // 재로그인한 뒤 카탈로그 접근을 한 번만 재시도한다.
    await loginNaver(page, true);
    await delayRandomSeconds(1, 2);

    await navigateToCatalog(page, catalogURL, referer);

    if (isRedirectedToLogin(page)) {
      throw new Error('재로그인 후에도 카탈로그 페이지 대신 로그인 화면으로 리다이렉트됩니다.');
    }
  }

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
