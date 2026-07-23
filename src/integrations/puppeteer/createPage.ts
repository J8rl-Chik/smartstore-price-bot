import puppeteerExtra from 'puppeteer-extra';
import type { PuppeteerExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type Browser, type Page } from 'puppeteer';

interface BrowserPage {
  browser: Browser;
  page: Page;
}

const createPage = async (): Promise<BrowserPage> => {
  try {
    const puppeteer = puppeteerExtra as unknown as PuppeteerExtra;

    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({
      headless: false,
      executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
      defaultViewport: null,
      args: ['--start-maximized'],
    });

    const [page] = await browser.pages();

    if (!page) {
      throw new Error('브라우저에서 페이지를 가져오지 못했습니다.');
    }

    return { browser, page };
  } catch (error) {
    throw new Error('브라우저 페이지를 생성하지 못했습니다.', { cause: error });
  }
};

export default createPage;
