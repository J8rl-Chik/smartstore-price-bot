import type { Page } from 'puppeteer';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

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
    throw new UnexpectedCatalogPageError(ERROR_MESSAGE.CATALOG_BLOCKED);
  }
};

export default validateCatalogPage;
