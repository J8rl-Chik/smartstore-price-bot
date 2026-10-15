import styled, { css } from 'styled-components';
import type { ProductUpdateStatus } from '../domain/_type';

interface StatusBadgeProps {
  status: ProductUpdateStatus;
}

const baseBadge = css`
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 8px;
`;

const WaitBadge = styled.span`
  ${baseBadge}
  color: ${({ theme }) => theme.color.orange500};
  background: ${({ theme }) => theme.color.orange50};
`;

const CompleteBadge = styled.span`
  ${baseBadge}
  color: ${({ theme }) => theme.color.blue500};
  background: ${({ theme }) => theme.color.blue50};
`;

const ErrorBadge = styled.span`
  ${baseBadge}
  color: ${({ theme }) => theme.color.red500};
  background: ${({ theme }) => theme.color.red50};
`;

const StatusBadge = ({ status }: StatusBadgeProps): React.JSX.Element => {
  switch (status) {
    case 'wait':
      return <WaitBadge>대기</WaitBadge>;
    case 'complete':
      return <CompleteBadge>완료</CompleteBadge>;
    case 'error':
      return <ErrorBadge>에러</ErrorBadge>;
  }
};

export default StatusBadge;
