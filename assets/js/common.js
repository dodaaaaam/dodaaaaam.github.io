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