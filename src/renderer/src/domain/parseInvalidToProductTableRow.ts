import type { InvalidProductRow } from '../../../domain/product/_type';
import type { TProductTableRow } from './_type';

/**
 * 변환에 실패한 시트 행을 수정 대상 상품과 같은 표에 보여주도록 TProductTableRow로 만든다.
 * 설정가는 잘못된 시트 값으로 만들 수 없으므로 비우고, 현재가는 이름이 같은 판매 상품의 스토어 값으로 만든다.
 * 가격 수정을 시도하지 않으므로 수정가와 수정 시간은 비우고, 실패 이유는 main이 보낸 메시지를 그대로 담는다.
 */
export const parseInvalidToProductTableRow = ({
  name,
  originProductNo,
  store,
  errorMessages,
}: InvalidProductRow): TProductTableRow => ({
  id: originProductNo,
  name,
  configuredPrice: null,
  currentPrice: { price: store.salePrice, deliveryFee: store.deliveryFee },
  updatedPrice: null,
  status: 'invalid',
  errorMessages,
  updateTime: '—',
});
