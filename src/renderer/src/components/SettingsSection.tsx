import styled from 'styled-components';

interface SettingsSectionProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const SettingsSectionContainer = styled.section`
  padding: 24px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.gray200};
  border-radius: 16px;
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
`;

const Description = styled.p`
  margin: 0 0 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray500};
`;

const SettingsSection = ({
  title,
  description,
  children,
}: SettingsSectionProps): React.JSX.Element => (
  <SettingsSectionContainer>
    <Title>{title}</Title>
    <Description>{description}</Description>
    {children}
  </SettingsSectionContainer>
);

export default SettingsSection;
