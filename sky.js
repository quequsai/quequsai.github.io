(function () {
  'use strict';

  var skyEl = document.getElementById('sky-body');
  if (!skyEl) return;

  var animating = false;

  /* ── Click handler — CSS transitions on #sky-moon / #moon-cover / .moon-spot handle the visuals ── */
  skyEl.addEventListener('click', function () {
    if (animating) return;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (window._applyTheme) window._applyTheme(!isLight);
  });

  /* ── Public API: smooth in-place sun→moon transition, then fires callback for star warp ── */
  window._quickMoonPreview = function (callback) {
    if (animating) { callback(); return; }
    animating = true;

    var moonEl  = document.getElementById('sky-moon');
    var coverEl = document.getElementById('moon-cover');
    var spot1   = document.getElementById('moon-spot1');
    var spot2   = document.getElementById('moon-spot2');

    /* Inline styles beat [data-theme="light"] selectors; existing CSS transitions animate the change */
    moonEl.style.background = '#eef';
    moonEl.style.boxShadow  = 'none';
    coverEl.style.transform = 'translateX(0)';
    coverEl.style.opacity   = '1';
    spot1.style.width = '9px';  spot1.style.height = '9px';  spot1.style.opacity = '1';
    spot2.style.width = '5px';  spot2.style.height = '5px';  spot2.style.opacity = '1';

    setTimeout(function () {
      animating = false;
      callback();
    }, 1100);
  };

  /* ── Bfcache recovery: clear any inline overrides left by _quickMoonPreview ── */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      animating = false;
      var moonEl  = document.getElementById('sky-moon');
      var coverEl = document.getElementById('moon-cover');
      if (moonEl)  { moonEl.style.background = '';  moonEl.style.boxShadow = ''; }
      if (coverEl) { coverEl.style.transform = '';  coverEl.style.opacity  = ''; }
      document.querySelectorAll('.moon-spot').forEach(function (s) {
        s.style.width = ''; s.style.height = ''; s.style.opacity = '';
      });
    }
  });
})();
