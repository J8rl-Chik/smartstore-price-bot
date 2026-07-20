import { describe, expect, it } from 'vitest';
import parseSellerRow from './parseSellerRow.js';

const createRowHtml = ({
  name = '쿠팡',
  price = '30,000',
  discountPriceHtml = '',
  deliveryFeeText = '무료배송',
}: {
  name?: string;
  price?: string;
  discountPriceHtml?: string;
  deliveryFeeText?: string;
} = {}) => `
  <div class="product_seller_info_wrap__x7f2A">
    <span class="product_name__abc">${name}</span>
    <strong class="product_num__def">${price}</strong>
    ${discountPriceHtml}
    <div class="DeliveryFeeArea__ghi">${deliveryFeeText}</div>
  </div>
`;

describe('parseSellerRow', () => {
  it('할인가가 없으면 판매처 1개를 반환한다', () => {
    const rowHtml = createRowHtml({ name: '쿠팡', price: '30,000' });

    expect(parseSellerRow(rowHtml)).toEqual([
      { name: '쿠팡', price: 30000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('할인가가 있으면 정가/할인가 두 판매처로 분리해 반환한다', () => {
    const rowHtml = createRowHtml({
      name: '쿠팡',
      price: '30,000',
      discountPriceHtml:
        '<span class="discountPrice_discount_price__jkl"><b>27,000</b></span>',
    });

    expect(parseSellerRow(rowHtml)).toEqual([
      { name: '쿠팡', price: 30000, deliveryFee: 0, deliveryFeeType: '무료' },
      { name: '쿠팡', price: 27000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('무료배송이면 deliveryFee 0, deliveryFeeType "무료"를 반환한다', () => {
    const rowHtml = createRowHtml({ deliveryFeeText: '무료배송' });

    expect(parseSellerRow(rowHtml)[0]).toMatchObject({ deliveryFee: 0, deliveryFeeType: '무료' });
  });

  it('착불이면 deliveryFee 0, deliveryFeeType "유료"를 반환한다', () => {
    const rowHtml = createRowHtml({ deliveryFeeText: '착불 3,000원' });

    expect(parseSellerRow(rowHtml)[0]).toMatchObject({ deliveryFee: 0, deliveryFeeType: '유료' });
  });

  it('유료배송이면 배송비 금액을 파싱해 deliveryFee에 담는다', () => {
    const rowHtml = createRowHtml({ deliveryFeeText: '배송비 2,500원' });

    expect(parseSellerRow(rowHtml)[0]).toMatchObject({ deliveryFee: 2500, deliveryFeeType: '유료' });
  });

  it('가격 콤마를 제거하고 숫자로 변환한다', () => {
    const rowHtml = createRowHtml({ price: '1,234,000' });

    expect(parseSellerRow(rowHtml)[0]?.price).toBe(1234000);
  });

  it('필수 요소(판매처명)를 찾지 못하면 에러를 던진다', () => {
    const rowHtml = `<div class="product_seller_info_wrap__x7f2A"></div>`;

    expect(() => parseSellerRow(rowHtml)).toThrow('해당하는 요소를 찾지 못했습니다');
  });
});
