// Theme toggle (shared contract: data-theme on <html>, default dark, key theme-udte)
// + fade-in on scroll + print/download button.
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  const isLight = () => root.getAttribute('data-theme') === 'light';

  const apply = (light) => {
    root.setAttribute('data-theme', light ? 'light' : 'dark');
    localStorage.setItem('theme-udte', light ? 'light' : 'dark');
    if (btn) {
      btn.setAttribute('aria-pressed', String(!light));
      btn.innerHTML = light
        ? '🌙 Dark <span class="dot"></span>'
        : '☀️ Light <span class="dot"></span>';
    }
  };

  // Sync the button label to whatever the early inline script already set.
  apply(isLight());

  if (btn) btn.addEventListener('click', () => apply(!isLight()));

  // Download / print button
  const dl = document.getElementById('download-pdf');
  if (dl) dl.addEventListener('click', () => window.print());

  // Keep footer year current
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Fade-in on scroll
  const faders = document.querySelectorAll('.fade-in');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  faders.forEach(el => io.observe(el));
})();
