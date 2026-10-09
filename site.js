const filters = [...document.querySelectorAll('.filter-button')];
const publications = [...document.querySelectorAll('.publication')];
const publicationGroups = [...document.querySelectorAll('.publication-group')];
const count = document.getElementById('publication-count');

for (const button of filters) {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
    let visible = 0;
    for (const article of publications) {
      article.hidden = category !== 'all' && !article.dataset.category.split(' ').includes(category);
      if (!article.hidden) visible += 1;
    }
    for (const group of publicationGroups) {
      group.hidden = category !== 'all' && group.dataset.category !== category;
    }
    if (count) count.textContent = `${visible} ${visible === 1 ? 'paper' : 'papers'}`;
  });
}

const printButton = document.getElementById('print-cv');
if (printButton) printButton.addEventListener('click', () => window.print());

if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, {rootMargin: '-12% 0px -60% 0px'});
  for (const link of links) {
    const section = document.getElementById(link.hash.slice(1));
    if (section) observer.observe(section);
  }
}
