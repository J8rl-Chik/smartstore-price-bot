import styled from 'styled-components';
import Header from './components/Header';
import HomePage from './components/HomePage';
import StyleProvider from './components/StyleProvider';
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

  return (
    <StyleProvider>
      <AppContainer>
        {/* TODO: currentPage 상태를 추가해 페이지를 전환한다. */}
        <Header currentPage="home" onChangePage={() => undefined} />
        {/* TODO: 사용자 설정 페이지의 순회 간격을 연결한다. 그 전까지는 자동 재실행 없이 한 번만 순회한다. */}
        <HomePage
          {...updateState}
          onStartUpdate={() => void startUpdate(null)}
          onStopUpdate={() => void stopUpdate()}
        />
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
