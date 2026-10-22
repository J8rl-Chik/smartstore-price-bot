import type { DeliveryFeeType } from './_type.js';
import { DELIVERY_FEE_TYPE } from './_constant.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

export const validateFeeType = (feeType: string): DeliveryFeeType => {
  if (!(Object.values(DELIVERY_FEE_TYPE) as string[]).includes(feeType)) {
    throw new Error(`${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: ${feeType})`);
  }

  return feeType as DeliveryFeeType;
};
