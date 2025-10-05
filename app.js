'use strict';

let controller; // AbortController instanssi

// 0) Pieni apu
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// 1) Teema — virhe: localStorage avain sekoilee, event listener duplikoituu - korjattu
const themeBtn = $('#themeToggle');
const THEME_KEY = 'theme-preference';
function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); }
function saveTheme(t) { localStorage.setItem('theme-preference', t); } // BUG: key typo - korjattu
function loadTheme() { return localStorage.getItem('theme-preference') || 'light'; }
function toggleTheme() { const next = (loadTheme() === 'light') ? 'dark' : 'light'; applyTheme(next); saveTheme(next); }

// BUG: tuplalistener - korjattu
themeBtn.addEventListener('click', () => toggleTheme());
//themeBtn.addEventListener('click', () => toggleTheme()); // Extra listener - poistettu
applyTheme(loadTheme());

// 2) Haku — virhe: väärä API-osoite + virheenkäsittely puuttuu
const form = document.getElementById('searchForm');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');

// Coffee http-rajapinnan dokumentaatio: https://sampleapis.com/api-list/coffee - korjattu
async function searchImages(query) {
    if (controller) controller.abort(); // Keskeytä edellinen pyyntö
    controller = new AbortController(); // Luo uusi AbortController
    const signal = controller.signal;
    statusEl.textContent = 'Haetan...';
    const url = `https://api.sampleapis.com/coffee/hot`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    const filtered = data.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
    if (filtered.length === 0) {
        throw new Error('Ei kuvia tällä nimellä.');
    }
    return filtered.slice(0, 8).map(x => ({ title: x.title || query, url: x.image }));
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#q').value.trim();

    // Päivitä URL hakusanan perusteella
    const url = new URL(location.href);
    url.searchParams.set('q', q);
    history.pushState({ q }, '', url);

    statusEl.textContent = 'Ladataan…';
    resultsEl.innerHTML = '';
    try {
        const items = await searchImages(q);
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'card';
            li.innerHTML = `<strong>${item.title}</strong><br><img alt="" width="160" height="120" src="${item.url}">`;
            resultsEl.appendChild(li);
        });
        statusEl.textContent = `${items.length} tulosta`;
    } catch (err) {
        statusEl.textContent = err.message;
    }
});

// 3) Laskuri — virhe: event delegation ja bubbling sekoilee - korjattu
const counterBtn = $('.counter');
counterBtn.addEventListener('click', (e) => {
    const btn = e.target.closest('.counter');
    if (!btn) return;
    const span = btn.querySelector('span');
    span.textContent = String(parseInt(span.textContent, 10) + 1);
});

// 4) Clipboard — virhe: ei permissioiden / https tarkistusta - ei korjattu
$('#copyBtn').addEventListener('click', async () => {
    const text = $('#copyBtn').dataset.text;
    await navigator.clipboard.writeText(text); // BUG: voi heittää virheen
    alert('Kopioitu!');
});

// 5) IntersectionObserver — virhe: threshold/cleanup puuttuu - korjattu
const box = document.querySelector('.observe-box');

const io = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
      box.textContent = 'Näkyvissä!';

      
      observer.unobserve(entry.target); // Pysäytä havainnointi
      observer.disconnect(); // Irrota observer
    }
  });
}, { threshold: 0.25 });

io.observe(box);
