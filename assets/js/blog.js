// blogs.html 전용 — 요소가 없으면 실행하지 않음
if (document.querySelector('.blog-card-container')) {

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

  // 필터링 + 렌더링
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

  // 카테고리 버튼 클릭
  document.querySelectorAll('.category-button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      activateCategoryButton();
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
      renderCards();
    });
}
