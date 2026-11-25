import InvalidProductRowBanner from './InvalidProductRowBanner';
import ProductTable from './ProductTable';
import ProgressBar from './ProgressBar';
import RestartCountdown from './RestartCountdown';
import StartButton from './StartButton';
import StartUpdateErrorBanner from './StartUpdateErrorBanner';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import type { TargetProductsUpdate } from '../hooks/useTargetProductsUpdate';

interface HomePageProps extends Omit<TargetProductsUpdate, 'startUpdate' | 'stopUpdate'> {
  // 사용자 설정의 필수 값이 모두 있는지. 없으면 시작을 막고 안내한다.
  hasSettings: boolean;
  // Windows 시작 프로그램으로 켜져 자동 시작을 예약한 시각(Date.now() 기준 ms). 예약이 없으면 null
  autoStartAt: number | null;
  onStartUpdate: () => void;
  onStopUpdate: () => void;
  onCancelAutoStart: () => void;
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
  hasSettings,
  autoStartAt,
  onStartUpdate,
  onStopUpdate,
  onCancelAutoStart,
}: HomePageProps): React.JSX.Element => {
  // main은 준비부터 순회가 끝날 때까지, 그리고 재실행을 기다리는 동안 새 시작을 막으므로 같은 구간에 시작을 막는다.
  const isUpdateBlocked = isPreparing || isRunning || nextRunAt !== null;

  return (
    <>
      <StartButton onClick={onStartUpdate} isDisabled={isUpdateBlocked || !hasSettings} />
      {!hasSettings && <StartUpdateErrorBanner message={ERROR_MESSAGE.SETTINGS_REQUIRED} />}
      {/* 자동 시작 대기도 재실행 대기와 같은 모양으로 남은 시간과 중지 버튼을 보여준다. */}
      {autoStartAt !== null && (
        <RestartCountdown
          key={autoStartAt}
          nextRunAt={autoStartAt}
          onStopUpdate={onCancelAutoStart}
        />
      )}
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
        isPreparing={isPreparing}
      />
      <ProductTable
        targetProducts={targetProducts}
        currentProductId={currentProduct?.originProductNo ?? null}
        isPreparing={isPreparing}
      />
    </>
  );
};

export default HomePage;
