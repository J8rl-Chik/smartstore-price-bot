import type { Seller } from '../../domain/seller/_type.js';
import parseToNumberFromKRW from '../../domain/price/parseToNumberFromKRW.js';
import { DELIVERY_FEE_TYPE } from '../../domain/delivery/_constant.js';
import { DeliveryFeeType } from '../../domain/delivery/_type.js';

/**
 * 판매처 한 항목에서 꺼낸 텍스트. 요소가 없으면 null이다.
 * 브라우저에서 Node로 넘어오는 값이라 직렬화할 수 있는 문자열과 null만 담는다.
 */
export interface SellerItemTexts {
  name: string | null;
  price: string | null;
  discountPrice: string | null;
  delivery: string | null;
}

interface DeliveryFeeAndType {
  fee: number;
  type: Exclude<DeliveryFeeType, '수량별'>;
}

/**
 * 네이버 가격비교 페이지에서 판매처 항목마다 필요한 텍스트를 꺼낸다.
 * page.evaluate로 브라우저 안에서 실행되고 함수 본문만 직렬화돼 전달되므로, 바깥 변수나 import를 쓰지 않는다.
 */
export const collectSellerItemTexts = (selector: string): SellerItemTexts[] =>
  Array.from(document.querySelectorAll(selector)).map((sellerItem) => ({
    name: sellerItem.querySelector('span[class^="product_name__"]')?.textContent ?? null,
    price: sellerItem.querySelector('strong[class^="product_num__"]')?.textContent ?? null,
    discountPrice:
      sellerItem.querySelector('span[class^="discountPrice_discount_price__"] b')?.textContent ??
      null,
    delivery: sellerItem.querySelector('div[class^="DeliveryFee"]')?.textContent ?? null,
  }));

const getRequiredText = (texts: SellerItemTexts, field: keyof SellerItemTexts): string => {
  const text = texts[field];

  if (!text) {
    throw new Error(`판매처 항목에서 "${field}"에 해당하는 요소를 찾지 못했습니다.`);
  }

  return text;
};

// 할인가가 없는 판매처도 많아서, 이 값이 없는 건 에러가 아니라 정상 상황이다.
const getDiscountPrice = (texts: SellerItemTexts): number | null => {
  if (!texts.discountPrice) {
    return null;
  }

  return parseToNumberFromKRW(texts.discountPrice);
};

const getDelivery = (texts: SellerItemTexts): DeliveryFeeAndType => {
  const deliveryText = getRequiredText(texts, 'delivery');

  // 실제 배송비가 표시되는 경우 "2,500원 포함"처럼 "포함"이 붙는다.
  if (deliveryText.includes('포함')) {
    const fee = deliveryText.match(/[\d,]+/)?.[0] ?? '';

    return { fee: parseToNumberFromKRW(fee), type: DELIVERY_FEE_TYPE.PAID };
  }

  // '무료'/'착불'은 둘 다 실제로 청구되는 배송비를 알 수 없어 무료로 취급한다.
  return { fee: 0, type: DELIVERY_FEE_TYPE.FREE };
};

/**
 * 네이버 가격비교 판매처 한 항목의 텍스트를 Seller로 변환한다.
 * 할인가가 있으면 정가/할인가 둘 다 유효한 구매 옵션이라 두 개의 Seller로 분리해 반환한다.
 */
const parseSellerItem = (texts: SellerItemTexts): Seller[] => {
  try {
    const delivery = getDelivery(texts);
    const seller: Seller = {
      name: getRequiredText(texts, 'name'),
      price: parseToNumberFromKRW(getRequiredText(texts, 'price')),
      deliveryFee: delivery.fee,
      deliveryFeeType: delivery.type,
    };
    const discountPrice = getDiscountPrice(texts);

    if (discountPrice !== null) {
      return [seller, { ...seller, price: discountPrice }];
    }

    return [seller];
  } catch (error) {
    throw new Error('판매처 정보를 파싱하지 못했습니다.', { cause: error });
  }
};

export default parseSellerItem;
