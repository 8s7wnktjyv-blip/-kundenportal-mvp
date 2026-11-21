/* Kundario – Kassenbuch, Umsatzsteuer-Voranmeldung (Vorschau) und Einnahmen-Überschuss-Übersicht */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;
  var rund = function (x) { return Math.round(x * 100) / 100; };
  var sum = function (l, f) { return rund(l.reduce(function (s, x) { return s + (+f(x) || 0); }, 0)); };

  /* ======================= Kassenbuch ======================= */
  K.KASSE_ART = { einnahme: ["Einnahme", 1], ausgabe: ["Ausgabe", -1], einlage: ["Privateinlage", 1], entnahme: ["Privatentnahme", -1], zur_bank: ["Einzahlung auf die Bank", -1], von_bank: ["Abhebung von der Bank", 1] };
  K.kasseWirkung = function (x) { return (x.storno_von ? -1 : 1) * K.KASSE_ART[x.art][1] * +x.betrag; };
  var monatName = function (m) { return new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" }); };
  var monatPlus = function (m, n) { var d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return U.isoTag(d).slice(0, 7); };

  async function kasseDaten(monat) {
    var alle = await K.liste("kasse", { sortiere: "nr.asc", limit: 10000 }), stand = 0, storniert = {};
    alle.forEach(function (x) { if (x.storno_von) storniert[x.storno_von] = x; });
    var zeilen = alle.map(function (x) { stand = rund(stand + K.kasseWirkung(x)); return { x: x, stand: stand }; });
    var anfang = sum(alle.filter(function (x) { return x.datum.slice(0, 7) < monat; }), K.kasseWirkung);
    var im = alle.filter(function (x) { return x.datum.slice(0, 7) === monat; }).sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : a.nr - b.nr; });
    var lauf = anfang, liste = im.map(function (x) { lauf = rund(lauf + K.kasseWirkung(x)); return { x: x, stand: lauf }; });
    return { alle: alle, bestand: stand, anfang: anfang, ende: lauf, liste: liste, storniert: storniert,
      ein: sum(im, function (x) { var w = K.kasseWirkung(x); return w > 0 ? w : 0; }), aus: sum(im, function (x) { var w = K.kasseWirkung(x); return w < 0 ? -w : 0; }), zeilen: zeilen };
  }
  var artText = function (x, d) { return (x.storno_von ? "Storno " : "") + K.KASSE_ART[x.art][0] + (x.kategorie ? " · " + x.kategorie : "") + (x.storno_von && d && d.alle ? " zu Nr. " + (d.alle.filter(function (y) { return y.id === x.storno_von; })[0] || {}).nr : ""); };

  V.kasse = async function () {
    var monat = sessionStorage.getItem("kasse-monat") || U.isoTag().slice(0, 7), d = await kasseDaten(monat);
    return K.kopf("Kassenbuch", "Bargeld lückenlos aufschreiben: jede Buchung bekommt eine feste Nummer und kann nicht geändert werden. Fehler korrigieren Sie mit einer Storno-Buchung.",
        '<button class="btn btn-outline" data-a="kasseDruck">Kassenbericht drucken</button><button class="btn btn-outline" data-a="kasseCsv">Als CSV</button><button class="btn btn-signal" data-a="kasseBuchen">Buchen</button>') +
      '<div class="kpis"><div class="kpi"><span>Kassenbestand jetzt</span><b>' + U.eur(d.bestand) + '</b></div><div class="kpi"><span>Einnahmen ' + h(monatName(monat)) + "</span><b>" + U.eur(d.ein) + '</b></div><div class="kpi"><span>Ausgaben ' + h(monatName(monat)) + "</span><b>" + U.eur(d.aus) + "</b></div></div>" +
      '<div class="kopf-zeile"><h2>' + h(monatName(monat)) + '</h2><span><button class="btn btn-outline klein" data-a="kasseMonat" data-n="-1">‹</button> <button class="btn btn-outline klein" data-a="kasseMonat" data-n="0">Aktuell</button> <button class="btn btn-outline klein" data-a="kasseMonat" data-n="1">›</button></span></div>' +
      (d.liste.length ? '<div class="tabelle"><table class="kasse"><thead><tr><th>Nr.</th><th>Datum</th><th>Text</th><th class="r">Einnahme</th><th class="r">Ausgabe</th><th class="r">USt.</th><th class="r">Bestand</th><th></th></tr></thead><tbody>' +
        '<tr class="still"><td></td><td>' + U.datum(monat + "-01") + '</td><td>Anfangsbestand</td><td></td><td></td><td></td><td class="r">' + U.eur(d.anfang) + "</td><td></td></tr>" +
        d.liste.map(function (z) { var x = z.x, w = K.kasseWirkung(x), weg = d.storniert[x.id];
          return '<tr class="' + (weg || x.storno_von ? "kasse-storno" : "") + '"><td>' + x.nr + "</td><td>" + U.datum(x.datum) + "</td><td><b>" + h(x.text) + "</b><br><small>" + h(artText(x, d)) + (weg ? " · storniert durch Nr. " + weg.nr : "") + "</small></td>" +
            '<td class="r">' + (w > 0 ? U.eur(w) : "") + '</td><td class="r">' + (w < 0 ? U.eur(-w) : "") + '</td><td class="r">' + (+x.ust_satz ? U.zahlText(x.ust_satz) + " %" : "") + '</td><td class="r">' + U.eur(z.stand) + "</td><td>" +
            (x.beleg ? '<button class="btn btn-ghost klein" data-a="kasseBeleg" data-id="' + x.id + '">Beleg</button>' : "") + (!weg && !x.storno_von ? '<button class="btn btn-ghost klein" data-a="kasseStorno" data-id="' + x.id + '">Stornieren</button>' : "") + "</td></tr>"; }).join("") +
        '</tbody><tfoot><tr><th colspan="3">Endbestand</th><th class="r">' + U.eur(d.ein) + '</th><th class="r">' + U.eur(d.aus) + '</th><th></th><th class="r">' + U.eur(d.ende) + "</th><th></th></tr></tfoot></table></div>"
        : K.leer("In diesem Monat gibt es keine Kassenbuchungen." + (d.alle.length ? "" : " Beginnen Sie mit einer Privateinlage in Höhe des Bargelds, das jetzt in der Kasse liegt."))) +
      '<p class="still">Barzahlungen von Kunden, die Sie bei einer Rechnung mit „Bar“ erfassen, werden automatisch hier eingetragen. Zählen Sie die Kasse regelmäßig – der Bestand hier muss mit dem Bargeld übereinstimmen.</p>';
  };
  K.aktion.kasseMonat = function (el) { var n = +el.dataset.n, m = sessionStorage.getItem("kasse-monat") || U.isoTag().slice(0, 7); sessionStorage.setItem("kasse-monat", n === 0 ? U.isoTag().slice(0, 7) : monatPlus(m, n)); K.neuLaden(); };

  K.kasseBuchen = async function (o) { return K.neu("kasse", o); };
  K.aktion.kasseBuchen = async function () {
    var r = await U.dialog("Kasse buchen", '<div class="raster">' + U.feld("art", "Art", "ausgabe", { optionen: Object.keys(K.KASSE_ART).map(function (k) { return [k, K.KASSE_ART[k][0]]; }) }) +
      U.feld("datum", "Datum", U.isoTag(), { typ: "date", pflicht: true, attr: ' max="' + U.isoTag() + '"' }) + U.feld("betrag", "Betrag brutto €", "", { typ: "number", pflicht: true }) +
      U.feld("text", "Wofür?", "", { pflicht: true, max: 200, ph: "z. B. Schrauben Baumarkt" }) + U.feld("ust_satz", "Umsatzsteuer", "19", { optionen: [["19", "19 %"], ["7", "7 %"], ["0", "keine"]], hilfe: "Nur bei Einnahmen und Ausgaben." }) +
      U.feld("kategorie", "Kategorie (bei Ausgaben)", "Material", { optionen: K.BELEG_KAT.map(function (k) { return [k, k]; }) }) + "</div>" +
      '<p><label>Beleg (Foto oder PDF, optional)<br><input type="file" name="beleg" accept="image/*,application/pdf" capture="environment"></label></p><p class="still">Gebuchte Einträge können nicht mehr geändert werden. Bitte vor dem Speichern prüfen.</p>',
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Buchen", primaer: true }]);
    if (!r) return;
    var d = r.daten, betrag = rund(U.zahl(d.betrag)); if (!(betrag > 0)) throw new Error("Bitte einen Betrag größer 0 eingeben.");
    var steuer = d.art === "einnahme" || d.art === "ausgabe";
    var o = { art: d.art, datum: d.datum, betrag: betrag, text: d.text.trim(), ust_satz: steuer ? +d.ust_satz : 0, kategorie: d.art === "ausgabe" ? d.kategorie : null };
    var f = r.dlg.querySelector("input[type=file]"); if (f && f.files[0] && K.belegDateiHoch) o.beleg = await K.belegDateiHoch(f.files[0]);
    var x = await K.kasseBuchen(o); U.toast("Gebucht als Nr. " + x.nr + "."); K.neuLaden();
  };
  K.aktion.kasseStorno = async function (el) {
    var x = await DB.eins("kasse", el.dataset.id);
    var r = await U.dialog("Buchung Nr. " + x.nr + " stornieren", "<p>" + h(x.text) + " · " + U.eur(x.betrag) + "</p><p>Es wird eine Gegenbuchung mit neuer Nummer angelegt. Die ursprüngliche Buchung bleibt sichtbar.</p>" + U.feld("grund", "Grund", "", { pflicht: true, ph: "z. B. Betrag falsch eingegeben" }), [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Stornieren", gefahr: true }]);
    if (!r) return;
    await K.neu("kasse", { storno_von: x.id, art: x.art, betrag: +x.betrag, datum: U.isoTag(), text: "Storno Nr. " + x.nr + ": " + r.daten.grund.trim(), ust_satz: +x.ust_satz }); U.toast("Storniert."); K.neuLaden();
  };
  K.aktion.kasseBeleg = async function (el) { var x = await DB.eins("kasse", el.dataset.id); window.open(await DB.datei.link(x.beleg), "_blank", "noopener"); };
  K.aktion.kasseCsv = async function () {
    var d = await kasseDaten(U.isoTag().slice(0, 7)), z = [["Nr.", "Datum", "Art", "Text", "Kategorie", "Einnahme", "Ausgabe", "USt-Satz", "Bestand", "Storno zu Nr.", "Gebucht am"]];
    var nr = {}; d.alle.forEach(function (x) { nr[x.id] = x.nr; });
    var zahl = function (v) { return v ? v.toFixed(2).replace(".", ",") : ""; };
    d.zeilen.forEach(function (r) { var x = r.x, w = K.kasseWirkung(x); z.push([x.nr, U.datum(x.datum), K.KASSE_ART[x.art][0], x.text, x.kategorie || "", zahl(w > 0 ? w : 0), zahl(w < 0 ? -w : 0), U.zahlText(x.ust_satz), zahl(r.stand), x.storno_von ? nr[x.storno_von] : "", U.datumZeit(x.created_at)]); });
    K.csvLaden(z, "kassenbuch-" + U.isoTag() + ".csv");
  };
  K.csvLaden = K.csvLaden || function (zeilen, name) {
    var csv = "﻿" + zeilen.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name; a.click();
  };
  K.aktion.kasseDruck = async function () {
    var monat = sessionStorage.getItem("kasse-monat") || U.isoTag().slice(0, 7), d = await kasseDaten(monat);
    var html = '<table class="d-pos"><thead><tr><th>Nr.</th><th>Datum</th><th>Text</th><th class="r">Einnahme</th><th class="r">Ausgabe</th><th class="r">Bestand</th></tr></thead><tbody>' +
      '<tr><td></td><td>' + U.datum(monat + "-01") + '</td><td>Anfangsbestand</td><td></td><td></td><td class="r">' + U.eur(d.anfang) + "</td></tr>" +
      d.liste.map(function (z) { var x = z.x, w = K.kasseWirkung(x); return "<tr><td>" + x.nr + "</td><td>" + U.datum(x.datum) + "</td><td>" + h(x.text) + "<br><small>" + h(artText(x, d)) + '</small></td><td class="r">' + (w > 0 ? U.eur(w) : "") + '</td><td class="r">' + (w < 0 ? U.eur(-w) : "") + '</td><td class="r">' + U.eur(z.stand) + "</td></tr>"; }).join("") +
      '<tr class="d-titel"><td></td><td></td><td>Summen und Endbestand</td><td class="r">' + U.eur(d.ein) + '</td><td class="r">' + U.eur(d.aus) + '</td><td class="r">' + U.eur(d.ende) + "</td></tr></tbody></table>" +
      '<p class="d-hinweise">Kassenbericht aus dem Kassenbuch in Kundario, erstellt am ' + U.datum(new Date()) + '. Gezählter Bestand am Monatsende: ____________ €  Unterschrift: ____________________</p>';
    U.drucken(U.dokument({ betrieb: K.ctx.betrieb, kunde: {}, titelArt: "Kassenbericht " + monatName(monat), nr: "", meta: [["Zeitraum", monatName(monat)]], zusatz: html }), "Kassenbericht-" + monat);
  };

  /* ======================= Umsatzsteuer und Überschuss ======================= */
  // Zeitraum: "2026-10" (Monat), "2026-Q3" (Quartal) oder "2026" (Jahr)
  K.zeitraum = function (z) {
    var j = +z.slice(0, 4), von, bis, name;
    if (/^\d{4}-\d{2}$/.test(z)) { von = new Date(j, +z.slice(5) - 1, 1); bis = new Date(j, +z.slice(5), 0); name = monatName(z); }
    else if (/Q/.test(z)) { var q = +z.slice(-1); von = new Date(j, (q - 1) * 3, 1); bis = new Date(j, q * 3, 0); name = q + ". Quartal " + j; }
    else { von = new Date(j, 0, 1); bis = new Date(j, 11, 31); name = "Jahr " + j; }
    return { von: U.isoTag(von), bis: U.isoTag(bis), name: name };
  };
  K.ustVa = function (q, zr, versteuerung) {   // q: { rechnungen, zahlungen, belege, kasse }
    var drin = function (d) { return d && d >= zr.von && d <= zr.bis; }, re = {}, kz = { 81: 0, 86: 0, 87: 0, 35: 0, 36: 0, 60: 0, 66: 0, 84: 0, 85: 0, 67: 0 }, quellen = [];
    q.rechnungen.forEach(function (r) { re[r.id] = r; });
    function umsatz(r, netto, text) {
      if (!netto) return; var fall = r.steuerfall || "normal", satz = +r.mwst;
      if (fall === "kleinunternehmer") return;
      if (fall === "13b") kz[60] += netto; else if (satz === 19) kz[81] += netto; else if (satz === 7) kz[86] += netto; else if (satz === 0) kz[87] += netto; else { kz[35] += netto; kz[36] += netto * satz / 100; }
      quellen.push({ text: text, netto: rund(netto), satz: fall === "13b" ? "§ 13b" : U.zahlText(satz) + " %" });
    }
    var anteil = function (r, betrag) { return +r.brutto ? betrag * (+r.netto / +r.brutto) : betrag; };
    var gestellt = q.rechnungen.filter(function (r) { return r.status !== "entwurf"; });
    if (versteuerung === "soll") {
      gestellt.forEach(function (r) { if (r.art !== "abschlag" && drin(r.datum)) umsatz(r, +r.netto, (r.art === "gutschrift" ? "Gutschrift " : "Rechnung ") + r.nr); });
      q.zahlungen.forEach(function (z) { var r = re[z.rechnung_id]; if (!r || !drin(z.datum)) return;
        if (r.art === "abschlag" && z.art !== "skonto") umsatz(r, anteil(r, +z.betrag), "Abschlag " + r.nr + " bezahlt");   // Anzahlungen: Steuer mit Zahlungseingang
        if (z.art === "skonto") umsatz(r, -anteil(r, +z.betrag), "Skonto " + r.nr); });
    } else {
      q.zahlungen.forEach(function (z) { var r = re[z.rechnung_id]; if (!r || z.art === "skonto" || !drin(z.datum)) return; umsatz(r, anteil(r, +z.betrag), "Zahlung " + r.nr + " vom " + U.datum(z.datum)); });
    }
    (q.kasse || []).forEach(function (x) { if (!drin(x.datum) || x.rechnung_id) return; var s = x.storno_von ? -1 : 1, netto = s * +x.betrag / (1 + +x.ust_satz / 100);
      if (x.art === "einnahme" && +x.ust_satz) umsatz({ mwst: +x.ust_satz }, netto, "Kasse Nr. " + x.nr);
      if (x.art === "ausgabe" && +x.ust_satz) kz[66] += s * +x.betrag - netto; });
    (q.belege || []).forEach(function (b) { if (!drin(b.datum)) return; if (b.steuer13b) { kz[84] += +b.netto; kz[85] += +b.netto * 0.19; kz[67] += +b.netto * 0.19; } else kz[66] += +b.ust; });
    Object.keys(kz).forEach(function (k) { kz[k] = rund(kz[k]); });
    var basis = function (n) { return n < 0 ? -Math.floor(-n) : Math.floor(n); };   // Bemessungsgrundlagen in vollen Euro
    var ust = rund(basis(kz[81]) * 0.19 + basis(kz[86]) * 0.07 + kz[36] + kz[85]);
    return { kz: kz, basis: basis, ust: ust, vorsteuer: rund(kz[66] + kz[67]), zahllast: rund(ust - kz[66] - kz[67]), quellen: quellen };
  };
  K.euer = function (q, zr) {
    var drin = function (d) { return d && d >= zr.von && d <= zr.bis; }, re = {}, ein = { netto: 0, ust: 0 }, aus = {}, vst = 0;
    q.rechnungen.forEach(function (r) { re[r.id] = r; });
    q.zahlungen.forEach(function (z) { var r = re[z.rechnung_id]; if (!r || z.art === "skonto" || !drin(z.datum)) return; var n = +r.brutto ? +z.betrag * (+r.netto / +r.brutto) : +z.betrag; ein.netto += n; ein.ust += +z.betrag - n; });
    var add = function (k, n) { aus[k] = (aus[k] || 0) + n; };
    q.belege.forEach(function (b) { if (b.status === "bezahlt" && drin(b.bezahlt_am)) { add(b.kategorie || "Sonstiges", +b.netto); vst += +b.ust; } });
    (q.kasse || []).forEach(function (x) { if (!drin(x.datum) || x.rechnung_id) return; var s = x.storno_von ? -1 : 1, n = s * +x.betrag / (1 + +x.ust_satz / 100);
      if (x.art === "einnahme") { ein.netto += n; ein.ust += s * +x.betrag - n; } if (x.art === "ausgabe") { add(x.kategorie || "Sonstiges", n); vst += s * +x.betrag - n; } });
    Object.keys(aus).forEach(function (k) { aus[k] = rund(aus[k]); });
    var ausSumme = sum(Object.keys(aus), function (k) { return aus[k]; });
    return { ein: { netto: rund(ein.netto), ust: rund(ein.ust) }, aus: aus, ausSumme: ausSumme, vorsteuer: rund(vst), ueberschuss: rund(ein.netto - ausSumme) };
  };

  async function steuerDaten() {
    var r = await Promise.all([K.liste("rechnungen", { limit: 20000 }), K.liste("zahlungen", { limit: 50000 }), K.liste("belege", { limit: 20000 }).catch(function () { return []; }), K.liste("kasse", { limit: 20000 }).catch(function () { return []; })]);
    return { rechnungen: r[0], zahlungen: r[1], belege: r[2], kasse: r[3] };
  }
  V.steuer = async function () {
    var b = K.ctx.betrieb, heute = new Date(), vm = new Date(heute.getFullYear(), heute.getMonth() - 1, 1);
    var zr = sessionStorage.getItem("ust-zr") || U.isoTag(vm).slice(0, 7), opt = [];
    for (var i = 0; i < 15; i++) { var m = U.isoTag(new Date(heute.getFullYear(), heute.getMonth() - i, 1)).slice(0, 7); opt.push([m, monatName(m)]); }
    for (var j = heute.getFullYear(); j >= heute.getFullYear() - 1; j--) { for (var qq = 4; qq >= 1; qq--) opt.push([j + "-Q" + qq, qq + ". Quartal " + j]); opt.push([String(j), "Jahr " + j]); }
    var Z = K.zeitraum(zr), q = await steuerDaten(), v = b.versteuerung || "ist", u = K.ustVa(q, Z, v), e = K.euer(q, Z), kz = u.kz;
    var zeile = function (nr, text, wert, steuer, fett) { return "<tr" + (fett ? ' class="summe"' : "") + "><td>" + (nr ? "<b>" + nr + "</b>" : "") + "</td><td>" + text + '</td><td class="r">' + (wert == null ? "" : wert) + '</td><td class="r">' + (steuer == null ? "" : U.eur(steuer)) + "</td></tr>"; };
    var euro = function (n) { return U.zahlText(u.basis(n)) + " €"; };
    var ust = b.kleinunternehmer ? '<div class="karte"><p>Sie sind als <b>Kleinunternehmer</b> eingestellt. Dann geben Sie in der Regel keine Umsatzsteuer-Voranmeldung ab.</p></div>' :
      '<section class="karte"><div class="kopf-zeile"><h2>Umsatzsteuer-Voranmeldung · ' + h(Z.name) + '</h2><button class="btn btn-outline klein" data-a="ustDruck">Drucken</button></div>' +
      '<p class="still">Diese Werte tragen Sie in ELSTER (Formular USt 1 A) in die gleichnamigen Kennzahlen ein. Berechnet nach <b>' + (v === "ist" ? "vereinnahmten Entgelten (Ist-Versteuerung)" : "vereinbarten Entgelten (Soll-Versteuerung)") + "</b>.</p>" +
      '<div class="tabelle"><table class="ust"><thead><tr><th>Kz.</th><th></th><th class="r">Bemessungsgrundlage</th><th class="r">Steuer</th></tr></thead><tbody>' +
      zeile("81", "Umsätze zu 19 %", euro(kz[81]), u.basis(kz[81]) * 0.19) + zeile("86", "Umsätze zu 7 %", euro(kz[86]), u.basis(kz[86]) * 0.07) +
      (kz[87] ? zeile("87", "Umsätze zu 0 % (z. B. Photovoltaik)", euro(kz[87])) : "") + (kz[35] ? zeile("35 / 36", "Umsätze zu anderen Steuersätzen", euro(kz[35]), kz[36]) : "") +
      (kz[84] ? zeile("84 / 85", "Bauleistungen, für die Sie die Steuer schulden (§ 13b)", euro(kz[84]), kz[85]) : "") + (kz[60] ? zeile("60", "Ihre Umsätze, für die der Kunde die Steuer schuldet (§ 13b)", euro(kz[60])) : "") +
      zeile("66", "Vorsteuer aus Rechnungen anderer Unternehmer", null, kz[66]) + (kz[67] ? zeile("67", "Vorsteuer aus Leistungen nach § 13b", null, kz[67]) : "") +
      zeile("83", u.zahllast >= 0 ? "Verbleibende Vorauszahlung" : "Überschuss (Erstattung)", null, u.zahllast, true) + "</tbody></table></div>" +
      '<details><summary>Woraus sich die Umsätze zusammensetzen (' + u.quellen.length + ')</summary><ul class="liste">' + u.quellen.map(function (x) { return "<li>" + h(x.text) + " · " + U.eur(x.netto) + " netto · " + h(x.satz) + "</li>"; }).join("") + "</ul></details>" +
      '<p class="still">Grundlage: gestellte Rechnungen und Zahlungen, Eingangsrechnungen (Vorsteuer nach Rechnungsdatum) und das Kassenbuch. Nicht enthalten: Einkäufe im EU-Ausland, Sondervorauszahlung (Kz. 39), Forderungsausfälle und alles, was nicht in Kundario erfasst ist. Bitte vor dem Absenden mit Ihrem Steuerberater abgleichen – Kundario sendet nichts an das Finanzamt.</p></section>';
    var euer = '<section class="karte"><h2>Einnahmen und Ausgaben · ' + h(Z.name) + '</h2><div class="tabelle"><table class="ust"><tbody>' +
      zeile("", "Betriebseinnahmen netto (Zahlungseingänge und Bareinnahmen)", null, e.ein.netto) + zeile("", "Vereinnahmte Umsatzsteuer", null, e.ein.ust) +
      Object.keys(e.aus).filter(function (k) { return Math.abs(e.aus[k]) >= 0.005; }).sort().map(function (k) { return zeile("", "Ausgaben " + h(k) + " netto", null, -e.aus[k]); }).join("") + zeile("", "Gezahlte Vorsteuer", null, -e.vorsteuer) +
      zeile("", "Überschuss vor Abschreibungen (netto)", null, e.ueberschuss, true) + "</tbody></table></div>" +
      '<p class="still">Nach dem Zuflussprinzip: zählt, was im Zeitraum bezahlt wurde. Ausgaben aus bezahlten Eingangsrechnungen und dem Kassenbuch. Nicht enthalten: Abschreibungen, Löhne und Ausgaben, die Sie nicht als Beleg erfasst haben. Die Steuererklärung (Anlage EÜR) macht Ihr Steuerberater – diese Übersicht hilft beim Einschätzen.</p></section>';
    return K.kopf("Umsatzsteuer und Überschuss", "Was Sie dem Finanzamt melden und was unterm Strich bleibt – aus Ihren Daten in Kundario.", K.ctx.ich.rolle === "gf" ? '<button class="btn btn-outline" data-a="versteuerung">Versteuerung: ' + (v === "ist" ? "Ist" : "Soll") + "</button>" : "") +
      '<div class="zeile-form"><select data-a-change="ustZeitraum">' + opt.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === zr ? " selected" : "") + ">" + h(o[1]) + "</option>"; }).join("") + "</select></div>" +
      '<div class="kpis"><div class="kpi"><span>Umsatzsteuer</span><b>' + U.eur(u.ust) + '</b></div><div class="kpi"><span>Vorsteuer</span><b>' + U.eur(u.vorsteuer) + '</b></div><div class="kpi"><span>' + (u.zahllast >= 0 ? "An das Finanzamt" : "Erstattung") + "</span><b>" + U.eur(Math.abs(u.zahllast)) + "</b></div></div>" + ust + euer;
  };
  K.aktion.ustZeitraum = function (el) { sessionStorage.setItem("ust-zr", el.value); K.neuLaden(); };
  K.aktion.versteuerung = async function () {
    var b = K.ctx.betrieb, r = await U.dialog("Art der Versteuerung", U.feld("v", "Ihr Betrieb versteuert nach", b.versteuerung || "ist", { optionen: [["ist", "vereinnahmten Entgelten (Ist) – Steuer, wenn das Geld da ist"], ["soll", "vereinbarten Entgelten (Soll) – Steuer mit dem Rechnungsdatum"]] }) +
      '<p class="still">Das steht in Ihrem Bescheid vom Finanzamt. Kleine Betriebe haben meist die Ist-Versteuerung beantragt. Im Zweifel den Steuerberater fragen.</p>'); if (!r) return;
    await DB.aendern("betriebe", b.id, { versteuerung: r.daten.v }); b.versteuerung = r.daten.v; K.neuLaden();
  };
  K.aktion.ustDruck = async function () {
    var zr = sessionStorage.getItem("ust-zr"), b = K.ctx.betrieb; if (!zr) { var t = new Date(); zr = U.isoTag(new Date(t.getFullYear(), t.getMonth() - 1, 1)).slice(0, 7); }
    var Z = K.zeitraum(zr), u = K.ustVa(await steuerDaten(), Z, b.versteuerung || "ist"), kz = u.kz;
    var z = function (nr, t, w, s) { return "<tr><td>" + nr + "</td><td>" + t + '</td><td class="r">' + (w == null ? "" : U.zahlText(u.basis(w)) + " €") + '</td><td class="r">' + (s == null ? "" : U.eur(s)) + "</td></tr>"; };
    var html = '<table class="d-pos"><thead><tr><th>Kz.</th><th>Bezeichnung</th><th class="r">Bemessungsgrundlage</th><th class="r">Steuer</th></tr></thead><tbody>' + z("81", "Umsätze zu 19 %", kz[81], u.basis(kz[81]) * 0.19) + z("86", "Umsätze zu 7 %", kz[86], u.basis(kz[86]) * 0.07) +
      (kz[87] ? z("87", "Umsätze zu 0 %", kz[87]) : "") + (kz[35] ? z("35/36", "Andere Steuersätze", kz[35], kz[36]) : "") + (kz[84] ? z("84/85", "Leistungen nach § 13b (Sie schulden die Steuer)", kz[84], kz[85]) : "") + (kz[60] ? z("60", "Umsätze, für die der Kunde die Steuer schuldet", kz[60]) : "") +
      z("66", "Vorsteuer", null, kz[66]) + (kz[67] ? z("67", "Vorsteuer § 13b", null, kz[67]) : "") + '<tr class="d-titel"><td>83</td><td>' + (u.zahllast >= 0 ? "Vorauszahlung" : "Überschuss") + '</td><td></td><td class="r">' + U.eur(u.zahllast) + "</td></tr></tbody></table>" +
      '<p class="d-hinweise">Vorschau aus Kundario (' + ((b.versteuerung || "ist") === "ist" ? "Ist-Versteuerung" : "Soll-Versteuerung") + "), erstellt am " + U.datum(new Date()) + ". Keine Steuerberatung. Bitte vor der Abgabe prüfen.</p>";
    U.drucken(U.dokument({ betrieb: b, kunde: {}, titelArt: "Umsatzsteuer-Voranmeldung (Vorschau)", nr: "", meta: [["Zeitraum", Z.name]], zusatz: html }), "UStVA-" + zr);
  };
})();
