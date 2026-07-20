import puppeteer, { type Page } from 'puppeteer';

const createPage = async (): Promise<Page> => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
  });
  const [page] = await browser.pages();

  if (!page) {
    throw new Error('브라우저에서 페이지를 가져오지 못했습니다.');
  }

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  return page;
};

export default createPage;
