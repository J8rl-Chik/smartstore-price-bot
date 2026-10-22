import { expect, it } from 'vitest';
import { validateFeeType } from './validateFeeType.js';

it('feeType이 무료면 "무료"를 반환한다.', () => {
  const freeFee = '무료';

  expect(validateFeeType(freeFee)).toBe(freeFee);
});

it('feeType이 유료면 "유료"를 반환한다.', () => {
  const paidFee = '유료';

  expect(validateFeeType(paidFee)).toBe(paidFee);
});

it('feeType이 수량별이면 "수량별"을 반환한다.', () => {
  const unitQuantityPaidFee = '수량별';

  expect(validateFeeType(unitQuantityPaidFee)).toBe(unitQuantityPaidFee);
});

it('알 수 없는 feeType는 에러를 던진다.', () => {
  const unknownFee = '착불';

  expect(() => validateFeeType(unknownFee)).toThrow('알 수 없는 배송비 유형입니다.');
});
