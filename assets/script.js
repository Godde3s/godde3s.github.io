/* ============================================================
   Usf (Godde3s) — v15
   pause-motion control, reveal-on-scroll, work filters, laptop stories slider.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- motion control (fenrir signature) ---------------- */
  var root = document.documentElement;
  var MOTION_KEY = 'rb-motion';
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyMotion(on) {
    root.classList.toggle('motion-off', !on);
    var btn = document.getElementById('motionBtn');
    if (btn) btn.setAttribute('aria-pressed', on ? 'false' : 'true');
    if (typeof window.orStoriesAuto === 'function') window.orStoriesAuto(on);
  }

  function storedMotion() {
    try { var v = localStorage.getItem(MOTION_KEY); if (v === 'off') return false; if (v === 'on') return true; } catch (e) {}
    return null;
  }

  var initial = storedMotion();
  if (initial === null) initial = !media.matches;
  applyMotion(initial);

  var motionBtn = document.getElementById('motionBtn');
  if (motionBtn) {
    motionBtn.addEventListener('click', function () {
      var on = root.classList.contains('motion-off'); // paused right now -> turning motion on
      try { localStorage.setItem(MOTION_KEY, on ? 'on' : 'off'); } catch (e) {}
      applyMotion(on);
    });
  }
  if (media.addEventListener) {
    media.addEventListener('change', function (e) {
      if (storedMotion() === null) applyMotion(!e.matches);
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !root.classList.contains('motion-off')) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- year ---------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------- work category filters ---------------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.work-chip'));
  var workCards = Array.prototype.slice.call(document.querySelectorAll('.work-card'));
  if (chips.length && workCards.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        workCards.forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-cat') === f;
          if (show) card.removeAttribute('hidden');
          else card.setAttribute('hidden', '');
        });
      });
    });
  }

  /* ---------------- laptop stories slider ---------------- */
  var container = document.getElementById('vibeStories');
  if (!container) return;

  var STORIES = [
    {
      image: 'assets/stories/story-1.webp',
      srcset: 'assets/stories/story-1-640.webp 640w, assets/stories/story-1.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-1/'
    },
    {
      image: 'assets/stories/story-2.webp',
      srcset: 'assets/stories/story-2-640.webp 640w, assets/stories/story-2.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-2/'
    },
    {
      image: 'assets/stories/story-3.webp',
      srcset: 'assets/stories/story-3-640.webp 640w, assets/stories/story-3.webp 1280w',
      imageHeight: 959,
      objectPosition: 'center center',
      link: 'https://godde3s.github.io/Usf/en/vibe-stories/story-3/'
    },
    {
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
    dots.forEach(function (dot, i) { dot.classList.toggle('active', i === currentIndex); });
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
      leaving.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
    }, TRANSITION_MS);
  }

  function go(delta) {
    if (isPaginating) return;
    isPaginating = true;
    var idx = (currentIndex + delta + STORIES.length) % STORIES.length;
    slideTo(idx, delta > 0 ? 'slide-left' : 'slide-right');
    currentIndex = idx;
    syncInfo();
    window.setTimeout(function () { isPaginating = false; }, PAGINATE_LOCK_MS);
  }

  function setIndex(index) {
    if (index === currentIndex || isPaginating) return;
    slideTo(index, index > currentIndex ? 'slide-left' : 'slide-right');
    currentIndex = index;
    syncInfo();
  }

  function startAutoplay() {
    if (!wantAutoplay) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(function () {
      if (!isPaginating) go(1);
    }, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayTimer) { window.clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  // motion-toggle hook
  window.orStoriesAuto = function (on) { wantAutoplay = on; if (on) startAutoplay(); else stopAutoplay(); };

  var prevBtn = container.querySelector('.nav-btn.prev');
  var nextBtn = container.querySelector('.nav-btn.next');
  if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); stopAutoplay(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(1); stopAutoplay(); startAutoplay(); });
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
      go(e.deltaX > 0 ? 1 : -1);
    }
  }, { passive: false });

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
    go(dx < 0 ? 1 : -1);
    stopAutoplay(); startAutoplay();
  }, { passive: true });

  wantAutoplay = !root.classList.contains('motion-off');
  syncInfo();
  if (wantAutoplay) startAutoplay();
})();
