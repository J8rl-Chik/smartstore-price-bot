// TODO: formatTime.ts의 padTimeUnit과 같다. 따로 파일로 빼서 함께 쓸지 정한다.
const padTimeUnit = (value: number): string => String(value).padStart(2, '0');

/**
 * 남은 초를 분:초로 만든다. 한 시간 이상 남으면 앞에 시를 붙여 시:분:초로 만든다.
 * 시는 자릿수를 채우지 않는다. 재실행 간격이 하루를 넘지 않아 시가 두 자리로 늘어날 일이 드물기 때문이다.
 */
const formatRemainingTime = (remainingSeconds: number): string => {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = padTimeUnit(Math.floor((remainingSeconds % 3600) / 60));
  const seconds = padTimeUnit(remainingSeconds % 60);

  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

export default formatRemainingTime;
