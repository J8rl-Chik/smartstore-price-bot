import type { Browser, Page } from 'puppeteer';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import tryCatch from '../utils/tryCatch';
import type { NaverAccount } from '../domain/settings/_type';

/**
 * 지금 열린 브라우저와 로그인한 페이지를 보관한다.
 * startUpdate는 순회가 끝날 때마다 브라우저를 닫지만, 순회 도중 앱을 종료해도 closeBrowser로 닫을 수 있도록 보관한다.
 */
let session: { browser: Browser; page: Page } | null = null;

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
export const getLoggedInPage = async (naverAccount: NaverAccount): Promise<Page> => {
  if (!session || isPageClosed(session.page)) {
    const { browser, page } = await createPage();
    const [error] = await tryCatch(loginNaver(page, naverAccount));

    if (error) {
      await browser.close();
      throw error;
    }

    session = { browser, page };
  }

  return session.page;
};

/**
 * 보관한 브라우저를 닫고, 다음 getLoggedInPage에서 새로 열어 로그인하도록 비운다.
 * 사용자가 이미 창을 닫아 연결이 끊긴 브라우저는 close()가 실패할 수 있어 닫지 않는다.
 */
export const closeBrowser = async (): Promise<void> => {
  if (session?.browser.connected) {
    await session.browser.close();
  }

  session = null;
};
