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
    isRunning,
    currentProduct,
    currentOrder,
    errorMessage,
    startUpdate,
  } = useTargetProductsUpdate();

  return (
    <StyleProvider>
      <AppContainer>
        <Header />
        {/* main은 준비부터 순회가 끝날 때까지 새 시작을 막으므로, 버튼도 같은 구간에 비활성화한다. */}
        <StartButton onClick={startUpdate} isDisabled={isPreparing || isRunning} />
        {errorMessage !== null && <StartUpdateErrorBanner message={errorMessage} />}
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
