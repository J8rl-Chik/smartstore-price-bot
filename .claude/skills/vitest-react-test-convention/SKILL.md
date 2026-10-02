---
name: vitest-react-test-convention
description: 이 프로젝트에서 vitest로 테스트를 작성하는 컨벤션. src/renderer/src 아래 React 컴포넌트의 .test.tsx 파일(vitest-browser-react)을 새로 작성하거나 수정할 때 반드시 참고한다. 또 .test.ts 파일을 포함해 어떤 테스트 파일이든 새로 만들거나 고칠 때 "공통 규칙"(import 시 자동 실행되는 코드 처리, it.each 사용 금지)을 적용한다. "테스트"라는 말이 없어도 테스트 파일을 만들거나 고치는 모든 작업에서 이 스킬을 적용한다.
---

# vitest + React 컴포넌트 테스트 컨벤션

테스트 실행 여부(직접 실행하지 않고 사용자에게 맡기는 것)는 CLAUDE.md에 있다 — 이 스킬은 작성 방식만 다룬다.

## 공통 규칙 (`.test.ts`, `.test.tsx` 모두 적용)

### 1. import하면 자동으로 실행되는 코드가 있으면 진행 방식을 먼저 물어본다

테스트 대상 모듈이 import되는 순간 바로 실행되는 코드(최상단에서 함수를 호출하거나 전역에 값을 등록하는 진입점 스크립트 등)를 갖고 있다면, 임의로 구조를 바꾸거나 테스트 방식을 정하지 않는다. 먼저 사용자에게 어떻게 진행할지 물어본다. 선택지와 장단점을 함께 제시한다.

| 선택지 | 내용 | 장단점 |
| --- | --- | --- |
| 함수로 분리 | 로직을 `export const exposeApi = () => {}`처럼 별도 파일의 함수로 옮기고, 원래 파일은 호출만 한다 | 테스트가 단순해지고 프로젝트의 `registerIpcHandlers.ts` 패턴과도 일관된다. 파일이 늘고 호출만 하는 진입점 파일은 테스트하지 않게 된다 |
| 모듈을 매번 다시 불러오기 | 테스트마다 `vi.resetModules()` 후 동적 `import()`로 실행한다 | 소스를 바꾸지 않아도 된다. 테스트마다 모듈 캐시를 비워야 하고 호출 시점이 코드에 드러나지 않는다 |

참고 사항

- 정적 `import`는 `vi.mock` 팩토리보다 먼저 모듈을 실행시킬 수 있다. 팩토리가 테스트 파일 최상단의 변수를 참조하면 `Cannot access '...' before initialization` 에러가 나므로 `vi.hoisted`로 값을 먼저 만든다. 팩토리 안에서 값을 직접 만들거나 `(...args) => mockFn(...args)`처럼 호출 시점에 읽는 방식은 해당하지 않는다.
- 예: `src/preload/index.ts`는 `exposeApi()` 호출만 하고, 로직과 테스트는 `exposeApi.ts`/`exposeApi.test.ts`에 둔다.

### 2. `it.each`, `test.each`, `describe.each`를 쓰지 않는다

테이블 형태의 케이스 정의와 `%s` 같은 템플릿 제목은 중첩 구조가 되어 직관적이지 않다. 케이스마다 `it`을 따로 작성한다. 코드가 반복되어도 각 테스트가 무엇을 검증하는지 위에서 아래로 바로 읽히는 쪽을 우선한다.

```ts
// 쓰지 않는다
it.each([
  ['createLoginPage', (api: Api) => api.createLoginPage()],
  ['getTargetProducts', (api: Api) => api.getTargetProducts()],
])('%s를 호출하면 같은 이름의 채널로 invoke를 호출한다', async (channel, callApi) => {
  // ...
});

// 이렇게 쓴다
it('createLoginPage를 호출하면 createLoginPage 채널로 invoke를 호출한다', async () => {
  const api = getExposedApi();

  await api.createLoginPage();

  expect(mockInvoke).toHaveBeenCalledWith('createLoginPage');
});

it('getTargetProducts를 호출하면 getTargetProducts 채널로 invoke를 호출한다', async () => {
  const api = getExposedApi();

  await api.getTargetProducts();

  expect(mockInvoke).toHaveBeenCalledWith('getTargetProducts');
});
```

반복되는 준비 코드는 `getExposedApi` 같은 헬퍼 함수로 뽑는다. 헬퍼는 케이스를 합치는 용도가 아니라 중복된 준비 동작을 줄이는 용도로만 쓴다.

## 이 아래부터는 React 컴포넌트 테스트(`.test.tsx`) 전용이다

### 이 테스트는 browser 프로젝트로 실행된다

`vitest.config.js`의 `test.projects` 중 `browser` 프로젝트(Playwright/chromium)가 `src/renderer/src/**/*.test.tsx`를 담당한다. 대상이 React 컴포넌트가 아니라 `src/domain`/`src/utils`/`src/integrations`/`src/main`/`src/preload`에서 다루는 함수라면 아래 React 전용 내용은 해당하지 않는다 (`unit` 프로젝트, `.test.ts`). 위의 공통 규칙은 그대로 적용한다.

### 테스트 파일 위치와 이름

테스트 파일은 테스트 대상 컴포넌트와 **같은 디렉터리**에, `{컴포넌트명}.test.tsx`로 만든다. (예: `Header.tsx` → `Header.test.tsx`)

### render, 쿼리, 검증 패턴

- `render(<Component />)`는 `await`로 받는다 (Promise를 반환한다).
- 요소 조회는 `screen.getByRole(...)`, `screen.getByText(...)` 등 접근성 기반 쿼리를 우선한다.
- 가시성/속성 검증은 `await expect.element(locator).toBeVisible()` / `.toHaveAttribute(...)` 형태를 쓴다.

### 쿼리 가능한 마크업으로 만든다

컴포넌트에 테스트로 조회할 마땅한 role/text가 없다면(예: 진행률 바처럼 순수 시각 요소), 동작 변경 없이 `role`/`aria-*` 속성을 추가해서 쿼리 가능하게 만든다. 이건 접근성 개선이기도 하므로 정당한 변경이다. `data-testid`보다 이 방식을 우선한다.
