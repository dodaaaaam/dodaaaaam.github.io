// 헤더 로드
fetch('/components/header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('header').innerHTML = data;

    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-menu a');

    links.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');

      if (
        (href === '/index.html' && (currentPath === '/' || currentPath.includes('index.html'))) ||
        (href.includes('/blogs') && currentPath.includes('/blogs')) ||
        (href.includes('/projects') && currentPath.includes('/projects'))
      ) {
        link.classList.add('active');
      }
    });
  });

// 스크롤 등장/퇴장 애니메이션
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
