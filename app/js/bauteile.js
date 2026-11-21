/* Kundario – Aufmaß für Fenster, Türen, Rollläden, Sonnenschutz und Überdachungen (Startsegment)
   Je Bauteil: Art, Lage, Breite × Höhe in mm, Ausführung, Anzahl.
   Daraus: Fläche, Fugenlänge (Fenster/Türen), Warnung bei unplausiblen Maßen, Positionen fürs Angebot. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;
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

  var KAMERA = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>';
  var zeile = function (b, i) {
    var a = art(b.art), x = K.btRechnen(b), warn = K.btWarnung(b);
    return '<tr data-bt="' + i + '"><td><select name="bt_a_' + i + '">' + Object.keys(ARTEN).map(function (n) { return "<option" + (n === b.art ? " selected" : "") + ">" + h(n) + "</option>"; }).join("") + "</select></td>" +
      '<td><input type="hidden" name="bt_id_' + i + '" value="' + h(b.id || "") + '"><input name="bt_l_' + i + '" value="' + h(b.lage || "") + '" placeholder="z. B. Küche"><div class="bt-fotos" data-btf="' + h(b.id || "") + '">' + ((b.fotos || []).length ? '<small class="still">' + b.fotos.length + " Foto" + (b.fotos.length === 1 ? "" : "s") + "</small>" : "") + "</div></td>" +
      '<td><input name="bt_b_' + i + '" value="' + h(b.b || "") + '" inputmode="numeric" placeholder="mm" aria-label="Breite in mm"></td>' +
      '<td><input name="bt_h_' + i + '" value="' + h(b.h || "") + '" inputmode="numeric" placeholder="mm" aria-label="' + h(a.hoehe || "Höhe") + ' in mm" title="' + h(a.hoehe || "Höhe") + '"></td>' +
      '<td><input name="bt_x_' + i + '" value="' + h(b.aus || "") + '" list="bt-aus-' + i + '" placeholder="z. B. ' + h(a.aus[0] || "Ausführung") + '"><datalist id="bt-aus-' + i + '">' + a.aus.map(function (o) { return '<option value="' + h(o) + '">'; }).join("") + "</datalist></td>" +
      '<td><input name="bt_n_' + i + '" value="' + h(b.anzahl == null ? "1" : b.anzahl) + '" inputmode="numeric" class="kurz"></td>' +
      '<td class="r" data-bt-erg>' + (warn.length ? '<span class="pill rot">' + h(warn.join(", ")) + " prüfen</span>" : (x.flaecheGesamt ? U.zahlText(x.flaecheGesamt) + " m²" : "")) + "</td>" +
      '<td class="bt-akt"><label class="mini kamera" title="Foto aufnehmen" aria-label="Foto zum Bauteil">' + KAMERA + '<input type="file" accept="image/*" capture="environment" hidden data-btfoto="' + i + '"></label><button type="button" class="mini" data-a="btWeg" data-i="' + i + '" aria-label="Bauteil entfernen">×</button></td></tr>';
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
      var idf = f.elements["bt_id_" + i]; if (!idf.value) idf.value = U.uuid();
      var alt = liste(K._aufmass && K._aufmass.daten).filter(function (x) { return x.id === idf.value; })[0] || {};
      var o = { id: idf.value, art: f.elements["bt_a_" + i].value, lage: f.elements["bt_l_" + i].value.trim(), b: f.elements["bt_b_" + i].value.trim(), h: f.elements["bt_h_" + i].value.trim(), aus: f.elements["bt_x_" + i].value.trim(), anzahl: f.elements["bt_n_" + i].value.trim(), fotos: alt.fotos || [] };
      if (o.lage || o.b || o.h || o.aus || o.fotos.length) l.push(o);
    }
    return l;
  }
  var altDaten = K.amDaten;
  K.amDaten = function (f, raeume) {
    var d = altDaten(f, raeume);
    d.bauteile = f.querySelector("[data-bt]") ? lesen(f) : liste(K._aufmass && K._aufmass.daten);
    d.skizzen = (K._aufmass && K._aufmass.daten && K._aufmass.daten.skizzen) || [];
    return d;
  };
  var altDanach = V.aufmass.danach;
  V.aufmass.danach = function (id, extra) {
    if (altDanach) altDanach(id, extra);
    var f = document.getElementById("am-form"); if (!f || !id || id === "neu") return;
    var k = f.querySelector(".fz-bereich") || f.querySelector(".knoepfe:last-of-type");
    k.insertAdjacentHTML("beforebegin", bereich(K._aufmass.daten) + skizzenBereich(K._aufmass.daten));
    bilderLaden(K._aufmass.daten);
  };
  function skizzenBereich(d) {
    var l = (d && d.skizzen) || [];
    return '<section class="sk-bereich"><h3>Skizzen</h3><p class="still">Grundriss, Ansicht oder Detail mit dem Finger zeichnen, Maße dazuschreiben.</p>' +
      '<div class="fotos sk-liste">' + l.map(function (x, i) { return '<figure class="skz"><a href="#" data-a="skZeigen" data-i="' + i + '"><img data-skpfad="' + h(x.pfad) + '" alt="' + h(x.titel || "Skizze") + '"></a><figcaption>' + h(x.titel || "Skizze " + (i + 1)) + ' <button type="button" class="mini" data-a="skWeg" data-i="' + i + '" aria-label="Skizze entfernen">×</button></figcaption></figure>'; }).join("") + "</div>" +
      '<div class="knoepfe links"><button type="button" class="btn btn-outline klein" data-a="skNeu">+ Skizze zeichnen</button></div></section>';
  }
  async function bilderLaden(d) {
    for (var b of liste(d)) {
      var box = document.querySelector('.bt-fotos[data-btf="' + b.id + '"]'); if (!box || !(b.fotos || []).length) continue;
      var urls = await Promise.all(b.fotos.map(function (p) { return DB.datei.link(p).catch(function () { return ""; }); }));
      box.innerHTML = urls.map(function (u, j) { return u ? '<a href="' + h(u) + '" target="_blank" rel="noopener"><img src="' + h(u) + '" alt="Foto ' + (j + 1) + " " + h(b.art) + '"></a>' : ""; }).join("");
    }
    for (var img of document.querySelectorAll("img[data-skpfad]")) img.src = await DB.datei.link(img.dataset.skpfad).catch(function () { return ""; });
  }
  async function speichernAusFormular() {
    var f = document.getElementById("am-form"), d = K.amDaten(f, amRaeume(f));
    await DB.aendern("aufmasse", f.dataset.id, { titel: f.elements.titel.value, daten: d }); K._aufmass.daten = d; return d;
  }
  function amRaeume(f) { var r = []; for (var i = 0; f.elements["n_" + i]; i++) r.push({ name: f.elements["n_" + i].value, l: f.elements["l_" + i].value, b: f.elements["b_" + i].value, h: f.elements["h_" + i].value, abzug: f.elements["a_" + i].value }); return r; }
  // Foto zum Bauteil
  document.addEventListener("change", async function (e) {
    var inp = e.target.closest && e.target.closest("[data-btfoto]"); if (!inp || !inp.files.length) return;
    try {
      var datei = inp.files[0]; if (datei.size > 15e6) throw new Error("Das Foto ist zu groß (höchstens 15 MB).");
      var f = document.getElementById("am-form"), i = inp.dataset.btfoto, tr = inp.closest("tr");
      if (!["l", "b", "h", "x"].some(function (k) { return f.elements["bt_" + k + "_" + i].value.trim(); })) { inp.value = ""; throw new Error("Bitte zuerst Lage oder Maße des Bauteils eintragen."); }
      var d = await speichernAusFormular(), id = f.elements["bt_id_" + i].value;
      var klein = K.bildVerkleinern ? await K.bildVerkleinern(datei) : datei, pfad = K.bid() + "/aufmass/" + f.dataset.id + "/" + Date.now() + ".jpg";
      try { await DB.datei.hoch(pfad, klein); }
      catch (x) { if (K.istOffline && K.istOffline(x)) throw new Error("Kein Netz: Das Foto konnte nicht gespeichert werden. Maße sind gesichert – Foto bitte nochmal aufnehmen, wenn wieder Netz da ist."); throw x; }
      d.bauteile.forEach(function (b) { if (b.id === id) b.fotos = (b.fotos || []).concat([pfad]); });
      await DB.aendern("aufmasse", f.dataset.id, { daten: d }); U.toast("Foto gespeichert."); K.neuLaden();
    } catch (x) { U.fehler(x); }
  });
  // Skizze zeichnen
  K.aktion.skNeu = async function () {
    await speichernAusFormular();
    var n = ((K._aufmass.daten.skizzen || []).length + 1);
    var dlg = U.dialog("Skizze zeichnen", U.feld("titel", "Bezeichnung", "Skizze " + n, { pflicht: true }) + '<canvas class="sig skizze" id="sk-pad"></canvas><p class="knoepfe links"><button type="button" class="btn btn-outline klein" id="sk-leeren">Leeren</button></p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Speichern", primaer: true }]);
    var pad; setTimeout(function () { pad = U.unterschrift(document.getElementById("sk-pad")); document.getElementById("sk-leeren").onclick = function () { pad.neu(); }; }, 30);
    var r = await dlg; if (!r) return; if (!pad || pad.leer()) throw new Error("Die Skizze ist leer.");
    var c = document.getElementById("sk-pad") || null, png = pad.bild();
    var weiss = await new Promise(function (ok) { var img = new Image(); img.onload = function () { var cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; var x = cv.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0); cv.toBlob(function (b) { ok(b); }, "image/png"); }; img.src = png; });
    var pfad = K.bid() + "/aufmass/" + K._aufmass.id + "/skizze-" + Date.now() + ".png";
    await DB.datei.hoch(pfad, new File([weiss], "skizze.png", { type: "image/png" }));
    var d = K._aufmass.daten; d.skizzen = (d.skizzen || []).concat([{ pfad: pfad, titel: r.daten.titel.trim() }]);
    await DB.aendern("aufmasse", K._aufmass.id, { daten: d }); U.toast("Skizze gespeichert."); K.neuLaden();
  };
  K.aktion.skWeg = async function (el) {
    if (!(await U.bestaetigen("Skizze aus dem Aufmaß entfernen?", "Entfernen", true))) return;
    var d = await speichernAusFormular(); d.skizzen.splice(+el.dataset.i, 1); await DB.aendern("aufmasse", K._aufmass.id, { daten: d }); K.neuLaden();
  };
  K.aktion.skZeigen = async function (el) { var s = K._aufmass.daten.skizzen[+el.dataset.i]; var u = s && await DB.datei.link(s.pfad); if (!u) return; U.dialog(s.titel || "Skizze", '<img class="sk-gross" src="' + h(u) + '" alt="">', [{ wert: "", text: "Schließen", primaer: true }]); };
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
