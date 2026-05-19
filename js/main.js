/* ============================================================
   Veterán Velké kunratické – hlavní skript
   ============================================================ */

'use strict';

/* ============================================================
   STROMY – canvas animace reagující na myš / dotyk
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: '0',
  });
  document.body.prepend(canvas);
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', function () { resize(); initTrees(); }, { passive: true });

  var mouseX = -9999, mouseY = -9999;
  var prevMouseX = -1;
  var windGust = 0;
  var windDecay = 0;

  function onPointer(cx, cy) {
    if (prevMouseX >= 0) {
      var dx = cx - prevMouseX;
      windGust = Math.max(-1, Math.min(1, dx / 60));
    }
    prevMouseX = cx;
    mouseX = cx;
    mouseY = cy;
  }
  function onLeave() { mouseX = -9999; mouseY = -9999; }

  window.addEventListener('mousemove',  function (e) { onPointer(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('mouseleave', onLeave);
  window.addEventListener('touchstart', function (e) { var t = e.touches[0]; onPointer(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove',  function (e) { var t = e.touches[0]; onPointer(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend',   onLeave, { passive: true });

  var TREE_DEFS = [
    { nx: 0.025, heightFrac: 0.28, spread: 90,  alpha: 0.82, phase: 0.00 },
    { nx: 0.075, heightFrac: 0.22, spread: 72,  alpha: 0.70, phase: 0.33 },
    { nx: 0.120, heightFrac: 0.18, spread: 58,  alpha: 0.58, phase: 0.67 },
    { nx: 0.975, heightFrac: 0.28, spread: 90,  alpha: 0.82, phase: 0.17 },
    { nx: 0.925, heightFrac: 0.22, spread: 72,  alpha: 0.70, phase: 0.50 },
    { nx: 0.880, heightFrac: 0.18, spread: 58,  alpha: 0.58, phase: 0.83 },
  ];

  var trees = [];
  function initTrees() {
    trees = TREE_DEFS.map(function (d) {
      return {
        x:         d.nx * W,
        baseY:     H,
        height:    H * d.heightFrac,
        spread:    d.spread,
        alpha:     d.alpha,
        phase:     d.phase,
        localWind: 0,
      };
    });
  }

  function treeSway(phase, t) {
    return Math.sin(t * 0.0007 + phase * Math.PI * 2) * 0.06;
  }

  function drawTree(tree, windVal) {
    var x = tree.x, baseY = tree.baseY, height = tree.height,
        spread = tree.spread, alpha = tree.alpha;
    var lean   = windVal * height * 0.30;
    var trunkH = height * 0.52;
    var trunkW = Math.max(5, height * 0.055);
    var topX   = x + lean * 0.65;
    var topY   = baseY - trunkH;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#7A5230';
    ctx.lineWidth   = trunkW;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean * 0.25, baseY - trunkH * 0.55, topX, topY);
    ctx.stroke();

    var fx = topX + lean * 0.30;
    var fy = topY - spread * 0.10;
    var clusters = [
      { ox:  0,              oy:  0,              r: spread * 0.50, c: '#2D5016' },
      { ox:  spread * 0.30,  oy: -height * 0.06,  r: spread * 0.38, c: '#3a6b1e' },
      { ox: -spread * 0.25,  oy: -height * 0.04,  r: spread * 0.36, c: '#3a6b1e' },
      { ox:  lean * 0.18,    oy: -height * 0.17,  r: spread * 0.30, c: '#2D5016' },
      { ox: -lean * 0.10,    oy: -height * 0.11,  r: spread * 0.24, c: '#1e3d0d' },
    ];
    clusters.forEach(function (c) {
      ctx.globalAlpha = alpha * 0.80;
      ctx.fillStyle   = c.c;
      ctx.beginPath();
      ctx.arc(fx + c.ox, fy + c.oy, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  var last = 0;
  function frame(now) {
    var dt  = Math.min(now - last, 50);
    last = now;

    windDecay += (windGust - windDecay) * Math.min(1, dt * 0.010);
    windGust  *= Math.pow(0.90, dt / 16);

    ctx.clearRect(0, 0, W, H);

    trees.forEach(function (tree) {
      var foliageX = tree.x + windDecay * tree.height * 0.20;
      var foliageY = tree.baseY - tree.height * 0.72;
      var dx = mouseX - foliageX, dy = mouseY - foliageY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var proximity = (dist < 160 && dist > 1)
        ? (1 - dist / 160) * 0.65 * (-dx / dist)
        : 0;
      tree.localWind += (proximity - tree.localWind) * 0.12;
      drawTree(tree, windDecay + tree.localWind + treeSway(tree.phase, now));
    });

    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTrees();
    requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });
  });
})();

/* ============================================================
   DATA VYDÁNÍ
   ============================================================ */
var ISSUES = [
  { number: 10, label: 'Číslo 10', date: 'Květen 2026',   file: 'issues/issue-10.pdf', type: 'pdf' },
  { number: 9,  label: 'Číslo 9',  date: 'Listopad 2025', file: 'issues/issue-9.pdf',  type: 'pdf' },
  { number: 8,  label: 'Číslo 8',  date: 'Květen 2025',   file: 'issues/issue-8.pdf',  type: 'pdf' },
  { number: 7,  label: 'Číslo 7',  date: 'Listopad 2024', file: 'issues/issue-7.pdf',  type: 'pdf' },
  { number: 6,  label: 'Číslo 6',  date: 'Červenec 2024', file: 'issues/issue-6.pdf',  type: 'pdf' },
  { number: 5,  label: 'Číslo 5',  date: 'Listopad 2023', file: 'issues/issue-5.pdf',  type: 'pdf' },
  { number: 4,  label: 'Číslo 4',  date: 'Květen 2023',   file: 'issues/issue-4.pdf',  type: 'pdf' },
  { number: 3,  label: 'Číslo 3',  date: 'Listopad 2022', file: 'issues/issue-3.pdf',  type: 'pdf' },
  { number: 2,  label: 'Číslo 2',  date: 'Květen 2022',   file: 'issues/issue-2.pdf',  type: 'pdf' },
  { number: 1,  label: 'Číslo 1',  date: 'Listopad 2020', file: 'issues/issue-1.pdf',  type: 'pdf' },
];

/* ---- SVG ikona běžce ---- */
function runnerSvg(color) {
  return '<svg class="card-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<circle cx="44" cy="11" r="7" fill="' + color + '"/>'
    + '<path d="M44 18 L38 30 L28 42 M44 18 L50 30 L58 42 M38 30 L34 46 L26 58 M50 30 L52 46 L58 58"'
    + ' stroke="' + color + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M8 58 Q12 38 22 24 Q18 42 19 58 Z" fill="#2D5016" opacity="0.7"/>'
    + '<path d="M16 58 Q19 44 27 32 Q24 46 25 58 Z" fill="#2D5016" opacity="0.5"/>'
    + '</svg>';
}

/* ---- SVG ikona listu ---- */
function leafSvg(color) {
  return '<svg class="card-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<path d="M12 58 Q18 28 38 10 Q50 18 44 38 Q36 56 12 58 Z" fill="' + color + '" opacity="0.85"/>'
    + '<path d="M12 58 Q24 46 38 10" stroke="#F5F0E8" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>'
    + '<path d="M12 58 Q22 40 36 26" stroke="#F5F0E8" stroke-width="1" stroke-linecap="round" opacity="0.4"/>'
    + '</svg>';
}

/* ============================================================
   MŘÍŽKA DLAŽDIC
   ============================================================ */
function buildGrid() {
  var grid = document.getElementById('issuesGrid');
  if (!grid) return;

  ISSUES.forEach(function (issue, index) {
    var iconHtml = index % 2 === 1 ? leafSvg('#2D5016') : runnerSvg('#8B6914');

    var card = document.createElement('article');
    card.className = 'issue-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', issue.label + ', ' + issue.date + ' – otevřít ke čtení');
    card.dataset.issueIndex = index;
    card.style.animationDelay = (index * 80) + 'ms';

    card.innerHTML = iconHtml
      + '<span class="card-label">' + issue.label + '</span>'
      + '<span class="card-number">' + issue.number + '</span>'
      + '<span class="card-date">' + issue.date + '</span>';

    card.addEventListener('click', function () { openReader(index); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReader(index); }
    });

    grid.appendChild(card);
  });
}

/* ============================================================
   ČTENÁŘ
   ============================================================ */
var overlay     = document.getElementById('readerOverlay');
var closeBtn    = document.getElementById('readerClose');
var pdfBtn      = document.getElementById('readerPdf');
var readerTitle = document.getElementById('readerTitle');
var readerDoc   = document.getElementById('readerDoc');
var readerScroll = document.getElementById('readerScroll');
var scrollTopBtn = document.getElementById('scrollTopBtn');

var cache = {};
var currentIssueIndex = 0;

function openReader(issueIndex) {
  currentIssueIndex = issueIndex;
  var issue = ISSUES[issueIndex];

  readerTitle.textContent = issue.label + ' – ' + issue.date;
  readerDoc.innerHTML = '<div class="reader-loading">Načítám…</div>';
  readerScroll.scrollTop = 0;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(function () { closeBtn.focus(); }, 50);

  if (issue.type === 'pdf') {
    readerDoc.classList.add('reader-doc--pdf');
    readerDoc.innerHTML = '<iframe src="' + issue.file + '#zoom=120"'
      + ' style="width:100%;height:85vh;border:none;display:block;"'
      + ' title="' + issue.label + '"></iframe>';
    return;
  }
  readerDoc.classList.remove('reader-doc--pdf');

  if (!cache[issue.number]) {
    fetch(issue.file)
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function (html) {
        var baseDir = issue.file.substring(0, issue.file.lastIndexOf('/') + 1);
        html = html.replace(/src="(?!data:|http|\/)(.*?)"/g, 'src="' + baseDir + '$1"');
        cache[issue.number] = html;
        readerDoc.innerHTML = html;
      })
      .catch(function () {
        readerDoc.innerHTML = '<p style="color:#c00;padding:2rem">Obsah se nepodařilo načíst.</p>';
      });
  } else {
    readerDoc.innerHTML = cache[issue.number];
  }
}

function closeReader() {
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
  var card = document.querySelector('.issue-card[data-issue-index="' + currentIssueIndex + '"]');
  if (card) card.focus();
}

function printIssue() {
  var issue = ISSUES[currentIssueIndex];
  var prevTitle = document.title;
  document.title = issue.label + ' – ' + issue.date + ' – Veterán Velké kunratické';
  window.print();
  document.title = prevTitle;
}

function bindScrollTop() {
  readerScroll.addEventListener('scroll', function () {
    scrollTopBtn.classList.toggle('visible', readerScroll.scrollTop > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', function () {
    readerScroll.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   UDÁLOSTI & INICIALIZACE
   ============================================================ */
function bindEvents() {
  closeBtn.addEventListener('click', closeReader);
  pdfBtn.addEventListener('click', printIssue);
  document.addEventListener('keydown', function (e) {
    if (!overlay.hasAttribute('hidden') && e.key === 'Escape') closeReader();
  });
  readerScroll.addEventListener('click', function (e) {
    if (e.target === readerScroll) closeReader();
  });
  bindScrollTop();
}

document.addEventListener('DOMContentLoaded', function () {
  buildGrid();
  bindEvents();
});
