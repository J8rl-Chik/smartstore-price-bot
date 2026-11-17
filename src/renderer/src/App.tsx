import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage from './components/HomePage';
import SettingsPage from './components/SettingsPage';
import StyleProvider from './components/StyleProvider';
import type { Page } from './domain/_type';
import hasRequiredSettings from './domain/hasRequiredSettings';
import { readSettings } from './domain/settingsStorage';
import useAutoStart from './hooks/useAutoStart';
import useTargetProductsUpdate from './hooks/useTargetProductsUpdate';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 24px;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const { startUpdate, stopUpdate, ...updateState } = useTargetProductsUpdate();
  // 설정 화면에 가 있어도 예약이 유지되도록 화면을 바꿔도 남아 있는 App에서 쓴다.
  const { autoStartAt, cancelAutoStart } = useAutoStart();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  // 설정 화면에서 저장한 값이 홈으로 돌아올 때 반영되도록 렌더링할 때마다 읽는다.
  const settings = readSettings();

  return (
    <StyleProvider>
      <AppContainer>
        <Header currentPage={currentPage} onChangePage={setCurrentPage} />
        {currentPage === 'home' ? (
          <HomePage
            {...updateState}
            hasSettings={hasRequiredSettings(settings)}
            autoStartAt={autoStartAt}
            // 자동 시작을 기다리는 중에 직접 시작하면 예약을 지워 두 번 시작하지 않게 한다.
            onStartUpdate={() => {
              cancelAutoStart();
              void startUpdate(settings);
            }}
            onStopUpdate={() => void stopUpdate()}
            onCancelAutoStart={cancelAutoStart}
          />
        ) : (
          <SettingsPage />
        )}
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
