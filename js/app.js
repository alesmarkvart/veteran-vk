/* ============================================================
   Veterán Velké kunratické – hlavní skript
   ============================================================ */

'use strict';
import './runners';

/* ---- Data vydání (od nejnovějšího) ---- */
const ISSUES = [
  { number: 10, label: 'Číslo 10', date: 'Květen 2026',   file: 'issues/issue-10.pdf', type: 'pdf' },
  { number: 9, label: 'Číslo 9',  date: 'Listopad 2025', file: 'issues/issue-9/index.html' },
  { number: 8, label: 'Číslo 8',  date: 'Květen 2025',   file: 'issues/issue-8/index.html' },
  { number: 7, label: 'Číslo 7',  date: 'Listopad 2024', file: 'issues/issue-7/index.html' },
  { number: 6, label: 'Číslo 6',  date: 'Červenec 2024', file: 'issues/issue-6/index.html' },
  { number: 5, label: 'Číslo 5',  date: 'Listopad 2023', file: 'issues/issue-5/index.html' },
  { number: 4, label: 'Číslo 4',  date: 'Květen 2023',   file: 'issues/issue-4/index.html' },
  { number: 3, label: 'Číslo 3',  date: 'Listopad 2022', file: 'issues/issue-3/index.html' },
  { number: 2, label: 'Číslo 2',  date: 'Květen 2022',   file: 'issues/issue-2/index.html' },
  { number: 1, label: 'Číslo 1',  date: 'Listopad 2020', file: 'issues/issue-1/index.html' },
];

/* ---- SVG ikona běžce ---- */
function runnerSvg(color) {
  return `<svg class="card-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="44" cy="11" r="7" fill="${color}"/>
    <path d="M44 18 L38 30 L28 42 M44 18 L50 30 L58 42 M38 30 L34 46 L26 58 M50 30 L52 46 L58 58"
          stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 58 Q12 38 22 24 Q18 42 19 58 Z" fill="#2D5016" opacity="0.7"/>
    <path d="M16 58 Q19 44 27 32 Q24 46 25 58 Z" fill="#2D5016" opacity="0.5"/>
  </svg>`;
}

/* ---- SVG ikona listu ---- */
function leafSvg(color) {
  return `<svg class="card-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 58 Q18 28 38 10 Q50 18 44 38 Q36 56 12 58 Z" fill="${color}" opacity="0.85"/>
    <path d="M12 58 Q24 46 38 10" stroke="#F5F0E8" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M12 58 Q22 40 36 26" stroke="#F5F0E8" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  </svg>`;
}

/* ============================================================
   MŘÍŽKA DLAŽDIC
   ============================================================ */
function buildGrid() {
  const grid = document.getElementById('issuesGrid');
  if (!grid) return;

  ISSUES.forEach((issue, index) => {
    const iconHtml = index % 2 === 1 ? leafSvg('#2D5016') : runnerSvg('#8B6914');

    const card = document.createElement('article');
    card.className = 'issue-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${issue.label}, ${issue.date} – otevřít ke čtení`);
    card.dataset.issueIndex = index;
    card.style.animationDelay = `${index * 80}ms`;

    card.innerHTML = `
      ${iconHtml}
      <span class="card-label">${issue.label}</span>
      <span class="card-number">${issue.number}</span>
      <span class="card-date">${issue.date}</span>
    `;

    card.addEventListener('click', () => openReader(index));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReader(index); }
    });

    grid.appendChild(card);
  });
}

/* ============================================================
   ČTENÁŘ – jednoduchý scrollovatelný dokument
   ============================================================ */
const overlay     = document.getElementById('readerOverlay');
const closeBtn    = document.getElementById('readerClose');
const pdfBtn      = document.getElementById('readerPdf');
const readerTitle = document.getElementById('readerTitle');
const readerDoc   = document.getElementById('readerDoc');
const readerScroll = document.getElementById('readerScroll');
const scrollTopBtn = document.getElementById('scrollTopBtn');

/* Cache načteného HTML */
const cache = {};

let currentIssueIndex = 0;

async function openReader(issueIndex) {
  currentIssueIndex = issueIndex;
  const issue = ISSUES[issueIndex];

  readerTitle.textContent = `${issue.label} – ${issue.date}`;
  readerDoc.innerHTML = '<div class="reader-loading">Načítám…</div>';
  readerScroll.scrollTop = 0;

  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => closeBtn.focus(), 50);

  /* PDF čísla – zobraz přes iframe */
  if (issue.type === 'pdf') {
    readerDoc.classList.add('reader-doc--pdf');
    readerDoc.innerHTML = `<iframe
      src="${issue.file}#zoom=120"
      style="width:100%;height:85vh;border:none;display:block;"
      title="${issue.label}"
    ></iframe>`;
    return;
  }
  readerDoc.classList.remove('reader-doc--pdf');

  /* Načti a zobraz – z cache pokud dostupné */
  if (!cache[issue.number]) {
    try {
      const resp = await fetch(issue.file);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      let html = await resp.text();
      /* Oprav relativní cesty obrázků na absolutní (fetch mění baseURL) */
      const baseDir = issue.file.substring(0, issue.file.lastIndexOf('/') + 1);
      html = html.replace(/src="(?!data:|http|\/)(.*?)"/g, `src="${baseDir}$1"`);
      cache[issue.number] = html;
    } catch {
      cache[issue.number] = '<p style="color:#c00;padding:2rem">Obsah se nepodařilo načíst.</p>';
    }
  }

  readerDoc.innerHTML = cache[issue.number];
}

function closeReader() {
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
  const card = document.querySelector(`.issue-card[data-issue-index="${currentIssueIndex}"]`);
  if (card) card.focus();
}

function printIssue() {
  const issue = ISSUES[currentIssueIndex];
  const prevTitle = document.title;
  document.title = `${issue.label} – ${issue.date} – Veterán Velké kunratické`;
  window.print();
  document.title = prevTitle;
}

/* Tlačítko "Zpět nahoru" – zobrazí se po scrollu dolů */
function bindScrollTop() {
  readerScroll.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', readerScroll.scrollTop > 400);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    readerScroll.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   UDÁLOSTI
   ============================================================ */
function bindEvents() {
  closeBtn.addEventListener('click', closeReader);
  pdfBtn.addEventListener('click', printIssue);

  document.addEventListener('keydown', (e) => {
    if (!overlay.hasAttribute('hidden') && e.key === 'Escape') closeReader();
  });

  /* Klik na tmavé pozadí mimo dokument zavře čtenář */
  readerScroll.addEventListener('click', (e) => {
    if (e.target === readerScroll) closeReader();
  });

  bindScrollTop();
}

/* ============================================================
   INICIALIZACE
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  buildGrid();
  bindEvents();
});
