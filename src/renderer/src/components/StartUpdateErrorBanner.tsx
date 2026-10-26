import styled from 'styled-components';

interface StartUpdateErrorBannerProps {
  // 목록 조회·로그인처럼 순회를 시작하기 전에 실패한 이유
  message: string;
}

const StartUpdateErrorBannerContainer = styled.div`
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.red600};
  background: ${({ theme }) => theme.color.red50};
  border: 1px solid ${({ theme }) => theme.color.red100};
  border-radius: 10px;
`;

const StartUpdateErrorBanner = ({ message }: StartUpdateErrorBannerProps): React.JSX.Element => (
  <StartUpdateErrorBannerContainer role="alert">{message}</StartUpdateErrorBannerContainer>
);

export default StartUpdateErrorBanner;
