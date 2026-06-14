import "dotenv/config";

export async function naverLogin(page) {
  const ID_SELECTOR = "#id";
  const PASSWORD_SELECTOR = "#pw";
  const LOGIN_BUTTON_SELECTOR = ".btn_login";
  const TYPE_DELAY = 100;

  await page.goto("https://nid.naver.com/");

  await page.click(ID_SELECTOR);
  await page.type(ID_SELECTOR, process.env.NAVER_ID, { delay: TYPE_DELAY });

  await page.click(PASSWORD_SELECTOR);
  await page.type(PASSWORD_SELECTOR, process.env.NAVER_PASSWORD, {
    delay: TYPE_DELAY,
  });

  await page.click(LOGIN_BUTTON_SELECTOR);
}
