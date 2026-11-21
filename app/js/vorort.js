/* Kundario – Checkliste vor Ort im Aufmaß (alle Gewerke)
   Punkte stehen in js/checklisten.js. Gespeichert wird im Aufmaß unter daten.vorort = { gewerk, art, werte }. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h, CL = window.K_CHECKLISTEN || {};

  // Gewerk des Betriebs → passende Checkliste (Fenster/Sonnenschutz haben die Checkliste je Bauteil, hier nur Allgemeines)
  var VON_GEWERK = {
    "Maler und Lackierer": "maler", "SHK": "shk", "Elektro": "elektro", "Dachdecker": "dach", "Zimmerer": "dach", "Fenster- und Türenbau": "allgemein",
    "Tischler und Schreiner": "schreiner", "Metallbau": "allgemein", "Trockenbau": "trockenbau", "Fliesenleger": "fliesen", "Bodenleger": "boden",
    "Garten- und Landschaftsbau": "garten", "Kälte- und Lüftungstechnik": "heizung", "Solar und Photovoltaik": "solar"
  };
  K.voStandard = function () { return VON_GEWERK[(K.ctx.betrieb || {}).gewerk] || "allgemein"; };
  K.voListe = function (vo) {
    var g = CL[vo.gewerk] || CL.allgemein, arten = Object.keys(g.arten), art = g.arten[vo.art] ? vo.art : arten[0];
    return { gewerk: CL[vo.gewerk] ? vo.gewerk : "allgemein", art: art, arten: arten, felder: g.arten[art] };
  };
  K.voPruefe = function (f, wert) { if (f.t !== "n" || !String(wert == null ? "" : wert).trim()) return ""; var z = U.zahl(wert); return z < f.min || z > f.max ? f.l + ": üblich " + U.zahlText(f.min) + "–" + U.zahlText(f.max) + (f.e ? " " + f.e : "") : ""; };
  K.voStand = function (vo) {
    var l = K.voListe(vo), w = vo.werte || {}, erl = l.felder.filter(function (f) { return String(w[f.k] == null ? "" : w[f.k]).trim(); });
    return { gesamt: l.felder.length, erledigt: erl.length, warnungen: l.felder.map(function (f) { return K.voPruefe(f, w[f.k]); }).filter(Boolean) };
  };
  var aktuell = function () { var d = (K._aufmass && K._aufmass.daten) || {}; return d.vorort || { gewerk: K.voStandard(), art: "", werte: {} }; };

  function bereich() {
    var vo = aktuell(), l = K.voListe(vo), s = K.voStand(vo), w = vo.werte || {};
    var erledigt = l.felder.filter(function (f) { return String(w[f.k] == null ? "" : w[f.k]).trim(); });
    return '<section class="vo-bereich"><h3>Checkliste vor Ort</h3><p class="still">Was Sie beim Termin klären sollten, damit das Angebot stimmt und es auf der Baustelle keine Überraschungen gibt.</p>' +
      '<div class="vo-wahl"><label>Gewerk <select data-vo-gewerk>' + Object.keys(CL).map(function (k) { return '<option value="' + k + '"' + (k === l.gewerk ? " selected" : "") + ">" + h(CL[k].label) + "</option>"; }).join("") + "</select></label>" +
      (l.arten.length > 1 ? '<label>Art <select data-vo-art>' + l.arten.map(function (a) { return "<option" + (a === l.art ? " selected" : "") + ">" + h(a) + "</option>"; }).join("") + "</select></label>" : "") +
      '<button type="button" class="btn btn-outline klein" data-a="voAusfuellen">Checkliste ausfüllen · ' + s.erledigt + "/" + s.gesamt + "</button></div>" +
      (s.warnungen.length ? '<p class="vo-warn"><span class="pill rot">Bitte prüfen</span> ' + h(s.warnungen.join(" · ")) + "</p>" : "") +
      (erledigt.length ? '<ul class="liste vo-werte">' + erledigt.map(function (f) { return "<li><b>" + h(f.l) + "</b> · " + h(w[f.k]) + (f.t === "n" && f.e ? " " + h(f.e) : "") + "</li>"; }).join("") + "</ul>" : "") + "</section>";
  }
  var altDaten = K.amDaten;
  K.amDaten = function (f, raeume) { var d = altDaten(f, raeume); d.vorort = (K._aufmass && K._aufmass.daten && K._aufmass.daten.vorort) || d.vorort; if (!d.vorort) delete d.vorort; return d; };
  var altDanach = V.aufmass.danach;
  V.aufmass.danach = function (id, extra) {
    if (altDanach) altDanach(id, extra);
    var f = document.getElementById("am-form"); if (!f || !id || id === "neu") return;
    var k = f.querySelector(".bt-bereich") || f.querySelector(".fz-bereich") || f.querySelector(".knoepfe:last-of-type");
    k.insertAdjacentHTML("beforebegin", bereich());
  };
  async function sichern(vo) {
    var f = document.getElementById("am-form"); K._aufmass.daten.vorort = vo;
    var d = K.amDaten(f, (function () { var r = []; for (var i = 0; f.elements["n_" + i]; i++) r.push({ name: f.elements["n_" + i].value, l: f.elements["l_" + i].value, b: f.elements["b_" + i].value, h: f.elements["h_" + i].value, abzug: f.elements["a_" + i].value }); return r; })());
    await DB.aendern("aufmasse", f.dataset.id, { titel: f.elements.titel.value, daten: d }); K._aufmass.daten = d;
  }
  // Gewerk oder Art wechseln: bisherige Antworten bleiben gespeichert, gleiche Punkte werden übernommen
  document.addEventListener("change", async function (e) {
    var t = e.target; if (!t.matches || !(t.matches("[data-vo-gewerk]") || t.matches("[data-vo-art]"))) return;
    try {
      var vo = Object.assign({ werte: {} }, aktuell());
      if (t.matches("[data-vo-gewerk]")) { vo.gewerk = t.value; vo.art = ""; } else vo.art = t.value;
      await sichern(vo); K.neuLaden();
    } catch (x) { U.fehler(x); }
  });
  K.aktion.voAusfuellen = async function () {
    var vo = Object.assign({ werte: {} }, aktuell()), l = K.voListe(vo), w = vo.werte || {};
    var felder = l.felder.map(function (f) {
      var v = w[f.k] == null ? "" : w[f.k];
      if (f.t === "s") return U.feld("v_" + f.k, f.l, v, { optionen: [["", "–"]].concat(f.o), hilfe: f.w });
      return U.feld("v_" + f.k, f.l + (f.e ? " (" + f.e + ")" : ""), v, { typ: f.t === "n" ? "number" : "text", hilfe: f.w });
    }).join("");
    var r = await U.dialog("Checkliste vor Ort: " + CL[l.gewerk].label + (l.arten.length > 1 ? " · " + l.art : ""), '<div class="chk-liste">' + felder + "</div>", [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Speichern", primaer: true }]);
    if (!r) return;
    var neu = Object.assign({}, w), warn = [];
    l.felder.forEach(function (f) { var v = String(r.daten["v_" + f.k] == null ? "" : r.daten["v_" + f.k]).trim(); if (v) neu[f.k] = v; else delete neu[f.k]; var m = K.voPruefe(f, v); if (m) warn.push(m); });
    vo.gewerk = l.gewerk; vo.art = l.art; vo.werte = neu; await sichern(vo);
    U.toast(warn.length ? "Gespeichert. Bitte prüfen: " + warn.join(" · ") : "Checkliste gespeichert.", warn.length ? "fehler" : ""); K.neuLaden();
  };
})();
