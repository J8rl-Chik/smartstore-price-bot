import styled from 'styled-components';
import ProductRow from './ProductRow';
import type { ProductListItem } from './ProductRow';

interface ProductListProps {
  products: ProductListItem[];
}

/**
 * border-collapse: collapse에서는 table의 padding과 border-radius가 적용되지 않는다.
 * 카드 모양(여백, 둥근 모서리)을 table에 직접 주기 위해 separate와 border-spacing: 0을 쓴다.
 */
const ProductListContainer = styled.table`
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

const ProductList = ({ products }: ProductListProps): React.JSX.Element => (
  <ProductListContainer>
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
        <ProductRow key={product.id} product={product} />
      ))}
    </tbody>
  </ProductListContainer>
);

export default ProductList;
