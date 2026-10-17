import type { Page } from 'puppeteer';
import updateTargetProduct from './updateTargetProduct';
import delaySeconds from '../utils/delaySeconds';
import type {
  TargetProduct,
  TargetProductWithUpdate,
  UpdateState,
  UpdateTargetProductResult,
} from '../domain/product/_type';

const buildUpdatedTargetProduct = (
  targetProduct: TargetProductWithUpdate,
  result: UpdateTargetProductResult,
): TargetProductWithUpdate => ({
  ...targetProduct,
  update:
    result.status === 'error'
      ? { status: 'error', updatedAt: Date.now() }
      : {
          status: 'complete',
          // skipped(가격 유지)는 변경이 없었다는 뜻이라 현재 스토어 값을 그대로 담는다.
          price: result.status === 'updated' ? result.salePrice : targetProduct.store.salePrice,
          baseFee: result.status === 'updated' ? result.baseFee : targetProduct.store.deliveryFee,
          updatedAt: Date.now(),
        },
});

/**
 * 상품 목록을 순회하며 상품마다 updateTargetProduct를 실행하고, 상태가 바뀔 때마다 emit으로 전체 상태(UpdateState)를 알린다.
 * renderer는 받은 상태를 그대로 반영하기만 하면 되고 순회 로직은 알 필요가 없다.
 * isFatal한 실패(치명적 실패)는 순회를 중단하고, 그 외 실패는 해당 상품만 error로 반영한 뒤 계속한다.
 */
const updateTargetProducts = async (
  page: Page,
  targetProducts: TargetProduct[],
  myStoreName: string,
  emit: (state: UpdateState) => void,
): Promise<void> => {
  const waitingTargetProducts: TargetProductWithUpdate[] = targetProducts.map((targetProduct) => ({
    ...targetProduct,
    update: { status: 'wait' },
  }));

  let state: UpdateState = {
    targetProducts: waitingTargetProducts,
    currentIndex: null,
    isRunning: true,
  };

  emit(state);

  try {
    for (const [index, targetProduct] of waitingTargetProducts.entries()) {
      state = { ...state, currentIndex: index };
      emit(state);

      const result = await updateTargetProduct(page, targetProduct, myStoreName);

      if (result.status === 'error' && result.isFatal) {
        break;
      }

      const updatedTargetProduct = buildUpdatedTargetProduct(targetProduct, result);

      state = {
        ...state,
        targetProducts: state.targetProducts.map((target) =>
          target.originProductNo === updatedTargetProduct.originProductNo
            ? updatedTargetProduct
            : target,
        ),
      };
      emit(state);

      await delaySeconds(5);
    }
  } finally {
    state = { ...state, currentIndex: null, isRunning: false };
    emit(state);
  }
};

export default updateTargetProducts;
