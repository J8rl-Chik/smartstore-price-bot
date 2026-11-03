import { expect, it } from 'vitest';
import parseRestartDelay, { MIN_RESTART_DELAY_MINUTES } from './parseRestartDelay';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';

it('비어 있으면 자동 재실행 없이 한 번만 순회하도록 null로 만든다', () => {
  expect(parseRestartDelay('')).toEqual({ isValid: true, restartDelayMinutes: null });
});

it('공백만 있으면 비어 있는 것으로 본다', () => {
  expect(parseRestartDelay('  ')).toEqual({ isValid: true, restartDelayMinutes: null });
});

it('최솟값 이상의 정수이면 분 단위 숫자로 만든다', () => {
  expect(parseRestartDelay('30')).toEqual({ isValid: true, restartDelayMinutes: 30 });
});

it('최솟값과 같으면 받는다', () => {
  expect(parseRestartDelay(String(MIN_RESTART_DELAY_MINUTES))).toEqual({
    isValid: true,
    restartDelayMinutes: MIN_RESTART_DELAY_MINUTES,
  });
});

it('최솟값보다 작으면 최솟값을 알려주는 실패 이유를 만든다', () => {
  expect(parseRestartDelay(String(MIN_RESTART_DELAY_MINUTES - 1))).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT,
  });
});

it('소수이면 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseRestartDelay('10.5')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.RESTART_DELAY_NOT_INTEGER,
  });
});

it('숫자가 아니면 정수로 입력하라는 실패 이유를 만든다', () => {
  expect(parseRestartDelay('abc')).toEqual({
    isValid: false,
    errorMessage: ERROR_MESSAGE.RESTART_DELAY_NOT_INTEGER,
  });
});

it('최솟값보다 작을 때의 실패 이유는 최솟값을 담고 있다', () => {
  expect(ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT).toContain(`${MIN_RESTART_DELAY_MINUTES}분`);
});
