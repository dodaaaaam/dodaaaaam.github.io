// 카테고리 공유 헬퍼 — 여러 페이지에서 <script src="/assets/js/categories.js"></script>로 로드
// 사용 예: const cats = await Categories.load(); Categories.matches(post, 'Development')
window.Categories = {
  _data: null,
  _loading: null,

  // categories.json을 로드 (이미 로드됐으면 캐시 반환)
  load() {
    if (this._data) return Promise.resolve(this._data);
    if (this._loading) return this._loading;
    this._loading = fetch('/blogs/posts/categories.json')
      .then(res => res.json())
      .then(data => {
        this._data = data;
        return data;
      });
    return this._loading;
  },

  // 로드된 전체 목록
  all() {
    return this._data || [];
  },

  // 이름으로 카테고리 엔트리 찾기
  find(name) {
    return this.all().find(c => c.name === name) || null;
  },

  // parent의 서브 배열 (없으면 null)
  subsOf(name) {
    const c = this.find(name);
    return c && Array.isArray(c.subs) ? c.subs : null;
  },

  // 해당 이름(sub)이 속한 parent 이름 (없으면 null)
  parentOf(subName) {
    const c = this.all().find(c => c.subs && c.subs.includes(subName));
    return c ? c.name : null;
  },

  // selectedCategory가 post에 매칭되는지 판정
  // - 'all': 항상 true
  // - parent 선택: parent 본인 또는 parent의 subs 중 하나와 post.category가 일치하면 true
  // - sub 선택: post.category가 정확히 일치하면 true
  matches(post, selectedCategory) {
    if (selectedCategory === 'all') return true;
    if (post.category === selectedCategory) return true;
    const subs = this.subsOf(selectedCategory);
    return subs ? subs.includes(post.category) : false;
  }
};
