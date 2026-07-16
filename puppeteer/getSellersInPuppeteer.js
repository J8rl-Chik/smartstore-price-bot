import createPage from './createPage.js';
import delaySeconds from '../util/delaySeconds.js';
import naverLogin from './naverLogin.js';
import isManualTestRun from '../util/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  createPage().then(async (page) => {
    await naverLogin(page);
    await delaySeconds(1);

    const productUrl =
      'https://search.shopping.naver.com/catalog/60370364009?query=%EC%97%90%EC%8A%A4%ED%8A%B8%EB%9D%BC%20%EC%95%84%ED%86%A0%EB%B2%A0%EB%A6%AC%EC%96%B4365%20%ED%95%98%EC%9D%B4%EB%93%9C%EB%A1%9C%20%EC%88%98%EB%94%A9%20%ED%81%AC%EB%A6%BC%2080ml%28%EC%8B%A0%ED%98%95%29%201%EA%B0%9C&NaPm=ct%3Dmrkhiq8w%7Cci%3Dbe6e7645484243a838254c425f8764327a91f069%7Ctr%3Dslsl%7Csn%3D95694%7Chk%3D057a1b48ceb53e55a341703b09c73ed7706974ea';
    const productName = '에스트라 아토베리어365 하이드로 수딩 크림 80ml(신형) 1개';

    await getSellersInPuppeteer(page, productUrl, productName).then(console.log);
    await page.close();
  });
}

export default async function getSellersInPuppeteer(page, catalogUrl, productName) {
  // 제품명에 괄호가 포함된 경우 요청 에러
  const encodeName = encodeURIComponent(productName).replaceAll('(', '%28').replaceAll(')', '%29');
  const referer = `https://search.shopping.naver.com/search/all?query=${encodeName}&vertical=search`;

  await page.goto(referer, {
    referer: 'https://search.shopping.naver.com/home',
  });

  await page.goto(catalogUrl, {
    referer,
  });

  const sellers = await page.evaluate(async () => {
    // puppeteer가 띄운 브라우저의 페이지에 주입할 스크립트
    const productSellerRowsSelector = '[class^="product_seller_info_wrap__"]';

    const getName = (productSellerRow) => {
      const sellerSelector = 'span[class^="product_name__"]';
      const { textContent: name } = productSellerRow.querySelector(sellerSelector);

      return name;
    };

    const getPrice = (productSellerRow) => {
      const priceSelector = 'strong[class^="product_num__"]';
      const { textContent: price } = productSellerRow.querySelector(priceSelector);

      return Number(price.replaceAll(',', ''));
    };

    const getDiscountPrice = (productSellerRow) => {
      const discountPriceSelector = 'span[class^="discountPrice_discount_price__"] b';
      const discountPrice = productSellerRow.querySelector(discountPriceSelector);

      if (!discountPrice) {
        return null;
      }

      return Number(discountPrice.textContent.replaceAll(',', ''));
    };

    const getDeliveryFee = (productSellerRow) => {
      const deliveryFeeSelector = 'div[class^="DeliveryFee"]';
      const deliveryFeeElement = productSellerRow.querySelector(deliveryFeeSelector);

      const { textContent } = deliveryFeeElement;

      if (textContent.includes('무료') || textContent.includes('착불')) {
        return 0;
      }

      const [fee] = textContent.match(/[\d,]+/);

      return Number(fee.replaceAll(',', ''));
    };

    const getDeliveryFeeType = (productSellerRow) => {
      const deliveryFeeTypeSelector = 'div[class^="DeliveryFee"]';
      const deliveryFeeTypeElement = productSellerRow.querySelector(deliveryFeeTypeSelector);

      const { textContent } = deliveryFeeTypeElement;

      if (textContent.includes('무료')) {
        return '무료';
      }

      return '유료';
    };

    const sellers = Array.from(document.querySelectorAll(productSellerRowsSelector)).flatMap(
      (productSellerRow) => {
        const name = getName(productSellerRow);
        const price = getPrice(productSellerRow);
        const deliveryFee = getDeliveryFee(productSellerRow);
        const deliveryFeeType = getDeliveryFeeType(productSellerRow);
        const discountPrice = getDiscountPrice(productSellerRow);
        let seller = { name, price, deliveryFee, deliveryFeeType };

        if (discountPrice !== null) {
          return [seller, { ...seller, price: discountPrice }];
        }

        return [seller];
      },
    );

    return sellers;
  });

  return sellers;
}
