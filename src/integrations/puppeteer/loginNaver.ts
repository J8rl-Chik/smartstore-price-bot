import 'dotenv/config';
import type { Page } from 'puppeteer';

import delayRandomSeconds from '../../utils/delayRandomSeconds.js';

/**
 * isRedirected가 true면 이미 네이버 로그인 페이지(nid.naver.com/nidlogin.login?url=...)로
 * 리다이렉트된 상태라는 뜻이므로, 다른 페이지로 이동하지 않고 현재 페이지에서 바로 로그인만
 * 시도한다. 로그인 성공 후 원래 가려던 페이지(url 파라미터)로 자동 복귀시키기 위함이다.
 */
const loginNaver = async (page: Page, isRedirected = false): Promise<void> => {
  try {
    if (!isRedirected) {
      await page.goto('https://www.naver.com/');
      await delayRandomSeconds(2, 5);

      await page.goto('https://nid.naver.com/', { referer: 'https://www.naver.com/' });
      await delayRandomSeconds(2, 5);
    }

    const idSelector = '#id';
    const passwordSelector = '#pw';
    const loginButtonSelector = '#loginBtn_row';
    const typeDelay = 100;
    const { NAVER_ID, NAVER_PASSWORD } = process.env;

    await page.click(idSelector);
    await page.type(idSelector, NAVER_ID as string, { delay: typeDelay });

    await page.click(passwordSelector);
    await page.type(passwordSelector, NAVER_PASSWORD as string, { delay: typeDelay });

    await page.click(loginButtonSelector);
  } catch (error) {
    throw new Error('네이버 로그인에 실패했습니다.', { cause: error });
  }
};

export default loginNaver;
