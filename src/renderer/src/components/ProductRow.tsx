import styled from 'styled-components';
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

interface ProductRowProps {
  product: ProductListItem;
}

const ProductRowContainer = styled.tr`
  &:not(:last-child) td {
    border-bottom: 1px solid ${({ theme }) => theme.color.gray100};
  }
`;

const Cell = styled.td<{ $isRight?: boolean }>`
  padding: 16px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.color.gray900};
  text-align: ${({ $isRight }) => ($isRight ? 'right' : 'left')};
`;

const NameCell = styled(Cell)`
  font-weight: 500;
`;

const SetPrice = styled.span`
  color: ${({ theme }) => theme.color.gray400};
`;

const CurrentPrice = styled.span`
  font-weight: 700;
`;

const UpdatedPrice = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.color.blue500};
`;

const UpdatedAt = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray400};
`;

const formatPrice = (price: number): string => `${price.toLocaleString('ko-KR')}원`;

const ProductRow = ({ product }: ProductRowProps): React.JSX.Element => (
  <ProductRowContainer>
    <NameCell>{product.name}</NameCell>
    <Cell $isRight>
      <SetPrice>{formatPrice(product.setPrice)}</SetPrice>
    </Cell>
    <Cell $isRight>
      <CurrentPrice>{formatPrice(product.currentPrice)}</CurrentPrice>
    </Cell>
    <Cell $isRight>
      <UpdatedPrice>
        {product.updatedPrice === null ? '—' : formatPrice(product.updatedPrice)}
      </UpdatedPrice>
    </Cell>
    <Cell>
      <StatusBadge status={product.status} />
    </Cell>
    <Cell $isRight>
      <UpdatedAt>{product.updatedAt}</UpdatedAt>
    </Cell>
  </ProductRowContainer>
);

export default ProductRow;
