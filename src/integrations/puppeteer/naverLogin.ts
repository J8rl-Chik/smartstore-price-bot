import 'dotenv/config';
import type { Page } from 'puppeteer';

const naverLogin = async (page: Page): Promise<void> => {
  try {
    const idSelector = '#id';
    const passwordSelector = '#pw';
    const loginButtonSelector = '#loginBtn_row';
    const typeDelay = 100;
    const { NAVER_ID, NAVER_PASSWORD } = process.env;

    await page.goto('https://nid.naver.com/');

    await page.click(idSelector);
    await page.type(idSelector, NAVER_ID as string, { delay: typeDelay });

    await page.click(passwordSelector);
    await page.type(passwordSelector, NAVER_PASSWORD as string, { delay: typeDelay });

    await page.click(loginButtonSelector);
  } catch (error) {
    throw new Error('네이버 로그인에 실패했습니다.', { cause: error });
  }
};

export default naverLogin;
