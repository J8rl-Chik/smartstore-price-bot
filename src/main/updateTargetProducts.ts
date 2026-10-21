import type { Page } from 'puppeteer';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import delaySeconds from '../utils/delaySeconds';
import updateTargetProductPrice from './updateTargetProductPrice';
import type { TargetProduct, TargetProductUpdate, UpdateState } from '../domain/product/_type';

/**
 * 상품 목록을 순회하며 가격을 수정하고, 상태가 바뀔 때마다 emit으로 상태 전체를 보낸다.
 * 상품 하나의 실패는 그 상품만 error로 반영하고 계속하며,
 * 네이버 쇼핑 접속 제한(UnexpectedCatalogPageError)처럼 다음 상품도 실패할 치명적 실패는 error로 반영한 뒤 중단한다.
 */
const updateTargetProducts = async (
  page: Page,
  targetProducts: TargetProduct[],
  myStoreName: string,
  emit: (state: UpdateState) => void,
): Promise<void> => {
  let state: UpdateState = {
    targetProducts: targetProducts.map((targetProduct) => ({
      ...targetProduct,
      update: { status: 'wait' },
    })),
    currentIndex: null,
    isRunning: true,
  };

  const setState = (nextState: Partial<UpdateState>): void => {
    state = { ...state, ...nextState };
    emit(state);
  };

  const setUpdate = (index: number, update: TargetProductUpdate): void => {
    setState({
      targetProducts: state.targetProducts.map((target, targetIndex) =>
        targetIndex === index ? { ...target, update } : target,
      ),
    });
  };

  emit(state);

  try {
    for (const [index, targetProduct] of targetProducts.entries()) {
      setState({ currentIndex: index });

      try {
        setUpdate(index, await updateTargetProductPrice(page, targetProduct, myStoreName));
      } catch (error) {
        console.error(error);
        setUpdate(index, { status: 'error', time: Date.now() });

        if (error instanceof UnexpectedCatalogPageError) {
          break;
        }
      }

      await delaySeconds(5);
    }
  } finally {
    setState({ currentIndex: null, isRunning: false });
  }
};

export default updateTargetProducts;
