'use strict';

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ═══════════════════════════════════════════════
     CANVAS
  ═══════════════════════════════════════════════ */
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: '0',
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', () => { resize(); initAll(); }, { passive: true });

  /* ═══════════════════════════════════════════════
     POINTER TRACKING
  ═══════════════════════════════════════════════ */
  let mouseX = -9999, mouseY = -9999;
  let prevMouseX = -1;
  let windGust = 0;   // -1..1, positive = rightward wind
  let windDecay = 0;  // smoothed wind value shown to trees

  function onPointer(cx, cy) {
    if (prevMouseX >= 0) {
      const dx = cx - prevMouseX;
      windGust = Math.max(-1, Math.min(1, dx / 60));
    }
    prevMouseX = cx;
    mouseX = cx;
    mouseY = cy;
  }
  function onLeave() { mouseX = -9999; mouseY = -9999; }

  window.addEventListener('mousemove',  e => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('mouseleave', onLeave);
  window.addEventListener('touchstart', e => { const t = e.touches[0]; onPointer(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove',  e => { const t = e.touches[0]; onPointer(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend',   onLeave, { passive: true });

  /* ═══════════════════════════════════════════════
     TREES
  ═══════════════════════════════════════════════ */
  const TREE_DEFS = [
    // left side  (nx < 0.15)
    { nx: 0.025, heightFrac: 0.28, spread: 90,  alpha: 0.82, phase: 0.0  },
    { nx: 0.075, heightFrac: 0.22, spread: 72,  alpha: 0.70, phase: 0.33 },
    { nx: 0.120, heightFrac: 0.18, spread: 58,  alpha: 0.58, phase: 0.67 },
    // right side (nx > 0.85)
    { nx: 0.975, heightFrac: 0.28, spread: 90,  alpha: 0.82, phase: 0.17 },
    { nx: 0.925, heightFrac: 0.22, spread: 72,  alpha: 0.70, phase: 0.50 },
    { nx: 0.880, heightFrac: 0.18, spread: 58,  alpha: 0.58, phase: 0.83 },
  ];

  let trees = [];
  function initTrees() {
    trees = TREE_DEFS.map(d => ({
      x:      d.nx * W,
      baseY:  H,
      height: H * d.heightFrac,
      spread: d.spread,
      alpha:  d.alpha,
      phase:  d.phase,   // offset for gentle idle sway
      localWind: 0,
    }));
  }

  /* Gentle idle sway: each tree gets a tiny sinusoidal breathing */
  function treeSway(phase, t) {
    return Math.sin(t * 0.0007 + phase * Math.PI * 2) * 0.06;
  }

  function drawTree(tree, windVal) {
    const { x, baseY, height, spread, alpha } = tree;
    const lean    = windVal * height * 0.30;          // how far top shifts
    const trunkH  = height * 0.52;
    const trunkW  = Math.max(5, height * 0.055);

    /* trunk top after leaning */
    const topX = x + lean * 0.65;
    const topY = baseY - trunkH;

    ctx.save();
    ctx.globalAlpha = alpha;

    /* ── Trunk (quadratic bezier leans in wind) ── */
    ctx.strokeStyle = '#7A5230';
    ctx.lineWidth   = trunkW;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean * 0.25, baseY - trunkH * 0.55, topX, topY);
    ctx.stroke();

    /* ── Foliage clusters (5 overlapping circles) ── */
    const fx = topX + lean * 0.30;  // foliage centre X
    const fy = topY - spread * 0.10;

    const clusters = [
      { ox:  0,              oy:  0,              r: spread * 0.50, c: '#2D5016' },
      { ox:  spread * 0.30,  oy: -height * 0.06,  r: spread * 0.38, c: '#3a6b1e' },
      { ox: -spread * 0.25,  oy: -height * 0.04,  r: spread * 0.36, c: '#3a6b1e' },
      { ox:  lean * 0.18,    oy: -height * 0.17,  r: spread * 0.30, c: '#2D5016' },
      { ox: -lean * 0.10,    oy: -height * 0.11,  r: spread * 0.24, c: '#1e3d0d' },
    ];

    clusters.forEach(c => {
      ctx.globalAlpha = alpha * 0.80;
      ctx.fillStyle   = c.c;
      ctx.beginPath();
      ctx.arc(fx + c.ox, fy + c.oy, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /* ═══════════════════════════════════════════════
     INIT & LOOP
  ═══════════════════════════════════════════════ */
  function initAll() { initTrees(); }

  let last = 0;

  function frame(now) {
    const dt  = Math.min(now - last, 50);
    const sec = dt / 1000;
    last = now;

    /* ── Wind update ── */
    windDecay += (windGust - windDecay) * Math.min(1, dt * 0.010);
    windGust  *= Math.pow(0.90, dt / 16);  // gust decays

    ctx.clearRect(0, 0, W, H);

    /* ── Trees ── */
    trees.forEach(tree => {
      /* Mouse proximity to foliage → local turbulence */
      const foliageX = tree.x + windDecay * tree.height * 0.20;
      const foliageY = tree.baseY - tree.height * 0.72;
      const dx = mouseX - foliageX, dy = mouseY - foliageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = dist < 160 && dist > 1
        ? (1 - dist / 160) * 0.65 * (-dx / dist)
        : 0;

      tree.localWind += (proximity - tree.localWind) * 0.12;

      const totalWind = windDecay + tree.localWind + treeSway(tree.phase, now);
      drawTree(tree, totalWind);
    });

    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAll();
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  });
})();
