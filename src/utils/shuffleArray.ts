/**
 * Fisher-Yates(Durstenfeld) 알고리즘으로 배열을 무작위로 섞는다. 원본 배열은 변경하지 않는다.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    const swapTarget = shuffled[randomIndex];

    if (current === undefined || swapTarget === undefined) {
      throw new Error('배열 인덱스 범위를 벗어났습니다.');
    }

    shuffled[index] = swapTarget;
    shuffled[randomIndex] = current;
  }

  return shuffled;
};

export default shuffleArray;
