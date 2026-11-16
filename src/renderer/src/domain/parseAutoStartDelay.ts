import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import type { ParsedAutoStartDelay } from './_type';

// 0분이면 시작 프로그램으로 켜지자마자 가격 수정을 시작한다.
export const MIN_AUTO_START_DELAY_MINUTES = 0;

// 너무 길면 재부팅된 뒤 한참 동안 가격 수정이 멈춰 있으므로 60분까지만 받는다.
export const MAX_AUTO_START_DELAY_MINUTES = 60;

/**
 * 자동 실행 후 시작 대기 시간 입력을 검사한다.
 * 0분이 "바로 시작"이라는 뜻이라, 비워 두면 0으로 보지 않고 정수로 입력하라는 실패 이유를 만든다.
 */
const parseAutoStartDelay = (input: string): ParsedAutoStartDelay => {
  const trimmedInput = input.trim();
  const autoStartDelayMinutes = Number(trimmedInput);

  if (trimmedInput === '' || !Number.isInteger(autoStartDelayMinutes)) {
    return { isValid: false, errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_NOT_INTEGER };
  }

  if (
    autoStartDelayMinutes < MIN_AUTO_START_DELAY_MINUTES ||
    autoStartDelayMinutes > MAX_AUTO_START_DELAY_MINUTES
  ) {
    return { isValid: false, errorMessage: ERROR_MESSAGE.AUTO_START_DELAY_OUT_OF_RANGE };
  }

  return { isValid: true, autoStartDelayMinutes };
};

export default parseAutoStartDelay;
