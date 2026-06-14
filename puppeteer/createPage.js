import puppeteer from "puppeteer";
import { pathToFileURL } from "node:url";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  createPage();
}

export default async function createPage() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
  });
  const [page] = await browser.pages();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  return page;
}
