import { pathToFileURL } from "node:url";
import fetch from "node-fetch";

import generateAccessToken from "./generateAccessToken.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(
    "updatePrice 함수 테스트: 클린 웜 코튼 오 드 퍼퓸 60ml 20만원으로 수정",
  );

  updatePrice({
    productNo: 12646660788, // 클린 웜 코튼 오 드 퍼퓸 60ml
    salePrice: 200000,
    deliveryFeeType: "수량별",
    baseFee: 3000,
    repeatQuantity: 10,
  });
}

export default async function updatePrice({
  productNo,
  salePrice,
  deliveryFeeType,
  baseFee,
  repeatQuantity,
}) {
  const deliveryFee = {};

  // deliveryFeeType이 비어있으면 API가 FREE(무료)로 처리
  if (deliveryFeeType === "무료") {
    deliveryFee.deliveryFeeType = "FREE";
  } else if (deliveryFeeType === "유료") {
    deliveryFee.deliveryFeeType = "PAID";
    deliveryFee.baseFee = baseFee;
    deliveryFee.deliveryFeePayType = "PREPAID";
  } else if (deliveryFeeType === "수량별") {
    deliveryFee.deliveryFeeType = "UNIT_QUANTITY_PAID";
    deliveryFee.baseFee = baseFee;
    deliveryFee.repeatQuantity = repeatQuantity;
    deliveryFee.deliveryFeePayType = "PREPAID";
  }

  const PRODUCT_URL =
    "https://api.commerce.naver.com/external/v2/products/origin-products";
  const accessToken = await generateAccessToken();
  const headers = {
    Authorization: accessToken,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${PRODUCT_URL}/${productNo}`, {
    headers,
    method: "GET",
  });
  const { originProduct, smartstoreChannelProduct, windowChannelProduct } =
    await response.json();

  const updateResponse = await fetch(`${PRODUCT_URL}/${productNo}`, {
    headers,
    method: "PUT",
    body: JSON.stringify({
      originProduct: {
        ...originProduct,
        deliveryInfo: {
          ...originProduct.deliveryInfo,
          deliveryFee,
        },
        salePrice,
        smartstoreChannelProduct,
        windowChannelProduct,
      },
    }),
  });

  const responseDetail = await updateResponse.json();

  return responseDetail;
}
