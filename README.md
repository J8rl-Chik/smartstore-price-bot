# smartstore-price-bot

네이버 스마트스토어의 판매가를 경쟁 판매처보다 낮게 자동으로 유지해주는 가격 조정 봇입니다.

구글 시트에 등록한 제품 목록을 기준으로 네이버 쇼핑 카탈로그(가격비교) 페이지에서 경쟁 판매처의 가격을 수집하고, 스마트스토어 커머스 API로 판매가를 갱신합니다.

> 🚧 **현재 진행 중인 프로젝트입니다.** 운영하던 JavaScript CLI 봇을 TypeScript로 마이그레이션하고, 테스트 코드를 작성하고, Electron + React GUI로 개선하고 있습니다.

<!-- TODO: 앱 스크린샷 또는 GIF 추가 -->

## 프로젝트 배경

처음에는 `node app.js`로 실행하는 단일 CLI 스크립트였습니다. 실제 운영하며 다음 문제를 느꼈고, 이를 개선하는 과정을 단계별로 진행했습니다.

| 단계                       | 목표                                                                                   | 상태       |
| -------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| 1. 로직 분리               | 한 파일에 섞여 있던 가격 계산·상품 매칭 로직을 순수 함수로 추출                        | ✅         |
| 2. 테스트                  | 추출한 도메인 로직과 외부 연동 모듈에 대한 단위 테스트 작성                            | ✅         |
| 3. TypeScript 마이그레이션 | 전체 코드 타입 안전성 확보                                                             | ✅         |
| 4. Electron + React UI     | 터미널 실행, 로그 대신 진행 상황을 확인할 수 있는 UI 제공 및 버튼 클릭으로 실행 간편화 | 🔄 진행 중 |

## 주요 기능

- **구글 시트 기반 설정** — 제품별 제외 판매처, 가상 판매처 가격, 최소 무료배송가, 배송비 타입을 시트에서 관리
- **경쟁사 가격 수집** — Puppeteer로 네이버 쇼핑 카탈로그에서 판매처별 가격 · 배송비 타입 수집
- **목표가 자동 계산** — 최저가보다 10원 낮게, 단 무료배송 하한선 아래로는 내려가지 않도록 결정
- **변경 시에만 업데이트** — 목표가·배송비 타입이 달라진 경우에만 스마트스토어 API 호출
- **접근 제한 대응** — 랜덤 딜레이, 상품 순서 셔플, 로그인 프로필 유지

## 기술 스택

| 영역      | 사용 기술                                                                      |
| --------- | ------------------------------------------------------------------------------ |
| 언어      | TypeScript                                                                     |
| 데스크톱  | Electron, electron-vite                                                        |
| UI        | React 19, styled-components                                                    |
| 크롤링    | Puppeteer                                                                      |
| 외부 API  | 네이버 커머스 API (OAuth 토큰 발급 · 상품 조회 · 가격 수정), Google Sheets API |
| 테스트    | Vitest, vitest-browser-react (Playwright 브라우저 모드)                        |
| 코드 품질 | ESLint, Prettier, Stylelint                                                    |

## 가격 결정 로직

판매 중인 상품을 하나씩 순회하며 아래 순서로 처리합니다.

1. **매칭 확인** — 구글 시트에서 같은 이름의 제품 행을 찾고, 없으면 건너뜀
2. **가격 수집** — 카탈로그 페이지에서 판매처별 가격 수집 (목록이 비어 있으면 건너뜀)
3. **가격 정리**
   - 내 스토어와 시트에 지정한 제외 판매처를 필터링
   - 가상 판매처 가격이 있으면 추가한 뒤 오름차순 정렬
4. **목표가 결정** — `freeDeliveryPrice + 10원` 이상인 가장 낮은 가격을 찾아 10원을 뺀 값을 목표가로 설정. 해당하는 가격이 없으면 `freeDeliveryPrice`를 목표가로 설정
5. **업데이트 판단** — 카탈로그에 내 스토어가 없거나, 목표가 또는 배송비 타입이 바뀐 경우에만 `updatePrice` 호출

```ts
export const calculateTargetPrice = (prices: number[], freeDeliveryPrice: number): number => {
  const sortedPrices = [...prices].sort((price1, price2) => price1 - price2);
  const minPrice = sortedPrices.find((price) => price >= freeDeliveryPrice + 10);

  return minPrice ? minPrice - 10 : freeDeliveryPrice;
};
```

한 사이클이 끝나면 브라우저를 닫고 5분 대기 후 다시 시작합니다.

## 아키텍처

```text
src/
├── domain/          # 순수 비즈니스 로직 (가격 계산, 상품 매칭, 배송비, 판매처 필터)
├── integrations/    # 외부 시스템 연동
│   ├── smartStore/    #   네이버 커머스 API (토큰, 상품 조회, 가격 수정)
│   ├── googleSheets/  #   구글 시트 제품 행 조회
│   └── puppeteer/     #   브라우저 생성, 네이버 로그인, 카탈로그 파싱
├── main/            # Electron 메인 프로세스 (IPC 핸들러)
├── preload/         # contextBridge로 노출하는 window.api, IPC 타입 정의
├── renderer/        # React UI
├── utils/           # delay, shuffle, 환경변수 검증 등
└── app.ts           # CLI 진입점
```

- **domain / integrations 분리** — 부수효과가 없는 도메인 로직은 목(mock) 없이 테스트하고, 외부 연동은 별도 모듈로 격리했습니다.
- **CLI와 Electron이 같은 코드를 공유** — 동일한 `domain`, `integrations` 모듈을 `app.ts`와 Electron 메인 프로세스가 함께 사용합니다.
- **타입 안전한 IPC** — 채널 이름에 따라 요청 인자와 응답 타입을 강제하는 `handleIpc` 래퍼를 두어 메인 · 렌더러 간 계약을 컴파일 타임에 검증합니다.

```ts
const handleIpc = <E extends keyof IpcEvent>(
  event: E,
  handler: (...args: Parameters<IpcEvent[E]>) => ReturnType<IpcEvent[E]>,
): void => {
  /* ... */
};
```

## 테스트

도메인 로직, 외부 연동(API 응답 처리 · HTML 파싱), IPC 핸들러, React 컴포넌트까지 테스트합니다.

| 대상                                 | 방식                                      |
| ------------------------------------ | ----------------------------------------- |
| domain · utils · integrations · main | Vitest 단위 테스트                        |
| 카탈로그 HTML 파싱                   | 고정 HTML fixture로 파서 검증             |
| React 컴포넌트                       | vitest-browser-react (실제 브라우저 환경) |
