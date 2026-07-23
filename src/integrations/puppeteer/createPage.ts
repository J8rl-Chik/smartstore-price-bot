import { createRequire } from 'node:module';
import puppeteerExtra from 'puppeteer-extra';
import type { PuppeteerExtra, PuppeteerExtraPlugin } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type Browser, type Page } from 'puppeteer';
// import puppeteer, { type Browser, type Page } from 'puppeteer';

interface BrowserPage {
  browser: Browser;
  page: Page;
}

/**
 * stealth 플러그인의 navigator.languages 우회가 기본값으로 영어(en-US, en)를 심어서
 * 네이버가 로그인 화면 등을 영어로 내려준다. 이 우회는 꺼두고 한국어 값으로 직접 덮어쓴다.
 */
const setKoreanLanguage = (): void => {
  Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
};

/**
 * navigator.languages보다 실제로 우선 적용되는 건 stealth의 user-agent-override 평션이다 -
 * Accept-Language 헤더와 크롬 프로필의 intl.accept_languages 설정까지 영어(en-US,en)로
 * 심어버려서, 서버가 렌더링하는 페이지 언어 자체가 영어로 고정된다. 공식 타입 선언이 없는
 * 서브모듈이라 require로 불러와 locale만 한국어로 재설정한다.
 */
const require = createRequire(import.meta.url);
const createUserAgentOverride =
  require('puppeteer-extra-plugin-stealth/evasions/user-agent-override') as (opts: {
    locale?: string;
  }) => PuppeteerExtraPlugin;

const createPage = async (): Promise<BrowserPage> => {
  try {
    const puppeteer = puppeteerExtra as unknown as PuppeteerExtra;

    const stealth = StealthPlugin();
    stealth.enabledEvasions.delete('navigator.languages');
    stealth.enabledEvasions.delete('user-agent-override');
    puppeteer.use(stealth);
    puppeteer.use(createUserAgentOverride({ locale: 'ko-KR,ko' }));

    const browser = await puppeteer.launch({
      headless: false,
      executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
      defaultViewport: null,
      args: ['--lang=ko-KR', '--disable-blink-features=AutomationControlled', '--test-type'],
      ignoreDefaultArgs: ['--enable-automation'],
    });

    const [page] = await browser.pages();

    if (!page) {
      throw new Error('브라우저에서 페이지를 가져오지 못했습니다.');
    }

    await page.evaluateOnNewDocument(setKoreanLanguage);

    return { browser, page };
  } catch (error) {
    throw new Error('브라우저 페이지를 생성하지 못했습니다.', { cause: error });
  }
};

export default createPage;
