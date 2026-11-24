// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import parseSellerItem, { collectSellerItemTexts } from './parseSellerItem.js';
import { SELLER_ITEM_SELECTOR } from './getSellersInPuppeteer.js';
import productSellersHTML from './_sellerItemsHTML.fixture.js';

describe('parseSellerItem', () => {
  const createSellerItemTexts = ({
    name = '쿠팡',
    price = '30,000',
    discountPrice = null,
    delivery = '무료배송',
  }: {
    name?: string | null;
    price?: string | null;
    discountPrice?: string | null;
    delivery?: string | null;
  } = {}) => ({ name, price, discountPrice, delivery });

  it('할인가가 없으면 판매처 1개를 반환한다', () => {
    const texts = createSellerItemTexts({ name: '쿠팡', price: '30,000' });

    expect(parseSellerItem(texts)).toEqual([
      { name: '쿠팡', price: 30000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('할인가가 있으면 정가/할인가 두 판매처로 분리해 반환한다', () => {
    const texts = createSellerItemTexts({ name: '쿠팡', price: '30,000', discountPrice: '27,000' });

    expect(parseSellerItem(texts)).toEqual([
      { name: '쿠팡', price: 30000, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: '쿠팡', price: 27000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('무료배송이면 deliveryFee 0, deliveryFeeType "무료"를 반환한다', () => {
    const texts = createSellerItemTexts({ delivery: '무료' });

    expect(parseSellerItem(texts)[0]).toMatchObject({ deliveryFee: 0, deliveryFeeType: '무료' });
  });

  it('착불이면 실제 배송비를 알 수 없으므로 deliveryFee 0, deliveryFeeType "무료"로 취급한다', () => {
    const texts = createSellerItemTexts({ delivery: '착불' });

    expect(parseSellerItem(texts)[0]).toMatchObject({ deliveryFee: 0, deliveryFeeType: '무료' });
  });

  it('"포함"이 있으면 유료배송으로 보고 배송비 금액을 파싱해 deliveryFee에 담는다', () => {
    const texts = createSellerItemTexts({ delivery: '2,500원 포함' });

    expect(parseSellerItem(texts)[0]).toMatchObject({
      deliveryFee: 2500,
      deliveryFeeType: '유료',
    });
  });

  it('가격 콤마를 제거하고 숫자로 변환한다', () => {
    const texts = createSellerItemTexts({ price: '1,234,000' });

    expect(parseSellerItem(texts)[0]?.price).toBe(1234000);
  });

  it('필수 텍스트(판매처명)가 없으면 원인을 보존한 채 에러를 던진다', () => {
    const texts = createSellerItemTexts({ name: null });

    expect(() => parseSellerItem(texts)).toThrow(
      expect.objectContaining({
        message: '판매처 정보를 파싱하지 못했습니다.',
        cause: expect.objectContaining({
          message: expect.stringContaining('해당하는 요소를 찾지 못했습니다'),
        }),
      }),
    );
  });

  it('"포함"은 있는데 배송비 숫자를 찾지 못하면 원인을 보존한 채 에러를 던진다', () => {
    const texts = createSellerItemTexts({ delivery: '포함' });

    expect(() => parseSellerItem(texts)).toThrow(
      expect.objectContaining({
        message: '판매처 정보를 파싱하지 못했습니다.',
        cause: expect.anything(),
      }),
    );
  });
});

describe('collectSellerItemTexts', () => {
  it('판매처 항목마다 판매처명, 가격, 할인가, 배송비 텍스트를 꺼낸다', () => {
    document.body.innerHTML = `
      <div class="product_seller_info_wrap__x7f2A">
        <span class="product_name__abc">쿠팡</span>
        <strong class="product_num__def">30,000</strong>원
        <span class="discountPrice_discount_price__jkl"><b>27,000</b></span>
        <div class="DeliveryFeeArea__ghi">2,500원 포함</div>
      </div>
    `;

    expect(collectSellerItemTexts(SELLER_ITEM_SELECTOR)).toEqual([
      { name: '쿠팡', price: '30,000', discountPrice: '27,000', delivery: '2,500원 포함' },
    ]);
  });

  it('항목 안에 해당 요소가 없으면 그 텍스트는 null이다', () => {
    document.body.innerHTML = `<div class="product_seller_info_wrap__x7f2A"></div>`;

    expect(collectSellerItemTexts(SELLER_ITEM_SELECTOR)).toEqual([
      { name: null, price: null, discountPrice: null, delivery: null },
    ]);
  });

  it('판매처 항목이 없으면 빈 배열을 반환한다', () => {
    document.body.innerHTML = '<div>판매처 없음</div>';

    expect(collectSellerItemTexts(SELLER_ITEM_SELECTOR)).toEqual([]);
  });

  /**
   * 네이버 가격비교 페이지에서 실제로 캡처한 HTML(_sellerItemsHTML.fixture.ts)로 검증한다.
   * getSellersInPuppeteer가 실제로 하는 것과 같은 순서(collectSellerItemTexts → parseSellerItem)로
   * 변환해서, 합성 데이터만으로는 놓칠 수 있는 실제 마크업과의 불일치를 잡아낸다.
   */
  describe('실제 캡처된 페이지 HTML이면', () => {
    const collectSellers = () => {
      document.body.innerHTML = productSellersHTML;

      return collectSellerItemTexts(SELLER_ITEM_SELECTOR).flatMap(parseSellerItem);
    };

    it('실제 페이지에 있는 10개 판매처를 모두 파싱한다', () => {
      expect(collectSellers()).toHaveLength(10);
    });

    it('각 판매처의 이름/가격/배송비를 정확히 파싱한다', () => {
      expect(collectSellers()).toEqual([
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
});
