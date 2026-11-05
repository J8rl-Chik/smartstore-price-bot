import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage from './components/HomePage';
import SettingsPage from './components/SettingsPage';
import StyleProvider from './components/StyleProvider';
import type { Page } from './domain/_type';
import hasRequiredSettings from './domain/hasRequiredSettings';
import { readSettings } from './domain/settingsStorage';
import useTargetProductsUpdate from './hooks/useTargetProductsUpdate';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  const { startUpdate, stopUpdate, ...updateState } = useTargetProductsUpdate();
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
            onStartUpdate={() => void startUpdate(settings)}
            onStopUpdate={() => void stopUpdate()}
          />
        ) : (
          <SettingsPage />
        )}
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
