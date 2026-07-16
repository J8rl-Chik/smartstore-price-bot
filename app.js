import 'dotenv/config';

import getSaleProducts from './smartStore/getSaleProducts.js';
import getProductRows from './google/getProductRows.js';
import createPage from './puppeteer/createPage.js';
import getSellersInPuppeteer from './puppeteer/getSellersInPuppeteer.js';
import naverLogin from './puppeteer/naverLogin.js';
import delaySeconds from './util/delaySeconds.js';
import updatePrice from './smartStore/updatePrice.js';
import delayMinutes from './util/delayMinutes.js';
import { findProductRow, parseProductRow } from './core/productRow.js';
import { getProductName, getOriginProductNo } from './core/saleProduct.js';
import { filterExcludedSellers, addVirtualPrice } from './core/sellers.js';
import { calculateTargetPrice, isUpdateRequired } from './core/pricing.js';
import { buildPriceWithDeliveryFee } from './core/delivery.js';

const start = async () => {
  console.time('실행 시간');

  const saleProducts = await getSaleProducts();
  const productRows = await getProductRows();
  const page = await createPage();
  const myStoreName = process.env.SMART_STORE_NAME;
  let productCount = 0;

  await naverLogin(page);
  await delaySeconds(1);

  for await (const saleProduct of saleProducts) {
    const productName = getProductName(saleProduct);
    const matchedRow = findProductRow(productRows, productName);

    if (!matchedRow) {
      continue;
    }

    productCount += 1;
    console.log(`${productCount}번째: ${productName}`);

    const priceRule = parseProductRow(matchedRow);
    const sellers = await getSellersInPuppeteer(page, priceRule.catalogUrl, productName);

    if (sellers.length === 0) {
      console.log(`${productName}: 가격 목록이 없습니다.`);

      continue;
    }

    const currentMyStore = sellers.find(({ name }) => name === myStoreName);
    const sellerPrices = filterExcludedSellers(sellers, [
      ...priceRule.excludedSellerNames,
      myStoreName,
    ]).map(({ price }) => price);
    const prices = addVirtualPrice(sellerPrices, priceRule.virtualPrice);

    console.log(prices);

    const { feeType, freeDeliveryPrice, productPrice, baseFee } = priceRule;
    const delivery = { feeType, freeDeliveryPrice, productPrice, baseFee };
    const targetPrice = calculateTargetPrice(prices, freeDeliveryPrice);

    if (isUpdateRequired(currentMyStore, targetPrice, feeType)) {
      const { deliveryFee, salePrice } = buildPriceWithDeliveryFee(delivery, targetPrice);
      const response = await updatePrice({
        productNo: getOriginProductNo(saleProduct),
        deliveryFee,
        salePrice,
      });

      if (Object.hasOwn(response, 'message')) {
        console.error(`${productName}: ${response.message}`);
      }
    }
  }

  console.timeEnd('실행 시간');
  console.log(new Date().toLocaleString());

  await page.close();
  await delayMinutes(5);
  await start();
};

start();
