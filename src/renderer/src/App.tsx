import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const [saleProductsResponse, setSaleProductsResponse] = useState<Awaited<
    ReturnType<typeof window.api.getSaleProducts>
  > | null>(null);

  const [productRowsResponse, setProductRowsResponse] = useState<Awaited<
    ReturnType<typeof window.api.getProductRows>
  > | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleStartButtonClick = async (): Promise<void> => {
    setIsLoading(true);

    const [saleProductResults, productRowResults] = await Promise.all([
      window.api.getSaleProducts(),
      window.api.getProductRows(),
    ]);

    setSaleProductsResponse(saleProductResults);
    setProductRowsResponse(productRowResults);
    setIsLoading(false);
  };

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={handleStartButtonClick} isLoading={isLoading} />
        <ProgressBar />
        <div>{saleProductsResponse ? saleProductsResponse.isSuccess : '에러'}개 상품</div>
        <div>{productRowsResponse ? productRowsResponse.isSuccess : '에러'}개 상품</div>
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
