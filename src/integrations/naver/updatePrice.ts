import fetch from 'node-fetch';

import type { DeliveryFee } from '../../core/delivery.js';
import generateAccessToken from './generateAccessToken.js';
import checkNaverApiSucceeded, { type NaverApiResult } from './checkNaverApiSucceeded.js';

interface UpdatePriceParam {
  productNo: number;
  deliveryFee: DeliveryFee;
  salePrice: number;
}

interface Product {
  detailContent?: unknown;
  stockQuantity?: unknown;
  deliveryInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ProductResult {
  originProduct: Product;
  smartstoreChannelProduct: unknown;
  windowChannelProduct: unknown;
}

const getProduct = async (
  productUrl: string,
  headers: Record<string, string>,
): Promise<ProductResult> => {
  const readResponse = await fetch(productUrl, { headers, method: 'GET' });

  return readResponse.json();
};

/**
 * 조회한 원본 상품을 수정 요청 바디에 그대로 재사용할 수 없는 필드를 제거해 반환한다.
 * detailContent: 그대로 보내면 네이버 쪽에서 HTML이 강제로 수정됨
 * stockQuantity: 그대로 보내면 재고 오차가 발생할 수 있음
 */
const sanitizeProductForUpdate = (product: Product): Product => {
  // detailContent/stockQuantity를 골라내기 위한 구조 분해라 값 자체는 쓰지 않는다.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { detailContent, stockQuantity, ...sanitizedProduct } = product;

  return sanitizedProduct;
};

async function updatePrice({ productNo, deliveryFee, salePrice }: UpdatePriceParam) {
  try {
    const productUrl = `https://api.commerce.naver.com/external/v2/products/origin-products/${productNo}`;
    const accessToken = await generateAccessToken();
    const headers = {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    };

    const { originProduct, smartstoreChannelProduct, windowChannelProduct } = await getProduct(
      productUrl,
      headers,
    );
    const sanitizedProduct = sanitizeProductForUpdate(originProduct);
    const response = await fetch(productUrl, {
      headers,
      method: 'PUT',
      body: JSON.stringify({
        originProduct: {
          ...sanitizedProduct,
          deliveryInfo: {
            ...sanitizedProduct.deliveryInfo,
            deliveryFee,
          },
          salePrice,
        },
        smartstoreChannelProduct,
        windowChannelProduct,
      }),
    });
    const result: NaverApiResult = await response.json();

    checkNaverApiSucceeded(result);

    return result;
  } catch (error) {
    throw new Error('네이버 상품 가격을 수정하지 못했습니다.', { cause: error });
  }
}

export default updatePrice;
