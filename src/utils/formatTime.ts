/**
 * 타임스탬프(ms)를 로컬 시간 기준 HH:mm:ss 문자열로 만든다. 로케일에 따라 결과가 달라지지 않도록 직접 만든다.
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);

  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export default formatTime;
