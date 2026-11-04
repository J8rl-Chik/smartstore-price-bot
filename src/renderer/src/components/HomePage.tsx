import InvalidProductRowBanner from './InvalidProductRowBanner';
import ProductTable from './ProductTable';
import ProgressBar from './ProgressBar';
import RestartCountdown from './RestartCountdown';
import StartButton from './StartButton';
import StartUpdateErrorBanner from './StartUpdateErrorBanner';
import { parseToProductTableRow } from '../domain/parseToProductTableRow';
import type { TargetProductsUpdate } from '../hooks/useTargetProductsUpdate';

interface HomePageProps extends Omit<TargetProductsUpdate, 'startUpdate' | 'stopUpdate'> {
  onStartUpdate: () => void;
  onStopUpdate: () => void;
}

const HomePage = ({
  targetProducts,
  invalidProductRows,
  isPreparing,
  isRunning,
  currentProduct,
  currentOrder,
  errorMessage,
  nextRunAt,
  onStartUpdate,
  onStopUpdate,
}: HomePageProps): React.JSX.Element => {
  // main은 준비부터 순회가 끝날 때까지, 그리고 재실행을 기다리는 동안 새 시작을 막으므로 같은 구간에 시작을 막는다.
  const isUpdateBlocked = isPreparing || isRunning || nextRunAt !== null;

  return (
    <>
      <StartButton onClick={onStartUpdate} isDisabled={isUpdateBlocked} />
      {/* 재실행 시각이 바뀌면 남은 시간을 새로 계산하도록 key로 다시 마운트한다. */}
      {nextRunAt !== null && (
        <RestartCountdown key={nextRunAt} nextRunAt={nextRunAt} onStopUpdate={onStopUpdate} />
      )}
      {errorMessage !== null && <StartUpdateErrorBanner message={errorMessage} />}
      {invalidProductRows.length > 0 && <InvalidProductRowBanner rows={invalidProductRows} />}
      <ProgressBar
        totalCount={targetProducts.length}
        currentOrder={currentOrder}
        productName={currentProduct?.name}
      />
      <ProductTable products={targetProducts.map(parseToProductTableRow)} />
    </>
  );
};

export default HomePage;
