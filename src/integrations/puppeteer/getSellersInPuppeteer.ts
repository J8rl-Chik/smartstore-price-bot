import type { Page } from 'puppeteer';

import type { Seller } from '../../domain/sellers.js';
import delayRandomSeconds from '../../utils/delayRandomSeconds.js';
import parseSellerItem from './parseSellerItem.js';

export const SELLER_ITEM_SELECTOR = '[class^="product_seller_info_wrap__"]';

/**
 * 로그인 리다이렉트, rate limit 안내 등으로 원래 가려던 가격비교 페이지가 아닌 다른 페이지로
 * 이동했을 때 던진다. 조회 속도가 한도를 넘었다는 신호라 상품 단위로 건너뛰어봐야 소용이 없고,
 * 호출부가 충분히 대기한 뒤 재개해야 한다.
 */
export class UnexpectedCatalogPageError extends Error {}

const SHOPPING_HOME_URL = 'https://search.shopping.naver.com/home';
const NAVER_HOME_URL = 'https://www.naver.com/';

/**
 * rate limit에 걸리면 URL은 그대로 카탈로그 페이지인 채로 "쇼핑 접속이 일시적으로
 * 제한되었습니다" 같은 안내 문구만 렌더링된다. URL 비교로는 이 경우를 잡을 수 없어
 * 페이지 텍스트를 직접 확인한다.
 */
const RESTRICTED_PAGE_MESSAGE = '쇼핑 서비스 접속이 일시적';

const isRestrictedPage = (page: Page): Promise<boolean> =>
  page.evaluate((message) => document.body.innerText.includes(message), RESTRICTED_PAGE_MESSAGE);

const isRequiredLogin = (page: Page): Promise<boolean> =>
  page.evaluate((message) => document.body.innerText.includes(message), '아이디 또는 전화번호');

const throwIfBlocked = async (page: Page): Promise<void> => {
  if ((await isRestrictedPage(page)) || (await isRequiredLogin(page))) {
    throw new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.');
  }
};

const buildSearchURL = (productName: string): string => {
  // 제품명에 괄호가 포함된 경우 요청 에러가 나서 별도로 인코딩한다.
  const encodedName = encodeURIComponent(productName).replaceAll('(', '%28').replaceAll(')', '%29');

  return `https://search.shopping.naver.com/search/all?query=${encodedName}&vertical=search`;
};

/**
 * 홈 → 검색 → 카탈로그 3단계로만 이동한다.
 *
 * 경유 단계를 더 늘리거나(검색 상세 파라미터, 다른 스토어) 반대로 카탈로그로 직행해도
 * 허용 조회량은 달라지지 않는다는 것이 실측으로 확인됐다. 오히려 다른 스토어를 거치면
 * 접근이 실패했다. 따라서 유입 경로가 가장 자연스러운 이 형태를 유지한다.
 */
const navigateToCatalog = async (
  page: Page,
  catalogURL: string,
  searchURL: string,
): Promise<void> => {
  await page.goto(SHOPPING_HOME_URL, { referer: NAVER_HOME_URL });
  await delayRandomSeconds(2, 3);
  await throwIfBlocked(page);

  await page.goto(searchURL, { referer: SHOPPING_HOME_URL });
  await delayRandomSeconds(2, 3);
  await throwIfBlocked(page);

  await page.goto(catalogURL, { referer: searchURL });
  await delayRandomSeconds(2, 3);
  await throwIfBlocked(page);
};

const getSellerItemHTMLList = async (
  page: Page,
  catalogURL: string,
  productName: string,
): Promise<string[]> => {
  await navigateToCatalog(page, catalogURL, buildSearchURL(productName));

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
