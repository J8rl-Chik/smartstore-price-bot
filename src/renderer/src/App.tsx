import styled from 'styled-components';
import Header from './components/Header';
import ProductTable from './components/ProductTable';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';
import { parseToProductTableRow } from './domain/parseToProductTableRow';
import useTargetProductsUpdate from './hooks/useTargetProductsUpdate';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const { targetProducts, isLoading, currentProduct, currentOrder, startUpdate } =
    useTargetProductsUpdate();

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={startUpdate} isLoading={isLoading} />
        <ProgressBar
          totalCount={targetProducts.length}
          currentOrder={currentOrder}
          productName={currentProduct?.name}
        />
        <ProductTable products={targetProducts.map(parseToProductTableRow)} />
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
