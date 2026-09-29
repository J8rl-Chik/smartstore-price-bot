import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';
import { getMatchedSaleProducts } from '../../domain/product/getMatchedSaleProducts';
import type { SaleProduct } from '../../domain/product/saleProduct';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const [matchedSaleProducts, setMatchedSaleProducts] = useState<SaleProduct[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleStartButtonClick = async (): Promise<void> => {
    setIsLoading(true);

    const [saleProductsResponse, productRowsResponse] = await Promise.all([
      window.api.getSaleProducts(),
      window.api.getProductRows(),
    ]);

    // TODO: saleProductsResponse, productRowsResponse의 isSuccess가 false인 경우 예외 처리
    const matchedSaleProductsResult =
      getMatchedSaleProducts(saleProductsResponse, productRowsResponse) ?? [];

    setIsLoading(false);
    setMatchedSaleProducts(matchedSaleProductsResult);

    if (matchedSaleProductsResult.length === 0) {
      return;
    }

    await window.api.createLoginPage();

    // TODO: 개발 중 확인용으로 첫 번째 상품만 처리하도록 제한해둠. 추후 slice(0, 1) 제거 필요.
    for (const saleProduct of matchedSaleProductsResult.slice(0, 1)) {
      // TODO: updatePrice는 main 프로세스 전용 함수라 여기서 직접 호출 불가. IPC로 노출한 뒤 교체 필요.
      const updatedSaleProduct = saleProduct;

      setMatchedSaleProducts((prev) =>
        prev.map((product) => (product === saleProduct ? updatedSaleProduct : product)),
      );
    }
  };

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={handleStartButtonClick} isLoading={isLoading} />
        <ProgressBar />
        <div>{matchedSaleProducts.length}개 매칭된 상품</div>
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
