import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage from './components/HomePage';
import SettingsPage from './components/SettingsPage';
import StyleProvider from './components/StyleProvider';
import type { Page } from './domain/_type';
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

  return (
    <StyleProvider>
      <AppContainer>
        <Header currentPage={currentPage} onChangePage={setCurrentPage} />
        {/* TODO: 사용자 설정 페이지의 순회 간격을 연결한다. 그 전까지는 자동 재실행 없이 한 번만 순회한다. */}
        {currentPage === 'home' ? (
          <HomePage
            {...updateState}
            onStartUpdate={() => void startUpdate(null)}
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
