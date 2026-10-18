/* =====================================================================
   PREISLISTEN: Beispiel-Preislisten (erfunden), Zuordnung zu den
   Konfigurator-Produkten und Einlesen von CSV-Dateien im Browser.
   Einkaufspreise bleiben beim Betrieb und sind für Kunden nie sichtbar.
   ===================================================================== */
(function () {
  "use strict";
  /* Beispiel-Preislisten erfundener Lieferanten. „d“ = Preisänderung gegenüber den bisherigen Beispielpreisen,
     daraus ergibt sich der Einkaufspreis (bisheriger Verkaufspreis / 1,35 × (1 + d)). */
  var LISTEN = {
    sonnenschutz: { lieferant: "Muster Sonnenschutz GmbH", titel: "Händlerpreisliste 2026/2", stand: "01.10.2026", gueltig: "2026-11-01", seiten: 3, zeilen: [
      ["SO-1001", "Kassettenmarkise Basis 4,00 × 3,00 m, Funkmotor", "markise", 0.035], ["SO-2001", "Raffstore 80 mm gebördelt, 1200 × 1400 mm, Funkmotor", "raffstore", 0.042],
      ["SO-2101", "Vorbaurollladen Alu 1200 × 1400 mm", "rollladen", 0.02], ["SO-3001", "Insektenschutz Spannrahmen 1200 × 1400 mm", "insektenschutz", 0.06],
      ["SO-3501", "Plissee verspannt, Glasleistenmontage 1060 × 1260 mm", "plissee", -0.015], ["SO-4001", "Terrassenüberdachung Alu, VSG 8 mm klar, je m²", "terrassendach", 0.05],
      ["SO-4501", "Lamellendach mit Motor, je m²", "lamellendach", 0.03], ["SO-5001", "Senkrechtmarkise ZIP 2000 × 2400 mm", "screen", 0.025],
      ["SO-6001", "Sonnensegel-Set 4 × 4 m inkl. Beschläge", "sonnensegel", 0, 0.62], ["SO-9001", "Fensterbank Alu 225 mm, je lfm", null, 0], ["SO-9010", "Montagematerial-Pauschale", null, 0]] },
    haustechnik: { lieferant: "Muster Haustechnik-Großhandel", titel: "Bruttopreisliste Bad & Heizung 2026", stand: "15.09.2026", gueltig: "2026-11-01", seiten: 4, zeilen: [
      ["HT-1100", "Walk-in-Duschsystem 120 × 90 cm, Klarglas", "dusche", 0.03], ["HT-1150", "Badewanne freistehend 180 × 80 cm", "badewanne", 0.045], ["HT-1200", "Wand-WC spülrandlos mit Vorwandelement", "wc", 0.02],
      ["HT-1300", "Waschtisch 80 cm mit Unterschrank", "waschtisch", -0.01], ["HT-1400", "Handtuchheizkörper 60 × 120 cm", "handtuchheizkoerper", 0.035], ["HT-2100", "Flachheizkörper Typ 22, 1200 × 600 mm", "heizkoerper", 0.05],
      ["HT-3100", "Luft-Wasser-Wärmepumpe 10 kW, Monoblock", "waermepumpe", 0.028], ["HT-3200", "Gas-Brennwerttherme 24 kW, Kombi", "gastherme", 0.04], ["HT-3300", "Pufferspeicher 500 l", "pufferspeicher", 0.03],
      ["HT-3400", "Split-Klimagerät 3,5 kW mit Außengerät", "klimageraet", 0.015], ["HT-3500", "Kaminofen 7 kW", "kaminofen", 0.02, 0.7], ["HT-4100", "Wallbox 11 kW mit Ladekabel", "wallbox", -0.02],
      ["HT-4200", "Zählerschrank 2 Zählerplätze, TAB", "zaehlerschrank", 0.035], ["HT-4300", "Batteriespeicher 10 kWh", "stromspeicher", -0.04], ["HT-4400", "Balkonkraftwerk-Set 2 × 430 Wp", "balkonkraftwerk", -0.06],
      ["HT-9001", "Pressfitting 22 mm, VE 10", null, 0], ["HT-9002", "Silikon sanitär weiß, 310 ml", null, 0]] },
    bau: { lieferant: "Muster Baustoff- und Holzhandel", titel: "Preisliste Ausbau & Garten 2026/27", stand: "01.10.2026", gueltig: "2026-11-01", seiten: 5, zeilen: [
      ["BH-1001", "Kalkputz-System, je m²", "wandgestaltung", 0.04], ["BH-1100", "Feinsteinzeug 60 × 60, je m²", "fliese", 0.03], ["BH-1200", "Fertigparkett Eiche geölt, je m²", "bodenbelag", 0.05],
      ["BH-1300", "Glastrennwand Stahlrahmen schwarz, je m²", "trennwand", 0.02], ["BH-2001", "Einbauschrank Korpus + Front, je lfm", "einbauschrank", 0.03], ["BH-2100", "Küchen-Unterschrank, je lfm", "kueche", 0.025],
      ["BH-2200", "Holztreppe Eiche, je Stufe", "treppe", 0.04], ["BH-2300", "Innentür 860 × 1985 mm mit Zarge", "innentuer", 0.015], ["BH-3001", "Dachfenster 78 × 118 cm, Solar", "dachfenster", 0.03],
      ["BH-3100", "Kunststofffenster 2-flügelig 1200 × 1400 mm", "fenster", 0.035], ["BH-3200", "Hebe-Schiebetür 3000 × 2300 mm", "schiebetuer", 0.045], ["BH-3300", "Haustür Aluminium 1100 × 2100 mm", "haustuer", 0.02],
      ["BH-3400", "Sektionaltor 2500 × 2125 mm", "garagentor", 0.03], ["BH-4001", "Carport Alu, je m²", "carport", 0.05], ["BH-4100", "Doppelstabmattenzaun 1,23 m, je lfm", "zaun", 0.06],
      ["BH-4200", "Hochbeet Lärche 200 × 80 cm", "hochbeet", 0.02], ["BH-4300", "Gartenhaus 3 × 3 m", "gartenhaus", 0.035, 0.66], ["BH-4400", "Terrassenplatte 60 × 40, je m²", "pflaster", 0.04],
      ["BH-9001", "Gipskartonplatte 12,5 mm, 1250 × 2000", null, 0], ["BH-9002", "Schnellbauschrauben 3,5 × 25, VE 1000", null, 0]] }
  };
  var GRUPPE = { sonnenschutz: "sonnenschutz", fenster: "bau", shk: "haustechnik", heizung: "haustechnik", elektro: "haustechnik", solar: "haustechnik" };
  function listeFuer(gw) { return LISTEN[GRUPPE[gw] || "bau"]; }

  /* Suchwörter je Produkt für die automatische Zuordnung */
  var WOERTER = { markise: ["markise", "gelenkarm", "kassette"], raffstore: ["raffstore", "außenjalousie", "jalousie"], rollladen: ["rollladen", "rolladen", "vorbaurollladen"], insektenschutz: ["insekt", "fliegengitter", "spannrahmen", "pendeltür"],
    plissee: ["plissee", "faltstore"], terrassendach: ["terrassendach", "terrassenüberdachung", "überdachung", "wintergarten"], lamellendach: ["lamellendach", "pergola"], screen: ["senkrechtmarkise", "screen", "zip"], sonnensegel: ["sonnensegel"],
    dusche: ["dusche", "walk-in", "duschsystem"], badewanne: ["badewanne", "wanne"], wc: ["wc", "toilette"], waschtisch: ["waschtisch", "unterschrank"], handtuchheizkoerper: ["handtuch"], heizkoerper: ["heizkörper", "flachheizkörper"],
    waermepumpe: ["wärmepumpe"], gastherme: ["therme", "brennwert"], pufferspeicher: ["pufferspeicher", "speicher l", "warmwasserspeicher"], klimageraet: ["klima", "split"], kaminofen: ["kaminofen", "ofen"], wallbox: ["wallbox", "ladestation"],
    zaehlerschrank: ["zählerschrank"], stromspeicher: ["batteriespeicher", "stromspeicher"], balkonkraftwerk: ["balkonkraftwerk", "steckersolar"], schalter: ["steckdose", "schalter"],
    wandgestaltung: ["kalkputz", "wandfarbe", "putz", "betonoptik"], fliese: ["fliese", "feinsteinzeug"], bodenbelag: ["parkett", "vinyl", "laminat"], trennwand: ["trennwand", "glastrennwand"], einbauschrank: ["einbauschrank", "schrank"],
    kueche: ["küche", "küchen"], treppe: ["treppe", "stufe"], innentuer: ["innentür", "zarge"], dachfenster: ["dachfenster"], fenster: ["fenster", "kunststofffenster"], schiebetuer: ["hebe-schiebetür", "schiebetür"], haustuer: ["haustür"],
    garagentor: ["garagentor", "sektionaltor"], carport: ["carport"], zaun: ["zaun", "doppelstab"], hochbeet: ["hochbeet"], gartenhaus: ["gartenhaus"], pflaster: ["pflaster", "terrassenplatte"] };
  function zuordnen(text) {   // → { pid, sicher (0..1) }
    var t = String(text).toLowerCase(), best = null, punkte = 0;
    Object.keys(WOERTER).forEach(function (pid) { WOERTER[pid].forEach(function (w, i) { if (t.indexOf(w) > -1) { var p = (i === 0 ? 1 : 0.7) + w.length / 100; if (p > punkte) { punkte = p; best = pid; } } }); });
    if (/fensterbank|schraube|fitting|silikon|gipskarton|montagematerial/.test(t)) return { pid: null, sicher: 0 };
    return { pid: best, sicher: best ? Math.min(0.97, 0.55 + punkte * 0.4) : 0 };
  }
  function zahlDE(s) { s = String(s).replace(/[€\s]/g, ""); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else s = s.replace(/,/g, ""); var x = parseFloat(s); return isFinite(x) ? x : NaN; }
  function csvLesen(text) {   // erkennt Trennzeichen und Spalten (Artikelnummer, Bezeichnung, Preis, Einheit)
    var zeilen = String(text).replace(/\r/g, "").split("\n").filter(function (z) { return z.trim(); });
    if (zeilen.length < 2) return { fehler: "Die Datei enthält keine Zeilen." };
    var trenn = [";", "\t", ","].sort(function (a, b) { return zeilen[0].split(b).length - zeilen[0].split(a).length; })[0];
    var teile = function (z) { var out = [], cur = "", q = false; for (var i = 0; i < z.length; i++) { var ch = z[i]; if (ch === '"') q = !q; else if (ch === trenn && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(function (x) { return x.trim(); }); };
    var kopf = teile(zeilen[0]).map(function (k) { return k.toLowerCase(); });
    var spalte = function (re) { for (var i = 0; i < kopf.length; i++) if (re.test(kopf[i])) return i; return -1; };
    var sNr = spalte(/art.*nr|artikelnummer|^nr|sku|ean/), sText = spalte(/bezeich|text|artikel$|produkt|beschreibung|name/), sPreis = spalte(/preis|ek|netto|eur/), sEinh = spalte(/einheit|^me$|unit/);
    if (sText < 0 || sPreis < 0) return { fehler: "Spalten „Bezeichnung“ und „Preis“ nicht gefunden. Erste Zeile: " + zeilen[0].slice(0, 80) };
    var rows = zeilen.slice(1).map(function (z, i) { var t = teile(z), z2 = zuordnen(t[sText]); return { nr: sNr > -1 ? t[sNr] : String(i + 1), text: t[sText] || "", einheit: sEinh > -1 ? t[sEinh] : "", ek: zahlDE(t[sPreis]), pid: z2.pid, sicher: z2.sicher }; })
      .filter(function (r) { return r.text && isFinite(r.ek) && r.ek > 0; });
    return { rows: rows, spalten: { nr: kopf[sNr], text: kopf[sText], preis: kopf[sPreis] } };
  }
  window.PREISLISTE = { LISTEN: LISTEN, listeFuer: listeFuer, zuordnen: zuordnen, csvLesen: csvLesen, zahlDE: zahlDE };
})();
