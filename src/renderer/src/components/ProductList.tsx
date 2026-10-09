import styled from 'styled-components';
import ProductRow from './ProductRow';
import type { ProductListItem } from './ProductRow';

interface ProductListProps {
  products: ProductListItem[];
}

const ProductListContainer = styled.section`
  margin-bottom: 24px;
`;

const ProductListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
`;

const ViewAllButton = styled.button`
  padding: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray500};
  cursor: pointer;
  background: none;
  border: none;
`;

const TableCard = styled.div`
  padding: 8px 20px;
  background: ${({ theme }) => theme.color.white};
  border-radius: 16px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const HeaderCell = styled.th<{ $isRight?: boolean }>`
  padding: 16px 0;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.color.gray500};
  text-align: ${({ $isRight }) => ($isRight ? 'right' : 'left')};
  border-bottom: 1px solid ${({ theme }) => theme.color.gray200};
`;

const ProductList = ({ products }: ProductListProps): React.JSX.Element => (
  <ProductListContainer>
    <ProductListHeader>
      <Title>상품 목록</Title>
      <ViewAllButton type="button">전체보기 &gt;</ViewAllButton>
    </ProductListHeader>
    <TableCard>
      <Table>
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
      </Table>
    </TableCard>
  </ProductListContainer>
);

export default ProductList;
