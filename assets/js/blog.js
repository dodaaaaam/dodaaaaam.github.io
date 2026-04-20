// blogs.html 전용 — 요소가 없으면 실행하지 않음
if (document.querySelector('.blog-card-container')) {

  const CATEGORY_SUBS = {
    "Problem Solving": ["Solvings", "Patterns & Data Structures"],
    "Development": ["Frontend", "Backend", "DevOps"],
    "Computer Science": ["OS", "Network", "DB"]
  };

  let allPosts = [];
  let currentCategory = 'all';
  let currentSearch = '';

  // URL 쿼리에서 카테고리 파라미터 읽기
  const urlCategory = new URLSearchParams(window.location.search).get('category');
  if (urlCategory) {
    currentCategory = urlCategory;
  }

  // 카드 HTML 생성
  function createCardHTML(post) {
    return `
      <article class="blog-card" data-slug="${post.slug}">
        <img class="blog-card-thumbnail" src="${post.thumbnail || '/blogs/images/bg.png'}" alt="${post.title}" onerror="this.style.background='#e0e0e0'; this.style.display='block';">
        <div class="blog-card-content_con">
        <div class="blog-card-content">
          <span class="blog-card-category">${post.category}</span>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-description">${post.summary}</p>
        </div>
        <div class="blog-card-footer">
            <div class="blog-card-tags">
              ${post.tags.map(tag => `<span class="blog-card-tag">${tag}</span>`).join('')}
            </div>
            <span class="blog-card-date">${post.date}</span>
          </div>
        </div>
      </article>
    `;
  }

  // 현재 카테고리가 post에 매칭되는지 판정
  function matchCategory(post) {
    if (currentCategory === 'all') return true;
    if (post.category === currentCategory) return true;
    const subs = CATEGORY_SUBS[currentCategory];
    return subs ? subs.includes(post.category) : false;
  }

  // 필터링 + 렌더링
  function renderCards() {
    const container = document.querySelector('.blog-card-container');
    const filtered = allPosts
      .filter(post => {
        const query = currentSearch.toLowerCase();
        const matchSearch = !query ||
          post.title.toLowerCase().includes(query) ||
          post.summary.toLowerCase().includes(query);
        return matchCategory(post) && matchSearch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = filtered.length
      ? filtered.map(createCardHTML).join('')
      : '<p style="grid-column: 1/-1; text-align: center; color: #aaa; padding: 60px 0;">검색 결과가 없습니다.</p>';

    // 카드 클릭 이벤트
    container.querySelectorAll('.blog-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `/blogs/pages/post.html?slug=${card.dataset.slug}`;
      });
    });
  }

  // 카테고리 버튼 활성화
  function activateCategoryButton() {
    document.querySelectorAll('.category-button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.category === currentCategory) {
        btn.classList.add('active');
      }
    });
  }

  // 서브 카테고리 렌더
  function renderSubcategories() {
    const section = document.querySelector('.blog-subfilter-container');
    const filter = section.querySelector('.subcategory-filter');
    const subs = CATEGORY_SUBS[currentCategory];
    if (!subs) {
      section.hidden = true;
      filter.innerHTML = '';
      return;
    }
    section.hidden = false;
    filter.innerHTML = subs
      .map(sub => `<button class="category-button" data-category="${sub}">${sub}</button>`)
      .join('');
    filter.querySelectorAll('.category-button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        filter.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards();
      });
    });
  }

  // 카테고리 버튼 클릭
  document.querySelectorAll('.blog-filter-container .category-button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      activateCategoryButton();
      renderSubcategories();
      renderCards();
    });
  });

  // 검색
  function doSearch() {
    currentSearch = document.getElementById('search-input').value;
    renderCards();
  }

  document.getElementById('search-button').addEventListener('click', doSearch);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // 초기 로드
  fetch('/blogs/posts/posts.json')
    .then(res => res.json())
    .then(posts => {
      allPosts = posts;
      activateCategoryButton();
      renderSubcategories();
      renderCards();
    });
}
