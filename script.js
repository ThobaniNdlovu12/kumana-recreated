  // Hero paragraph — types out, pauses, erases, and loops.
  // Skips the animation entirely for people with reduced-motion set; they just get the full static text.
  (function(){
    const el = document.getElementById('deck-text');
    if(!el) return;

    const fullText = "Kumana is a multidisciplinary creative studio rooted in architectural design. We design buildings, interiors, urban spaces, event environments, and creative concepts that shape how people gather, experience, and remember place.";

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefersReduced){
      el.textContent = fullText;
      return;
    }

    const typeSpeed = 28;    // ms per character while typing
    const eraseSpeed = 14;   // ms per character while erasing
    const holdFull = 2600;   // pause once fully typed
    const holdEmpty = 700;   // pause once fully erased

    let i = 0;
    let typing = true;

    function tick(){
      if(typing){
        i++;
        el.textContent = fullText.slice(0, i);
        if(i >= fullText.length){
          typing = false;
          setTimeout(tick, holdFull);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        i--;
        el.textContent = fullText.slice(0, i);
        if(i <= 0){
          typing = true;
          setTimeout(tick, holdEmpty);
          return;
        }
        setTimeout(tick, eraseSpeed);
      }
    }
    tick();
  })();


// ================= KUMANA STUDIO BACKGROUND ANIMATION =================
// Letters are drawn on a grid, block by block, tracing a continuous
// "snake" path through the shape — then un-drawn the same way, tail first.
// Random letter, size, color, and position each time; several run at once.
(function(){
  const canvas = document.getElementById('kumana-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#a49c8c', '#6f685c', '#c25a2a', '#e07a42', '#5c564e'];

  // 5x7 dot-matrix bitmaps, 1 = filled cell
  const FONT = {
    K: [
      [1,0,0,0,1],
      [1,0,0,1,0],
      [1,0,1,0,0],
      [1,1,0,0,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
      [1,0,0,0,1]
    ],
    U: [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0]
    ],
    M: [
      [1,0,0,0,1],
      [1,1,0,1,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1]
    ],
    A: [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1]
    ],
    N: [
      [1,0,0,0,1],
      [1,1,0,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1]
    ]
  };

  // Turn a bitmap into an ordered list of {row,col} cells that trace a
  // continuous boustrophedon ("snake") path — left-to-right, then
  // right-to-left on the next row, and so on — visiting only filled cells.
  function buildSnakePath(bitmap){
    const path = [];
    bitmap.forEach((rowCells, row) => {
      const cols = [...rowCells.keys()];
      if(row % 2 === 1) cols.reverse();
      cols.forEach(col => {
        if(rowCells[col]) path.push({ row, col });
      });
    });
    return path;
  }

  const LETTER_KEYS = Object.keys(FONT);
  const PATHS = {};
  LETTER_KEYS.forEach(k => { PATHS[k] = buildSnakePath(FONT[k]); });

  const MAX_PARTICLES   = 5;
  const SPAWN_CHANCE    = 0.02;
  let particles = [];

  function resize(){
    const section = document.getElementById('studio');
    if(!section) return;
    canvas.width  = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }

  function spawnLetter(){
    const key   = LETTER_KEYS[Math.floor(Math.random() * LETTER_KEYS.length)];
    const path  = PATHS[key];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // random cell size -> random overall letter size
    const cell = 6 + Math.random() * 20; // 6px – 26px per grid cell
    const gridW = 5, gridH = 7;
    const letterW = gridW * cell;
    const letterH = gridH * cell;

    const x = Math.random() * Math.max(1, canvas.width  - letterW);
    const y = Math.random() * Math.max(1, canvas.height - letterH);

    return {
      path, cell, color, x, y,
      state: 'growing',      // growing -> holding -> shrinking -> done
      head: 0,                // how many cells revealed from the start
      tail: 0,                // how many cells removed from the start
      growSpeed: 0.35 + Math.random() * 0.5,
      shrinkSpeed: 0.35 + Math.random() * 0.5,
      hold: 0,
      holdFor: 25 + Math.random() * 45
    };
  }

  function drawParticle(p){
    const gap = Math.max(1, p.cell * 0.12);
    const size = p.cell - gap;
    ctx.fillStyle = p.color;
    for(let i = Math.floor(p.tail); i < Math.floor(p.head); i++){
      const { row, col } = p.path[i];
      ctx.fillRect(
        p.x + col * p.cell,
        p.y + row * p.cell,
        size, size
      );
    }
  }

  function stepParticle(p){
    if(p.state === 'growing'){
      p.head += p.growSpeed;
      if(p.head >= p.path.length){
        p.head = p.path.length;
        p.state = 'holding';
      }
    } else if(p.state === 'holding'){
      p.hold++;
      if(p.hold >= p.holdFor) p.state = 'shrinking';
    } else if(p.state === 'shrinking'){
      p.tail += p.shrinkSpeed;
      if(p.tail >= p.path.length) p.state = 'done';
    }
  }

  function tick(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(particles.length < MAX_PARTICLES && Math.random() < SPAWN_CHANCE){
      particles.push(spawnLetter());
    }

    particles = particles.filter(p => p.state !== 'done');
    for(const p of particles){
      stepParticle(p);
      drawParticle(p);
  }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  for(let i = 0; i < 3; i++) particles.push(spawnLetter());
  tick();
})();


// ================= SERVICES CAROUSEL =================
// Now a native horizontally-scrollable strip (see .carousel-outer in style.css) — no JS needed.


// ================= BECOME A CLIENT — MODAL FORM =================
(function(){
  const overlay  = document.getElementById('client-modal-overlay');
  const openBtn  = document.getElementById('become-client-btn');
  const closeBtn = document.getElementById('client-modal-close');
  const form     = document.getElementById('client-form');
  const status   = document.getElementById('cf-status');
  if(!overlay || !openBtn || !form) return;

  let lastFocused = null;

  function openModal(){
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstField = form.querySelector('#cf-name');
    if(firstField) firstField.focus();
  }

  function closeModal(){
    overlay.hidden = true;
    document.body.style.overflow = '';
    if(lastFocused) lastFocused.focus();
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  // Single-select pill groups (project type, discipline)
  const groups = form.querySelectorAll('.quick-picks[data-group]');
  groups.forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-pick');
      if(!btn) return;
      group.querySelectorAll('.quick-pick').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      group.dataset.selected = btn.dataset.value;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name       = form.querySelector('#cf-name').value.trim();
    const surname    = form.querySelector('#cf-surname').value.trim();
    const email      = form.querySelector('#cf-email').value.trim();
    const whatsapp   = form.querySelector('#cf-whatsapp').value.trim();
    const location   = form.querySelector('#cf-location').value;
    const projectType = form.querySelector('[data-group="project-type"]').dataset.selected || '';
    const discipline  = form.querySelector('[data-group="discipline"]').dataset.selected || '';

    if(!name || !surname || !email || !whatsapp || !location || !projectType || !discipline){
      status.textContent = 'Please fill in every field, and pick a project type and discipline, before sending.';
      status.className = 'form-status err';
      return;
    }

    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled = true;
    status.textContent = 'Sending…';
    status.className = 'form-status';

    const fd = new FormData();
    fd.append('name', `${name} ${surname}`);
    fd.append('email', email);
    fd.append('whatsapp', whatsapp);
    fd.append('project_type', projectType);
    fd.append('discipline', discipline);
    fd.append('location', location);
    fd.append('_subject', `New client enquiry — ${projectType}`);

    fetch('https://formspree.io/f/mkodolvd', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: fd
    })
      .then(res => {
        if(res.ok){
          status.textContent = 'Thanks — your enquiry has been sent. We\'ll be in touch soon.';
          status.className = 'form-status ok';
          form.reset();
          groups.forEach(g => {
            g.querySelectorAll('.quick-pick').forEach(b => {
              b.classList.remove('active');
              b.setAttribute('aria-pressed', 'false');
            });
            delete g.dataset.selected;
          });
        } else {
          status.textContent = 'Something went wrong sending your enquiry. Please try again or email us directly.';
          status.className = 'form-status err';
        }
      })
      .catch(() => {
        status.textContent = 'Something went wrong sending your enquiry. Please try again or email us directly.';
        status.className = 'form-status err';
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
})();


// ================= VISION — random photo-tile zoom =================
// Every so often, one random tile in the background collage briefly zooms
// in, giving the collage a subtle sense of life without any real photos yet.
(function(){
  const tiles = document.querySelectorAll('.photo-tile');
  if(!tiles.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced) return;

  function randomZoom(){
    // Remove zoom from all tiles
    tiles.forEach(tile => tile.classList.remove('random-hover'));

    // Pick a random tile
    const randomIndex = Math.floor(Math.random() * tiles.length);
    const tile = tiles[randomIndex];

    // Add zoom
    tile.classList.add('random-hover');

    // Remove it after a random amount of time
    const duration = Math.random() * 2000 + 1000; // 1-3 seconds
    setTimeout(() => {
      tile.classList.remove('random-hover');
    }, duration);
  }

  // Trigger every 1.5 seconds
  setInterval(randomZoom, 1500);
})();
  