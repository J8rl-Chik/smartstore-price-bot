import styled from 'styled-components';

interface SettingsFieldProps {
  label: string;
  children: React.ReactNode;
}

const SettingsFieldContainer = styled.label`
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.gray700};

  & + & {
    margin-top: 12px;
  }
`;

export const SettingsInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 14px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.gray900};
  background: ${({ theme }) => theme.color.gray50};
  border: 1px solid ${({ theme }) => theme.color.gray200};
  border-radius: 10px;

  &::placeholder {
    color: ${({ theme }) => theme.color.gray400};
  }
`;

// label로 children을 감싸 입력 요소와 이름을 연결한다.
const SettingsField = ({ label, children }: SettingsFieldProps): React.JSX.Element => (
  <SettingsFieldContainer>
    {label}
    {children}
  </SettingsFieldContainer>
);

export default SettingsField;
