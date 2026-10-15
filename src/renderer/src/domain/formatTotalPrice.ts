import type { PriceWithFee } from './_type';

// 제품가에 배송비를 더한 합계를 천 단위 구분 기호와 원 단위로 만든다.
const formatTotalPrice = ({ price, deliveryFee }: PriceWithFee): string =>
  `${(price + deliveryFee).toLocaleString('ko-KR')}원`;

export default formatTotalPrice;
