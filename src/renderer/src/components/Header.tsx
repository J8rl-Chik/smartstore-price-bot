import styled from 'styled-components';

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

const StartButton = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.white};
  cursor: pointer;
  background: ${({ theme }) => theme.color.blue500};
  border: none;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.color.blue600};
  }
`;

const Header = (): React.JSX.Element => {
  const handleStartButtonClick = async (): Promise<void> => {
    const result = await window.api.ping();
    console.log(result);
  };

  return (
    <HeaderContainer>
      <Title>
        <Logo>S</Logo>
        스마트스토어 최저가 봇
      </Title>
      <StartButton onClick={handleStartButtonClick}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 2l7 4-7 4V2z" fill="white" />
        </svg>
        자동 수정 시작
      </StartButton>
    </HeaderContainer>
  );
};

export default Header;
