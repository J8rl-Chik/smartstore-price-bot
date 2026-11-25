import type { TargetProductWithUpdate, UpdateState } from '../../../domain/product/_type';

/**
 * 상품은 숫자·문자열·배열로만 이뤄진 데이터라 JSON 문자열로 내용을 비교한다.
 * main이 상품 객체를 매번 같은 순서로 만들어 보내므로 키 순서가 달라 다르게 판단되는 경우는 없다.
 */
const isSameProduct = (
  prevProduct: TargetProductWithUpdate,
  nextProduct: TargetProductWithUpdate,
): boolean => JSON.stringify(prevProduct) === JSON.stringify(nextProduct);

/**
 * IPC로 받은 상태는 main이 보낸 값을 복사한 새 객체라, 바뀌지 않은 상품도 이전과 참조가 다르다.
 * 같은 자리의 이전 상품과 내용이 같으면 이전 객체를 그대로 써서, 참조로 비교하는 memo가 바뀐 상품만 다시 그리게 한다.
 */
const reuseUnchangedProducts = (prevState: UpdateState, nextState: UpdateState): UpdateState => ({
  ...nextState,
  targetProducts: nextState.targetProducts.map((nextProduct, index) => {
    const prevProduct = prevState.targetProducts.at(index);

    return prevProduct !== undefined && isSameProduct(prevProduct, nextProduct)
      ? prevProduct
      : nextProduct;
  }),
});

export default reuseUnchangedProducts;
