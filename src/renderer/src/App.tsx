import styled from 'styled-components';
import Header from './components/Header';
import ProductTable from './components/ProductTable';
import ProgressBar from './components/ProgressBar';
import StartButton from './components/StartButton';
import StartUpdateErrorBanner from './components/StartUpdateErrorBanner';
import StyleProvider from './components/StyleProvider';
import { parseInvalidToProductTableRow } from './domain/parseInvalidToProductTableRow';
import { parseToProductTableRow } from './domain/parseToProductTableRow';
import useTargetProductsUpdate from './hooks/useTargetProductsUpdate';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
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

  // 시트 값이 잘못되어 수정 대상에서 빠진 상품을 먼저 보여줘 시트를 고치도록 한다.
  const productTableRows = [
    ...invalidProductRows.map(parseInvalidToProductTableRow),
    ...targetProducts.map(parseToProductTableRow),
  ];

  return (
    <StyleProvider>
      <AppContainer>
        <Header />
        <StartButton onClick={startUpdate} isPreparing={isPreparing} />
        {startUpdateErrorMessage !== null && (
          <StartUpdateErrorBanner message={startUpdateErrorMessage} />
        )}
        <ProgressBar
          totalCount={targetProducts.length}
          currentOrder={currentOrder}
          productName={currentProduct?.name}
        />
        <ProductTable products={productTableRows} />
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
