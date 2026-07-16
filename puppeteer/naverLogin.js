import 'dotenv/config';

export default async function naverLogin(page) {
  const idSelector = '#id';
  const passwordSelector = '#pw';
  const loginButtonSelector = '#loginBtn_row';
  const typeDelay = 100;

  await page.goto('https://nid.naver.com/');

  await page.click(idSelector);
  await page.type(idSelector, process.env.NAVER_ID, { delay: typeDelay });

  await page.click(passwordSelector);
  await page.type(passwordSelector, process.env.NAVER_PASSWORD, {
    delay: typeDelay,
  });

  await page.click(loginButtonSelector);
}
