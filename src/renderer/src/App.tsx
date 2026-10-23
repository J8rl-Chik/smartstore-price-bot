import { useEffect } from 'react';
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
  const {
    targetProducts,
    invalidProductRows,
    isLoading,
    currentProduct,
    currentOrder,
    startUpdate,
  } = useTargetProductsUpdate();

  // TODO: 실패한 시트 행이 renderer까지 오는지 확인하는 임시 로그. 목록 컴포넌트를 연결하면 지운다.
  useEffect(() => {
    console.log('invalidProductRows', invalidProductRows);
  }, [invalidProductRows]);

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartUpdate={startUpdate} isLoading={isLoading} />
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
