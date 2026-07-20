import puppeteer, { type Page } from 'puppeteer';

import setWebdriverFalse from './setWebdriverFalse.js';

const createPage = async (): Promise<Page> => {
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

    return page;
  } catch (error) {
    throw new Error('브라우저 페이지를 생성하지 못했습니다.', { cause: error });
  }
};

export default createPage;
