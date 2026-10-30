/* Scroll-Effekte. Bei "prefers-reduced-motion" bleiben nur statische Zustände. */
(function (HD) {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var observers = [];
  var scrollHandlers = [];
  var ticking = false;

  function observe(targets, cb, options) {
    if (!targets.length) return;
    var io = new IntersectionObserver(cb, options);
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
    observers.push(io);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      scrollHandlers.forEach(function (fn) { fn(); });
    });
  }

  /* Einblenden beim Scrollen */
  function reveals(root) {
    var items = root.querySelectorAll(".reveal, .entry-section, .story__step, .rail-card");
    if (reduce.matches) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-visible"); });
      return;
    }
    observe(items, function (entries, io) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  }

  /* Hero-Bild wächst beim Scrollen auf volle Breite */
  function hero(root) {
    var media = root.querySelector("[data-hero-media]");
    if (!media) return;
    scrollHandlers.push(function () {
      var r = media.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
      media.style.setProperty("--hero-p", reduce.matches ? 1 : p.toFixed(3));
    });
  }

  /* Lesefortschritt */
  function progress() {
    var bar = document.querySelector(".progress span");
    scrollHandlers.push(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
      document.querySelector("[data-header]").classList.toggle("is-scrolled", window.scrollY > 8);
    });
  }

  /* Struktur-Erzählung: Begleitbild folgt dem aktiven Schritt */
  function story(root) {
    var box = root.querySelector("[data-story]");
    if (!box) return;
    var index = box.querySelector("[data-story-index]");
    var caption = box.querySelector("[data-story-caption]");
    var visual = box.querySelector(".story__visual");
    var steps = box.querySelectorAll(".story__step");
    observe(steps, function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.dataset.step;
        Array.prototype.forEach.call(steps, function (s) { s.classList.toggle("is-active", s === e.target); });
        var n = (i + 1 < 10 ? "0" : "") + (i + 1);
        if (index.textContent === n) return;
        visual.classList.add("is-switching");
        setTimeout(function () {
          index.textContent = n;
          caption.textContent = e.target.dataset.stepTitle;
          visual.style.setProperty("--step", i);
          visual.classList.remove("is-switching");
        }, reduce.matches ? 0 : 180);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
  }

  /* Kennzahlen zählen hoch */
  function counters(root) {
    var nums = root.querySelectorAll("[data-count]");
    if (reduce.matches) return;
    Array.prototype.forEach.call(nums, function (el) { el.textContent = "0"; });
    observe(nums, function (entries, io) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var target = +e.target.dataset.count, start = performance.now(), dur = 1100;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur);
          e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.6 });
  }

  /* Hervorhebung im Eintrags-Inhaltsverzeichnis */
  function scrollspy(root) {
    var links = root.querySelectorAll("[data-spy]");
    if (!links.length) return;
    var map = {};
    Array.prototype.forEach.call(links, function (a) { map[a.dataset.spy] = a; });
    observe(root.querySelectorAll(".entry-section"), function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Array.prototype.forEach.call(links, function (a) { a.classList.remove("is-current"); a.removeAttribute("aria-current"); });
        var link = map[e.target.id];
        if (link) { link.classList.add("is-current"); link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
  }

  /* Horizontale Kartenreihe */
  function rail(root) {
    var track = root.querySelector("[data-rail]");
    if (!track) return;
    function by(dir) {
      var card = track.querySelector(".rail-card");
      var step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * step, behavior: reduce.matches ? "auto" : "smooth" });
    }
    root.querySelector("[data-rail-prev]").addEventListener("click", function () { by(-1); });
    root.querySelector("[data-rail-next]").addEventListener("click", function () { by(1); });
  }

  function mount(root) {
    observers.forEach(function (io) { io.disconnect(); });
    observers = [];
    scrollHandlers = [];
    progress();
    reveals(root);
    hero(root);
    story(root);
    counters(root);
    scrollspy(root);
    rail(root);
    onScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  HD.motion = { mount: mount, reduced: function () { return reduce.matches; } };
})(window.HD);
