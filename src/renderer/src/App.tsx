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
    setMatchedSaleProducts(getMatchedSaleProducts(saleProductsResponse, productRowsResponse) ?? []);
    setIsLoading(false);
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
