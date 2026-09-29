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
  const [saleProducts, setSaleProducts] = useState<
    Awaited<ReturnType<typeof window.api.getSaleProducts>>
  >([]);

  const [productRows, setProductRows] = useState<
    Awaited<ReturnType<typeof window.api.getProductRows>>
  >([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleStartButtonClick = async (): Promise<void> => {
    setIsLoading(true);

    const [saleProductResults, productRowResults] = await Promise.all([
      window.api.getSaleProducts(),
      window.api.getProductRows(),
    ]);

    setSaleProducts(saleProductResults);
    setProductRows(productRowResults);
    setIsLoading(false);
  };

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={handleStartButtonClick} isLoading={isLoading} />
        <ProgressBar />
        <div>{saleProducts.length}개 상품</div>
        <div>{productRows.length}개 상품</div>
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
