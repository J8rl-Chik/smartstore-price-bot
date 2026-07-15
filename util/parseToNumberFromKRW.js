import removeComma from './removeComma.js';

// TODO: 0원을 허용 여부 로직 분리를 함수형 FP나 OOP를 참고하여 리팩토링 고려
export default function parseToNumberFromKRW(krwString, { isZeroAllowed = false } = {}) {
  const price = Number(removeComma(krwString).replaceAll('₩', ''));

  if (Number.isNaN(price)) {
    throw new Error(`"${krwString}"을(를) 숫자로 변환할 수 없습니다.`);
  }

  if (!Number.isInteger(price)) {
    throw new Error(`"${krwString}"은(는) 정수여야 합니다.`);
  }

  // 가상 판매처 가격은 0원 이상이어야 합니다.
  if (isZeroAllowed && price < 0) {
    throw new Error(`"${krwString}"은(는) 0 이상이어야 합니다.`);
  }

  if (!isZeroAllowed && price < 1) {
    throw new Error(`"${krwString}"은(는) 0보다 큰 값이어야 합니다.`);
  }

  if (price % 10 !== 0) {
    throw new Error(`"${krwString}"은(는) 10의 배수여야 합니다.`);
  }

  return price;
}
