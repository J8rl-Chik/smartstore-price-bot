import puppeteer, { type Browser, type Page } from 'puppeteer';

import setWebdriverFalse from './setWebdriverFalse.js';

interface BrowserPage {
  browser: Browser;
  page: Page;
}

/**
 * browser까지 함께 반환한다 — page만 반환하면 호출부가 page.close()만 호출하고
 * puppeteer.launch()로 띄운 브라우저 프로세스 자체는 닫을 방법이 없어, 반복 실행 시
 * 브라우저 프로세스가 계속 쌓이는 누수로 이어진다.
 */
const createPage = async (): Promise<BrowserPage> => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
    });
    const [page] = await browser.pages();

    if (!page) {
      throw new Error('브라우저에서 페이지를 가져오지 못했습니다.');
    }

    await page.evaluateOnNewDocument(setWebdriverFalse);

    return { browser, page };
  } catch (error) {
    throw new Error('브라우저 페이지를 생성하지 못했습니다.', { cause: error });
  }
};

export default createPage;
