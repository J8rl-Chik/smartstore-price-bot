import type { Page } from 'puppeteer';

import type { Seller } from '../../domain/sellers.js';
import delayRandomSeconds from '../../utils/delayRandomSeconds.js';
import parseSellerItem from './parseSellerItem.js';

export const SELLER_ITEM_SELECTOR = '[class^="product_seller_info_wrap__"]';

/**
 * 로그인 리다이렉트, rate limit 안내 등으로 원래 가려던 가격비교 페이지가 아닌 다른 페이지로
 * 이동했을 때 던진다. 이 세션 전체가 신뢰할 수 없는 상태라는 뜻이라, 상품 단위로 건너뛰지 않고
 * 실행 자체를 즉시 중단시켜야 한다.
 */
export class UnexpectedCatalogPageError extends Error {}

const isOnExpectedCatalogPage = (page: Page, catalogURL: string): boolean =>
  new URL(page.url()).pathname === new URL(catalogURL).pathname;

const navigateToCatalog = async (
  page: Page,
  catalogURL: string,
  referer: string,
): Promise<void> => {
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

  if (!isOnExpectedCatalogPage(page, catalogURL)) {
    throw new UnexpectedCatalogPageError(
      `가격비교 페이지 대신 다른 페이지로 이동했습니다: ${page.url()}`,
    );
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
    if (error instanceof UnexpectedCatalogPageError) {
      throw error;
    }

    throw new Error('네이버 판매처 목록을 가져오지 못했습니다.', { cause: error });
  }
};

export default getSellersInPuppeteer;
