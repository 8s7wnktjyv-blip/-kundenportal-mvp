/* =====================================================================
   KONFIGURATOR für Kundschaft (anfrage.html, kunde.html)
   Gleiche Produkte, Maße, Farben und 3D-Modelle wie im Cockpit (gewerke.js),
   AR über model-viewer („In meinem Raum ansehen“). Preise nur als Richtwert
   inkl. MwSt. – den genauen Preis nennt der Betrieb.
   Aufruf: KonfigKunde.oeffnen({ pids: [...], pid, cfg, titel, knopf, onFertig(info) })
   ===================================================================== */
(function () {
  "use strict";
  var GW_URL = "js/gewerke.js?v=" + ((document.currentScript && (document.currentScript.src.split("v=")[1] || "")) || "1");
  var MV_URL = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.4.0/dist/model-viewer.min.js";
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  var k = null, lastFocus = null;

  function gwLaden(fertig) {
    if (window.GW && window.GW.PRODUKTE) return fertig();
    var vorh = document.querySelector("script[data-gw-lib]");
    if (vorh) { vorh.addEventListener("load", fertig); return; }
    var sc = document.createElement("script"); sc.src = GW_URL; sc.setAttribute("data-gw-lib", ""); sc.onload = fertig; sc.onerror = function () { alert("Der Konfigurator konnte nicht geladen werden."); }; document.head.appendChild(sc);
  }
  function arLaden() {
    if ((window.customElements && customElements.get("model-viewer")) || document.querySelector("script[data-mv-lib]")) return;
    var sc = document.createElement("script"); sc.type = "module"; sc.src = MV_URL; sc.setAttribute("data-mv-lib", ""); document.head.appendChild(sc);
  }
  function hexRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function sichtbar(P, c) {
    var an = {}, aus = {};
    (P.optionen || []).forEach(function (o) { if (!o.mat) return; Object.keys(o.mat).forEach(function (w) { o.mat[w].forEach(function (m) { if (String(c[o.k]) === w && (!o.wenn || o.wenn(c))) an[m] = 1; else aus[m] = 1; }); }); });
    (P.immer || []).forEach(function (m) { an[m] = 1; }); Object.keys(an).forEach(function (m) { delete aus[m]; });
    return { an: an, aus: aus };
  }
  function anwenden(mv, P, c) {
    if (!mv) return;
    mv.setAttribute("scale", P.skal(c).map(function (x) { return (+x || 1).toFixed(3); }).join(" "));
    if (!mv.model || !mv.model.materials) return;
    var vis = sichtbar(P, c), farbe = {};
    (P.farben || []).forEach(function (f) { var o = f.o.filter(function (x) { return x[0] === c[f.k]; })[0]; if (o) f.mat.forEach(function (m) { farbe[m] = hexRgb(o[1]); }); });
    (P.optionen || []).forEach(function (o) { if (o.tint && o.tint.w[c[o.k]]) farbe[o.tint.mat] = hexRgb(o.tint.w[c[o.k]]); });
    mv.model.materials.forEach(function (m) {
      var pbr = m.pbrMetallicRoughness; if (!m._orig) m._orig = { f: pbr.baseColorFactor.slice(), mode: m.getAlphaMode ? m.getAlphaMode() : "OPAQUE" };
      var f = m._orig.f.slice(), fa = farbe[m.name] || (/_r$/.test(m.name) && farbe["*_r"]);
      if (fa) { f[0] = fa[0]; f[1] = fa[1]; f[2] = fa[2]; }
      if (vis.aus[m.name] || (/^o_/.test(m.name) && !vis.an[m.name])) { f[3] = 0; if (m.setAlphaMode) m.setAlphaMode("BLEND"); } else if (m.setAlphaMode) m.setAlphaMode(m._orig.mode);
      pbr.setBaseColorFactor(f);
    });
  }
  function richtpreis(P, c) {   // Beispielpreise des Systems, inkl. 19 % MwSt., gerundet
    var n = P.preis(c).reduce(function (s, x) { return x.optional ? s : s + (+x.menge || 0) * (+x.ep || 0); }, 0) * 1.19;
    var r = function (x) { return x < 2000 ? Math.round(x / 50) * 50 : Math.round(x / 100) * 100; };
    return { von: r(n * 0.9), bis: r(n * 1.15), typ: r(n) };
  }
  function feld(f, wert) {
    var lab = esc(f.l) + (f.e && f.t === "n" ? " (" + esc(f.e) + ")" : "");
    if (f.t === "sel") return "<label>" + lab + '<select data-kk="' + f.k + '">' + f.o.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (String(wert) === String(v) ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select></label>";
    return "<label>" + lab + '<input type="number" inputmode="decimal" data-kk="' + f.k + '" value="' + esc(wert == null ? "" : wert) + '" min="' + f.min + '" max="' + f.max + '" step="' + (f.st || 0.01) + '"></label>';
  }
  function zeichnen(neu) {
    var box = document.getElementById("kk-inhalt"); if (!box || !k) return;
    var P = GW.PRODUKTE[k.pid], c = k.cfg, rp = richtpreis(P, c);
    if (!P.modell) k.ansicht = "zeichnung";
    var wahl = k.pids.length > 1 ? '<div class="filter kk-produkte" role="group" aria-label="Produkt">' + k.pids.map(function (id) { return '<button type="button" data-kk-pid="' + id + '" aria-pressed="' + (id === k.pid) + '">' + esc(GW.PRODUKTE[id].name) + "</button>"; }).join("") + "</div>" : "";
    var buehne = '<div class="kf-buehne"><div class="filter kf-ansicht">' + (P.modell ? '<button type="button" data-kk-ansicht="3d" aria-pressed="' + (k.ansicht === "3d") + '">3D &amp; im Raum</button>' : "") + '<button type="button" data-kk-ansicht="zeichnung" aria-pressed="' + (k.ansicht === "zeichnung") + '">Zeichnung</button></div>' +
      '<div class="ar-buehne"' + (k.ansicht === "3d" && P.modell ? "" : " hidden") + '><model-viewer src="models/' + (P.modell || "dusche") + '.glb" alt="3D-Modell: ' + esc(P.name) + '" ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" ar-placement="' + (P.platzierung || "floor") + '" camera-controls touch-action="pan-y" shadow-intensity="1" exposure="1.05" camera-orbit="35deg 72deg auto" style="width:100%;height:100%;background:transparent">' +
        '<button slot="ar-button" class="btn btn-signal ar-knopf" type="button">' + CAM + "In meinem Raum ansehen</button></model-viewer>" +
        '<p class="ar-fallback" hidden>Die 3D-Ansicht braucht eine Internetverbindung. Auf dem Handy öffnet „In meinem Raum ansehen“ die Kamera und stellt das Produkt in Originalgröße in Ihren Raum.</p></div>' +
      '<div class="kf-zeichnung"' + (k.ansicht === "zeichnung" ? "" : " hidden") + ">" + P.zeichnung(c) + "</div>" +
      '<p class="kk-ar-tipp">' + CAM + " <span><b>So geht AR:</b> Auf dem Handy auf „In meinem Raum ansehen“ tippen, Kamera auf Boden oder Wand richten – das Produkt steht in Originalgröße da. Die Kamera fragt Ihr Handy selbst an, es wird nichts gespeichert.</span></p></div>";
    var opt = (P.optionen || []).filter(function (x) { return !x.wenn || x.wenn(c); });
    var rechts = '<div class="kf-optionen"><div class="kf-titel"><h3>' + esc(P.name) + '</h3></div><p class="kf-mass">' + esc(P.mass(c)) + "</p>" +
      (P.masse.length ? '<h4>Maße</h4><div class="am-grid2">' + P.masse.map(function (f) { return feld(f, c[f.k]); }).join("") + "</div>" : "") +
      (P.farben || []).map(function (f) { return "<h4>" + esc(f.l) + '</h4><div class="kf-farben" role="radiogroup" aria-label="' + esc(f.l) + '">' + f.o.map(function (x) { return '<button type="button" role="radio" aria-checked="' + (c[f.k] === x[0]) + '" data-kk-farbe="' + f.k + '" data-wert="' + esc(x[0]) + '"><span style="background:' + x[1] + '"></span>' + esc(x[0]) + "</button>"; }).join("") + "</div>"; }).join("") +
      (opt.length ? '<h4>Ausstattung</h4><div class="am-grid2">' + opt.map(function (f) { return feld(f, c[f.k]); }).join("") + "</div>" : "") +
      '<p class="fehler-box" id="kk-fehler" hidden></p>' +
      '<div class="kf-preis"><div><span>Richtwert inkl. MwSt.</span><b>ca. ' + eur.format(rp.typ) + "</b><small>meist " + eur.format(rp.von) + " bis " + eur.format(rp.bis) + " · ohne Besonderheiten vor Ort. Den genauen Preis nennt Ihnen der Betrieb.</small></div></div>" +
      '<div class="kf-knoepfe"><button class="btn btn-signal" type="button" data-kk-fertig>' + esc(k.knopf || "So übernehmen") + "</button></div>" +
      '<p class="src">Schlichte Beispiel-Modelle zur Orientierung. Farben am Bildschirm können vom Original abweichen.</p></div>';
    if (k.fest) {   // feste Ausführung (Sonderangebot): nur ansehen, nichts ändern
      var wertText = function (f) { var v = c[f.k], o = (f.o || []).filter(function (x) { return (Array.isArray(x) ? x[0] : x) === v; })[0]; return o ? (Array.isArray(o) ? o[1] : o) : (f.t === "n" ? String(v).replace(".", ",") + (f.e ? " " + f.e : "") : v); };
      rechts = '<div class="kf-optionen"><div class="kf-titel"><h3>' + esc(P.name) + '</h3></div><p class="kf-mass">' + esc(P.mass(c)) + "</p>" +
        '<p class="kk-fest">Diese Ware gibt es genau so – Maße und Ausführung sind fest. Prüfen Sie per AR, ob sie bei Ihnen passt.</p>' +
        '<dl class="kk-werte">' + P.masse.concat(P.farben || []).concat(opt).map(function (f) { return "<div><dt>" + esc(f.l) + "</dt><dd>" + esc(wertText(f) == null ? "–" : wertText(f)) + "</dd></div>"; }).join("") + "</dl>" + (k.festInfo || "") +
        '<div class="kf-knoepfe"><button class="btn btn-signal" type="button" data-kk-fertig>' + esc(k.knopf || "Schließen") + "</button></div></div>";
    }
    var mv = box.querySelector("model-viewer");
    if (neu || !mv || (P.modell && mv.getAttribute("src") !== "models/" + P.modell + ".glb") || !box.querySelector(".kf-layout")) {
      box.innerHTML = wahl + '<div class="kf-layout">' + buehne + rechts + "</div>";
      mv = box.querySelector("model-viewer");
      if (mv) mv.addEventListener("load", function () { if (k) anwenden(mv, GW.PRODUKTE[k.pid], k.cfg); });
      setTimeout(function () { if (!(window.customElements && customElements.get("model-viewer"))) { var fb = box.querySelector(".ar-fallback"); if (fb) fb.hidden = false; if (k && k.ansicht === "3d") { k.ansicht = "zeichnung"; zeichnen(false); } } }, 5000);
    } else {
      var alt = box.querySelector(".kf-optionen"), tmp = document.createElement("div"); tmp.innerHTML = rechts; if (alt && alt.parentNode) alt.parentNode.replaceChild(tmp.firstChild, alt);
      box.querySelector(".kf-zeichnung").innerHTML = P.zeichnung(c);
      box.querySelector(".ar-buehne").hidden = k.ansicht !== "3d" || !P.modell; box.querySelector(".kf-zeichnung").hidden = k.ansicht !== "zeichnung";
      box.querySelectorAll("[data-kk-ansicht]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-kk-ansicht") === k.ansicht)); });
    }
    if (P.modell) anwenden(mv, P, c);
  }
  function schliessen() {
    document.querySelectorAll(".kk-drawer, .kk-backdrop").forEach(function (e) { e.remove(); });
    document.body.style.overflow = ""; k = null; if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function oeffnen(o) {
    gwLaden(function () {
      var pids = (o.pids || [o.pid]).filter(function (id) { return GW.PRODUKTE[id]; }); if (!pids.length) return;
      var pid = o.pid && GW.PRODUKTE[o.pid] ? o.pid : pids[0];
      arLaden(); lastFocus = document.activeElement;
      k = { pids: pids, pid: pid, cfg: Object.assign(GW.PRODUKTE[pid].start(), o.cfg && o.pid === pid ? o.cfg : {}), ansicht: GW.PRODUKTE[pid].modell ? "3d" : "zeichnung", knopf: o.knopf, onFertig: o.onFertig, merk: {}, fest: !!o.fest, festInfo: o.festInfo || "" };
      var back = document.createElement("div"); back.className = "drawer-backdrop kk-backdrop"; back.addEventListener("click", schliessen);
      var d = document.createElement("div"); d.className = "drawer kf-drawer kk-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "kk-titel");
      d.innerHTML = '<div class="drawer-head"><div><h2 id="kk-titel">' + esc(o.titel || "Produkt zusammenstellen") + '</h2><p class="src">Maße, Farbe und Ausstattung wählen – und auf dem Handy direkt im eigenen Raum ansehen.</p></div><button class="icon-btn" type="button" data-kk-zu aria-label="Schließen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div id="kk-inhalt"></div>';
      document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
      zeichnen(true); d.querySelector("[data-kk-zu]").focus();
    });
  }
  document.addEventListener("click", function (e) {
    if (!k) return; var t = e.target, el;
    if (!t.closest || !t.closest(".kk-drawer")) return;
    if (t.closest("[data-kk-zu]")) return schliessen();
    if ((el = t.closest("[data-kk-ansicht]"))) { k.ansicht = el.getAttribute("data-kk-ansicht"); return zeichnen(false); }
    if ((el = t.closest("[data-kk-pid]"))) { k.merk[k.pid] = k.cfg; k.pid = el.getAttribute("data-kk-pid"); k.cfg = k.merk[k.pid] || GW.PRODUKTE[k.pid].start(); k.ansicht = GW.PRODUKTE[k.pid].modell ? "3d" : "zeichnung"; return zeichnen(true); }
    if ((el = t.closest("[data-kk-farbe]"))) { k.cfg[el.getAttribute("data-kk-farbe")] = el.getAttribute("data-wert"); return zeichnen(false); }
    if (t.closest("[data-kk-fertig]")) {
      var P = GW.PRODUKTE[k.pid], c = JSON.parse(JSON.stringify(k.cfg)), rp = richtpreis(P, c), cb = k.onFertig;
      var info = { pid: P.id, name: P.name, cfg: c, mass: P.mass(c), richtpreis: rp, svg: P.zeichnung(c) };
      schliessen(); if (cb) cb(info);
    }
  });
  document.addEventListener("keydown", function (e) { if (k && e.key === "Escape") schliessen(); });
  function eingabe(t, final) {
    if (!k || !t.closest || !t.closest(".kk-drawer") || !t.hasAttribute("data-kk")) return;
    var P = GW.PRODUKTE[k.pid], key = t.getAttribute("data-kk"), f = P.masse.concat(P.optionen || []).filter(function (x) { return x.k === key; })[0]; if (!f) return;
    var fb = document.getElementById("kk-fehler"), fehler = "";
    if (f.t === "n") { var x = parseFloat(String(t.value).replace(",", ".")); if (!isFinite(x) || x < f.min || x > f.max) fehler = f.l + ": bitte zwischen " + String(f.min).replace(".", ",") + " und " + String(f.max).replace(".", ",") + (f.e ? " " + f.e : "") + "."; else k.cfg[key] = x; }
    else k.cfg[key] = t.value;
    t.setAttribute("aria-invalid", fehler ? "true" : "false"); if (fb) { fb.hidden = !fehler; fb.textContent = fehler; }
    if (!fehler && (final || f.t !== "n")) setTimeout(function () { zeichnen(false); }, 0);
    else if (!fehler) { var z = document.querySelector(".kk-drawer .kf-zeichnung"); if (z) z.innerHTML = P.zeichnung(k.cfg); anwenden(document.querySelector(".kk-drawer model-viewer"), P, k.cfg); }
  }
  document.addEventListener("input", function (e) { eingabe(e.target, false); });
  document.addEventListener("change", function (e) { eingabe(e.target, true); });
  window.KonfigKunde = { oeffnen: oeffnen, laden: gwLaden };
})();
