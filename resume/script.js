// Theme toggle (shared contract: data-theme on <html>, default dark, key theme-udte)
// + print/save with a chosen light or dark theme + fade-in on scroll.
(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');

  const isLight = () => root.getAttribute('data-theme') === 'light';

  // persist=false is used for the temporary theme applied only while printing,
  // so it never overwrites the visitor's saved preference.
  const applyTheme = (light, persist) => {
    root.setAttribute('data-theme', light ? 'light' : 'dark');
    if (persist !== false) localStorage.setItem('theme-udte', light ? 'light' : 'dark');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(!light));
      toggleBtn.innerHTML = light
        ? '🌙 Dark <span class="dot"></span>'
        : '☀️ Light <span class="dot"></span>';
    }
  };

  // Sync the button label to whatever the early inline script already set.
  applyTheme(isLight());
  if (toggleBtn) toggleBtn.addEventListener('click', () => applyTheme(!isLight()));

  // ── Print / save with a chosen theme ──
  const printBtn = document.getElementById('print-btn');
  const printMenu = document.getElementById('print-menu');

  const closeMenu = () => {
    if (printMenu) printMenu.setAttribute('hidden', '');
    if (printBtn) printBtn.setAttribute('aria-expanded', 'false');
  };

  if (printBtn && printMenu) {
    printBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = printMenu.hasAttribute('hidden');
      if (willOpen) printMenu.removeAttribute('hidden');
      else printMenu.setAttribute('hidden', '');
      printBtn.setAttribute('aria-expanded', String(willOpen));
    });
    // Clicks inside the menu should not close it before the button handler runs.
    printMenu.addEventListener('click', (e) => e.stopPropagation());
    // Click anywhere else closes the menu.
    document.addEventListener('click', closeMenu);

    printMenu.querySelectorAll('button[data-print-theme]').forEach((b) => {
      b.addEventListener('click', () => {
        const wantLight = b.getAttribute('data-print-theme') === 'light';
        const wasLight = isLight();
        applyTheme(wantLight, false);   // temporary, do not persist
        closeMenu();
        const restore = () => {
          applyTheme(wasLight);         // restore the visitor's real theme
          window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
        // Let the chosen theme paint before the print dialog snapshots the page.
        setTimeout(() => window.print(), 60);
      });
    });
  }

  // ── Fade-in on scroll ──
  const faders = document.querySelectorAll('.fade-in');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  faders.forEach((el) => io.observe(el));

  // Keep footer year current
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
