import type { Page } from 'puppeteer';
import getSellersInPuppeteer from '../integrations/puppeteer/getSellersInPuppeteer';
import updatePrice from '../integrations/smartStore/updatePrice';
import { buildPriceWithDeliveryFee } from '../domain/delivery/buildPriceWithDeliveryFee';
import { addVirtualPrice } from '../domain/price/addVirtualPrice';
import { calculateTargetPrice } from '../domain/price/calculateTargetPrice';
import { filterExcludedSellers } from '../domain/seller/filterExcludedSellers';
import type { TargetProduct, TargetProductUpdate } from '../domain/product/_type';

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
      time: Date.now(),
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
    time: Date.now(),
  };
};

export default updateTargetProductPrice;
