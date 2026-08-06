import puppeteerExtra from 'puppeteer-extra';
import type { PuppeteerExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';

interface BrowserPage {
  browser: Browser;
  page: Page;
}

const puppeteer = puppeteerExtra as unknown as PuppeteerExtra;
const stealth = StealthPlugin();

/**
 * 기본 언어가 영어로 설정되기 때문에,
 * 서버가 받는 Accept-Language와 navigator.languages를 한국어로 일치시키기 위해 두 설정을 제거한다.
 */
stealth.enabledEvasions.delete('user-agent-override');
stealth.enabledEvasions.delete('navigator.languages');

/**
 * 플러그인 등록은 프로세스당 한 번이면 되는 설정이다.
 * createPage 안에 두면 createPage 호출마다 함께 호출돼서 불필요하다.
 */
puppeteer.use(stealth);

const createPage = async (): Promise<BrowserPage> => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: 'config/userData',
      executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
      /**
       * 지정하지 않으면 뷰포트가 800x600으로 고정돼 실제 창 크기와 어긋난다.
       * null로 두면 창 크기를 그대로 따라간다.
       */
      defaultViewport: null,
    });

    const [blankPage] = await browser.pages();
    const page = await browser.newPage();

    // newPage()로 새로 연 페이지에만 stealth가 온전히 걸리므로, 첫 페이지는 닫는다.
    await blankPage?.close();

    return { browser, page };
  } catch (error) {
    throw new Error('브라우저 페이지를 생성하지 못했습니다.', { cause: error });
  }
};

export default createPage;
