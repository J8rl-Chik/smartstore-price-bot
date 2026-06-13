import fetch from "node-fetch";
import { pathToFileURL } from "node:url";

import generateAccessToken from "./generateAccessToken.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  getSaleProducts().then(([saleProduct]) =>
    console.log(
      `getSaleProducts 함수 테스트: ${saleProduct.channelProducts[0].name}`,
    ),
  );
}

export default async function getSaleProducts() {
  const accessToken = await generateAccessToken();
  const response = await fetch(
    `https://api.commerce.naver.com/external/v1/products/search`,
    {
      method: "POST",
      headers: {
        Authorization: accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productStatusTypes: ["SALE"],
        size: 500,
      }),
    },
  );

  const { contents } = await response.json();

  const shuffleInPlace = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  return shuffleInPlace(
    contents.filter((content) => {
      const productCode = content.channelProducts[0].sellerManagementCode;

      if (productCode === undefined) return true;

      return productCode.includes("신규") ? false : true;
    }),
  );
}
