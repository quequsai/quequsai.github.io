(function () {
  var PAGE = document.body.dataset.page || 'default';

  /* ── Particle helpers ── */
  function makeParticle(W, H) {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.6 + Math.random() * 1.0),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.022 + Math.random() * 0.028,
      r: 1.2 + Math.random() * 2.2,
      alpha: 0.45 + Math.random() * 0.45,
      born: null,
      lifespan: 1400 + Math.random() * 800,
    };
  }

  function tickParticle(ctx, p, now) {
    if (!p.born) p.born = now;
    var age = (now - p.born) / p.lifespan;
    if (age >= 1) return false;

    p.wobble += p.wobbleSpeed;
    p.x += p.vx + Math.sin(p.wobble) * 0.25;
    p.y += p.vy;

    var fade = age < 0.15 ? age / 0.15 : age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1;
    var a = p.alpha * fade;
    if (a <= 0.01) return true;

    var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.8);
    g.addColorStop(0,    'rgba(255,255,255,' + a + ')');
    g.addColorStop(0.35, 'rgba(185,220,255,' + (a * 0.55) + ')');
    g.addColorStop(1,    'rgba(100,160,255,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    return true;
  }

  /* ── Star-bubble exit: particles pop up and float across the page ── */
  function playStarBubble(destUrl) {
    var W = window.innerWidth, H = window.innerHeight;
    var cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    cvs.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
    document.body.appendChild(cvs);
    var ctx = cvs.getContext('2d');

    var particles = [];
    var DURATION = 900;
    var start = null;
    var lastSpawn = 0;

    function frame(now) {
      if (!start) { start = now; lastSpawn = now; }
      var t = Math.min((now - start) / DURATION, 1);

      ctx.clearRect(0, 0, W, H);

      /* Accelerating spawn — more stars appear as transition progresses */
      var target = Math.round(t * t * 75 + t * 25);
      if (particles.length < target && now - lastSpawn > 8) {
        particles.push(makeParticle(W, H));
        lastSpawn = now;
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        if (!tickParticle(ctx, particles[i], now)) particles.splice(i, 1);
      }

      if (t < 1) requestAnimationFrame(frame);
      else window.location.href = destUrl;
    }

    requestAnimationFrame(frame);
  }

  /* ── CSS keyframes for non-warp transitions ── */
  var CSS = [
    '@keyframes enter-hub    { from{background:#00000f;opacity:1} to{background:#00000f;opacity:0} }',
    '@keyframes enter-resume { from{background:#f8fafc;transform:translateX(0)} to{background:#f8fafc;transform:translateX(-100%)} }',
    '@keyframes enter-adam   { from{background:#0f172a;clip-path:polygon(0 0,100% 0,100% 100%,0 100%)} to{background:#0f172a;clip-path:polygon(100% 0,100% 0,100% 100%,100% 100%)} }',
    '@keyframes exit-to-resume  { from{background:#f8fafc;transform:translateX(100%)} to{background:#f8fafc;transform:translateX(0)} }',
    '@keyframes exit-to-adam    { from{background:#0f172a;clip-path:polygon(100% 0,100% 0,100% 100%,100% 100%)} to{background:#0f172a;clip-path:polygon(0 0,100% 0,100% 100%,0 100%)} }',
    '@keyframes exit-default    { from{background:#000000;opacity:0} to{background:#000000;opacity:1} }',
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none;will-change:transform,opacity;';
  document.body.appendChild(ov);

  /* ── Entrance animations ── */
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

  /* ── Exit click handler ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^mailto:|^tel:/.test(raw)) return;
    if (a.target === '_blank') return;
    e.preventDefault();
    var dest = a.href || new URL(raw, location.href).href;

    if (/\/UDTE\b/.test(dest)) {
      playStarBubble(dest);
    } else if (/\/resume\b/.test(dest)) {
      ov.style.opacity   = '';
      ov.style.animation = 'exit-to-resume 450ms ease forwards';
      ov.addEventListener('animationend', function () { window.location.href = dest; }, { once: true });
    } else if (/\/adam\b/.test(dest)) {
      ov.style.opacity   = '';
      ov.style.animation = 'exit-to-adam 450ms ease forwards';
      ov.addEventListener('animationend', function () { window.location.href = dest; }, { once: true });
    } else {
      ov.style.opacity   = '';
      ov.style.animation = 'exit-default 400ms ease forwards';
      ov.addEventListener('animationend', function () { window.location.href = dest; }, { once: true });
    }
  });
})();
