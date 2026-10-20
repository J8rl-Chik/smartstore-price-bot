import type { FormattedTime } from './_type';

const padTimeUnit = (value: number): string => String(value).padStart(2, '0');

/**
 * 타임스탬프(ms)를 로컬 시간 기준 HH:mm:ss 문자열로 만든다. 로케일에 따라 결과가 달라지지 않도록 직접 만든다.
 * join은 string을 반환하므로 템플릿 리터럴로 조합해 시:분:초 형태가 타입에 드러나게 한다.
 * 배열 구조 분해는 noUncheckedIndexedAccess로 string | undefined가 되므로 값마다 따로 만든다.
 */
const formatTime = (timestamp: number): FormattedTime => {
  const date = new Date(timestamp);
  const hours = padTimeUnit(date.getHours());
  const minutes = padTimeUnit(date.getMinutes());
  const seconds = padTimeUnit(date.getSeconds());

  return `${hours}:${minutes}:${seconds}`;
};

export default formatTime;
