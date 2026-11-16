import { expect, it } from 'vitest';
import parseAutoStartDelay, {
  MAX_AUTO_START_DELAY_MINUTES,
  MIN_AUTO_START_DELAY_MINUTES,
} from './parseAutoStartDelay';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';

it('범위 안의 정수이면 분 단위 숫자로 만든다', () => {
  expect(parseAutoStartDelay('5')).toEqual({ isValid: true, autoStartDelayMinutes: 5 });
});

it('앞뒤 공백은 무시한다', () => {
  expect(parseAutoStartDelay(' 5 ')).toEqual({ isValid: true, autoStartDelayMinutes: 5 });
});

it('최솟값과 같으면 받는다', () => {
  expect(parseAutoStartDelay(String(MIN_AUTO_START_DELAY_MINUTES))).toEqual({
    isValid: true,
    autoStartDelayMinutes: MIN_AUTO_START_DELAY_MINUTES,
  });
});

it('최댓값과 같으면 받는다', () => {
  expect(parseAutoStartDelay(String(MAX_AUTO_START_DELAY_MINUTES))).toEqual({
    isValid: true,
    autoStartDelayMinutes: MAX_AUTO_START_DELAY_MINUTES,
  });
});

it('최솟값보다 작으면 범위를 알려주는 실패 이유를 만든다', () => {
  expect(parseAutoStartDelay(String(MIN_AUTO_START_DELAY_MINUTES - 1))).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_OUT_OF_RANGE,
  });
});

it('최댓값보다 크면 범위를 알려주는 실패 이유를 만든다', () => {
  expect(parseAutoStartDelay(String(MAX_AUTO_START_DELAY_MINUTES + 1))).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_OUT_OF_RANGE,
  });
});

it('비어 있으면 0으로 보지 않고 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseAutoStartDelay('')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_NOT_INTEGER,
  });
});

it('공백만 있으면 비어 있는 것으로 본다', () => {
  expect(parseAutoStartDelay('  ')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_NOT_INTEGER,
  });
});

it('소수이면 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseAutoStartDelay('5.5')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_NOT_INTEGER,
  });
});

it('숫자가 아니면 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseAutoStartDelay('abc')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_NOT_INTEGER,
  });
});

it('범위를 벗어났을 때의 실패 이유는 최솟값과 최댓값을 담고 있다', () => {
  expect(ERROR_MESSAGE.AUTO_START_DELAY_OUT_OF_RANGE).toContain(
    `${MIN_AUTO_START_DELAY_MINUTES}분`,
  );
  expect(ERROR_MESSAGE.AUTO_START_DELAY_OUT_OF_RANGE).toContain(
    `${MAX_AUTO_START_DELAY_MINUTES}분`,
  );
});
