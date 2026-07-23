const parseToNumberFromKRW = (krw: string): number => {
  const price = Number(krw.replaceAll(',', '').replaceAll('₩', ''));

  if (Number.isNaN(price)) {
    throw new Error('숫자로 변환할 수 없습니다.');
  }

  if (!Number.isInteger(price)) {
    throw new Error('정수여야 합니다.');
  }

  if (price <= 0) {
    throw new Error('0보다 큰 값이어야 합니다.');
  }

  /**
   * 스마트스토어는 10원 단위로만 가격을 설정할 수 있지만, 외부 판매처는 1원 단위로
   * 가격을 설정할 수 있어 10원 단위로 올림해 맞춘다.
   */
  return Math.ceil(price / 10) * 10;
};

export default parseToNumberFromKRW;
