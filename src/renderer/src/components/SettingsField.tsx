import styled from 'styled-components';

interface SettingsFieldProps {
  label: string;
  // 입력 검사 실패 이유. 없으면 표시하지 않는다.
  errorMessage?: string | null;
  children: React.ReactNode;
}

const SettingsFieldContainer = styled.label`
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 6px 16px;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.gray700};

  & + & {
    margin-top: 12px;
  }
`;

// 입력 요소 아래에 맞춰 두 번째 열에 둔다.
const FieldErrorMessage = styled.span`
  grid-column: 2;
  font-size: 12px;
  color: ${({ theme }) => theme.color.red600};
`;

// label로 children을 감싸 입력 요소와 이름을 연결한다.
const SettingsField = ({
  label,
  errorMessage,
  children,
}: SettingsFieldProps): React.JSX.Element => (
  <SettingsFieldContainer>
    {label}
    {children}
    {errorMessage && <FieldErrorMessage>{errorMessage}</FieldErrorMessage>}
  </SettingsFieldContainer>
);

export default SettingsField;
