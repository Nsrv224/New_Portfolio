import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------- Preloader ---------- */
(function preloader(){
  const el = document.querySelector('#preloader');
  const count = document.querySelector('#preloaderCount');
  const fill = document.querySelector('#preloaderFill');
  if (!el) { document.body.classList.add('ready'); return; }
  let n = 0;
  const id = setInterval(() => {
    n = Math.min(100, n + Math.round(Math.random() * 14) + 4);
    count.textContent = n;
    fill.style.width = n + '%';
    if (n >= 100) {
      clearInterval(id);
      setTimeout(() => {
        el.classList.add('done');
        document.body.classList.add('ready');
      }, 200);
    }
  }, 90);
})();

/* ---------- Scroll progress + reveal ---------- */
const progress = document.querySelector('.progress');
const reveals = document.querySelectorAll('.reveal');

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (scrollY / max * 100) + '%';
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: .12 });
reveals.forEach(el => observer.observe(el));

/* ---------- Back to top ---------- */
(function backToTop(){
  const btn = document.querySelector('#toTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', scrollY > innerHeight * 0.8);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------- Two-layer custom cursor ---------- */
(function initCursor(){
  const dot = document.querySelector('#cursorDot');
  const ring = document.querySelector('#cursorRing');
  if (!dot || !ring || matchMedia('(pointer:coarse)').matches) return;

  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  window.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });
  (function loop(){
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .project-visual, .skills span, .t-dots button').forEach(el => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
  });
})();

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ---------- Count-up stats ---------- */
(function countUp(){
  const nums = document.querySelectorAll('.stat-num');
  if (!nums.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const start = performance.now();
      const dur = 1400;
      function tick(now){
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: .6 });
  nums.forEach(n => io.observe(n));
})();

/* ---------- Testimonial carousel ---------- */
(function testimonials(){
  const track = document.querySelector('#tTrack');
  const dotsWrap = document.querySelector('#tDots');
  if (!track || !dotsWrap) return;
  const cards = [...track.querySelectorAll('.t-card')];
  let active = 0;

  cards.forEach((_, i) => {
    const b = document.createElement('button');
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = [...dotsWrap.children];

  function go(i){
    cards[active].classList.remove('is-active');
    dots[active].classList.remove('active');
    active = i;
    cards[active].classList.add('is-active');
    dots[active].classList.add('active');
  }
  setInterval(() => go((active + 1) % cards.length), 5000);
})();

/* ---------- 3D hero orb ---------- */
initOrb();

function initOrb(){
  const wrap = document.querySelector('.orb-wrap');
  const canvas = document.querySelector('#orb-canvas');
  if (!wrap || !canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const geometry = new THREE.IcosahedronGeometry(1.45, 28);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x9a9a92, metalness: 0.9, roughness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 1.25
  });
  const orb = new THREE.Mesh(geometry, material);
  scene.add(orb);

  const ringGeo = new THREE.TorusGeometry(2.15, 0.006, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9975a, transparent: true, opacity: 0.32 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2.3;
  scene.add(ring1);
  const ring2 = ring1.clone();
  ring2.rotation.set(Math.PI / 2.6, Math.PI / 6, 0);
  scene.add(ring2);

  // floating particle dust around the orb
  const dustCount = 140;
  const dustGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = 2.6 + Math.random() * 1.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xe8c088, size: 0.02, transparent: true, opacity: 0.55 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
  key.position.set(3, 3, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xc9975a, 7, 20);
  rim.position.set(-4, -1.5, -3);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffffff, 2.2, 20);
  fill.position.set(2, -2, 3);
  scene.add(fill);

  let targetX = 0, targetY = 0;
  window.addEventListener('pointermove', e => {
    targetX = (e.clientX / innerWidth - 0.5) * 2;
    targetY = (e.clientY / innerHeight - 0.5) * 2;
  });

  function resize(){
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function tick(){
    const t = clock.getElapsedTime();
    orb.rotation.y = t * 0.18 + targetX * 0.5;
    orb.rotation.x += (targetY * 0.3 - orb.rotation.x) * 0.04;
    orb.position.y = Math.sin(t * 0.6) * 0.12;
    ring1.rotation.z = t * 0.1;
    ring2.rotation.z = -t * 0.08;
    dust.rotation.y = t * 0.03;
    dust.rotation.x = t * 0.015;
    camera.position.x += (targetX * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-targetY * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

/* ---------- Project cards: tilt + glow position + per-project canvas motif ---------- */
document.querySelectorAll('.project-visual').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(1000px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) scale(1.015)`;
    card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

initProjectCanvases();

function initProjectCanvases(){
  const palettes = [
    { bg: '#161310', dot: '201,151,90', line: '201,151,90' },   // brass — ASPIRO
    { bg: '#101010', dot: '150,180,190', line: '110,140,150' }, // steel — CHECKING
    { bg: '#0e1210', dot: '140,190,150', line: '90,140,110' },  // sage — NIMBUS
    { bg: '#0d0d0d', dot: '210,210,210', line: '120,120,120' }  // mono — AN LAB
  ];

  document.querySelectorAll('.project-visual').forEach(card => {
    const canvas = card.querySelector('.project-canvas');
    const variant = parseInt(card.dataset.variant, 10) || 0;
    const palette = palettes[variant % palettes.length];
    card.style.background = palette.bg;
    const ctx = canvas.getContext('2d');
    let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize(){
      w = card.clientWidth; h = card.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(card);
    resize();

    const N = 26;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25
    }));

    function frame(){
      ctx.clearRect(0, 0, w, h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          const maxD = Math.max(w, h) * 0.22;
          if (d < maxD) {
            ctx.strokeStyle = `rgba(${palette.line},${(1 - d / maxD) * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        ctx.fillStyle = `rgba(${palette.dot},0.85)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    frame();
  });
}
