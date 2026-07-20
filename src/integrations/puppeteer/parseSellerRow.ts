import { JSDOM } from 'jsdom';

import type { Seller } from '../../core/sellers.js';

const NAME_SELECTOR = 'span[class^="product_name__"]';
const PRICE_SELECTOR = 'strong[class^="product_num__"]';
const DISCOUNT_PRICE_SELECTOR = 'span[class^="discountPrice_discount_price__"] b';
const DELIVERY_FEE_SELECTOR = 'div[class^="DeliveryFee"]';

const getTextContent = (row: Element, selector: string): string => {
  const element = row.querySelector(selector);

  if (!element?.textContent) {
    throw new Error(`"${selector}"에 해당하는 요소를 찾지 못했습니다.`);
  }

  return element.textContent;
};

const getName = (row: Element): string => getTextContent(row, NAME_SELECTOR);

const getPrice = (row: Element): number =>
  Number(getTextContent(row, PRICE_SELECTOR).replaceAll(',', ''));

// 할인가가 없는 판매처도 많아서, 이 값이 없는 건 에러가 아니라 정상 상황이다.
const getDiscountPrice = (row: Element): number | null => {
  const discountPriceElement = row.querySelector(DISCOUNT_PRICE_SELECTOR);

  if (!discountPriceElement?.textContent) {
    return null;
  }

  return Number(discountPriceElement.textContent.replaceAll(',', ''));
};

const getDeliveryFee = (row: Element): number => {
  const textContent = getTextContent(row, DELIVERY_FEE_SELECTOR);

  if (textContent.includes('무료') || textContent.includes('착불')) {
    return 0;
  }

  const fee = textContent.match(/[\d,]+/)?.[0];

  if (!fee) {
    throw new Error(`배송비를 파싱하지 못했습니다: "${textContent}"`);
  }

  return Number(fee.replaceAll(',', ''));
};

const getDeliveryFeeType = (row: Element): Seller['deliveryFeeType'] =>
  getTextContent(row, DELIVERY_FEE_SELECTOR).includes('무료') ? '무료' : '유료';

/**
 * 네이버 가격비교 판매처 한 행(outerHTML)을 Seller로 변환한다.
 * 할인가가 있으면 정가/할인가 둘 다 유효한 구매 옵션이라 두 개의 Seller로 분리해 반환한다.
 */
const parseSellerRow = (rowHtml: string): Seller[] => {
  const { document } = new JSDOM(rowHtml).window;
  const row = document.body.firstElementChild;

  if (!row) {
    throw new Error('판매처 행 HTML이 비어 있습니다.');
  }

  const seller: Seller = {
    name: getName(row),
    price: getPrice(row),
    deliveryFee: getDeliveryFee(row),
    deliveryFeeType: getDeliveryFeeType(row),
  };
  const discountPrice = getDiscountPrice(row);

  if (discountPrice !== null) {
    return [seller, { ...seller, price: discountPrice }];
  }

  return [seller];
};

export default parseSellerRow;
