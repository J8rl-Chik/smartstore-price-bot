import { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import ProductList from './components/ProductList';
import type { ProductListItem } from './components/ProductRow';
import ProgressBar from './components/ProgressBar';
import StyleProvider from './components/StyleProvider';
import type { TargetProduct } from '../../domain/product/_type';
import delaySeconds from '../../utils/delaySeconds';

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
    setPrice: 42900,
    currentPrice: 42900,
    updatedPrice: 42900,
    status: 'normal',
    updatedAt: '2분 전',
  },
  {
    id: 2,
    name: '블루투스 스피커 미니',
    setPrice: 35000,
    currentPrice: 35000,
    updatedPrice: 33800,
    status: 'needUpdate',
    updatedAt: '1시간 전',
  },
  {
    id: 3,
    name: '접이식 우산',
    setPrice: 18900,
    currentPrice: 18900,
    updatedPrice: 18900,
    status: 'normal',
    updatedAt: '1분 전',
  },
  {
    id: 4,
    name: '스테인리스 텀블러',
    setPrice: 24500,
    currentPrice: 24500,
    updatedPrice: null,
    status: 'error',
    updatedAt: '3시간 전',
  },
  {
    id: 5,
    name: 'USB-C 멀티허브',
    setPrice: 56000,
    currentPrice: 56000,
    updatedPrice: 52300,
    status: 'needUpdate',
    updatedAt: '45분 전',
  },
  {
    id: 6,
    name: '캠핑 의자',
    setPrice: 63900,
    currentPrice: 63900,
    updatedPrice: 63900,
    status: 'normal',
    updatedAt: '8분 전',
  },
];

const App = (): React.JSX.Element => {
  const [targetProducts, setTargetProducts] = useState<TargetProduct[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // 가격 수정 중인 상품의 targetProducts 인덱스. 수정 중이 아니면 null.
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const handleStartButtonClick = async (): Promise<void> => {
    setIsLoading(true);

    const response = await window.api.getTargetProducts();

    // TODO: response의 isSuccess가 false인 경우 예외 처리
    const targetProductsResult = response.isSuccess ? response.targetProducts : [];

    setIsLoading(false);
    setTargetProducts(targetProductsResult);

    console.log(targetProductsResult);

    if (targetProductsResult.length === 0) {
      return;
    }

    await window.api.createLoginPage();

    try {
      for (const [index, targetProduct] of targetProductsResult.entries()) {
        setCurrentIndex(index);

        // TODO: updatePrice는 main 프로세스 전용 함수라 여기서 직접 호출 불가. IPC로 노출한 뒤 교체 필요.
        const updatedTargetProduct = targetProduct;

        const sellersResponse = await window.api.getSellers(
          targetProduct.catalogURL,
          targetProduct.name,
        );

        // TODO: 임시 조치. 실패하면 순회를 중단한다. 브라우저 종료 같은 치명적인 실패와 개별 상품의 일시적 실패를 구분해 처리해야 한다.
        if (!sellersResponse.isSuccess) {
          break;
        }

        setTargetProducts((prev) =>
          prev.map((target) => (target === targetProduct ? updatedTargetProduct : target)),
        );

        await delaySeconds(5);
      }
    } finally {
      setCurrentIndex(null);
    }
  };

  // 진행 상태는 별도 state로 두지 않고 targetProducts와 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return (
    <StyleProvider>
      <AppContainer>
        <Header onStartButtonClick={handleStartButtonClick} isLoading={isLoading} />
        <ProgressBar
          totalCount={targetProducts.length}
          currentOrder={currentOrder}
          productName={currentProduct?.name}
        />
        <ProductList products={DUMMY_PRODUCT_LIST_ITEMS} />
      </AppContainer>
    </StyleProvider>
  );
};

export default App;
