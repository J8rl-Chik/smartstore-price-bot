import { pathToFileURL } from "node:url";
import fetch from "node-fetch";

import generateAccessToken from "./generateAccessToken.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(
    "updatePrice 함수 테스트: 클린 웜 코튼 오 드 퍼퓸 60ml 20만원으로 수정",
  );

  updatePrice({
    productNo: 12646660788, // 클린 웜 코튼 오 드 퍼퓸 60ml
    targetPrice: 200500,
    delivery: {
      feeType: "수량별",
      baseFee: 3000,
      repeatQuantity: 20,
    },
  });
}

export default async function updatePrice({
  productNo,
  targetPrice,
  delivery,
}) {
  const deliveryFee = {};
  let salePrice = targetPrice;

  if (delivery.feeType === "무료") {
    deliveryFee.deliveryFeeType = "FREE";
  } else if (delivery.feeType === "유료") {
    deliveryFee.deliveryFeeType = "PAID";
    deliveryFee.deliveryFeePayType = "PREPAID";
    deliveryFee.baseFee = delivery.baseFee;
    salePrice = targetPrice - delivery.baseFee;
  } else if (delivery.feeType === "수량별") {
    deliveryFee.deliveryFeePayType = "PREPAID";
    deliveryFee.deliveryFeeType = "UNIT_QUANTITY_PAID";
    deliveryFee.repeatQuantity = delivery.repeatQuantity;
    deliveryFee.baseFee = delivery.baseFee;
    salePrice = targetPrice - delivery.baseFee;
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

  // HTML로 강제 수정돼서 제거
  delete originProduct.detailContent;
  // 재고 오차 발생 가능성으로 제거
  delete originProduct.stockQuantity;

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
      },
      smartstoreChannelProduct,
      windowChannelProduct,
    }),
  });

  const responseDetail = await updateResponse.json();

  return responseDetail;
}
