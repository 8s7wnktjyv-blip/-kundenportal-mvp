/* =====================================================================
   AUFTRAGSPORTAL FÜR ENDKUNDEN (gehört zu anfrage.html)
   ---------------------------------------------------------------------
   Fünf Schritte: Vorhaben → Details → Ort & Fotos → Preis & Budget → Kontakt.
   - Preis: Groß steht ein TYPISCHER Wert, darunter die übliche Spanne,
     was enthalten ist, was teurer macht und 10 % Puffer.
   - Budget-Abgleich mit der OBEREN Zahl („Können Sie bis zu … einplanen?“).
   - Jede Anfrage bekommt eine Note: A = sofort vermitteln, B = kurz
     nachfragen, C = nicht vermitteln (Budget, Mieter, „später“).
   Beispielversion: Die Anfrage wird NUR im eigenen Browser gespeichert
   (localStorage „portal-anfragen“) und erscheint in der Demo unter
   „Ansicht als: Betreiber“ → „Vermittlung“. Es wird nichts verschickt.

   PREISE: Orientierungswerte für Franken (Stand 2026), brutto, für
   „gehobene“ Ausstattung. Optionen mit einer dritten Zahl ändern den
   Preis (0.8 = 20 % günstiger, 1.15 = 15 % teurer). Später werden die
   Werte mit den echten Auftragswerten der Betriebe abgeglichen.
   ===================================================================== */
(function () {
  "use strict";

  var AUSSTATTUNG = { id: "stufe", typ: "wahl", label: "Welche Ausstattung wünschen Sie?", optionen: [
    ["einfach", "Einfach – solide Standardprodukte", 0.82], ["gehoben", "Gehoben – z. B. größere Fliesen, bodengleiche Dusche", 1], ["hochwertig", "Hochwertig – Designprodukte, raumhohe Fliesen, Extras", 1.3]] };

  /* Alle Gewerke untereinander – Reparaturen und Kleinaufträge wählt man direkt im passenden Gewerk */
  var REP = function (text) { return ["reparatur", text]; };
  var VORHABEN = [
    { id: "bad", label: "Sanitär & Bad", bsp: "Badsanierung, Gäste-WC, barrierefrei, Reparaturen", gewerk: "Sanitär & Bad", icon: "<path d=\"M5 21V9a5 5 0 0 1 10 0\"/><path d=\"M10 12h10\"/><path d=\"M12 15v1M15 15v1M18 15v1M13.5 18v1M16.5 18v1\"/>",
      fragen: [
        { id: "umfang", typ: "wahl", label: "Was soll gemacht werden?", optionen: [["komplett", "Bad komplett neu"], ["teil", "Teilweise (z. B. nur Dusche oder Fliesen)"], ["barrierefrei", "Barrierefrei umbauen"], REP("Reparatur (z. B. tropfender Hahn, WC-Spülung, verstopft)")] },
        { id: "flaeche", fuer: ["komplett", "teil", "barrierefrei"], fk: "umfang", typ: "zahl", label: "Wie groß ist das Bad?", einheit: "m²", wert: 8, min: 2, max: 40 },
        Object.assign({}, AUSSTATTUNG, { fuer: ["komplett", "teil", "barrierefrei"], fk: "umfang" }),
        { id: "leitungen", fuer: ["komplett", "teil", "barrierefrei"], fk: "umfang", typ: "wahl", label: "Sollen alte Wasser- und Abwasserleitungen mit erneuert werden?", optionen: [["nein", "Nein, Leitungen sind in Ordnung", 1], ["ja", "Ja, Leitungen mit erneuern", 1.12], ["unklar", "Leitungen: weiß ich nicht", 1.06]] }
      ],
      preis: function (a) { if (a.umfang === "reparatur") return [150, 600]; var m = a.flaeche || 8, f = { komplett: [2000, 2600], teil: [1000, 1400], barrierefrei: [2200, 2900] }[a.umfang || "komplett"]; return [m * f[0], m * f[1]]; },
      enthalten: "Abbruch, Material, Einbau von Fliesen, Dusche, WC und Waschtisch, Entsorgung",
      teurer: ["alte oder marode Leitungen", "Wände versetzen oder Tür verlegen", "Fußbodenheizung, Fenster tauschen", "schwer zugängliche Etage ohne Aufzug"] },
    { id: "heizung", label: "Heizung, Wärmepumpe & Klima", bsp: "Wärmepumpe, Gasheizung, Klimaanlage, Wartung", gewerk: "Heizung, Wärmepumpe & Klima", icon: "<rect x=\"3\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M7.5 6v12M12 6v12M16.5 6v12M5 21v-3M19 21v-3\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["waermepumpe", "Neue Wärmepumpe"], ["gas", "Neue Gas-Brennwertheizung"], ["klima", "Klimaanlage (1–2 Räume)"], REP("Reparatur oder Wartung")] },
        { id: "wohnflaeche", fuer: ["waermepumpe", "gas"], fk: "art", typ: "zahl", label: "Beheizte Wohnfläche", einheit: "m²", wert: 140, min: 30, max: 600 },
        { id: "heizflaechen", fuer: ["waermepumpe", "gas"], fk: "art", typ: "wahl", label: "Wie wird geheizt?", optionen: [["heizkoerper", "Heizkörper", 1], ["fbh", "Fußbodenheizung", 0.95], ["alt", "Alte Heizkörper, evtl. tauschen", 1.12]] }
      ],
      preis: function (a) { var k = Math.max(0.8, Math.min(1.6, (a.wohnflaeche || 140) / 140));
        return { waermepumpe: [30000 * k, 38000 * k], gas: [12000 * k, 15000 * k], klima: [3500, 6500], reparatur: [180, 900] }[a.art || "waermepumpe"]; },
      hinweis: function (a) { return a.art === "waermepumpe" ? "Für Wärmepumpen gibt es oft staatliche Förderung, die den Eigenanteil deutlich senken kann. Der Betrieb prüft das mit Ihnen." : ""; },
      enthalten: "Gerät, Montage, Anschluss, Inbetriebnahme, Entsorgung der alten Anlage",
      teurer: ["Heizkörper oder Leitungen tauschen", "Elektro-Anpassungen am Zählerschrank", "Fundament oder Schallschutz für die Außeneinheit", "Schornstein- oder Abgasarbeiten"] },
    { id: "elektro", label: "Elektro", bsp: "Steckdosen, Zählerschrank, Wallbox, Störung", gewerk: "Elektro", icon: "<path d=\"M13 2 4 14h7l-1 8 9-12h-7z\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["klein", "Kleinauftrag (Steckdosen, Lampen)"], ["wallbox", "Wallbox fürs E-Auto"], ["zaehler", "Zählerschrank erneuern"], ["neu", "Elektrik einer Wohnung erneuern"], REP("Störung oder Reparatur")] },
        { id: "flaeche", fuer: ["neu"], fk: "art", typ: "zahl", label: "Wohnfläche", einheit: "m²", wert: 80, min: 10, max: 400 }
      ],
      preis: function (a) { return { klein: [150, 700], wallbox: [1500, 2500], zaehler: [2500, 4500], neu: [(a.flaeche || 80) * 100, (a.flaeche || 80) * 140], reparatur: [120, 600] }[a.art || "klein"]; },
      enthalten: "Material, Montage, Prüfung und Protokoll",
      teurer: ["Zählerschrank muss erneuert werden", "lange Kabelwege oder Wanddurchbrüche", "Anmeldung beim Netzbetreiber mit Auflagen"] },
    { id: "solar", label: "Solar & Photovoltaik", bsp: "PV-Anlage, Stromspeicher, Balkonkraftwerk", gewerk: "Solar & Photovoltaik", icon: "<path d=\"M4 15 7 5h14l-3 10z\"/><path d=\"M5.5 10h14M12 5l-2 10M16.5 5l-2 10M11 15v5M7 20h8\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["pv", "PV-Anlage auf dem Dach"], ["pvspeicher", "PV-Anlage mit Stromspeicher"], ["speicher", "Speicher nachrüsten"], ["balkon", "Balkonkraftwerk mit Montage"], REP("Wartung oder Reparatur")] },
        { id: "kwp", fuer: ["pv", "pvspeicher"], fk: "art", typ: "zahl", label: "Anlagengröße (grob: 1 kWp je 5 m² Dachfläche)", einheit: "kWp", wert: 10, min: 2, max: 30 }
      ],
      preis: function (a) { var k = a.kwp || 10; return { pv: [k * 1300, k * 1700], pvspeicher: [k * 1300 + 7000, k * 1700 + 10000], speicher: [7000, 11000], balkon: [800, 1600], reparatur: [200, 900] }[a.art || "pv"]; },
      hinweis: function (a) { return /pv|speicher/.test(a.art || "pv") ? "Für PV-Anlagen und Speicher auf Wohngebäuden fällt meist 0 % Umsatzsteuer an. Der Betrieb kümmert sich auch um die Anmeldung beim Netzbetreiber." : ""; },
      enthalten: "Module, Wechselrichter, Gerüst, Montage, Anschluss und Anmeldung",
      teurer: ["Zählerschrank muss erneuert werden", "schwieriges Dach (steil, verwinkelt, Schiefer)", "lange Kabelwege zum Keller"] },
    { id: "maler", label: "Maler & Fassade", bsp: "Streichen, Tapezieren, Fassade", gewerk: "Maler & Fassade", icon: "<rect x=\"3\" y=\"3\" width=\"14\" height=\"6\" rx=\"1.5\"/><path d=\"M17 6h3v5h-8v3\"/><rect x=\"10\" y=\"14\" width=\"4\" height=\"7\" rx=\"1\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was soll gemacht werden?", optionen: [["streichen", "Wände und Decken streichen"], ["tapezieren", "Tapezieren und streichen"], ["fassade", "Fassade streichen"], REP("Ausbessern (z. B. Riss, Wasserfleck)")] },
        { id: "flaeche", fuer: ["streichen", "tapezieren", "fassade"], fk: "art", typ: "zahl", label: "Wohnfläche bzw. Fassadenfläche", einheit: "m²", wert: 80, min: 10, max: 600 },
        { id: "zustand", fuer: ["streichen", "tapezieren", "fassade"], fk: "art", typ: "wahl", label: "Zustand von Wänden und Untergrund", optionen: [["gut", "Gut, kaum Ausbesserungen", 1], ["mittel", "Einige Risse und Löcher", 1.12], ["schlecht", "Alte Tapeten runter, Untergrund schlecht", 1.3]] }
      ],
      preis: function (a) { var m = a.flaeche || 80; return { streichen: [m * 25, m * 35], tapezieren: [m * 35, m * 50], fassade: [m * 45, m * 75], reparatur: [300, 1200] }[a.art || "streichen"]; },
      enthalten: "Abdecken, Vorbereitung, Material, Ausführung, Reinigung",
      teurer: ["Möbel rücken und einlagern", "Spachteln in Q3/Q4-Qualität", "Treppenhaus oder hohe Räume", "Gerüst bei der Fassade"] },
    { id: "fliesen", label: "Fliesen", bsp: "Boden, Wand, Küche, Terrasse", gewerk: "Fliesen", icon: "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 9h18M3 15h18M9 3v6M15 9v6M9 15v6\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was soll gefliest werden?", optionen: [["boden", "Boden"], ["wand", "Wand (z. B. Küche, Bad)"], REP("Einzelne Fliesen oder Fugen ausbessern")] },
        { id: "flaeche", fuer: ["boden", "wand"], fk: "art", typ: "zahl", label: "Fliesenfläche", einheit: "m²", wert: 20, min: 1, max: 300 },
        { id: "format", fuer: ["boden", "wand"], fk: "art", typ: "wahl", label: "Fliesenformat", optionen: [["normal", "Normal (bis 60 × 60 cm)", 1], ["gross", "Großformat (z. B. 120 × 60 cm)", 1.15]] }
      ],
      preis: function (a) { var m = a.flaeche || 20; return { boden: [m * 90, m * 140], wand: [m * 100, m * 150], reparatur: [200, 900] }[a.art || "boden"]; },
      enthalten: "Untergrund vorbereiten, Abdichtung wo nötig, Fliesen verlegen, verfugen, Silikon",
      teurer: ["alte Fliesen abschlagen", "unebener Untergrund", "Naturstein oder aufwendige Muster"] },
    { id: "boden", label: "Boden & Parkett", bsp: "Vinyl, Laminat, Parkett, Abschleifen", gewerk: "Boden & Parkett", icon: "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"1.5\"/><path d=\"M3 9.3h18M3 14.6h18M10 4v5.3M15 9.3v5.3M7 14.6V20\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["vinyl", "Vinyl verlegen"], ["laminat", "Laminat verlegen"], ["parkett", "Parkett verlegen"], ["schleifen", "Parkett abschleifen und versiegeln"], REP("Reparatur (z. B. Diele, Übergang)")] },
        { id: "flaeche", fuer: ["vinyl", "laminat", "parkett", "schleifen"], fk: "art", typ: "zahl", label: "Bodenfläche", einheit: "m²", wert: 60, min: 5, max: 400 }
      ],
      preis: function (a) { var m = a.flaeche || 60; return { vinyl: [m * 55, m * 85], laminat: [m * 40, m * 65], parkett: [m * 90, m * 140], schleifen: [m * 35, m * 55], reparatur: [200, 800] }[a.art || "vinyl"]; },
      enthalten: "Alten Belag entfernen, Untergrund ausgleichen, verlegen, Sockelleisten",
      teurer: ["Estrich muss ausgebessert werden", "viele Türen und Übergänge", "Treppenstufen belegen"] },
    { id: "trockenbau", label: "Trockenbau & Estrich", bsp: "Wände, Decken, Dachausbau, Estrich", gewerk: "Trockenbau & Estrich", icon: "<path d=\"M4 21V3h16v18z\"/><path d=\"M8 3v18M12 3v18M16 3v18\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["wand", "Trennwand einziehen"], ["decke", "Decke abhängen"], ["dach", "Dachgeschoss ausbauen"], ["estrich", "Estrich verlegen"], REP("Risse oder Löcher ausbessern")] },
        { id: "flaeche", fuer: ["wand", "decke", "dach", "estrich"], fk: "art", typ: "zahl", label: "Fläche (ungefähr)", einheit: "m²", wert: 20, min: 2, max: 300 }
      ],
      preis: function (a) { var m = a.flaeche || 20; return { wand: [m * 70, m * 110], decke: [m * 65, m * 100], dach: [m * 120, m * 180], estrich: [m * 35, m * 55], reparatur: [250, 900] }[a.art || "wand"]; },
      enthalten: "Unterkonstruktion, Platten, Dämmung wo nötig, Spachteln bis streichfertig",
      teurer: ["Schallschutz oder Brandschutz", "Türöffnungen und Elektro in der Wand", "Dachfenster beim Dachausbau"] },
    { id: "schreiner", label: "Schreiner, Küche & Treppen", bsp: "Einbauschrank, Küche, Treppe, Innentüren", gewerk: "Schreiner, Küche & Treppen", icon: "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"1.5\"/><path d=\"M12 3v18M9.5 11v2M14.5 11v2\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["schrank", "Einbauschrank nach Maß"], ["kueche", "Küche"], ["treppe", "Treppe"], ["tueren", "Innentüren"], REP("Reparatur (z. B. Tür klemmt, Scharnier)")] },
        { id: "anzahl", fuer: ["tueren"], fk: "art", typ: "zahl", label: "Wie viele Türen?", einheit: "Stück", wert: 3, min: 1, max: 30 }
      ],
      preis: function (a) { var n = a.anzahl || 3; return { schrank: [3000, 7500], kueche: [9000, 22000], treppe: [8000, 18000], tueren: [n * 700, n * 1100], reparatur: [150, 700] }[a.art || "schrank"]; },
      enthalten: "Aufmaß, Planung, Fertigung, Lieferung und Montage",
      teurer: ["Dachschrägen und Sondermaße", "hochwertige Fronten oder Massivholz", "Elektrogeräte bei der Küche"] },
    { id: "dach", label: "Dach & Spengler", bsp: "Eindeckung, Dämmung, Dachrinne, Dachfenster", gewerk: "Dach & Spengler", icon: "<path d=\"M2 12 12 4l10 8\"/><path d=\"M5 10v10h14V10\"/><path d=\"M10 20v-5h4v5\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["neu", "Neu eindecken"], ["daemmung", "Neu eindecken mit Dämmung"], ["rinne", "Dachrinnen erneuern"], ["dachfenster", "Dachfenster einbauen oder tauschen"], REP("Reparatur (z. B. undicht)")] },
        { id: "flaeche", fuer: ["neu", "daemmung"], fk: "art", typ: "zahl", label: "Dachfläche (ungefähr)", einheit: "m²", wert: 150, min: 10, max: 800 }
      ],
      preis: function (a) { var m = a.flaeche || 150; return { neu: [m * 190, m * 250], daemmung: [m * 290, m * 370], rinne: [2500, 5000], dachfenster: [1800, 3500], reparatur: [400, 3500] }[a.art || "neu"]; },
      enthalten: "Gerüst, Abdecken, neue Eindeckung, Dachrinnen-Anschlüsse, Entsorgung",
      teurer: ["Schäden am Dachstuhl", "Gauben, Dachfenster oder Kamin-Einfassung", "Entsorgung von Asbestplatten", "neue Dachrinnen und Fallrohre"] },
    { id: "fenster", label: "Fenster, Türen & Tore", bsp: "Fenster, Haustür, Garagentor", gewerk: "Fenster, Türen & Tore", icon: "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"1.5\"/><path d=\"M12 3v18M4 12h16\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["fenster", "Neue Fenster"], ["haustuer", "Neue Haustür"], ["garagentor", "Neues Garagentor"], REP("Fenster oder Tür einstellen, reparieren")] },
        { id: "anzahl", fuer: ["fenster"], fk: "art", typ: "zahl", label: "Wie viele Fenster?", einheit: "Stück", wert: 6, min: 1, max: 60 },
        { id: "material", fuer: ["fenster"], fk: "art", typ: "wahl", label: "Material", optionen: [["kunststoff", "Kunststoff"], ["holz", "Holz oder Holz-Alu"], ["egal", "Weiß ich noch nicht"]] }
      ],
      preis: function (a) { var n = a.anzahl || 6, f = { kunststoff: [950, 1250], holz: [1500, 1950], egal: [950, 1950] }[a.material || "kunststoff"];
        return { fenster: [n * f[0], n * f[1]], haustuer: [3500, 8000], garagentor: [2500, 5500], reparatur: [150, 600] }[a.art || "fenster"]; },
      enthalten: "Ausbau und Entsorgung, Einbau nach Maß, Abdichtung",
      teurer: ["Sondermaße oder Rundbögen", "Putz- und Malerarbeiten innen und außen", "Gerüst ab dem 2. Obergeschoss", "Schallschutz- oder Sicherheitsglas"] },
    { id: "sonnenschutz", label: "Sonnenschutz & Terrassendach", bsp: "Terrassendach, Markise, Rollladen, Raffstore, Insektenschutz", gewerk: "Sonnenschutz & Terrassendach", icon: "<path d=\"M3 5h18l-2 6H5z\"/><path d=\"M5 11v10M19 11v10\"/><path d=\"M8 5l-1 6M12 5v6M16 5l1 6\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["terrassendach", "Terrassendach"], ["markise", "Markise"], ["rollladen", "Rollläden"], ["raffstore", "Raffstores"], ["insekten", "Insektenschutz (Fliegengitter)"], ["plissee", "Plissees"], REP("Reparatur (z. B. Gurt, Motor)")] },
        { id: "flaeche", fuer: ["terrassendach"], fk: "art", typ: "zahl", label: "Fläche des Terrassendachs", einheit: "m²", wert: 15, min: 4, max: 80 },
        { id: "anzahl", fuer: ["rollladen", "raffstore", "insekten", "plissee"], fk: "art", typ: "zahl", label: "Für wie viele Fenster?", einheit: "Stück", wert: 4, min: 1, max: 40 }
      ],
      preis: function (a) { var m = a.flaeche || 15, n = a.anzahl || 4;
        return { terrassendach: [m * 450, m * 700], markise: [2500, 6500], rollladen: [n * 600, n * 1100], raffstore: [n * 1100, n * 1800], insekten: [n * 150, n * 350], plissee: [n * 200, n * 450], reparatur: [150, 600] }[a.art || "terrassendach"]; },
      enthalten: "Aufmaß, Lieferung, Montage, Einweisung",
      teurer: ["Motor und Funksteuerung", "Fundamente oder schwieriger Untergrund", "Elektroanschluss draußen", "Sondermaße"] },
    { id: "garten", label: "Garten, Pflaster & Zaun", bsp: "Pflaster, Terrasse, Zaun, Gartenpflege", gewerk: "Garten, Pflaster & Zaun", icon: "<path d=\"M12 21v-6\"/><path d=\"M12 15c-4 0-7-2.5-7-6a7 7 0 0 1 14 0c0 3.5-3 6-7 6z\"/><path d=\"M4 21h16\"/>",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["pflaster", "Pflaster oder Terrasse"], ["zaun", "Zaun"], ["anlegen", "Garten neu anlegen"], ["pflege", "Gartenpflege, Heckenschnitt"]] },
        { id: "flaeche", fuer: ["pflaster", "zaun", "anlegen"], fk: "art", typ: "zahl", label: "Fläche bzw. Zaunlänge", einheit: "m² / m", wert: 40, min: 2, max: 1000 }
      ],
      preis: function (a) { var m = a.flaeche || 40; return { pflaster: [m * 90, m * 150], zaun: [m * 90, m * 160], anlegen: [m * 40, m * 90], pflege: [300, 1500] }[a.art || "pflaster"]; },
      enthalten: "Material, Erdarbeiten, Verlegen bzw. Montage, Entsorgung",
      teurer: ["schlechter Boden, viel Aushub", "Hanglage oder Stützmauern", "Entwässerung"] }
  ];
  /* ---------- Genauer nachfragen: Zusatzfragen je Gewerk und Art ----------
     wenn: { frage: [Werte] } – die Frage erscheint nur, wenn alle Bedingungen passen.
     Optionen: [Wert, Text, Faktor auf die Preisspanne]; std = Vorauswahl. */
  var WN = ["unklar", "Weiß ich noch nicht", 1];
  function w(id, label, wenn, optionen, std) { return { id: id, typ: "wahl", label: label, wenn: wenn, optionen: optionen, std: std }; }
  var MEHR = {
    bad: [
      w("dusche", "Dusche oder Badewanne?", { umfang: ["komplett", "teil", "barrierefrei"] }, [["bodengleich", "Bodengleiche Dusche", 1.05], ["wanne_d", "Dusche mit flacher Duschwanne", 1], ["badewanne", "Badewanne", 1], ["beides", "Dusche und Badewanne", 1.12]], "bodengleich"),
      w("wc", "Welches WC?", { umfang: ["komplett", "barrierefrei"] }, [["wand", "Wand-WC (hängend)", 1], ["stand", "Stand-WC", 0.97], ["dusch", "Dusch-WC", 1.08]], "wand"),
      w("fbh", "Fußbodenheizung im Bad?", { umfang: ["komplett", "barrierefrei"] }, [["nein", "Nein", 1], ["elektrisch", "Ja, elektrisch", 1.04], ["wasser", "Ja, an der Heizung", 1.06], WN], "nein"),
      w("problem", "Was ist kaputt?", { umfang: ["reparatur"] }, [["hahn", "Wasserhahn tropft"], ["spuelung", "WC-Spülung läuft oder spült nicht"], ["abfluss", "Abfluss verstopft"], ["leck", "Etwas ist undicht"], ["sonst", "Etwas anderes"]], "hahn")
    ],
    heizung: [
      w("bisher", "Womit heizen Sie heute?", { art: ["waermepumpe", "gas"] }, [["gas", "Gas", 1], ["oel", "Öl (Tank muss raus)", 1.06], ["strom", "Nachtspeicher oder Strom", 1.2], ["neubau", "Neubau, noch keine Heizung", 0.9]], "gas"),
      w("ww", "Soll die Wärmepumpe auch das Warmwasser machen?", { art: ["waermepumpe"] }, [["ja", "Ja", 1], ["nein", "Nein, Warmwasser bleibt getrennt", 0.95]], "ja"),
      w("aussen", "Wo könnte das Außengerät stehen?", { art: ["waermepumpe"] }, [["garten", "Im Garten oder am Haus auf dem Boden", 1], ["wand", "An der Wand oder auf dem Flachdach", 1.05], WN], "garten"),
      w("raeume", "Wie viele Räume sollen gekühlt werden?", { art: ["klima"] }, [["1", "1 Raum", 1], ["2", "2 Räume", 1.45], ["3", "3 Räume", 1.9]], "1"),
      w("weg", "Wie weit ist es vom Raum nach draußen?", { art: ["klima"] }, [["kurz", "Außenwand direkt am Raum", 1], ["lang", "Über mehrere Räume oder Etagen", 1.15], WN], "kurz"),
      w("problem", "Was ist los?", { art: ["reparatur"] }, [["aus", "Heizung ist ausgefallen"], ["kalt", "Heizkörper werden nicht warm"], ["geraeusch", "Geräusche oder Fehlermeldung"], ["wartung", "Wartung ist fällig"]], "aus")
    ],
    elektro: [
      w("kw", "Welche Ladeleistung?", { art: ["wallbox"] }, [["11", "11 kW (reicht für fast alle Autos)", 1], ["22", "22 kW (genehmigungspflichtig)", 1.15]], "11"),
      w("abstand", "Wie weit ist es vom Zählerschrank bis zum Stellplatz?", { art: ["wallbox"] }, [["kurz", "Unter 10 m", 1], ["mittel", "10 bis 25 m", 1.2], ["lang", "Über 25 m", 1.45], WN], "kurz"),
      w("pvladen", "Mit Solarstrom laden (PV-Überschuss)?", { art: ["wallbox"] }, [["nein", "Nein", 1], ["ja", "Ja, PV-Anlage ist vorhanden", 1.08]], "nein"),
      w("alter", "Wie alt ist die Elektrik?", { art: ["zaehler", "neu"] }, [["alt", "Vor 1990", 1.15], ["mittel", "1990 bis 2010", 1], WN], "mittel"),
      w("plaetze", "Wie viele Zähler?", { art: ["zaehler"] }, [["1", "Einer", 1], ["2", "Zwei (z. B. für Wärmepumpe oder PV)", 1.2]], "1"),
      w("smart", "Smart Home gewünscht?", { art: ["neu"] }, [["nein", "Nein", 1], ["basis", "Ja, Licht und Rollläden per App", 1.15], ["knx", "Ja, umfassend (z. B. KNX)", 1.4]], "nein"),
      w("bewohnt", "Ist die Wohnung während der Arbeiten bewohnt?", { art: ["neu"] }, [["leer", "Nein, sie steht leer", 1], ["ja", "Ja", 1.1]], "leer"),
      w("was", "Was genau?", { art: ["klein"] }, [["steckdosen", "Steckdosen oder Schalter"], ["lampen", "Lampen anschließen"], ["aussen", "Außensteckdose oder Außenlicht"], ["sonst", "Etwas anderes"]], "steckdosen"),
      w("problem", "Was ist los?", { art: ["reparatur"] }, [["sicherung", "Sicherung oder FI fliegt raus"], ["raum", "Kein Strom in einem Raum"], ["defekt", "Steckdose oder Schalter defekt"], ["sonst", "Etwas anderes"]], "sicherung")
    ],
    solar: [
      w("dach", "Welches Dach?", { art: ["pv", "pvspeicher"] }, [["ziegel", "Ziegel oder Dachsteine", 1], ["blech", "Blech oder Trapez", 0.95], ["flach", "Flachdach", 1.05], ["schiefer", "Schiefer", 1.25]], "ziegel"),
      w("speicher", "Welche Speichergröße?", { art: ["pvspeicher", "speicher"] }, [["5", "Etwa 5 kWh (kleiner Haushalt)", 0.9], ["10", "Etwa 10 kWh (typisch)", 1], ["15", "15 kWh oder mehr (mit E-Auto oder Wärmepumpe)", 1.12], WN], "10"),
      w("zs", "Ist der Zählerschrank aktuell?", { art: ["pv", "pvspeicher", "speicher"] }, [["ja", "Ja, recht neu", 1], ["alt", "Eher alt, muss vermutlich neu", 1.12], WN], "ja"),
      w("wallbox", "Wallbox gleich mit einbauen?", { art: ["pv", "pvspeicher"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.1]], "nein"),
      w("ort", "Wo soll das Balkonkraftwerk hin?", { art: ["balkon"] }, [["gelaender", "Am Balkongeländer", 1], ["wand", "An der Hauswand", 1.1], ["boden", "Garten oder Flachdach (aufgeständert)", 1.15]], "gelaender")
    ],
    maler: [
      w("flaechen", "Was soll gestrichen werden?", { art: ["streichen"] }, [["beides", "Wände und Decken", 1], ["waende", "Nur Wände", 0.75]], "beides"),
      w("farbe", "Welche Farben?", { art: ["streichen", "tapezieren"] }, [["weiss", "Weiß", 1], ["farbig", "Ein Farbton", 1.1], ["mehrere", "Mehrere Farben oder Akzentwände", 1.15]], "weiss"),
      w("tapete", "Welche Tapete?", { art: ["tapezieren"] }, [["raufaser", "Raufaser", 1], ["vlies", "Glatte Vliestapete", 1.1], ["muster", "Muster- oder Fototapete", 1.3]], "raufaser"),
      w("hoehe", "Wie hoch sind die Räume?", { art: ["streichen", "tapezieren"] }, [["normal", "Normal (bis 2,70 m)", 1], ["hoch", "Altbau, höher als 2,80 m", 1.2]], "normal"),
      w("geschosse", "Wie viele Stockwerke hat das Haus?", { art: ["fassade"] }, [["2", "1 bis 2", 1], ["3", "3 oder mehr", 1.15]], "2"),
      w("risse", "Hat die Fassade Risse, Moos oder Algen?", { art: ["fassade"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.15], WN], "nein")
    ],
    fliesen: [
      w("raum", "In welchem Raum?", { art: ["boden", "wand"] }, [["bad", "Bad", 1.05], ["kueche", "Küche", 1], ["wohnen", "Flur oder Wohnraum", 1], ["aussen", "Terrasse oder Balkon", 1.2]], "bad"),
      w("alt", "Müssen alte Fliesen runter?", { art: ["boden", "wand"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.15], WN], "nein")
    ],
    boden: [
      w("alt", "Was liegt heute?", { art: ["vinyl", "laminat", "parkett"] }, [["estrich", "Nichts (Estrich)", 1], ["teppich", "Teppich", 1.05], ["fliesen", "Fliesen (bleiben drunter)", 1.03], ["holz", "Parkett oder Dielen", 1.05]], "estrich"),
      w("verlegung", "Welche Parkett-Art?", { art: ["parkett"] }, [["diele", "Landhausdiele", 1], ["fisch", "Fischgrät", 1.35]], "diele"),
      w("leisten", "Neue Sockelleisten?", { art: ["vinyl", "laminat", "parkett"] }, [["ja", "Ja", 1], ["nein", "Nein, die alten bleiben", 0.94]], "ja"),
      w("moebel", "Sollen Möbel gerückt werden?", { art: ["vinyl", "laminat", "parkett", "schleifen"] }, [["nein", "Nein, Räume sind leer", 1], ["ja", "Ja", 1.05]], "nein"),
      w("zustand", "Wie sieht das Parkett aus?", { art: ["schleifen"] }, [["leicht", "Leichte Gebrauchsspuren", 1], ["stark", "Tiefe Kratzer oder Flecken", 1.15]], "leicht"),
      w("finish", "Versiegeln oder ölen?", { art: ["schleifen"] }, [["lack", "Versiegeln", 1], ["oel", "Ölen", 1.05], WN], "lack")
    ],
    trockenbau: [
      w("tuer", "Kommt eine Tür in die Wand?", { art: ["wand"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.12]], "nein"),
      w("schall", "Wie wichtig ist Schallschutz?", { art: ["wand", "decke"] }, [["normal", "Normal", 1], ["hoch", "Sehr wichtig (z. B. Schlafzimmer, Büro)", 1.15]], "normal"),
      w("spots", "Sollen Spots in die Decke?", { art: ["decke"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.12]], "nein"),
      w("daemmung", "Ist das Dach schon gedämmt?", { art: ["dach"] }, [["ja", "Ja", 0.85], ["nein", "Nein", 1], WN], "nein"),
      w("estrichart", "Welcher Estrich?", { art: ["estrich"] }, [["zement", "Zementestrich", 1], ["fliess", "Fließestrich", 1.1], ["trocken", "Trockenestrich (schnell, für Altbau)", 1.15], WN], "zement"),
      w("fbh", "Kommt eine Fußbodenheizung darunter?", { art: ["estrich"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.1]], "nein")
    ],
    schreiner: [
      w("ort", "Wo soll der Schrank hin?", { art: ["schrank"] }, [["wand", "An eine gerade Wand", 1], ["nische", "In eine Nische oder Dachschräge", 1.1]], "wand"),
      w("breite", "Wie breit ungefähr?", { art: ["schrank"] }, [["2", "Bis 2 m", 0.8], ["3", "2 bis 3 m", 1], ["4", "Über 3 m", 1.35]], "3"),
      w("front", "Welche Fronten?", { art: ["schrank", "kueche"] }, [["lack", "Lack, z. B. weiß", 1], ["furnier", "Holzfurnier", 1.2], ["massiv", "Massivholz", 1.4]], "lack"),
      w("form", "Welche Küchenform?", { art: ["kueche"] }, [["zeile", "Küchenzeile", 0.75], ["l", "L-Form", 1], ["u", "U-Form", 1.2], ["insel", "Mit Kochinsel", 1.35]], "l"),
      w("geraete", "Neue Elektrogeräte dazu?", { art: ["kueche"] }, [["ja", "Ja", 1], ["nein", "Nein, die alten bleiben", 0.8]], "ja"),
      w("platte", "Welche Arbeitsplatte?", { art: ["kueche"] }, [["laminat", "Laminat", 0.9], ["holz", "Holz", 1], ["stein", "Stein oder Keramik", 1.2]], "holz"),
      w("tform", "Welche Treppenform?", { art: ["treppe"] }, [["gerade", "Gerade", 0.85], ["viertel", "Mit einer Kurve (viertelgewendelt)", 1], ["halb", "Halbgewendelt", 1.15], ["spindel", "Spindeltreppe", 1.1]], "viertel"),
      w("holz", "Welches Material?", { art: ["treppe"] }, [["buche", "Buche", 0.9], ["eiche", "Eiche", 1], ["stahl", "Stahl mit Holzstufen", 1.2]], "eiche"),
      w("ausf", "Welche Türen?", { art: ["tueren"] }, [["weiss", "Weiß lackiert", 1], ["holz", "Holzfurnier", 1.1], ["glas", "Glastüren", 1.15]], "weiss"),
      w("zarge", "Neue Zargen (Türrahmen)?", { art: ["tueren"] }, [["ja", "Ja", 1], ["nein", "Nein, nur das Türblatt", 0.6]], "ja")
    ],
    dach: [
      w("dform", "Welche Dachform?", { art: ["neu", "daemmung"] }, [["sattel", "Satteldach", 1], ["walm", "Walmdach", 1.12], ["flach", "Flachdach", 1.05]], "sattel"),
      w("deckung", "Womit soll gedeckt werden?", { art: ["neu", "daemmung"] }, [["ton", "Tondachziegel", 1], ["beton", "Betondachsteine", 0.92], ["metall", "Metall", 1.1], ["schiefer", "Schiefer", 1.4]], "ton"),
      w("rmat", "Welches Material?", { art: ["rinne"] }, [["zink", "Titanzink", 1], ["kupfer", "Kupfer", 1.6], ["kunststoff", "Kunststoff", 0.7]], "zink"),
      w("dfz", "Wie viele Dachfenster?", { art: ["dachfenster"] }, [["1", "Eins", 1], ["2", "Zwei", 1.9], ["3", "Drei", 2.7]], "1"),
      w("dfbed", "Wie sollen sie öffnen?", { art: ["dachfenster"] }, [["hand", "Von Hand", 1], ["elektro", "Elektrisch oder mit Solar", 1.3]], "hand"),
      w("dfroll", "Mit Rollladen oder Hitzeschutz?", { art: ["dachfenster"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.25]], "nein"),
      w("problem", "Was ist los?", { art: ["reparatur"] }, [["undicht", "Es ist undicht"], ["sturm", "Sturmschaden"], ["ziegel", "Ziegel verrutscht oder kaputt"], ["rinne", "Dachrinne"]], "undicht")
    ],
    fenster: [
      w("glas", "Welche Verglasung?", { art: ["fenster"] }, [["3", "3-fach (Standard heute)", 1], ["2", "2-fach", 0.92], ["schall", "Mit Schall- oder Einbruchschutz", 1.15], WN], "3"),
      w("groesse", "Gibt es bodentiefe Fenster?", { art: ["fenster"] }, [["nein", "Nein, normale Fenster", 1], ["einige", "Einige", 1.12], ["viele", "Viele", 1.25]], "nein"),
      w("roll", "Rollläden mit dazu?", { art: ["fenster"] }, [["nein", "Nein", 1], ["gurt", "Ja, mit Gurtband", 1.12], ["elektro", "Ja, elektrisch", 1.22], ["smart", "Ja, mit Smart Home / App", 1.28]], "nein"),
      w("htmat", "Welches Material?", { art: ["haustuer"] }, [["alu", "Aluminium", 1], ["kunststoff", "Kunststoff", 0.75], ["holz", "Holz", 1.05]], "alu"),
      w("seitenteil", "Mit Seitenteil?", { art: ["haustuer"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.3]], "nein"),
      w("schloss", "Öffnen mit Fingerabdruck oder App?", { art: ["haustuer"] }, [["nein", "Nein, Schlüssel reicht", 1], ["ja", "Ja", 1.12]], "nein"),
      w("torart", "Welches Tor?", { art: ["garagentor"] }, [["sektional", "Sektionaltor", 1], ["schwing", "Schwingtor", 0.7], ["roll", "Rolltor", 1.05]], "sektional"),
      w("torantrieb", "Mit Antrieb?", { art: ["garagentor"] }, [["elektro", "Ja, mit Handsender", 1], ["app", "Ja, mit App", 1.08], ["hand", "Nein, von Hand", 0.75]], "elektro"),
      w("garage", "Wie breit ist die Garage?", { art: ["garagentor"] }, [["einzel", "Einzelgarage", 1], ["doppel", "Doppelgarage", 1.4]], "einzel")
    ],
    sonnenschutz: [
      w("eindeckung", "Womit soll das Dach gedeckt sein?", { art: ["terrassendach"] }, [["glas", "Glas (Sicherheitsglas)", 1], ["poly", "Polycarbonat (Stegplatten)", 0.8], ["lamellen", "Drehbare Lamellen", 1.6]], "glas"),
      w("seiten", "Seitenwände dazu?", { art: ["terrassendach"] }, [["nein", "Nein, offen", 1], ["keil", "Seitenteil oder Keil", 1.15], ["schiebe", "Glas-Schiebewände (Sommergarten)", 1.45]], "nein"),
      w("beschattung", "Beschattung am Dach?", { art: ["terrassendach"] }, [["nein", "Nein", 1], ["unter", "Markise unter dem Dach", 1.15], ["auf", "Markise auf dem Dach", 1.18]], "nein"),
      w("led", "LED-Beleuchtung?", { art: ["terrassendach"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.04]], "nein"),
      w("fundament", "Gibt es schon eine feste Terrasse?", { art: ["terrassendach"] }, [["ja", "Ja", 1], ["nein", "Nein, Fundamente müssen neu", 1.08]], "ja"),
      w("mart", "Welche Markise?", { art: ["markise"] }, [["kassette", "Kassettenmarkise (Tuch geschützt)", 1], ["halb", "Halbkassette", 0.85], ["offen", "Offene Gelenkarmmarkise", 0.7]], "kassette"),
      w("mbreite", "Wie breit ungefähr?", { art: ["markise"] }, [["4", "Bis 4 m", 0.85], ["6", "4 bis 6 m", 1], ["7", "Über 6 m", 1.35]], "6"),
      w("einbau", "Welcher Einbau?", { art: ["rollladen"] }, [["vorbau", "Vorbaurollladen (Kasten außen, nachrüstbar)", 1], ["aufsatz", "Aufsatzrollladen (zusammen mit neuen Fenstern)", 1.05], ["panzer", "Kasten ist da, nur Rollladen erneuern", 0.6]], "vorbau"),
      w("lamelle", "Welche Lamellen?", { art: ["rollladen"] }, [["alu", "Aluminium", 1], ["kunststoff", "Kunststoff", 0.85]], "alu"),
      w("bedienung", "Wie soll der Rollladen bedient werden?", { art: ["rollladen"] }, [["gurt", "Mit Gurtband", 0.8], ["kurbel", "Mit Kurbel", 0.85], ["elektro", "Elektrisch mit Schalter", 1], ["funk", "Elektrisch mit Funk-Fernbedienung", 1.08], ["smart", "Smart Home / App mit Zeitschaltung", 1.15]], "elektro"),
      w("steuerung", "Wie soll der Motor gesteuert werden?", { art: ["motor"] }, [["schalter", "Mit Schalter an der Wand", 1], ["funk", "Mit Funk-Fernbedienung", 1.1], ["smart", "Smart Home / App mit Zeitschaltung", 1.2]], "funk"),
      w("rlamelle", "Welche Lamellen?", { art: ["raffstore"] }, [["80", "80 mm gebördelt (Standard)", 1], ["z90", "Z-Lamelle 90 mm (dunkelt besser ab)", 1.08], ["flach", "Flach 60 mm", 0.92]], "80"),
      w("antrieb", "Wie soll es bedient werden?", { art: ["raffstore", "markise", "screen"] }, [["elektro", "Elektrisch mit Schalter", 1], ["funk", "Elektrisch mit Funk-Fernbedienung", 1.08], ["smart", "Smart Home / App", 1.15], ["kurbel", "Mit Kurbel", 0.85]], "funk"),
      w("sensor", "Sonnen- und Windwächter dazu?", { art: ["raffstore", "markise", "screen"] }, [["nein", "Nein", 1], ["ja", "Ja, fährt automatisch ein und aus", 1.08]], "nein"),
      w("groesse", "Wie groß sind die Fenster?", { art: ["rollladen", "motor", "raffstore", "insekten", "plissee"] }, [["normal", "Normale Fenster", 1], ["boden", "Bodentief (Terrassentür)", 1.3], ["gemischt", "Gemischt", 1.15]], "normal"),
      w("strom", "Gibt es Strom am Fenster bzw. an der Wand?", { art: ["rollladen", "motor", "raffstore", "markise", "screen"] }, [["ja", "Ja", 1], ["nein", "Nein, Strom muss gelegt werden", 1.1], ["manuell", "Nicht nötig (Gurt oder Kurbel)", 1], WN], "ja"),
      w("iart", "Welcher Insektenschutz?", { art: ["insekten"] }, [["spann", "Spannrahmen (zum Einhängen)", 1], ["dreh", "Drehrahmen für Türen", 1.6], ["rollo", "Rollo", 1.5], ["schiebe", "Schiebeanlage", 2], ["plissee", "Plissee-Tür", 2.2]], "spann"),
      w("gewebe", "Welches Gewebe?", { art: ["insekten"] }, [["standard", "Standard", 1], ["pollen", "Pollenschutz", 1.25], ["tier", "Reißfest für Haustiere", 1.2]], "standard"),
      w("befestigung", "Wie soll das Plissee befestigt werden?", { art: ["plissee"] }, [["kleben", "Ohne Bohren (an der Glasleiste)", 1], ["klemm", "Mit Klemmträgern", 0.9], ["bohren", "Gebohrt", 1]], "kleben"),
      w("stoff", "Welcher Stoff?", { art: ["plissee"] }, [["standard", "Lichtdurchlässig", 1], ["dunkel", "Verdunkelnd", 1.15], ["wabe", "Wabe mit Hitzeschutz", 1.3]], "standard"),
      w("pbed", "Bedienung?", { art: ["plissee"] }, [["griff", "Mit Griff", 1], ["elektro", "Elektrisch", 1.9]], "griff"),
      w("problem", "Was ist kaputt?", { art: ["reparatur"] }, [["gurt", "Gurtband gerissen"], ["motor", "Motor läuft nicht"], ["lamellen", "Lamellen hängen oder sind schief"], ["tuch", "Markisentuch kaputt"], ["sonst", "Etwas anderes"]], "gurt")
    ],
    garten: [
      w("pmat", "Welches Material?", { art: ["pflaster"] }, [["beton", "Betonpflaster", 1], ["platten", "Terrassenplatten (Feinsteinzeug)", 1.3], ["natur", "Naturstein", 1.5], ["holz", "Holz oder WPC", 1.15]], "beton"),
      w("untergrund", "Was ist heute dort?", { art: ["pflaster"] }, [["rasen", "Rasen oder Erde", 1], ["alt", "Alter Belag muss raus", 1.12]], "rasen"),
      w("zufahrt", "Kommt ein Minibagger hin?", { art: ["pflaster", "anlegen"] }, [["ja", "Ja", 1], ["nein", "Nein, nur mit Schubkarre", 1.15], WN], "ja"),
      w("zart", "Welcher Zaun?", { art: ["zaun"] }, [["doppelstab", "Doppelstabmatten", 1], ["holz", "Holz", 1.15], ["sicht", "Sichtschutz (WPC oder Alu)", 1.6], ["gabionen", "Gabionen", 1.9]], "doppelstab"),
      w("zhoehe", "Wie hoch?", { art: ["zaun"] }, [["120", "Bis 1,20 m", 0.9], ["180", "1,20 bis 1,80 m", 1], ["200", "Über 1,80 m", 1.2]], "180"),
      w("tor", "Mit Tor?", { art: ["zaun"] }, [["nein", "Nein", 1], ["garten", "Gartentor", 1.08], ["einfahrt", "Einfahrtstor", 1.25]], "nein"),
      w("rasen", "Rasen?", { art: ["anlegen"] }, [["saat", "Rasen säen", 0.85], ["roll", "Rollrasen", 1.1], ["kein", "Kein Rasen", 1]], "saat"),
      w("bewaesserung", "Automatische Bewässerung?", { art: ["anlegen"] }, [["nein", "Nein", 1], ["ja", "Ja", 1.15]], "nein"),
      w("pflegeart", "Wie oft?", { art: ["pflege"] }, [["einmal", "Einmalig", 1], ["regel", "Regelmäßig (übers Jahr)", 1.4]], "einmal"),
      w("hecke", "Hecken schneiden?", { art: ["pflege"] }, [["nein", "Keine oder kurze Hecke", 1], ["ja", "Lange oder hohe Hecke", 1.3]], "nein")
    ]
  };
  VORHABEN.forEach(function (v) { if (MEHR[v.id]) v.fragen = v.fragen.concat(MEHR[v.id]); });
  /* Sonnenschutz: Rollläden nachträglich auf Motor umrüsten */
  (function () { var v = VORHABEN.filter(function (x) { return x.id === "sonnenschutz"; })[0], art = v.fragen[0], p0 = v.preis;
    art.optionen.splice(3, 0, ["motor", "Rollläden auf Motor umrüsten"]);
    v.fragen.forEach(function (f) { if (f.id === "anzahl") f.fuer = f.fuer.concat(["motor"]); });
    v.preis = function (a) { return a.art === "motor" ? [(a.anzahl || 4) * 250, (a.anzahl || 4) * 450] : p0(a); }; })();
  /* ---------- Reparatur-Anfragen: in jedem Gewerk, eigener Einstieg auf der ersten Seite ---------- */
  var REP_BSP = { bad: "Hahn tropft, WC-Spülung, Abfluss verstopft", heizung: "Heizung aus, wird nicht warm, Wartung", elektro: "Sicherung fliegt raus, Steckdose defekt", solar: "Anlage liefert keinen Strom, Wartung",
    maler: "Risse, Wasserflecken ausbessern", fliesen: "Fliesen gesprungen, Fugen kaputt", boden: "Diele lose, Kratzer, Übergänge", trockenbau: "Löcher oder Risse in Wand und Decke", schreiner: "Tür klemmt, Scharnier, Schublade",
    dach: "Undicht, Sturmschaden, Ziegel verrutscht", fenster: "Fenster schließt nicht, Tür klemmt, Garagentor", sonnenschutz: "Gurt gerissen, Motor läuft nicht, Markise", garten: "Zaun, Pflaster abgesackt, Tor" };
  var REP_PROBLEM = {
    solar: [["strom", "Anlage liefert keinen Strom"], ["fehler", "Fehlermeldung am Wechselrichter"], ["speicher", "Speicher lädt nicht"], ["wartung", "Wartung oder Reinigung"]],
    maler: [["riss", "Risse"], ["fleck", "Wasser- oder Schimmelflecken"], ["putz", "Putz bröckelt"], ["sonst", "Etwas anderes"]],
    fliesen: [["gesprungen", "Fliesen gesprungen"], ["fugen", "Fugen oder Silikon kaputt"], ["hohl", "Fliesen klingen hohl oder lösen sich"], ["sonst", "Etwas anderes"]],
    boden: [["diele", "Diele oder Laminat lose"], ["kratzer", "Kratzer oder Wasserschaden"], ["uebergang", "Übergang oder Leiste"], ["sonst", "Etwas anderes"]],
    trockenbau: [["loch", "Loch in Wand oder Decke"], ["riss", "Risse"], ["wasser", "Wasserschaden"], ["sonst", "Etwas anderes"]],
    schreiner: [["tuer", "Tür klemmt oder schließt nicht"], ["scharnier", "Scharnier oder Schloss"], ["moebel", "Schrank oder Schublade"], ["treppe", "Treppe knarrt oder ist beschädigt"]],
    fenster: [["schliesst", "Fenster schließt nicht richtig"], ["zug", "Es zieht oder ist undicht"], ["glas", "Glas gesprungen"], ["tor", "Garagentor oder Haustür"]],
    garten: [["zaun", "Zaun beschädigt"], ["pflaster", "Pflaster abgesackt"], ["tor", "Tor klemmt"], ["sonst", "Etwas anderes"]]
  };
  (function () {
    var g = VORHABEN.filter(function (x) { return x.id === "garten"; })[0], p0 = g.preis;
    g.fragen[0].optionen.push(REP("Reparatur (z. B. Zaun, Pflaster, Tor)")); g.preis = function (a) { return a.art === "reparatur" ? [200, 900] : p0(a); };
    VORHABEN.forEach(function (v) {
      var k = v.id === "bad" ? "umfang" : "art", bed = {}; bed[k] = ["reparatur"]; v.repKey = k;
      if (REP_PROBLEM[v.id]) v.fragen.push(w("problem", "Was ist kaputt?", bed, REP_PROBLEM[v.id], REP_PROBLEM[v.id][0][0]));
      v.fragen.push(w("dringend", "Wie dringend ist es?", bed, [["notfall", "Notfall – heute noch (Notdienst-Zuschlag)", 1.5], ["woche", "In den nächsten Tagen", 1], ["egal", "Nicht eilig", 1]], "woche"));
      v.fragen.push({ id: "problemtext", typ: "text", wenn: bed, label: "Beschreiben Sie kurz, was los ist (freiwillig)", platzhalter: "z. B. seit gestern, nur im Bad, Fehlercode E5 …" });
    });
  })();
  function notfallTipp() {
    if (s.a.dringend !== "notfall") return "";
    var t = { bad: "Bei einem Wasserschaden: Hauptwasserhahn zudrehen und Strom in betroffenen Räumen ausschalten.", heizung: "Riecht es nach Gas: Fenster auf, keine Schalter betätigen, Haus verlassen und den Notruf Ihres Gasversorgers oder 112 anrufen.",
      elektro: "Bei Brandgeruch oder Funken: Sicherung ausschalten und Abstand halten. Bei Feuer 112.", dach: "Bei Sturmschaden: Abstand zum Haus halten, wenn Teile herabfallen können." }[s.vorhaben];
    return '<p class="p-hinweis p-notfall"><b>Notfall:</b> Ihr Betrieb meldet sich so schnell wie möglich. ' + (t ? esc(t) : "") + "</p>";
  }
  /* ---------- Konfigurator & AR für die Kundschaft ---------- */
  var KONF = {   // Vorhaben → Art → passende Produkte (erstes = Vorschlag)
    bad: { _: ["dusche", "waschtisch", "wc", "badewanne", "handtuchheizkoerper"] },
    heizung: { waermepumpe: ["waermepumpe", "heizkoerper", "pufferspeicher"], gas: ["gastherme", "heizkoerper"], klima: ["klimageraet"] },
    elektro: { wallbox: ["wallbox"], zaehler: ["zaehlerschrank"] },
    solar: { pvspeicher: ["stromspeicher"], speicher: ["stromspeicher"], balkon: ["balkonkraftwerk"] },
    maler: { streichen: ["wandgestaltung"], tapezieren: ["wandgestaltung"] },
    fliesen: { boden: ["fliese"], wand: ["fliese"] },
    boden: { vinyl: ["bodenbelag"], laminat: ["bodenbelag"], parkett: ["bodenbelag"] },
    trockenbau: { wand: ["trennwand"] },
    schreiner: { schrank: ["einbauschrank"], kueche: ["kueche"], treppe: ["treppe"], tueren: ["innentuer"] },
    dach: { dachfenster: ["dachfenster"] },
    fenster: { fenster: ["fenster", "schiebetuer"], haustuer: ["haustuer"], garagentor: ["garagentor"] },
    sonnenschutz: { terrassendach: ["terrassendach", "lamellendach"], markise: ["markise", "screen"], rollladen: ["rollladen"], motor: ["rollladen"], raffstore: ["raffstore"], insekten: ["insektenschutz"], plissee: ["plissee"] },
    garten: { pflaster: ["pflaster"], zaun: ["zaun"], anlegen: ["hochbeet", "gartenhaus", "sonnensegel"] }
  };
  function konfPids() {
    var m = KONF[s.vorhaben]; if (!m || nurRep()) return [];
    if (m._) return s.a.umfang === "reparatur" ? [] : m._;
    var a = s.a.art || (vh().fragen[0].std || vh().fragen[0].optionen[0][0]); return m[a] || [];
  }
  function sonderTipp() {   // passende Sonderangebote (gleiches Gewerk, ggf. gleiches Produkt)
    if (!window.SONDER || nurRep()) return "";
    var pids = konfPids(), L = SONDER.laden().filter(function (x) { return x.status === "aktiv" && x.gw === s.vorhaben; });
    var genau = L.filter(function (x) { return pids.indexOf(x.pid) > -1; }), zeig = genau.length ? genau : L; if (!zeig.length) return "";
    return '<a class="p-sonder" href="sonderangebote.html#' + zeig[0].id + '" target="_blank" rel="noopener"><b>' + (zeig.length === 1 ? "Passendes Sonderangebot" : zeig.length + " passende Sonderangebote") + ":</b> " + esc(zeig[0].titel) + " für " + esc(SONDER.preisText(zeig[0]).haupt) + " – ansehen →</a>";
  }
  function konfBox() {
    var pids = konfPids(); if (!pids.length || !window.KonfigKunde) return "";
    var k = s.konfig && pids.indexOf(s.konfig.pid) > -1 ? s.konfig : null;
    return '<div class="p-konf">' + (k ? '<div class="kk-karte"><span class="kk-bild">' + k.svg + "</span><div><small>Ihre Auswahl</small><b>" + esc(k.name) + "</b><small>" + esc(k.mass) + " · Richtwert ca. " + euro.format(k.richtpreis.typ) + "</small>" +
        '<div class="kk-knoepfe"><button class="btn btn-outline" type="button" data-p-konf>Ändern oder im Raum ansehen</button><button class="btn-link" type="button" data-p-konf-weg>Entfernen</button></div></div></div>' :
      '<div class="p-konf-leer"><b>Wie soll es aussehen?</b><p>Stellen Sie Ihr Produkt zusammen – Maße, Farbe, Ausstattung – und sehen Sie es auf dem Handy in Originalgröße in Ihrem Raum (AR). Freiwillig, hilft dem Betrieb aber sehr.</p><button class="btn btn-outline" type="button" data-p-konf>' +
        svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>') + "Produkt zusammenstellen &amp; im Raum ansehen</button></div>") + "</div>";
  }
  function konfKlick(t) {
    if (t.closest("[data-p-konf-weg]")) { s.konfig = null; var b0 = document.getElementById("p-konf"); if (b0) b0.innerHTML = konfBox(); return true; }
    if (!t.closest("[data-p-konf]")) return false;
    lesen();
    window.KonfigKunde.oeffnen({ pids: konfPids(), pid: s.konfig ? s.konfig.pid : null, cfg: s.konfig ? s.konfig.cfg : null, titel: vh().label + ": Produkt zusammenstellen", knopf: "Für meine Anfrage übernehmen",
      onFertig: function (info) { s.konfig = info; var b = document.getElementById("p-konf"); if (b) b.innerHTML = konfBox(); } });
    return true;
  }
  var ZEIT = [["sofort", "So schnell wie möglich"], ["3m", "In den nächsten 3 Monaten"], ["spaeter", "Später / noch in Planung"]];
  var ROLLE = [["eigen", "Im Eigentum"], ["mieter", "Mietpartei"], ["verwaltung", "Hausverwaltung"]];
  var BUDGET = [["ja", "Ja, das passt"], ["unklar", "Weiß ich noch nicht"], ["nein", "Eher nicht"]];
  var SCHRITTE = ["Vorhaben", "Details", "Fotos", "Preis", "Betrieb", "Kontakt"];

  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rund = function (n) { return n < 2000 ? Math.round(n / 50) * 50 : Math.round(n / 500) * 500; };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };

  function leer() { return { schritt: 0, vorhaben: null, a: {}, zeit: "3m", rolle: "eigen", plz: "", ort: "", fotos: [], name: "", tel: "", mail: "", text: "", budget: null, modus: "neu", konfig: null, betriebe: [], vergleich: false, wichtig: ["qualitaet", "preis"] }; }
  var s = leer();
  var $step = document.getElementById("portal-step"), $err = document.getElementById("portal-err");
  var $next = document.getElementById("p-next"), $back = document.getElementById("p-back");

  function stdVon(q) { return q.std || (q.id === "stufe" ? "gehoben" : q.optionen ? q.optionen[0][0] : ""); }
  function gilt(f) {   // Frage passt zu den bisherigen Antworten? (wenn: { frage: [Werte] }, auch verschachtelt)
    var bed = f.wenn; if (!bed && f.fuer) { bed = {}; bed[f.fk] = f.fuer; } if (!bed) return true;
    return Object.keys(bed).every(function (k) { var q = vh().fragen.filter(function (x) { return x.id === k; })[0]; if (q && q !== f && !gilt(q)) return false;
      var w = s.a[k] != null ? s.a[k] : q ? stdVon(q) : ""; return bed[k].indexOf(w) > -1; });
  }
  function vh() { return VORHABEN.filter(function (v) { return v.id === s.vorhaben; })[0]; }
  function wahl(name, opts, akt) {
    return '<div class="p-wahl" role="radiogroup">' + opts.map(function (o) {
      return '<label class="p-opt"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === akt ? " checked" : "") + "><span>" + esc(o[1]) + "</span></label>"; }).join("") + "</div>";
  }
  /* Preis: Grundspanne × Faktoren der gewählten Optionen */
  function preis() {
    var v = vh(), p = v.preis(s.a), f = 1;
    v.fragen.forEach(function (q) { if (!q.optionen || !gilt(q)) return; var w = s.a[q.id] || stdVon(q); var o = q.optionen.filter(function (x) { return x[0] === w; })[0]; if (o && o[2]) f *= o[2]; });
    var von = rund(p[0] * f), bis = rund(p[1] * f), typ = rund((p[0] + p[1]) / 2 * f);
    return { von: von, bis: bis, typ: typ, puffer: rund(bis * 1.1) };
  }
  function details() {
    return vh().fragen.filter(function (f) { return gilt(f) && f.typ !== "text"; }).map(function (f) {
      var w = s.a[f.id] != null ? s.a[f.id] : f.wert != null ? f.wert : f.optionen ? stdVon(f) : "";
      if (f.optionen) { var o = f.optionen.filter(function (x) { return x[0] === w; })[0]; w = o ? o[1].split(" – ")[0].replace(/\s*\([^)]*\)$/, "") : w; if (/^(Ja|Nein|Weiß ich noch nicht|Nicht nötig)$/.test(w)) w = ""; }
      return f.einheit ? w + " " + f.einheit : w;
    }).filter(function (x) { return String(x).trim(); }).join(" · ");
  }
  /* Note A/B/C mit Gründen */
  function note(p) {
    var c = [], b = [];
    if (s.budget === "nein") c.push("Budget passt laut Kunde nicht");
    if (s.zeit === "spaeter") c.push("noch in Planung – in 3 Monaten nachfragen");
    if (s.rolle === "mieter" && p.typ > 1500) c.push("Mietpartei – Zustimmung der Vermietung nötig");
    if (s.budget === "unklar") b.push("Budget noch unklar – kurz nachfragen");
    if (!s.fotos.length && s.a.art !== "reparatur" && s.a.umfang !== "reparatur") b.push("keine Fotos");
    if (!s.tel) b.push("nur E-Mail angegeben");
    return { note: c.length ? "C" : b.length ? "B" : "A", gruende: c.concat(b) };
  }

  function zeigen() {
    var html = "", v = vh();
    if (s.schritt === 0) {
      html = '<div class="p-modus" role="group" aria-label="Art der Anfrage"><button type="button" data-modus="neu" aria-pressed="' + (s.modus !== "rep") + '">Neues Vorhaben</button><button type="button" data-modus="rep" aria-pressed="' + (s.modus === "rep") + '">Etwas ist kaputt – Reparatur</button></div>' +
        "<h2>" + (s.modus === "rep" ? "Was ist kaputt?" : "Was haben Sie vor?") + "</h2>" + '<div class="p-tiles">' + VORHABEN.map(function (x) {
        return '<button type="button" class="p-tile' + (s.vorhaben === x.id ? " on" : "") + '" data-vh="' + x.id + '">' + svg(x.icon) + '<span class="p-tile-t"><b>' + esc(x.label) + "</b><small>" + esc(s.modus === "rep" ? REP_BSP[x.id] : x.bsp) + '</small></span><span class="p-pfeil" aria-hidden="true">›</span></button>'; }).join("") + "</div>";
    }
    if (s.schritt === 1) {
      html = "<h2>" + esc(v.label) + ": ein paar Details</h2>" + v.fragen.map(function (f) {
        var akt = s.a[f.id], q = function (h) { return h.replace('<div class="field"', '<div class="field" data-q="' + f.id + '"' + (gilt(f) ? "" : " hidden")); };
        if (f.typ === "zahl") return q('<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><div class="p-zahl"><input id="f-' + f.id + '" data-f="' + f.id + '" type="number" inputmode="decimal" min="' + f.min + '" max="' + f.max + '" value="' + (akt != null ? akt : f.wert) + '"><span>' + f.einheit + "</span></div></div>");
        if (f.typ === "text") return q('<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><textarea id="f-' + f.id + '" data-f="' + f.id + '" placeholder="' + esc(f.platzhalter) + '">' + esc(akt || "") + "</textarea></div>");
        return q('<div class="field"><span class="p-lab">' + f.label + "</span>" + wahl("f-" + f.id, f.optionen, akt || stdVon(f)) + "</div>");
      }).join("") +
      '<div class="field" data-zeitfrage' + (nurRep() ? " hidden" : "") + '><span class="p-lab">Wann soll es losgehen?</span>' + wahl("zeit", ZEIT, s.zeit) + "</div>" + '<div id="p-notfall">' + notfallTipp() + "</div>" + '<div id="p-konf">' + konfBox() + "</div>" + '<div id="p-sonder">' + sonderTipp() + "</div>" +
      '<div class="field"><span class="p-lab">Sie sind</span>' + wahl("rolle", ROLLE, s.rolle) + "</div>";
    }
    if (s.schritt === 2) {
      var gross = preis().typ > 5000;
      html = "<h2>Wo und wie sieht es aus?</h2>" +
        '<div class="p-row"><div class="field"><label for="p-plz">Postleitzahl</label><input id="p-plz" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="' + esc(s.plz) + '" placeholder="91052"></div>' +
        '<div class="field"><label for="p-ort">Ort</label><input id="p-ort" autocomplete="address-level2" value="' + esc(s.ort) + '" placeholder="Erlangen"></div></div>' +
        '<div class="field"><label for="p-text">Beschreibung <span class="opt">(freiwillig)</span></label><textarea id="p-text" placeholder="Was ist Ihnen wichtig? Besonderheiten?">' + esc(s.text) + "</textarea></div>" +
        '<div class="field"><span class="p-lab">Fotos ' + (gross ? "" : '<span class="opt">(freiwillig, hilft sehr)</span>') + "</span>" +
          (gross ? '<small class="p-sub">Bitte mindestens ein Foto: So kann Ihnen der Betrieb einen Richtpreis nennen, bevor er extra vorbeikommt.</small>' : "") +
          '<div class="p-fotos">' + s.fotos.map(function (f) { return '<img src="' + f + '" alt="Ihr Foto">'; }).join("") +
          '<label class="p-foto-add">' + svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>') + '<span>Foto hinzufügen</span><input type="file" accept="image/*" multiple id="p-foto" hidden></label></div></div>';
    }
    if (s.schritt === 3) {
      var p = preis(), hin = v.hinweis ? v.hinweis(s.a) : "";
      html = "<h2>Was kostet das ungefähr?</h2>" + (s.konfig && konfPids().indexOf(s.konfig.pid) > -1 ? '<p class="p-hinweis p-konf-preis">Ihre Auswahl „' + esc(s.konfig.name) + "“ (" + esc(s.konfig.mass) + "): Richtwert ca. " + euro.format(s.konfig.richtpreis.typ) + " inkl. MwSt. – der Betrieb sieht Ihre Auswahl.</p>" : "") + preisBox(p, v) + (hin ? '<p class="p-hinweis">' + esc(hin) + "</p>" : "") + notfallTipp() +
        '<div class="field p-budget"><span class="p-lab">Können Sie <b>bis zu ' + euro.format(p.bis) + "</b> für Ihr Vorhaben einplanen?</span>" + wahl("budget", BUDGET, s.budget) + "</div>" +
        '<div id="p-budget-tipp"></div>';
    }
    if (s.schritt === 4) html = betriebSchritt();
    if (s.schritt === 5) {
      html = "<h2>Wie erreicht Sie " + (s.betriebe.length > 1 ? "die Betriebe" : "der Betrieb") + "?</h2>" +
        '<div class="field"><label for="p-name">Name</label><input id="p-name" autocomplete="name" value="' + esc(s.name) + '"></div>' +
        '<div class="p-row"><div class="field"><label for="p-tel">Telefon <span class="opt">(empfohlen)</span></label><input id="p-tel" type="tel" autocomplete="tel" value="' + esc(s.tel) + '"></div>' +
        '<div class="field"><label for="p-mail">E-Mail</label><input id="p-mail" type="email" autocomplete="email" value="' + esc(s.mail) + '"></div></div>' +
        '<label class="p-check"><input type="checkbox" id="p-ok"> <span>Ich bin einverstanden, dass meine Angaben an ' + (s.betriebe.length > 1 ? "die von mir gewählten " + s.betriebe.length + " Fachbetriebe (" + esc(s.betriebe.join(", ")) + ")" : "den von mir gewählten Fachbetrieb (" + esc(s.betriebe[0] || "") + ")") + ' weitergegeben werden, damit er mich wegen meines Vorhabens kontaktiert. Details in der <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>.</span></label>';
    }
    $step.innerHTML = html;
    var ol = document.querySelector(".portal-steps");
    ol.innerHTML = SCHRITTE.map(function (t, i) { return '<li class="' + (i < s.schritt ? "done" : i === s.schritt ? "on" : "") + '">' + t + "</li>"; }).join("");
    $back.hidden = s.schritt === 0;
    $next.textContent = s.schritt === 5 ? "Kostenlos anfragen" : "Weiter";
    $err.textContent = "";
    budgetTipp();
  }
  function preisBox(p, v) {
    return '<div class="p-preis"><span>Typisch für ' + esc(v.label) + " · " + esc(details()) + "</span>" +
      "<b>rund " + euro.format(p.typ) + "</b>" +
      "<small>Die meisten Vorhaben dieser Art kosten zwischen " + euro.format(p.von) + " und " + euro.format(p.bis) + ". Planen Sie etwa 10 % Puffer ein (bis rund " + euro.format(p.puffer) + ").</small></div>" +
      '<div class="p-info"><p><b>Enthalten:</b> ' + esc(v.enthalten) + "</p><p><b>Teurer wird es bei:</b></p><ul>" + v.teurer.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<p class="portal-small">Unverbindliche Orientierung inkl. MwSt., kein Angebot. Den genauen Preis nennt Ihnen der Betrieb – zuerst als Richtpreis anhand Ihrer Fotos.</p></div>';
  }
  function budgetTipp() {
    var el = document.getElementById("p-budget-tipp"); if (!el) return;
    var r = document.querySelector('input[name="budget"]:checked');
    el.innerHTML = r && r.value === "nein" ? '<p class="p-tipp"><b>Tipp:</b> Oft hilft eine einfachere Ausstattung, eine Teilsanierung oder eine Förderung. Sie können oben bei „Details“ etwas ändern – oder die Anfrage trotzdem senden; wir melden uns dann mit Ideen, bevor ein Betrieb vorbeikommt.</p>' : "";
  }

  function lesen() {
    document.querySelectorAll("[data-f]").forEach(function (el) { var k = el.getAttribute("data-f"); s.a[k] = el.type === "number" ? parseFloat(String(el.value).replace(",", ".")) || 0 : el.value; });
    (vh() ? vh().fragen : []).forEach(function (f) { var r = document.querySelector('input[name="f-' + f.id + '"]:checked'); if (r) s.a[f.id] = r.value; });
    var z = document.querySelector('input[name="zeit"]:checked'); if (z) s.zeit = z.value;
    var r2 = document.querySelector('input[name="rolle"]:checked'); if (r2) s.rolle = r2.value;
    var b = document.querySelector('input[name="budget"]:checked'); if (b) s.budget = b.value;
    ["plz", "ort", "text", "name", "tel", "mail"].forEach(function (k) { var el = document.getElementById("p-" + k); if (el) s[k] = el.value.trim(); });
  }
  function pruefen() {
    if (s.schritt === 0 && !s.vorhaben) return "Bitte wählen Sie Ihr Vorhaben.";
    if (s.schritt === 2 && !/^\d{5}$/.test(s.plz)) return "Bitte geben Sie eine gültige Postleitzahl ein.";
    if (s.schritt === 2 && preis().typ > 5000 && !s.fotos.length) return "Bitte laden Sie mindestens ein Foto hoch – damit der Betrieb einen Richtpreis nennen kann.";
    if (s.schritt === 3 && !s.budget) return "Bitte beantworten Sie kurz die Frage zum Budget.";
    if (s.schritt === 4 && !s.betriebe.length) return "Bitte wählen Sie einen Betrieb.";
    if (s.schritt === 5) {
      if (!s.name) return "Bitte geben Sie Ihren Namen an.";
      if (!s.tel && !/@/.test(s.mail)) return "Bitte geben Sie Telefon oder E-Mail an.";
      if (!document.getElementById("p-ok").checked) return "Bitte stimmen Sie der Weitergabe an den gewählten Betrieb zu.";
    }
    return "";
  }

  /* ---------- Schritt „Betrieb“: passende Betriebe, Bewertungen, Vergleich (höchstens 3) ---------- */
  var WICHTIG = [["preis", "Preis wird eingehalten"], ["termin", "Schneller Termin"], ["qualitaet", "Qualität der Arbeit"], ["sauber", "Sauber & ordentlich"], ["kontakt", "Gut erreichbar"]];
  var VGL_MAX = 3, VGL_AB = 3000;
  function nurRep() { return s.a.art === "reparatur" || s.a.umfang === "reparatur"; }
  function istReparatur() { return s.a.art === "reparatur" || s.a.umfang === "reparatur" || s.a.art === "pflege" || s.a.art === "klein"; }
  function vergleichGrund() {   // null = Vergleich erlaubt, sonst Grund
    if (istReparatur()) return "Bei Reparaturen und Kleinaufträgen meldet sich ein Betrieb – das geht am schnellsten.";
    if (preis().typ < VGL_AB) return "Bei Vorhaben unter " + euro.format(VGL_AB) + " meldet sich ein Betrieb – so bleibt es für alle schnell und unkompliziert.";
    if (!s.fotos.length) return "Für einen Vergleich laden Sie bitte bei „Fotos“ mindestens ein Foto hoch – dann können alle Betriebe einen Richtpreis nennen, ohne extra rauszufahren.";
    if (s.budget === "nein") return "Ein Vergleich ist möglich, sobald das Budget zur Preisspanne passt. Wir melden uns gern mit Ideen.";
    return null;
  }
  function betriebeSortiert() {
    var w = s.wichtig.indexOf("termin") > -1 ? s.wichtig.filter(function (k) { return k !== "termin"; }).concat(["termin"]) : s.wichtig;
    return window.BETRIEBE.fuer(s.vorhaben).map(function (b) { var p = window.BETRIEBE.passt(b, w); if (s.wichtig.indexOf("termin") > -1) p = Math.round(p * 0.75 + (1 - (b.frei - 1) / 6) * 25); return { b: b, p: p }; })
      .sort(function (x, y) { return y.p - x.p; });
  }
  function sterne(n) { var v = Math.round(n); return '<span class="bt-sterne" aria-label="' + String(n).replace(".", ",") + ' von 5 Sternen">' + "★★★★★".slice(0, v) + '<span class="aus">' + "★★★★★".slice(v) + "</span></span>"; }
  function betriebSchritt() {
    var liste = betriebeSortiert(), grund = vergleichGrund();
    if (grund) s.vergleich = false;
    if (!s.betriebe.length || !liste.some(function (x) { return x.b.name === s.betriebe[0]; })) s.betriebe = [liste[0].b.name];
    var wahl = s.betriebe;
    return "<h2>Welcher Betrieb soll sich melden?</h2>" +
      '<div class="field"><span class="p-lab">Was ist Ihnen besonders wichtig?</span><div class="bt-chips">' + WICHTIG.map(function (w) { return '<button type="button" data-wichtig="' + w[0] + '" aria-pressed="' + (s.wichtig.indexOf(w[0]) > -1) + '">' + w[1] + "</button>"; }).join("") + "</div></div>" +
      (grund ? '<p class="bt-hinweis">' + esc(grund) + "</p>" :
        '<label class="p-check bt-vgl"><input type="checkbox" data-vergleich' + (s.vergleich ? " checked" : "") + "> <span><b>Angebote vergleichen</b> – bis zu " + VGL_MAX + " Betriebe auswählen. Es melden sich nur die Betriebe, die Sie auswählen.</span></label>") +
      '<div class="bt-liste">' + liste.map(function (x, i) {
        var b = x.b, an = wahl.indexOf(b.name) > -1, gesperrt = s.vergleich && b.keinVergleich && !an && wahl.length > 0;
        return '<article class="bt-karte' + (an ? " on" : "") + '"><div class="bt-kopf"><div><b>' + esc(b.name) + "</b>" + (i === 0 ? ' <span class="bt-tag">Passt am besten</span>' : "") +
            "<small>" + sterne(b.schnitt) + " " + String(b.schnitt).replace(".", ",") + " · " + b.anzahl + " geprüfte Bewertungen</small></div>" +
            '<div class="bt-passt" title="So gut passt der Betrieb zu dem, was Ihnen wichtig ist"><b>' + x.p + ' %</b><small>passt zu Ihnen</small></div></div>' +
          '<p class="bt-info">' + esc(b.ort) + " · ca. " + b.km + " km · frei " + (b.frei <= 1 ? "ab nächster Woche" : "in etwa " + b.frei + " Wochen") + (b.meister ? " · Meisterbetrieb" : "") + "</p>" +
          '<p class="bt-schwer">' + b.schwerpunkt.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>" +
          "<details><summary>Bewertungen ansehen</summary><div class=\"bt-noten\">" + window.BETRIEBE.KRIT.map(function (k) { var n = b.noten[k[0]]; return '<div class="' + (s.wichtig.indexOf(k[0]) > -1 ? "wichtig" : "") + '"><span>' + k[1] + '</span><i><em style="width:' + (n / 5 * 100) + '%"></em></i><b>' + String(n).replace(".", ",") + "</b></div>"; }).join("") + "</div>" +
            b.stimmen.map(function (m) { return '<blockquote class="bt-stimme">' + sterne(m.sterne) + " „" + esc(m.text) + "“<small>" + esc(m.wann) + " · Auftrag abgeschlossen und bezahlt</small></blockquote>"; }).join("") + '<p class="portal-small">Beispiel-Bewertungen (erfunden).</p></details>' +
          (b.keinVergleich && s.vergleich ? '<p class="bt-hinweis klein">Dieser Betrieb nimmt nur Anfragen ohne Vergleich an.</p>' : "") +
          '<button type="button" class="btn ' + (an ? "btn-signal" : "btn-outline") + ' bt-wahl" data-bt="' + esc(b.name) + '"' + (gesperrt ? " disabled" : "") + ' aria-pressed="' + an + '">' + (an ? "✓ Ausgewählt" : s.vergleich ? "Auch anfragen" : "Diesen Betrieb wählen") + "</button></article>";
      }).join("") + "</div>" +
      '<button type="button" class="btn btn-outline bt-schnell" data-schnellster>Egal – der Betrieb mit dem frühesten Termin</button>' +
      '<p class="portal-small bt-transparenz"><b>So sortieren wir:</b> nach den Bewertungen in den Punkten, die Ihnen wichtig sind, freien Terminen und Entfernung. Es gibt keine bezahlten Plätze. ' +
      "<b>Geprüfte Bewertungen:</b> Bewerten kann nur, wer über das Portal beauftragt hat – nach Abschluss der Arbeiten und wenn die Rechnung bezahlt ist.</p>";
  }
  function btKlick(t) {
    var el;
    if ((el = t.closest("[data-wichtig]"))) { var k = el.getAttribute("data-wichtig"), i = s.wichtig.indexOf(k); if (i > -1) s.wichtig.splice(i, 1); else s.wichtig.push(k); zeigen(); return true; }
    if (t.closest("[data-schnellster]")) { var l = betriebeSortiert().slice().sort(function (a, b) { return a.b.frei - b.b.frei || a.b.km - b.b.km; }); s.vergleich = false; s.betriebe = [l[0].b.name]; zeigen(); $err.textContent = ""; return true; }
    if ((el = t.closest("[data-bt]"))) {
      var n = el.getAttribute("data-bt"), b = window.BETRIEBE.fuer(s.vorhaben).filter(function (x) { return x.name === n; })[0];
      if (!s.vergleich) { s.betriebe = [n]; zeigen(); return true; }
      var j = s.betriebe.indexOf(n);
      if (j > -1) { if (s.betriebe.length > 1) s.betriebe.splice(j, 1); zeigen(); return true; }
      if (s.betriebe.length >= VGL_MAX) { zeigen(); $err.textContent = "Höchstens " + VGL_MAX + " Betriebe – so bekommt niemand unnötig Arbeit. Bitte zuerst einen abwählen."; return true; }
      var sperr = s.betriebe.concat([n]).map(function (x) { return window.BETRIEBE.fuer(s.vorhaben).filter(function (y) { return y.name === x; })[0]; }).filter(function (y) { return y && y.keinVergleich; })[0];
      if (sperr) { zeigen(); $err.textContent = sperr.name + " nimmt nur Anfragen ohne Vergleich an."; return true; }
      s.betriebe.push(n); zeigen(); return true;
    }
    return false;
  }
  function fertig() {
    var v = vh(), p = preis(), n = note(p);
    var alt0 = []; try { alt0 = JSON.parse(localStorage.getItem("portal-anfragen") || "[]"); } catch (e) { alt0 = []; }
    var schonVgl = s.betriebe.length > 1 && alt0.some(function (x) { return x.betriebe && x.betriebe.length > 1 && x.vorhaben === v.label && ((s.tel && x.tel === s.tel) || (s.mail && x.mail === s.mail)) && Date.now() - new Date(x.eingang).getTime() < 30 * 864e5; });
    if (schonVgl) s.betriebe = s.betriebe.slice(0, 1);
    var anfrage = { id: Date.now(), name: s.name, ort: s.ort || ("PLZ " + s.plz), plz: s.plz, vorhaben: v.label, gewerk: v.gewerk, details: details(),
      zeit: ZEIT.filter(function (z) { return z[0] === s.zeit; })[0][1], rolle: ROLLE.filter(function (r) { return r[0] === s.rolle; })[0][1],
      budget: BUDGET.filter(function (b) { return b[0] === s.budget; })[0][1], note: n.note, gruende: n.gruende,
      text: [s.a.problemtext, s.text].filter(function (x) { return x && String(x).trim(); }).join(" – "), fotos: s.fotos.length, empfehlung: window.EMPFEHLUNG || "", tel: s.tel, mail: s.mail, von: p.von, bis: p.bis, typ: p.typ, eingang: new Date().toISOString(), betriebe: s.betriebe.slice(), vergleich: s.betriebe.length, konfig: s.konfig && konfPids().indexOf(s.konfig.pid) > -1 ? { pid: s.konfig.pid, name: s.konfig.name, cfg: s.konfig.cfg, mass: s.konfig.mass, richtpreis: s.konfig.richtpreis.typ } : null, wichtig: s.wichtig.slice() };
    try { var alt = JSON.parse(localStorage.getItem("portal-anfragen") || "[]"); alt.push(anfrage); localStorage.setItem("portal-anfragen", JSON.stringify(alt.slice(-20))); } catch (e) { /* privat */ }
    /* Echter Versand, sobald in config.js eine Formspree-Adresse steht */
    var ep = String((window.SITE || {}).formEndpoint || "").trim(), gesendet = /^https:\/\//.test(ep);
    if (gesendet) {
      var fd = new FormData();
      fd.append("_subject", "Neue Anfrage im Auftragsportal: " + anfrage.vorhaben + " (Note " + anfrage.note + ")");
      Object.keys(anfrage).forEach(function (k) { fd.append(k, Array.isArray(anfrage[k]) ? anfrage[k].join("; ") : String(anfrage[k] == null ? "" : anfrage[k])); });
      fetch(ep, { method: "POST", body: fd, headers: { Accept: "application/json" } }).catch(function () {});
    }
    document.getElementById("portal-form").hidden = true;
    var d = document.getElementById("portal-done");
    d.hidden = false;
    var weiter = n.note === "C" ?
      "<h3>Wie geht es weiter?</h3><p>Wir schauen uns Ihr Vorhaben in Ruhe an und melden uns mit Ideen, wie es in Ihrem Rahmen klappen kann" + (s.zeit === "spaeter" ? " – oder wir fragen in einigen Wochen nach, wenn Ihre Planung konkreter ist" : "") + ". Erst dann vermitteln wir einen Betrieb.</p>" :
      "<h3>Wie geht es weiter?</h3>" + (schonVgl ? "<p class=\"bt-hinweis\">Sie hatten für dieses Vorhaben in den letzten 30 Tagen schon Vergleichsangebote angefragt. Deshalb geht diese Anfrage nur an " + esc(s.betriebe[0]) + ".</p>" : "") + "<ol class=\"p-weiter\"><li>Ihre Anfrage geht an " + (s.betriebe.length > 1 ? "<b>" + s.betriebe.length + " Betriebe</b>: " + esc(s.betriebe.join(", ")) + ". Haben Sie sich entschieden, sagen Sie den anderen in „Meine Vorhaben“ mit einem Klick ab." : "<b>" + esc(s.betriebe[0]) + "</b> – und an niemanden sonst.") + "</li><li>" + (s.betriebe.length > 1 ? "Jeder Betrieb meldet sich" : "Der Betrieb meldet sich") + " innerhalb von 24 Stunden (werktags) und nennt Ihnen anhand Ihrer Fotos einen <b>Richtpreis</b>.</li><li>Passt der Richtpreis, vereinbaren Sie eine Besichtigung und erhalten ein genaues Angebot. Den Auftrag vergeben Sie direkt an den Betrieb.</li></ol>" +
      (p.typ > 10000 ? '<p class="portal-small">Bei größeren Vorhaben kann der Betrieb für Besichtigung und Planung eine kleine Pauschale berechnen, die bei Auftrag angerechnet wird. Das sagt er Ihnen vorher.</p>' : "");
    d.innerHTML = '<span class="p-ok-ic">' + svg('<path d="M20 6 9 17l-5-5"/>') + "</span><h2>Danke, " + esc(s.name.split(" ")[0]) + "! Ihre Anfrage ist eingegangen.</h2>" +
      preisBox(p, v) + weiter +
      (gesendet ? "" : '<p class="portal-small demo-hint"><b>Beispielversion:</b> Es wurde nichts verschickt. Ihre Anfrage liegt nur in Ihrem Browser – in der <a href="demo.html#vermittlung">Demo unter „Betreiber“ → „Vermittlung“</a> sehen Sie, wie sie dort mit Note ' + n.note + " ankommt und vermittelt wird.</p>") +
      '<button class="btn btn-outline" type="button" id="p-neu">Weitere Anfrage stellen</button>';
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("click", function (e) {
    if (s.schritt === 4 && btKlick(e.target)) return;
    if (konfKlick(e.target)) return;
    var md = e.target.closest("[data-modus]"); if (md) { s.modus = md.getAttribute("data-modus"); zeigen(); return; }
    var t = e.target.closest("[data-vh]");
    if (t) { s.vorhaben = t.getAttribute("data-vh"); s.a = {}; s.budget = null; s.konfig = null; s.betriebe = []; s.vergleich = false; if (s.modus === "rep") { s.a[vh().repKey] = "reparatur"; s.zeit = "sofort"; s.wichtig = ["termin", "kontakt"]; } else s.wichtig = ["qualitaet", "preis"]; s.schritt = 1; zeigen(); return document.getElementById("portal-form").scrollIntoView({ block: "start", behavior: "smooth" }); }
    if (e.target.closest("#p-next")) { lesen(); var f = pruefen(); if (f) { $err.textContent = f; return; } if (s.schritt === 5) return fertig(); s.schritt++; zeigen(); if (s.schritt === 4) document.getElementById("portal-form").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (e.target.closest("#p-back")) { lesen(); s.schritt--; zeigen(); return; }
    if (e.target.closest("#p-neu")) { s = leer(); document.getElementById("portal-done").hidden = true; document.getElementById("portal-form").hidden = false; zeigen(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.name === "budget") { budgetTipp(); return; }
    if (e.target.hasAttribute && e.target.hasAttribute("data-vergleich")) { s.vergleich = e.target.checked; if (!s.vergleich) s.betriebe = s.betriebe.slice(0, 1); zeigen(); return; }
    if (/^f-/.test(e.target.name || "") && vh()) { lesen(); vh().fragen.forEach(function (f) { var el = document.querySelector('[data-q="' + f.id + '"]'); if (el) el.hidden = !gilt(f); });
      var zf = document.querySelector("[data-zeitfrage]"); if (zf) { zf.hidden = nurRep(); if (nurRep()) s.zeit = s.a.dringend === "egal" ? "3m" : "sofort"; }
      var nf = document.getElementById("p-notfall"); if (nf) nf.innerHTML = notfallTipp(); var kb = document.getElementById("p-konf"); if (kb) kb.innerHTML = konfBox(); var sb = document.getElementById("p-sonder"); if (sb) sb.innerHTML = sonderTipp(); return; }
    if (e.target.id !== "p-foto") return;
    lesen();
    Array.prototype.forEach.call(e.target.files || [], function (file) { s.fotos.push(URL.createObjectURL(file)); });
    zeigen();
  });
  zeigen();
})();
