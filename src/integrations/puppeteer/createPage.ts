import puppeteerExtra, { type PuppeteerExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';

interface BrowserPage {
  browser: Browser;
  page: Page;
}

const createPage = async (): Promise<BrowserPage> => {
  const puppeteer = puppeteerExtra as unknown as PuppeteerExtra;
  const stealth = StealthPlugin();

  /**
   * 기본 언어가 영어로 설정되기 때문에,
   * 서버가 받는 Accept-Language와 navigator.languages를 한국어로 일치시키기 위해 두 설정을 제거한다.
   */
  stealth.enabledEvasions.delete('user-agent-override');
  stealth.enabledEvasions.delete('navigator.languages');

  /**
   * 모듈 최상단에서 등록하면 import 시점에 부수 효과가 생겨 등록 여부를 테스트로 검증할 수 없다.
   * puppeteer-extra의 use()는 중복 등록을 걸러내지 않지만,
   * 브라우저는 프로세스당 한 번만 띄우는 전제라 함수 안에서 등록한다.
   */
  puppeteer.use(stealth);

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

    if (!blankPage) {
      throw new Error('브라우저 기본 페이지가 없습니다.');
    }
    // newPage()로 새로 연 페이지에만 stealth가 온전히 걸리므로, 첫 페이지는 닫는다.
    await blankPage?.close();

    const page = await browser.newPage();

    return { browser, page };
  } catch (error) {
    throw new Error('브라우저 페이지를 생성하지 못했습니다.', { cause: error });
  }
};

export default createPage;
