---
title: "CSS Grid vs Flexbox, 언제 무엇을 써야 할까"
category: Frontend
date: 2026-04-07
---

# CSS Grid vs Flexbox, 언제 무엇을 써야 할까

## 서론

CSS 레이아웃을 다루다 보면 반드시 마주치는 두 가지 도구가 있다. 바로 **Flexbox**와 **CSS Grid**다.
둘 다 모던 CSS 레이아웃의 핵심이지만, 막상 실무에서 사용하려고 하면 "이 상황에는 뭘 써야 하지?"라는
고민이 생긴다. 인터넷에는 "Flexbox는 1차원, Grid는 2차원"이라는 설명이 넘쳐나지만, 그 한 줄만으로는
실전에서 판단 기준을 세우기 어렵다.

이 글에서는 Flexbox와 Grid 각각의 기본 사용법부터 시작해서, 실제 UI 패턴별로 어떤 도구가 더 적합한지
구체적인 코드와 함께 비교해본다. 마지막에는 둘을 함께 쓰는 전략까지 다룬다.

---

## 본론

### 1. 1차원 vs 2차원 레이아웃

Flexbox와 Grid의 가장 근본적인 차이는 **제어하는 축의 수**다.

- **Flexbox**: 한 번에 하나의 축(가로 또는 세로)만 제어한다. 아이템들이 한 줄로 나열되는 구조에 최적화되어 있다.
- **CSS Grid**: 가로와 세로, 두 축을 동시에 제어한다. 행과 열을 명시적으로 정의하고, 그 안에 아이템을 배치한다.

이 차이가 실전에서 어떤 의미를 갖는지는 아래 예시들을 통해 확인해보자.

---

### 2. Flexbox 기본 사용법

Flexbox는 `display: flex`를 선언하는 것으로 시작한다. 부모 요소가 **flex container**가 되고,
자식 요소들은 **flex item**이 된다.

#### 핵심 속성 정리

```css
/* 컨테이너 속성 */
.flex-container {
  display: flex;
  flex-direction: row;          /* 주축 방향: row | column */
  justify-content: center;      /* 주축 정렬 */
  align-items: center;          /* 교차축 정렬 */
  flex-wrap: wrap;              /* 줄바꿈 허용 */
  gap: 16px;                    /* 아이템 간 간격 */
}

/* 아이템 속성 */
.flex-item {
  flex-grow: 1;                 /* 남은 공간 차지 비율 */
  flex-shrink: 0;               /* 축소 비율 */
  flex-basis: 200px;            /* 기본 크기 */
}
```

#### 자주 쓰는 패턴: 양쪽 정렬

헤더에서 로고는 왼쪽, 메뉴는 오른쪽에 배치하는 패턴이다.

```html
<header class="header">
  <div class="logo">MyBlog</div>
  <nav class="nav">
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </nav>
</header>
```

```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
}

.nav {
  display: flex;
  gap: 20px;
}

.nav a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}
```

이처럼 Flexbox는 **한 줄 안에서 아이템들을 배치하고 정렬**하는 데 직관적이다.

#### 자주 쓰는 패턴: 수직 중앙 정렬

화면 정중앙에 요소를 배치하는 것은 과거 CSS에서 악명 높은 문제였지만, Flexbox로는 단 세 줄이면 된다.

```css
.center-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

---

### 3. CSS Grid 기본 사용법

CSS Grid는 `display: grid`로 시작한다. Flexbox와 달리 **행과 열을 명시적으로 정의**하는 것이 핵심이다.

#### 핵심 속성 정리

```css
/* 컨테이너 속성 */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;    /* 열 정의 */
  grid-template-rows: auto 1fr auto;     /* 행 정의 */
  gap: 16px;                              /* 행/열 간격 */
}

/* 아이템 속성 */
.grid-item {
  grid-column: 1 / 3;          /* 1번 열부터 3번 열 전까지 차지 */
  grid-row: 1 / 2;             /* 1번 행부터 2번 행 전까지 차지 */
}
```

`fr` 단위는 Grid에서 도입된 단위로, 남은 공간을 비율로 나눈다. `1fr 2fr 1fr`이면
사용 가능한 공간을 1:2:1 비율로 분배한다.

#### repeat()과 minmax()

Grid의 진짜 힘은 `repeat()`과 `minmax()` 함수 조합에서 나온다.

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
```

이 한 줄이면 **반응형 그리드 레이아웃이 미디어 쿼리 없이** 완성된다.
각 열은 최소 280px, 최대 1fr을 차지하며, 화면 너비에 따라 열 수가 자동으로 조절된다.

#### grid-template-areas

Grid만의 독보적인 기능이 바로 `grid-template-areas`다. 레이아웃을 시각적으로 정의할 수 있다.

```css
.page-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 60px 1fr 80px;
  grid-template-areas:
    "header  header"
    "sidebar content"
    "footer  footer";
  min-height: 100vh;
}

.page-header  { grid-area: header; }
.page-sidebar { grid-area: sidebar; }
.page-content { grid-area: content; }
.page-footer  { grid-area: footer; }
```

```html
<div class="page-layout">
  <header class="page-header">Header</header>
  <aside class="page-sidebar">Sidebar</aside>
  <main class="page-content">Content</main>
  <footer class="page-footer">Footer</footer>
</div>
```

코드만 봐도 레이아웃 구조가 한눈에 들어온다. 이런 **2차원 배치 능력**이 Grid의 강점이다.

---

### 4. 실전 비교 예시

이론은 충분하다. 이제 실무에서 자주 등장하는 UI 패턴 세 가지를 놓고 Flexbox와 Grid를 직접 비교해보자.

#### 4-1. 네비게이션 바

네비게이션 바는 아이템들이 **한 줄로 나열**되는 대표적인 1차원 레이아웃이다.

**Flexbox 구현:**

```html
<nav class="navbar">
  <div class="nav-brand">Logo</div>
  <ul class="nav-links">
    <li><a href="#">홈</a></li>
    <li><a href="#">포트폴리오</a></li>
    <li><a href="#">블로그</a></li>
    <li><a href="#">연락처</a></li>
  </ul>
  <button class="nav-cta">시작하기</button>
</nav>
```

```css
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 64px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 24px;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  color: #555;
  font-size: 15px;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #1a73e8;
}

.nav-cta {
  padding: 8px 20px;
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

**판단**: 네비게이션은 Flexbox가 압도적으로 적합하다. 한 줄 안에서 아이템을 나열하고 간격을 조절하는 것이
전부이기 때문이다. Grid를 쓸 이유가 없다.

#### 4-2. 카드 레이아웃

블로그 목록이나 상품 목록처럼 **카드를 격자 형태로 배치**하는 패턴이다.

**Grid 구현:**

```html
<div class="card-grid">
  <article class="card">
    <img src="thumb1.jpg" alt="썸네일" class="card-img" />
    <div class="card-body">
      <h3 class="card-title">CSS Grid 완벽 가이드</h3>
      <p class="card-desc">Grid의 모든 속성을 실전 예제와 함께 정리합니다.</p>
      <span class="card-date">2026.04.01</span>
    </div>
  </article>
  <article class="card">
    <img src="thumb2.jpg" alt="썸네일" class="card-img" />
    <div class="card-body">
      <h3 class="card-title">JavaScript 비동기 처리</h3>
      <p class="card-desc">Promise부터 async/await까지 깔끔하게 이해하기.</p>
      <span class="card-date">2026.03.28</span>
    </div>
  </article>
  <!-- 카드 반복 -->
</div>
```

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}

.card {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-body {
  padding: 20px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: #222;
}

.card-desc {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.card-date {
  font-size: 13px;
  color: #999;
}
```

**판단**: 카드 레이아웃은 Grid가 훨씬 편하다. `repeat(auto-fill, minmax())`조합 하나로
반응형 격자 배치가 완성된다. Flexbox의 `flex-wrap: wrap`으로도 비슷한 결과를 낼 수 있지만,
마지막 행의 아이템 정렬 문제가 발생한다. Grid는 이런 문제가 없다.

#### 4-3. 대시보드 레이아웃

대시보드는 **사이드바, 헤더, 메인 콘텐츠, 위젯 영역** 등 여러 구역이 2차원으로 배치되는
복잡한 레이아웃이다.

**Grid 구현:**

```html
<div class="dashboard">
  <header class="dash-header">Dashboard Header</header>
  <nav class="dash-sidebar">
    <a href="#">대시보드</a>
    <a href="#">분석</a>
    <a href="#">설정</a>
  </nav>
  <main class="dash-main">
    <div class="widget-grid">
      <div class="widget widget-large">매출 차트</div>
      <div class="widget">방문자 수</div>
      <div class="widget">전환율</div>
      <div class="widget widget-wide">최근 주문 목록</div>
    </div>
  </main>
</div>
```

```css
.dashboard {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 60px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  min-height: 100vh;
}

.dash-header {
  grid-area: header;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  font-size: 18px;
  font-weight: 600;
}

.dash-sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 12px;
  background: #1e293b;
}

.dash-sidebar a {
  display: block;
  padding: 10px 16px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.dash-sidebar a:hover {
  background: #334155;
  color: #f1f5f9;
}

.dash-main {
  grid-area: main;
  padding: 24px;
  background: #f8fafc;
  overflow-y: auto;
}

/* 위젯 영역: Grid 안에 또 Grid */
.widget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 200px;
  gap: 20px;
}

.widget {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #475569;
}

.widget-large {
  grid-column: span 2;
  grid-row: span 2;
}

.widget-wide {
  grid-column: span 3;
}
```

**판단**: 대시보드처럼 복잡한 2차원 레이아웃은 Grid 외에는 선택지가 없다.
`grid-template-areas`로 전체 구조를 잡고, 내부 위젯 영역에서 다시 Grid를 중첩해서 사용하면
깔끔하게 구현할 수 있다. 사이드바 내부의 링크 나열에는 Flexbox를 썼다는 점도 주목하자.

---

### 5. 언제 뭘 써야 하는지 판단 기준

지금까지 살펴본 내용을 정리하면, 다음과 같은 판단 기준을 세울 수 있다.

**Flexbox를 선택해야 하는 경우:**

- 아이템을 한 줄(또는 한 열)로 나열할 때
- 아이템 간 간격과 정렬이 주된 관심사일 때
- 아이템의 크기가 콘텐츠에 따라 유동적으로 결정되어야 할 때
- 네비게이션, 버튼 그룹, 폼 입력 행, 카드 내부 레이아웃 등

**CSS Grid를 선택해야 하는 경우:**

- 행과 열을 동시에 제어해야 할 때
- 전체 페이지나 섹션의 골격(레이아웃 구조)을 잡을 때
- 아이템이 여러 행이나 열에 걸쳐야 할 때 (`span`)
- 카드 목록의 격자 배치, 대시보드, 갤러리, 폼 레이아웃 등

핵심은 간단하다. **"콘텐츠가 흐름을 결정하는가, 레이아웃이 흐름을 결정하는가?"**

- 콘텐츠가 크기를 결정하고 자연스럽게 흘러가야 한다면 -> **Flexbox**
- 레이아웃 구조가 먼저 정해지고 그 안에 콘텐츠를 배치한다면 -> **Grid**

---

### 6. 함께 쓰는 경우

실무에서는 Flexbox와 Grid를 양자택일하지 않는다. **대부분의 프로젝트에서 둘을 함께 사용**한다.
전형적인 패턴은 이렇다.

- **Grid**: 페이지 전체의 골격을 잡는다 (헤더, 사이드바, 메인, 푸터 영역)
- **Flexbox**: 각 영역 내부에서 아이템을 정렬한다 (헤더 안의 로고와 메뉴, 카드 안의 텍스트 배치 등)

아래는 실제 프로젝트에서 자주 볼 수 있는 조합 예시다.

```html
<div class="app-layout">
  <header class="app-header">
    <div class="logo">MyApp</div>
    <div class="header-actions">
      <input type="search" placeholder="검색..." class="search-input" />
      <button class="icon-btn">알림</button>
      <img src="avatar.jpg" alt="프로필" class="avatar" />
    </div>
  </header>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <a href="#" class="nav-item active">홈</a>
      <a href="#" class="nav-item">프로젝트</a>
      <a href="#" class="nav-item">메시지</a>
      <a href="#" class="nav-item">설정</a>
    </nav>
  </aside>
  <main class="app-main">
    <section class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">1,234</span>
        <span class="stat-label">총 방문자</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">567</span>
        <span class="stat-label">신규 가입</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">89%</span>
        <span class="stat-label">만족도</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">42</span>
        <span class="stat-label">진행 중 프로젝트</span>
      </div>
    </section>
  </main>
</div>
```

```css
/* 전체 레이아웃: Grid로 2차원 구조 잡기 */
.app-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 56px 1fr;
  grid-template-areas:
    "header header"
    "sidebar main";
  min-height: 100vh;
}

.app-header  { grid-area: header; }
.app-sidebar { grid-area: sidebar; }
.app-main    { grid-area: main; }

/* 헤더 내부: Flexbox로 1차원 정렬 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  width: 240px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

/* 사이드바 내부: Flexbox로 세로 나열 */
.app-sidebar {
  background: #1e293b;
  padding: 16px 12px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 16px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
}

.nav-item.active,
.nav-item:hover {
  background: #334155;
  color: #f1f5f9;
}

/* 메인 콘텐츠 내부: Grid로 통계 카드 격자 배치 */
.app-main {
  padding: 24px;
  background: #f8fafc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

/* 통계 카드 내부: Flexbox로 수직 중앙 정렬 */
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}
```

이 예시에서 사용된 레이아웃 도구를 정리하면 다음과 같다.

| 영역 | 사용한 도구 | 이유 |
|------|------------|------|
| 전체 페이지 골격 | Grid | 헤더, 사이드바, 메인 영역을 2차원으로 배치 |
| 헤더 내부 | Flexbox | 로고와 액션 버튼들을 한 줄로 정렬 |
| 사이드바 내부 | Flexbox | 메뉴 항목을 세로로 나열 |
| 통계 카드 격자 | Grid | 카드들을 반응형 격자로 배치 |
| 통계 카드 내부 | Flexbox | 숫자와 라벨을 수직 중앙 정렬 |

이처럼 **Grid는 뼈대, Flexbox는 살**이라고 생각하면 자연스럽다.

---

## 결론

CSS Grid와 Flexbox는 경쟁 관계가 아니라 **상호 보완 관계**다.

- **Flexbox**는 한 방향으로 흐르는 콘텐츠를 정렬하는 데 탁월하다.
- **CSS Grid**는 2차원 격자 위에 요소를 배치하는 데 탁월하다.
- 실무에서는 **Grid로 큰 구조를 잡고, Flexbox로 내부를 정리**하는 방식이 가장 자연스럽다.

어떤 도구를 선택할지 고민될 때는 이 질문을 던져보자.

> "이 레이아웃은 한 줄짜리인가, 아니면 행과 열이 모두 중요한가?"

한 줄이면 Flexbox, 격자면 Grid다. 그리고 대부분의 실제 UI에서는 둘 다 필요하다.
두 도구 모두 능숙하게 다룰 수 있다면, CSS 레이아웃에서 못 만들 화면은 거의 없다.
