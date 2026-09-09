/* WebCraft — interactions & animations */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  (function theme() {
    var stored = null;
    try {
      stored = sessionStorage.getItem('wc-theme');
    } catch (e) {}
    var pref = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.setAttribute('data-theme', pref);

    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    var sun =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var moon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
    function render() {
      btn.innerHTML = root.getAttribute('data-theme') === 'dark' ? sun : moon;
      btn.setAttribute('aria-label', 'Wissel naar ' + (root.getAttribute('data-theme') === 'dark' ? 'lichte' : 'donkere') + ' modus');
    }
    render();
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        sessionStorage.setItem('wc-theme', next);
      } catch (e) {}
      render();
    });
  })();

  /* ---------- Mobile menu ---------- */
  (function menu() {
    var burger = document.querySelector('.nav-burger');
    var header = document.querySelector('.header');
    if (!burger || !header) return;
    burger.addEventListener('click', function () {
      var open = header.getAttribute('data-menu-open') === 'true';
      header.setAttribute('data-menu-open', open ? 'false' : 'true');
      document.body.style.overflow = open ? '' : 'hidden';
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.setAttribute('data-menu-open', 'false');
        document.body.style.overflow = '';
      });
    });
  })();

  /* ---------- Scroll progress + header behavior ---------- */
  (function scrollUI() {
    var bar = document.querySelector('.scroll-progress');
    var header = document.querySelector('.header');
    var last = 0;
    function onScroll() {
      var st = window.scrollY || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar && h > 0) bar.style.width = (st / h) * 100 + '%';
      if (header) {
        header.setAttribute('data-scrolled', st > 8 ? 'true' : 'false');
        if (st > 200 && st > last + 8) {
          header.setAttribute('data-hidden', 'true');
        } else if (st < last || st < 200) {
          header.setAttribute('data-hidden', 'false');
        }
      }
      last = st;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ---------- Intersection reveals (fail-safe) ---------- */
  (function reveals() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal, .reveal-l, .stagger, [data-reveal]'));
    if (!els.length) return;
    function reveal(el) { el.classList.add('is-in'); }
    function revealAll() { els.forEach(reveal); }
    // No IO support -> show everything immediately.
    if (!('IntersectionObserver' in window)) { revealAll(); return; }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -5% 0px' }
    );
    els.forEach(function (el) { io.observe(el); });
    // Backup: if IO misfires, reveal elements as the user scrolls past them.
    function backup() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
      });
    }
    window.addEventListener('scroll', backup, { passive: true });
    window.addEventListener('resize', backup);
    // Hard safety net: never leave content hidden longer than 1.6s.
    setTimeout(function () {
      els.forEach(function (el) { if (!el.classList.contains('is-in')) { reveal(el); io.unobserve(el); } });
    }, 1600);
  })();

  /* ---------- Hero word reveal ---------- */
  (function heroWords() {
    var h1 = document.querySelector('.hero h1');
    if (!h1) return;
    function split() {
      h1.querySelectorAll('.line').forEach(function (line) {
        var html = '';
        line.textContent
          .trim()
          .split(' ')
          .forEach(function (w) {
            html += '<span class="word">' + w + '&nbsp;</span>';
          });
        line.innerHTML = html;
      });
    }
    split();
    requestAnimationFrame(function () {
      h1.classList.add('is-in');
    });
  })();

  /* ---------- Count-up stats ---------- */
  (function counters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window)) {
      nums.forEach(function (n) {
        n.textContent = n.getAttribute('data-count');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var target = parseFloat(el.getAttribute('data-count'));
          var suffix = el.getAttribute('data-suffix') || '';
          var dur = 1600;
          var start = null;
          function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var val = Math.floor(easeOut(p) * target);
            el.textContent = val + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
          }
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach(function (n) {
      io.observe(n);
    });
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }
  })();

  /* ---------- Floating blocks in hero ---------- */
  (function floatBlocks() {
    var wrap = document.querySelector('.hero-floats');
    if (!wrap || reduce) return;
    var count = window.innerWidth < 720 ? 3 : 5;
    for (var i = 0; i < count; i++) {
      var b = document.createElement('span');
      b.className = 'float-block';
      var size = 16 + Math.random() * 56;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      // keep blocks in the top-right corner so they never collide with hero copy
      b.style.left = (38 + Math.random() * 58) + '%';
      b.style.top = (5 + Math.random() * 30) + '%';
      b.style.opacity = 0.35 + Math.random() * 0.3;
      var dur = 7 + Math.random() * 8;
      b.style.animation = 'floaty ' + dur + 's ease-in-out ' + Math.random() * 4 + 's infinite alternate';
      wrap.appendChild(b);
    }
  })();

  /* ---------- Custom cursor ---------- */
  (function cursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    if (reduce) return;
    var dot = document.createElement('div');
    dot.className = 'cursor';
    document.body.appendChild(dot);
    var x = 0,
      y = 0,
      cx = 0,
      cy = 0;
    document.addEventListener('mousemove', function (e) {
      x = e.clientX;
      y = e.clientY;
    });
    function loop() {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      dot.style.left = cx + 'px';
      dot.style.top = cy + 'px';
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('a, button, .service-card, .value-card, .team-card, .btn').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        dot.classList.add('grow');
      });
      el.addEventListener('mouseleave', function () {
        dot.classList.remove('grow');
      });
    });
  })();

  /* ---------- Page transition overlay ---------- */
  (function pageTrans() {
    var ov = document.querySelector('.page-overlay');
    if (!ov) return;
    // enter
    ov.style.transform = 'scaleY(1)';
    ov.style.transformOrigin = 'bottom';
    requestAnimationFrame(function () {
      ov.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      ov.style.transformOrigin = 'top';
      ov.style.transform = 'scaleY(0)';
    });
    // exit on link click
    document.querySelectorAll('a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey) return;
        var origin = window.location.origin;
        if (href.startsWith('http') && href.indexOf(origin) !== 0) return;
        e.preventDefault();
        ov.style.transformOrigin = 'top';
        ov.style.transform = 'scaleY(1)';
        setTimeout(function () {
          window.location.href = href;
        }, 420);
      });
    });
  })();

  /* ---------- Parallax on images ---------- */
  (function parallax() {
    if (reduce) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.innerWidth < 1024) return;
    var els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;
    window.addEventListener(
      'scroll',
      function () {
        els.forEach(function (el) {
          var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
          var rect = el.getBoundingClientRect();
          var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
          el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
        });
      },
      { passive: true }
    );
  })();

  /* ---------- Contact form (demo) ---------- */
  (function form() {
    var f = document.querySelector('[data-contact-form]');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('[type="submit"]');
      var label = btn.querySelector('.btn-label');
      var original = label.textContent;
      label.textContent = 'Verzonden ✓';
      btn.style.background = 'var(--copper)';
      btn.style.borderColor = 'var(--copper)';
      btn.style.color = '#fff';
      f.reset();
      setTimeout(function () {
        label.textContent = original;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 3200);
    });
  })();
})();

/* floaty keyframe (kept here so it loads with JS) */
var style = document.createElement('style');
style.textContent =
  '@keyframes floaty{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(-26px) rotate(12deg)}}';
document.head.appendChild(style);
