/* Interaktive Türkei-Karte: Hervorhebung, Hinweis, Zoom und Verschieben. */
(function (HD) {
  "use strict";

  var MAX = 6, STEP = 1.6;

  function mount(root) {
    document.documentElement.classList.remove("atlas-open");
    Array.prototype.forEach.call(root.querySelectorAll("[data-atlas]"), setup);
  }

  function setup(atlas) {
    var stage = atlas.querySelector("[data-atlas-stage]");
    var svg = stage.querySelector("svg");
    var view = svg.querySelector("[data-atlas-view]");
    var tip = stage.querySelector("[data-atlas-tip]");
    var tips = JSON.parse(atlas.dataset.tips);
    var W = svg.viewBox.baseVal.width, H = svg.viewBox.baseVal.height;
    var z = 1, tx = 0, ty = 0, drag = null, moved = false;

    function unitsPerPx() { return W / (svg.getBoundingClientRect().width || W); }

    function apply(animate) {
      tx = Math.min(0, Math.max(W - W * z, tx));
      ty = Math.min(0, Math.max(H - H * z, ty));
      view.classList.toggle("is-animated", !!animate);
      view.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + z + ")";
      svg.style.setProperty("--k", (unitsPerPx() / z).toFixed(4));
      atlas.classList.toggle("is-zoomed", z > 1.001);
      atlas.classList.toggle("is-zoomed-2", z > 2.2);
      hideTip();
    }

    /* Punkt in viewBox-Einheiten unter dem Mauszeiger */
    function svgPoint(e) {
      var r = svg.getBoundingClientRect();
      return [(e.clientX - r.left) * unitsPerPx(), (e.clientY - r.top) * unitsPerPx()];
    }

    function zoomAt(factor, cx, cy) {
      var nz = Math.min(MAX, Math.max(1, z * factor));
      tx = cx - ((cx - tx) / z) * nz;
      ty = cy - ((cy - ty) / z) * nz;
      z = nz;
      apply(true);
    }

    /* ---------- Hervorhebung und Hinweis ---------- */
    function setActive(region) {
      Array.prototype.forEach.call(atlas.querySelectorAll("[data-region]"), function (el) {
        el.classList.toggle("is-active", !!region && el.getAttribute("data-region") === region);
      });
    }

    function showTip(text, x, y) {
      var r = stage.getBoundingClientRect();
      tip.textContent = text;
      tip.hidden = false;
      var half = tip.offsetWidth / 2 + 8;
      tip.style.left = Math.min(r.width - half, Math.max(half, x - r.left)) + "px";
      tip.style.top = (y - r.top) + "px";
    }

    function hideTip() { tip.hidden = true; }

    function markerOf(region) {
      return svg.querySelector('.atlas__marker[data-region="' + region + '"]');
    }

    function tipForMarker(m) {
      var b = m.querySelector(".atlas__dot").getBoundingClientRect();
      showTip(tips[m.getAttribute("data-region")], b.left + b.width / 2, b.top - 6);
    }

    svg.addEventListener("pointermove", function (e) {
      if (drag) return;
      var marker = e.target.closest(".atlas__marker");
      var prov = e.target.closest(".atlas__prov");
      var region = (marker || prov) && (marker || prov).getAttribute("data-region");
      setActive(region);
      if (marker) tipForMarker(marker);
      else if (prov) {
        var name = prov.getAttribute("data-prov");
        showTip(region ? name + " · " + tips[region] : name, e.clientX, e.clientY - 12);
      } else hideTip();
      svg.style.cursor = region ? "pointer" : "";
    });
    svg.addEventListener("pointerleave", function () { setActive(null); hideTip(); });

    svg.addEventListener("focusin", function (e) {
      var m = e.target.closest(".atlas__marker");
      if (!m) return;
      setActive(m.getAttribute("data-region"));
      tipForMarker(m);
    });
    svg.addEventListener("focusout", function () { setActive(null); hideTip(); });

    /* ---------- Klick, Ziehen, Zoom ---------- */
    svg.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); return; }
      var prov = e.target.closest(".atlas__prov[data-region]");
      if (prov) location.hash = markerOf(prov.getAttribute("data-region")).getAttribute("href");
    }, true);

    svg.addEventListener("pointerdown", function (e) {
      moved = false;
      if (z <= 1.001 || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, id: e.pointerId };
    });
    svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      if (!moved) { moved = true; svg.setPointerCapture(drag.id); atlas.classList.add("is-dragging"); }
      var u = unitsPerPx();
      tx = drag.tx + dx * u;
      ty = drag.ty + dy * u;
      apply(false);
    });
    function endDrag() { drag = null; atlas.classList.remove("is-dragging"); }
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);

    svg.addEventListener("dblclick", function (e) {
      e.preventDefault();
      var p = svgPoint(e);
      zoomAt(STEP, p[0], p[1]);
    });

    svg.addEventListener("wheel", function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var p = svgPoint(e);
      zoomAt(e.deltaY < 0 ? 1.25 : 0.8, p[0], p[1]);
    }, { passive: false });

    Array.prototype.forEach.call(stage.querySelectorAll("[data-atlas-zoom]"), function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-atlas-zoom");
        if (mode === "reset") { z = 1; tx = 0; ty = 0; apply(true); }
        else zoomAt(mode === "in" ? STEP : 1 / STEP, W / 2, H / 2);
      });
    });

    var fullBtn = stage.querySelector("[data-atlas-full]");
    function setFull(on) {
      atlas.classList.toggle("is-full", on);
      document.documentElement.classList.toggle("atlas-open", on);
      var label = HD.core.t(on ? "mapFullExit" : "mapFull");
      fullBtn.setAttribute("aria-label", label);
      fullBtn.title = label;
      apply(false);
    }
    fullBtn.addEventListener("click", function () { setFull(!atlas.classList.contains("is-full")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && atlas.isConnected && atlas.classList.contains("is-full")) setFull(false);
    });

    if (window.ResizeObserver) new ResizeObserver(function () { apply(false); }).observe(svg);
    else window.addEventListener("resize", function () { apply(false); });
    apply(false);
  }

  HD.atlas = { mount: mount };
})(window.HD);
