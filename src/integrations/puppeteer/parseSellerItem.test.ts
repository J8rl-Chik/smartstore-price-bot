import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import parseSellerItem from './parseSellerItem.js';
import { SELLER_ITEM_SELECTOR } from './getSellersInPuppeteer.js';
import productSellersHTML from './sellerItemsHTML.fixture.js';

const createSellerItemHTML = ({
  name = '쿠팡',
  price = '30,000',
  discountPriceHTML = '',
  deliveryFeeText = '무료배송',
}: {
  name?: string;
  price?: string;
  discountPriceHTML?: string;
  deliveryFeeText?: string;
} = {}) => `
  <div class="product_seller_info_wrap__x7f2A">
    <span class="product_name__abc">${name}</span>
    <strong class="product_num__def">${price}</strong>원
    ${discountPriceHTML}
    <div class="DeliveryFeeArea__ghi">${deliveryFeeText}</div>
  </div>

`;

describe('parseSellerItem', () => {
  it('할인가가 없으면 판매처 1개를 반환한다', () => {
    const itemHTML = createSellerItemHTML({ name: '쿠팡', price: '30,000' });

    expect(parseSellerItem(itemHTML)).toEqual([
      { name: '쿠팡', price: 30000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('할인가가 있으면 정가/할인가 두 판매처로 분리해 반환한다', () => {
    const itemHTML = createSellerItemHTML({
      name: '쿠팡',
      price: '30,000',
      discountPriceHTML: '<span class="discountPrice_discount_price__jkl"><b>27,000</b></span>',
    });

    expect(parseSellerItem(itemHTML)).toEqual([
      { name: '쿠팡', price: 30000, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: '쿠팡', price: 27000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('무료배송이면 deliveryFee 0, deliveryFeeType "무료"를 반환한다', () => {
    const itemHTML = createSellerItemHTML({ deliveryFeeText: '무료' });

    expect(parseSellerItem(itemHTML)[0]).toMatchObject({ deliveryFee: 0, deliveryFeeType: '무료' });
  });

  it('착불이면 실제 배송비를 알 수 없으므로 deliveryFee 0, deliveryFeeType "무료"로 취급한다', () => {
    const itemHTML = createSellerItemHTML({ deliveryFeeText: '착불' });

    expect(parseSellerItem(itemHTML)[0]).toMatchObject({ deliveryFee: 0, deliveryFeeType: '무료' });
  });

  it('"포함"이 있으면 유료배송으로 보고 배송비 금액을 파싱해 deliveryFee에 담는다', () => {
    const itemHTML = createSellerItemHTML({ deliveryFeeText: '2,500원 포함' });

    expect(parseSellerItem(itemHTML)[0]).toMatchObject({
      deliveryFee: 2500,
      deliveryFeeType: '유료',
    });
  });

  it('가격 콤마를 제거하고 숫자로 변환한다', () => {
    const itemHTML = createSellerItemHTML({ price: '1,234,000' });

    expect(parseSellerItem(itemHTML)[0]?.price).toBe(1234000);
  });

  it('필수 요소(판매처명)를 찾지 못하면 원인을 보존한 채 에러를 던진다', () => {
    const itemHTML = `<div class="product_seller_info_wrap__x7f2A"></div>`;

    expect(() => parseSellerItem(itemHTML)).toThrow(
      expect.objectContaining({
        message: '판매처 정보를 파싱하지 못했습니다.',
        cause: expect.objectContaining({
          message: expect.stringContaining('해당하는 요소를 찾지 못했습니다'),
        }),
      }),
    );
  });

  it('"포함"은 있는데 배송비 숫자를 찾지 못하면 원인을 보존한 채 에러를 던진다', () => {
    const itemHTML = createSellerItemHTML({ deliveryFeeText: '포함' });

    expect(() => parseSellerItem(itemHTML)).toThrow(
      expect.objectContaining({
        message: '판매처 정보를 파싱하지 못했습니다.',
        cause: expect.anything(),
      }),
    );
  });
});

/**
 * 네이버 가격비교 페이지에서 실제로 캡처한 HTML(sellerItemsHTML.fixture.ts)로 검증한다.
 * getSellersInPuppeteer가 실제로 하는 것과 동일하게(같은 selector로 항목을 골라 outerHTML을
 * 추출) 파싱해서, 합성 fixture만으로는 놓칠 수 있는 실제 마크업과의 불일치를 잡아낸다.
 */
describe('실제 캡처된 페이지 HTML로 검증', () => {
  const { document } = new JSDOM(productSellersHTML).window;
  const itemsHTML = Array.from(document.querySelectorAll(SELLER_ITEM_SELECTOR)).map(
    (item) => item.outerHTML,
  );
  const sellers = itemsHTML.flatMap(parseSellerItem);

  it('실제 페이지에 있는 10개 판매처를 모두 파싱한다', () => {
    expect(sellers).toHaveLength(10);
  });

  it('각 판매처의 이름/가격/배송비를 정확히 파싱한다', () => {
    expect(sellers).toEqual([
      { name: '무신사', price: 16000, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: 'G마켓', price: 17700, deliveryFee: 2500, deliveryFeeType: '유료' },
      { name: '아레스유통', price: 18280, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: '소마레', price: 18290, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: '신세계V', price: 18300, deliveryFee: 2500, deliveryFeeType: '유료' },
      { name: '롯데ON', price: 18800, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: '마몽드', price: 19400, deliveryFee: 2500, deliveryFeeType: '유료' },
      { name: '옥션', price: 19410, deliveryFee: 2500, deliveryFeeType: '유료' },
      { name: '29CM', price: 20000, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: 'CJ온스타일', price: 15200, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });
});
