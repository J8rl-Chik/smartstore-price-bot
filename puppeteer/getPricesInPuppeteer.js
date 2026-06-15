import { pathToFileURL } from "node:url";

import createPage from "./createPage.js";
import delaySeconds from "../util/delaySeconds.js";
import naverLogin from "./naverLogin.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  createPage().then(async (page) => {
    await naverLogin(page);
    await delaySeconds(1);

    const productUrl =
      "https://search.shopping.naver.com/catalog/51929585719?query=%ED%9C%A9%EB%93%9C&NaPm=ct%3Dmqdy6ff4%7Cci%3Da242da32bacc1f085a62dd901ee984ed2ba0e29d%7Ctr%3Dslsl%7Csn%3D95694%7Chk%3Df31dd97911f3b3736f4ad58ff2d1026121c8e95a";
    const productName = "휩드 머그트리 비건 팩 클렌저 130ml 1개";

    await getPricesInPuppeteer(page, productUrl, productName).then(console.log);

    await page.close();
  });
}

export default async function getPricesInPuppeteer(
  page,
  catalogUrl,
  productName,
) {
  const encodeName = encodeURIComponent(productName)
    .replaceAll("(", "%28")
    .replaceAll(")", "%29");

  const referer = `https://search.shopping.naver.com/search/all?query=${encodeName}&vertical=search`;

  await delaySeconds(1);

  await page.goto(referer, {
    referer: "https://search.shopping.naver.com/home",
  });

  await delaySeconds(1);

  await page.goto(catalogUrl, {
    referer,
  });

  const sellerPrices = await page.evaluate(async () => {
    const getSeller = (productSellerRow) => {
      const SELLER_SELECTOR = 'span[class^="product_name__"]';
      const { textContent: seller } =
        productSellerRow.querySelector(SELLER_SELECTOR);

      return seller;
    };

    const getPrice = (productSellerRow) => {
      const PRICE_SELECTOR = 'strong[class^="product_num__"]';
      const { textContent: price } =
        productSellerRow.querySelector(PRICE_SELECTOR);

      return Number(price.replaceAll(",", ""));
    };

    const productSellerRows = Array.from(
      document.querySelectorAll('[class^="product_seller_info_wrap__"]'),
    );

    const sellerPrices = productSellerRows.map((productSellerRow) => ({
      seller: getSeller(productSellerRow),
      price: getPrice(productSellerRow),
    }));

    return sellerPrices;
  });

  return sellerPrices;
}
