import styled, { css } from 'styled-components';
import DeliveryFeeInfo from './DeliveryFeeInfo';
import StatusBadge from './StatusBadge';
import formatTotalPrice from '../domain/formatTotalPrice';
import type { TProductTableRow } from '../domain/_type';

interface ProductTableRowProps {
  product: TProductTableRow;
}

const ProductTableRowContainer = styled.tr`
  &:not(:last-child) td {
    border-bottom: 1px solid ${({ theme }) => theme.color.gray100};
  }
`;

const cell = css`
  padding: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.gray900};
  text-align: left;
`;

const NameCell = styled.td`
  ${cell}
  font-weight: 500;
`;

const ConfiguredPriceCell = styled.td`
  ${cell}
  color: ${({ theme }) => theme.color.gray500};
  text-align: right;
`;

const CurrentPriceCell = styled.td`
  ${cell}
  font-weight: 700;
  text-align: right;
`;

const UpdatedPriceCell = styled.td`
  ${cell}
  font-weight: 700;
  color: ${({ theme }) => theme.color.blue500};
  text-align: right;
`;

const StatusCell = styled.td`
  ${cell}
  text-align: center;
`;

const UpdateTimeCell = styled.td`
  ${cell}
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray400};
  text-align: right;
`;

const ProductTableRow = ({ product }: ProductTableRowProps): React.JSX.Element => (
  <ProductTableRowContainer>
    <NameCell>{product.name}</NameCell>
    <ConfiguredPriceCell>
      {formatTotalPrice(product.configuredPrice)}
      <DeliveryFeeInfo {...product.configuredPrice} />
    </ConfiguredPriceCell>
    <CurrentPriceCell>
      {formatTotalPrice(product.currentPrice)}
      <DeliveryFeeInfo {...product.currentPrice} />
    </CurrentPriceCell>
    <UpdatedPriceCell>
      {product.updatedPrice === null ? (
        '—'
      ) : (
        <>
          {formatTotalPrice(product.updatedPrice)}
          <DeliveryFeeInfo {...product.updatedPrice} />
        </>
      )}
    </UpdatedPriceCell>
    <StatusCell>
      <StatusBadge status={product.status} />
    </StatusCell>
    <UpdateTimeCell>{product.updateTime}</UpdateTimeCell>
  </ProductTableRowContainer>
);

export default ProductTableRow;
