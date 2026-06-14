import delaySecond from "../delaySecond.js";
import naverLogin from "./naverLogin.js";

async function getPricesInPuppeteer(page, url, productName) {
  let encodeName = encodeURIComponent(productName).replaceAll("(", "%28");
  encodeName = encodeName.replaceAll(")", "%29");

  const referer = `https://search.shopping.naver.com/search/all?query=${encodeName}&vertical=search`;

  await delaySecond(1);

  await page.goto(referer, {
    referer: "https://search.shopping.naver.com/home",
  });

  await delaySecond(1);

  await page.goto(url, {
    referer,
  });

  const result = await page.evaluate(async () => {
    {
      const getSeller = (productPriceRow) => {
        const sellerLink = productPriceRow.querySelector(
          'span[class^="product_name__"]',
        );

        return sellerLink.textContent || sellerLink.querySelector("img").alt;
      };

      const getNaverPayInfo = (productPriceRow) => {
        const naverPayInfo = productPriceRow.querySelector(".blind");

        return naverPayInfo ? naverPayInfo.textContent : null;
      };

      const getPrice = (productPriceRow) => {
        const sellingPrice = productPriceRow.querySelector(
          'strong[class^="product_num__"]',
        );

        return Number(
          [...sellingPrice.textContent]
            .filter((character) => ![","].includes(character))
            .join(""),
        );
      };

      const getCouponDiscontPrice = (productPriceRow) => {
        const sellingPrices = productPriceRow.querySelectorAll("del");
        if (sellingPrices.length > 1) {
          return Number(
            [...sellingPrices[1].textContent]
              .filter((character) => ![","].includes(character))
              .join(""),
          );
        }

        return Number(
          [...sellingPrices[0].textContent]
            .filter((character) => ![","].includes(character))
            .join(""),
        );
      };

      const hasCouponDiscount = (productPriceRow) =>
        productPriceRow.textContent.includes("쿠폰 할인가");

      const productPriceRows = Array.from(
        document.querySelectorAll('[class^="product_seller_info_wrap__'),
      );

      const prices = productPriceRows.map((productPrice) => ({
        seller: getSeller(productPrice),
        naverPay: getNaverPayInfo(productPrice),
        sellingPrice: getPrice(productPrice),
      }));

      const couponDiscountPrices = productPriceRows
        .filter(hasCouponDiscount)
        .map((productPrice) => ({
          seller: getSeller(productPrice),
          naverPay: getNaverPayInfo(productPrice),
          sellingPrice: getCouponDiscontPrice(productPrice),
        }));

      return [...prices, ...couponDiscountPrices];
    }
  });

  return result;
}

exports.getPricesInPuppeteer = getPricesInPuppeteer;
