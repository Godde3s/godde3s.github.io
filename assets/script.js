/* Reza Bazdar (Godde3s) — portfolio interactions · v12
   Fenrir-inspired: theme system (light/dark/system), motion toggle,
   résumé/agents view switch, count-up stats, laptop stories slider. */
(function () {
  'use strict';

  // Progressive enhancement flag — reveals only hide content when JS runs
  document.documentElement.classList.add('js');

  var docEl = document.documentElement;
  var motionOff = false;

  /* ---------------- theme system: light / dark / system ---------------- */
  var THEME_KEY = 'or-theme';
  var themeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-set-theme]'));

  function applyTheme(pref) {
    docEl.setAttribute('data-theme', pref);
    docEl.classList.add('theming');
    window.clearTimeout(applyTheme._t);
    applyTheme._t = window.setTimeout(function () { docEl.classList.remove('theming'); }, 380);
    themeBtns.forEach(function (btn) {
      var on = btn.getAttribute('data-set-theme') === pref;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', String(on));
    });
  }

  function initTheme() {
    var pref = 'system';
    try { pref = localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { /* private mode */ }
    applyTheme(['light', 'dark', 'system'].indexOf(pref) > -1 ? pref : 'system');
    themeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-set-theme');
        applyTheme(val);
        try { localStorage.setItem(THEME_KEY, val); } catch (e) { /* ignore */ }
      });
    });
  }
  initTheme();

  /* ---------------- motion toggle (fenrir "Pause motion") ---------------- */
  var motionBtn = document.getElementById('motionBtn');
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isMotionOff() { return motionOff; }

  function setMotion(off) {
    motionOff = off;
    docEl.classList.toggle('motion-off', off);
    docEl.classList.toggle('motion-on', !off);
    if (motionBtn) motionBtn.setAttribute('aria-pressed', String(off));
    if (window.orStoriesAuto) window.orStoriesAuto(!off);
  }

  if (motionBtn) {
    motionBtn.addEventListener('click', function () { setMotion(!motionOff); });
  }
  if (prefersReduced) {
    // start paused; the user can press "Play motion" to override
    setMotion(true);
  }

  /* ---------------- current year ---------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------- sticky nav shadow ---------------- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- mobile menu ---------------- */
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target && e.target.tagName === 'A') {
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 120px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- résumé <-> agents view switch ----------------
     One mode drives ALL .hero-state blocks (headline group + card group),
     matched by data-state instead of index. */
  (function () {
    var toggle = document.getElementById('heroToggle');
    if (!toggle) return;
    var hero = document.querySelector('.hero');
    var lens = toggle.querySelector('.lens');
    var opts = Array.prototype.slice.call(toggle.querySelectorAll('.opt'));
    var states = Array.prototype.slice.call(document.querySelectorAll('.hero-state'));
    var idx = 0;

    function position(instant) {
      var opt = opts[idx];
      if (!opt || !lens) return;
      var border = parseFloat(getComputedStyle(toggle).borderLeftWidth) || 0;
      if (instant) lens.style.transition = 'none';
      var tr = toggle.getBoundingClientRect();
      var or = opt.getBoundingClientRect();
      toggle.style.setProperty('--lens-left', Math.max(or.left - tr.left - border, 0) + 'px');
      toggle.style.setProperty('--lens-width', or.width + 'px');
      if (instant) {
        void lens.offsetWidth;
        lens.style.transition = '';
      }
    }

    function select(i) {
      idx = (i + opts.length) % opts.length;
      var mode = opts[idx].getAttribute('data-mode') || 'humans';
      opts.forEach(function (o, j) {
        o.classList.toggle('is-active', j === idx);
        o.setAttribute('aria-selected', String(j === idx));
      });
      states.forEach(function (st) {
        var on = st.getAttribute('data-state') === mode;
        st.classList.toggle('is-active', on);
        st.setAttribute('aria-hidden', String(!on));
      });
      if (hero) hero.setAttribute('data-view', mode);
      position(false);
    }

    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { select(i); });
    });

    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        select(idx + 1);
        opts[idx].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        select(idx - 1);
        opts[idx].focus();
      }
    });

    window.addEventListener('resize', function () { position(true); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { position(true); });
    }
    window.setTimeout(function () { position(true); }, 60);
  })();

  /* ---------------- count-up numbers (motion-aware) ---------------- */
  (function () {
    var nums = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!nums.length) return;

    function finalText(el) { return el.getAttribute('data-count'); }

    function animate(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      if (isMotionOff() || !('requestAnimationFrame' in window)) {
        el.textContent = String(target);
        return;
      }
      var t0 = null;
      var DUR = 1100;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / DUR, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function setFinalAll() {
      nums.forEach(function (el) { el.textContent = finalText(el); });
    }

    if (!('IntersectionObserver' in window)) { setFinalAll(); return; }

    // count-up respects live motion toggling
    var done = false;
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !done) {
          done = true;
          if (isMotionOff()) { setFinalAll(); }
          else { nums.forEach(animate); }
          nio.disconnect();
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { nio.observe(el); });

    window.addEventListener('or-motion-change', function () {
      if (done && isMotionOff()) setFinalAll();
    });
  })();

  // notify listeners when motion preference changes
  var _origSetMotion = setMotion;
  setMotion = function (off) {
    _origSetMotion(off);
    document.dispatchEvent(new CustomEvent('or-motion-change'));
  };
  if (prefersReduced) setMotion(true);
})();

/* ---------------- Project stories laptop — vanilla port of Usf VibeStories ---------------- */
(function () {
  'use strict';

  var container = document.getElementById('vibeStories');
  if (!container) return;

  var STORIES = [
    {
      id: 1,
      title: 'One router for every model',
      author: 'omnirouter · Go',
      avatar: 'network',
      image: 'assets/stories/story-1.webp',
      srcset: 'assets/stories/story-1-640.webp 640w, assets/stories/story-1.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-1/'
    },
    {
      id: 2,
      title: 'A one-click AI server on a free Space',
      author: 'hermes-stack · Python',
      avatar: 'activity',
      image: 'assets/stories/story-2.webp',
      srcset: 'assets/stories/story-2-640.webp 640w, assets/stories/story-2.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-2/'
    },
    {
      id: 3,
      title: 'A backend where every security claim has a test',
      author: 'taskflow-api · Python',
      avatar: 'shield',
      image: 'assets/stories/story-3.webp',
      srcset: 'assets/stories/story-3-640.webp 640w, assets/stories/story-3.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-3/'
    },
    {
      id: 4,
      title: 'Realtime chat you self-host in one command',
      author: 'goftego · Node.js',
      avatar: 'layout',
      image: 'assets/stories/story-4.webp',
      srcset: 'assets/stories/story-4-640.webp 640w, assets/stories/story-4.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-4/'
    }
  ];

  var AUTOPLAY_MS = 4000;
  var PAGINATE_LOCK_MS = 800;
  var TRANSITION_MS = 600;

  var screenLink = container.querySelector('.screen-link');
  var dots = Array.prototype.slice.call(container.querySelectorAll('.indicator-dot'));
  var wrapperEl = container.querySelector('.laptop-wrapper');

  var currentIndex = 0;
  var isPaginating = false;
  var autoplayTimer = null;
  var wantAutoplay = true;

  function story(i) { return STORIES[i] || STORIES[0]; }

  function syncInfo() {
    var s = story(currentIndex);
    if (screenLink) screenLink.href = s.link;
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function mountImage(s) {
    var wrap = document.createElement('div');
    wrap.className = 'screen-image-wrapper';
    var img = document.createElement('img');
    img.className = 'screen-image';
    img.src = s.image;
    img.srcset = s.srcset;
    img.sizes = '(max-width: 760px) 62vw, 440px';
    img.alt = 'Story cover';
    img.width = 1280;
    img.height = s.imageHeight;
    img.style.objectPosition = s.objectPosition;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.setAttribute('fetchpriority', 'low');
    wrap.appendChild(img);
    return wrap;
  }

  function slideTo(index, name) {
    var enter = mountImage(story(index));
    screenLink.appendChild(enter);

    var leaving = [];
    Array.prototype.forEach.call(screenLink.querySelectorAll('.screen-image-wrapper'), function (el) {
      if (el !== enter) leaving.push(el);
    });

    enter.classList.add(name + '-enter-active', name + '-enter-from');
    leaving.forEach(function (el) { el.classList.add(name + '-leave-active'); });
    void enter.offsetWidth;
    enter.classList.remove(name + '-enter-from');
    leaving.forEach(function (el) { el.classList.add(name + '-leave-to'); });

    window.setTimeout(function () {
      enter.classList.remove(name + '-enter-active');
      leaving.forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    }, TRANSITION_MS);
  }

  var next = function () {
    if (isPaginating) return;
    isPaginating = true;
    slideTo((currentIndex + 1) % STORIES.length, 'slide-left');
    currentIndex = (currentIndex + 1) % STORIES.length;
    syncInfo();
    window.setTimeout(function () { isPaginating = false; }, PAGINATE_LOCK_MS);
  };

  var prev = function () {
    if (isPaginating) return;
    isPaginating = true;
    slideTo((currentIndex - 1 + STORIES.length) % STORIES.length, 'slide-right');
    currentIndex = (currentIndex - 1 + STORIES.length) % STORIES.length;
    syncInfo();
    window.setTimeout(function () { isPaginating = false; }, PAGINATE_LOCK_MS);
  };

  var setIndex = function (index) {
    if (index === currentIndex) return;
    slideTo(index, index > currentIndex ? 'slide-left' : 'slide-right');
    currentIndex = index;
    syncInfo();
  };

  var startAutoplay = function () {
    if (!wantAutoplay) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(function () {
      if (!isPaginating) {
        slideTo((currentIndex + 1) % STORIES.length, 'slide-left');
        currentIndex = (currentIndex + 1) % STORIES.length;
        syncInfo();
      }
    }, AUTOPLAY_MS);
  };

  var stopAutoplay = function () {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  // motion-toggle hook: autoplay follows the global motion switch
  window.orStoriesAuto = function (on) { wantAutoplay = on; if (on) startAutoplay(); else stopAutoplay(); };

  var prevBtn = container.querySelector('.nav-btn.prev');
  var nextBtn = container.querySelector('.nav-btn.next');
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); stopAutoplay(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); stopAutoplay(); startAutoplay(); });
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { setIndex(i); stopAutoplay(); startAutoplay(); });
  });

  if (wrapperEl) {
    wrapperEl.addEventListener('mouseenter', stopAutoplay);
    wrapperEl.addEventListener('mouseleave', startAutoplay);
  }

  container.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      if (e.deltaX > 0) { next(); } else { prev(); }
    }
  }, { passive: false });

  /* touch swipe — horizontal intent only, vertical scroll untouched */
  var touchX = 0, touchY = 0, touchT = 0;
  container.addEventListener('touchstart', function (e) {
    if (!e.touches.length) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    touchT = Date.now();
  }, { passive: true });
  container.addEventListener('touchend', function (e) {
    if (!e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Date.now() - touchT > 800) return;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) { next(); } else { prev(); }
    stopAutoplay(); startAutoplay();
  }, { passive: true });

  // start autoplay only if motion is allowed (script.js sets motion classes)
  wantAutoplay = !document.documentElement.classList.contains('motion-off');
  syncInfo();
  if (wantAutoplay) startAutoplay();
})();
