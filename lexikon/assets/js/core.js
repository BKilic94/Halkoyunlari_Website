/* Datenmodell, Übersetzungshilfen und Routen. */
(function (HD) {
  "use strict";

  var structure = HD.structure;
  var state = { lang: HD.site.defaultLang };

  /* ---------- Index über alle Überschriften ---------- */
  var all = [];        // alle Knoten in Dokumentreihenfolge
  var pages = [];      // Knoten mit eigener Seite (Ebene 1 und 2)
  var byNumber = {};
  var pageBySlug = {};

  (function walk(nodes, parent) {
    nodes.forEach(function (node) {
      node.parent = parent || null;
      all.push(node);
      byNumber[node.number] = node;
      if (node.level <= 2) {
        pages.push(node);
        pageBySlug[node.slug] = node;
      }
      walk(node.children, node);
    });
  })(structure.chapters, null);

  function pageOf(node) {
    return node.level <= 2 ? node : pageOf(node.parent);
  }

  function ancestors(node) {
    var list = [];
    for (var n = node.parent; n; n = n.parent) list.unshift(n);
    return list;
  }

  /* Abschnitte einer Seite: Unterüberschriften ab Ebene 3 */
  function sectionsOf(page) {
    return page.level === 2 || !page.children.some(function (c) { return c.level === 2; })
      ? page.children
      : [];
  }

  function subpagesOf(page) {
    return page.children.filter(function (c) { return c.level === 2; });
  }

  function neighbours(page) {
    var i = pages.indexOf(page);
    return { prev: pages[i - 1] || null, next: pages[i + 1] || null };
  }

  function countDescendants(node) {
    return node.children.reduce(function (sum, c) { return sum + 1 + countDescendants(c); }, 0);
  }

  /* ---------- Sprache ---------- */
  function t(key, vars) {
    var dict = HD.i18n[state.lang] || {};
    var str = dict[key] != null ? dict[key] : (HD.i18n[HD.site.defaultLang][key] || key);
    if (vars) Object.keys(vars).forEach(function (k) { str = str.replace("{" + k + "}", vars[k]); });
    return str;
  }

  /* Liefert den Titel in der aktiven Sprache, sonst Türkisch als Rückfall */
  function title(node) {
    var obj = node.title || node;
    return obj[state.lang] || obj[HD.site.defaultLang] || "";
  }

  function titleLangAttr(node) {
    var obj = node.title || node;
    return obj[state.lang] ? "" : ' lang="' + HD.site.defaultLang + '"';
  }

  /* ---------- Routen ---------- */
  var href = {
    home: function () { return "#/" + state.lang; },
    toc: function () { return "#/" + state.lang + "/icindekiler"; },
    intro: function () { return "#/" + state.lang + "/hosgeldiniz"; },
    legal: function () { return "#/" + state.lang + "/kunye"; },
    node: function (node) {
      var page = pageOf(node);
      var base = "#/" + state.lang + "/madde/" + page.slug;
      return node === page ? base : base + "/" + node.slug;
    }
  };

  function parseHash(hash) {
    var parts = (hash || "").replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    var lang = HD.site.languages.indexOf(parts[0]) >= 0 ? parts.shift() : HD.site.defaultLang;
    if (!parts.length) return { lang: lang, view: "home" };
    if (parts[0] === "icindekiler") return { lang: lang, view: "toc" };
    if (parts[0] === "hosgeldiniz") return { lang: lang, view: "intro" };
    if (parts[0] === "kunye") return { lang: lang, view: "legal" };
    if (parts[0] === "madde" && pageBySlug[parts[1]]) {
      var page = pageBySlug[parts[1]];
      var section = parts[2] ? page.children.filter(function (c) { return c.slug === parts[2]; })[0] : null;
      return { lang: lang, view: "entry", page: page, section: section || null };
    }
    return { lang: lang, view: "notfound" };
  }

  /* ---------- Hilfsfunktionen ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Türkisch-sichere, akzentunabhängige Normalisierung für die Suche */
  var FOLD = { "ç": "c", "ğ": "g", "ġ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u", "’": "'" };
  function fold(s) {
    return String(s).replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase()
      .replace(/[çğġıöşüâîû’]/g, function (c) { return FOLD[c]; });
  }

  HD.core = {
    state: state, all: all, pages: pages, byNumber: byNumber,
    pageOf: pageOf, ancestors: ancestors, sectionsOf: sectionsOf, subpagesOf: subpagesOf,
    neighbours: neighbours, countDescendants: countDescendants,
    t: t, title: title, titleLangAttr: titleLangAttr, href: href, parseHash: parseHash,
    esc: esc, fold: fold
  };
})(window.HD);
