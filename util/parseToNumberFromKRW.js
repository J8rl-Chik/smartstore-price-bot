import removeComma from './removeComma.js';

export default function parseToNumberFromKRW(krwString) {
  const price = Number(removeComma(krwString).replaceAll('₩', ''));

  if (Number.isNaN(price)) {
    throw new Error(`"${krwString}"을(를) 숫자로 변환할 수 없습니다.`);
  }

  if (!Number.isInteger(price)) {
    throw new Error(`"${krwString}"은(는) 정수여야 합니다.`);
  }

  if (price < 1) {
    throw new Error(`"${krwString}"은(는) 0보다 큰 값이어야 합니다.`);
  }

  if (price % 10 !== 0) {
    throw new Error(`"${krwString}"은(는) 10의 배수여야 합니다.`);
  }

  return price;
}
