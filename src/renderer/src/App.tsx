import styled from 'styled-components';
import Header from './components/Header';
import InvalidProductRowBanner from './components/InvalidProductRowBanner';
import ProductTable from './components/ProductTable';
import ProgressBar from './components/ProgressBar';
import RestartCountdown from './components/RestartCountdown';
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
    nextRunAt,
    startUpdate,
    stopUpdate,
  } = useTargetProductsUpdate();

  // main은 준비부터 순회가 끝날 때까지, 그리고 재실행을 기다리는 동안 새 시작을 막으므로 같은 구간에 시작을 막는다.
  const isUpdateBlocked = isPreparing || isRunning || nextRunAt !== null;

  return (
    <StyleProvider>
      <AppContainer>
        <Header />
        {/* TODO: 사용자 설정 페이지의 순회 간격을 연결한다. 그 전까지는 자동 재실행 없이 한 번만 순회한다. */}
        <StartButton onClick={() => void startUpdate(null)} isDisabled={isUpdateBlocked} />
        {/* 재실행 시각이 바뀌면 남은 시간을 새로 계산하도록 key로 다시 마운트한다. */}
        {nextRunAt !== null && (
          <RestartCountdown key={nextRunAt} nextRunAt={nextRunAt} onStopUpdate={stopUpdate} />
        )}
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
