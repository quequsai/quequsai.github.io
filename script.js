// Theme toggle + fade-in animation (keeps your existing fade-in behavior)
(function () {
  const body = document.body;
  const btn = document.getElementById('theme-toggle');

  // Initialize mode from localStorage or prefers-color-scheme
  const preferred = localStorage.getItem('theme');
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const startDark = preferred ? preferred === 'dark' : systemDark;

  const apply = (dark) => {
    body.classList.toggle('theme-dark', dark);
    btn.setAttribute('aria-pressed', String(dark));
    btn.innerHTML = dark ? '☀️ Light <span class="dot"></span>' : '🌙 Dark <span class="dot"></span>';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  apply(startDark);

  btn.addEventListener('click', () => {
    apply(!body.classList.contains('theme-dark'));
  });

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
