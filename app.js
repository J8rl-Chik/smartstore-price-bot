import "dotenv/config";
import fetch from "node-fetch";

import getSaleProducts from "./smartStore/getSaleProducts.js";
import getProductRows from "./google/getProductRows.js";
import createPage from "./puppeteer/createPage.js";
import getPricesInPuppeteer from "./puppeteer/getPricesInPuppeteer.js";
import naverLogin from "./puppeteer/naverLogin.js";
import delaySeconds from "./util/delaySeconds.js";
import parseToNumberFromKRW from "./util/parseToNumberFromKRW.js";
import updatePrice from "./smartStore/updatePrice.js";
import delayMinutes from "./util/delayMinutes.js";

async function start() {
  console.time("실행 시간");

  const saleProducts = await getSaleProducts();
  const productRows = await getProductRows();
  const page = await createPage();
  const myStoreName = process.env.SMART_STORE_NAME;
  const COLUMN_INDEX = {
    NAME: 0,
    CATALOG_URL: 1,
    VIRTUAL_PRICE: 10,
    EXCLUDED_SELLERS: 11,
  };
  let productCount = 0;

  await naverLogin(page);
  await delaySeconds(1);

  for await (const saleProduct of saleProducts) {
    const productName = saleProduct.channelProducts[0].name;
    const productRow = productRows.find(
      (productRow) => productRow[COLUMN_INDEX.NAME] === productName,
    );

    if (!productRow) {
      continue;
    }

    console.log(`${++productCount}번째: ${productName}`);

    const sellerPrices = await getPricesInPuppeteer(
      page,
      productRow[COLUMN_INDEX.CATALOG_URL],
      productName,
    );

    if (sellerPrices.length === 0) {
      console.log(`${productName}: 가격 목록이 없습니다.`);

      continue;
    }

    const myStore = sellerPrices.find(({ seller }) => seller === myStoreName);
    const targetSellerPrices = sellerPrices.filter(({ seller }) => {
      const excludedSellers = [
        myStoreName,
        ...productRow[COLUMN_INDEX.EXCLUDED_SELLERS]
          .split(",")
          .map((seller) => seller.trim()),
      ];

      return !excludedSellers.includes(seller);
    });

    const virtualPrice = parseToNumberFromKRW(
      productRow[COLUMN_INDEX.VIRTUAL_PRICE],
    );

    if (virtualPrice > 0) {
      targetSellerPrices.push({
        seller: "가상 판매처",
        price: virtualPrice,
      });
    }

    const prices = targetSellerPrices
      .sort((seller1, seller2) => seller1.price - seller2.price)
      .map(({ price }) => price);

    console.log(prices);

    const [feeType, freeDeliveryPrice, productPrice, baseFee] = [
      productRow[6],
      parseToNumberFromKRW(productRow[7]),
      parseToNumberFromKRW(productRow[8]),
      parseToNumberFromKRW(productRow[9]),
    ];

    const delivery = {
      feeType,
      freeDeliveryPrice,
      productPrice,
      baseFee,
    };

    const minPrice = prices.find((price) => price >= freeDeliveryPrice + 10);
    const targetPrice = minPrice ? minPrice - 10 : freeDeliveryPrice;

    if (targetPrice !== myStore.price || feeType !== myStore.deliveryFeeType) {
      const response = await updatePrice({
        productNo: saleProduct.channelProducts[0].originProductNo,
        targetPrice,
        delivery,
      });

      if (Object.hasOwn(response, "message")) {
        console.error(`${productName}: ${response.message}`);
      }
    }
  }

  await page.close();

  console.timeEnd("실행 시간");
  console.log(new Date().toLocaleString());

  await delayMinutes(5);

  await start();
}

start();
