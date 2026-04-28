(function () {
  var PAGE = document.body.dataset.page || 'default';

  var CSS = [
    /* ── Entrance animations (overlay covers page → animates to reveal) ── */
    '@keyframes enter-hub    { from{background:#00000f;opacity:1} to{background:#00000f;opacity:0} }',
    '@keyframes enter-resume { from{background:#f8fafc;transform:translateX(0)} to{background:#f8fafc;transform:translateX(-100%)} }',
    '@keyframes enter-adam   { from{background:#0f172a;clip-path:polygon(0 0,100% 0,100% 100%,0 100%)} to{background:#0f172a;clip-path:polygon(100% 0,100% 0,100% 100%,100% 100%)} }',

    /* ── Exit animations (overlay hidden → covers page) ── */
    /* → Resume: white page slides in from the right (book page turn) */
    '@keyframes exit-to-resume { from{background:#f8fafc;transform:translateX(100%)} to{background:#f8fafc;transform:translateX(0)} }',
    /* → UDTE: white radial burst (warp speed) */
    '@keyframes exit-warp      { from{background:#ffffff;clip-path:circle(0% at 50% 50%)} to{background:#ffffff;clip-path:circle(150% at 50% 50%)} }',
    /* → Adam: dark slate diagonal wipe from the right */
    '@keyframes exit-to-adam   { from{background:#0f172a;clip-path:polygon(100% 0,100% 0,100% 100%,100% 100%)} to{background:#0f172a;clip-path:polygon(0 0,100% 0,100% 100%,0 100%)} }',
    /* default */
    '@keyframes exit-default   { from{background:#000000;opacity:0} to{background:#000000;opacity:1} }',
  ].join('\n');

  var s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);

  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;will-change:transform,opacity;';
  document.body.appendChild(ov);

  /* ── entrance ── */
  var ENTER = {
    hub:    'enter-hub    600ms ease forwards',
    resume: 'enter-resume 500ms ease forwards',
    adam:   'enter-adam   500ms ease forwards',
  };
  var entAnim = ENTER[PAGE];
  if (entAnim) {
    ov.style.animation = entAnim;
    ov.addEventListener('animationend', function () {
      ov.style.animation = '';
      ov.style.opacity   = '0';
    }, { once: true });
  }

  /* ── exit ── */
  function getExit(href) {
    if (/\/resume\b/.test(href))  return 'exit-to-resume 450ms ease forwards';
    if (/\/UDTE\b/.test(href))    return 'exit-warp      550ms ease forwards';
    if (/\/adam\b/.test(href))    return 'exit-to-adam   450ms ease forwards';
    return                               'exit-default   400ms ease forwards';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^mailto:|^tel:/.test(raw)) return;
    if (a.target === '_blank') return;
    e.preventDefault();
    var dest = a.href || new URL(raw, location.href).href;
    ov.style.opacity   = '';
    ov.style.animation = getExit(dest);
    ov.addEventListener('animationend', function () {
      window.location.href = dest;
    }, { once: true });
  });
})();
