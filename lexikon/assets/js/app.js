/* Router, Menü und Seitensteuerung. */
(function (HD) {
  "use strict";

  var C = HD.core, t = C.t;
  var app = document.getElementById("app");
  var current = { view: null, page: null };

  /* ---------- Statische Texte ---------- */
  function applyStaticI18n() {
    document.documentElement.lang = C.state.lang;
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-book-title]"), function (el) {
      el.textContent = C.title(HD.structure.book);
    });
    document.querySelector("[data-route-home]").setAttribute("href", C.href.home());
    document.querySelector('[data-nav="home"]').setAttribute("href", C.href.home());
    document.querySelector('[data-nav="toc"]').setAttribute("href", C.href.toc());
    document.querySelector('[data-nav="regions"]').setAttribute("href", C.href.node(C.byNumber[HD.site.regionsChapter]));
    document.querySelector("[data-intro-link]").setAttribute("href", C.href.intro());
    document.querySelector("[data-legal-link]").setAttribute("href", C.href.legal());
    document.querySelector("[data-drawer-nav]").innerHTML = HD.views.drawerNav();
    document.querySelector("[data-footer-nav]").innerHTML = HD.views.footerNav();
  }

  /* ---------- Routing ---------- */
  function scrollToSection(section, smooth) {
    var el = section && document.getElementById("s-" + section.slug);
    if (!el) return;
    el.classList.add("is-visible");
    el.scrollIntoView({ behavior: smooth && !HD.motion.reduced() ? "smooth" : "auto", block: "start" });
  }

  function render() {
    var route = C.parseHash(location.hash);
    var langChanged = route.lang !== C.state.lang;
    C.state.lang = route.lang;
    if (langChanged || !current.view) applyStaticI18n();

    if (route.view === "entry" && current.view === "entry" && current.page === route.page && !langChanged) {
      scrollToSection(route.section, true);
      return;
    }

    var html, docTitle = C.title(HD.structure.book);
    if (route.view === "home") html = HD.views.home();
    else if (route.view === "intro") html = HD.views.intro();
    else if (route.view === "toc") { html = HD.views.toc(); docTitle = t("navToc") + " – " + docTitle; }
    else if (route.view === "legal") { html = HD.views.legal(); docTitle = t("legalTitle") + " – " + docTitle; }
    else if (route.view === "entry") {
      html = HD.views.entry(route.page);
      docTitle = route.page.number + " " + C.title(route.page) + " – " + docTitle;
    } else { html = HD.views.notFound(); docTitle = t("notFound") + " – " + docTitle; }

    var first = current.view === null;
    current = { view: route.view, page: route.page || null };

    app.innerHTML = html;
    document.title = docTitle;
    document.body.dataset.view = route.view;
    app.classList.remove("is-entering");
    void app.offsetWidth;
    app.classList.add("is-entering");

    setActiveNav(route);
    HD.motion.mount(app);
    bindPage();

    if (route.section) {
      requestAnimationFrame(function () { scrollToSection(route.section, false); });
    } else {
      window.scrollTo(0, 0);
    }
    if (!first) {
      var h1 = app.querySelector("h1");
      if (h1) h1.focus({ preventScroll: true });
    }
  }

  function setActiveNav(route) {
    var regions = C.byNumber[HD.site.regionsChapter];
    var inRegions = route.view === "entry" && (route.page === regions || route.page.parent === regions);
    var active = route.view === "home" ? "home" : route.view === "toc" ? "toc" : inRegions ? "regions" : null;
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      if (a.dataset.nav === active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---------- Seitenspezifische Bedienelemente ---------- */
  function bindPage() {
    HD.atlas.mount(app);
    var filter = app.querySelector("[data-toc-filter]");
    if (filter) {
      var rootList = app.querySelector(".tree");
      filter.addEventListener("input", function () { filterTree(rootList, C.fold(filter.value.trim())); });
      app.querySelector("[data-toc-expand]").addEventListener("click", function () { toggleAll(true); });
      app.querySelector("[data-toc-collapse]").addEventListener("click", function () { toggleAll(false); });
    }
    var box = app.querySelector("[data-toc-box]");
    if (box && matchMedia("(max-width: 959px)").matches) box.open = false;
  }

  function toggleAll(open) {
    Array.prototype.forEach.call(app.querySelectorAll(".tree details"), function (d) { d.open = open; });
  }

  function filterTree(list, q) {
    var any = false;
    Array.prototype.forEach.call(list.children, function (li) {
      var own = !q || li.dataset.text.indexOf(q) >= 0;
      var sub = li.querySelector(":scope > details > ol");
      var childMatch = sub ? filterTree(sub, own ? "" : q) : false;
      var visible = own || childMatch;
      li.hidden = !visible;
      if (q && childMatch && !own) li.querySelector(":scope > details").open = true;
      any = any || visible;
    });
    return any;
  }

  /* ---------- Mobiles Menü ---------- */
  var drawer = document.querySelector("[data-drawer]");
  var menuBtn = document.querySelector("[data-menu-open]");

  function openDrawer() {
    drawer.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("is-locked");
    requestAnimationFrame(function () { drawer.classList.add("is-open"); });
    drawer.querySelector("[data-menu-close].icon-btn").focus();
  }

  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("is-locked");
    setTimeout(function () { drawer.hidden = true; }, HD.motion.reduced() ? 0 : 300);
    menuBtn.focus();
  }

  menuBtn.addEventListener("click", openDrawer);
  drawer.addEventListener("click", function (e) {
    if (e.target.closest("[data-menu-close]") || e.target.closest("a")) closeDrawer();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  /* Klick auf bereits aktiven Abschnittslink: trotzdem hinscrollen */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute("href") === location.hash) {
      var route = C.parseHash(location.hash);
      if (route.section) { e.preventDefault(); scrollToSection(route.section, true); }
    }
  });

  /* ---------- Start ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-intro-enter]")) {
      try { localStorage.setItem("hd-intro-seen", "1"); } catch (err) { /* z. B. privater Modus */ }
    }
  });

  function shouldShowIntro() {
    var route = C.parseHash(location.hash);
    if (route.view !== "home" || HD.site.intro === "off") return false;
    if (HD.site.intro === "always") return true;
    try { return !localStorage.getItem("hd-intro-seen"); } catch (err) { return false; }
  }

  HD.search.init();
  window.addEventListener("hashchange", render);
  if (shouldShowIntro()) history.replaceState(null, "", C.href.intro());
  else if (!location.hash) history.replaceState(null, "", C.href.home());
  render();
})(window.HD);
