import styled from 'styled-components';
import ProductTableRow from './ProductTableRow';
import type { ProductListItem } from './ProductTableRow';

interface ProductTableProps {
  products: ProductListItem[];
}

/**
 * border-collapse: collapse에서는 table의 padding이 적용되지 않는다.
 * 카드 여백을 table에 직접 주기 위해 separate(기본값)와 border-spacing: 0을 쓴다.
 */
const ProductTableContainer = styled.table`
  width: 100%;
  padding: 8px 20px;
  margin-bottom: 24px;
  border-spacing: 0;
  background: ${({ theme }) => theme.color.white};
  border-radius: 16px;
`;

const Title = styled.caption`
  padding-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
  text-align: left;
`;

const HeaderCell = styled.th.attrs({ scope: 'col' })<{ $isRight?: boolean }>`
  padding: 16px 0;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.color.gray500};
  text-align: ${({ $isRight }) => ($isRight ? 'right' : 'left')};
  border-bottom: 1px solid ${({ theme }) => theme.color.gray200};
`;

const ProductTable = ({ products }: ProductTableProps): React.JSX.Element => (
  <ProductTableContainer>
    <Title>상품 목록</Title>
    <thead>
      <tr>
        <HeaderCell>제품명</HeaderCell>
        <HeaderCell $isRight>설정가</HeaderCell>
        <HeaderCell $isRight>현재가</HeaderCell>
        <HeaderCell $isRight>수정가</HeaderCell>
        <HeaderCell>상태</HeaderCell>
        <HeaderCell $isRight>수정 시간</HeaderCell>
      </tr>
    </thead>
    <tbody>
      {products.map((product) => (
        <ProductTableRow key={product.id} product={product} />
      ))}
    </tbody>
  </ProductTableContainer>
);

export default ProductTable;
