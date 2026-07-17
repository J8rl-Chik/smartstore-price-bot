import removeComma from '../util/removeComma.js';

const parseToNumberFromKRW = (krw: string): number => {
  const price = Number(removeComma(krw).replaceAll('₩', ''));

  if (Number.isNaN(price)) {
    throw new Error(`"${krw}"을(를) 숫자로 변환할 수 없습니다.`);
  }

  if (!Number.isInteger(price)) {
    throw new Error(`"${krw}"은(는) 정수여야 합니다.`);
  }

  if (!(0 < price && price % 10 === 0)) {
    throw new Error(`"${krw}"은(는) 0이 아닌 10 단위의 값이어야 합니다.`);
  }

  return price;
};

export default parseToNumberFromKRW;
