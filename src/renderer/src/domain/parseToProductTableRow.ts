import formatTime from './formatTime';
import { DELIVERY_FEE_TYPE } from '../../../domain/delivery/_constant';
import type { TargetProductWithUpdate } from '../../../domain/product/_type';
import type { TProductTableRow } from './_type';

/**
 * 설정가는 시트 값, 현재가는 스토어 값, 수정가는 가격 수정 결과로 만든다. 가격은 배송비를 제외한 값 그대로 담는다.
 * 설정가는 무료배송이면 무료배송 기준가와 배송비 0을, 유료이면 제품가와 기본 배송비를 담는다.
 * 수정가는 수정에 성공(complete)했을 때만 있고, 수정 시간은 수정을 시도하기 전(wait)에는 없다.
 * 실패 이유는 수정에 실패(error)했을 때만 main이 보낸 메시지를 그대로 담는다.
 */
export const parseToProductTableRow = ({
  originProductNo,
  name,
  store,
  sheet,
  update,
}: TargetProductWithUpdate): TProductTableRow => {
  const configuredPrice =
    sheet.delivery.feeType === DELIVERY_FEE_TYPE.FREE
      ? { price: sheet.freeDeliveryPrice, deliveryFee: 0 }
      : { price: sheet.productPrice, deliveryFee: sheet.delivery.baseFee };
  const currentPrice = { price: store.salePrice, deliveryFee: store.deliveryFee };

  switch (update.status) {
    case 'wait':
      return {
        id: originProductNo,
        name,
        configuredPrice,
        currentPrice,
        updatedPrice: null,
        status: 'wait',
        errorMessage: null,
        updateTime: '—',
      };
    case 'complete':
      return {
        id: originProductNo,
        name,
        configuredPrice,
        currentPrice,
        updatedPrice: { price: update.price, deliveryFee: update.baseFee },
        status: 'complete',
        errorMessage: null,
        updateTime: formatTime(update.time),
      };
    case 'error':
      return {
        id: originProductNo,
        name,
        configuredPrice,
        currentPrice,
        updatedPrice: null,
        status: 'error',
        errorMessage: update.message,
        updateTime: formatTime(update.time),
      };
  }
};
