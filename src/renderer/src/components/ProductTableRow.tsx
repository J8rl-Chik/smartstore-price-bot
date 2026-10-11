import styled, { css } from 'styled-components';
import StatusBadge from './StatusBadge';
import type { ProductStatus } from './StatusBadge';

export interface ProductListItem {
  id: number;
  name: string;
  setPrice: number;
  currentPrice: number;
  // 수정가가 아직 없으면 null. "—"로 표시한다.
  updatedPrice: number | null;
  status: ProductStatus;
  updatedAt: string;
}

interface ProductTableRowProps {
  product: ProductListItem;
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

const SetPriceCell = styled.td`
  ${cell}
  color: ${({ theme }) => theme.color.gray400};
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
`;

const UpdatedAtCell = styled.td`
  ${cell}
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray400};
  text-align: right;
`;

const formatPrice = (price: number): string => `${price.toLocaleString('ko-KR')}원`;

const ProductTableRow = ({ product }: ProductTableRowProps): React.JSX.Element => (
  <ProductTableRowContainer>
    <NameCell>{product.name}</NameCell>
    <SetPriceCell>{formatPrice(product.setPrice)}</SetPriceCell>
    <CurrentPriceCell>{formatPrice(product.currentPrice)}</CurrentPriceCell>
    <UpdatedPriceCell>
      {product.updatedPrice === null ? '—' : formatPrice(product.updatedPrice)}
    </UpdatedPriceCell>
    <StatusCell>
      <StatusBadge status={product.status} />
    </StatusCell>
    <UpdatedAtCell>{product.updatedAt}</UpdatedAtCell>
  </ProductTableRowContainer>
);

export default ProductTableRow;
