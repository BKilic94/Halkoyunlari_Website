/* Überschriftensuche (Dialog, Tastatur: "/" oder Strg/Cmd+K). */
(function (HD) {
  "use strict";

  var C = HD.core, esc = C.esc;
  var root, input, list, meta, active = -1, results = [], lastFocus = null;

  var index = C.all.map(function (n) {
    var label = C.title(n);
    return {
      node: n,
      label: label,
      folded: C.fold(label),
      num: n.number,
      path: C.ancestors(n).map(function (a) { return a.number + " " + C.title(a); }).join(" › ")
    };
  });

  function score(item, terms, q) {
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      var pos = item.folded.indexOf(term);
      if (pos < 0) {
        if (item.num.indexOf(term) !== 0) return -1;
        s += item.num === term ? 12 : 3;
      }
      else if (pos === 0) s += 6;
      else if (pos > 0 && /[\s(’'-]/.test(item.folded[pos - 1])) s += 4;
      else s += 1;
    }
    if (item.folded === q) s += 10;
    return s - item.node.level * 0.5;
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
    var q = C.fold(input.value.trim());
    var terms = q.split(/\s+/).filter(Boolean);
    if (!terms.length) {
      results = index.filter(function (it) { return it.node.level === 1; });
    } else {
      results = index
        .map(function (it) { return { it: it, s: score(it, terms, q) }; })
        .filter(function (r) { return r.s >= 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 40)
        .map(function (r) { return r.it; });
    }
    meta.textContent = terms.length
      ? (results.length ? C.t("searchCount", { n: results.length }) : C.t("searchEmpty"))
      : C.t("searchHint");
    list.innerHTML = results.map(function (it, i) {
      return '<li role="option" id="sr-' + i + '" aria-selected="false">' +
        '<a href="' + C.href.node(it.node) + '" tabindex="-1">' +
        '<span class="num">' + esc(it.num) + "</span>" +
        '<span class="search__text"><span class="search__title">' + highlight(it.label, it.folded, terms) + "</span>" +
        (it.path ? '<span class="search__path">' + esc(it.path) + "</span>" : "") + "</span></a></li>";
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
    var it = results[i];
    if (!it) return;
    close();
    location.hash = C.href.node(it.node);
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
