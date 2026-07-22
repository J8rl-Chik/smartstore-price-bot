import fetch from 'node-fetch';

import type { DeliveryFee } from '../../core/delivery.js';
import generateAccessToken from './generateAccessToken.js';
import checkNaverApiSucceeded, { type NaverApiResult } from './checkNaverApiSucceeded.js';

interface UpdatePriceParam {
  productNo: number;
  deliveryFee: DeliveryFee;
  salePrice: number;
}

interface OriginProduct {
  detailContent?: unknown;
  stockQuantity?: unknown;
  deliveryInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ProductResult {
  originProduct: OriginProduct;
  smartstoreChannelProduct: unknown;
  windowChannelProduct: unknown;
}

const getProduct = async (
  productURL: string,
  headers: Record<string, string>,
): Promise<ProductResult> => {
  const readResponse = await fetch(productURL, { headers, method: 'GET' });

  return readResponse.json();
};

/**
 * 조회한 원본 상품 데이터를 수정 요청 바디에 그대로 사용할 경우, 특정 키가 문제를 일으켜 제거한다.
 * detailContent: 그대로 보내면 네이버 쪽에서 HTML이 강제로 수정됨
 * stockQuantity: 그대로 보내면 재고 오차가 발생할 수 있음
 */
const sanitizeProductForUpdate = (product: OriginProduct): OriginProduct => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { detailContent, stockQuantity, ...sanitizedProduct } = product;

  return sanitizedProduct;
};

async function updatePrice({ productNo, deliveryFee, salePrice }: UpdatePriceParam) {
  try {
    const productURL = `https://api.commerce.naver.com/external/v2/products/origin-products/${productNo}`;
    const accessToken = await generateAccessToken();
    const headers = {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    };

    const { originProduct, smartstoreChannelProduct, windowChannelProduct } = await getProduct(
      productURL,
      headers,
    );
    const sanitizedProduct = sanitizeProductForUpdate(originProduct);
    const response = await fetch(productURL, {
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
