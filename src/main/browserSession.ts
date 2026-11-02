import type { Page } from 'puppeteer';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import tryCatch from '../utils/tryCatch';

/**
 * startUpdate를 다시 호출해도 다시 로그인하지 않도록 로그인한 페이지를 보관한다.
 * TODO: browser를 닫을 수 있도록 browser와 page를 하나로 묶어 보관하고, 종료 시 browser.close()를 호출한다.
 */
let page: Page | null = null;

/**
 * 사용자가 puppeteer 브라우저의 탭이나 창을 닫았는지 확인한다.
 * 탭만 닫으면 page가 닫히고, 창을 닫으면 브라우저 연결이 끊긴다.
 */
export const isPageClosed = (page: Page): boolean => page.isClosed() || !page.browser().connected;

/**
 * 이미 로그인한 페이지가 있으면 다시 로그인하지 않고 재사용한다. 사용자가 닫았다면 새로 열어 로그인한다.
 * 로그인에 성공한 뒤에만 보관한다. 실패한 페이지를 보관하면 다음 호출에서 로그인을 건너뛰기 때문이다.
 * 로그인에 실패하면 다시 호출할 때마다 창이 쌓이지 않도록 연 브라우저를 닫고 에러를 그대로 던진다.
 */
export const getLoggedInPage = async (): Promise<Page> => {
  if (!page || isPageClosed(page)) {
    const { browser, page: newPage } = await createPage();
    const [error] = await tryCatch(loginNaver(newPage));

    if (error) {
      await browser.close();
      throw error;
    }

    page = newPage;
  }

  return page;
};
