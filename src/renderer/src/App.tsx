import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';
import type { TargetProduct } from '../../domain/product/_type';
import delaySeconds from '../../utils/delaySeconds';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const [targetProducts, setTargetProducts] = useState<TargetProduct[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // 가격 수정 중인 상품의 targetProducts 인덱스. 수정 중이 아니면 null.
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const handleStartButtonClick = async (): Promise<void> => {
    setIsLoading(true);

    const response = await window.api.getTargetProducts();

    // TODO: response의 isSuccess가 false인 경우 예외 처리
    const targetProductsResult = response.isSuccess ? response.targetProducts : [];

    setIsLoading(false);
    setTargetProducts(targetProductsResult);

    console.log(targetProductsResult);

    if (targetProductsResult.length === 0) {
      return;
    }

    await window.api.createLoginPage();

    try {
      for (const [index, targetProduct] of targetProductsResult.entries()) {
        setCurrentIndex(index);

        // TODO: updatePrice는 main 프로세스 전용 함수라 여기서 직접 호출 불가. IPC로 노출한 뒤 교체 필요.
        const updatedTargetProduct = targetProduct;

        const sellersResponse = await window.api.getSellers(
          targetProduct.catalogURL,
          targetProduct.name,
        );

        // TODO: 임시 조치. 실패하면 순회를 중단한다. 브라우저 종료 같은 치명적인 실패와 개별 상품의 일시적 실패를 구분해 처리해야 한다.
        if (!sellersResponse.isSuccess) {
          break;
        }

        setTargetProducts((prev) =>
          prev.map((target) => (target === targetProduct ? updatedTargetProduct : target)),
        );

        await delaySeconds(5);
      }
    } finally {
      setCurrentIndex(null);
    }
  };

  // 진행 상태는 별도 state로 두지 않고 targetProducts와 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={handleStartButtonClick} isLoading={isLoading} />
        <ProgressBar
          totalCount={targetProducts.length}
          currentOrder={currentOrder}
          productName={currentProduct?.name}
        />
        <div>{targetProducts.length}개 매칭된 상품</div>
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
