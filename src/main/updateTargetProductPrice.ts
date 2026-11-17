import type { Page } from 'puppeteer';
import getSellersInPuppeteer from '../integrations/puppeteer/getSellersInPuppeteer';
import updatePrice from '../integrations/smartStore/updatePrice';
import { buildPriceWithDeliveryFee } from '../domain/delivery/buildPriceWithDeliveryFee';
import { addVirtualPrice } from '../domain/price/addVirtualPrice';
import { calculateTargetPrice } from '../domain/price/calculateTargetPrice';
import { filterExcludedSellers } from '../domain/seller/filterExcludedSellers';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import type { TargetProduct, TargetProductUpdate } from '../domain/product/_type';
import type { CommerceApiCredentials } from '../domain/settings/_type';

// 판매처 조회부터 가격 수정까지 상품 하나를 처리하고, 수정 결과를 complete 상태로 반환한다.
const updateTargetProductPrice = async (
  page: Page,
  targetProduct: TargetProduct,
  myStoreName: string,
  commerceApiCredentials: CommerceApiCredentials,
  isDryRun: boolean,
): Promise<TargetProductUpdate> => {
  const sellers = await getSellersInPuppeteer(
    page,
    targetProduct.sheet.catalogURL,
    targetProduct.name,
  );

  if (sellers.length === 0) {
    throw new Error(`${ERROR_MESSAGE.SELLERS_EMPTY} (name: ${targetProduct.name})`);
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
  // 무료 배송은 배송비 속성이 없어 0으로 본다.
  const baseFee = 'baseFee' in deliveryFee ? deliveryFee.baseFee : 0;

  // 실제 상품을 건드리지 않고 돌려볼 수 있도록, 테스트 모드이면 수정 요청을 보내지 않고 계산한 값을 수정 결과처럼 반환한다.
  if (isDryRun) {
    console.log(
      `[테스트 모드] ${targetProduct.originProductNo}번 상품의 가격 수정을 건너뜁니다. (판매가 ${salePrice})`,
    );

    return {
      status: 'complete',
      price: salePrice,
      baseFee,
      time: Date.now(),
    };
  }

  /**
   * 커머스 API 요청 수를 줄이도록, 계산한 판매가와 배송비가 순회를 시작할 때 받아 온 스토어의 값과 같으면 수정 요청을 보내지 않는다.
   * 스토어 값에는 배송비 유형이 없어 금액만 비교한다.
   */
  if (targetProduct.store.salePrice === salePrice && targetProduct.store.deliveryFee === baseFee) {
    return { status: 'complete', price: salePrice, baseFee, time: Date.now() };
  }

  const result = await updatePrice({
    commerceApiCredentials,
    productNo: targetProduct.originProductNo,
    deliveryFee,
    salePrice,
  });

  return {
    status: 'complete',
    price: result.salePrice,
    baseFee: result.deliveryInfo.deliveryFee.baseFee,
    time: Date.now(),
  };
};

export default updateTargetProductPrice;
