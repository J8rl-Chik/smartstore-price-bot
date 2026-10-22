import type { Delivery, DeliveryFeeType } from './_type.js';
import { DELIVERY_FEE_TYPE } from './_constant.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

export const createDelivery = ({
  feeType,
  baseFee,
}: {
  feeType: DeliveryFeeType;
  baseFee: number;
}): Delivery => {
  if (feeType === DELIVERY_FEE_TYPE.FREE) {
    return { feeType };
  }

  if (feeType === DELIVERY_FEE_TYPE.PAID) {
    return { feeType, baseFee };
  }

  if (feeType === DELIVERY_FEE_TYPE.UNIT_QUANTITY_PAID) {
    return { feeType, baseFee };
  }

  throw new Error(`${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: ${feeType})`);
};
