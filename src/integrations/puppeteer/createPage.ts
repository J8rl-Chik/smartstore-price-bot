import puppeteerExtra, { type PuppeteerExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page, WindowBounds } from 'puppeteer';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

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
 * puppeteer-extra의 use()는 중복 등록을 걸러내지 않아 createPage 안에 두면 호출마다 플러그인이 누적된다.
 * 플러그인 등록은 프로세스당 한 번이면 되므로 모듈 최상위에서 등록한다.
 * 대신 import 시점에 실행되니, 테스트에서는 목을 vi.hoisted로 import보다 먼저 초기화해야 한다.
 */
puppeteer.use(stealth);

/**
 * userDataDir은 네이버 로그인 쿠키가 저장되는 Chrome 프로필 폴더다.
 * 생략하면 CLI용 config/userData를 쓴다. CLI는 프로젝트 폴더에서 실행하므로 작업 폴더 기준 상대 경로로 둔다.
 * Electron은 앱의 사용자 데이터 폴더를 넘긴다.
 * windowBounds를 생략하면 Chrome이 프로필에 기억해 둔 위치와 크기로 창을 연다.
 */
const createPage = async (
  userDataDir = 'config/userData',
  windowBounds?: WindowBounds,
): Promise<BrowserPage> => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      /**
       * Puppeteer와 Chrome의 원격 디버깅(CDP) 통신을 localhost 포트 대신 프로세스 파이프로 연결한다.
       * 포트로 열면 같은 PC의 다른 프로그램도 접속해 로그인된 브라우저를 조종하고 네이버 쿠키를 읽을 수 있다.
       * 파이프는 Chrome을 띄운 이 프로세스만 가지므로 다른 프로그램이 접속할 수 없다.
       */
      pipe: true,
      userDataDir,
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
    const page = await browser.newPage();

    await blankPage?.close();

    if (windowBounds) {
      /**
       * windowState를 생략하면 CDP 기본값인 normal이라, 프로필에 최대화 상태가 남아 있어도 풀고 옮긴다.
       * page.windowId()는 experimental이라 puppeteer를 올릴 때 바뀌지 않았는지 확인한다.
       * 창을 옮기지 못하면 다른 실패처럼 BROWSER_PAGE_FAILED로 던진다. 띄운 Chrome이 남는 문제는 #75에서 다룬다.
       */
      const windowId = await page.windowId();
      await browser.setWindowBounds(windowId, windowBounds);
    }

    return { browser, page };
  } catch (error) {
    throw new Error(ERROR_MESSAGE.BROWSER_PAGE_FAILED, { cause: error });
  }
};

export default createPage;
