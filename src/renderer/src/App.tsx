import styled from 'styled-components';
import Header from './components/Header';
import InvalidProductRowBanner from './components/InvalidProductRowBanner';
import ProductTable from './components/ProductTable';
import ProgressBar from './components/ProgressBar';
import StartButton from './components/StartButton';
import StartUpdateErrorBanner from './components/StartUpdateErrorBanner';
import StyleProvider from './components/StyleProvider';
import { parseToProductTableRow } from './domain/parseToProductTableRow';
import useTargetProductsUpdate from './hooks/useTargetProductsUpdate';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const {
    targetProducts,
    invalidProductRows,
    isPreparing,
    currentProduct,
    currentOrder,
    startUpdateErrorMessage,
    startUpdate,
  } = useTargetProductsUpdate();

  return (
    <StyleProvider>
      <AppContainer>
        <Header />
        <StartButton onClick={startUpdate} isPreparing={isPreparing} />
        {startUpdateErrorMessage !== null && (
          <StartUpdateErrorBanner message={startUpdateErrorMessage} />
        )}
        {invalidProductRows.length > 0 && <InvalidProductRowBanner rows={invalidProductRows} />}
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
