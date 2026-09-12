import type { Page } from 'puppeteer';

export const hasTextInBody = (text: string): boolean => document.body.innerText.includes(text);

export const isRestrictedPage = (page: Page): Promise<boolean> =>
  page.evaluate(hasTextInBody, '쇼핑 서비스 접속이 일시적');

export const isRequiredLogin = (page: Page): Promise<boolean> =>
  page.evaluate(hasTextInBody, '아이디 또는 전화번호');

export const isRequiredSecureCheck = (page: Page): Promise<boolean> =>
  page.evaluate(hasTextInBody, '보안 확인을 완료해 주세요.');

export class UnexpectedCatalogPageError extends Error {}

const validateCatalogPage = async (page: Page): Promise<void> => {
  if (
    (await isRestrictedPage(page)) ||
    (await isRequiredLogin(page)) ||
    (await isRequiredSecureCheck(page))
  ) {
    throw new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.');
  }
};

export default validateCatalogPage;
