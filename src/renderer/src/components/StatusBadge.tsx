import styled from 'styled-components';

export type ProductStatus = 'normal' | 'needUpdate' | 'error';

interface StatusBadgeProps {
  status: ProductStatus;
}

const STATUS_LABEL: Record<ProductStatus, string> = {
  normal: '정상',
  needUpdate: '업데이트 필요',
  error: '에러',
};

const StatusBadgeRoot = styled.span<{ $status: ProductStatus }>`
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, $status }) =>
    ({ normal: theme.color.blue500, needUpdate: theme.color.orange500, error: theme.color.red500 })[
      $status
    ]};
  white-space: nowrap;
  background: ${({ theme, $status }) =>
    ({ normal: theme.color.blue50, needUpdate: theme.color.orange50, error: theme.color.red50 })[
      $status
    ]};
  border-radius: 8px;
`;

const StatusBadge = ({ status }: StatusBadgeProps): React.JSX.Element => (
  <StatusBadgeRoot $status={status}>{STATUS_LABEL[status]}</StatusBadgeRoot>
);

export default StatusBadge;
