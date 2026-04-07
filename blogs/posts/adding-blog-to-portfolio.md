# 포트폴리오 사이트에 블로그 기능 추가하기

## 서론

포트폴리오 사이트를 만들면서 한 가지 고민이 있었다. 프로젝트 목록과 자기소개만으로는 내가 어떤 생각을 하면서 개발하는 사람인지 보여주기 어렵다는 것이었다. 면접관이 내 포트폴리오를 볼 때, 단순히 "이런 걸 만들었습니다"보다는 **"이런 문제를 이렇게 해결했습니다"** 라는 과정을 보여주고 싶었다.

그래서 블로그 기능을 직접 만들기로 했다.

물론 Velog나 티스토리 같은 플랫폼을 쓸 수도 있었다. 하지만 몇 가지 이유로 직접 구현하는 쪽을 선택했다.

- **포트폴리오와 한 곳에서 관리**하고 싶었다. 외부 링크로 이동하는 순간 이탈률이 올라간다.
- 블로그 시스템을 직접 만드는 것 자체가 **프론트엔드 역량을 보여주는 프로젝트**가 된다.
- 마크다운으로 글을 쓰고, Git으로 버전 관리하는 워크플로우가 마음에 들었다.
- 외부 서비스에 의존하지 않으니 **커스터마이징이 자유롭다**.

결론부터 말하면, 백엔드 없이 순수 HTML/CSS/JavaScript만으로 꽤 쓸만한 블로그 시스템을 만들 수 있었다. 이 글에서는 그 과정을 처음부터 끝까지 기록해본다.

---

## 본론

### 1. 기술 스택 선택: 정적 사이트 + 마크다운

블로그를 구현하는 방법은 정말 다양하다. Next.js + MDX, Gatsby, Hugo, Jekyll 등등. 하지만 내 포트폴리오 사이트는 이미 바닐라 HTML/CSS/JS로 만들어져 있었기 때문에, 기존 스택과 일관성을 유지하는 게 중요했다.

최종적으로 선택한 구성은 이렇다.

| 역할 | 기술 |
|------|------|
| 마크업 | HTML5 |
| 스타일링 | CSS3 (커스텀) |
| 로직 | Vanilla JavaScript |
| 마크다운 렌더링 | marked.js |
| 코드 하이라이팅 | highlight.js |
| 메타데이터 관리 | posts.json (정적 JSON) |
| 배포 | GitHub Pages |

프레임워크를 쓰지 않은 이유는 단순하다. 블로그 하나 때문에 빌드 파이프라인을 도입하고 싶지 않았다. `.md` 파일 하나 추가하고 `posts.json`에 한 줄 넣으면 끝나는 구조가 이상적이었다.

### 2. 폴더 구조 설계

프로젝트의 블로그 관련 폴더 구조는 다음과 같이 잡았다.

```
portfolios/
├── blogs/
│   ├── images/              # 블로그 썸네일 이미지
│   │   ├── css-grid-vs-flexbox.jpg
│   │   ├── rest-api-common-mistakes.jpg
│   │   └── ...
│   ├── pages/               # 블로그 관련 HTML 페이지
│   │   ├── blogs.html       # 블로그 목록 페이지
│   │   └── post.html        # 개별 글 뷰어 페이지
│   └── posts/               # 실제 콘텐츠
│       ├── posts.json        # 메타데이터 목록
│       ├── css-grid-vs-flexbox.md
│       ├── adding-blog-to-portfolio.md
│       └── ...
├── assets/
│   ├── css/
│   │   ├── common.css
│   │   └── blog.css
│   └── js/
│       ├── common.js
│       └── blog.js
└── index.html
```

핵심 원칙은 **관심사의 분리**였다.

- `pages/`: 뷰(View) 역할. HTML 구조만 담당한다.
- `posts/`: 데이터 역할. 마크다운 파일과 메타데이터 JSON이 들어간다.
- `images/`: 정적 자산. 썸네일 이미지를 관리한다.
- `assets/js/blog.js`: 로직 역할. 카드 생성, 필터링, 검색 등 동적 기능을 담당한다.

이렇게 나누니까 글을 추가할 때 건드려야 하는 파일이 딱 두 개뿐이다. `.md` 파일 하나, `posts.json`에 항목 하나. 나머지는 자동으로 처리된다.

### 3. posts.json 메타데이터 관리

블로그에서 메타데이터 관리는 생각보다 중요하다. 목록 페이지에서 카드를 그리려면 제목, 날짜, 카테고리, 태그, 요약 등이 필요한데, 이걸 매번 마크다운 파일을 파싱해서 추출하면 비효율적이다.

그래서 `posts.json`이라는 별도의 메타데이터 파일을 만들었다.

```json
[
  {
    "slug": "css-grid-vs-flexbox",
    "title": "CSS Grid vs Flexbox, 언제 무엇을 써야 할까",
    "date": "2026-03-15",
    "category": "Frontend",
    "tags": ["CSS", "Grid", "Flexbox", "레이아웃"],
    "thumbnail": "/blogs/images/css-grid-vs-flexbox.jpg",
    "summary": "CSS Grid와 Flexbox의 차이점을 비교하고, 실제 프로젝트에서 어떤 상황에 어떤 것을 선택해야 하는지 정리했습니다."
  },
  {
    "slug": "adding-blog-to-portfolio",
    "title": "포트폴리오 사이트에 블로그 기능 추가하기",
    "date": "2026-04-07",
    "category": "Dev Log",
    "tags": ["포트폴리오", "블로그", "JavaScript", "마크다운"],
    "thumbnail": "/blogs/images/adding-blog-to-portfolio.jpg",
    "summary": "백엔드 없이 순수 HTML/CSS/JS만으로 마크다운 기반 블로그 시스템을 구축한 과정을 기록합니다."
  }
]
```

각 필드의 역할을 정리하면 이렇다.

- **slug**: URL에 사용되는 고유 식별자. 마크다운 파일명과 동일하게 맞춘다. (`slug.md`)
- **title**: 카드와 상세 페이지에 표시되는 글 제목.
- **date**: 정렬 기준이 되는 작성일. ISO 8601 형식(`YYYY-MM-DD`)을 사용한다.
- **category**: 카테고리 필터링에 사용된다. `Frontend`, `Backend`, `Dev Log` 등.
- **tags**: 카드 하단에 태그 뱃지로 표시된다. 배열 형태.
- **thumbnail**: 카드에 표시되는 썸네일 이미지 경로.
- **summary**: 카드에 표시되는 짧은 요약. 검색 대상이기도 하다.

데이터베이스 없이 JSON 파일 하나로 관리하는 이 방식이, 정적 사이트에서는 오히려 가장 실용적이었다. Git diff로 변경 이력도 추적되고, 별도의 관리 도구 없이 텍스트 에디터만 있으면 된다.

### 4. 블로그 목록 페이지: 카드 UI 동적 생성

블로그 목록 페이지(`blogs.html`)의 HTML 구조는 의도적으로 비워뒀다. 카드는 전부 JavaScript로 동적 생성한다.

```html
<!DOCTYPE html>
<html>
<body>
    <link rel="stylesheet" href="/assets/css/common.css">
    <link rel="stylesheet" href="/assets/css/blog.css">
    <div id="header"></div>

    <main>
        <h2 class="title">Blogs</h2>
        <section class="blog-filter-container">
            <div class="category-filter">
                <button class="category-button active" data-category="all">All</button>
                <button class="category-button" data-category="Frontend">Frontend</button>
                <button class="category-button" data-category="Backend">Backend</button>
                <button class="category-button" data-category="Dev Log">Dev Log</button>
            </div>
            <div class="search-container">
                <input type="text" id="search-input" placeholder="검색어를 입력하세요.">
                <button id="search-button">
                    <img src="/assets/img/search.svg" alt="검색" class="search-icon">
                </button>
            </div>
        </section>

        <!-- 이 영역이 JS에 의해 채워진다 -->
        <section class="blog-card-container"></section>
    </main>

    <script src="/assets/js/common.js"></script>
    <script src="/assets/js/blog.js"></script>
</body>
</html>
```

그리고 `blog.js`에서 카드를 생성하는 함수는 이렇게 작성했다.

```javascript
let allPosts = [];
let currentCategory = 'all';
let currentSearch = '';

// 카드 HTML 생성
function createCardHTML(post) {
  return `
    <article class="blog-card" data-slug="${post.slug}">
      <img class="blog-card-thumbnail"
           src="${post.thumbnail}"
           alt="${post.title}"
           onerror="this.style.background='#e0e0e0'; this.style.display='block';">
      <div class="blog-card-content">
        <span class="blog-card-category">${post.category}</span>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-description">${post.summary}</p>
        <div class="blog-card-tags">
          ${post.tags.map(tag => `<span class="blog-card-tag">${tag}</span>`).join('')}
        </div>
        <span class="blog-card-date">${post.date}</span>
      </div>
    </article>
  `;
}
```

템플릿 리터럴을 활용하면 JSX 없이도 꽤 깔끔하게 HTML을 생성할 수 있다. `data-slug` 속성에 슬러그를 넣어두면, 카드 클릭 시 해당 글의 상세 페이지로 라우팅할 수 있다.

카드 클릭 이벤트는 `renderCards()` 함수 내부에서 바인딩했다.

```javascript
container.querySelectorAll('.blog-card').forEach(card => {
  card.addEventListener('click', () => {
    const slug = card.dataset.slug;
    window.location.href = `/blogs/pages/post.html?slug=${slug}`;
  });
});
```

쿼리 파라미터로 `slug`를 넘기고, `post.html`에서 이 값을 읽어 해당 마크다운 파일을 로드하는 구조다.

### 5. marked.js로 마크다운 렌더링

개별 글 뷰어(`post.html`)에서는 두 가지 데이터를 비동기로 불러온다.

1. `posts.json`에서 메타데이터 (제목, 카테고리, 날짜, 태그)
2. `{slug}.md` 파일에서 본문 콘텐츠

```javascript
const slug = new URLSearchParams(window.location.search).get('slug');

// marked.js 설정: 코드 하이라이팅 연동
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// 1) 메타데이터 로드
fetch('/blogs/posts/posts.json')
  .then(res => res.json())
  .then(posts => {
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      document.querySelector('.post-body').innerHTML = '<p>글을 찾을 수 없습니다.</p>';
      return;
    }
    document.querySelector('.post-title').textContent = post.title;
    document.querySelector('.post-category').textContent = post.category;
    document.querySelector('.post-date').textContent = post.date;
    document.querySelector('.post-tags').innerHTML =
      post.tags.map(t => `<span class="blog-card-tag">${t}</span>`).join('');
  });

// 2) 마크다운 본문 로드 + 렌더링
fetch(`/blogs/posts/${slug}.md`)
  .then(res => {
    if (!res.ok) throw new Error('Not found');
    return res.text();
  })
  .then(md => {
    document.querySelector('.post-body').innerHTML = marked.parse(md);
    hljs.highlightAll();
  })
  .catch(() => {
    document.querySelector('.post-body').innerHTML = '<p>글 내용을 불러올 수 없습니다.</p>';
  });
```

`marked.js`는 CDN으로 가져오고 있다. 별도의 빌드 과정 없이 `<script>` 태그 하나면 사용할 수 있어서 정적 사이트와 궁합이 좋다. `highlight.js`도 마찬가지로 CDN에서 로드하고, `marked.setOptions()`에서 코드 블록이 렌더링될 때 자동으로 하이라이팅이 적용되도록 설정했다.

에러 처리도 신경 썼다. `posts.json`에서 슬러그를 찾지 못하거나, 마크다운 파일 fetch가 실패하면 사용자에게 안내 메시지를 보여준다. 이런 방어 코드가 없으면 빈 화면만 덩그러니 나오는데, UX 측면에서 좋지 않다.

상세 페이지의 HTML 구조는 이렇게 간결하게 유지했다.

```html
<article class="post-container">
    <a href="/blogs/pages/blogs.html" class="post-back">&larr; 목록으로</a>
    <div class="post-meta">
        <span class="post-category"></span>
        <span class="post-date"></span>
    </div>
    <h1 class="post-title"></h1>
    <div class="post-tags"></div>
    <hr class="post-divider">
    <div class="post-body"></div>
</article>
```

비어있는 요소들이 JavaScript에 의해 채워지는 구조다. 서버 사이드 렌더링이 없으니 SEO에는 불리하지만, 포트폴리오 블로그의 주요 독자는 면접관이나 동료 개발자이고 이들은 대부분 직접 링크를 통해 접근하므로, 이 트레이드오프는 수용 가능하다고 판단했다.

### 6. 카테고리 필터링과 검색 구현

블로그 글이 쌓이면 원하는 글을 찾기 어려워진다. 그래서 카테고리 필터링과 키워드 검색을 구현했다.

#### 카테고리 필터링

카테고리 버튼에 `data-category` 속성을 부여하고, 클릭 시 해당 카테고리로 필터링한다.

```javascript
document.querySelectorAll('.category-button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.category-button.active').classList.remove('active');
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    renderCards();
  });
});
```

활성 상태인 버튼에 `.active` 클래스를 토글하고, `currentCategory` 상태를 갱신한 뒤 `renderCards()`를 호출한다. 심플한 상태 관리다.

#### 키워드 검색

검색은 제목(`title`)과 요약(`summary`)을 대상으로 한다.

```javascript
function doSearch() {
  currentSearch = document.getElementById('search-input').value;
  renderCards();
}

document.getElementById('search-button').addEventListener('click', doSearch);
document.getElementById('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});
```

엔터 키와 버튼 클릭 모두 지원한다. 실시간 검색(input 이벤트)도 고려했지만, 글 수가 많지 않은 시점에서는 오버 엔지니어링이라 판단하고 명시적 검색 방식을 택했다.

#### 필터링 + 검색 통합 렌더링

핵심은 `renderCards()` 함수다. 카테고리와 검색어를 동시에 적용해서 필터링한다.

```javascript
function renderCards() {
  const container = document.querySelector('.blog-card-container');
  const filtered = allPosts
    .filter(post => {
      const matchCategory = currentCategory === 'all' || post.category === currentCategory;
      const query = currentSearch.toLowerCase();
      const matchSearch = !query ||
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = filtered.length
    ? filtered.map(createCardHTML).join('')
    : '<p style="grid-column:1/-1; text-align:center; color:#aaa; padding:60px 0;">검색 결과가 없습니다.</p>';

  // 카드 클릭 이벤트 재바인딩
  container.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      window.location.href = `/blogs/pages/post.html?slug=${slug}`;
    });
  });
}
```

포인트가 몇 가지 있다.

1. **카테고리와 검색의 AND 조건**: 둘 다 만족해야 표시된다. "Frontend" 카테고리에서 "CSS"를 검색하면 Frontend 카테고리의 CSS 관련 글만 나온다.
2. **날짜 역순 정렬**: 최신 글이 먼저 보이도록 `sort()`를 적용한다.
3. **결과 없음 처리**: 필터링 결과가 비면 안내 메시지를 표시한다. 이 메시지에 `grid-column: 1/-1`을 줘서 그리드 레이아웃 전체 너비를 차지하도록 했다.
4. **이벤트 재바인딩**: `innerHTML`로 카드를 다시 그리면 기존 이벤트 리스너가 사라진다. 그래서 매번 렌더링 후 다시 바인딩해야 한다.

### 7. 초기 데이터 로드

페이지가 로드되면 `posts.json`을 fetch해서 전역 변수 `allPosts`에 저장하고, 첫 렌더링을 수행한다.

```javascript
fetch('/blogs/posts/posts.json')
  .then(res => res.json())
  .then(posts => {
    allPosts = posts;
    renderCards();
  });
```

간단하지만, 이 흐름 덕분에 이후의 필터링과 검색에서는 추가 네트워크 요청 없이 메모리에 있는 데이터만으로 동작한다. 글이 수백 개 단위로 늘어나기 전까지는 이 방식으로 충분하다.

---

## 결론

### 배운 점

이번에 블로그 기능을 직접 만들면서 몇 가지 인사이트를 얻었다.

**첫째, 프레임워크 없이도 충분히 구조적인 코드를 짤 수 있다.** 관심사를 분리하고, 데이터와 뷰를 명확히 나누면 바닐라 JS로도 유지보수 가능한 코드가 나온다. 오히려 프레임워크의 추상화 없이 직접 DOM을 다루다 보니, 브라우저의 동작 원리를 더 깊게 이해하게 됐다.

**둘째, JSON 기반 메타데이터 관리의 실용성.** 데이터베이스를 쓰면 편하겠지만, 정적 사이트에서는 JSON 파일이 오히려 더 적합하다. Git으로 버전 관리가 되고, 배포가 단순하고, 별도 서버 비용이 없다.

**셋째, 에러 처리의 중요성.** 정적 파일 기반이라 파일이 없으면 404가 뜬다. 이런 상황을 graceful하게 처리하는 코드를 넣어야 사용자 경험이 깨지지 않는다.

**넷째, 마크다운의 생산성.** 글을 쓰는 데 집중할 수 있다. HTML로 직접 글을 쓴다고 생각하면 끔찍한데, 마크다운은 문법이 직관적이라 내용에만 집중할 수 있다.

### 개선 계획

완성된 결과물에 만족하지만, 앞으로 개선할 점도 있다.

- **페이지네이션**: 글이 많아지면 한 페이지에 모두 보여주는 건 한계가 있다. 무한 스크롤이나 페이지네이션을 추가할 예정이다.
- **태그 기반 필터링**: 현재는 카테고리만 필터링할 수 있는데, 태그로도 필터링할 수 있으면 좋겠다.
- **목차(TOC) 자동 생성**: 긴 글에서는 목차가 있으면 독자가 원하는 섹션으로 빠르게 이동할 수 있다. 마크다운의 `#` 헤딩을 파싱해서 사이드바에 목차를 만드는 기능을 구현할 계획이다.
- **다크 모드 지원**: 개발자 블로그인 만큼 다크 모드는 사실상 필수다. CSS 변수를 활용하면 비교적 쉽게 구현할 수 있을 것 같다.
- **SEO 개선**: 현재 CSR 방식이라 검색 엔진 최적화가 약하다. 빌드 타임에 HTML을 프리렌더링하는 스크립트를 만들거나, `<meta>` 태그를 동적으로 주입하는 방법을 고려하고 있다.
- **댓글 기능**: GitHub Issues 기반의 utterances나 giscus 같은 서비스를 연동하면 백엔드 없이도 댓글 기능을 추가할 수 있다.

### 마무리

작은 기능이라고 생각했는데, 막상 만들어보니 폴더 구조 설계부터 데이터 관리, UI 렌더링, 사용자 인터랙션까지 프론트엔드의 다양한 영역을 경험할 수 있었다. 프레임워크에 의존하지 않고 바닐라로 구현해봤기 때문에, 나중에 React나 Next.js로 리팩토링할 때도 "왜 이 기능이 필요한지" 체감할 수 있을 것이다.

무엇보다 **자기가 만든 플랫폼에서 자기 이야기를 쓰는 것**은 꽤 특별한 경험이다. 이 글이 그 첫 번째 기록이다.
