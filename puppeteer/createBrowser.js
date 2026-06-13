import puppeteer from "puppeteer";
import { pathToFileURL } from "node:url";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  createBrowser();
}

export default async function createBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    // browser: "firefox",
    executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
    // executablePath: `C:\\Program Files\\\Naver\\Naver Whale\\\Application\\whale.exe`,
    // executablePath: `C:\\Program Files\\\Mozilla Firefox\\firefox.exe`,
    // executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
    args: ["--disable-blink-features=AutomationControlled"],
    // args: ["--start-maximized"],
    // defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: false,
  });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  return { browser, page };
}
