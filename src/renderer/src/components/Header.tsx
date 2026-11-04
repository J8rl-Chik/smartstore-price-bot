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

const Navigation = styled.nav`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NavigationButton = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.gray600};
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 10px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.color.gray200};
  }

  &[aria-current='page'] {
    font-weight: 700;
    color: ${({ theme }) => theme.color.blue600};
    background: ${({ theme }) => theme.color.blue50};
  }
`;

const NavigationIcon = styled.svg`
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const Header = (): React.JSX.Element => {
  return (
    <HeaderContainer>
      <Title>
        <Logo>S</Logo>
        스마트스토어 최저가 봇
      </Title>
      <Navigation>
        {/* TODO: 사용자 설정 페이지를 만들면 현재 페이지 상태와 클릭 동작을 연결한다. */}
        <NavigationButton type="button" aria-current="page">
          <NavigationIcon viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </NavigationIcon>
          홈
        </NavigationButton>
        <NavigationButton type="button">
          <NavigationIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </NavigationIcon>
          사용자 설정
        </NavigationButton>
      </Navigation>
    </HeaderContainer>
  );
};

export default Header;
