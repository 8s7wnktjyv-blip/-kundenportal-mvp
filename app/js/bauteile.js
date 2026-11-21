/* Kundario – Aufmaß für Fenster, Türen, Rollläden, Sonnenschutz und Überdachungen (Startsegment)
   Je Bauteil: Art, Lage, Breite × Höhe in mm, Ausführung, Anzahl.
   Daraus: Fläche, Fugenlänge (Fenster/Türen), Warnung bei unplausiblen Maßen, Positionen fürs Angebot. */
(function () {
  "use strict";
  var K = window.K, U = window.U, V = K.views, h = U.h;
  var rund = function (x) { return Math.round(x * 100) / 100; };

  // Arten ← hier ergänzen. fuge: Anschlussfuge rundum zählt mit; hoehe: Beschriftung des zweiten Maßes; aus: Vorschläge für „Ausführung“
  var ARTEN = {
    "Fenster": { fuge: true, aus: ["Dreh-Kipp", "Kipp", "Festverglasung", "Stulp 2-flügelig", "Kunststoff", "Holz", "Holz-Alu", "Alu"] },
    "Fenstertür / Balkontür": { fuge: true, aus: ["Dreh-Kipp", "Hebe-Schiebe", "Parallel-Schiebe-Kipp", "Kunststoff", "Alu"] },
    "Haustür": { fuge: true, aus: ["Alu", "Kunststoff", "Holz", "mit Seitenteil", "Mehrfachverriegelung"] },
    "Rollladen": { aus: ["Vorbau", "Aufsatz", "Gurt", "Elektro", "Elektro mit Funk", "Solar", "Panzer Alu", "Panzer Kunststoff"] },
    "Raffstore": { aus: ["Elektro", "Elektro mit Funk", "Lamelle 80 mm", "Lamelle 60 mm", "Führungsschiene", "Seilführung"] },
    "Markise": { hoehe: "Ausfall", aus: ["Gelenkarm", "Kassette", "Halbkassette", "Elektro", "Kurbel", "Wind-/Sonnensensor"] },
    "Senkrechtmarkise / Screen": { aus: ["ZIP-Führung", "Seilführung", "Elektro", "Kurbel"] },
    "Insektenschutz": { aus: ["Spannrahmen", "Drehrahmen", "Schiebeanlage", "Rollo", "Plissee"] },
    "Terrassendach / Überdachung": { hoehe: "Tiefe", aus: ["Alu", "Holz", "VSG-Glas", "Stegplatten", "Wandanschluss", "freistehend", "mit Beschattung"] },
    "Sonstiges": { aus: [] }
  };
  var art = function (n) { return ARTEN[n] || ARTEN.Sonstiges; };
  // Millimeter lesen: „1.230“, „1230“, „1 230“ → 1230. Kommazahlen kleiner 10 werden als Meter gelesen (1,23 → 1230).
  K.mm = function (v) {
    var s = String(v == null ? "" : v).trim().replace(/\s/g, ""); if (!s) return 0;
    if (/^\d{1,2},\d+$/.test(s)) return Math.round(parseFloat(s.replace(",", ".")) * 1000);
    var n = parseFloat(s.replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : Math.round(n);
  };
  // Plausibel sind 200–7.000 mm (Terrassendach bis 12.000 mm Breite)
  K.btWarnung = function (b) {
    var br = K.mm(b.b), ho = K.mm(b.h), max = b.art === "Terrassendach / Überdachung" ? 12000 : 7000, w = [];
    if (b.b !== "" && b.b != null && (br < 200 || br > max)) w.push("Breite");
    if (b.h !== "" && b.h != null && (ho < 200 || ho > max)) w.push((art(b.art).hoehe || "Höhe"));
    return w;
  };
  K.btRechnen = function (b) {
    var br = K.mm(b.b) / 1000, ho = K.mm(b.h) / 1000, n = Math.max(0, Math.round(U.zahl(b.anzahl) || 0));
    return { flaeche: rund(br * ho), flaecheGesamt: rund(br * ho * n), fuge: art(b.art).fuge ? rund(2 * (br + ho) * n) : 0, anzahl: n };
  };
  var liste = function (d) { return (d && d.bauteile) || []; };
  K.btSummen = function (daten) {
    return liste(daten).reduce(function (s, b) { var x = K.btRechnen(b); if (!x.anzahl) return s; s.stueck += x.anzahl; s.flaeche = rund(s.flaeche + x.flaecheGesamt); s.fuge = rund(s.fuge + x.fuge); s.arten[b.art] = (s.arten[b.art] || 0) + x.anzahl; return s; }, { stueck: 0, flaeche: 0, fuge: 0, arten: {} });
  };
  var mmText = function (v) { var n = K.mm(v); return n ? n.toLocaleString("de-DE") : ""; };
  K.btText = function (b) {
    var a = art(b.art), teile = [b.art || "Bauteil"];
    if (b.lage) teile.push(b.lage);
    if (K.mm(b.b) || K.mm(b.h)) teile.push((a.hoehe ? "Breite " + mmText(b.b) + " × " + a.hoehe + " " + mmText(b.h) : mmText(b.b) + " × " + mmText(b.h)) + " mm");
    if (b.aus) teile.push(b.aus);
    return teile.join(", ");
  };
  // Positionen fürs Angebot: je Bauteil eine Stück-Position, optional die Anschlussfuge in lfm
  K.amBauteilPos = function (daten, mitFuge) {
    var pos = liste(daten).filter(function (b) { return K.btRechnen(b).anzahl > 0; }).map(function (b) { return { id: U.uuid(), typ: "pos", text: K.btText(b), menge: K.btRechnen(b).anzahl, einheit: "Stk.", preis: 0 }; });
    var s = K.btSummen(daten);
    if (mitFuge && s.fuge > 0) pos.push({ id: U.uuid(), typ: "pos", text: "Anschlussfuge innen luftdicht, außen schlagregendicht abdichten", menge: s.fuge, einheit: "lfm", preis: 0 });
    return pos;
  };

  var zeile = function (b, i) {
    var a = art(b.art), x = K.btRechnen(b), warn = K.btWarnung(b);
    return '<tr data-bt="' + i + '"><td><select name="bt_a_' + i + '">' + Object.keys(ARTEN).map(function (n) { return "<option" + (n === b.art ? " selected" : "") + ">" + h(n) + "</option>"; }).join("") + "</select></td>" +
      '<td><input name="bt_l_' + i + '" value="' + h(b.lage || "") + '" placeholder="z. B. Küche"></td>' +
      '<td><input name="bt_b_' + i + '" value="' + h(b.b || "") + '" inputmode="numeric" placeholder="mm" aria-label="Breite in mm"></td>' +
      '<td><input name="bt_h_' + i + '" value="' + h(b.h || "") + '" inputmode="numeric" placeholder="mm" aria-label="' + h(a.hoehe || "Höhe") + ' in mm" title="' + h(a.hoehe || "Höhe") + '"></td>' +
      '<td><input name="bt_x_' + i + '" value="' + h(b.aus || "") + '" list="bt-aus-' + i + '" placeholder="z. B. ' + h(a.aus[0] || "Ausführung") + '"><datalist id="bt-aus-' + i + '">' + a.aus.map(function (o) { return '<option value="' + h(o) + '">'; }).join("") + "</datalist></td>" +
      '<td><input name="bt_n_' + i + '" value="' + h(b.anzahl == null ? "1" : b.anzahl) + '" inputmode="numeric" class="kurz"></td>' +
      '<td class="r" data-bt-erg>' + (warn.length ? '<span class="pill rot">' + h(warn.join(", ")) + " prüfen</span>" : (x.flaecheGesamt ? U.zahlText(x.flaecheGesamt) + " m²" : "")) + "</td>" +
      '<td><button type="button" class="mini" data-a="btWeg" data-i="' + i + '" aria-label="Bauteil entfernen">×</button></td></tr>';
  };
  function bereich(daten) {
    var l = liste(daten), s = K.btSummen(daten);
    var zeilen = l.length ? l : [{ art: "Fenster", anzahl: "1" }];
    return '<section class="bt-bereich"><h3>Fenster, Türen, Sonnenschutz, Überdachung</h3><p class="still">Je Bauteil Breite × Höhe in Millimetern (Rohbau- bzw. Lichtmaß, wie Sie messen). Fläche und Fugenlänge rechnet Kundario. Unplausible Maße (z. B. Meter statt Millimeter) werden rot markiert.</p>' +
      '<div class="tabelle"><table class="am bt"><thead><tr><th>Art</th><th>Lage</th><th>Breite</th><th>Höhe / Tiefe</th><th>Ausführung</th><th>Anzahl</th><th class="r">Fläche</th><th></th></tr></thead><tbody>' + zeilen.map(zeile).join("") + "</tbody></table></div>" +
      '<div class="knoepfe links"><button type="button" class="btn btn-outline klein" data-a="btNeu">+ Bauteil</button></div>' +
      (s.stueck ? '<div class="bt-summen"><h3>Zusammengefasst</h3><ul class="liste">' + Object.keys(s.arten).map(function (n) { return "<li><b>" + h(n) + "</b> · " + s.arten[n] + " Stk.</li>"; }).join("") +
        "<li>Fläche gesamt · " + U.zahlText(s.flaeche) + " m²</li>" + (s.fuge ? "<li>Anschlussfuge Fenster und Türen · " + U.zahlText(s.fuge) + " lfm</li>" : "") + "</ul></div>" : "") + "</section>";
  }
  function lesen(f) {
    var l = []; for (var i = 0; f.elements["bt_a_" + i]; i++) {
      var o = { art: f.elements["bt_a_" + i].value, lage: f.elements["bt_l_" + i].value.trim(), b: f.elements["bt_b_" + i].value.trim(), h: f.elements["bt_h_" + i].value.trim(), aus: f.elements["bt_x_" + i].value.trim(), anzahl: f.elements["bt_n_" + i].value.trim() };
      if (o.lage || o.b || o.h || o.aus) l.push(o);
    }
    return l;
  }
  var altDaten = K.amDaten;
  K.amDaten = function (f, raeume) {
    var d = altDaten(f, raeume);
    d.bauteile = f.querySelector("[data-bt]") ? lesen(f) : liste(K._aufmass && K._aufmass.daten);
    return d;
  };
  var altDanach = V.aufmass.danach;
  V.aufmass.danach = function (id, extra) {
    if (altDanach) altDanach(id, extra);
    var f = document.getElementById("am-form"); if (!f || !id || id === "neu") return;
    var k = f.querySelector(".fz-bereich") || f.querySelector(".knoepfe:last-of-type");
    k.insertAdjacentHTML("beforebegin", bereich(K._aufmass.daten));
  };
  K.aktion.btNeu = function () {
    var tb = document.querySelector("table.bt tbody"), i = tb.rows.length, letzte = tb.rows[i - 1];
    tb.insertAdjacentHTML("beforeend", zeile({ art: letzte ? letzte.querySelector("[name^=bt_a_]").value : "Fenster", anzahl: "1" }, i));
    tb.rows[i].querySelector("[name^=bt_l_]").focus();
  };
  K.aktion.btWeg = function (el) { var tr = el.closest("tr"); tr.querySelectorAll("input").forEach(function (x) { x.value = ""; }); tr.hidden = true; };
  // Ergebnis sofort beim Tippen, Vorschläge passend zur Art
  document.addEventListener("input", function (e) {
    var tr = e.target.closest && e.target.closest("tr[data-bt]"); if (!tr) return;
    var i = tr.dataset.bt, g = function (k) { return tr.querySelector("[name=bt_" + k + "_" + i + "]").value; };
    var b = { art: g("a"), b: g("b"), h: g("h"), anzahl: g("n") }, warn = K.btWarnung(b), x = K.btRechnen(b);
    tr.querySelector("[data-bt-erg]").innerHTML = warn.length ? '<span class="pill rot">' + h(warn.join(", ")) + " prüfen</span>" : (x.flaecheGesamt ? U.zahlText(x.flaecheGesamt) + " m²" : "");
  });
  document.addEventListener("change", function (e) {
    if (!e.target.matches || !e.target.matches("select[name^=bt_a_]")) return;
    var i = e.target.name.slice(5), a = art(e.target.value), dl = document.getElementById("bt-aus-" + i);
    if (dl) dl.innerHTML = a.aus.map(function (o) { return '<option value="' + h(o) + '">'; }).join("");
    var hi = document.querySelector("[name=bt_h_" + i + "]"); if (hi) { hi.title = a.hoehe || "Höhe"; hi.setAttribute("aria-label", (a.hoehe || "Höhe") + " in mm"); }
  });
})();
