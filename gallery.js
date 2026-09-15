// ================= GALLERY DATA =================
// One entry per project. To add a new project: copy an object below and
// change its values. To add more photos to an existing project, add more
// paths to its "images" array (e.g. "images/arc-01-modern-residence-2.jpg") -
// name new photos like that so it's obvious which project/order they belong to.
const PROJECTS = [
  {
    id: 'arc-01',
    category: 'arc',
    code: 'ARC / 01',
    title: 'Project title',
    meta: 'Residential - Coming soon',
    images: ['images/arc-01-modern-residence.jpg']
  },
  {
    id: 'urb-02',
    category: 'urb',
    code: 'URB / 02',
    title: 'Project title',
    meta: 'Urban / Public - Coming soon',
    images: ['images/urb-02-discovery-church.jpg']
  },
  {
    id: 'evt-03',
    category: 'evt',
    code: 'EVT / 03',
    title: 'Project title',
    meta: 'Event Space - Coming soon',
    images: ['images/evt-03-durban-sands.jpg']
  },
  {
    id: 'dir-04',
    category: 'dir',
    code: 'DIR / 04',
    title: 'New work coming soon',
    meta: 'Creative Direction',
    images: []
  },
  {
    id: 'obj-05',
    category: 'obj',
    code: 'OBJ / 05',
    title: 'New work coming soon',
    meta: 'Furniture & Objects',
    images: []
  }
];

(function(){
  const grid = document.getElementById('gallery-grid');
  if(!grid) return;

  // ---------- Render grid ----------
  PROJECTS.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'gallery-card' + (project.images.length ? '' : ' is-empty');
    card.dataset.category = project.category;
    card.dataset.index = index;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', project.title + ', ' + project.code);

    const cover = project.images[0];
    card.innerHTML = `
      ${cover ? `<img src="${cover}" alt="${project.title}">` : ''}
      <div class="gc-body">
        <span class="gc-code">${project.code}</span>
        <h3>${project.title}</h3>
        <span class="gc-meta">${project.meta}</span>
      </div>
    `;

    card.addEventListener('click', () => openLightbox(index));
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openLightbox(index);
      }
    });

    grid.appendChild(card);
  });

  // ---------- Empty-state message when a filter has zero results ----------
  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'gallery-empty-msg';
  emptyMsg.textContent = 'No projects in this category yet - check back soon.';
  grid.after(emptyMsg);

  // ---------- Filtering ----------
  const filterButtons = document.querySelectorAll('.gfilter');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected','true');

      const filter = btn.dataset.filter;
      let visibleCount = 0;
      document.querySelectorAll('.gallery-card').forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !show);
        if(show) visibleCount++;
      });
      emptyMsg.classList.toggle('is-visible', visibleCount === 0);
    });
  });

  // ---------- Lightbox ----------
  const lightbox = document.getElementById('lightbox');
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lb-close');
  const prevBtn = document.getElementById('lb-prev');
  const nextBtn = document.getElementById('lb-next');
  const lbImage = document.getElementById('lb-image');
  const lbEmpty = document.getElementById('lb-empty');
  const lbCode = document.getElementById('lb-code');
  const lbTitle = document.getElementById('lb-title');
  const lbCount = document.getElementById('lb-count');

  let currentProject = null;
  let currentImageIndex = 0;
  let lastFocusedEl = null;

  function openLightbox(projectIndex){
    currentProject = PROJECTS[projectIndex];
    currentImageIndex = 0;
    lastFocusedEl = document.activeElement;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocusedEl) lastFocusedEl.focus();
  }

  function renderLightbox(){
    const images = currentProject.images;
    const hasImages = images.length > 0;

    lbImage.style.display = hasImages ? 'block' : 'none';
    lbEmpty.style.display = hasImages ? 'none' : 'block';

    if(hasImages){
      lbImage.src = images[currentImageIndex];
      lbImage.alt = currentProject.title + ' - image ' + (currentImageIndex + 1);
    }

    const showArrows = images.length > 1;
    prevBtn.hidden = !showArrows;
    nextBtn.hidden = !showArrows;

    lbCode.textContent = currentProject.code;
    lbTitle.textContent = currentProject.title;
    lbCount.textContent = hasImages ? (currentImageIndex + 1) + ' / ' + images.length : '';
  }

  function showPrev(){
    if(!currentProject || currentProject.images.length < 2) return;
    currentImageIndex = (currentImageIndex - 1 + currentProject.images.length) % currentProject.images.length;
    renderLightbox();
  }

  function showNext(){
    if(!currentProject || currentProject.images.length < 2) return;
    currentImageIndex = (currentImageIndex + 1) % currentProject.images.length;
    renderLightbox();
  }

  // Clicking the backdrop (anywhere outside the box) closes the lightbox.
  backdrop.addEventListener('click', closeLightbox);
  // Clicking inside the box itself must NOT close it.
  document.querySelector('.lightbox-box').addEventListener('click', (e) => e.stopPropagation());

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  document.addEventListener('keydown', (e) => {
    if(!lightbox.classList.contains('is-open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowLeft') showPrev();
    if(e.key === 'ArrowRight') showNext();
  });
})();
