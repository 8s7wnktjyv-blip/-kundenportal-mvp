/* =====================================================================
   KLEINE DEMO-HÜLLE für die eigenen Demos (Hausverwaltung, Makler)
   Menü (PC und Handy), Kopf mit Symbol und Gruppenfarbe, Rollenwahl,
   Kurzmeldungen. Die Inhalte kommen aus js/demo-hv.js bzw. js/demo-makler.js
   über window.MINI. Alle Daten sind erfunden, nichts wird gespeichert.
   ===================================================================== */
(function () {
  "use strict";
  var C = window.MINI; if (!C) return;
  var $main = document.getElementById("app-main"), $toasts = document.getElementById("toasts");
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };
  var CHECK = '<path d="M20 6 9 17l-5-5"/>';
  var GKEY = ["alltag", "baustelle", "geld", "betrieb", "mehr"];
  var state = { view: C.start, rolle: C.rollen[0][0] };

  var H = {   // Helfer für die Seiten
    euro: euro, esc: esc, svg: svg, CHECK: CHECK, state: state,
    kpi: function (l, w, s) { return '<div class="kpi"><span>' + l + "</span><strong>" + w + "</strong><small>" + s + "</small></div>"; },
    head: function (titel, text, quelle) {
      var v = C.views[state.view], g = gruppe(state.view);
      return '<div class="view-head"><div><div class="vh-titel"><span class="vh-ic">' + svg(v.icon) + '</span><span class="vh-txt"><em class="vh-gruppe">' + (g ? g[0] : "") + "</em><h1>" + titel + "</h1></span></div><p>" + text + "</p>" + (quelle ? '<p class="src">' + quelle + "</p>" : "") + "</div></div>";
    },
    toast: function (text) {
      var el = document.createElement("div"); el.className = "toast"; el.innerHTML = svg(CHECK) + "<span>" + text + "</span>";
      $toasts.appendChild(el); while ($toasts.children.length > 2) $toasts.removeChild($toasts.firstChild); setTimeout(function () { el.remove(); }, 4200);
    },
    go: function (v) { state.view = v; render(); window.scrollTo(0, 0); },
    render: function () { render(); }
  };
  C.H = H;

  function gruppe(id) { for (var i = 0; i < C.gruppen.length; i++) if (C.gruppen[i][1].indexOf(id) > -1) return C.gruppen[i]; return null; }
  function erlaubt(id) { var r = C.rollen.filter(function (x) { return x[0] === state.rolle; })[0]; return !r[2] || r[2].indexOf(id) > -1; }
  function zahlen() { return C.zahlen ? C.zahlen() : {}; }

  function nav() {
    var z = zahlen();
    var knopf = function (id) {
      var v = C.views[id];
      return '<button type="button" data-view="' + id + '"' + (state.view === id ? ' aria-current="page"' : "") + ">" + svg(v.icon) + "<span>" + v.label + "</span>" + (z[id] ? '<span class="count">' + z[id] + "</span>" : "") + "</button>";
    };
    document.getElementById("side-nav").innerHTML = C.gruppen.map(function (g, gi) {
      var items = g[1].filter(erlaubt); if (!items.length) return "";
      return '<div class="nav-block g-' + GKEY[gi % 5] + ' offen"><p class="nav-group">' + g[0] + '</p><div class="nav-items">' + items.map(knopf).join("") + "</div></div>";
    }).join("");
    var sichtbar = []; C.gruppen.forEach(function (g) { g[1].filter(erlaubt).forEach(function (id) { sichtbar.push(id); }); });
    var haupt = sichtbar.slice(0, 4), rest = sichtbar.slice(4);
    var restZ = rest.reduce(function (s, id) { return s + (z[id] || 0); }, 0), restAktiv = rest.indexOf(state.view) > -1;
    document.getElementById("app-tabs").innerHTML = haupt.map(knopf).join("") + (rest.length ?
      '<button type="button" data-mehr' + (restAktiv ? ' aria-current="page"' : "") + ">" + svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>') + "<span>" + (restAktiv ? C.views[state.view].label : "Mehr") + "</span>" + (restZ ? '<span class="count">' + restZ + "</span>" : "") + "</button>" : "");
    state.rest = rest;
  }
  function mehr() {
    schliessen();
    var z = zahlen();
    var back = document.createElement("div"); back.className = "drawer-backdrop sheet-back"; back.addEventListener("click", schliessen);
    var d = document.createElement("div"); d.className = "drawer sheet"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Weitere Bereiche");
    d.innerHTML = '<span class="sheet-grip" aria-hidden="true"></span>' + C.gruppen.map(function (g, gi) {
      var items = g[1].filter(function (id) { return state.rest.indexOf(id) > -1; }); if (!items.length) return "";
      return '<div class="g-' + GKEY[gi % 5] + '"><p class="nav-group">' + g[0] + '</p><div class="sheet-grid">' + items.map(function (id) {
        var v = C.views[id]; return '<button type="button" data-view="' + id + '">' + svg(v.icon) + "<span>" + v.label + "</span>" + (z[id] ? '<span class="count">' + z[id] + "</span>" : "") + "</button>"; }).join("") + "</div></div>";
    }).join("") + '<div class="sl-demo"><span>Demo</span><button class="btn-mini" type="button" data-reset>Zurücksetzen</button><a class="btn-mini" href="' + C.seite + '">Website</a><a class="btn-mini" href="kontakt.html">Angebots-Check</a></div>';
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
  }
  function schliessen() { document.querySelectorAll(".drawer, .drawer-backdrop").forEach(function (e) { e.remove(); }); document.body.style.overflow = ""; }

  function render() {
    if (!erlaubt(state.view)) state.view = C.rollen.filter(function (x) { return x[0] === state.rolle; })[0][2][0];
    nav();
    var g = gruppe(state.view), gi = C.gruppen.indexOf(g);
    $main.className = "app-main g-" + GKEY[(gi < 0 ? 0 : gi) % 5];
    $main.innerHTML = C.views[state.view].render(H);
    if (C.views[state.view].nachher) C.views[state.view].nachher(H);
  }

  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-view]"))) { schliessen(); return H.go(el.getAttribute("data-view")); }
    if (t.closest("[data-mehr]")) return mehr();
    if (t.closest("#reset") || t.closest("[data-reset]")) { schliessen(); C.reset(); state.view = C.start; state.rolle = C.rollen[0][0]; document.getElementById("rolle").value = state.rolle; render(); return H.toast("Demo zurückgesetzt."); }
    if (C.klick && C.klick(t, H) === true) return;
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "rolle") { state.rolle = e.target.value; var r = C.rollen.filter(function (x) { return x[0] === state.rolle; })[0]; if (r[2]) state.view = r[2][0]; else state.view = C.start; render(); window.scrollTo(0, 0); return; }
    if (C.aenderung) C.aenderung(e.target, H);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") schliessen(); });

  var sel = document.getElementById("rolle");
  sel.innerHTML = C.rollen.map(function (r) { return '<option value="' + r[0] + '">' + r[1] + "</option>"; }).join("");
  C.reset();
  render();
})();
