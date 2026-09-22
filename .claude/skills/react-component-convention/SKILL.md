---
name: react-component-convention
description: 이 프로젝트(src/renderer/src)의 React + styled-components UI 작성 컨벤션. 화면을 섹션 단위로 나눠 정적 UI부터 만들 때, styled-component 이름을 지을 때, 스타일만 감싸는 자식 컴포넌트를 정리할 때, div/span이나 시맨틱 태그를 고를 때 반드시 참고한다. "컨벤션"이나 "스타일 가이드"라는 말이 없어도, 이 프로젝트에서 새 컴포넌트를 만들거나 기존 UI 코드를 리뷰/리팩토링할 때는 먼저 이 스킬을 적용한다.
---

# React 컴포넌트 (styled-components) 작성 컨벤션

이 프로젝트(`smartstore-price-bot`)의 렌더러 UI는 React + styled-components로 작성한다.
아래는 실제 작업 중 사용자와 합의된 규칙이며, 새 컴포넌트를 만들거나 기존 컴포넌트를 리뷰/리팩토링할 때 적용한다.

## 섹션 단위로 분리하고, 정적 UI부터 만든다

화면은 한 번에 통짜로 만들지 않고 시각적 섹션 단위(예: 헤더 → 진행 상태 바 → 요약 카드 → 목록/테이블)로 나눠 순서대로 개발한다.
각 섹션이 독립적인 컴포넌트 파일이 될 만큼 분량이 있다면 별도 파일로 분리한다 (예: `Header.tsx`).

로직(상태, API 연동)은 먼저 붙이지 않는다. "정적 UI 먼저, 동작은 나중"이 이 프로젝트의 기본 순서다.
아직 연결되지 않은 하위 섹션이 있어도 괜찮다 — 한 번에 전체를 완성하려 하지 말 것.

## 이름은 역할/의미로 짓는다

`PrimaryBtn`처럼 스타일 특성(색상 우선순위 등)으로 이름 짓지 말고, 그 요소가 화면에서 하는 역할로 이름 짓는다.

- `PrimaryBtn` → `StartButton` (그 버튼이 하는 일: 자동 수정을 "시작"하는 버튼)
- `HeaderBrand` → `HeaderTitle`, `LogoBadge` → `Logo`, `PageTitle` → `Title`

## 스타일만 감싸는 자식은 부모에 합친다

자식 styled-component가 별도 로직/재사용 없이 텍스트 스타일(폰트 크기, 색상 등)만 추가하는 래퍼라면, 부모 컴포넌트에 그 스타일을 합치고 자식은 제거한다.

**Before:**

```tsx
const LogoBadge = styled.div`
  width: 36px;
  height: 36px; /* ...레이아웃... */
`;
const LogoLetter = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${color.white};
`;

<LogoBadge>
  <LogoLetter>S</LogoLetter>
</LogoBadge>;
```

**After:**

```tsx
const Logo = styled.span`
  width: 36px;
  height: 36px; /* ...레이아웃... */
  font-size: 16px;
  font-weight: 700;
  color: ${color.white};
`;

<Logo>S</Logo>;
```

이 컴포넌트 트리에서 `LogoLetter`가 다른 곳에서 재사용되지 않는다면, 별도로 남겨둘 이유가 없다 — 계층만 늘어난다.

## 태그 선택: 시맨틱 태그 → div/span

- 컴포넌트의 최상위 요소는 가능하면 의미에 맞는 HTML 시맨틱 태그를 쓴다 (예: 화면 헤더 영역은 `styled.div` 대신 `styled.header`).
- 그 아래 스타일용 요소는 **인라인 성격**(아이콘/글자 하나짜리 배지, 짧은 텍스트 조각)이면 `span`, **블록/레이아웃 컨테이너** 성격이면 `div`을 쓴다.

## 적용 시 체크리스트

새 styled-component를 만들거나 기존 걸 검토할 때 아래를 순서대로 점검한다:

1. 이 화면을 더 작은 섹션으로 나눌 수 있는가? 나눌 수 있다면 별도 파일로 분리했는가? 로직 없이 정적 UI부터 만들고 있는가?
2. 이름이 스타일 특성이 아니라 그 요소의 역할/의미를 설명하는가?
3. 재사용되지 않는데 스타일만 감싸는 자식 컴포넌트가 있는가? 있다면 부모에 합칠 수 있는가?
4. 최상위 태그가 시맨틱하게 적절한가? 하위 요소는 inline(`span`)/block(`div`) 중 의미에 맞는 쪽을 골랐는가?
