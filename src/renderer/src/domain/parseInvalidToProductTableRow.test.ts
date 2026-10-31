import { expect, it } from 'vitest';
import { parseInvalidToProductTableRow } from './parseInvalidToProductTableRow';
import type { InvalidProductRow } from '../../../domain/product/_type';

const invalidProductRow: InvalidProductRow = {
  name: '무선 충전기',
  originProductNo: 333,
  store: { salePrice: 25000, deliveryFee: 3000 },
  errorMessages: ['productPrice: 에러', 'baseFee: 에러'],
};

it('originProductNo를 id로, 이름을 그대로 가져온다', () => {
  const result = parseInvalidToProductTableRow(invalidProductRow);

  expect(result.id).toBe(333);
  expect(result.name).toBe('무선 충전기');
});

it('설정가는 없다', () => {
  const result = parseInvalidToProductTableRow(invalidProductRow);

  expect(result.configuredPrice).toBeNull();
});

it('현재가는 스토어의 판매가와 스토어의 배송비를 그대로 담는다', () => {
  const result = parseInvalidToProductTableRow(invalidProductRow);

  expect(result.currentPrice).toEqual({ price: 25000, deliveryFee: 3000 });
});

it('수정가는 없고 수정 시간은 —이다', () => {
  const result = parseInvalidToProductTableRow(invalidProductRow);

  expect(result.updatedPrice).toBeNull();
  expect(result.updateTime).toBe('—');
});

it('상태는 invalid이다', () => {
  const result = parseInvalidToProductTableRow(invalidProductRow);

  expect(result.status).toBe('invalid');
});

it('main이 보낸 메시지를 실패 이유 목록에 그대로 담는다', () => {
  const result = parseInvalidToProductTableRow(invalidProductRow);

  expect(result.errorMessages).toEqual(['productPrice: 에러', 'baseFee: 에러']);
});
