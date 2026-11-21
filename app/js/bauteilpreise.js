/* Kundario – Bauteil-Preise: maßabhängige Preise für Fenster, Türen, Rollläden, Sonnenschutz, Überdachungen
   Je Art: Preis je m² (mit Mindestfläche und Grundpreis je Stück) oder Preistabelle Breite × Höhe (wie in Herstellerpreislisten),
   dazu optional Montage je Stück. Gespeichert im Betrieb unter kalkulation.bauteilpreise. Alle Preise netto. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;
  var cfg = function () { return ((K.ctx.betrieb || {}).kalkulation || {}).bauteilpreise || {}; };
  var rund = function (x) { return Math.round(x * 100) / 100; };

  // Preistabelle aus CSV: erste Zeile = Breiten in mm (erste Zelle leer oder „H/B“), danach je Zeile Höhe in mm und Preise
  K.preistabelleLesen = function (text) {
    var zeilen = String(text || "").replace(/\r/g, "").split("\n").map(function (z) { return z.trim(); }).filter(Boolean);
    if (zeilen.length < 2) throw new Error("Die Preistabelle braucht eine Kopfzeile mit Breiten und mindestens eine Zeile mit Höhe und Preisen.");
    var trenn = zeilen[0].indexOf(";") > -1 ? ";" : zeilen[0].indexOf("\t") > -1 ? "\t" : ",";
    var zelle = function (z) { return z.split(trenn).map(function (x) { return x.trim().replace(/^"|"$/g, ""); }); };
    var breiten = zelle(zeilen[0]).slice(1).map(K.mm);
    if (!breiten.length || breiten.some(function (b) { return !b; })) throw new Error("Kopfzeile: Breiten in mm, z. B. „H/B;500;750;1000“.");
    var hoehen = [], preise = [];
    zeilen.slice(1).forEach(function (z, i) {
      var c = zelle(z), ho = K.mm(c[0]); if (!ho) throw new Error("Zeile " + (i + 2) + ": Höhe in mm fehlt.");
      var p = c.slice(1).map(function (x) { return x === "" ? null : U.zahl(x); });
      if (p.length !== breiten.length) throw new Error("Zeile " + (i + 2) + ": " + p.length + " Preise, erwartet " + breiten.length + ".");
      hoehen.push(ho); preise.push(p);
    });
    var steigt = function (l) { return l.every(function (x, i) { return !i || x > l[i - 1]; }); };
    if (!steigt(breiten) || !steigt(hoehen)) throw new Error("Breiten und Höhen bitte aufsteigend sortieren.");
    return { breiten: breiten, hoehen: hoehen, preise: preise };
  };
  K.preistabelleText = function (t) { return t ? ["H/B"].concat(t.breiten).join(";") + "\n" + t.hoehen.map(function (ho, i) { return [ho].concat(t.preise[i].map(function (p) { return p == null ? "" : String(p).replace(".", ","); })).join(";"); }).join("\n") : ""; };
  // Wie in Herstellerpreislisten: auf die nächste Stufe aufrunden
  K.preistabelleSuchen = function (t, breite, hoehe) {
    var bi = t.breiten.findIndex(function (x) { return x >= breite; }), hi = t.hoehen.findIndex(function (x) { return x >= hoehe; });
    if (bi < 0 || hi < 0) return null; var p = t.preise[hi][bi]; return p == null ? null : p;
  };
  // Preis je Stück für ein Bauteil aus dem Aufmaß, oder null
  K.btPreis = function (b) {
    var c = cfg()[b.art]; if (!c || !c.modus) return null;
    var br = K.mm(b.b), ho = K.mm(b.h), mont = +c.montage || 0, stueck = null, hinweis = "";
    if (c.modus === "m2") {
      if (!br || !ho) return { stueck: null, montage: mont, hinweis: "Maße fehlen" };
      var fl = Math.max(br * ho / 1e6, +c.mindest_m2 || 0); stueck = rund(fl * (+c.preis_m2 || 0) + (+c.grund || 0));
      hinweis = U.zahlText(rund(fl)) + " m² × " + U.eur(+c.preis_m2 || 0) + (c.grund ? " + " + U.eur(+c.grund) : "");
    } else if (c.modus === "tabelle" && c.tabelle) {
      if (!br || !ho) return { stueck: null, montage: mont, hinweis: "Maße fehlen" };
      stueck = K.preistabelleSuchen(c.tabelle, br, ho); hinweis = stueck == null ? "außerhalb der Preistabelle" : "aus Preistabelle";
      if (stueck != null && c.grund) stueck = rund(stueck + (+c.grund));
    }
    return { stueck: stueck, montage: mont, hinweis: hinweis };
  };
  K.btRichtpreis = function (daten) {
    var l = (daten && daten.bauteile) || [], summe = 0, ohne = 0, mit = 0;
    l.forEach(function (b) { var n = K.btRechnen(b).anzahl; if (!n) return; var p = K.btPreis(b); if (!p || p.stueck == null) { ohne++; return; } mit++; summe += n * (p.stueck + (p.montage || 0)); });
    return mit ? { summe: rund(summe), ohne: ohne } : null;
  };
  K.btMontageDa = function (daten) { return ((daten && daten.bauteile) || []).some(function (b) { var p = K.btPreis(b); return p && p.montage > 0; }); };

  /* ---------- Ansicht ---------- */
  V.bauteilpreise = async function () {
    var c = cfg();
    return K.kopf("Bauteil-Preise", "Maßabhängige Preise für Fenster, Türen, Rollläden, Sonnenschutz und Überdachungen. Kundario setzt sie beim Übernehmen des Aufmaßes ins Angebot ein. Alle Preise netto.") +
      '<div class="tabelle"><table class="btp"><thead><tr><th>Art</th><th>Preis nach</th><th>Details</th><th class="r">Montage je Stk.</th><th></th></tr></thead><tbody>' + K.BT_ARTEN.map(function (a) {
        var x = c[a] || {}, det = x.modus === "m2" ? U.eur(+x.preis_m2 || 0) + " je m²" + (x.mindest_m2 ? ", mind. " + U.zahlText(x.mindest_m2) + " m²" : "") + (x.grund ? ", + " + U.eur(x.grund) + " je Stk." : "")
          : x.modus === "tabelle" && x.tabelle ? "Tabelle " + x.tabelle.breiten.length + " × " + x.tabelle.hoehen.length + " Stufen, bis " + x.tabelle.breiten.slice(-1)[0] + " × " + x.tabelle.hoehen.slice(-1)[0] + " mm" + (x.grund ? ", + " + U.eur(x.grund) + " je Stk." : "") : '<span class="still">kein Preis – im Angebot von Hand</span>';
        return "<tr><td><b>" + h(a) + "</b></td><td>" + (x.modus === "m2" ? "Preis je m²" : x.modus === "tabelle" ? "Preistabelle" : "–") + "</td><td>" + det + '</td><td class="r">' + (x.montage ? U.eur(+x.montage) : "") + '</td><td class="r"><button class="btn btn-outline klein" data-a="btpBearb" data-art="' + h(a) + '">Bearbeiten</button></td></tr>';
      }).join("") + "</tbody></table></div>" +
      '<section class="karte"><h2>So funktioniert die Preistabelle</h2><p>Wie in den Preislisten der Hersteller: oben die Breiten, links die Höhen in Millimetern. Kundario rundet auf die nächste Stufe auf (1.230 mm Breite → Spalte 1.250). Aus Excel kopieren oder als CSV einlesen, Trennzeichen Semikolon.</p><pre class="btp-bsp">H/B;1000;1250;1500\n1000;210;235;260\n1250;230;258;286\n1500;250;281;312</pre></section>';
  };
  K.aktion.btpBearb = async function (el) {
    var art = el.dataset.art, alle = Object.assign({}, cfg()), x = alle[art] || {};
    var r = await U.dialog("Preis: " + art, '<div class="raster">' + U.feld("modus", "Preis nach", x.modus || "", { optionen: [["", "kein Preis (im Angebot von Hand)"], ["m2", "Preis je m² (Breite × Höhe)"], ["tabelle", "Preistabelle Breite × Höhe"]] }) +
      U.feld("preis_m2", "Preis je m² (€)", x.preis_m2 != null ? U.zahlText(x.preis_m2, 2) : "", { typ: "number" }) + U.feld("mindest_m2", "Mindestfläche je Stück (m²)", x.mindest_m2 != null ? U.zahlText(x.mindest_m2) : "", { typ: "number", hilfe: "Kleine Elemente werden mit dieser Fläche berechnet." }) +
      U.feld("grund", "Grundpreis / Zuschlag je Stück (€)", x.grund != null ? U.zahlText(x.grund, 2) : "", { typ: "number", hilfe: "z. B. Antrieb, Kasten, Zubehör. Gilt für beide Arten." }) +
      U.feld("montage", "Montage je Stück (€)", x.montage != null ? U.zahlText(x.montage, 2) : "", { typ: "number", hilfe: "Wird als eigene Position ins Angebot übernommen." }) +
      U.feld("tabelle", "Preistabelle (nur bei „Preistabelle“)", K.preistabelleText(x.tabelle), { typ: "textarea", zeilen: 6, breit: true, ph: "H/B;1000;1250;1500\n1000;210;235;260" }) +
      '<p class="breit"><label class="btn btn-outline klein">CSV-Datei einlesen<input type="file" accept=".csv,.txt,text/csv" hidden data-btp-csv></label></p></div>',
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Speichern", primaer: true }]);
    if (!r) return;
    var d = r.daten, neu = { modus: d.modus || "" };
    var zahl = function (v) { return String(v || "").trim() === "" ? null : U.zahl(v); };
    ["preis_m2", "mindest_m2", "grund", "montage"].forEach(function (k) { var v = zahl(d[k]); if (v != null) { if (v < 0) throw new Error("Bitte keine negativen Werte."); neu[k] = v; } });
    if (neu.modus === "m2" && !(neu.preis_m2 > 0)) throw new Error("Bitte einen Preis je m² eintragen.");
    if (neu.modus === "tabelle") neu.tabelle = K.preistabelleLesen(d.tabelle);
    if (!neu.modus && !neu.montage) delete alle[art]; else alle[art] = neu;
    var kalk = Object.assign({}, (K.ctx.betrieb.kalkulation || {}), { bauteilpreise: alle });
    K.ctx.betrieb = await DB.aendern("betriebe", K.bid(), { kalkulation: kalk }); U.toast("Preis für " + art + " gespeichert."); K.neuLaden();
  };
  document.addEventListener("change", function (e) {
    var inp = e.target.closest && e.target.closest("[data-btp-csv]"); if (!inp || !inp.files.length) return;
    var f = new FileReader(); f.onload = function () { var ta = inp.closest("form, dialog").querySelector("[name=tabelle]"); ta.value = String(f.result); var m = inp.closest("form, dialog").querySelector("[name=modus]"); if (m && !m.value) m.value = "tabelle"; }; f.readAsText(inp.files[0], "utf-8");
  });
})();
