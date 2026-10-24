import 'dotenv/config';
import type { Page } from 'puppeteer';

import delayRandomSeconds from '../../utils/delayRandomSeconds.js';
import validateEnv from '../../utils/validateEnv.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

const loginNaver = async (page: Page): Promise<void> => {
  try {
    await page.goto('https://www.naver.com/');
    await delayRandomSeconds(2, 3);

    await page.goto('https://nid.naver.com/', { referer: 'https://www.naver.com/' });
    await delayRandomSeconds(2, 3);

    const idSelector = '#id';
    const passwordSelector = '#pw';
    const loginButtonSelector = '#loginBtn_row';
    const typeDelay = 100;
    const naverPassword = validateEnv('NAVER_PASSWORD');
    const naverId = validateEnv('NAVER_ID');

    const hasLoginForm = await page.evaluate(
      (selector) => document.body.querySelector(selector),
      idSelector,
    );

    if (hasLoginForm) {
      await page.click(idSelector);
      await page.type(idSelector, naverId, { delay: typeDelay });

      await page.click(passwordSelector);
      await page.type(passwordSelector, naverPassword, { delay: typeDelay });

      await page.click(loginButtonSelector);
    }

    await delayRandomSeconds(2, 3);
  } catch (error) {
    throw new Error(ERROR_MESSAGE.NAVER_LOGIN_FAILED, { cause: error });
  }
};

export default loginNaver;
