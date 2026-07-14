import 'dotenv/config';

import getSaleProducts from './smartStore/getSaleProducts.js';
import getProductRows from './google/getProductRows.js';
import createPage from './puppeteer/createPage.js';
import getSellersInPuppeteer from './puppeteer/getSellersInPuppeteer.js';
import naverLogin from './puppeteer/naverLogin.js';
import delaySeconds from './util/delaySeconds.js';
import updatePrice from './smartStore/updatePrice.js';
import { findProductRow, parseProductRow } from './core/productRow.js';
import { getProductName, getOriginProductNo } from './core/saleProduct.js';
import { filterExcludedSellers, addVirtualSeller, sortByPriceAscending } from './core/sellers.js';
import { calculateTargetPrice, isUpdateRequired } from './core/pricing.js';

const runUserScenario = async () => {
  const [saleProduct] = await getSaleProducts();
  const productRows = await getProductRows();
  const page = await createPage();
  const myStoreName = process.env.SMART_STORE_NAME;

  await naverLogin(page);
  await delaySeconds(1);

  const productName = getProductName(saleProduct);
  const matchedRow = findProductRow(productRows, productName);

  console.log(productName);

  if (!matchedRow) {
    console.log('일치하는 제품 행이 없습니다.');

    return;
  }

  const priceRule = parseProductRow(matchedRow);
  const sellers = await getSellersInPuppeteer(page, priceRule.catalogUrl, productName);

  if (sellers.length === 0) {
    console.log(`가격 목록이 없습니다.`);

    return;
  }

  const myStore = sellers.find(({ name }) => name === myStoreName);
  const targetSellers = addVirtualSeller(
    filterExcludedSellers(sellers, myStoreName, priceRule.excludedSellerNames),
    priceRule.virtualPrice,
  );
  const prices = sortByPriceAscending(targetSellers).map(({ price }) => price);

  console.log(prices);

  const { feeType, freeDeliveryPrice, productPrice, baseFee } = priceRule;
  const delivery = { feeType, freeDeliveryPrice, productPrice, baseFee };
  const targetPrice = calculateTargetPrice(prices, freeDeliveryPrice);

  console.log(targetPrice);

  if (isUpdateRequired(myStore, targetPrice, feeType)) {
    const response = await updatePrice({
      productNo: getOriginProductNo(saleProduct),
      targetPrice,
      delivery,
    });

    if (Object.hasOwn(response, 'message')) {
      console.error(`${productName}: ${response.message}`);
    }
  }

  await page.close();
};

runUserScenario();
