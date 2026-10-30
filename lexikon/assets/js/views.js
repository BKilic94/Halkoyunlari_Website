/* Seitenvorlagen: Startseite, Inhaltsverzeichnis, Lexikoneintrag. */
(function (HD) {
  "use strict";

  var C = HD.core, t = C.t, esc = C.esc;

  function T(node) { return esc(C.title(node)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Platzhalter ---------- */
  var IMG_ICON =
    '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="9" width="38" height="30" rx="3"/>' +
    '<circle cx="17" cy="20" r="4"/><path d="m7 36 11-11 8 8 5-5 10 10"/></svg>';

  function ph(ratio, opts) {
    opts = opts || {};
    return '<figure class="ph ph--' + ratio + (opts.cls ? " " + opts.cls : "") + '" role="img" aria-label="' +
      esc(t("phImage") + " – " + t("phImageNote")) + '">' +
      '<div class="ph__inner">' + IMG_ICON +
      '<span class="ph__label">' + esc(opts.label || t("phImage")) + "</span>" +
      '<span class="ph__note">' + esc(t("phImageNote")) + " · " + ratio.replace("x", ":") + "</span>" +
      "</div></figure>";
  }

  function phText(lines, variant) {
    var widths = [100, 96, 98, 88, 94, 72, 99, 91, 60];
    var out = '<div class="ph-text' + (variant ? " ph-text--" + variant : "") + '" role="note">' +
      '<span class="ph-tag">' + esc(variant === "lead" ? t("phLead") : t("phText")) +
      " · " + esc(t("phTextNote")) + "</span>";
    for (var i = 0; i < lines; i++) {
      var w = i === lines - 1 ? 55 : widths[i % widths.length];
      out += '<span class="ph-line" style="width:' + w + '%"></span>';
    }
    return out + "</div>";
  }

  function arrow(dir) {
    return '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="' +
      (dir === "left" ? "M19 12H5m6-6-6 6 6 6" : "M5 12h14m-6-6 6 6-6 6") + '"/></svg>';
  }

  /* ---------- Startseite ---------- */
  function home() {
    var chapters = HD.structure.chapters;
    var regionsCh = C.byNumber[HD.site.regionsChapter];
    var formsCh = C.byNumber[HD.site.featuredForms];
    var regions = C.subpagesOf(regionsCh);
    var bookTitle = C.title(HD.structure.book);
    var words = bookTitle.split(" ");

    var html = "";

    /* Hero */
    html +=
      '<section class="hero">' +
      '<div class="container hero__copy">' +
      '<p class="eyebrow reveal">' + esc(t("siteKicker")) + "</p>" +
      '<h1 class="hero__title reveal">' +
      words.slice(0, 2).map(function (w) { return "<span>" + esc(w) + "</span>"; }).join(" ") +
      ' <span class="hero__accent">' + esc(words.slice(2).join(" ")) + "</span></h1>" +
      '<p class="hero__lead reveal">' + esc(t("heroLead")) + "</p>" +
      '<p class="hero__by reveal">' + esc(t("preparedBy")) + " · " + esc(HD.structure.book.author) + "</p>" +
      '<div class="hero__cta reveal">' +
      '<a class="btn btn--primary" href="' + C.href.toc() + '">' + esc(t("ctaToc")) + arrow() + "</a>" +
      '<button class="btn btn--ghost" type="button" data-search-open>' + esc(t("ctaSearch")) + "</button>" +
      "</div></div>" +
      '<div class="hero__media" data-hero-media>' + ph("21x9", { cls: "ph--hero" }) + "</div>" +
      "</section>";

    html += frontMatter();

    /* Kennzahlen */
    html +=
      '<section class="stats container">' +
      stat(chapters.length, t("statChapters")) +
      stat(regions.length, t("statRegions")) +
      stat(C.all.length, t("statHeadings")) +
      "</section>";

    /* Struktur als Scroll-Erzählung */
    html +=
      '<section class="story" data-story>' +
      '<div class="container">' +
      '<header class="section-head reveal"><h2>' + esc(t("sectionStructure")) + "</h2>" +
      "<p>" + esc(t("sectionStructureLead")) + "</p></header>" +
      '<div class="story__grid">' +
      '<div class="story__sticky" aria-hidden="true"><div class="story__visual">' +
      ph("4x5", { cls: "ph--story" }) +
      '<span class="story__index" data-story-index>01</span>' +
      '<span class="story__caption" data-story-caption>' + esc(C.title(HD.site.groups[0])) + "</span>" +
      "</div></div>" +
      '<div class="story__steps">' +
      HD.site.groups.map(function (g, i) {
        return '<article class="story__step" data-step="' + i + '" data-step-title="' + esc(C.title(g)) + '">' +
          '<p class="eyebrow">' + pad(i + 1) + " / " + pad(HD.site.groups.length) + "</p>" +
          "<h3>" + esc(C.title(g)) + "</h3>" +
          '<ol class="chapter-list">' +
          g.chapters.map(function (num) {
            var ch = C.byNumber[num];
            var sub = C.countDescendants(ch);
            return '<li><a href="' + C.href.node(ch) + '"><span class="num">' + esc(ch.number) + "</span>" +
              '<span class="chapter-list__title"' + C.titleLangAttr(ch) + ">" + T(ch) + "</span>" +
              (sub ? '<span class="chapter-list__meta">' + esc(t("subheadings", { n: sub })) + "</span>" : "") +
              arrow() + "</a></li>";
          }).join("") +
          "</ol></article>";
      }).join("") +
      "</div></div></div></section>";

    /* Alle Kapitel wie im Inhaltsverzeichnis */
    html +=
      '<section class="home-toc container">' +
      '<header class="section-head section-head--row reveal"><div>' +
      '<p class="eyebrow">' + esc(t("navToc")) + "</p>" +
      "<h2>" + esc(t("sectionAllChapters")) + "</h2>" +
      "<p>" + esc(t("sectionAllChaptersLead")) + "</p></div>" +
      '<a class="btn btn--ghost" href="' + C.href.toc() + '">' + esc(t("ctaToc")) + arrow() + "</a>" +
      "</header>" +
      '<div class="reveal">' + tree(chapters, { open: function () { return false; } }) + "</div>" +
      "</section>";

    /* Dansformen als horizontale Reihe */
    html +=
      '<section class="rail-section">' +
      '<div class="container"><header class="section-head section-head--row reveal">' +
      '<div><p class="eyebrow">' + esc(t("chapter")) + " " + esc(formsCh.number) + "</p>" +
      "<h2>" + esc(t("sectionForms")) + "</h2></div>" +
      '<div class="rail-controls">' +
      '<button class="icon-btn" type="button" data-rail-prev aria-label="' + esc(t("prev")) + '">' + arrow("left") + "</button>" +
      '<button class="icon-btn" type="button" data-rail-next aria-label="' + esc(t("next")) + '">' + arrow() + "</button>" +
      "</div></header></div>" +
      '<div class="rail" data-rail tabindex="0">' +
      C.subpagesOf(formsCh).map(function (f) {
        return '<a class="rail-card" href="' + C.href.node(f) + '">' + ph("4x5") +
          '<span class="rail-card__num">' + esc(f.number) + "</span>" +
          '<span class="rail-card__title"' + C.titleLangAttr(f) + ">" + T(f) + "</span></a>";
      }).join("") +
      "</div></section>";

    /* Yöreler */
    html +=
      '<section class="regions container">' +
      '<header class="section-head reveal"><p class="eyebrow">' + esc(t("chapter")) + " " + esc(regionsCh.number) + "</p>" +
      "<h2>" + esc(t("sectionRegions")) + "</h2><p>" + esc(t("sectionRegionsLead")) + "</p></header>" +
      regionMap(regions) +
      '<div class="card-grid">' + regions.map(card).join("") + "</div>" +
      "</section>";

    return html;
  }

  function rich(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  /* Einleitungsseiten des Buches: Porträt, Kurzbiografie, Önsöz */
  function frontMatter() {
    var f = HD.front && (HD.front[C.state.lang] || HD.front[HD.site.defaultLang]);
    if (!f) return "";
    var lang = HD.front[C.state.lang] ? "" : ' lang="' + HD.site.defaultLang + '"';
    var p = f.portrait;
    return '<section class="author container"' + lang + ">" +
      '<figure class="author__portrait reveal"><img src="' + esc(p.src) + '" width="' + p.width + '" height="' + p.height +
      '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async"></figure>' +
      '<div class="author__text">' +
      '<p class="eyebrow reveal">' + esc(t("preparedBy")) + "</p>" +
      '<h2 class="reveal">' + esc(f.author) + "</h2>" +
      f.bio.map(function (para) { return '<p class="author__bio reveal">' + rich(para) + "</p>"; }).join("") +
      "</div></section>" +
      '<section class="preface"' + lang + ">" +
      '<div class="kilim-band" aria-hidden="true"></div>' +
      '<div class="container preface__inner">' +
      '<h2 class="reveal">' + esc(f.preface.title) + "</h2>" +
      f.preface.paragraphs.map(function (para) { return '<p class="reveal">' + rich(para) + "</p>"; }).join("") +
      '<p class="preface__sign reveal">' + f.preface.signature.map(function (s, i) {
        return i ? "<span>" + esc(s) + "</span>" : "<strong>" + esc(s) + "</strong>";
      }).join("") + "</p>" +
      "</div></section>";
  }

  function stat(n, label) {
    return '<div class="stat reveal"><span class="stat__num" data-count="' + n + '">' + n + "</span>" +
      '<span class="stat__label">' + esc(label) + "</span></div>";
  }

  /* Vereinfachte Kartenskizze: Punkte nach Längen-/Breitengrad, kein Kartenmaterial */
  function regionMap(regions) {
    var lon = [25.5, 45], lat = [35.8, 42.3];
    return '<div class="region-map reveal">' +
      '<div class="region-map__ph"><span class="ph__label">' + esc(t("mapPlaceholder")) + "</span>" +
      '<span class="ph__note">' + esc(t("phImageNote")) + "</span></div>" +
      regions.map(function (r) {
        var geo = HD.site.regionGeo[r.number];
        if (!geo) return "";
        var x = ((geo[0] - lon[0]) / (lon[1] - lon[0])) * 100;
        var y = (1 - (geo[1] - lat[0]) / (lat[1] - lat[0])) * 100;
        var edge = x > 75 ? " region-dot--end" : x < 20 ? " region-dot--start" : "";
        return '<a class="region-dot' + edge + '" style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) + '%" href="' +
          C.href.node(r) + '"><span class="region-dot__label"' + C.titleLangAttr(r) + ">" + T(r) + "</span></a>";
      }).join("") +
      "</div>";
  }

  function card(node) {
    var sub = C.countDescendants(node);
    return '<a class="card reveal" href="' + C.href.node(node) + '">' + ph("3x2") +
      '<span class="card__body"><span class="num">' + esc(node.number) + "</span>" +
      '<span class="card__title"' + C.titleLangAttr(node) + ">" + T(node) + "</span>" +
      (sub ? '<span class="card__meta">' + esc(t("subheadings", { n: sub })) + "</span>" : "") +
      "</span></a>";
  }

  /* ---------- Lexikoneintrag ---------- */
  function entry(page) {
    var trail = C.ancestors(page);
    var sections = C.sectionsOf(page);
    var subpages = C.subpagesOf(page);
    var nb = C.neighbours(page);
    var sub = C.countDescendants(page);
    var src = page.source.number && page.source.number !== page.number
      ? ' · <span class="entry__src">' + esc(t("sourceNumber", { n: page.source.number })) + "</span>" : "";

    var html = '<article class="entry">';

    html +=
      '<header class="entry__header container">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><ol>' +
      '<li><a href="' + C.href.home() + '">' + esc(t("navHome")) + "</a></li>" +
      trail.map(function (a) {
        return '<li><a href="' + C.href.node(a) + '">' + esc(a.number) + " " + T(a) + "</a></li>";
      }).join("") +
      '<li aria-current="page">' + esc(page.number) + "</li></ol></nav>" +
      '<p class="entry__number">' + esc(t("chapter")) + " " + esc(page.number) + "</p>" +
      '<h1 class="entry__title" tabindex="-1"' + C.titleLangAttr(page) + ">" + T(page) + "</h1>" +
      '<p class="entry__meta">' + (sub ? esc(t("subheadings", { n: sub })) : "&nbsp;") + src + "</p>" +
      phText(3, "lead") +
      "</header>";

    html += '<div class="entry__hero container-wide reveal">' + ph("21x9") + "</div>";

    html += '<div class="entry__body container' + (sections.length ? " has-toc" : "") + '">';

    if (sections.length) {
      html +=
        '<aside class="entry__toc">' +
        '<details class="toc-box" data-toc-box open><summary>' + esc(t("inThisEntry")) + "</summary>" +
        "<ol>" + sections.map(function (s) {
          return '<li><a href="' + C.href.node(s) + '" data-spy="s-' + esc(s.slug) + '">' +
            '<span class="num">' + esc(s.number) + "</span><span" + C.titleLangAttr(s) + ">" + T(s) + "</span></a></li>";
        }).join("") + "</ol></details></aside>";
    }

    html += '<div class="entry__content">';

    if (sections.length) {
      html += sections.map(function (s, i) {
        return '<section class="entry-section" id="s-' + esc(s.slug) + '">' +
          '<h2><span class="num">' + esc(s.number) + "</span> <span" + C.titleLangAttr(s) + ">" + T(s) + "</span></h2>" +
          phText(i % 2 ? 5 : 7) +
          (i % 3 === 1 ? ph("3x2") : "") +
          "</section>";
      }).join("");
    } else if (subpages.length) {
      html += phText(5) + '<div class="card-grid card-grid--entry">' + subpages.map(card).join("") + "</div>";
    } else {
      html += phText(8) + ph("16x9") + phText(6) + phText(4);
    }

    html += "</div></div>";

    html += '<nav class="pager container" aria-label="' + esc(t("prev") + " / " + t("next")) + '">' +
      pagerLink(nb.prev, "prev") + pagerLink(nb.next, "next") + "</nav>";

    return html + "</article>";
  }

  function pagerLink(node, dir) {
    if (!node) return '<span class="pager__spacer"></span>';
    return '<a class="pager__link pager__link--' + dir + '" href="' + C.href.node(node) + '" rel="' + dir + '">' +
      '<span class="pager__dir">' + (dir === "prev" ? arrow("left") : "") + esc(t(dir)) + (dir === "next" ? arrow() : "") + "</span>" +
      '<span class="pager__title"><span class="num">' + esc(node.number) + "</span> <span" + C.titleLangAttr(node) + ">" + T(node) + "</span></span></a>";
  }

  /* ---------- Inhaltsverzeichnis ---------- */
  function tree(nodes, opts) {
    return '<ol class="tree tree--l' + nodes[0].level + '">' + nodes.map(function (n) {
      var link = '<a href="' + C.href.node(n) + '"><span class="num">' + esc(n.number) + "</span>" +
        "<span" + C.titleLangAttr(n) + ">" + T(n) + "</span></a>";
      if (!n.children.length) return '<li data-text="' + esc(C.fold(n.number + " " + C.title(n))) + '">' + link + "</li>";
      var open = opts.open && opts.open(n) ? " open" : "";
      return '<li data-text="' + esc(C.fold(n.number + " " + C.title(n))) + '"><details' + open + "><summary>" + link +
        '<span class="tree__count">' + n.children.length + "</span></summary>" + tree(n.children, opts) + "</details></li>";
    }).join("") + "</ol>";
  }

  function toc() {
    return '<section class="toc-page container">' +
      '<header class="toc-page__head">' +
      '<p class="eyebrow">' + esc(C.title(HD.structure.book)) + "</p>" +
      '<h1 tabindex="-1">' + esc(t("navToc")) + "</h1>" +
      '<p class="lead">' + esc(t("tocLead")) + "</p>" +
      '<div class="toc-tools">' +
      '<input type="search" class="input" data-toc-filter placeholder="' + esc(t("tocFilter")) + '" aria-label="' + esc(t("tocFilter")) + '">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-toc-expand>' + esc(t("expandAll")) + "</button>" +
      '<button class="btn btn--ghost btn--sm" type="button" data-toc-collapse>' + esc(t("collapseAll")) + "</button>" +
      "</div></header>" +
      tree(HD.structure.chapters, { open: function (n) { return n.level === 1; } }) +
      "</section>";
  }

  function drawerNav() {
    return '<a class="drawer__link" href="' + C.href.home() + '">' + esc(t("navHome")) + "</a>" +
      '<a class="drawer__link" href="' + C.href.toc() + '">' + esc(t("navToc")) + "</a>" +
      tree(HD.structure.chapters, { open: function () { return false; } });
  }

  function footerNav() {
    return HD.site.groups.map(function (g) {
      return '<div><p class="site-footer__group">' + esc(C.title(g)) + "</p><ul>" +
        g.chapters.map(function (num) {
          var ch = C.byNumber[num];
          return '<li><a href="' + C.href.node(ch) + '"' + C.titleLangAttr(ch) + ">" + T(ch) + "</a></li>";
        }).join("") + "</ul></div>";
    }).join("");
  }

  /* Willkommensseite vor der Startseite */
  function intro() {
    var words = C.title(HD.structure.book).split(" ");
    var regionsNum = HD.site.regionsChapter;
    var topics = HD.structure.chapters.map(function (ch) {
      var subs = C.subpagesOf(ch).length;
      var meta = !subs ? "" : ch.number === regionsNum
        ? subs + " " + t("statRegions").toLocaleLowerCase(C.state.lang)
        : t("subheadings", { n: subs });
      return '<li class="intro-topic"><a href="' + C.href.node(ch) + '" data-intro-enter>' +
        '<span class="num">' + esc(ch.number) + "</span>" +
        '<span class="intro-topic__title"' + C.titleLangAttr(ch) + ">" + T(ch) + "</span>" +
        (meta ? '<span class="intro-topic__count">' + esc(meta) + "</span>" : "") +
        "</a></li>";
    }).join("");
    var how = ["introHow1", "introHow2", "introHow3"].map(function (k) { return "<li>" + esc(t(k)) + "</li>"; }).join("");

    return '<section class="intro">' +
      '<figure class="intro__hero">' +
      '<img src="assets/img/hosgeldiniz.jpg" width="1672" height="941" alt="' + esc(t("introImageAlt")) + '" fetchpriority="high">' +
      '<a class="intro__skip" href="' + C.href.home() + '" data-intro-enter>' + esc(t("introEnter")) + arrow() + "</a>" +
      "</figure>" +
      '<div class="intro__inner container">' +
      '<p class="eyebrow">' + esc(t("introKicker")) + "</p>" +
      '<h1 class="visually-hidden" tabindex="-1">' + esc(words.join(" ")) + "</h1>" +
      '<p class="intro__by">' + esc(t("preparedBy")) + " · " + esc(HD.structure.book.author) + "</p>" +
      '<p class="intro__lead">' + esc(t("introLead")) + "</p>" +
      '<h2 class="intro__h2">' + esc(t("introTopicsTitle")) + "</h2>" +
      '<ol class="intro-topics">' + topics + "</ol>" +
      '<ul class="intro__how">' + how + "</ul>" +
      '<div class="intro__cta"><a class="btn btn--primary btn--lg" href="' + C.href.home() + '" data-intro-enter>' +
      esc(t("introEnter")) + arrow() + "</a></div>" +
      "</div></section>";
  }

  function notFound() {
    return '<section class="container notfound"><p class="eyebrow">404</p>' +
      '<h1 tabindex="-1">' + esc(t("notFound")) + "</h1><p class=\"lead\">" + esc(t("notFoundLead")) + "</p>" +
      '<p><a class="btn btn--primary" href="' + C.href.home() + '">' + esc(t("navHome")) + arrow() + "</a></p></section>";
  }

  HD.views = { home: home, entry: entry, toc: toc, intro: intro, notFound: notFound, drawerNav: drawerNav, footerNav: footerNav };
})(window.HD);
