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

const ProductRowRoot = styled.tr`
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

const NameCell = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  font-weight: 500;
`;

const ProductIcon = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${({ theme }) => theme.color.gray400};
  background: ${({ theme }) => theme.color.gray100};
  border-radius: 8px;
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
  <ProductRowRoot>
    <Cell>
      <NameCell>
        <ProductIcon aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          >
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
          </svg>
        </ProductIcon>
        {product.name}
      </NameCell>
    </Cell>
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
  </ProductRowRoot>
);

export default ProductRow;
