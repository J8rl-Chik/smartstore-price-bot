import styled from 'styled-components';
import Header from './components/Header';
import ProductTable from './components/ProductTable';
import type { ProductListItem } from './components/ProductTableRow';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';
import useTargetProductsUpdate from './hooks/useTargetProductsUpdate';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font.kr};
  background: ${({ theme }) => theme.color.gray100};
`;

// TODO: UI 확인용 더미 데이터. 가격 수정 결과를 받아오면 targetProducts 기반의 실제 데이터로 교체 필요.
const DUMMY_PRODUCT_LIST_ITEMS: ProductListItem[] = [
  {
    id: 1,
    name: '무선 이어폰 프로',
    deliveryFee: 3000,
    setPrice: 42900,
    currentPrice: 42900,
    updatedPrice: 42900,
    status: 'normal',
    updatedAt: '14:32:05',
  },
  {
    id: 2,
    name: '블루투스 스피커 미니',
    deliveryFee: 0,
    setPrice: 35000,
    currentPrice: 35000,
    updatedPrice: 33800,
    status: 'needUpdate',
    updatedAt: '13:34:48',
  },
  {
    id: 3,
    name: '접이식 우산',
    deliveryFee: 2500,
    setPrice: 18900,
    currentPrice: 18900,
    updatedPrice: 18900,
    status: 'normal',
    updatedAt: '14:33:21',
  },
  {
    id: 4,
    name: '스테인리스 텀블러',
    deliveryFee: 3000,
    setPrice: 24500,
    currentPrice: 24500,
    updatedPrice: null,
    status: 'error',
    updatedAt: '11:35:09',
  },
  {
    id: 5,
    name: 'USB-C 멀티허브',
    deliveryFee: 0,
    setPrice: 56000,
    currentPrice: 56000,
    updatedPrice: 52300,
    status: 'needUpdate',
    updatedAt: '13:49:30',
  },
  {
    id: 6,
    name: '캠핑 의자',
    deliveryFee: 3500,
    setPrice: 63900,
    currentPrice: 63900,
    updatedPrice: 63900,
    status: 'normal',
    updatedAt: '14:26:54',
  },
];

const App = (): React.JSX.Element => {
  const { targetProducts, isLoading, currentProduct, currentOrder, start } =
    useTargetProductsUpdate();

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={start} isLoading={isLoading} />
        <ProgressBar
          totalCount={targetProducts.length}
          currentOrder={currentOrder}
          productName={currentProduct?.name}
        />
        <ProductTable products={DUMMY_PRODUCT_LIST_ITEMS} />
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
