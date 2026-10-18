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
  var ZEIT = [["sofort", "So schnell wie möglich"], ["3m", "In den nächsten 3 Monaten"], ["spaeter", "Später / noch in Planung"]];
  var ROLLE = [["eigen", "Im Eigentum"], ["mieter", "Mietpartei"], ["verwaltung", "Hausverwaltung"]];
  var BUDGET = [["ja", "Ja, das passt"], ["unklar", "Weiß ich noch nicht"], ["nein", "Eher nicht"]];
  var SCHRITTE = ["Vorhaben", "Details", "Ort & Fotos", "Preis", "Kontakt"];

  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rund = function (n) { return n < 2000 ? Math.round(n / 50) * 50 : Math.round(n / 500) * 500; };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };

  function leer() { return { schritt: 0, vorhaben: null, a: {}, zeit: "3m", rolle: "eigen", plz: "", ort: "", fotos: [], name: "", tel: "", mail: "", text: "", budget: null }; }
  var s = leer();
  var $step = document.getElementById("portal-step"), $err = document.getElementById("portal-err");
  var $next = document.getElementById("p-next"), $back = document.getElementById("p-back");

  function gilt(f) {   // Frage passt zur gewählten Art?
    if (!f.fuer) return true; var q = vh().fragen.filter(function (x) { return x.id === f.fk; })[0];
    var w = s.a[f.fk] != null ? s.a[f.fk] : q && q.optionen ? q.optionen[0][0] : ""; return f.fuer.indexOf(w) > -1;
  }
  function vh() { return VORHABEN.filter(function (v) { return v.id === s.vorhaben; })[0]; }
  function wahl(name, opts, akt) {
    return '<div class="p-wahl" role="radiogroup">' + opts.map(function (o) {
      return '<label class="p-opt"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === akt ? " checked" : "") + "><span>" + esc(o[1]) + "</span></label>"; }).join("") + "</div>";
  }
  /* Preis: Grundspanne × Faktoren der gewählten Optionen */
  function preis() {
    var v = vh(), p = v.preis(s.a), f = 1;
    v.fragen.forEach(function (q) { if (!q.optionen || !gilt(q)) return; var w = s.a[q.id] || (q.id === "stufe" ? "gehoben" : q.optionen[0][0]); var o = q.optionen.filter(function (x) { return x[0] === w; })[0]; if (o && o[2]) f *= o[2]; });
    var von = rund(p[0] * f), bis = rund(p[1] * f), typ = rund((p[0] + p[1]) / 2 * f);
    return { von: von, bis: bis, typ: typ, puffer: rund(bis * 1.1) };
  }
  function details() {
    return vh().fragen.filter(gilt).map(function (f) {
      var w = s.a[f.id] != null ? s.a[f.id] : f.wert != null ? f.wert : f.optionen ? f.optionen[0][0] : "";
      if (f.optionen) { var o = f.optionen.filter(function (x) { return x[0] === w; })[0]; w = o ? o[1].split(" – ")[0] : w; }
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
      html = "<h2>Was haben Sie vor?</h2>" + '<div class="p-tiles">' + VORHABEN.map(function (x) {
        return '<button type="button" class="p-tile' + (s.vorhaben === x.id ? " on" : "") + '" data-vh="' + x.id + '">' + svg(x.icon) + '<span class="p-tile-t"><b>' + esc(x.label) + "</b><small>" + esc(x.bsp) + '</small></span><span class="p-pfeil" aria-hidden="true">›</span></button>'; }).join("") + "</div>";
    }
    if (s.schritt === 1) {
      html = "<h2>" + esc(v.label) + ": ein paar Details</h2>" + v.fragen.map(function (f) {
        var akt = s.a[f.id], q = function (h) { return h.replace('<div class="field"', '<div class="field" data-q="' + f.id + '"' + (gilt(f) ? "" : " hidden")); };
        if (f.typ === "zahl") return q('<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><div class="p-zahl"><input id="f-' + f.id + '" data-f="' + f.id + '" type="number" inputmode="decimal" min="' + f.min + '" max="' + f.max + '" value="' + (akt != null ? akt : f.wert) + '"><span>' + f.einheit + "</span></div></div>");
        if (f.typ === "text") return q('<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><textarea id="f-' + f.id + '" data-f="' + f.id + '" placeholder="' + esc(f.platzhalter) + '">' + esc(akt || "") + "</textarea></div>");
        return q('<div class="field"><span class="p-lab">' + f.label + "</span>" + wahl("f-" + f.id, f.optionen, akt || (f.id === "stufe" ? "gehoben" : f.optionen[0][0])) + "</div>");
      }).join("") +
      '<div class="field"><span class="p-lab">Wann soll es losgehen?</span>' + wahl("zeit", ZEIT, s.zeit) + "</div>" +
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
      html = "<h2>Was kostet das ungefähr?</h2>" + preisBox(p, v) + (hin ? '<p class="p-hinweis">' + esc(hin) + "</p>" : "") +
        '<div class="field p-budget"><span class="p-lab">Können Sie <b>bis zu ' + euro.format(p.bis) + "</b> für Ihr Vorhaben einplanen?</span>" + wahl("budget", BUDGET, s.budget) + "</div>" +
        '<div id="p-budget-tipp"></div>';
    }
    if (s.schritt === 4) {
      html = "<h2>Wie erreicht Sie der Betrieb?</h2>" +
        '<div class="field"><label for="p-name">Name</label><input id="p-name" autocomplete="name" value="' + esc(s.name) + '"></div>' +
        '<div class="p-row"><div class="field"><label for="p-tel">Telefon <span class="opt">(empfohlen)</span></label><input id="p-tel" type="tel" autocomplete="tel" value="' + esc(s.tel) + '"></div>' +
        '<div class="field"><label for="p-mail">E-Mail</label><input id="p-mail" type="email" autocomplete="email" value="' + esc(s.mail) + '"></div></div>' +
        '<label class="p-check"><input type="checkbox" id="p-ok"> <span>Ich bin einverstanden, dass meine Angaben an <b>einen</b> geprüften Fachbetrieb aus meiner Region weitergegeben werden, damit er mich wegen meines Vorhabens kontaktiert. Details in der <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>.</span></label>';
    }
    $step.innerHTML = html;
    var ol = document.querySelector(".portal-steps");
    ol.innerHTML = SCHRITTE.map(function (t, i) { return '<li class="' + (i < s.schritt ? "done" : i === s.schritt ? "on" : "") + '">' + t + "</li>"; }).join("");
    $back.hidden = s.schritt === 0;
    $next.textContent = s.schritt === 4 ? "Kostenlos anfragen" : "Weiter";
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
    if (s.schritt === 1 && s.vorhaben === "reparatur" && !String(s.a.text || "").trim()) return "Bitte beschreiben Sie kurz, was gemacht werden soll.";
    if (s.schritt === 2 && !/^\d{5}$/.test(s.plz)) return "Bitte geben Sie eine gültige Postleitzahl ein.";
    if (s.schritt === 2 && preis().typ > 5000 && !s.fotos.length) return "Bitte laden Sie mindestens ein Foto hoch – damit der Betrieb einen Richtpreis nennen kann.";
    if (s.schritt === 3 && !s.budget) return "Bitte beantworten Sie kurz die Frage zum Budget.";
    if (s.schritt === 4) {
      if (!s.name) return "Bitte geben Sie Ihren Namen an.";
      if (!s.tel && !/@/.test(s.mail)) return "Bitte geben Sie Telefon oder E-Mail an.";
      if (!document.getElementById("p-ok").checked) return "Bitte stimmen Sie der Weitergabe an einen Fachbetrieb zu.";
    }
    return "";
  }

  function fertig() {
    var v = vh(), p = preis(), n = note(p);
    var anfrage = { id: Date.now(), name: s.name, ort: s.ort || ("PLZ " + s.plz), plz: s.plz, vorhaben: v.label, gewerk: v.gewerk, details: details(),
      zeit: ZEIT.filter(function (z) { return z[0] === s.zeit; })[0][1], rolle: ROLLE.filter(function (r) { return r[0] === s.rolle; })[0][1],
      budget: BUDGET.filter(function (b) { return b[0] === s.budget; })[0][1], note: n.note, gruende: n.gruende,
      text: s.text, fotos: s.fotos.length, empfehlung: window.EMPFEHLUNG || "", tel: s.tel, mail: s.mail, von: p.von, bis: p.bis, typ: p.typ, eingang: new Date().toISOString() };
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
      "<h3>Wie geht es weiter?</h3><ol class=\"p-weiter\"><li>Wir prüfen Ihre Anfrage und wählen <b>einen</b> passenden Fachbetrieb aus Ihrer Region.</li><li>Der Betrieb meldet sich innerhalb von 24 Stunden (werktags) und nennt Ihnen anhand Ihrer Fotos einen <b>Richtpreis</b>.</li><li>Passt der Richtpreis, vereinbaren Sie eine Besichtigung und erhalten ein genaues Angebot. Den Auftrag vergeben Sie direkt an den Betrieb.</li></ol>" +
      (p.typ > 10000 ? '<p class="portal-small">Bei größeren Vorhaben kann der Betrieb für Besichtigung und Planung eine kleine Pauschale berechnen, die bei Auftrag angerechnet wird. Das sagt er Ihnen vorher.</p>' : "");
    d.innerHTML = '<span class="p-ok-ic">' + svg('<path d="M20 6 9 17l-5-5"/>') + "</span><h2>Danke, " + esc(s.name.split(" ")[0]) + "! Ihre Anfrage ist eingegangen.</h2>" +
      preisBox(p, v) + weiter +
      (gesendet ? "" : '<p class="portal-small demo-hint"><b>Beispielversion:</b> Es wurde nichts verschickt. Ihre Anfrage liegt nur in Ihrem Browser – in der <a href="demo.html#vermittlung">Demo unter „Betreiber“ → „Vermittlung“</a> sehen Sie, wie sie dort mit Note ' + n.note + " ankommt und vermittelt wird.</p>") +
      '<button class="btn btn-outline" type="button" id="p-neu">Weitere Anfrage stellen</button>';
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-vh]");
    if (t) { s.vorhaben = t.getAttribute("data-vh"); s.a = {}; s.budget = null; s.schritt = 1; zeigen(); return document.getElementById("portal-form").scrollIntoView({ block: "start", behavior: "smooth" }); }
    if (e.target.closest("#p-next")) { lesen(); var f = pruefen(); if (f) { $err.textContent = f; return; } if (s.schritt === 4) return fertig(); s.schritt++; zeigen(); return; }
    if (e.target.closest("#p-back")) { lesen(); s.schritt--; zeigen(); return; }
    if (e.target.closest("#p-neu")) { s = leer(); document.getElementById("portal-done").hidden = true; document.getElementById("portal-form").hidden = false; zeigen(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.name === "budget") { budgetTipp(); return; }
    if (/^f-/.test(e.target.name || "") && vh()) { lesen(); vh().fragen.forEach(function (f) { var el = document.querySelector('[data-q="' + f.id + '"]'); if (el) el.hidden = !gilt(f); }); return; }
    if (e.target.id !== "p-foto") return;
    lesen();
    Array.prototype.forEach.call(e.target.files || [], function (file) { s.fotos.push(URL.createObjectURL(file)); });
    zeigen();
  });
  zeigen();
})();
