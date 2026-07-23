/**
 * 매번 똑같은 간격으로 요청하면 그 자체가 봇 탐지 신호가 될 수 있어, 정해진 범위 안에서
 * 무작위 시간만큼 대기해 사람이 페이지를 넘겨보는 것처럼 요청 간격을 흩뜨린다.
 */
const delayRandomSeconds = (minSeconds: number, maxSeconds: number): Promise<void> => {
  if (minSeconds > maxSeconds) {
    throw new Error('minSeconds는 maxSeconds보다 클 수 없습니다.');
  }

  const randomSeconds = minSeconds + Math.random() * (maxSeconds - minSeconds);

  return new Promise((resolve) => {
    setTimeout(resolve, randomSeconds * 1000);
  });
};

export default delayRandomSeconds;
