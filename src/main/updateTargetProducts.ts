import type { Page } from 'puppeteer';
import getSellersInPuppeteer from '../integrations/puppeteer/getSellersInPuppeteer';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import updatePrice from '../integrations/smartStore/updatePrice';
import { buildPriceWithDeliveryFee } from '../domain/delivery/delivery';
import { addVirtualPrice } from '../domain/price/addVirtualPrice';
import { calculateTargetPrice } from '../domain/price/price';
import { filterExcludedSellers } from '../domain/seller/filterExcludedSellers';
import delaySeconds from '../utils/delaySeconds';
import type { TargetProduct, TargetProductUpdate, UpdateState } from '../domain/product/_type';

// 판매처 조회부터 가격 수정까지 상품 하나를 처리하고, 수정 결과를 complete 상태로 반환한다.
const updateTargetProductPrice = async (
  page: Page,
  targetProduct: TargetProduct,
  myStoreName: string,
): Promise<TargetProductUpdate> => {
  const sellers = await getSellersInPuppeteer(
    page,
    targetProduct.sheet.catalogURL,
    targetProduct.name,
  );

  if (sellers.length === 0) {
    throw new Error(`${targetProduct.name}: 가격 목록이 없습니다.`);
  }

  const filteredSellers = filterExcludedSellers(sellers, [
    ...targetProduct.sheet.excludedSellerNames,
    myStoreName,
  ]);

  const prices = addVirtualPrice(
    filteredSellers.map(({ price }) => price),
    targetProduct.sheet.virtualPrice,
  );

  const targetPrice = calculateTargetPrice(prices, targetProduct.sheet.freeDeliveryPrice);
  const { deliveryFee, salePrice } = buildPriceWithDeliveryFee(
    targetProduct.sheet.delivery,
    targetPrice,
  );

  // 실제 상품을 건드리지 않고 돌려볼 수 있도록, DRY_RUN이면 수정 요청을 보내지 않고 계산한 값을 수정 결과처럼 반환한다.
  if (process.env.DRY_RUN === 'true') {
    console.log(
      `[DRY_RUN] ${targetProduct.originProductNo}번 상품의 가격 수정을 건너뜁니다. (판매가 ${salePrice})`,
    );

    return {
      status: 'complete',
      price: salePrice,
      baseFee: 'baseFee' in deliveryFee ? deliveryFee.baseFee : 0,
      updatedAt: Date.now(),
    };
  }

  const result = await updatePrice({
    productNo: targetProduct.originProductNo,
    deliveryFee,
    salePrice,
  });

  return {
    status: 'complete',
    price: result.salePrice,
    baseFee: result.deliveryInfo.deliveryFee.baseFee,
    updatedAt: Date.now(),
  };
};

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
        setUpdate(index, { status: 'error', updatedAt: Date.now() });

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
