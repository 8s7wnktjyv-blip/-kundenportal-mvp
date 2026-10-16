/* =====================================================================
   ANIMATIONEN UND KURZE TEXTE für alle Demos
   - Beim Wechsel des Bereichs: Einblenden, Karten nacheinander,
     Zahlen zählen hoch, Balken/Kurven/Ringe wachsen.
   - Karten, die in eine andere Spalte wandern, gleiten hinein.
   - Unter der Überschrift bleibt ein Satz; der Rest und Hinweise
     (Quellen, Datenschutz …) stehen hinter einem ⓘ.
   - Kleine Erklär-Animation im Begrüßungskasten.
   Wer „Bewegung reduzieren“ eingestellt hat, bekommt keine Animationen.
   ===================================================================== */
(function () {
  "use strict";
  var main = document.getElementById("app-main"); if (!main) return;
  var ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var typ = document.body.getAttribute("data-glocke") || "handwerk";
  var letzteSeite = null, spalten = {}, nInfo = 0;

  /* ---------- Erklär-Animation ---------- */
  var WEG = {
    handwerk: [["WhatsApp", '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>'], ["Cockpit", '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8"/>'], ["Angebot", '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'], ["Auftrag", '<path d="M20 6 9 17l-5-5"/>']],
    hv: [["Meldung", '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>'], ["KI ordnet zu", '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>'], ["Handwerker", '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>'], ["Erledigt", '<path d="M20 6 9 17l-5-5"/>']],
    makler: [["Anfrage", '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'], ["Exposé", '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'], ["Besichtigung", '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'], ["Reserviert", '<path d="M20 6 9 17l-5-5"/>']]
  };
  function erklaer() {
    var w = main.querySelector(".welcome"); if (!w || w.querySelector(".erklaer")) return;
    var weg = WEG[typ] || WEG.handwerk;
    var el = document.createElement("div"); el.className = "erklaer"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="er-linie"><i class="er-brief"></i></span>' + weg.map(function (s, i) { return '<span class="er-st" style="--n:' + i + '"><span class="er-ic"><svg viewBox="0 0 24 24">' + s[1] + "</svg></span><small>" + s[0] + "</small></span>"; }).join("");
    var ziel = w.firstElementChild && w.firstElementChild.tagName === "DIV" ? w.firstElementChild : w;
    ziel.appendChild(el);
  }

  /* ---------- Kurze Texte + ⓘ ---------- */
  function kuerzen() {
    var vh = main.querySelector(".view-head > div"); if (!vh || vh.getAttribute("data-kurz")) return;
    vh.setAttribute("data-kurz", "1");
    var mehr = [];
    var p = vh.querySelector(":scope > p:not(.src)");
    if (p && !p.querySelector("button, a, select")) {
      var t = p.textContent.trim(), m = t.match(/^(.{25,}?[.!?])\s+(.+)$/);
      if (m) { p.textContent = m[1]; mehr.push(m[2]); }
    }
    vh.querySelectorAll(":scope > p.src").forEach(function (q) { mehr.push(q.innerHTML); q.remove(); });
    if (!mehr.length) return;
    var h1 = vh.querySelector("h1"); if (!h1) return;
    var id = "info-" + (++nInfo);
    var b = document.createElement("button"); b.type = "button"; b.className = "info-i"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", id); b.setAttribute("aria-label", "Mehr Informationen"); b.textContent = "i";
    var box = document.createElement("div"); box.className = "info-box"; box.id = id; box.hidden = true; box.innerHTML = mehr.map(function (x) { return "<p>" + x + "</p>"; }).join("");
    h1.appendChild(b); (p || h1).insertAdjacentElement("afterend", box);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".info-i"); if (!b) return;
    e.stopPropagation(); var box = document.getElementById(b.getAttribute("aria-controls")); var auf = box.hidden;
    box.hidden = !auf; b.setAttribute("aria-expanded", String(auf));
  }, true);

  /* ---------- Zahlen hochzählen ---------- */
  function zaehlen(el) {
    var txt = el.textContent, m = txt.match(/^(\D*?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(.*)$/);
    if (!m) return;
    var ziel = parseFloat(m[2].replace(/\./g, "") + (m[3] ? "." + m[3] : "")), stellen = m[3] ? m[3].length : 0;
    if (!(ziel > 0)) return;
    var start = performance.now(), dauer = 650;
    var fmt = function (v) { return m[1] + v.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen }) + m[4]; };
    (function schritt(jetzt) {
      var t = Math.min(1, (jetzt - start) / dauer), e = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(stellen ? ziel * e : Math.round(ziel * e));
      if (t < 1 && el.isConnected) requestAnimationFrame(schritt); else el.textContent = txt;
    })(start);
  }

  /* ---------- Ringe und Kurven ---------- */
  function zeichnen() {
    main.querySelectorAll(".wt-fort").forEach(function (c) {
      var ziel = c.style.strokeDasharray; c.style.transition = "none"; c.style.strokeDasharray = "0 400";
      c.getBoundingClientRect(); c.style.transition = "stroke-dasharray .8s cubic-bezier(.2,.7,.2,1)"; c.style.strokeDasharray = ziel;
    });
    main.querySelectorAll(".fl-linie").forEach(function (pth) {
      var l = pth.getTotalLength ? pth.getTotalLength() : 0; if (!l) return;
      pth.style.strokeDasharray = l; pth.style.strokeDashoffset = l; pth.getBoundingClientRect();
      pth.style.transition = "stroke-dashoffset 1s ease-out"; pth.style.strokeDashoffset = "0";
    });
  }

  /* ---------- Karten nacheinander ---------- */
  var LISTEN = ".kpis > .kpi, .rows > .row, .col > .lead, .col > article, .nz-karten > *, .wt-grid > *, .mat-grid > *, .aus-liste > *, .hv-objekte > *, .mk-objekte > *, .mk-tage > *, .flow-runs > .run, .zl-punkt, .todo > li, .panel-grid > .panel, .lager-grid > *, .wf-node, .feed > li";
  function nacheinander() {
    var zaehler = new Map();
    main.querySelectorAll(LISTEN).forEach(function (el) {
      var p = el.parentNode, i = zaehler.get(p) || 0; zaehler.set(p, i + 1);
      el.style.setProperty("--i", Math.min(i, 10)); el.classList.add("rein");
    });
    setTimeout(function () { main.querySelectorAll(".rein").forEach(function (el) { el.classList.remove("rein"); }); }, 1400);
  }

  /* ---------- Karten, die die Spalte wechseln ---------- */
  function spaltenMerken() {
    var neu = {};
    main.querySelectorAll(".board .col").forEach(function (col, ci) {
      col.querySelectorAll(":scope > .lead, :scope > article").forEach(function (k) {
        var key = (k.querySelector("strong") || k).textContent.trim().slice(0, 60);
        if (spalten[key] !== undefined && spalten[key] !== ci) k.classList.add("rutscht");
        neu[key] = ci;
      });
    });
    spalten = neu;
  }

  /* ---------- Bei jeder neuen Ansicht ---------- */
  function nachRender() {
    var h1 = main.querySelector("h1"), seite = (h1 ? h1.textContent : "") + "|" + (main.className || "");
    var neueSeite = seite !== letzteSeite; letzteSeite = seite;
    kuerzen(); erklaer();
    if (neueSeite) { spalten = {}; }
    spaltenMerken();
    if (!neueSeite || ruhig) return;
    main.classList.remove("vw-in"); void main.offsetWidth; main.classList.add("vw-in"); clearTimeout(nachRender.t); nachRender.t = setTimeout(function () { main.classList.remove("vw-in"); }, 1300);
    nacheinander(); zeichnen();
    main.querySelectorAll(".kpi strong, .vt-balken b, .aus-frist b, .mk-preis").forEach(zaehlen);
  }
  var geplant = false;
  new MutationObserver(function () { if (geplant) return; geplant = true; requestAnimationFrame(function () { geplant = false; nachRender(); }); }).observe(main, { childList: true });
  nachRender();
})();
