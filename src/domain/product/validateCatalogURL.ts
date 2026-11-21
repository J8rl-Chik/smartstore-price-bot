import { ERROR_MESSAGE } from '../error/errorMessage.js';

const catalogHost = 'search.shopping.naver.com';
/**
 * 카탈로그 번호 경로만 받는다. 뒤에 붙는 ?query= 같은 검색어는 pathname에 들어가지 않아 그대로 허용된다.
 * ^          경로의 처음부터 검사한다. (앞에 다른 경로가 붙은 /search/catalog/1 같은 값을 막는다)
 * \/catalog\/ '/catalog/' 문자 그대로. 정규식에서 /는 구분자라 \/로 쓴다.
 * \d+        숫자가 한 개 이상. 카탈로그 번호다. (/catalog/abc, /catalog/ 는 통과하지 않는다)
 * \/?        끝의 '/'는 있어도 되고 없어도 된다. (/catalog/123/ 도 통과)
 * $          경로의 끝까지 검사한다. (뒤에 다른 경로가 붙은 /catalog/123/reviews 같은 값을 막는다)
 * 예: '/catalog/60675915720' ○, '/catalog/60675915720/' ○, '/catalog/abc' ✕, '/search/all' ✕
 */
const catalogPathPattern = /^\/catalog\/\d+\/?$/;

/**
 * 시트의 카탈로그 주소가 네이버 쇼핑 카탈로그(https://search.shopping.naver.com/catalog/<번호>)인지 확인한다.
 * 이 주소는 네이버에 로그인된 브라우저로 열기 때문에, 다른 사이트나 로컬 파일(file://)을 열지 않도록 막는다.
 */
export const validateCatalogURL = (catalogURL: string): string => {
  if (!URL.canParse(catalogURL)) {
    throw new Error(`${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`);
  }

  const { protocol, hostname, pathname } = new URL(catalogURL);

  if (protocol !== 'https:' || hostname !== catalogHost || !catalogPathPattern.test(pathname)) {
    throw new Error(`${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`);
  }

  return catalogURL;
};
