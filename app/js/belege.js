/* Kundario – Eingangsrechnungen und Belege, E-Rechnungen von Lieferanten einlesen (XRechnung, ZUGFeRD/Factur-X) */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;
  var rund = function (x) { return Math.round((+x || 0) * 100) / 100; };
  K.BELEG_KAT = ["Material", "Fremdleistung", "Fahrzeug", "Werkzeug und Geräte", "Miete", "Büro und Telefon", "Versicherung", "Sonstiges"];

  /* ---------- E-Rechnung lesen ---------- */
  var erstes = function (wurzel, pfad) {   // pfad: "A/B/C" nach localName, ohne Namensräume
    var teile = pfad.split("/"), el = wurzel;
    for (var i = 0; i < teile.length && el; i++) { var n = teile[i]; el = Array.prototype.filter.call(el.children, function (c) { return c.localName === n; })[0] || (i === 0 ? el.getElementsByTagNameNS("*", n)[0] : null); }
    return el ? el.textContent.trim() : "";
  };
  var alle = function (wurzel, name) { return Array.prototype.slice.call(wurzel.getElementsByTagNameNS("*", name)); };
  var tag = function (s) { s = String(s || "").trim(); if (/^\d{8}$/.test(s)) return s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8); var m = s.match(/\d{4}-\d{2}-\d{2}/); return m ? m[0] : null; };
  K.eRechnungLesen = function (xml) {
    var doc = new DOMParser().parseFromString(xml, "application/xml"); if (doc.getElementsByTagName("parsererror").length) throw new Error("Die XML-Datei ist beschädigt.");
    var w = doc.documentElement, n = w.localName, z = function (s) { return parseFloat(String(s || "").replace(",", ".")) || 0; };
    if (n === "Invoice" || n === "CreditNote") {   // UBL (XRechnung)
      var sup = alle(w, "AccountingSupplierParty")[0] || w, tot = alle(w, "LegalMonetaryTotal")[0] || w, faktor = n === "CreditNote" ? -1 : 1;
      var netto = z(erstes(tot, "TaxExclusiveAmount")), brutto = z(erstes(tot, "TaxInclusiveAmount")) || z(erstes(tot, "PayableAmount"));
      var ust = alle(w, "TaxTotal").length ? z(erstes(alle(w, "TaxTotal")[0], "TaxAmount")) : rund(brutto - netto);
      return { format: "XRechnung (UBL)", lieferant: erstes(sup, "RegistrationName") || erstes(sup, "Name"), ust_id: erstes(sup, "CompanyID"), nr: erstes(w, "ID"), datum: tag(erstes(w, "IssueDate")), faellig: tag(erstes(w, "DueDate")) || tag(erstes(alle(w, "PaymentTerms")[0] || w, "PaymentDueDate")),
        netto: faktor * netto, ust: faktor * ust, brutto: faktor * brutto, zahlbar: faktor * (z(erstes(tot, "PayableAmount")) || brutto), iban: (alle(w, "PayeeFinancialAccount")[0] ? erstes(alle(w, "PayeeFinancialAccount")[0], "ID") : ""), leitweg: erstes(w, "BuyerReference"),
        positionen: alle(w, n === "CreditNote" ? "CreditNoteLine" : "InvoiceLine").slice(0, 60).map(function (l) { return { text: erstes(l, "Name") || erstes(l, "Description"), menge: z(erstes(l, n === "CreditNote" ? "CreditedQuantity" : "InvoicedQuantity")), netto: z(erstes(l, "LineExtensionAmount")) }; }) };
    }
    if (n === "CrossIndustryInvoice") {   // CII (ZUGFeRD, Factur-X, XRechnung CII)
      var hs = alle(w, "ApplicableHeaderTradeSettlement")[0] || w, sum = alle(hs, "SpecifiedTradeSettlementHeaderMonetarySummation")[0] || hs, sel = alle(w, "SellerTradeParty")[0] || w;
      var typ = erstes(alle(w, "ExchangedDocument")[0] || w, "TypeCode"), f2 = typ === "381" ? -1 : 1, bas = z(erstes(sum, "TaxBasisTotalAmount")), gr = z(erstes(sum, "GrandTotalAmount"));
      return { format: "ZUGFeRD / Factur-X (CII)", lieferant: erstes(sel, "Name"), ust_id: erstes(alle(sel, "SpecifiedTaxRegistration")[0] || sel, "ID"), nr: erstes(alle(w, "ExchangedDocument")[0] || w, "ID"),
        datum: tag(erstes(alle(w, "ExchangedDocument")[0] || w, "DateTimeString")), faellig: tag(erstes(alle(hs, "SpecifiedTradePaymentTerms")[0] || hs, "DateTimeString")),
        netto: f2 * bas, ust: f2 * (z(erstes(sum, "TaxTotalAmount")) || rund(gr - bas)), brutto: f2 * gr, zahlbar: f2 * (z(erstes(sum, "DuePayableAmount")) || gr), iban: erstes(alle(hs, "PayeePartyCreditorFinancialAccount")[0] || hs, "IBANID"), leitweg: erstes(w, "BuyerReference"),
        positionen: alle(w, "IncludedSupplyChainTradeLineItem").slice(0, 60).map(function (l) { return { text: erstes(l, "Name"), menge: z(erstes(l, "BilledQuantity")), netto: z(erstes(l, "LineTotalAmount")) }; }) };
    }
    throw new Error("Unbekanntes Format. Erwartet wird eine XRechnung oder ZUGFeRD-/Factur-X-Rechnung.");
  };
  // Eingebettete XML aus einem ZUGFeRD-PDF holen (Datei-Anhänge im PDF, meist komprimiert)
  K.pdfXml = async function (buf) {
    var b = new Uint8Array(buf), s = ""; for (var i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    var re = /\/Type\s*\/EmbeddedFile[\s\S]{0,600}?>>\s*stream\r?\n/g, m, kandidaten = [];
    while ((m = re.exec(s))) { var start = m.index + m[0].length, ende = s.indexOf("endstream", start); if (ende < 0) continue; var dict = s.slice(Math.max(0, s.lastIndexOf("<<", m.index)), m.index + m[0].length); kandidaten.push({ d: dict, a: start, e: ende }); }
    // Manche PDFs schreiben /Type nach /Length – dann alle Streams mit XML-Inhalt prüfen
    if (!kandidaten.length) { var re2 = /stream\r?\n/g; while ((m = re2.exec(s)) && kandidaten.length < 400) { var st = m.index + m[0].length, en = s.indexOf("endstream", st); if (en > st) kandidaten.push({ d: s.slice(Math.max(0, m.index - 400), m.index), a: st, e: en }); } }
    for (var k = 0; k < kandidaten.length; k++) {
      var c = kandidaten[k], len = (c.d.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/) || [])[1], ende = len ? Math.min(c.e, c.a + +len) : c.e;
      while (!len && ende > c.a && (b[ende - 1] === 10 || b[ende - 1] === 13)) ende--;   // Zeilenende vor „endstream“ gehört nicht zu den Daten
      var roh = b.subarray(c.a, ende), text = null;
      try {
        if (/FlateDecode/.test(c.d)) { var ds = new DecompressionStream("deflate"), out = new Response(new Blob([roh]).stream().pipeThrough(ds)); text = new TextDecoder("utf-8").decode(await out.arrayBuffer()); }
        else text = new TextDecoder("utf-8").decode(roh);
      } catch (e) { continue; }
      if (text && /CrossIndustryInvoice|<(\w+:)?Invoice[\s>]/.test(text)) return text.slice(text.indexOf("<"));
    }
    return null;
  };

  /* ---------- Ansicht ---------- */
  V.belege = async function () {
    if (!K.darf("rechnungen")) return K.kopf("Beleg einreichen", "Tankquittung, Baumarkt-Bon oder Lieferschein fotografieren – das Büro kümmert sich um den Rest.") +
      '<section class="karte"><button class="btn btn-signal gross" data-a="belegNeu">Beleg fotografieren</button></section>';
    var f = sessionStorage.getItem("beleg-filter") || "offen", l = await K.liste("belege", { sortiere: "datum.desc", limit: 500 }), heute = U.isoTag();
    var offen = l.filter(function (b) { return b.status === "offen"; }), zeige = f === "alle" ? l : l.filter(function (b) { return b.status === f; });
    var q0 = new Date(); q0 = U.isoTag(new Date(q0.getFullYear(), Math.floor(q0.getMonth() / 3) * 3, 1));
    var vst = l.filter(function (b) { return b.datum >= q0; }).reduce(function (s, b) { return s + +b.ust; }, 0), au = {}; (await K.liste("auftraege", { select: "id,nr" })).forEach(function (a) { au[a.id] = a; });
    return K.kopf("Eingangsrechnungen", "Rechnungen und Belege von Lieferanten: erfassen, bezahlen, dem Auftrag zuordnen. Die Vorsteuer fließt in die Finanzübersicht.",
        '<button class="btn btn-outline" data-a="eRechnungEin">E-Rechnung einlesen</button><button class="btn btn-signal" data-a="belegNeu">Beleg erfassen</button>') +
      '<div class="kpis"><div class="kpi farbig k-orange"><span>Offen</span><b>' + U.eur(offen.reduce(function (s, b) { return s + +b.brutto; }, 0)) + "</b><small>" + offen.length + ' Belege</small></div><div class="kpi farbig k-rot"><span>Überfällig</span><b>' + U.eur(offen.filter(function (b) { return b.faellig && b.faellig < heute; }).reduce(function (s, b) { return s + +b.brutto; }, 0)) + "</b><small>sofort zahlen</small></div>" +
        '<div class="kpi farbig k-blau"><span>Vorsteuer dieses Quartal</span><b>' + U.eur(vst) + "</b><small>seit " + U.datum(q0) + '</small></div><div class="kpi farbig k-lila"><span>Ohne Prüfung</span><b>' + l.filter(function (b) { return b.quelle === "eingereicht"; }).length + "</b><small>vom Team eingereicht</small></div></div>" +
      '<div class="tabs">' + [["offen", "Offen"], ["bezahlt", "Bezahlt"], ["alle", "Alle"]].map(function (t) { return '<button class="tab' + (f === t[0] ? " aktiv" : "") + '" data-a="belegFilter" data-f="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      (zeige.length ? '<div class="tabelle"><table><thead><tr><th>Lieferant</th><th>Datum</th><th>Fällig</th><th>Kategorie</th><th class="r">Netto</th><th class="r">Brutto</th><th></th></tr></thead><tbody>' + zeige.map(function (b) {
        var ue = b.status === "offen" && b.faellig && b.faellig < heute;
        return '<tr><td><b>' + h(b.lieferant) + "</b>" + (b.nr ? " <small>" + h(b.nr) + "</small>" : "") + (b.auftrag_id && au[b.auftrag_id] ? '<br><small>Auftrag <a href="#/auftraege/' + b.auftrag_id + '">' + h(au[b.auftrag_id].nr) + "</a></small>" : "") + (b.quelle && b.quelle !== "manuell" ? ' <span class="pill">' + h({ xrechnung: "E-Rechnung", zugferd: "ZUGFeRD", eingereicht: "vom Team" }[b.quelle] || b.quelle) + "</span>" : "") +
          "</td><td>" + U.datum(b.datum) + "</td><td>" + (b.status === "bezahlt" ? '<span class="pill ok">bezahlt ' + U.datum(b.bezahlt_am) + "</span>" : b.faellig ? (ue ? '<span class="pill rot">' + U.datum(b.faellig) + "</span>" : U.datum(b.faellig)) : "–") + "</td><td>" + h(b.kategorie || "–") + '</td><td class="r">' + U.eur(b.netto) + '</td><td class="r"><b>' + U.eur(b.brutto) + "</b></td>" +
          '<td class="r">' + (b.datei ? '<button class="mini" data-a="belegDatei" data-id="' + b.id + '" title="Beleg ansehen">📄</button> ' : "") + (b.status === "offen" ? '<button class="btn btn-outline klein" data-a="belegBezahlt" data-id="' + b.id + '">Bezahlt</button> ' : "") + '<button class="mini" data-a="belegBearb" data-id="' + b.id + '" aria-label="bearbeiten">✎</button></td></tr>';
      }).join("") + "</tbody></table></div>" : K.leer(f === "offen" ? "Keine offenen Belege." : "Noch keine Belege erfasst."));
  };
  K.aktion.belegFilter = function (el) { sessionStorage.setItem("beleg-filter", el.dataset.f); K.neuLaden(); };

  async function dateiHoch(datei, art) {
    var pfad = K.bid() + "/belege/" + U.isoTag() + "-" + Date.now() + "." + (/pdf/i.test(datei.type) ? "pdf" : /xml/i.test(datei.type) || /\.xml$/i.test(datei.name) ? "xml" : "jpg");
    var inhalt = datei; if (/^image\//.test(datei.type) && K.bildVerkleinern) inhalt = await K.bildVerkleinern(datei);
    await DB.datei.hoch(pfad, inhalt); return pfad;
  }
  async function belegDialog(b, vorschlag) {
    var fin = K.darf("rechnungen"); b = b || Object.assign({ datum: U.isoTag(), kategorie: "Material" }, vorschlag || {});
    var lief = fin ? (await K.liste("belege", { select: "lieferant", limit: 400 })).map(function (x) { return x.lieferant; }).filter(function (x, i, a) { return a.indexOf(x) === i; }) : [];
    var au = await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit", "abgeschlossen"] }, sortiere: "nr.desc", limit: 100 });
    var satz = b.netto && b.brutto ? Math.round((+b.brutto / +b.netto - 1) * 100) : 19;
    var r = await U.dialog(b.id ? "Beleg bearbeiten" : fin ? "Beleg erfassen" : "Beleg einreichen", (b.id || vorschlag ? "" : '<p><input type="file" name="datei" accept="image/*,application/pdf" capture="environment"> <small class="still">Foto oder PDF</small></p>') +
      '<div class="raster">' + U.feld("lieferant", "Lieferant", b.lieferant || "", { pflicht: true, attr: ' list="lief-liste" autocomplete="off"' }) + U.feld("nr", "Rechnungsnummer", b.nr || "") + U.feld("datum", "Datum", b.datum, { typ: "date", pflicht: true }) + (fin ? U.feld("faellig", "Zahlbar bis", b.faellig || "", { typ: "date" }) : "") +
      U.feld("brutto", "Betrag brutto €", b.brutto ? U.zahlText(b.brutto, 2) : "", { typ: "number", pflicht: true }) + U.feld("satz", "Umsatzsteuer", [19, 7, 0].indexOf(satz) > -1 ? String(satz) : "x", { optionen: [["19", "19 %"], ["7", "7 %"], ["0", "keine"], ["x", "gemischt – selbst eintragen"]] }) +
      U.feld("ust", "davon USt. € (nur bei gemischt)", b.ust ? U.zahlText(b.ust, 2) : "", { typ: "number" }) + U.feld("kategorie", "Kategorie", b.kategorie || "Material", { optionen: K.BELEG_KAT.map(function (k) { return [k, k]; }) }) +
      U.feld("auftrag_id", "Auftrag (optional)", b.auftrag_id || "", { optionen: [["", "–"]].concat(au.map(function (a) { return [a.id, a.nr + " · " + a.titel]; })), hilfe: "Zählt dann in der Rentabilität des Auftrags." }) + U.feld("notiz", "Notiz", b.notiz || "", { breit: true }) + "</div>" +
      (lief.length ? '<datalist id="lief-liste">' + lief.map(function (x) { return '<option value="' + h(x) + '">'; }).join("") + "</datalist>" : ""),
      [{ wert: "", text: "Abbrechen" }].concat(b.id && fin ? [{ wert: "weg", text: "Löschen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return null;
    if (r.wert === "weg") { await DB.loeschen("belege", b.id); K.neuLaden(); return null; }
    var d = r.daten, brutto = U.zahl(d.brutto); if (!(Math.abs(brutto) > 0)) throw new Error("Bitte den Betrag eingeben.");
    var ust = d.satz === "x" ? U.zahl(d.ust) : rund(brutto - brutto / (1 + +d.satz / 100));
    var o = { lieferant: d.lieferant.trim(), nr: d.nr || null, datum: d.datum, faellig: fin ? d.faellig || null : null, brutto: rund(brutto), ust: rund(ust), netto: rund(brutto - ust), kategorie: d.kategorie, auftrag_id: d.auftrag_id || null, notiz: d.notiz || null };
    var datei = r.dlg.querySelector("input[type=file]"); if (datei && datei.files[0]) o.datei = await dateiHoch(datei.files[0]);
    if (vorschlag) Object.keys(vorschlag).forEach(function (k) { if (o[k] === undefined) o[k] = vorschlag[k]; });
    if (b.id) await DB.aendern("belege", b.id, o);
    else if (fin) await K.neu("belege", Object.assign({ quelle: (vorschlag && vorschlag.quelle) || "manuell" }, o));
    else await DB.melden("belege", Object.assign({ betrieb_id: K.bid(), quelle: "eingereicht" }, o));   // Team: einreichen ohne Lesezugriff
    return o;
  }
  K.aktion.belegNeu = async function () { var o = await belegDialog(); if (o) { U.toast(K.darf("rechnungen") ? "Beleg gespeichert." : "Danke! Das Büro hat den Beleg."); K.neuLaden(); } };
  K.aktion.belegBearb = async function (el) { var o = await belegDialog(await DB.eins("belege", el.dataset.id)); if (o) K.neuLaden(); };
  K.aktion.belegBezahlt = async function (el) {
    var r = await U.dialog("Als bezahlt markieren", U.feld("am", "Bezahlt am", U.isoTag(), { typ: "date", pflicht: true })); if (!r) return;
    await DB.aendern("belege", el.dataset.id, { status: "bezahlt", bezahlt_am: r.daten.am }); K.neuLaden();
  };
  K.aktion.belegDatei = async function (el) { var b = await DB.eins("belege", el.dataset.id); var u = await DB.datei.link(b.datei); window.open(u, "_blank", "noopener"); };
  K.aktion.eRechnungEin = async function () {
    var r = await U.dialog("E-Rechnung einlesen", "<p>Wählen Sie die Rechnung Ihres Lieferanten: <b>XRechnung</b> (.xml) oder <b>ZUGFeRD / Factur-X</b> (PDF mit eingebetteten Daten). Kundario liest Lieferant, Nummer, Beträge, Fälligkeit und IBAN aus.</p>" +
      '<input type="file" name="datei" accept=".xml,.pdf,application/pdf,text/xml,application/xml" required>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Einlesen", primaer: true }]);
    if (!r) return; var f = r.dlg.querySelector("input[type=file]").files[0]; if (!f) return;
    var buf = await f.arrayBuffer(), pdf = /pdf$/i.test(f.name) || f.type === "application/pdf", xml = pdf ? await K.pdfXml(buf) : K.textAusBytes(buf);
    if (!xml) throw new Error("In diesem PDF sind keine Rechnungsdaten eingebettet. Es ist dann keine E-Rechnung – bitte als normalen Beleg erfassen.");
    var e = K.eRechnungLesen(xml), dop = e.nr ? (await K.liste("belege", { wo: { nr: e.nr } })).filter(function (b) { return b.lieferant === e.lieferant; }) : [];
    if (dop.length && !(await U.bestaetigen("Rechnung " + e.nr + " von " + e.lieferant + " ist schon erfasst. Trotzdem noch einmal anlegen?", "Trotzdem"))) return;
    var pfad = await dateiHoch(f).catch(function () { return null; });
    var o = await belegDialog(null, { lieferant: e.lieferant, nr: e.nr, datum: e.datum || U.isoTag(), faellig: e.faellig, brutto: e.brutto, netto: e.netto, ust: e.ust, quelle: pdf ? "zugferd" : "xrechnung", datei: pfad, daten: { format: e.format, iban: e.iban, ust_id: e.ust_id, zahlbar: e.zahlbar, positionen: e.positionen } });
    if (o) { U.toast(e.format + " eingelesen" + (e.iban ? ", IBAN " + e.iban : "") + "."); K.neuLaden(); }
  };
  K.belegeZuordnen = function (abbuchungen, offene) {
    var vergeben = {};
    return abbuchungen.map(function (u) {
      var t = (u.zweck + " " + u.name).toUpperCase(), betrag = -u.betrag, b = null, grund = "";
      offene.forEach(function (x) { if (!b && !vergeben[x.id] && x.nr && x.nr.length >= 3 && t.indexOf(String(x.nr).toUpperCase()) > -1) { b = x; grund = "Rechnungsnummer im Verwendungszweck"; } });
      if (!b) { var gl = offene.filter(function (x) { return !vergeben[x.id] && Math.abs(+x.brutto - betrag) < 0.005; });
        var mn = gl.filter(function (x) { return String(x.lieferant).split(/[\s,.&-]+/).some(function (w) { return w.length >= 4 && t.indexOf(w.toUpperCase()) > -1; }); });
        if (mn.length === 1) { b = mn[0]; grund = "Betrag und Lieferant passen"; } else if (gl.length === 1) { b = gl[0]; grund = "nur der Betrag passt – bitte prüfen"; } }
      if (b) vergeben[b.id] = true; return { u: u, b: b, grund: grund };
    }).filter(function (v) { return v.b; });
  };
  K.belegeOffen = async function () { try { return await K.liste("belege", { wo: { status: "offen" } }); } catch (e) { return []; } };
})();
