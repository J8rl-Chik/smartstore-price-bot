---
name: vitest-react-test-convention
description: 이 프로젝트에서 vitest-browser-react로 React 컴포넌트를 테스트하는 컨벤션. src/renderer/src 아래 컴포넌트의 .test.tsx 파일을 새로 작성하거나 수정할 때 반드시 참고한다. "테스트"라는 말이 없어도 React 컴포넌트용 테스트 파일을 만들거나 고치는 모든 작업에서 이 스킬을 적용한다.
---

# vitest + React 컴포넌트 테스트 컨벤션

테스트 실행 여부(직접 실행하지 않고 사용자에게 맡기는 것)는 CLAUDE.md에 있다 — 이 스킬은 작성 방식만 다룬다.

## 이 테스트는 browser 프로젝트로 실행된다

`vitest.config.js`의 `test.projects` 중 `browser` 프로젝트(Playwright/chromium)가 `src/renderer/src/**/*.test.tsx`를 담당한다. 대상이 React 컴포넌트가 아니라 `src/domain`/`src/utils`/`src/integrations` 에서 다루는 함수라면 이 스킬이 다루는 범위 밖이다 (`unit` 프로젝트, `.test.ts`).

## 테스트 파일 위치와 이름

테스트 파일은 테스트 대상 컴포넌트와 **같은 디렉터리**에, `{컴포넌트명}.test.tsx`로 만든다. (예: `Header.tsx` → `Header.test.tsx`)

## render, 쿼리, 검증 패턴

- `render(<Component />)`는 `await`로 받는다 (Promise를 반환한다).
- 요소 조회는 `screen.getByRole(...)`, `screen.getByText(...)` 등 접근성 기반 쿼리를 우선한다.
- 가시성/속성 검증은 `await expect.element(locator).toBeVisible()` / `.toHaveAttribute(...)` 형태를 쓴다.

## 쿼리 가능한 마크업으로 만든다

컴포넌트에 테스트로 조회할 마땅한 role/text가 없다면(예: 진행률 바처럼 순수 시각 요소), 동작 변경 없이 `role`/`aria-*` 속성을 추가해서 쿼리 가능하게 만든다. 이건 접근성 개선이기도 하므로 정당한 변경이다. `data-testid`보다 이 방식을 우선한다.
