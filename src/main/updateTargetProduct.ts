import type { Page } from 'puppeteer';
import getSellersInPuppeteer from '../integrations/puppeteer/getSellersInPuppeteer';
import updatePrice from '../integrations/smartStore/updatePrice';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import { filterExcludedSellers } from '../domain/seller/filterExcludedSellers';
import { addVirtualPrice } from '../domain/price/addVirtualPrice';
import { calculateTargetPrice, isPriceUpdateRequired } from '../domain/price/price';
import { buildPriceWithDeliveryFee } from '../domain/delivery/delivery';
import type { TargetProduct, UpdateTargetProductResult } from '../domain/product/_type';

/**
 * 상품 하나의 가격 수정 파이프라인. 판매처 조회 → 필터링 → 목표 가격 계산 → 수정 필요 여부 확인 → 수정 요청까지 한 번에 처리한다.
 * UnexpectedCatalogPageError(네이버 쇼핑 접속 제한 등 치명적 실패)는 isFatal: true로 알려 호출한 쪽이 순회를 중단할 수 있게 한다.
 */
const updateTargetProduct = async (
  page: Page,
  targetProduct: TargetProduct,
  myStoreName: string,
): Promise<UpdateTargetProductResult> => {
  try {
    const sellers = await getSellersInPuppeteer(
      page,
      targetProduct.sheet.catalogURL,
      targetProduct.name,
    );

    if (sellers.length === 0) {
      return { status: 'skipped' };
    }

    // 가격비교 순위에서 밀려나면 찾지 못할 수 있어, isPriceUpdateRequired는 필터링 전 목록에서 찾은 값으로 판단한다.
    const currentMyStore = sellers.find(({ name }) => name === myStoreName);
    const filteredSellers = filterExcludedSellers(sellers, [
      ...targetProduct.sheet.excludedSellerNames,
      myStoreName,
    ]);
    const prices = addVirtualPrice(
      filteredSellers.map(({ price }) => price),
      targetProduct.sheet.virtualPrice,
    );
    const targetPrice = calculateTargetPrice(prices, targetProduct.sheet.freeDeliveryPrice);

    if (!isPriceUpdateRequired(currentMyStore, targetPrice, targetProduct.sheet.delivery.feeType)) {
      return { status: 'skipped' };
    }

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
        status: 'updated',
        salePrice,
        baseFee: 'baseFee' in deliveryFee ? deliveryFee.baseFee : 0,
      };
    }

    const result = await updatePrice({
      productNo: targetProduct.originProductNo,
      deliveryFee,
      salePrice,
    });

    return {
      status: 'updated',
      salePrice: result.salePrice,
      baseFee: result.deliveryInfo.deliveryFee.baseFee,
    };
  } catch (error) {
    if (error instanceof UnexpectedCatalogPageError) {
      return { status: 'error', error: error.message, isFatal: true };
    }

    console.error(error);

    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      isFatal: false,
    };
  }
};

export default updateTargetProduct;
