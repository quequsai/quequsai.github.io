(function () {
  var PAGE = document.body.dataset.page || 'default';

  /* ── Seeded RNG (matches hub/UDTE starfield, seed 42) ── */
  function seededRng(seed) {
    var s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  /* ── Canvas hyperspace: stars stretch outward and fade to dark ── */
  function playHyperspace(destUrl) {
    var W = window.innerWidth, H = window.innerHeight;
    var cx = W / 2, cy = H / 2;
    var maxDim = Math.sqrt(W * W + H * H);

    var cvs = document.createElement('canvas');
    cvs.width = W;
    cvs.height = H;
    cvs.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
    document.body.appendChild(cvs);
    var ctx = cvs.getContext('2d');

    /* Generate the same 500 stars as the hub's seeded starfield */
    var rng = seededRng(42);
    var stars = [];
    for (var i = 0; i < 500; i++) {
      var sx = rng() * W, sy = rng() * H;
      var sr = rng() * 1.2 + 0.2, sa = rng() * 0.6 + 0.1;
      var angle = Math.atan2(sy - cy, sx - cx);
      stars.push({ ox: sx, oy: sy, angle: angle, r: sr, a: sa });
    }

    var DURATION = 1400;
    var start = null;

    /* Very slow start, explosive acceleration — like a ship jumping to warp */
    function ease(t) {
      return t < 0.35 ? t * t * 0.816 : 0.1 + Math.pow((t - 0.35) / 0.65, 2.6) * 0.9;
    }

    function frame(now) {
      if (!start) start = now;
      var t  = Math.min((now - start) / DURATION, 1);
      var e  = ease(t);

      /* Dark background — slowly fills in so the page fades behind the stars */
      var bgA = 0.08 + e * 0.65;
      ctx.fillStyle = 'rgba(0,0,12,' + bgA + ')';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        /* How far the star has travelled from its resting position */
        var travel = e * maxDim * 1.5;
        /* Head: leading edge, moving outward */
        var hx = s.ox + Math.cos(s.angle) * travel;
        var hy = s.oy + Math.sin(s.angle) * travel;
        /* Tail: lags the head — streak grows as speed increases */
        var trailLen = Math.max(0, e - 0.08) * maxDim * 0.55;
        var tx = s.ox + Math.cos(s.angle) * Math.max(0, travel - trailLen);
        var ty = s.oy + Math.sin(s.angle) * Math.max(0, travel - trailLen);

        /* Skip once fully off screen */
        if (travel - trailLen > maxDim * 1.6) continue;

        var alpha = s.a * Math.min(1, e * 8 + 0.25);

        if (e < 0.1) {
          /* Phase 1: still dots at resting positions */
          var dotA = s.a * (0.3 + e / 0.1 * 0.7);
          ctx.beginPath();
          ctx.arc(s.ox, s.oy, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + dotA + ')';
          ctx.fill();
        } else {
          /* Phase 2+: elongating streaks */
          var grad = ctx.createLinearGradient(tx, ty, hx, hy);
          grad.addColorStop(0,   'rgba(100,190,255,0)');
          grad.addColorStop(0.3, 'rgba(160,215,255,' + (alpha * 0.45) + ')');
          grad.addColorStop(1,   'rgba(255,255,255,' + alpha + ')');
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.r * 1.1;
          ctx.stroke();
        }
      }

      /* Final fade to deep dark (not white) */
      if (t > 0.87) {
        var fA = (t - 0.87) / 0.13;
        ctx.fillStyle = 'rgba(0,0,12,' + fA + ')';
        ctx.fillRect(0, 0, W, H);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        window.location.href = destUrl;
      }
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
      /* Hyperspace warp — canvas animation */
      playHyperspace(dest);
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
