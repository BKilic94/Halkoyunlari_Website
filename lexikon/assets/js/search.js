/* Suche in Überschriften und Kapiteltexten (Dialog, Tastatur: "/" oder Strg/Cmd+K). */
(function (HD) {
  "use strict";

  var C = HD.core, esc = C.esc;
  var root, input, list, meta, active = -1, results = [], lastFocus = null, index = null;

  /* Markdown der Kapiteltexte zu reinem Text */
  function plain(md) {
    return md
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/^\s*\|?\s*:?-{3,}.*$/gm, " ")
      .replace(/\|/g, " ")
      .replace(/^\s*(#{1,6}|\d+\.|[-*]|:::.*|>>>)\s*/gm, "")
      .replace(/\\(.)/g, "$1")
      .replace(/\*+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildIndex() {
    var content = (HD.content && HD.content[HD.site.defaultLang]) || {};
    return C.all.map(function (n) {
      var label = C.title(n);
      var text = typeof content[n.number] === "string" ? plain(content[n.number]) : "";
      return {
        node: n,
        label: label,
        folded: C.fold(label),
        text: text,
        textFolded: C.fold(text),
        num: n.number,
        path: C.ancestors(n).map(function (a) { return a.number + " " + C.title(a); }).join(" › ")
      };
    });
  }

  /* Treffer im Titel zählen mehr als Treffer im Text; jeder Begriff muss irgendwo vorkommen */
  function score(item, terms, q) {
    var s = 0, inText = false;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      var pos = item.folded.indexOf(term);
      if (pos < 0) {
        if (item.num.indexOf(term) === 0) { s += item.num === term ? 12 : 3; continue; }
        var hits = countOf(item.textFolded, term);
        if (!hits) return -1;
        inText = true;
        s += Math.min(hits, 5) * 0.2;
      }
      else if (pos === 0) s += 6;
      else if (pos > 0 && /[\s(’'-]/.test(item.folded[pos - 1])) s += 4;
      else s += 1;
    }
    if (item.folded === q) s += 10;
    return { s: s - item.node.level * 0.5, inText: inText };
  }

  function countOf(hay, term) {
    var n = 0, from = 0, pos;
    while ((pos = hay.indexOf(term, from)) >= 0 && n < 50) { n++; from = pos + term.length; }
    return n;
  }

  /* Textausschnitt um den ersten Treffer */
  function snippet(item, terms) {
    var first = -1;
    terms.forEach(function (t) {
      var p = item.textFolded.indexOf(t);
      if (p >= 0 && (first < 0 || p < first)) first = p;
    });
    if (first < 0) return "";
    var start = Math.max(0, first - 60), end = Math.min(item.text.length, first + 140);
    if (start > 0) start = item.text.lastIndexOf(" ", start) + 1;
    var part = item.text.slice(start, end), partFolded = item.textFolded.slice(start, end);
    var html = part.length === partFolded.length ? highlight(part, partFolded, terms) : esc(part);
    return (start > 0 ? "…" : "") + html + (end < item.text.length ? "…" : "");
  }

  function highlight(label, folded, terms) {
    var marks = new Array(label.length).fill(false);
    terms.forEach(function (term) {
      var from = 0, pos;
      while ((pos = folded.indexOf(term, from)) >= 0) {
        for (var i = pos; i < pos + term.length; i++) marks[i] = true;
        from = pos + term.length;
      }
    });
    var out = "", open = false;
    for (var i = 0; i < label.length; i++) {
      if (marks[i] !== open) { out += marks[i] ? "<mark>" : "</mark>"; open = marks[i]; }
      out += esc(label[i]);
    }
    return out + (open ? "</mark>" : "");
  }

  function run() {
    if (!index) index = buildIndex();
    var q = C.fold(input.value.trim());
    var terms = q.split(/\s+/).filter(Boolean);
    var total = 0;
    if (!terms.length) {
      results = index.filter(function (it) { return it.node.level === 1; }).map(function (it) { return { it: it }; });
    } else {
      results = index
        .map(function (it) { var r = score(it, terms, q); return r === -1 ? null : { it: it, s: r.s, inText: r.inText }; })
        .filter(Boolean)
        .sort(function (a, b) { return b.s - a.s; });
      total = results.length;
      results = results.slice(0, 40);
    }
    meta.textContent = terms.length
      ? (total ? C.t("searchCount", { n: total }) : C.t("searchEmpty"))
      : C.t("searchHint");
    list.innerHTML = results.map(function (r, i) {
      var it = r.it;
      var snip = r.inText ? snippet(it, terms) : "";
      return '<li role="option" id="sr-' + i + '" aria-selected="false">' +
        '<a href="' + C.href.node(it.node) + '" tabindex="-1">' +
        '<span class="num">' + esc(it.num) + "</span>" +
        '<span class="search__text"><span class="search__title">' + highlight(it.label, it.folded, terms) + "</span>" +
        (it.path ? '<span class="search__path">' + esc(it.path) + "</span>" : "") +
        (snip ? '<span class="search__snippet">' + snip + "</span>" : "") + "</span></a></li>";
    }).join("");
    setActive(results.length ? 0 : -1);
  }

  function setActive(i) {
    var items = list.children;
    if (active >= 0 && items[active]) items[active].setAttribute("aria-selected", "false");
    active = i;
    if (i >= 0 && items[i]) {
      items[i].setAttribute("aria-selected", "true");
      items[i].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", "sr-" + i);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function open() {
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("is-locked");
    requestAnimationFrame(function () { root.classList.add("is-open"); });
    input.placeholder = C.t("searchPlaceholder");
    input.select();
    input.focus();
    run();
  }

  function close() {
    if (root.hidden) return;
    root.classList.remove("is-open");
    document.documentElement.classList.remove("is-locked");
    root.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function go(i) {
    var r = results[i];
    if (!r) return;
    close();
    location.hash = C.href.node(r.it.node);
  }

  function init() {
    root = document.querySelector("[data-search]");
    input = root.querySelector("[data-search-input]");
    list = root.querySelector("[data-search-results]");
    meta = root.querySelector("[data-search-meta]");

    input.addEventListener("input", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(active + 1, results.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); go(active); }
    });
    list.addEventListener("click", function (e) {
      var li = e.target.closest("li");
      if (!li) return;
      e.preventDefault();
      go(Array.prototype.indexOf.call(list.children, li));
    });
    list.addEventListener("mousemove", function (e) {
      var li = e.target.closest("li");
      if (li) setActive(Array.prototype.indexOf.call(list.children, li));
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-search-open]")) { e.preventDefault(); open(); }
      else if (e.target.closest("[data-search-close]")) close();
    });
    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
      else if (e.key === "/" && !typing) { e.preventDefault(); open(); }
      else if (e.key === "Escape" && !root.hidden) close();
      else if (e.key === "Tab" && !root.hidden) {
        var focusables = root.querySelectorAll("input, button");
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  HD.search = { init: init, open: open, close: close };
})(window.HD);
