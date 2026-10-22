import type { DeliveryFeeType } from './_type.js';
import { DELIVERY_FEE_TYPE } from './_constant.js';

export const validateFeeType = (feeType: string): DeliveryFeeType => {
  if (!(Object.values(DELIVERY_FEE_TYPE) as string[]).includes(feeType)) {
    throw new Error('알 수 없는 배송비 유형입니다.');
  }

  return feeType as DeliveryFeeType;
};
