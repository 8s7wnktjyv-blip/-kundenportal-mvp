/* Kundario – Branchen-Startpaket: typische Leistungen und Textbausteine je Gewerk mit einem Klick in den Katalog.
   Preise bleiben bewusst leer (keine erfundenen Preise in echten Angeboten) – der Betrieb trägt seine eigenen ein. */
(function () {
  var V = K.views, DB = window.KDB, h = U.h;
  var L = function (text, einheit, kategorie, typ) { return { text: text, einheit: einheit || "Stk.", kategorie: kategorie, typ: typ || "leistung" }; };
  var T = function (text, kategorie) { return { text: text, einheit: "", kategorie: kategorie || "Textbaustein", typ: "text" }; };
  var ALLGEMEIN = [L("Anfahrt Pauschale", "pauschal", "Allgemein"), L("Arbeitsstunde Geselle", "Std.", "Lohn", "lohn"), L("Arbeitsstunde Meister", "Std.", "Lohn", "lohn"), L("Baustelleneinrichtung und Abdeckarbeiten", "pauschal", "Allgemein"),
    T("Die Arbeiten werden nach Terminabsprache ausgeführt. Bitte sorgen Sie für freien Zugang zu den Arbeitsbereichen."), T("Mehr- oder Minderleistungen werden nach tatsächlichem Aufwand zu den angebotenen Einheitspreisen abgerechnet.")];
  var PAKETE = {
    "Fenster- und Türenbau": [
      L("Kunststofffenster 2-flügelig, 3-fach-Verglasung, Dreh-Kipp", "Stk.", "Fenster"), L("Kunststofffenster 1-flügelig, 3-fach-Verglasung, Dreh-Kipp", "Stk.", "Fenster"), L("Holz-Alu-Fenster 1-flügelig, 3-fach-Verglasung", "Stk.", "Fenster"),
      L("Balkontür 1-flügelig, Kunststoff, 3-fach-Verglasung", "Stk.", "Türen"), L("Haustür Aluminium mit Mehrfachverriegelung", "Stk.", "Türen"), L("Hebe-Schiebe-Tür Kunststoff", "Stk.", "Türen"),
      L("Demontage und Entsorgung Altfenster", "Stk.", "Fenster"), L("Montage nach RAL-Leitfaden mit Anschlussfuge (innen dampfdicht, außen schlagregendicht)", "Stk.", "Montage"),
      L("Fensterbank innen Kunststoff", "lfm", "Fenster"), L("Fensterbank außen Aluminium", "lfm", "Fenster"), L("Beiputzarbeiten Laibung innen", "lfm", "Montage"), L("Insektenschutz-Spannrahmen", "Stk.", "Zubehör"),
      L("Rollladen-Aufsatzkasten mit Alu-Panzer", "Stk.", "Rollladen"), L("Vorbaurollladen Aluminium", "Stk.", "Rollladen"), L("Rollladenmotor Funk, Einbau", "Stk.", "Rollladen"), L("Rollladenpanzer erneuern", "m²", "Rollladen"), L("Gurtwickler tauschen", "Stk.", "Rollladen"),
      L("Markise Gelenkarm, Motor und Funksteuerung", "Stk.", "Sonnenschutz"), L("Außenraffstore Aluminium mit Motor", "Stk.", "Sonnenschutz"), L("Terrassenüberdachung Aluminium mit VSG-Glas", "m²", "Überdachung"),
      L("Fenster einstellen und Beschläge warten", "Stk.", "Wartung"), L("Dichtungen erneuern", "lfm", "Wartung"),
      T("Alle Fenster werden nach Aufmaß vor Ort gefertigt. Lieferzeit derzeit ca. 6–8 Wochen ab Auftragsbestätigung.", "Fenster"), T("Die Montage erfolgt nach den anerkannten Regeln der Technik (RAL-Leitfaden). Putz- und Malerarbeiten an der Laibung sind nicht enthalten, sofern nicht gesondert angeboten.", "Fenster")],
    "SHK": [L("Gas-Brennwerttherme inkl. Montage", "Stk.", "Heizung"), L("Wärmepumpe Luft/Wasser inkl. Montage", "Stk.", "Heizung"), L("Heizkörper tauschen", "Stk.", "Heizung"), L("Hydraulischer Abgleich", "pauschal", "Heizung"), L("Heizungswartung", "pauschal", "Wartung"),
      L("Waschtisch mit Armatur montieren", "Stk.", "Sanitär"), L("WC wandhängend mit Vorwandelement", "Stk.", "Sanitär"), L("Bodengleiche Dusche", "Stk.", "Sanitär"), L("Trinkwasserleitung Edelstahl", "lfm", "Sanitär"), L("Abwasserleitung HT-Rohr", "lfm", "Sanitär"), L("Demontage und Entsorgung Altanlage", "pauschal", "Allgemein")],
    "Elektro": [L("Steckdose Unterputz setzen", "Stk.", "Installation"), L("Schalter Unterputz setzen", "Stk.", "Installation"), L("Leitung NYM-J 3x1,5 verlegen", "lfm", "Installation"), L("Zählerschrank erneuern", "Stk.", "Verteilung"), L("Unterverteilung mit FI/LS", "Stk.", "Verteilung"),
      L("Wallbox 11 kW inkl. Anmeldung beim Netzbetreiber", "Stk.", "E-Mobilität"), L("E-Check (Prüfung ortsfester Anlagen)", "pauschal", "Prüfung"), L("Rauchwarnmelder liefern und montieren", "Stk.", "Sicherheit"), L("LED-Deckenleuchte montieren", "Stk.", "Beleuchtung")],
    "Maler und Lackierer": [L("Wandflächen spachteln Q2", "m²", "Innen"), L("Wandflächen streichen, Dispersion weiß, 2-fach", "m²", "Innen"), L("Decke streichen", "m²", "Innen"), L("Raufaser tapezieren", "m²", "Innen"), L("Tür lackieren", "Stk.", "Lack"),
      L("Fassade reinigen", "m²", "Fassade"), L("Fassade streichen, Silikonharz", "m²", "Fassade"), L("Abdeckarbeiten Boden und Möbel", "pauschal", "Allgemein")],
    "Dachdecker": [L("Dacheindeckung Tondachziegel", "m²", "Dach"), L("Dachrinne Zink erneuern", "lfm", "Entwässerung"), L("Fallrohr Zink", "lfm", "Entwässerung"), L("Zwischensparrendämmung", "m²", "Dämmung"), L("Dachfenster einbauen", "Stk.", "Dachfenster"), L("Gerüst stellen", "m²", "Allgemein"), L("Dachinspektion mit Fotodokumentation", "pauschal", "Wartung")]
  };
  K.startpaket = function (gewerk) { return (PAKETE[gewerk] || []).concat(ALLGEMEIN); };

  K.aktion.startpaket = async function () {
    var gw = (K.ctx.betrieb || {}).gewerk || "", l = K.startpaket(gw), da = await K.liste("artikel", {}).catch(function () { return []; });
    var vorh = da.map(function (a) { return String(a.text).toLowerCase(); }), neu = l.filter(function (x) { return vorh.indexOf(x.text.toLowerCase()) < 0; });
    if (!neu.length) { U.toast("Das Startpaket ist schon in Ihrem Katalog."); return; }
    var r = await U.dialog("Startpaket " + (PAKETE[gw] ? gw : "Allgemein"), "<p>" + neu.length + " typische Einträge für Ihren Katalog:</p><ul class=\"sp-liste\">" + neu.map(function (x) { return "<li>" + h(x.text) + " <small>" + h(x.kategorie) + "</small></li>"; }).join("") + "</ul><p class=\"still\">Die Preise bleiben leer – tragen Sie Ihre eigenen ein (im Katalog oder direkt im ersten Angebot). Kundario erfindet keine Preise.</p>",
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "In den Katalog übernehmen", primaer: true }]); if (!r || r.wert !== "ok") return;
    for (var i = 0; i < neu.length; i++) await K.neu("artikel", { typ: neu[i].typ, text: neu[i].text, einheit: neu[i].typ === "text" ? "" : (neu[i].einheit || "Stk."), kategorie: neu[i].kategorie, preis: 0, aktiv: true });
    U.toast(neu.length + " Einträge übernommen – jetzt Ihre Preise eintragen."); K.neuLaden();
  };

  // Preise nachtragen: alle Einträge ohne Preis in einer Liste zum Durchtippen
  K.aktion.preiseNachtragen = async function () {
    var l = (await K.liste("artikel", { wo: { aktiv: true }, sortiere: "text.asc" })).filter(function (a) { return a.typ !== "text" && !(+a.preis > 0); });
    if (!l.length) { U.toast("Alle Einträge haben einen Preis."); return; }
    var r = await U.dialog("Preise nachtragen (" + l.length + ")", '<p class="still">Netto-Verkaufspreis je Einheit. Leer lassen = später.</p><div class="pn-liste">' + l.map(function (a, i) {
      return '<label class="pn-zeile"><span><b>' + h(a.text) + "</b><small>" + h(a.kategorie || "") + " · je " + h(a.einheit || "Stk.") + '</small></span><span class="pn-feld"><input name="p' + i + '" inputmode="decimal" placeholder="0,00" aria-label="Preis für ' + h(a.text) + '"><i>€</i></span></label>'; }).join("") + "</div>",
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Preise speichern", primaer: true }]); if (!r || r.wert !== "ok") return;
    var n = 0; for (var i = 0; i < l.length; i++) { var v = String(r.daten["p" + i] || "").trim(); if (!v) continue; var z = U.zahl(v); if (!(z > 0)) throw new Error("Bitte einen gültigen Preis für „" + l[i].text + "“ eintragen."); await DB.aendern("artikel", l[i].id, { preis: z }); n++; }
    U.toast(n ? n + " Preise gespeichert." : "Nichts geändert."); K.neuLaden();
  };

  // Im Katalog: Knopf „Startpaket“ und – solange leer – eine Einladung
  var alt = V.katalog;
  V.katalog = async function () {
    var html = await alt.apply(this, arguments), gw = (K.ctx.betrieb || {}).gewerk || "";
    html = html.replace('<button class="btn btn-signal" data-a="katNeu">', '<button class="btn btn-outline" data-a="startpaket">Startpaket ' + h(PAKETE[gw] ? gw : "laden") + '</button><button class="btn btn-signal" data-a="katNeu">');
    if (html.indexOf("Noch leer.") > -1) html = html.replace('<div class="leer"><p>', '<div class="leer"><p><b>Schnell starten:</b> Mit dem Startpaket haben Sie sofort ' + K.startpaket(gw).length + ' typische Leistungen und Textbausteine Ihres Gewerks im Katalog – nur noch Ihre Preise eintragen.</p><p><button class="btn btn-signal" data-a="startpaket">Startpaket übernehmen</button></p><p>');
    var ohne = (await K.liste("artikel", { wo: { aktiv: true } }).catch(function () { return []; })).filter(function (a) { return a.typ !== "text" && !(+a.preis > 0); }).length;
    if (ohne) { var pos = html.indexOf('<div class="tabelle">'); if (pos > -1) html = html.slice(0, pos) + '<div class="hinweis-band"><span><b>' + ohne + (ohne === 1 ? " Eintrag" : " Einträge") + ' ohne Preis.</b> Erst mit Preis kann Kundario sie im Angebotsvorschlag fertig einsetzen.</span><button class="btn btn-signal klein" data-a="preiseNachtragen">Preise nachtragen</button></div>' + html.slice(pos); }
    return html;
  };
  if (alt.danach) V.katalog.danach = alt.danach;
})();
