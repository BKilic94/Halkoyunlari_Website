/* Seitenvorlagen: Startseite, Inhaltsverzeichnis, Lexikoneintrag. */
(function (HD) {
  "use strict";

  var C = HD.core, t = C.t, esc = C.esc;

  var WELCOME_IMG = "assets/img/hosgeldiniz.jpg";

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
      '<a class="btn btn--ghost" href="' + C.href.intro() + '">' + arrow("left") + esc(t("introBack")) + "</a>" +
      "</div></div>" +
      '<div class="hero__media" data-hero-media><figure class="hero-img">' +
      '<img src="' + WELCOME_IMG + '" width="1672" height="941" alt="' + esc(t("introImageAlt")) + '" fetchpriority="high">' +
      "</figure></div>" +
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
      '<figure class="story-img"><span class="story-img__bg" style="background-image:url(' + WELCOME_IMG + ')"></span>' +
      '<img src="' + WELCOME_IMG + '" width="1672" height="941" alt="" loading="lazy"></figure>' +
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
        return '<a class="rail-card" href="' + C.href.node(f) + '">' + media(f, "4x5") +
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

  /* Kapiteltexte: kleiner Markdown-Ausschnitt (Absatz, Listen, fett, kursiv, unterstrichen) */
  function inline(s) {
    return esc(s.replace(/\\([<>&|~^=$%@])/g, "$1"))
      .replace(/\\([\\`*_{}\[\]()#+\-.!>"'])/g, function (_, c) { return "&#" + c.charCodeAt(0) + ";"; })
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/&lt;(\/?)(u|strong|em|b|i|sup|sub)&gt;/g, "<$1$2>")
      .replace(/&lt;br\s*\/?&gt;/g, "<br>")
      // Externe Links der Quelle sind meist unvollständig (z. B. "https://www"): nur den Text zeigen
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)\s]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\(#node:([\d.]+)\)/g, function (all, text, num) {
        var n = C.byNumber[num];
        return n ? '<a href="' + C.href.node(n) + '">' + text + "</a>" : text;
      });
  }


  function figure(imgs) {
    var sizes = (HD.content && HD.content.images) || {};
    return '<figure class="prose-figure' + (imgs.length === 1 ? " prose-figure--single" : "") + '">' +
      imgs.map(function (m) {
        var wh = sizes[m[2]] || [];
        // Word-Autotexte ("Automatisch generierte Beschreibung") sind keine sinnvollen Alternativtexte
        var alt = /Automatisch generierte/.test(m[1]) ? "" : m[1];
        // Einheitliche Höhe (max. 300 px), nie vergrößert, nie beschnitten
        var style = wh.length ? ' style="width:' + Math.round(Math.min(wh[0], wh[0] * 300 / wh[1])) + 'px"' : "";
        return '<img src="' + esc(m[2]) + '"' + (wh.length ? ' width="' + wh[0] + '" height="' + wh[1] + '"' : "") + style +
          ' alt="' + esc(alt) + '" loading="lazy" decoding="async">';
      }).join("") + "</figure>";
  }

  function coverOf(node) {
    if (HD.site.covers && HD.site.covers[node.number]) return HD.site.covers[node.number];
    var c = HD.content && HD.content[HD.site.defaultLang];
    var m = c && c[node.number] && c[node.number].match(/!\[[^\]]*\]\(([^)\s]+)\)/);
    return m ? m[1] : null;
  }

  function media(node, ratio) {
    var src = coverOf(node);
    if (!src) return ph(ratio);
    return '<figure class="cover cover--' + ratio + '"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></figure>';
  }

  function prose(src) {
    var blocks = src.split(/\n\s*\n/), out = [], imgs = [];
    blocks.forEach(function (b) {
      // Ein Block kann mehrere Bilder direkt hintereinander enthalten
      if (/^(\s*!\[[^\]]*\]\([^)\s]+\)\s*)+$/.test(b)) {
        b.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (all, alt, src) { imgs.push([all, alt, src]); });
        return;
      }
      // Bild mitten in einem Absatz: Text und Bild trennen
      if (/!\[[^\]]*\]\([^)\s]+\)/.test(b) && !/^\s*(\||<table)/i.test(b)) {
        b.split(/(!\[[^\]]*\]\([^)\s]+\))/).forEach(function (part) {
          var im = part.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
          if (im) { imgs.push(im); return; }
          if (!part.trim()) return;
          if (imgs.length) { out.push(figure(imgs)); imgs = []; }
          out.push(block(part.trim()));
        });
        return;
      }
      if (imgs.length) { out.push(figure(imgs)); imgs = []; }
      var t = parseTable(b);
      var prev = out[out.length - 1];
      if (t && prev && prev.rows && prev.rows[0].length === t.rows[0].length && !t.head) {
        // Fortsetzung einer Tabelle (Seitenumbruch im Buch); wiederholte Zeilen nur einmal
        var seen = prev.rows.map(function (r) { return r.join("\u0001"); });
        t.rows.forEach(function (r) { if (seen.indexOf(r.join("\u0001")) < 0) prev.rows.push(r); });
        return;
      }
      out.push(t || block(b));
    });
    if (imgs.length) out.push(figure(imgs));
    return out.map(function (o) { return typeof o === "string" ? o : renderTable(o); }).join("");
  }

  function parseTable(src) {
    var s = src.trim(), rows = [], head = null;
    if (/^<table[\s>]/i.test(s)) {
      s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, function (_, tr) {
        var cells = [];
        tr.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, function (__, td) { cells.push(td.replace(/\s+/g, " ").trim()); });
        if (cells.length) rows.push(cells);
      });
    } else {
      var lines = s.split("\n");
      if (lines.length < 2 || !lines.every(function (l) { return /^\s*\|/.test(l); })) return null;
      var split = function (l) { return l.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); }); };
      if (/^\s*\|?\s*:?-{3,}/.test(lines[1])) { head = split(lines[0]); lines = lines.slice(2); }
      rows = lines.map(split);
    }
    return rows.length || head ? { head: head, rows: rows.length ? rows : [head.map(function () { return ""; })] } : null;
  }

  function renderTable(t) {
    var cell = function (tag) { return function (c) { return "<" + tag + ">" + inline(c) + "</" + tag + ">"; }; };
    return '<div class="prose-table" tabindex="0"><table>' +
      (t.head ? "<thead><tr>" + t.head.map(cell("th")).join("") + "</tr></thead>" : "") +
      "<tbody>" + t.rows.map(function (r) { return "<tr>" + r.map(cell("td")).join("") + "</tr>"; }).join("") + "</tbody>" +
      "</table></div>";
  }

  var LIST_ITEM = /^(\s*)(\d+\.|[-*])\s+(.*)$/;

  /* Listenzeilen mit Ebene; Spiegelstriche direkt unter einem nummerierten Punkt gelten als dessen Unterpunkte */
  function listItems(lines) {
    var orderedAt = -1;
    return lines.map(function (l) {
      var m = l.match(LIST_ITEM), indent = m[1].length, ordered = /\d/.test(m[2]);
      if (ordered) orderedAt = indent;
      else if (indent === orderedAt) indent += 1;
      return { indent: indent, ordered: ordered, num: parseInt(m[2], 10), text: m[3] };
    });
  }

  /* i = Startzeile, gibt [html, nächste Zeile] zurück */
  function list(items, i) {
    var first = items[i], indent = first.indent, ordered = first.ordered, n = 0, nested = false, longest = 0;
    var html = "";
    while (i < items.length) {
      var it = items[i];
      if (it.indent < indent) break;
      if (it.indent > indent) {
        var sub = list(items, i);
        html = html.replace(/<\/li>$/, sub[0] + "</li>");
        i = sub[1];
        nested = true;
        continue;
      }
      html += "<li>" + inline(it.text) + "</li>";
      longest = Math.max(longest, it.text.length);
      n++;
      i++;
    }
    var cls = nested && ordered ? ' class="prose-groups"' : !nested && n > 12 && longest <= 32 ? ' class="prose-cols"' : "";
    var open = ordered ? "<ol" + cls + (first.num !== 1 ? ' start="' + first.num + '"' : "") + ">" : "<ul" + cls + ">";
    return [open + html + (ordered ? "</ol>" : "</ul>"), i];
  }

  function arrowBlock(lines) {
    var sep = lines.indexOf(">>>");
    var left = lines.slice(1, sep), right = lines.slice(sep + 1, lines[lines.length - 1] === ":::" ? -1 : undefined);
    return '<div class="prose-arrow">' +
      '<div class="prose-arrow__from">' + left.map(function (l) { return "<p>" + inline(l) + "</p>"; }).join("") + "</div>" +
      '<svg class="prose-arrow__icon" viewBox="0 0 64 48" aria-hidden="true"><path d="M4 17h32V4l24 20-24 20V31H4z"/></svg>' +
      '<div class="prose-arrow__to">' + right.map(function (l) { return "<p>" + inline(l) + "</p>"; }).join("") + "</div>" +
      "</div>";
  }

  function block(src) {
    var lines = src.split("\n").filter(function (l) { return l.trim(); });
    if (!lines.length) return "";
    if (lines[0] === "::: arrow") return arrowBlock(lines);
    if (lines.every(function (l) { return LIST_ITEM.test(l); }) && !/^\s/.test(lines[0])) return list(listItems(lines), 0)[0];
    var heading = lines.length === 1 && lines[0].match(/^#{1,6}\s+(.+)$/);
    if (heading) return '<h3 class="prose__h">' + inline(heading[1]) + "</h3>";
    var indented = lines.every(function (l) { return /^\s{2,}/.test(l); }) ? " prose__indent" : "";
    var text = lines.join(" ").trim();
    var label = /^(\*\*[^*]+\*\*|<strong>(?:(?!<\/strong>).)*<\/strong>)$/.test(text) ? "prose__label" : "";
    var cls = (label + indented).trim();
    return "<p" + (cls ? ' class="' + cls + '"' : "") + ">" + inline(text) + "</p>";
  }

  function contentOf(node) {
    var c = HD.content || {};
    var own = c[C.state.lang] && c[C.state.lang][node.number];
    if (typeof own === "string") return { html: prose(own), lang: "" };
    var def = c[HD.site.defaultLang] && c[HD.site.defaultLang][node.number];
    return typeof def === "string" ? { html: prose(def), lang: ' lang="' + HD.site.defaultLang + '"' } : null;
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

  /* Türkei-Karte (data/map.js) mit den Yöre-Einträgen; Bedienung in assets/js/map.js */
  function regionMap(regions) {
    var M = HD.mapData, P = M.proj, lang = C.state.lang;
    function xy(geo) { return [((geo[0] - P.lon0) * P.kx).toFixed(1), ((P.lat1 - geo[1]) * P.ky).toFixed(1)]; }
    var regionOf = {};
    regions.forEach(function (r) {
      (HD.site.regionProvinces[r.number] || []).forEach(function (name) { regionOf[name] = r.number; });
    });

    var provinces = M.provinces.map(function (p) {
      var reg = regionOf[p.name];
      return '<path class="atlas__prov' + (reg ? " is-region" : "") + '" d="' + p.d + '" data-prov="' + esc(p.name) + '"' +
        (reg ? ' data-region="' + esc(reg) + '"' : "") + "/>";
    }).join("");

    var labels = M.provinces.map(function (p) {
      return '<text class="atlas__pname" x="' + p.x + '" y="' + p.y + '">' + esc(p.name) + "</text>";
    }).join("") + HD.site.mapLabels.map(function (l) {
      var c = xy(l.at);
      return '<text class="atlas__label atlas__label--' + l.kind + '" x="' + c[0] + '" y="' + c[1] + '"' +
        (l.anchor ? ' text-anchor="' + l.anchor + '" style="text-anchor:' + l.anchor + '"' : "") + ">" +
        esc(l.name[lang] || l.name.tr) + "</text>";
    }).join("");

    var markers = regions.map(function (r) {
      var geo = HD.site.regionGeo[r.number];
      if (!geo) return "";
      var c = xy(geo);
      return '<a class="atlas__marker" href="' + C.href.node(r) + '" data-region="' + esc(r.number) + '" data-x="' + c[0] + '" data-y="' + c[1] +
        '" transform="translate(' + c[0] + " " + c[1] + ')" aria-label="' + esc(C.title(r)) + '">' +
        '<g class="atlas__pin"><circle class="atlas__halo" r="13"/><circle class="atlas__dot" r="7"/></g></a>';
    }).join("");

    var tips = {};
    regions.forEach(function (r) { tips[r.number] = C.title(r); });

    return '<div class="atlas reveal" data-atlas data-tips="' + esc(JSON.stringify(tips)) + '">' +
      '<div class="atlas__stage" data-atlas-stage>' +
      '<svg class="atlas__svg" viewBox="0 0 ' + M.w + " " + M.h + '" style="--ratio:' + (M.w / M.h).toFixed(4) + '" role="group" aria-label="' + esc(t("mapLabel")) + '">' +
      '<rect class="atlas__sea" width="' + M.w + '" height="' + M.h + '"/>' +
      '<g data-atlas-view>' +
      '<path class="atlas__land" d="' + M.land + '"/><path class="atlas__land atlas__land--plain" d="' + M.landPlain + '"/>' +
      '<path class="atlas__shadow" d="' + M.outline + '"/>' +
      '<g class="atlas__provs">' + provinces + "</g>" +
      '<path class="atlas__lakes" d="' + M.lakes + '"/>' +
      '<path class="atlas__outline" d="' + M.outline + '"/>' +
      '<g class="atlas__labels" aria-hidden="true">' + labels + "</g>" +
      '<g class="atlas__markers">' + markers + "</g>" +
      "</g></svg>" +
      '<div class="atlas__tip" data-atlas-tip hidden></div>' +
      '<div class="atlas__zoom">' +
      '<button type="button" data-atlas-zoom="in" aria-label="' + esc(t("mapZoomIn")) + '" title="' + esc(t("mapZoomIn")) + '">+</button>' +
      '<button type="button" data-atlas-zoom="out" aria-label="' + esc(t("mapZoomOut")) + '" title="' + esc(t("mapZoomOut")) + '">−</button>' +
      '<button type="button" data-atlas-zoom="reset" aria-label="' + esc(t("mapReset")) + '" title="' + esc(t("mapReset")) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4 4v4h4"/></svg></button>' +
      '<button type="button" data-atlas-full aria-label="' + esc(t("mapFull")) + '" title="' + esc(t("mapFull")) + '">' +
      '<svg class="atlas__ico-full" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6"/></svg>' +
      '<svg class="atlas__ico-exit" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4v6H4M14 20v-6h6M4 4l6 6M20 20l-6-6"/></svg></button>' +
      "</div>" +
      '<p class="atlas__credit">' + esc(t("mapHint")) + "</p>" +
      "</div>" +
      "</div>";
  }

  function card(node) {
    var sub = C.countDescendants(node);
    return '<a class="card reveal" href="' + C.href.node(node) + '">' + media(node, "3x2") +
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
    var body = contentOf(page);
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
      (body ? "" : phText(3, "lead")) +
      "</header>";

    if (!body) html += '<div class="entry__hero container-wide reveal">' + ph("21x9") + "</div>";

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

    if (body) html += '<div class="prose"' + body.lang + ">" + body.html + "</div>";

    if (sections.length) {
      html += sections.map(function (s, i) {
        var sBody = contentOf(s);
        return '<section class="entry-section" id="s-' + esc(s.slug) + '">' +
          '<h2><span class="num">' + esc(s.number) + "</span> <span" + C.titleLangAttr(s) + ">" + T(s) + "</span></h2>" +
          (sBody ? '<div class="prose"' + sBody.lang + ">" + sBody.html + "</div>"
            : phText(i % 2 ? 5 : 7) + (i % 3 === 1 ? ph("3x2") : "")) +
          "</section>";
      }).join("");
    } else if (subpages.length) {
      html += (body ? "" : phText(5)) + (page.number === HD.site.regionsChapter ? regionMap(subpages) : "") +
        '<div class="card-grid card-grid--entry">' + subpages.map(card).join("") + "</div>";
    } else if (!body) {
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
      '<img src="' + WELCOME_IMG + '" width="1672" height="941" alt="' + esc(t("introImageAlt")) + '" fetchpriority="high">' +
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

  function legal() {
    var front = HD.front[C.state.lang] || HD.front[HD.site.defaultLang];
    var printed = front.legal.map(function (block) {
      return '<h3 class="legal-page__h" lang="tr">' + esc(block.title) + "</h3>" +
        block.paragraphs.map(function (p) { return '<p lang="tr">' + esc(p) + "</p>"; }).join("");
    }).join("");
    return '<section class="legal-page container">' +
      '<header class="toc-page__head">' +
      '<p class="eyebrow">' + esc(C.title(HD.structure.book)) + "</p>" +
      '<h1 tabindex="-1">' + esc(t("legalTitle")) + "</h1>" +
      '<p class="lead">' + esc(t("legalLead")) + "</p></header>" +
      '<div class="prose legal-page__body">' +
      "<h2>" + esc(t("legalCopyTitle")) + "</h2><p>" + esc(t("footerCopy")) + "</p>" +
      "<h2>" + esc(t("legalPrintTitle")) + "</h2><p class=\"muted\">" + esc(t("legalPrintNote")) + "</p>" +
      '<div class="legal-page__print">' + printed + "</div>" +
      "<h2>" + esc(t("legalImprintTitle")) + "</h2><p class=\"muted\">" + esc(t("legalImprintTodo")) + "</p>" +
      "</div></section>";
  }

  function notFound() {
    return '<section class="container notfound"><p class="eyebrow">404</p>' +
      '<h1 tabindex="-1">' + esc(t("notFound")) + "</h1><p class=\"lead\">" + esc(t("notFoundLead")) + "</p>" +
      '<p><a class="btn btn--primary" href="' + C.href.home() + '">' + esc(t("navHome")) + arrow() + "</a></p></section>";
  }

  HD.views = { home: home, entry: entry, toc: toc, intro: intro, legal: legal, notFound: notFound, drawerNav: drawerNav, footerNav: footerNav };
})(window.HD);
