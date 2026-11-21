/* Kundario – Fristen-Service: Objekte aus Excel/CSV importieren, Fristenliste drucken
   CSV-Spalten (Überschriften, Reihenfolge egal, Trennzeichen ; oder Tab):
   Objekt; Straße; PLZ; Ort; Einheiten; Eigentümer; Heizung; Einbaujahr; Einbaumonat; Bezeichnung Heizung */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;

  var SPALTEN = {
    name: ["objekt", "name", "bezeichnung objekt", "objektname", "liegenschaft"], strasse: ["straße", "strasse", "str.", "adresse"], plz: ["plz", "postleitzahl"], ort: ["ort", "stadt"],
    einheiten: ["einheiten", "wohnungen", "we", "anzahl einheiten", "anzahl wohnungen", "nutzungseinheiten"], eigentuemer: ["eigentümer", "eigentuemer", "weg", "eigentümergemeinschaft"],
    heizung: ["heizung", "heizungsart", "art heizung", "anlage"], einbau_jahr: ["einbaujahr", "baujahr heizung", "einbau", "jahr"], einbau_monat: ["einbaumonat", "monat"], bezeichnung: ["bezeichnung heizung", "heizung bezeichnung", "kessel"]
  };
  K.heizungsArt = function (t) {
    t = String(t || "").toLowerCase().trim(); if (!t) return null;
    if (/w(ä|ae)rmepumpe|\bwp\b/.test(t)) return "waermepumpe";
    if (/fernw(ä|ae)rme/.test(t)) return "fernwaerme";
    if (/kessel|gas|öl|oel|pellet|holz|brennwert|heizwert|therme/.test(t)) return "heizkessel";
    return "sonstige";
  };
  K.objekteCsvLesen = function (text) {
    var zeilen = String(text || "").replace(/^﻿/, "").replace(/\r/g, "").split("\n").filter(function (z) { return z.trim(); });
    if (zeilen.length < 2) throw new Error("Die Datei braucht eine Überschriftenzeile und mindestens ein Objekt.");
    var trenn = zeilen[0].indexOf(";") > -1 ? ";" : zeilen[0].indexOf("\t") > -1 ? "\t" : ",";
    var zelle = function (z) { return z.split(trenn).map(function (x) { return x.trim().replace(/^"|"$/g, ""); }); };
    var kopf = zelle(zeilen[0]).map(function (x) { return x.toLowerCase(); }), idx = {};
    Object.keys(SPALTEN).forEach(function (k) { var i = kopf.findIndex(function (x) { return SPALTEN[k].indexOf(x) > -1; }); if (i > -1) idx[k] = i; });
    if (idx.name == null) throw new Error("Spalte „Objekt“ fehlt. Erwartet z. B.: Objekt;Straße;PLZ;Ort;Einheiten;Heizung;Einbaujahr");
    if (idx.einheiten == null) throw new Error("Spalte „Einheiten“ (Wohnungen) fehlt – sie entscheidet über die Heizungsprüfung.");
    var jahr = new Date().getFullYear();
    return zeilen.slice(1).map(function (z, n) {
      var c = zelle(z), g = function (k) { return idx[k] != null ? (c[idx[k]] || "").trim() : ""; }, fehler = [];
      var e = parseInt(g("einheiten"), 10), j = g("einbau_jahr") ? parseInt(g("einbau_jahr"), 10) : null, m = g("einbau_monat") ? parseInt(g("einbau_monat"), 10) : null;
      if (!g("name")) fehler.push("Objektname fehlt");
      if (!(e >= 1)) fehler.push("Einheiten fehlen");
      if (j != null && !(j >= 1900 && j <= jahr)) fehler.push("Einbaujahr ungültig");
      if (m != null && !(m >= 1 && m <= 12)) fehler.push("Einbaumonat ungültig");
      return { zeile: n + 2, name: g("name"), strasse: g("strasse") || null, plz: g("plz") || null, ort: g("ort") || null, einheiten: e, eigentuemer: g("eigentuemer") || null,
        art: K.heizungsArt(g("heizung")), heizungText: g("heizung"), einbau_jahr: j, einbau_monat: m, bezeichnung: g("bezeichnung") || null, fehler: fehler };
    });
  };

  // Knöpfe in Objekte- und Fristen-Übersicht ergänzen
  var altObjekte = V.objekte;
  V.objekte = async function (id) { var html = await altObjekte(id); if (!id && typeof html === "string") html = html.replace('<button class="btn btn-signal" data-a="objektNeu">Neues Objekt</button>', '<button class="btn btn-outline" data-a="objekteImport">Aus Excel/CSV importieren</button><button class="btn btn-signal" data-a="objektNeu">Neues Objekt</button>'); return html; };
  var altFristen = V.fristen;
  V.fristen = async function (f) { return (await altFristen(f)).replace("</p></div></div>", '</p></div><div class="kopf-knoepfe"><button class="btn btn-outline" data-a="fristenDruck">Fristenliste drucken</button></div></div>'); };

  K.aktion.objekteImport = async function () {
    var r = await U.dialog("Objekte importieren", "<p>Speichern Sie Ihre Objektliste in Excel als <b>CSV (Trennzeichen-getrennt)</b>. Erste Zeile mit Überschriften, zum Beispiel:</p><pre class=\"btp-bsp\">Objekt;Straße;PLZ;Ort;Einheiten;Eigentümer;Heizung;Einbaujahr;Einbaumonat\nRingstraße 10;Ringstraße 10;90402;Nürnberg;8;WEG Ringstraße;Gas-Brennwertkessel;2005;</pre>" +
      '<p><input type="file" name="datei" accept=".csv,.txt,text/csv" required></p><p class="still">Objekte mit gleichem Namen, die es schon gibt, werden übersprungen. Fristen nach § 60b rechnet Kundario danach automatisch.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Weiter", primaer: true }]);
    if (!r) return;
    var inp = document.querySelector("dialog input[name=datei]"), datei = inp && inp.files[0]; if (!datei) throw new Error("Bitte eine CSV-Datei wählen.");
    var text = await new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(String(f.result)); }; f.readAsText(datei, "utf-8"); });
    if (/�/.test(text)) text = await new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(String(f.result)); }; f.readAsText(datei, "windows-1252"); });   // ältere Excel-Dateien
    var zeilen = K.objekteCsvLesen(text), vorhanden = {}; (await K.liste("objekte")).forEach(function (o) { vorhanden[o.name.toLowerCase()] = 1; });
    zeilen.forEach(function (z) { if (!z.fehler.length && vorhanden[z.name.toLowerCase()]) z.doppelt = true; });
    var gut = zeilen.filter(function (z) { return !z.fehler.length && !z.doppelt; });
    var r2 = await U.dialog("Vorschau: " + gut.length + " von " + zeilen.length + " Objekten werden angelegt", '<div class="tabelle"><table><thead><tr><th>Zeile</th><th>Objekt</th><th>Einheiten</th><th>Heizung</th><th>Hinweis</th></tr></thead><tbody>' + zeilen.map(function (z) {
      var hin = z.fehler.length ? '<span class="pill rot">' + h(z.fehler.join(", ")) + "</span>" : z.doppelt ? '<span class="pill aus">gibt es schon</span>' : '<span class="pill ok">wird angelegt</span>';
      return "<tr><td>" + z.zeile + "</td><td>" + h(z.name) + "</td><td>" + (z.einheiten || "") + "</td><td>" + h(z.heizungText || "–") + (z.einbau_jahr ? " · " + (z.einbau_monat ? ("0" + z.einbau_monat).slice(-2) + "/" : "") + z.einbau_jahr : "") + "</td><td>" + hin + "</td></tr>";
    }).join("") + "</tbody></table></div>", [{ wert: "", text: "Abbrechen" }].concat(gut.length ? [{ wert: "ok", text: gut.length + " Objekte anlegen", primaer: true }] : []));
    if (!r2 || !gut.length) return;
    for (var z of gut) {
      var o = await K.neu("objekte", { name: z.name, strasse: z.strasse, plz: z.plz, ort: z.ort, einheiten: z.einheiten, eigentuemer: z.eigentuemer });
      if (z.art) { await K.neu("anlagen", { objekt_id: o.id, art: z.art, bezeichnung: z.bezeichnung || z.heizungText || null, einbau_jahr: z.einbau_jahr, einbau_monat: z.einbau_monat }); await K.fristen60bAbgleichen(o.id); }
    }
    U.toast(gut.length + " Objekte angelegt, Fristen berechnet."); K.go("uebersicht");
  };

  // Fristenliste zum Drucken / als PDF (alle offenen Fristen, nach Objekt)
  K.aktion.fristenDruck = async function () {
    var ob = await K.liste("objekte", { sortiere: "name.asc" }), fr = await K.liste("fristen", { wo: { status: ["offen", "beauftragt"] }, sortiere: "faellig.asc" });
    var teile = ob.map(function (o) {
      var l = fr.filter(function (f) { return f.objekt_id === o.id; }); if (!l.length) return "";
      return "<h3>" + h(o.name) + '</h3><p class="d-klein">' + h([o.strasse, [o.plz, o.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")) + " · " + o.einheiten + " Einheiten" + (o.eigentuemer ? " · " + h(o.eigentuemer) : "") + "</p>" +
        '<table class="d-pos"><thead><tr><th>Fällig</th><th>Frist</th><th>Status</th></tr></thead><tbody>' + l.map(function (f) { var lg = K.fristLage(f); return "<tr><td>" + U.datum(f.faellig) + (lg.klasse === "rot" ? " <b>überfällig</b>" : "") + "</td><td>" + h(f.titel) + (f.fachbetrieb ? "<br>Fachbetrieb: " + h(f.fachbetrieb) : "") + "</td><td>" + (f.status === "beauftragt" ? "beauftragt" : "offen") + "</td></tr>"; }).join("") + "</tbody></table>";
    }).join("");
    if (!teile) throw new Error("Keine offenen Fristen zum Drucken.");
    U.drucken(U.dokument({ betrieb: K.ctx.betrieb, kunde: {}, titelArt: "Fristenliste", nr: "", meta: [["Stand", U.datum(new Date())], ["Offene Fristen", String(fr.length)]],
      zusatz: "<style>h3{margin:16px 0 2px;font-size:14px}.d-klein{font-size:12px;color:#555;margin:0 0 6px}</style>" + teile + '<p class="d-klein" style="margin-top:18px">§ 60b: Heizkessel in Gebäuden ab 6 Wohnungen oder Einheiten; eingebaut vor dem 01.10.2009 Prüfung bis 30.09.2027, sonst innerhalb eines Jahres, nachdem die Heizung 15 Jahre alt ist. Keine Rechtsberatung.</p>' }), "Fristenliste " + U.datum(new Date()));
  };
})();
