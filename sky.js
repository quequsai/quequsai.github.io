(function () {
  'use strict';

  var skyCvs = document.getElementById('sky-body');
  if (!skyCvs) return;

  var animating = false;

  /* ── Helpers ── */
  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpRGB(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  function rgbaStr(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  /* ── Draw celestial body at (cx,cy) with radius r.
        progress 0 = crescent moon, progress 1 = full sun ── */
  function drawBody(ctx, cx, cy, r, progress) {
    var bodyCol = lerpRGB([210, 225, 245], [252, 211, 77], progress);
    var glowCol = lerpRGB([100, 140, 200], [251, 146, 60], progress);
    var glowR   = r * (1.8 + progress * 0.6);

    /* Outer glow */
    var grd = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
    grd.addColorStop(0, rgbaStr(glowCol, 0.30 + progress * 0.22));
    grd.addColorStop(1, rgbaStr(glowCol, 0));
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Body — crescent below progress 0.3, full circle above */
    if (progress < 0.3) {
      /* Crescent using even-odd clip: rect covers body area, circle punches crescent hole */
      var cp    = progress / 0.3;
      var cutR  = r * (0.85 - cp * 0.2);
      var cutOX = r * (0.38 - cp * 0.1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - r * 2.5, cy - r * 2.5, r * 5, r * 5);
      ctx.arc(cx + cutOX, cy - r * 0.08, cutR, 0, Math.PI * 2);
      ctx.clip('evenodd');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr(bodyCol, 1);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr(bodyCol, 1);
      ctx.fill();
    }

    /* Sun rays — fade in above progress 0.45 */
    if (progress > 0.45) {
      var rayA = Math.min(1, (progress - 0.45) / 0.3);
      for (var i = 0; i < 8; i++) {
        var ang = (i / 8) * Math.PI * 2;
        var r1  = r + 4;
        var r2  = r + 12 + progress * 5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.strokeStyle = rgbaStr([252, 211, 77], rayA * 0.7);
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    }
  }

  /* ── Redraw the static sky-body canvas to match current theme ── */
  function updateSkyBody() {
    var ctx     = skyCvs.getContext('2d');
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.clearRect(0, 0, 64, 64);
    drawBody(ctx, 32, 32, 16, isLight ? 1 : 0);
  }

  /* ── Arc animation across the sky ──
       toLight:    true = moon→sun, false = sun→moon
       dur:        duration in ms
       visualOnly: skip the actual theme switch (for UDTE preview)
       onDone:     callback when complete                            */
  function startArc(toLight, dur, visualOnly, onDone) {
    if (animating) return;
    animating = true;
    skyCvs.style.opacity = '0';

    var W   = window.innerWidth;
    var H   = window.innerHeight;
    var cvs = document.createElement('canvas');
    cvs.className = 'tr-overlay';
    cvs.width  = W;
    cvs.height = H;
    cvs.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;';
    document.body.appendChild(cvs);
    var ctx = cvs.getContext('2d');

    var themeSet = false;
    var start    = null;

    /* Parabolic arc: body travels from upper-right (sx,sy) to upper-left (px,py)
       at t=0.5 then returns home.  Formula: pos = start + (peak-start) * 4t(1-t)  */
    var sx = W - 52, sy = 52;  /* sky-body canvas centre (top:20, right:20, size:64) */
    var px = 52,     py = 35;  /* mirror peak — slightly higher                      */

    function frame(now) {
      if (!start) start = now;
      var t = Math.min((now - start) / dur, 1);
      var u = 4 * t * (1 - t);

      var x        = sx + (px - sx) * u;
      var y        = sy + (py - sy) * u;
      var progress = toLight ? t : (1 - t);

      ctx.clearRect(0, 0, W, H);
      drawBody(ctx, x, y, 24, progress);

      /* Switch theme at the midpoint of the arc */
      if (t >= 0.5 && !themeSet && !visualOnly) {
        themeSet = true;
        if (window._applyTheme) window._applyTheme(toLight);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        cvs.remove();
        skyCvs.style.opacity = '';
        animating = false;
        updateSkyBody();
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  /* ── Bfcache recovery — reset state if page is restored ── */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      animating = false;
      skyCvs.style.opacity = '';
      updateSkyBody();
    }
  });

  /* ── Public API used by transitions.js ──
     Plays a quick visual-only sun→moon arc (no theme change) then fires callback */
  window._quickMoonPreview = function (callback) {
    startArc(false, 650, true, callback);
  };

  /* ── Click handler ── */
  skyCvs.addEventListener('click', function () {
    if (animating) return;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    startArc(!isLight, 1500, false, null);
  });

  /* ── Initial render ── */
  updateSkyBody();

  /* Stay in sync if theme is changed programmatically */
  new MutationObserver(updateSkyBody)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
