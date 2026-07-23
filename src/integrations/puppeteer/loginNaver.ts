import 'dotenv/config';
import type { Page } from 'puppeteer';

import delayRandomSeconds from '../../utils/delayRandomSeconds.js';
import validateEnv from '../../utils/validateEnv.js';

const loginNaver = async (page: Page): Promise<void> => {
  try {
    await page.goto('https://www.naver.com/');
    await delayRandomSeconds(2, 5);

    await page.goto('https://nid.naver.com/', { referer: 'https://www.naver.com/' });
    await delayRandomSeconds(2, 5);

    const idSelector = '#id';
    const passwordSelector = '#pw';
    const loginButtonSelector = '#loginBtn_row';
    const typeDelay = 100;
    const naverId = validateEnv('NAVER_ID');
    const naverPassword = validateEnv('NAVER_PASSWORD');

    await page.click(idSelector);
    await page.type(idSelector, naverId, { delay: typeDelay });

    await page.click(passwordSelector);
    await page.type(passwordSelector, naverPassword, { delay: typeDelay });

    await page.click(loginButtonSelector);
    await delayRandomSeconds(2, 5);

    await page.goto('https://www.naver.com/');
  } catch (error) {
    throw new Error('네이버 로그인에 실패했습니다.', { cause: error });
  }
};

export default loginNaver;
