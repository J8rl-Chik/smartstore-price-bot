import styled from 'styled-components';

const Title = styled.h2`
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
`;

const SettingsPage = (): React.JSX.Element => {
  return (
    <section>
      <Title>사용자 설정</Title>
    </section>
  );
};

export default SettingsPage;
