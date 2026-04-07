let allPosts = [];
let currentCategory = 'all';
let currentSearch = '';

// 카드 HTML 생성
function createCardHTML(post) {
  return `
    <article class="blog-card" data-slug="${post.slug}">
      <img class="blog-card-thumbnail" src="${post.thumbnail}" alt="${post.title}" onerror="this.style.background='#e0e0e0'; this.style.display='block';">
      <div class="blog-card-content">
        <span class="blog-card-category">${post.category}</span>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-description">${post.summary}</p>
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
      const slug = card.dataset.slug;
      window.location.href = `/blogs/pages/post.html?slug=${slug}`;
    });
  });
}

// 카테고리 버튼
document.querySelectorAll('.category-button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.category-button.active').classList.remove('active');
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
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
    renderCards();
  });
