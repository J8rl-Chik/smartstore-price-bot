# 스마트스토어 최저가 자동 수정 프로그램 개선

1인 개발 · 작업 기간(2026년 7월 ~ 10월)

네이버 스마트스토어 판매가를 경쟁 판매처보다 낮게 자동으로 유지해주는 CLI 프로그램을 TypeScript 마이그레이션, Vitest 테스트 코드 추가, Electron GUI 전환으로 개선하는 프로젝트입니다.

<!-- TODO: 앱 스크린샷 또는 GIF 추가 -->

## 기존 프로젝트(과거)

스마트스토어를 직접 운영하면서 매일 반복하던 가격 수정 작업을 자동화하기 위해 만든 CLI 프로그램입니다.

- **문제** — 경쟁 판매처 가격이 수시로 바뀌어, 제품마다 최저가를 확인하고 직접 수정하는 데 1개당 약 40초가 걸렸습니다.
- **해결** — Puppeteer로 판매처 가격을 수집하고, 목표가를 계산해 Commerce API로 자동 수정하는 CLI 프로그램을 만들었습니다.
- **성과** — 1개당 수정 시간을 약 15초로 줄였고, 3년 넘게 실제 운영에 사용하고 있습니다.

## 개선 프로젝트(현재)

직접 사용하면서 느낀 불편한 점과 코드 구조를 함께 개선하고 있습니다.

### 1. GUI 전환 중 기존 기능이 깨질 수 있다는 걱정

- **문제** — CLI 코드를 Electron GUI로 옮기는 과정에서 기존 기능이 그대로 동작할지 확신할 수 없었습니다.
- **해결** — TypeScript로 마이그레이션해 타입 안전성을 확보하고, Vitest로 기존 기능의 테스트 코드를 작성했습니다.
- **이유** — JSDoc은 타입을 주석으로 따로 적어야 해서, 언어 차원에서 타입을 한 번에 다룰 수 있는 TypeScript를 선택했습니다. 테스트 도구는 실행 속도가 빠른 Vitest를 선택했습니다.
- **성과** — 테스트 케이스 약 300개로 주요 로직을 검증하고, 정적 타입 검사로 에러를 미리 발견할 수 있게 됐습니다.

### 2. 매번 CLI로 실행해야 하는 불편함

- **문제** — 실행할 때마다 CMD 실행 → 프로젝트 폴더로 이동 → 명령어 입력을 거쳐야 했습니다.
- **해결** — Electron GUI로 전환해 버튼 클릭으로 실행할 수 있게 했습니다.
- **이유** — `.bat` 파일로도 실행 과정은 줄일 수 있지만, 실행 상황 표시처럼 이후 추가할 기능을 고려해 GUI를 선택했습니다.
- **성과** — 실행 과정을 3단계(CMD 실행 → 폴더 이동 → 명령어 입력)에서 2단계(프로그램 실행 → 시작 버튼 클릭)로 줄였습니다.

## 아키텍처

![아키텍처](assets/architecture.png)

## 기술 스택

| 영역            | 사용 기술                                    |
| --------------- | -------------------------------------------- |
| 언어            | TypeScript                                   |
| 실행 환경       | Node.js                                      |
| 데스크톱        | Electron, electron-vite                      |
| UI              | React 19, styled-components                  |
| 브라우저 자동화 | Puppeteer                                    |
| 외부 API        | 스마트스토어 Commerce API, Google Sheets API |
| 테스트          | Vitest, vitest-browser-react                 |
| 코드 품질       | ESLint, Prettier, Stylelint                  |

## 트러블슈팅

### 가격 수정 순회를 React에서 main으로 옮기기

**S — 상황**

가격 수정을 시작하면, React 훅(`useTargetProductsUpdate`)이 아래처럼 제품을 순회하며 단계마다 main에 요청을 보냈습니다. 처음에 이 구조를 택한 건 통신이 단순해서였습니다. 작은 기능을 하나씩 실행해 확인할 수 있었고, 요청마다 응답이 바로 돌아왔습니다.

```ts
// 변경 전: React 훅이 제품마다 main에 4번 요청
const useTargetProductsUpdate = () => {
  const start = async () => {
    for (const targetProduct of targetProducts) {
      const sellers = await window.api.getSellers(catalogURL, name);
      if (!sellers.isSuccess) break;

      // 내 스토어 이름이 main에만 있어 필터링도 main에 요청
      const filtered = await window.api.filterSellers(sellers.sellers, excluded);
      if (!filtered.isSuccess) break;

      const targetPrice = await window.api.getTargetPrice(prices, freeDeliveryPrice);
      if (!targetPrice.isSuccess) break;

      const result = await window.api.updatePrice(
        originProductNo,
        targetPrice.targetPrice,
        delivery,
      );
      if (!result.isSuccess) break;

      // ... 중간 과정 생략

      // 수정 결과를 화면 상태에 반영
      setUpdatedProducts(updatedTargetProducts);
    }
  };
};
```

하지만 기능을 추가하면서 이 구조로 계속 진행해도 괜찮은지 의문이 들었습니다.

- **훅의 책임을 벗어난 순회**: 훅의 책임은 화면에 보여줄 상태를 관리하는 것인데, 제품 수정 제어와 순회까지 맡으면서 범위를 벗어났습니다.
  - 훅이 약 120줄, 테스트가 약 470줄로 길어지고 이해하기 어려워졌습니다.
  - 무엇을 main에 요청할지 기준이 없어, 순수 함수인 수정가 계산(`getTargetPrice`)까지 형식적으로 main에 요청했습니다.
- **반복되는 통신 패턴**: 제품마다 main에 요청하고 `if (!x.isSuccess) break;`로 응답을 확인하는 패턴이 4번씩 반복됐습니다.

**T — 과제**

위 두 가지를 해결하기 위해 아래를 목표로 잡았습니다.

- **역할 분리**: 제품 수정 제어와 순회, 계산까지 모두 main이 맡고, 훅은 화면에 보여줄 상태만 관리하게 합니다.
- **통신 단순화**: 제품마다 4번씩 반복되던 요청과 응답 확인을 없애, React는 시작 요청과 상태 수신만 하게 합니다.

**A — 행동**

| 선택지                                                | 한계                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| A. React 순회 유지, 4개 채널을 1개로 합치기           | 순회와 제품 수정 제어가 여전히 React에 남아, 역할 분리가 되지 않음 |
| **B. 순회를 main으로 옮기고 상태 전체를 전송 (선택)** | 제품 1개만 수정돼도 목록 전체(약 150개)를 다시 보냄                |
| C. 순회를 main으로 옮기고 바뀐 상태만 전송            | 바뀐 상태 종류마다 React에 처리 분기가 늘어 복잡해짐               |

두 목표를 만족하면서 React 쪽 처리가 가장 단순한 B를 선택했습니다. 목록 전체를 보내는 부담은 제품마다 10초씩 대기하는 순회에 비하면 작다고 판단했습니다.

```ts
// 변경 후: React 훅은 시작 요청 1번, 이후 main이 보내는 상태를 받기만 함
const useTargetProductsUpdate = () => {
  // main이 보내는 메시지를 수신하는 이벤트를 등록해 상태 업데이트
  useEffect(() => window.api.onUpdateState((state) => setUpdateState(state)), []);

  // main에 가격 수정 시작 요청
  const startUpdate = () => window.api.startUpdate();
};
```

**R — 결과**

| 항목                         | 변경 전         | 변경 후                                      |
| ---------------------------- | --------------- | -------------------------------------------- |
| 훅 코드                      | 약 120줄        | 약 60줄                                      |
| 훅 테스트                    | 약 470줄 · 22개 | 약 160줄 · 8개                               |
| 제품 1개당 React → main 요청 | 4번             | 0번                                          |
| React에 노출한 통신 채널     | 6개             | 2개(가격 수정 요청, 메시지 수신 이벤트 등록) |

- 순회가 main 한 곳에 모여, 중복 실행 방지 같은 제어를 main에서만 처리하면 됩니다.
