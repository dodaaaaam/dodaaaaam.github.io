// projects.html 전용
if (document.querySelector('.projects-container')) {

  function createProjectCard(project) {
    return `
      <div class="project-card" data-link="${project.link}">
        <img class="project-card-thumbnail" src="${project.thumbnail}" alt="${project.title}" onerror="this.style.background='var(--color-border)'">
        <div class="project-card-info">
          <span class="project-card-period">${project.period}</span>
          <h3 class="project-card-title">${project.title}</h3>
          <p class="project-card-summary">${project.summary}</p>
          <p class="project-card-description">${project.description}</p>
          <div class="project-card-tags">
            ${project.tags.map(tag => `<span class="project-card-tag">${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  fetch('/projects/posts/projects.json')
    .then(res => res.json())
    .then(projects => {
      const container = document.querySelector('.projects-container');
      container.innerHTML = projects.map(createProjectCard).join('');

      container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
          window.location.href = card.dataset.link;
        });
      });
    });
}
