import styled from 'styled-components';

export type ProductStatus = 'normal' | 'needUpdate' | 'error';

interface StatusBadgeProps {
  status: ProductStatus;
}

const BaseBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 8px;
`;

const NormalBadge = styled(BaseBadge)`
  color: ${({ theme }) => theme.color.blue500};
  background: ${({ theme }) => theme.color.blue50};
`;

const NeedUpdateBadge = styled(BaseBadge)`
  color: ${({ theme }) => theme.color.orange500};
  background: ${({ theme }) => theme.color.orange50};
`;

const ErrorBadge = styled(BaseBadge)`
  color: ${({ theme }) => theme.color.red500};
  background: ${({ theme }) => theme.color.red50};
`;

const StatusBadge = ({ status }: StatusBadgeProps): React.JSX.Element => {
  switch (status) {
    case 'normal':
      return <NormalBadge>정상</NormalBadge>;
    case 'needUpdate':
      return <NeedUpdateBadge>업데이트 필요</NeedUpdateBadge>;
    case 'error':
      return <ErrorBadge>에러</ErrorBadge>;
  }
};

export default StatusBadge;
