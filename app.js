import "dotenv/config";

const fetch = require("node-fetch");

// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const { getSaleProducts } = require("./getSaleProducts");
const { getProductRows } = require("./getProductRows");
const { parseToNumberFromKRW } = require("./getCatalogPricesInPC");
const { updatePrice } = require("./updatePrice");
const { getPricesInPuppeteer } = require("./puppeteer/getPricesInPuppeteer");
const { delay } = require("./delaySecond");
const { login } = require("./puppeteer/naverLogin");
const { default: puppeteer } = require("puppeteer");

// puppeteer.use(StealthPlugin());

const createBrowser = async () => {
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
};

async function start() {
  // puppeteer.use(StealthPlugin());

  /* 테스트 */
  // console.log(productRows.length);
  console.time("판매중인 제품 최저가 설정 시간");

  const saleProducts = await getSaleProducts();
  /* 테스트 */
  // saleProducts.forEach((product) => {
  // console.log(product.channelProducts[0].name);
  // });

  const productRows = await getProductRows();
  const boostProducts = productRows
    .filter((productRow) => productRow[14] === "TRUE")
    .map((productRow) => productRow[4]);

  const boostSaleProducts = saleProducts.filter((saleProduct) =>
    boostProducts.includes(saleProduct.channelProducts[0].name),
  );

  const totalSaleProducts = [];
  // console.log(saleProducts);

  for (let i = 0; i < saleProducts.length; i++) {
    totalSaleProducts.push(saleProducts[i]);

    if (i % 10 === 0) {
      totalSaleProducts.push(...boostSaleProducts);
    }
  }

  // console.log(totalSaleProducts);

  let productIndex = 1;

  // await page.setUserAgent(
  // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safri/537.36"
  // );
  // await page.setViewport({ width: 1920, height: 1080 });
  // await page.mouse.move(100, 100);
  // await page.mouse.move(200, 200);

  // await login(page);
  const myStore = process.env.SMART_STORE_NAME;
  let currentBrowser = null;
  let currentPage = null;

  for await (const saleProduct of totalSaleProducts) {
    // if (currentBrowser && productIndex % 8 === 0) {
    //   await currentBrowser.close();
    //   currentBrowser = null;

    //   await delay(20000);
    // }

    if (!currentBrowser) {
      const { browser, page } = await createBrowser();
      currentBrowser = browser;
      currentPage = page;

      await login(currentPage);
    }

    const productRow = productRows.find((productItems) =>
      productItems.includes(saleProduct.channelProducts[0].name),
    );

    if (productRow === undefined) continue;

    console.log(`제품: ${productRow[4]}`);

    const catalogPrices = await getPricesInPuppeteer(
      currentPage,
      productRow[0],
      productRow[4],
      productIndex,
    );

    ++productIndex;

    if (catalogPrices.length === 0) {
      console.log(
        `${saleProduct.channelProducts[0].name}가격 목록이 없습니다.`,
      );

      continue;
    }

    const discount = productRow[13]
      .split(",")
      .slice(0, -1)
      .map((string) => string.split("/"))
      .reduce((acc, [mall, discount]) => {
        acc[mall] = Number(discount);

        return acc;
      }, {});

    let myPrice = 0;

    const myCatalog = catalogPrices.find(({ seller }) => seller === myStore);

    if (myCatalog !== undefined) {
      myPrice = myCatalog.sellingPrice;
    }

    const stores = [...catalogPrices].filter(({ seller }) => {
      const excludeStoreList = [
        myStore,
        ...productRow[12].split(",").map((store) => store.trim()),
      ];

      return !excludeStoreList.includes(seller);
    });

    const totalStores = [...stores];

    stores.forEach((store) => {
      if (discount[store.seller] !== undefined) {
        totalStores.push({
          ...store,
          sellingPrice: store.sellingPrice - discount[store.seller],
        });
      }
    });

    const virtualPrice = parseToNumberFromKRW(productRow[11]);
    if (virtualPrice > 0) {
      totalStores.push({
        seller: "virtual",
        naverPay: "",
        sellingPrice: virtualPrice,
      });
    }

    totalStores.sort(
      (store1, store2) => store1.sellingPrice - store2.sellingPrice,
    );
    console.log(totalStores);

    const prices = totalStores.map(({ sellingPrice }) => sellingPrice);
    const [
      productMinPrice,
      minShippingFee,
      defaultShippingFee,
      deliveryFeeType,
      freeShippingPrice,
      deliveryFeeCount,
    ] = [
      parseToNumberFromKRW(productRow[5]),
      parseToNumberFromKRW(productRow[6]),
      parseToNumberFromKRW(productRow[7]),
      productRow[8],
      parseToNumberFromKRW(productRow[9]),
      productRow[10],
    ];

    if (deliveryFeeType === "무료") {
      // console.log(`제품: ${productRow[4]}`);
      // console.log(`- 최소가: ${productMinPrice}`);
      // console.log(`- 최소 배송비: ${minShippingFee}`);
      // console.log(`- 배송비 유형: ${deliveryFeeType}`);
      // console.log(`- 무료배송 제품가: ${freeShippingPrice}`);

      const minPrice = prices.find((price) => price >= freeShippingPrice + 10);
      // console.log(minPrice);
      const salePrice = minPrice ? minPrice - 10 : freeShippingPrice;
      console.log(`${productIndex}번:${productRow[4]} 판매가: ${salePrice}`);
      // console.log(saleProduct.channelProducts[0].originProductNo);

      if (myPrice === salePrice) {
        console.log("현재 가격과 일치: 수정 필요 없음");

        continue;
      }

      try {
        updatePrice({
          productNo: saleProduct.channelProducts[0].originProductNo,
          salePrice,
        });
      } catch {
        console.log("가격 갱신 에러");

        updatePrice({
          productNo: saleProduct.channelProducts[0].originProductNo,
          salePrice,
        });
      }
    }

    // await delay(5000);
  }

  await currentBrowser.close();

  console.timeEnd("판매중인 제품 최저가 설정 시간");

  const currentTime = new Date();
  console.log(currentTime.toLocaleString());

  //await delay(600000);
  await delay(360000);

  await start();
}

start();
