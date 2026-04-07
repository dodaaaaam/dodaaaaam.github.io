fetch('/components/header.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('header').innerHTML = data;

    // 현재 주소 가져오기 
    const currentPath = window.location.pathname;

    // nav 메뉴 링크들 가져오기
    const links = document.querySelectorAll('.nav-menu a');

    // 각 링크와 현재 주소 비교해서 active 클래스 추가
    links.forEach(link => {
      link.classList.remove('active'); // 안전하게 초기화

      const href = link.getAttribute('href');

      if (
        (href === '/index.html' && currentPath === '/') ||
        (href === '/index.html' && currentPath.includes('index.html')) ||
        (href.includes('/blogs') && currentPath.includes('/blogs')) ||
        (href.includes('/projects') && currentPath.includes('/projects'))
      ) {
        link.classList.add('active');
      }
    });
  });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});