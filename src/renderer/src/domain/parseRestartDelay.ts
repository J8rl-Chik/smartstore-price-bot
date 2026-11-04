import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import type { ParsedRestartDelay } from './_type';

// 재실행 간격의 최솟값(분). 순회가 너무 자주 돌면 네이버 쇼핑 접속 제한에 걸리므로 그 아래로는 받지 않는다.
export const MIN_RESTART_DELAY_MINUTES = 10;

/**
 * 재실행 간격 입력을 검사한다. 비워 두면 자동 재실행 없이 한 번만 순회한다.
 * TODO: 사용자 설정 페이지의 순회 간격 입력에 연결한다. 지금은 화면에서 쓰는 곳이 없다.
 */
const parseRestartDelay = (input: string): ParsedRestartDelay => {
  const trimmedInput = input.trim();

  if (trimmedInput === '') {
    return { isValid: true, restartDelayMinutes: null };
  }

  const restartDelayMinutes = Number(trimmedInput);

  if (!Number.isInteger(restartDelayMinutes)) {
    return { isValid: false, errorMessage: ERROR_MESSAGE.RESTART_DELAY_NOT_INTEGER };
  }

  if (restartDelayMinutes < MIN_RESTART_DELAY_MINUTES) {
    return { isValid: false, errorMessage: ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT };
  }

  return { isValid: true, restartDelayMinutes };
};

export default parseRestartDelay;
