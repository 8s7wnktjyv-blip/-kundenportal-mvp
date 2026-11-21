/* Kundario – Einkauf und Lager, Finanzübersicht, Kontoauszug einlesen, Export für den Steuerberater,
   Termine als Kalenderdatei, KI-Assistent (vorbereitet, nur mit eingerichtetem Anbieter aktiv) */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;
  var rund = function (x) { return Math.round((+x || 0) * 100) / 100; };
  var laden = function (name, inhalt, typ) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([inhalt], { type: typ || "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  var csvZeile = function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";"); };
  var euroCsv = function (x) { return rund(x).toFixed(2).replace(".", ","); };

  /* ======================= Lager ======================= */
  V.lager = async function () {
    var l = await K.liste("lager", { sortiere: "text.asc" }), orte = [];
    l.forEach(function (x) { if (orte.indexOf(x.ort) < 0) orte.push(x.ort); });
    var knapp = l.filter(function (x) { return x.mindest != null && +x.bestand <= +x.mindest; });
    return K.kopf("Lager", "Was liegt im Lager und in den Fahrzeugen? Unter dem Mindestbestand schlägt Kundario Nachbestellen vor.", '<button class="btn btn-signal" data-a="lagerNeu">Neuer Artikel</button>') +
      (knapp.length ? '<section class="karte warnung"><h2>Nachbestellen (' + knapp.length + ')</h2><ul class="liste">' + knapp.map(function (x) { return "<li><b>" + h(x.text) + "</b> " + U.zahlText(x.bestand) + " " + h(x.einheit) + " (Mindestens " + U.zahlText(x.mindest) + ") · " + h(x.ort) + ' <button class="btn btn-outline klein" data-a="lagerNachbestellen" data-id="' + x.id + '">Nachbestellen</button></li>'; }).join("") + "</ul></section>" : "") +
      (l.length ? orte.map(function (o) {
        return '<section class="karte"><h2>' + h(o) + '</h2><div class="tabelle"><table><thead><tr><th>Artikel</th><th class="r">Bestand</th><th class="r">Mindestens</th><th></th></tr></thead><tbody>' + l.filter(function (x) { return x.ort === o; }).map(function (x) {
          var w = x.mindest != null && +x.bestand <= +x.mindest;
          return "<tr><td><b>" + h(x.text) + "</b>" + (x.lieferant ? "<br><small>" + h(x.lieferant) + "</small>" : "") + '</td><td class="r">' + (w ? '<span class="pill rot">' : "<b>") + U.zahlText(x.bestand) + " " + h(x.einheit) + (w ? "</span>" : "</b>") + '</td><td class="r">' + (x.mindest != null ? U.zahlText(x.mindest) : "–") +
            '</td><td class="r"><button class="btn btn-outline klein" data-a="lagerBuchen" data-id="' + x.id + '" data-r="ab">Entnahme</button> <button class="btn btn-outline klein" data-a="lagerBuchen" data-id="' + x.id + '" data-r="zu">Zugang</button> <button class="mini" data-a="lagerBearb" data-id="' + x.id + '" aria-label="bearbeiten">✎</button></td></tr>';
        }).join("") + "</tbody></table></div></section>";
      }).join("") : K.leer("Noch nichts im Lager. Legen Sie die Artikel an, die Sie vorrätig haben – auch je Fahrzeug."));
  };
  async function lagerDialog(x) {
    x = x || { einheit: "Stk.", ort: "Lager", bestand: 0 };
    var r = await U.dialog(x.id ? "Lagerartikel" : "Neuer Lagerartikel", '<div class="raster">' + U.feld("text", "Artikel", x.text, { pflicht: true, breit: true }) + U.feld("einheit", "Einheit", x.einheit) + U.feld("bestand", "Bestand", U.zahlText(x.bestand), { typ: "number" }) +
      U.feld("mindest", "Mindestbestand (optional)", x.mindest != null ? U.zahlText(x.mindest) : "", { typ: "number" }) + U.feld("ort", "Ort", x.ort, { hilfe: "z. B. Lager, Transporter 1" }) + U.feld("lieferant", "Lieferant", x.lieferant) + U.feld("preis", "Einkaufspreis € (optional)", x.preis != null ? U.zahlText(x.preis, 2) : "", { typ: "number" }) + "</div>",
      [{ wert: "", text: "Abbrechen" }].concat(x.id && K.darf("rechnungen") ? [{ wert: "weg", text: "Löschen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return; if (r.wert === "weg") { await DB.loeschen("lager", x.id); return K.neuLaden(); }
    var d = r.daten, o = { text: d.text.trim(), einheit: d.einheit || "Stk.", bestand: U.zahl(d.bestand) || 0, mindest: d.mindest !== "" ? U.zahl(d.mindest) : null, ort: (d.ort || "Lager").trim(), lieferant: d.lieferant || null, preis: d.preis ? U.zahl(d.preis) : null };
    if (x.id) await DB.aendern("lager", x.id, o); else await K.neu("lager", o); K.neuLaden();
  }
  K.aktion.lagerNeu = function () { return lagerDialog(); };
  K.aktion.lagerBearb = async function (el) { return lagerDialog(await DB.eins("lager", el.dataset.id)); };
  K.aktion.lagerBuchen = async function (el) {
    var x = await DB.eins("lager", el.dataset.id), ab = el.dataset.r === "ab";
    var au = ab ? await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit"] }, sortiere: "nr.desc" }) : [];
    var r = await U.dialog((ab ? "Entnahme: " : "Zugang: ") + x.text, U.feld("menge", "Menge (" + x.einheit + ")", "1", { typ: "number", pflicht: true }) +
      (ab && au.length ? U.feld("auftrag_id", "Für Auftrag (optional)", "", { optionen: [["", "–"]].concat(au.map(function (a) { return [a.id, a.nr + " · " + a.titel]; })), hilfe: "Wird dann als Material am Auftrag erfasst und fließt in die Rentabilität." }) : ""));
    if (!r) return; var m = U.zahl(r.daten.menge); if (!(m > 0)) throw new Error("Bitte eine Menge eingeben.");
    var neu = rund(+x.bestand + (ab ? -m : m)); if (neu < 0) throw new Error("So viel ist nicht da (Bestand " + U.zahlText(x.bestand) + ").");
    await DB.aendern("lager", x.id, { bestand: neu });
    if (ab && r.daten.auftrag_id) { await K.neu("material", { artikel: x.text, menge: m, einheit: x.einheit, auftrag_id: r.daten.auftrag_id, preis: x.preis, lieferant: x.lieferant, status: "geliefert", lager_id: x.id }); await K.verlauf("auftrag", r.daten.auftrag_id, "Aus dem Lager: " + U.zahlText(m) + " " + x.einheit + " " + x.text); }
    U.toast("Bestand jetzt " + U.zahlText(neu) + " " + x.einheit + "."); K.neuLaden();
  };
  K.aktion.lagerNachbestellen = async function (el) {
    var x = await DB.eins("lager", el.dataset.id), vorschlag = Math.max(1, rund((+x.mindest || 0) * 2 - +x.bestand));
    var r = await U.dialog("Nachbestellen: " + x.text, U.feld("menge", "Menge (" + x.einheit + ")", U.zahlText(vorschlag), { typ: "number", pflicht: true }) + U.feld("lieferant", "Lieferant", x.lieferant || ""));
    if (!r) return;
    await K.neu("material", { artikel: x.text, menge: U.zahl(r.daten.menge) || vorschlag, einheit: x.einheit, lieferant: r.daten.lieferant || null, preis: x.preis, status: "freigabe", lager_id: x.id });
    U.toast("Zur Bestellung vorgemerkt (Material → Zur Freigabe)."); K.neuLaden();
  };
  K.lagerKnapp = async function () { try { return (await K.liste("lager")).filter(function (x) { return x.mindest != null && +x.bestand <= +x.mindest; }); } catch (e) { return []; } };

  /* Bestellung je Lieferant, mit Datei; Wareneingang bucht Lagerware ein */
  K.aktion.bestellMail = async function () {
    var l = await K.liste("material", { wo: { status: "freigabe" } }), au = {}; (await K.liste("auftraege", { select: "id,nr" })).forEach(function (a) { au[a.id] = a; });
    if (!l.length) throw new Error("Nichts zur Freigabe.");
    var lief = []; l.forEach(function (m) { var n = m.lieferant || "ohne Lieferant"; if (lief.indexOf(n) < 0) lief.push(n); });
    var r = await U.dialog("Bestellung", U.feld("lief", "Lieferant", lief[0], { optionen: lief.map(function (n) { return [n, n + " (" + l.filter(function (m) { return (m.lieferant || "ohne Lieferant") === n; }).length + " Positionen)"]; }) }) + U.feld("an", "E-Mail des Lieferanten", "", { typ: "email", hilfe: "Leer lassen, wenn Sie über den Webshop bestellen – dann nur die Datei speichern." }) +
      U.feld("datei", "Bestellliste als Datei (CSV) speichern", true, { typ: "checkbox" }) + U.feld("markieren", "Danach als bestellt markieren", true, { typ: "checkbox" }), [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Bestellen", primaer: true }]);
    if (!r) return;
    var pos = l.filter(function (m) { return (m.lieferant || "ohne Lieferant") === r.daten.lief; });
    var zeilen = pos.map(function (m) { return "- " + U.zahlText(m.menge) + " " + m.einheit + " " + m.artikel + (m.auftrag_id && au[m.auftrag_id] ? " (Kommission " + au[m.auftrag_id].nr + ")" : ""); });
    if (r.daten.datei) laden("bestellung-" + U.isoTag() + ".csv", "\ufeff" + [csvZeile(["Menge", "Einheit", "Artikel", "Kommission"])].concat(pos.map(function (m) { return csvZeile([String(m.menge).replace(".", ","), m.einheit, m.artikel, m.auftrag_id && au[m.auftrag_id] ? au[m.auftrag_id].nr : "Lager"]); })).join("\r\n"));
    if (r.daten.markieren) for (var i = 0; i < pos.length; i++) await DB.aendern("material", pos[i].id, { status: "bestellt", bestellt_at: new Date().toISOString() });
    if (r.daten.an) U.mail(r.daten.an, "Bestellung " + K.ctx.betrieb.name, "Guten Tag,\n\nbitte liefern Sie folgende Artikel:\n\n" + zeilen.join("\n") + "\n\nLieferadresse: " + [K.ctx.betrieb.strasse, [K.ctx.betrieb.plz, K.ctx.betrieb.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") + "\n\nViele Grüße\n" + K.ctx.betrieb.name);
    else K.neuLaden();
  };
  var altStatus = K.aktion.matStatus;
  K.aktion.matStatus = async function (el) {
    if (el.dataset.s !== "geliefert") return altStatus(el);
    var m = await DB.eins("material", el.dataset.id);
    if (m.auftrag_id && !m.lager_id) return altStatus(el);
    var l = await K.liste("lager"), x = m.lager_id ? l.filter(function (y) { return y.id === m.lager_id; })[0] : l.filter(function (y) { return y.text.toLowerCase() === String(m.artikel).toLowerCase(); })[0];
    var ok = await U.bestaetigen("Geliefert. " + U.zahlText(m.menge) + " " + m.einheit + " " + m.artikel + (x ? " im Lager „" + x.ort + "“ zubuchen?" : " als neuen Lagerartikel anlegen?"), "Ins Lager");
    await DB.aendern("material", m.id, { status: "geliefert" });
    if (ok) { if (x) await DB.aendern("lager", x.id, { bestand: rund(+x.bestand + +m.menge) }); else await K.neu("lager", { text: m.artikel, einheit: m.einheit, bestand: m.menge, lieferant: m.lieferant, preis: m.preis }); U.toast("Im Lager gebucht."); }
    K.neuLaden();
  };

  /* ======================= Finanzübersicht ======================= */
  var WDH = { einmalig: "einmalig", monatlich: "monatlich", quartal: "vierteljährlich", jahr: "jährlich" };
  function termine(a, bis) {   // Fälligkeiten einer Ausgabe von heute bis „bis“
    var out = [], d = new Date(a.datum + "T12:00"), heute = new Date(); heute.setHours(0, 0, 0, 0);
    var schritt = { monatlich: 1, quartal: 3, jahr: 12 }[a.wiederholung];
    if (!schritt) return d >= heute && d <= bis ? [d] : [];
    var n = 0; while (d < heute && n++ < 600) d.setMonth(d.getMonth() + schritt);
    while (d <= bis && n++ < 700) { out.push(new Date(d)); d.setMonth(d.getMonth() + schritt); }
    return out;
  }
  async function bezahltMap() { var m = {}; (await K.liste("zahlungen")).forEach(function (z) { m[z.rechnung_id] = rund((m[z.rechnung_id] || 0) + +z.betrag); }); return m; }
  V.finanzen = async function () {
    if (!K.darf("rechnungen")) return K.leer("Nur für Geschäftsführung und Büro.");
    var r = await Promise.all([K.liste("kontostaende", { sortiere: "datum.desc", limit: 20 }), K.liste("ausgaben", { sortiere: "datum.asc" }), K.liste("rechnungen", { wo: { status: ["gestellt", "teilbezahlt", "bezahlt"] } }), bezahltMap(), K.kundenMap(), K.liste("belege").catch(function () { return []; })]);
    var stand = r[0][0], aus = r[1], re = r[2], bez = r[3], km = r[4], bel = r[5];
    var heute = new Date(); heute.setHours(0, 0, 0, 0); var bis = new Date(heute.getTime() + 91 * 864e5);
    var offen = re.filter(function (x) { return x.status !== "bezahlt"; }).map(function (x) { return { r: x, rest: rund(+x.brutto - (bez[x.id] || 0)), am: x.faellig && new Date(x.faellig + "T12:00") > heute ? new Date(x.faellig + "T12:00") : heute }; }).filter(function (x) { return x.rest > 0; });
    var wochen = []; for (var i = 0; i < 13; i++) wochen.push({ von: new Date(heute.getTime() + i * 7 * 864e5), ein: 0, aus: 0 });
    var wo = function (d) { return Math.min(12, Math.max(0, Math.floor((d - heute) / (7 * 864e5)))); };
    offen.forEach(function (o) { wochen[wo(o.am)].ein += o.rest; });
    aus.forEach(function (a) { termine(a, bis).forEach(function (d) { wochen[wo(d)].aus += +a.betrag; }); });
    var belOffen = bel.filter(function (b) { return b.status === "offen"; });
    belOffen.forEach(function (b) { var d = new Date((b.faellig || U.plusTage(b.datum, 14)) + "T12:00"); wochen[wo(d < heute ? heute : d)].aus += +b.brutto; });
    var lauf = stand ? +stand.betrag : 0, tief = null; wochen.forEach(function (w) { lauf = rund(lauf + w.ein - w.aus); w.stand = lauf; if (tief == null || lauf < tief.stand) tief = w; });
    var max = Math.max.apply(null, wochen.map(function (w) { return Math.abs(w.stand); }).concat([1]));
    // Umsatzsteuer aus gestellten Rechnungen im laufenden Quartal
    var q0 = new Date(heute.getFullYear(), Math.floor(heute.getMonth() / 3) * 3, 1), ust = re.filter(function (x) { return x.steuerfall !== "13b" && x.steuerfall !== "kleinunternehmer" && new Date(x.datum + "T12:00") >= q0; }).reduce(function (s, x) { return s + (+x.brutto - +x.netto); }, 0);
    var vst = bel.filter(function (b) { return new Date(b.datum + "T12:00") >= q0; }).reduce(function (s, b) { return s + +b.ust; }, 0);
    var jahr0 = new Date(heute.getFullYear(), 0, 1), eingangNetto = 0;
    (await K.liste("zahlungen")).forEach(function (z) { if (new Date(z.datum + "T12:00") >= jahr0) { var x = re.filter(function (y) { return y.id === z.rechnung_id; })[0]; eingangNetto += x && +x.brutto ? +z.betrag * (+x.netto / +x.brutto) : +z.betrag; } });
    var proz = +K.ctx.betrieb.ruecklage_prozent || 0;
    return K.kopf("Finanzen", "Kontostand, was reinkommt, was rausgeht – und wie es in den nächsten 90 Tagen aussieht.", '<button class="btn btn-outline" data-a="kontoImport">Kontoauszug einlesen</button><button class="btn btn-outline" data-a="ausgabeNeu">Ausgabe</button><button class="btn btn-outline" data-a="monatsPdf">Monatsübersicht (PDF)</button><button class="btn btn-signal" data-a="kontostand">Kontostand eintragen</button>') +
      '<div class="kpis">' +
        '<div class="kpi farbig k-blau"><span>Kontostand</span><b>' + (stand ? U.eur(stand.betrag) : "–") + "</b><small>" + (stand ? "am " + U.datum(stand.datum) : "noch nicht eingetragen") + "</small></div>" +
        '<div class="kpi farbig k-gruen"><span>Erwartete Eingänge</span><b>' + U.eur(offen.reduce(function (s, o) { return s + o.rest; }, 0)) + "</b><small>" + offen.length + " offene Rechnungen</small></div>" +
        '<div class="kpi farbig k-orange"><span>Ausgaben 90 Tage</span><b>' + U.eur(wochen.reduce(function (s, w) { return s + w.aus; }, 0)) + "</b><small>Ausgaben und " + belOffen.length + " offene Eingangsrechnungen</small></div>" +
        '<div class="kpi farbig ' + (tief && tief.stand < 0 ? "k-rot" : "k-lila") + '"><span>Tiefster Stand</span><b>' + (tief ? U.eur(tief.stand) : "–") + "</b><small>" + (tief ? "Woche ab " + U.datum(tief.von) : "") + "</small></div></div>" +
      (!stand ? '<p class="hinweis">Tragen Sie zuerst Ihren Kontostand ein. Ohne Bankanbindung pflegen Sie ihn selbst, zum Beispiel einmal pro Woche.</p>' : "") +
      '<section class="karte"><h2>Vorschau 13 Wochen</h2><div class="fv-balken' + (tief && tief.stand < 0 ? " mit-minus" : "") + '">' + wochen.map(function (w) { var p = Math.max(2, Math.round(Math.abs(w.stand) / max * 100)), s = '<div class="fv-s' + (w.stand < 0 ? " neg" : "") + '" style="height:' + p + '%"></div>';
        return '<div class="fv-w" title="Woche ab ' + U.datum(w.von) + ": " + U.eur(w.stand) + '"><div class="fv-oben">' + (w.stand >= 0 ? s : "") + '</div><div class="fv-unten">' + (w.stand < 0 ? s : "") + "</div><small>" + w.von.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }) + "</small></div>"; }).join("") + "</div>" +
        '<p class="still">Annahme: Offene Rechnungen werden zum Fälligkeitstag bezahlt, überfällige diese Woche. Ausgaben nur, soweit Sie sie eingetragen haben.</p></section>' +
      '<div class="raster-2"><section class="karte"><h2>Umsatzsteuer und Rücklage</h2><ul class="liste"><li>Umsatzsteuer aus Ihren Rechnungen seit ' + U.datum(q0) + ": <b>" + U.eur(ust) + "</b></li><li>Vorsteuer aus Eingangsrechnungen: <b>" + U.eur(vst) + '</b> <a href="#/belege">Belege</a></li><li>Geschätzte Zahllast: <b>' + U.eur(ust - vst) + "</b><br><small>Nur so genau wie Ihre erfassten Belege. Die Voranmeldung macht Ihr Steuerberater oder Sie über ELSTER.</small></li>" +
        (proz ? "<li>Ihre Vorgabe " + U.zahlText(proz) + " % der Zahlungseingänge (netto) seit Jahresbeginn: <b>" + U.eur(eingangNetto * proz / 100) + "</b></li>" : "<li><small>Eigene Rücklage in Prozent: unter Einstellungen → Steuerberater festlegen.</small></li>") + "</ul></section>" +
      '<section class="karte"><h2>Ausgaben</h2>' + (aus.length ? '<ul class="liste">' + aus.map(function (a) { return "<li><b>" + h(a.text) + "</b> " + U.eur(a.betrag) + " · " + WDH[a.wiederholung] + (a.wiederholung === "einmalig" ? " am " : " ab ") + U.datum(a.datum) + (a.kategorie ? " · " + h(a.kategorie) : "") + ' <button class="mini" data-a="ausgabeWeg" data-id="' + a.id + '" aria-label="löschen">×</button></li>'; }).join("") + "</ul>" : '<p class="still">Noch keine. Tragen Sie feste Kosten ein: Miete, Leasing, Löhne, Versicherungen.</p>') + "</section></div>" +
      '<section class="karte"><h2>Erwartete Eingänge</h2>' + (offen.length ? '<ul class="liste">' + offen.sort(function (a, b) { return a.am - b.am; }).map(function (o) { return '<li><a href="#/rechnungen/' + o.r.id + '">' + h(o.r.nr) + "</a> " + h(km[o.r.kunde_id] ? km[o.r.kunde_id].name : "") + " · <b>" + U.eur(o.rest) + "</b> · " + (o.r.faellig && o.r.faellig < U.isoTag() ? '<span class="pill rot">überfällig seit ' + U.datum(o.r.faellig) + "</span>" : "fällig " + U.datum(o.r.faellig)) + "</li>"; }).join("") + "</ul>" : '<p class="still">Keine offenen Rechnungen.</p>') + "</section>" +
      '<section class="karte"><h2>Kontostände</h2>' + (r[0].length ? '<ul class="liste">' + r[0].map(function (k) { return "<li>" + U.datum(k.datum) + ": <b>" + U.eur(k.betrag) + "</b>" + (k.notiz ? " · " + h(k.notiz) : "") + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keiner eingetragen.</p>') + "</section>";
  };
  K.aktion.monatsPdf = async function () {
    var jetzt = new Date(), vm = new Date(jetzt.getFullYear(), jetzt.getMonth() - 1, 1), opt = [];
    for (var i = 0; i < 12; i++) { var m = new Date(jetzt.getFullYear(), jetzt.getMonth() - i, 1); opt.push([U.isoTag(m).slice(0, 7), m.toLocaleDateString("de-DE", { month: "long", year: "numeric" })]); }
    var r = await U.dialog("Monatsübersicht", U.feld("monat", "Monat", U.isoTag(vm).slice(0, 7), { optionen: opt }) + '<p class="still">Eine Übersicht für Sie, keine Buchhaltung und keine Steuerberatung.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Als PDF drucken", primaer: true }]); if (!r) return;
    var mo = r.daten.monat, inM = function (d) { return String(d || "").slice(0, 7) === mo; }, bis = new Date(+mo.slice(0, 4), +mo.slice(5, 7), 0), von = new Date(+mo.slice(0, 4), +mo.slice(5, 7) - 1, 1);
    var q = await Promise.all([K.liste("rechnungen"), K.liste("zahlungen"), K.liste("ausgaben"), K.liste("kontostaende", { sortiere: "datum.desc" }), K.kundenMap()]), re = q[0].filter(function (x) { return x.status !== "entwurf"; });
    var gestellt = re.filter(function (x) { return inM(x.datum); }), eing = q[1].filter(function (z) { return inM(z.datum); }), km = q[4];
    var ausM = []; q[2].forEach(function (a) { var d = new Date(a.datum + "T12:00"), s = { monatlich: 1, quartal: 3, jahr: 12 }[a.wiederholung], n = 0; if (!s) { if (inM(a.datum)) ausM.push(a); return; } while (d < von && n++ < 600) d.setMonth(d.getMonth() + s); if (d <= bis) ausM.push(a); });
    var bez = {}; q[1].forEach(function (z) { if (z.datum <= U.isoTag(bis)) bez[z.rechnung_id] = (bez[z.rechnung_id] || 0) + +z.betrag; });
    var offen = re.filter(function (x) { return x.datum <= U.isoTag(bis) && x.status !== "storniert"; }).reduce(function (s, x) { return s + Math.max(0, +x.brutto - (bez[x.id] || 0)); }, 0);
    var stand = q[3].filter(function (k) { return k.datum <= U.isoTag(bis); })[0];
    var sum = function (l, f) { return l.reduce(function (s, x) { return s + (+f(x) || 0); }, 0); };
    var zeile = function (a, b) { return "<tr><td>" + a + '</td><td class="r">' + b + "</td></tr>"; };
    var html = '<table class="d-pos"><tbody>' + zeile("Rechnungen gestellt (" + gestellt.length + ")", U.eur(sum(gestellt, function (x) { return x.netto; })) + " netto") + zeile("Davon Umsatzsteuer", U.eur(sum(gestellt, function (x) { return +x.brutto - +x.netto; }))) +
      zeile("Zahlungseingänge (" + eing.length + ")", U.eur(sum(eing, function (z) { return z.betrag; }))) + zeile("Eingetragene Ausgaben (" + ausM.length + ")", U.eur(sum(ausM, function (a) { return a.betrag; }))) +
      zeile("Offene Forderungen am Monatsende", U.eur(offen)) + zeile("Kontostand", stand ? U.eur(stand.betrag) + " (am " + U.datum(stand.datum) + ")" : "nicht eingetragen") + "</tbody></table>" +
      (gestellt.length ? '<h3>Gestellte Rechnungen</h3><table class="d-pos"><tbody>' + gestellt.map(function (x) { return "<tr><td>" + h(x.nr) + "</td><td>" + U.datum(x.datum) + "</td><td>" + h(km[x.kunde_id] ? km[x.kunde_id].name : "") + '</td><td class="r">' + U.eur(x.brutto) + "</td></tr>"; }).join("") + "</tbody></table>" : "") +
      (ausM.length ? '<h3>Ausgaben</h3><table class="d-pos"><tbody>' + ausM.map(function (a) { return "<tr><td>" + h(a.text) + "</td><td>" + h(a.kategorie || "") + '</td><td class="r">' + U.eur(a.betrag) + "</td></tr>"; }).join("") + "</tbody></table>" : "") +
      '<p class="d-hinweise">Erstellt mit Kundario am ' + U.datum(new Date()) + ". Eine Übersicht aus Ihren eingetragenen Daten, keine Buchhaltung.</p>";
    U.drucken(U.dokument({ betrieb: K.ctx.betrieb, kunde: {}, titelArt: "Monatsübersicht " + opt.filter(function (o) { return o[0] === mo; })[0][1], nr: "", meta: [["Zeitraum", U.datum(von) + " – " + U.datum(bis)]], zusatz: html }), "Monatsuebersicht-" + mo);
  };
  K.aktion.kontostand = async function () {
    var r = await U.dialog("Kontostand eintragen", '<div class="raster">' + U.feld("betrag", "Kontostand (€)", "", { typ: "number", pflicht: true }) + U.feld("datum", "Stand vom", U.isoTag(), { typ: "date", pflicht: true }) + U.feld("notiz", "Notiz", "") + "</div>"); if (!r) return;
    await K.neu("kontostaende", { betrag: U.zahl(r.daten.betrag), datum: r.daten.datum, notiz: r.daten.notiz || null }); K.neuLaden();
  };
  K.aktion.ausgabeNeu = async function () {
    var r = await U.dialog("Ausgabe eintragen", '<div class="raster">' + U.feld("text", "Wofür?", "", { pflicht: true, ph: "z. B. Miete Werkstatt" }) + U.feld("betrag", "Betrag (€)", "", { typ: "number", pflicht: true }) + U.feld("datum", "Fällig am", U.isoTag(), { typ: "date", pflicht: true }) +
      U.feld("wiederholung", "Wiederholung", "monatlich", { optionen: Object.keys(WDH).map(function (k) { return [k, WDH[k]]; }) }) + U.feld("kategorie", "Kategorie", "", { optionen: [["", "–"], ["Miete", "Miete"], ["Löhne", "Löhne"], ["Fahrzeuge", "Fahrzeuge"], ["Versicherung", "Versicherung"], ["Material", "Material"], ["Steuern", "Steuern"], ["Sonstiges", "Sonstiges"]] }) + "</div>"); if (!r) return;
    var b = U.zahl(r.daten.betrag); if (!(b > 0)) throw new Error("Bitte einen Betrag eingeben.");
    await K.neu("ausgaben", { text: r.daten.text.trim(), betrag: b, datum: r.daten.datum, wiederholung: r.daten.wiederholung, kategorie: r.daten.kategorie || null }); K.neuLaden();
  };
  K.aktion.ausgabeWeg = async function (el) { if (!(await U.bestaetigen("Ausgabe löschen?", "Löschen", true))) return; await DB.loeschen("ausgaben", el.dataset.id); K.neuLaden(); };

  /* ======================= Kontoauszug (CSV) einlesen und Zahlungen zuordnen ======================= */
  K.kontoLesen = function (text) {
    var roh = text.replace(/^\ufeff/, "").replace(/\r/g, "").split("\n"), kopfI = roh.findIndex(function (z) { var k = z.toLowerCase(); return /betrag|umsatz/.test(k) && /(verwendungszweck|buchungstext|vorgang)/.test(k); });
    if (kopfI < 0) throw new Error("In der Datei fehlen die Spalten „Betrag“ und „Verwendungszweck“. Bitte den Umsatzexport (CSV) aus dem Online-Banking nehmen.");
    var csv = K.csvLesen(roh.slice(kopfI).join("\n")), sp = csv.spalte;
    var iB = sp(["betrag", "betrag (eur)", "betrag (€)", "umsatz"]), iV = sp(["verwendungszweck", "buchungstext", "vorgang/verwendungszweck"]), iD = sp(["buchungstag", "buchungsdatum", "datum", "valuta", "wertstellung"]), iN = sp(["beguenstigter/zahlungspflichtiger", "auftraggeber / begünstigter", "zahlungspflichtige*r", "name zahlungsbeteiligter", "auftraggeber", "name", "empfänger", "zahler"]);
    var zahl = function (s) { s = String(s || "").replace(/\s|€|EUR/g, ""); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); return parseFloat(s) || 0; };
    var datum = function (s) { var m = String(s || "").match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/); if (m) return (m[3].length === 2 ? "20" + m[3] : m[3]) + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2); m = String(s || "").match(/\d{4}-\d{2}-\d{2}/); return m ? m[0] : U.isoTag(); };
    return csv.zeilen.map(function (z) { return { betrag: zahl(z[iB]), zweck: iV > -1 ? z[iV] || "" : "", datum: iD > -1 ? datum(z[iD]) : U.isoTag(), name: iN > -1 ? z[iN] || "" : "" }; }).filter(function (u) { return u.betrag !== 0; });
  };
  K.zuordnen = function (umsaetze, offene, km) {   // offene: [{r, rest}]
    var vergeben = {};
    return umsaetze.map(function (u) {
      var text = (u.zweck + " " + u.name).toUpperCase().replace(/\s+/g, " "), treffer = null, grund = "";
      offene.forEach(function (o) { if (!treffer && !vergeben[o.r.id] && text.indexOf(String(o.r.nr).toUpperCase()) > -1) { treffer = o; grund = "Rechnungsnummer im Verwendungszweck"; } });
      if (!treffer) { var gleich = offene.filter(function (o) { return !vergeben[o.r.id] && Math.abs(o.rest - u.betrag) < 0.005; });
        var mitName = gleich.filter(function (o) { var k = km[o.r.kunde_id]; return k && k.name.split(/[\s,]+/).some(function (w) { return w.length >= 4 && text.indexOf(w.toUpperCase()) > -1; }); });
        if (mitName.length === 1) { treffer = mitName[0]; grund = "Betrag und Name passen"; } else if (gleich.length === 1) { treffer = gleich[0]; grund = "nur der Betrag passt – bitte prüfen"; } }
      if (treffer) vergeben[treffer.r.id] = true;
      return { u: u, o: treffer, grund: grund };
    });
  };
  K.aktion.kontoImport = async function () {
    var r = await U.dialog("Kontoauszug einlesen", "<p>Laden Sie im Online-Banking Ihre Umsätze als <b>CSV</b> herunter und wählen Sie die Datei hier aus. Kundario sucht Zahlungen zu Ihren offenen Rechnungen. Sie bestätigen jede Zuordnung.</p><p class=\"still\">Die Datei bleibt auf Ihrem Gerät. Gespeichert werden nur die Zahlungen, die Sie bestätigen.</p>" +
      '<input type="file" name="datei" accept=".csv,text/csv,text/plain" required>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Einlesen", primaer: true }]);
    if (!r) return; var f = r.dlg.querySelector("input[type=file]").files[0]; if (!f) return;
    var buf = await f.arrayBuffer(), text = new TextDecoder("utf-8").decode(buf); if (/\ufffd/.test(text)) text = new TextDecoder("windows-1252").decode(buf);
    var alleU = K.kontoLesen(text), ums = alleU.filter(function (u) { return u.betrag > 0; }), ab = alleU.filter(function (u) { return u.betrag < 0; });
    var re = await K.liste("rechnungen", { wo: { status: ["gestellt", "teilbezahlt"] } }), bez = await bezahltMap(), km = await K.kundenMap();
    var offene = re.map(function (x) { return { r: x, rest: rund(+x.brutto - (bez[x.id] || 0)) }; }).filter(function (o) { return o.rest > 0; });
    var vor = K.zuordnen(ums, offene, km), treffer = vor.filter(function (v) { return v.o; });
    var belT = K.belegeZuordnen ? K.belegeZuordnen(ab, K.belegeOffen ? await K.belegeOffen() : []) : [];
    if (!treffer.length && !belT.length) return U.toast(alleU.length + " Umsätze gelesen, aber keiner passt zu einer offenen Rechnung oder einem offenen Beleg.");
    var d = await U.dialog("Zahlungen zuordnen", "<p>" + ums.length + " Eingänge und " + ab.length + " Abbuchungen gelesen. " + treffer.length + " Eingänge passen zu offenen Rechnungen" + (belT.length ? ", " + belT.length + " Abbuchungen zu offenen Eingangsrechnungen" : "") + ".</p><div class=\"kat-wahl\">" + belT.map(function (v, i) {
      return '<label class="chk"><input type="checkbox" name="b_' + i + '"' + (/prüfen/.test(v.grund) ? "" : " checked") + "> <span><b>− " + U.eur(-v.u.betrag) + "</b> am " + U.datum(v.u.datum) + " → Beleg " + h(v.b.lieferant) + (v.b.nr ? " " + h(v.b.nr) : "") + "<br><small>" + h(v.grund) + "</small></span></label>"; }).join("") + treffer.map(function (v, i) {
      return '<label class="chk"><input type="checkbox" name="z_' + i + '"' + (/prüfen/.test(v.grund) ? "" : " checked") + "> <span><b>" + U.eur(v.u.betrag) + "</b> am " + U.datum(v.u.datum) + " → " + h(v.o.r.nr) + " (" + h(km[v.o.r.kunde_id] ? km[v.o.r.kunde_id].name : "") + ", offen " + U.eur(v.o.rest) + ")<br><small>" + h(v.grund) + " · " + h((v.u.name + " " + v.u.zweck).slice(0, 120)) + "</small></span></label>"; }).join("") + "</div>",
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Zahlungen buchen", primaer: true }]);
    if (!d) return; var n = 0;
    for (var j = 0; j < belT.length; j++) { if (!d.daten["b_" + j]) continue; await DB.aendern("belege", belT[j].b.id, { status: "bezahlt", bezahlt_am: belT[j].u.datum }); n++; }
    for (var i = 0; i < treffer.length; i++) { if (!d.daten["z_" + i]) continue; var v = treffer[i], betrag = Math.min(v.u.betrag, v.o.rest);
      await K.neu("zahlungen", { rechnung_id: v.o.r.id, betrag: betrag, datum: v.u.datum, art: "ueberweisung", notiz: "Kontoauszug: " + (v.u.name + " " + v.u.zweck).slice(0, 180) });
      var rest = rund(v.o.rest - betrag); await DB.aendern("rechnungen", v.o.r.id, { status: rest <= 0.004 ? "bezahlt" : "teilbezahlt" });
      await K.verlauf("rechnung", v.o.r.id, "Zahlung " + U.eur(betrag) + " aus dem Kontoauszug zugeordnet" + (rest <= 0 ? " – vollständig bezahlt" : ", offen " + U.eur(rest))); n++; }
    U.toast(n + " Zahlungen gebucht."); K.neuLaden();
  };

  /* ======================= Export für den Steuerberater ======================= */
  K.DATEV_STANDARD = { skr: "03", berater: "", mandant: "", debitor: "10000", erl19: "8400", erl7: "8300", erl13b: "8337", erlKu: "8195", erl0: "8200", kreditor: "70000",
    k_material: "3200", k_fremd: "3100", k_kfz: "4530", k_werkzeug: "4985", k_miete: "4210", k_buero: "4930", k_vers: "4360", k_sonst: "4900" };
  K.DATEV_SKR04 = { erl19: "4400", erl7: "4300", erl13b: "4337", erlKu: "4185", erl0: "4200", k_material: "5200", k_fremd: "5900", k_kfz: "6530", k_werkzeug: "6845", k_miete: "6310", k_buero: "6815", k_vers: "6400", k_sonst: "6300" };
  var KAT_KONTO = { "Material": "k_material", "Fremdleistung": "k_fremd", "Fahrzeug": "k_kfz", "Werkzeug und Geräte": "k_werkzeug", "Miete": "k_miete", "Büro und Telefon": "k_buero", "Versicherung": "k_vers", "Sonstiges": "k_sonst" };
  K.datevCfg = function () { return Object.assign({}, K.DATEV_STANDARD, (K.ctx.betrieb && K.ctx.betrieb.datev) || {}); };
  async function exportDaten(von, bis) {
    var re = (await K.liste("rechnungen", { sortiere: "datum.asc" })).filter(function (r) { return r.status !== "entwurf" && r.datum >= von && r.datum <= bis; });
    return { re: re, km: await K.kundenMap(), bez: await bezahltMap() };
  }
  K.rechnungsbuchCsv = function (d) {
    var z = [csvZeile(["Rechnungsdatum", "Rechnungsnummer", "Art", "Kunde", "USt-IdNr. Kunde", "Netto", "USt-Satz", "Umsatzsteuer", "Brutto", "Steuerfall", "Lohnanteil § 35a (netto)", "Status", "Bezahlt"])];
    d.re.forEach(function (r) { var k = (r.dokument && r.dokument.empfaenger) || d.km[r.kunde_id] || {};
      z.push(csvZeile([U.datum(r.datum), r.nr, r.art, k.name, k.ust_id, euroCsv(r.netto), String(r.mwst).replace(".", ","), euroCsv(+r.brutto - +r.netto), euroCsv(r.brutto), U.STEUERFALL ? U.STEUERFALL[r.steuerfall] || r.steuerfall : r.steuerfall, r.lohn_netto ? euroCsv(r.lohn_netto) : "", r.status, euroCsv(d.bez[r.id] || 0)])); });
    return "\ufeff" + z.join("\r\n");
  };
  K.datevCsv = function (d, von, bis) {
    var c = K.datevCfg(), jetzt = new Date(), ts = jetzt.getFullYear() + ("0" + (jetzt.getMonth() + 1)).slice(-2) + ("0" + jetzt.getDate()).slice(-2) + ("0" + jetzt.getHours()).slice(-2) + ("0" + jetzt.getMinutes()).slice(-2) + ("0" + jetzt.getSeconds()).slice(-2) + "000";
    var ymd = function (s) { return s.replace(/-/g, ""); }, txt = function (s, n) { return '"' + String(s || "").replace(/"/g, "'").slice(0, n) + '"'; };
    var kopf = ['"EXTF"', 700, 21, '"Buchungsstapel"', 13, ts, "", '"RE"', '""', '""', c.berater || "", c.mandant || "", von.slice(0, 4) + "0101", 4, ymd(von), ymd(bis), txt("Ausgangsrechnungen Kundario", 30), '""', 1, 0, 0, '"EUR"', "", '""', "", "", txt(c.skr, 2), "", "", '""', '""'].join(";");
    var spalten = ["Umsatz (ohne Soll/Haben-Kz)", "Soll/Haben-Kennzeichen", "WKZ Umsatz", "Kurs", "Basis-Umsatz", "WKZ Basis-Umsatz", "Konto", "Gegenkonto (ohne BU-Schlüssel)", "BU-Schlüssel", "Belegdatum", "Belegfeld 1", "Belegfeld 2", "Skonto", "Buchungstext"].join(";");
    var zeilen = d.re.map(function (r) {
      var erl = r.steuerfall === "13b" ? c.erl13b : r.steuerfall === "kleinunternehmer" ? c.erlKu : +r.mwst === 19 ? c.erl19 : +r.mwst === 7 ? c.erl7 : c.erl0, betrag = Math.abs(+r.brutto), sh = +r.brutto < 0 ? "H" : "S", k = (r.dokument && r.dokument.empfaenger) || d.km[r.kunde_id] || {};
      return [euroCsv(betrag), '"' + sh + '"', '"EUR"', "", "", '""', c.debitor, erl, '""', r.datum.slice(8, 10) + r.datum.slice(5, 7), txt(r.nr, 36), '""', "", txt(k.name, 60)].join(";");
    });
    return [kopf, spalten].concat(zeilen).join("\r\n");
  };
  K.ansi = function (s) { var b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); b[i] = c < 256 ? c : 63; } return b; };   // DATEV erwartet Windows-1252
  K.rechnungseingangCsv = function (bel) {
    return "\ufeff" + [csvZeile(["Belegdatum", "Lieferant", "Rechnungsnummer", "Kategorie", "Netto", "Vorsteuer", "Brutto", "Status", "Bezahlt am", "Quelle"])].concat(bel.map(function (b) {
      return csvZeile([U.datum(b.datum), b.lieferant, b.nr, b.kategorie, euroCsv(b.netto), euroCsv(b.ust), euroCsv(b.brutto), b.status, b.bezahlt_am ? U.datum(b.bezahlt_am) : "", b.quelle]); })).join("\r\n");
  };
  K.datevEingangCsv = function (bel, von, bis) {   // Kreditor im Haben, Aufwand im Soll, Vorsteuer über BU-Schlüssel 9 (19 %) bzw. 8 (7 %)
    var c = K.datevCfg(), d = { re: [], km: {} }, kopf = K.datevCsv(d, von, bis).split("\r\n").slice(0, 2), txt = function (s, n) { return '"' + String(s || "").replace(/"/g, "'").slice(0, n) + '"'; };
    kopf[0] = kopf[0].replace('"Ausgangsrechnungen Kundario"', '"Eingangsrechnungen Kundario"');
    return kopf.concat(bel.map(function (b) {
      var satz = +b.netto ? Math.round(+b.ust / +b.netto * 100) : 0, bu = satz === 19 ? "9" : satz === 7 ? "8" : "", konto = c[KAT_KONTO[b.kategorie] || "k_sonst"];
      return [euroCsv(Math.abs(+b.brutto)), '"' + (+b.brutto < 0 ? "S" : "H") + '"', '"EUR"', "", "", '""', c.kreditor, konto, '"' + bu + '"', b.datum.slice(8, 10) + b.datum.slice(5, 7), txt(b.nr || "", 36), '""', "", txt(b.lieferant, 60)].join(";");
    })).join("\r\n");
  };
  K.aktion.steuerExport = async function () {
    var heute = new Date(), q = Math.floor(heute.getMonth() / 3), v = new Date(heute.getFullYear(), (q - 1) * 3, 1), b = new Date(heute.getFullYear(), q * 3, 0);
    if (q === 0) { v = new Date(heute.getFullYear() - 1, 9, 1); b = new Date(heute.getFullYear() - 1, 11, 31); }
    var r = await U.dialog("Export für den Steuerberater", '<div class="raster">' + U.feld("von", "Von", U.isoTag(v), { typ: "date", pflicht: true }) + U.feld("bis", "Bis", U.isoTag(b), { typ: "date", pflicht: true }) +
      U.feld("art", "Format", "buch", { optionen: [["buch", "Rechnungsausgangsbuch (CSV, für jedes Programm)"], ["ein", "Rechnungseingangsbuch (CSV)"], ["datev", "DATEV-Buchungsstapel Ausgangsrechnungen (Testversion)"], ["datev_ein", "DATEV-Buchungsstapel Eingangsrechnungen (Testversion)"]], breit: true }) + "</div>" +
      '<p class="still">DATEV: Konten und Berater-/Mandantennummer unter Einstellungen → Steuerberater. Bitte die erste Datei gemeinsam mit Ihrem Steuerberater einlesen und prüfen.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Herunterladen", primaer: true }]);
    if (!r) return; if (r.daten.von.slice(0, 4) !== r.daten.bis.slice(0, 4) && /datev/.test(r.daten.art)) throw new Error("Ein DATEV-Stapel darf nur ein Wirtschaftsjahr umfassen.");
    if (r.daten.art === "ein" || r.daten.art === "datev_ein") {
      var bel = (await K.liste("belege", { sortiere: "datum.asc" })).filter(function (b) { return b.datum >= r.daten.von && b.datum <= r.daten.bis; });
      if (!bel.length) throw new Error("In diesem Zeitraum gibt es keine Eingangsrechnungen.");
      if (r.daten.art === "ein") laden("rechnungseingangsbuch_" + r.daten.von + "_" + r.daten.bis + ".csv", K.rechnungseingangCsv(bel));
      else laden("EXTF_Buchungsstapel_Eingang_" + r.daten.von + "_" + r.daten.bis + ".csv", K.ansi(K.datevEingangCsv(bel, r.daten.von, r.daten.bis)), "text/csv");
      return U.toast(bel.length + " Eingangsrechnungen exportiert.");
    }
    var d = await exportDaten(r.daten.von, r.daten.bis); if (!d.re.length) throw new Error("In diesem Zeitraum gibt es keine gestellten Rechnungen.");
    if (r.daten.art === "datev") laden("EXTF_Buchungsstapel_" + r.daten.von + "_" + r.daten.bis + ".csv", K.ansi(K.datevCsv(d, r.daten.von, r.daten.bis)), "text/csv");
    else laden("rechnungsausgangsbuch_" + r.daten.von + "_" + r.daten.bis + ".csv", K.rechnungsbuchCsv(d));
    U.toast(d.re.length + " Rechnungen exportiert.");
  };
  K.aktion.datevVorschlag = function (el) { var f = el.closest("form"), v = f.elements.skr.value === "04" ? K.DATEV_SKR04 : K.DATEV_STANDARD; Object.keys(v).forEach(function (k) { if (f.elements[k] && /^(erl|k_)/.test(k)) f.elements[k].value = v[k]; }); };
  K.aktion.datevEinst = async function () {
    var c = K.datevCfg();
    var r = await U.dialog("Steuerberater und Konten", '<div class="raster">' + U.feld("berater", "Beraternummer", c.berater) + U.feld("mandant", "Mandantennummer", c.mandant) + U.feld("skr", "Kontenrahmen", c.skr, { optionen: [["03", "SKR 03"], ["04", "SKR 04"]] }) +
      U.feld("debitor", "Debitorenkonto (Sammelkonto)", c.debitor) + U.feld("erl19", "Erlöse 19 %", c.erl19) + U.feld("erl7", "Erlöse 7 %", c.erl7) + U.feld("erl13b", "Erlöse § 13b", c.erl13b) + U.feld("erlKu", "Erlöse Kleinunternehmer", c.erlKu) + U.feld("erl0", "Erlöse steuerfrei / sonstige", c.erl0) + U.feld("kreditor", "Kreditorenkonto (Sammelkonto)", c.kreditor) +
      U.feld("k_material", "Aufwand Material", c.k_material) + U.feld("k_fremd", "Aufwand Fremdleistung", c.k_fremd) + U.feld("k_kfz", "Aufwand Fahrzeug", c.k_kfz) + U.feld("k_werkzeug", "Aufwand Werkzeug/Geräte", c.k_werkzeug) +
      U.feld("k_miete", "Aufwand Miete", c.k_miete) + U.feld("k_buero", "Aufwand Büro/Telefon", c.k_buero) + U.feld("k_vers", "Aufwand Versicherung", c.k_vers) + U.feld("k_sonst", "Aufwand Sonstiges", c.k_sonst) +
      U.feld("ruecklage", "Eigene Rücklage in % der Eingänge (optional)", K.ctx.betrieb.ruecklage_prozent != null ? U.zahlText(K.ctx.betrieb.ruecklage_prozent) : "", { typ: "number" }) + '</div><p class="still">Die vorgeschlagenen Konten sind übliche Werte. Vorsteuer bei Eingangsrechnungen über BU-Schlüssel 9 (19 %) und 8 (7 %). Bitte alles mit Ihrem Steuerberater abstimmen.</p>' +
      '<p><button type="button" class="btn btn-outline klein" data-a="datevVorschlag">Konten zum Kontenrahmen vorschlagen</button></p>');
    if (!r) return; var d = r.daten, neu = {}; Object.keys(K.DATEV_STANDARD).forEach(function (k) { neu[k] = String(d[k] || "").trim(); });
    K.ctx.betrieb = await DB.aendern("betriebe", K.ctx.betrieb.id, { datev: neu, ruecklage_prozent: d.ruecklage !== "" ? U.zahl(d.ruecklage) : null }); U.toast("Gespeichert."); K.neuLaden();
  };

  /* ======================= Termine als Kalenderdatei ======================= */
  K.icsText = function (termine) {
    var z = function (d) { return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }, esc = function (s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); };
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kundario//Termine//DE", "CALSCALE:GREGORIAN"].concat([].concat.apply([], termine.map(function (t) {
      return ["BEGIN:VEVENT", "UID:" + t.id + "@kundario", "DTSTAMP:" + z(new Date()), "DTSTART:" + z(t.beginn), "DTEND:" + z(t.ende || new Date(new Date(t.beginn).getTime() + 3600e3)), "SUMMARY:" + esc(t.titel), t.ort ? "LOCATION:" + esc(t.ort) : null, t.notiz ? "DESCRIPTION:" + esc(t.notiz) : null, "END:VEVENT"].filter(Boolean);
    }))).concat(["END:VCALENDAR"]).join("\r\n");
  };
  K.aktion.icsExport = async function () {
    var alle = await K.liste("termine", { sortiere: "beginn.asc" }), ich = K.ctx.user.id, gestern = Date.now() - 864e5;
    var r = await U.dialog("Termine in den Handy-Kalender", U.feld("wer", "Welche Termine?", "meine", { optionen: [["meine", "Nur meine"], ["alle", "Alle im Betrieb"]] }) + '<p class="still">Es wird eine Kalenderdatei (.ics) gespeichert. Am iPhone öffnen und „Alle hinzufügen“ tippen. Spätere Änderungen in Kundario kommen nicht automatisch nach – dafür die Datei neu laden.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Kalenderdatei speichern", primaer: true }]);
    if (!r) return;
    var l = alle.filter(function (t) { return new Date(t.beginn).getTime() >= gestern && (r.daten.wer === "alle" || (t.mitarbeiter || []).indexOf(ich) > -1); });
    if (!l.length) throw new Error("Keine kommenden Termine.");
    laden("kundario-termine.ics", K.icsText(l), "text/calendar"); U.toast(l.length + " Termine gespeichert.");
  };

  /* ======================= KI-Assistent (vorbereitet) ======================= */
  // Aktiv nur mit kiAssistent: true in config.js und eingerichteter Edge Function „ki-assistent“.
  K.kiFrage = async function (frage) {
    var c = window.KUNDARIO_CONFIG || {}; if (!c.kiAssistent || DB.modus !== "supabase" || !DB.funktion) return null;
    try { var a = await DB.funktion("ki-assistent", { betrieb_id: K.ctx.betrieb.id, frage: String(frage).slice(0, 2000) }); return a && a.antwort ? String(a.antwort) : null; } catch (e) { return null; }
  };
})();
