import styled from 'styled-components';
import StartButton from './StartButton';

interface HeaderProps {
  onStartButtonClick: () => void;
  isLoading: boolean;
}

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Logo = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.white};
  background: ${({ theme }) => theme.color.blue500};
  border-radius: 10px;
`;

const Title = styled.h1`
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
`;

const Header = ({ onStartButtonClick, isLoading }: HeaderProps): React.JSX.Element => {
  return (
    <HeaderContainer>
      <Title>
        <Logo>S</Logo>
        스마트스토어 최저가 봇
      </Title>
      <StartButton onClick={onStartButtonClick} isLoading={isLoading} />
    </HeaderContainer>
  );
};

export default Header;
