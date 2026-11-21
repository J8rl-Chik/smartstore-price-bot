import { expect, it } from 'vitest';
import { validateCatalogURL } from './validateCatalogURL.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

it('네이버 쇼핑 카탈로그 주소면 그대로 반환한다', () => {
  const catalogURL = 'https://search.shopping.naver.com/catalog/60675915720';

  expect(validateCatalogURL(catalogURL)).toBe(catalogURL);
});

it('카탈로그 주소 뒤에 검색어(query)가 붙어 있어도 그대로 반환한다', () => {
  const catalogURL = 'https://search.shopping.naver.com/catalog/60370364009?query=%EC%97%90';

  expect(validateCatalogURL(catalogURL)).toBe(catalogURL);
});

it('카탈로그 번호 뒤에 슬래시가 붙어 있어도 그대로 반환한다', () => {
  const catalogURL = 'https://search.shopping.naver.com/catalog/60675915720/';

  expect(validateCatalogURL(catalogURL)).toBe(catalogURL);
});

it('주소로 해석할 수 없는 값이면 에러를 던진다', () => {
  expect(() => validateCatalogURL('카탈로그 없음')).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: 카탈로그 없음)`,
  );
});

it('빈 문자열이면 에러를 던진다', () => {
  expect(() => validateCatalogURL('')).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: )`,
  );
});

it('https가 아니면 에러를 던진다', () => {
  const catalogURL = 'http://search.shopping.naver.com/catalog/60675915720';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});

it('다른 사이트 주소면 에러를 던진다', () => {
  const catalogURL = 'https://example.com/catalog/60675915720';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});

it('호스트 이름에 네이버 쇼핑 주소가 들어 있어도 다른 도메인이면 에러를 던진다', () => {
  const catalogURL = 'https://search.shopping.naver.com.example.com/catalog/60675915720';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});

it('네이버의 다른 페이지 주소면 에러를 던진다', () => {
  const catalogURL = 'https://nid.naver.com/user2/help/myInfo';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});

it('네이버 쇼핑이어도 카탈로그가 아닌 경로면 에러를 던진다', () => {
  const catalogURL = 'https://search.shopping.naver.com/search/all?query=test';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});

it('카탈로그 번호가 숫자가 아니면 에러를 던진다', () => {
  const catalogURL = 'https://search.shopping.naver.com/catalog/abc';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});

it('로컬 파일 주소면 에러를 던진다', () => {
  const catalogURL = 'file:///C:/Users/user/Downloads/page.html';

  expect(() => validateCatalogURL(catalogURL)).toThrow(
    `${ERROR_MESSAGE.CATALOG_URL_INVALID} (catalogURL: ${catalogURL})`,
  );
});
