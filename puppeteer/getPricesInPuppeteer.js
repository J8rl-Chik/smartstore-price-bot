import { pathToFileURL } from "node:url";

import createPage from "./createPage.js";
import delaySeconds from "../util/delaySeconds.js";
import naverLogin from "./naverLogin.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  createPage().then(async (page) => {
    await naverLogin(page);
    await delaySeconds(1);

    const productUrl =
      "https://search.shopping.naver.com/catalog/51929585719?query=%ED%9C%A9%EB%93%9C&NaPm=ct%3Dmqf6u9d4%7Cci%3Dd44532879fd554626041d24918bed3162d1d6e49%7Ctr%3Dslsl%7Csn%3D95694%7Chk%3D7733850d7257e887c444476727fa12e57b958142";
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
    .replaceAll("(", "%28") // 제품명에 괄호가 포함된 경우 요청 에러
    .replaceAll(")", "%29");

  const referer = `https://search.shopping.naver.com/search/all?query=${encodeName}&vertical=search`;

  await page.goto(referer, {
    referer: "https://search.shopping.naver.com/home",
  });

  await page.goto(catalogUrl, {
    referer,
  });

  const sellerPrices = await page.evaluate(async () => {
    const PRODUCT_SELLER_ROWS_SELECTOR =
      '[class^="product_seller_info_wrap__"]';
    const sellerPrices = Array.from(
      document.querySelectorAll(PRODUCT_SELLER_ROWS_SELECTOR),
    ).flatMap((productSellerRow) => {
      const seller = getSeller(productSellerRow);
      const price = getPrice(productSellerRow);
      const deliveryFee = getDeliveryFee(productSellerRow);
      const deliveryFeeType = getDeliveryFeeType(productSellerRow);
      const discountPrice = getDiscountPrice(productSellerRow);
      let sellerPrice = { seller, price, deliveryFee, deliveryFeeType };

      if (discountPrice !== null) {
        return [sellerPrice, { ...sellerPrice, price: discountPrice }];
      }

      return [sellerPrice];
    });

    return sellerPrices;

    function getSeller(productSellerRow) {
      const SELLER_SELECTOR = 'span[class^="product_name__"]';
      const { textContent: seller } =
        productSellerRow.querySelector(SELLER_SELECTOR);

      return seller;
    }

    function getPrice(productSellerRow) {
      const PRICE_SELECTOR = 'strong[class^="product_num__"]';
      const { textContent: price } =
        productSellerRow.querySelector(PRICE_SELECTOR);

      return Number(price.replaceAll(",", ""));
    }

    function getDiscountPrice(productSellerRow) {
      const DISCOUNT_PRICE_SELECTOR =
        'span[class^="discountPrice_discount_price__"] b';
      const discountPrice = productSellerRow.querySelector(
        DISCOUNT_PRICE_SELECTOR,
      );

      if (!discountPrice) return null;

      return Number(discountPrice.textContent.replaceAll(",", ""));
    }

    function getDeliveryFee(productSellerRow) {
      const DELIVERY_FEE_SELECTOR = 'div[class^="DeliveryFee"]';
      const deliveryFeeElement = productSellerRow.querySelector(
        DELIVERY_FEE_SELECTOR,
      );

      const { textContent } = deliveryFeeElement;

      if (textContent.includes("무료")) return 0;

      const [fee] = textContent.match(/[\d,]+/);

      return Number(fee.replaceAll(",", ""));
    }

    function getDeliveryFeeType(productSellerRow) {
      const DELIVERY_FEE_TYPE_SELECTOR = 'div[class^="DeliveryFee"]';
      const deliveryFeeTypeElement = productSellerRow.querySelector(
        DELIVERY_FEE_TYPE_SELECTOR,
      );

      const { textContent } = deliveryFeeTypeElement;

      if (textContent.includes("무료")) return "무료";

      return "유료";
    }
  });

  return sellerPrices;
}
