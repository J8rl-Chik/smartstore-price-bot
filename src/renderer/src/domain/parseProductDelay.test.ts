import { expect, it } from 'vitest';
import parseProductDelay, { MIN_PRODUCT_DELAY_SECONDS } from './parseProductDelay';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';

it('최솟값 이상의 정수이면 초 단위 숫자로 만든다', () => {
  expect(parseProductDelay('30')).toEqual({ isValid: true, productDelaySeconds: 30 });
});

it('최솟값과 같으면 받는다', () => {
  expect(parseProductDelay(String(MIN_PRODUCT_DELAY_SECONDS))).toEqual({
    isValid: true,
    productDelaySeconds: MIN_PRODUCT_DELAY_SECONDS,
  });
});

it('앞뒤 공백을 무시한다', () => {
  expect(parseProductDelay(' 30 ')).toEqual({ isValid: true, productDelaySeconds: 30 });
});

it('최솟값보다 작으면 최솟값을 알려주는 실패 이유를 만든다', () => {
  expect(parseProductDelay(String(MIN_PRODUCT_DELAY_SECONDS - 1))).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.PRODUCT_DELAY_TOO_SHORT,
  });
});

it('비어 있으면 최솟값보다 작은 입력으로 처리한다', () => {
  expect(parseProductDelay('')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.PRODUCT_DELAY_TOO_SHORT,
  });
});

it('소수이면 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseProductDelay('10.5')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.PRODUCT_DELAY_NOT_INTEGER,
  });
});

it('숫자가 아니면 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseProductDelay('abc')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.PRODUCT_DELAY_NOT_INTEGER,
  });
});
