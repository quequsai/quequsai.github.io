(function () {
  'use strict';

  var skyEl = document.getElementById('sky-body');
  if (!skyEl) return;

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

  /* ── Draw in-place (progress 0=moon, 1=sun) matching sunmoon.css style ── */
  function drawBody(ctx, cx, cy, r, progress) {
    var bodyCol = lerpRGB([238, 238, 255], [246, 214, 2], progress);
    var glowCol = lerpRGB([150, 170, 230], [245, 235, 113], progress);
    var glowR   = r * (1.8 + progress * 0.6);

    var grd = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
    grd.addColorStop(0, rgbaStr(glowCol, 0.30 + progress * 0.22));
    grd.addColorStop(1, rgbaStr(glowCol, 0));
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = rgbaStr(bodyCol, 1);
    ctx.fill();

    /* Cover circle creates crescent (fades out as body becomes sun) */
    if (progress < 0.5) {
      var coverA = 1 - progress * 2;
      ctx.beginPath();
      ctx.arc(cx + r * 0.46, cy - r * 0.06, r * 0.88, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr([0, 0, 15], coverA);
      ctx.fill();
    }

    /* Moon spots */
    if (progress < 0.4) {
      var spotA = 1 - progress / 0.4;
      ctx.beginPath();
      ctx.arc(cx - r * 0.22, cy + r * 0.28, r * 0.19, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr([180, 190, 215], spotA);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - r * 0.05, cy + r * 0.30, r * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr([180, 190, 215], spotA);
      ctx.fill();
    }

    /* Sun rays */
    if (progress > 0.55) {
      var rayA = Math.min(1, (progress - 0.55) / 0.3);
      for (var i = 0; i < 8; i++) {
        var ang = (i / 8) * Math.PI * 2;
        var r1  = r + 4;
        var r2  = r + 12 + progress * 5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.strokeStyle = rgbaStr([246, 214, 2], rayA * 0.7);
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    }
  }

  /* ── Canvas overlay animation — body stays fixed in corner, only morphs ── */
  function startArc(toLight, dur, visualOnly, onDone) {
    if (animating) return;
    animating = true;
    skyEl.style.opacity = '0';

    var W   = window.innerWidth;
    var cvs = document.createElement('canvas');
    cvs.className = 'tr-overlay';
    cvs.width  = W;
    cvs.height = window.innerHeight;
    cvs.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;';
    document.body.appendChild(cvs);
    var ctx = cvs.getContext('2d');

    /* Fixed position: matches centre of the 64×64 sky-body at top:20px right:20px */
    var cx = W - 52;
    var cy = 52;

    var themeSet = false;
    var start    = null;

    function frame(now) {
      if (!start) start = now;
      var t        = Math.min((now - start) / dur, 1);
      var progress = toLight ? t : (1 - t);

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      drawBody(ctx, cx, cy, 21, progress);

      if (t >= 0.5 && !themeSet && !visualOnly) {
        themeSet = true;
        if (window._applyTheme) window._applyTheme(toLight);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        cvs.remove();
        skyEl.style.opacity = '';
        animating = false;
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  /* ── Bfcache recovery ── */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      animating = false;
      skyEl.style.opacity = '';
    }
  });

  /* ── Public API: in-place sun→moon morph (1000ms, visual only) then callback ── */
  window._quickMoonPreview = function (callback) {
    startArc(false, 1000, true, callback);
  };

  /* ── Click handler ── */
  skyEl.addEventListener('click', function () {
    if (animating) return;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    startArc(!isLight, 1500, false, null);
  });
})();
