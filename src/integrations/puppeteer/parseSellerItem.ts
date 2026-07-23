import { JSDOM } from 'jsdom';

import { DELIVERY_FEE_TYPE } from '../../domain/constant.js';
import parseToNumberFromKRW from '../../domain/parseToNumberFromKRW.js';
import type { Seller } from '../../domain/sellers.js';

interface Delivery {
  fee: number;
  type: Seller['deliveryFeeType'];
}

const getTextContent = (sellerItem: Element, selector: string): string => {
  const element = sellerItem.querySelector(selector);

  if (!element?.textContent) {
    throw new Error(`"${selector}"에 해당하는 요소를 찾지 못했습니다.`);
  }

  return element.textContent;
};

const getName = (sellerItem: Element): string =>
  getTextContent(sellerItem, 'span[class^="product_name__"]');

const getPrice = (sellerItem: Element): number =>
  parseToNumberFromKRW(getTextContent(sellerItem, 'strong[class^="product_num__"]'));

// 할인가가 없는 판매처도 많아서, 이 값이 없는 건 에러가 아니라 정상 상황이다.
const getDiscountPrice = (sellerItem: Element): number | null => {
  const discountPriceElement = sellerItem.querySelector(
    'span[class^="discountPrice_discount_price__"] b',
  );

  if (!discountPriceElement?.textContent) {
    return null;
  }

  return parseToNumberFromKRW(discountPriceElement.textContent);
};

const getDelivery = (sellerItem: Element): Delivery => {
  const textContent = getTextContent(sellerItem, 'div[class^="DeliveryFee"]');

  // 실제 배송비가 표시되는 경우 "2,500원 포함"처럼 "포함"이 붙는다.
  if (textContent.includes('포함')) {
    const fee = textContent.match(/[\d,]+/)?.[0] ?? '';

    return { fee: parseToNumberFromKRW(fee), type: DELIVERY_FEE_TYPE.PAID };
  }

  // '무료'/'착불'은 둘 다 실제로 청구되는 배송비를 알 수 없어 무료로 취급한다.
  return { fee: 0, type: DELIVERY_FEE_TYPE.FREE };
};

/**
 * 네이버 가격비교 판매처 한 항목(outerHTML)을 Seller로 변환한다.
 * 할인가가 있으면 정가/할인가 둘 다 유효한 구매 옵션이라 두 개의 Seller로 분리해 반환한다.
 */
const parseSellerItem = (sellerItemHTML: string): Seller[] => {
  try {
    const { document } = new JSDOM(sellerItemHTML).window;
    const sellerItem = document.body.firstElementChild;

    if (!sellerItem) {
      throw new Error('판매처 항목 HTML이 비어 있습니다.');
    }

    const delivery = getDelivery(sellerItem);
    const seller: Seller = {
      name: getName(sellerItem),
      price: getPrice(sellerItem),
      deliveryFee: delivery.fee,
      deliveryFeeType: delivery.type,
    };
    const discountPrice = getDiscountPrice(sellerItem);

    if (discountPrice !== null) {
      return [seller, { ...seller, price: discountPrice }];
    }

    return [seller];
  } catch (error) {
    throw new Error('판매처 정보를 파싱하지 못했습니다.', { cause: error });
  }
};

export default parseSellerItem;
