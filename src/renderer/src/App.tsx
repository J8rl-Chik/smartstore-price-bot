import styled from 'styled-components';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

const App = (): React.JSX.Element => {
  return (
    <StyleProvider>
      <AppContainer>
        <Header />
        <ProgressBar />
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
