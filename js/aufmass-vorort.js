/* =====================================================================
   VOR-ORT-AUFMASS (gehört zu demo.html, ergänzt das Aufmaß in demo.js)
   ---------------------------------------------------------------------
   1. CHECKLISTEN je Gewerk und Art  ← hier Punkte ändern oder ergänzen
   2. Beispiel-Sprachnachrichten
   3. Auswertung: Text der Sprachnachricht → Felder
   4. Aufmaßzettel als PDF (ausfüllbar und zum Ausdrucken, ohne Fremdbibliothek)
   5. Beispielfotos und Perspektive (Produkt ins Foto setzen)
   6. Fenster „Vor-Ort-Aufmaß“ (braucht window.DEMO_AM aus demo.js)
   Alles läuft nur im Browser. Es wird nichts hochgeladen.
   ===================================================================== */
(function () {
  "use strict";
  var VO = window.AMVO = {};

  /* ---------- 1. CHECKLISTEN ----------
     N = Zahl mit Einheit, S = Auswahl, T = Text, J = ja / nein, FOTO = Foto abhaken
     w = warum der Punkt wichtig ist (steht klein darunter und auf dem Zettel) */
  function N(k, l, e, syn, w, min, max) { return { k: k, l: l, t: "n", e: e || "", syn: syn || [], w: w || "", min: min == null ? 0 : min, max: max == null ? 9999 : max }; }
  function S(k, l, o, syn, w) { return { k: k, l: l, t: "sel", o: o, syn: syn || [], w: w || "" }; }
  function T(k, l, syn, w) { return { k: k, l: l, t: "txt", syn: syn || [], w: w || "" }; }
  function J(k, l, syn, w) { return { k: k, l: l, t: "sel", o: ["ja", "nein"], ja: true, syn: syn || [], w: w || "" }; }
  function FOTO(k, l, w) { return { k: k, l: l, t: "foto", syn: [], w: w || "" }; }

  var ALLE = [
    FOTO("f_gesamt", "Foto der Einbaustelle (Übersicht)", "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."),
    T("zugang", "Zugang, Parken, Stockwerk", ["zugang", "parken", "stockwerk", "etage"], "Wichtig für Anfahrt, Tragen und Gerüst."),
    T("bes", "Besonderheiten und Wünsche des Kunden", ["besonderheiten", "besonderheit", "wunsch", "wünsche", "kunde möchte", "kunde wünscht"])
  ];

  var CHECK = {
    shk: { "*": [
      N("aufbau", "Fußbodenaufbau gesamt", "cm", ["fußbodenaufbau", "bodenaufbau", "aufbauhöhe", "aufbau"], "Bodengleiche Dusche: genug Höhe für Ablauf und Gefälle?", 2, 40),
      N("fallrohr", "Abstand Ablauf bis Fallrohr", "m", ["abstand fallrohr", "abstand zum fallrohr", "fallrohr", "strang"], "Je weiter weg, desto mehr Gefälle und Höhe braucht die Leitung.", 0.1, 15),
      S("gefaelle", "Gefälle zum Ablauf (1–2 %) möglich", ["ja", "knapp", "nein"], ["gefälle"], "Richtwert für bodengleiche Duschen 1–2 %."),
      S("decke", "Decke unter dem Bad", ["Betondecke", "Holzbalkendecke"], ["decke", "geschossdecke"], "Bei Holzbalken: Balkenrichtung notieren, Ablauf darf keinen Balken schneiden."),
      T("balken", "Balkenrichtung (nur Holzbalkendecke)", ["balkenrichtung", "balken"]),
      S("abdicht", "Abdichtung heute", ["vorhanden", "keine", "unbekannt"], ["abdichtung"]),
      T("anschl", "Lage Wasser- und Abwasseranschlüsse", ["anschlüsse", "anschluss", "wasseranschluss"]),
      S("lueft", "Lüftung", ["Fenster", "Lüfter", "keine"], ["lüftung", "belüftung"]),
      FOTO("f_anschl", "Foto Anschlüsse und Fallrohr")
    ] },
    heizung: { "*": [
      S("heizlast", "Heizlast nach DIN EN 12831", ["liegt vor", "berechnen"], ["heizlast", "heizlastberechnung"], "Grundlage für die Größe der Wärmepumpe."),
      N("verbrauch", "Verbrauch pro Jahr (Mittel 3 Jahre)", "kWh", ["verbrauch", "jahresverbrauch"], "Aus den Abrechnungen; Öl: Liter × 10 ≈ kWh.", 500, 200000),
      N("vorlauf", "Vorlauftemperatur heute", "°C", ["vorlauftemperatur", "vorlauf"], "Unter 55 °C ist günstig für eine Wärmepumpe.", 20, 90),
      N("baujahr", "Baujahr Haus", "", ["baujahr"], "", 1800, 2030),
      N("wohnfl", "Wohnfläche beheizt", "m²", ["wohnfläche", "beheizte fläche"], "", 20, 1000),
      T("aufst", "Aufstellort Außengerät", ["aufstellort", "außengerät steht", "außengerät"], "Fester Untergrund, Kondensat abführen, Luft muss frei strömen."),
      N("schall", "Abstand zum nächsten Nachbarfenster", "m", ["nachbarfenster", "abstand nachbar", "nachbar"], "Schall: Herstellerangaben und TA Lärm prüfen, oft sind einige Meter nötig.", 0.5, 100),
      N("leitung", "Leitungsweg innen bis außen", "m", ["leitungsweg", "leitungslänge"], "", 0.5, 50),
      S("ww", "Warmwasser heute", ["über die Heizung", "Durchlauferhitzer", "Boiler"], ["warmwasser"]),
      FOTO("f_zs", "Foto Zählerschrank", "Wärmepumpe ist steuerbare Verbrauchseinrichtung nach § 14a EnWG – Platz für Zähler und Steuerbox prüfen."),
      FOTO("f_hk", "Fotos Heizkörper und Heizraum")
    ] },
    elektro: { "*": [
      N("baujahr", "Baujahr Elektroanlage", "", ["baujahr"], "", 1900, 2030),
      J("fi", "FI-Schutzschalter vorhanden", ["fi-schalter", "fi schutzschalter", "fehlerstromschutzschalter", "fi"], "Fehlt er, ist bei Erweiterungen meist Nachrüsten nötig."),
      N("hausanschl", "Absicherung Hausanschluss", "A", ["hausanschluss", "absicherung", "hauptsicherung"], "", 16, 250),
      S("wb_ort", "Montageort Wallbox", ["Garage", "Carport", "Außenwand"], ["wallbox kommt", "montageort", "wallbox an"]),
      N("wb_weg", "Leitungsweg Zählerschrank bis Wallbox", "m", ["leitungsweg", "kabelweg", "leitungslänge"], "Länge bestimmt Querschnitt und Kosten. Wallbox beim Netzbetreiber melden (über 11 kW genehmigen lassen).", 1, 100),
      T("erdung", "Erdung / Potentialausgleich", ["erdung", "potentialausgleich"]),
      FOTO("f_zs", "Foto Zählerschrank geöffnet", "Bei Erweiterung gelten die Anschlussregeln des Netzbetreibers (VDE-AR-N 4100).")
    ] },
    solar: { "*": [
      S("eindeck", "Dacheindeckung", ["Tondachziegel", "Betondachstein", "Blech", "Schiefer", "Faserzement"], ["eindeckung", "dach ist", "dachdeckung"], "Faserzement vor 1993: Asbestverdacht – nicht bohren, erst prüfen."),
      N("dachalter", "Alter der Eindeckung", "Jahre", ["dachalter", "alter dach", "dach ist", "eindeckung ist"], "Älter als ca. 25 Jahre: Sanierung vor der PV mitdenken.", 0, 120),
      T("statik", "Sparren und Statik", ["sparren", "statik"]),
      S("versch", "Verschattung", ["keine", "morgens", "abends", "teilweise"], ["verschattung", "schatten"], "Bäume, Gauben, Nachbarhäuser – kostet Ertrag."),
      T("wr", "Platz für Wechselrichter und Speicher", ["wechselrichter", "speicher kommt", "platz für"]),
      N("kabel", "Kabelweg Dach bis Zählerschrank", "m", ["kabelweg", "kabel"], "", 1, 100),
      S("zugang_d", "Zugang zum Dach", ["Gerüst nötig", "Hubsteiger", "frei"], ["gerüst", "hubsteiger"]),
      J("rechnung", "Jahresstromrechnung liegt vor", ["stromrechnung", "jahresrechnung"]),
      FOTO("f_zs", "Foto Zählerschrank", "Anschluss nach VDE-AR-N 4100; alter Schrank muss oft erneuert werden.")
    ] },
    maler: {
      Innenraum: [
        S("untergr", "Untergrund", ["Putz", "Gipskarton", "Tapete", "Beton"], ["untergrund"]),
        S("zust", "Zustand", ["gut", "Risse", "Feuchte / Schimmel", "stark verschmutzt"], ["zustand"], "Feuchte und Schimmel zuerst klären, sonst hält der Anstrich nicht."),
        S("moebel", "Möbel", ["Raum leer", "Möbel bleiben im Raum"], ["möbel", "raum ist"], "Abdecken und Rücken kostet Zeit."),
        N("lack", "Türen / Heizkörper lackieren", "Stk.", ["lackieren", "türen lackieren"], "", 0, 40),
        T("abkleb", "Abkleben (Fenster, Böden, Steckdosen)", ["abkleben"])
      ],
      Fassade: [
        S("untergr", "Untergrund", ["Putz", "WDVS", "Klinker", "Holz"], ["untergrund"]),
        S("zust", "Zustand", ["gut", "Risse", "Algen / Moos", "Abplatzungen"], ["zustand"]),
        S("geruest", "Gerüst", ["nötig", "nicht nötig"], ["gerüst"], "Standfläche, Nachbargrund und Gehweg (Genehmigung) prüfen."),
        N("fenster_n", "Fenster in der Fläche", "Stk.", ["fenster"], "Nach VOB/C (DIN 18363) Öffnungen über 2,5 m² abziehen.", 0, 100)
      ]
    },
    fliesen: { "*": [
      S("untergr", "Untergrund", ["Estrich", "alte Fliesen", "Gipskarton", "Putz"], ["untergrund"]),
      N("eben", "Ebenheit: größte Abweichung", "mm", ["ebenheit", "abweichung", "uneben"], "Bei großen Formaten muss der Untergrund sehr eben sein, sonst spachteln.", 0, 50),
      J("abdicht", "Abdichtung im Nassbereich nötig", ["abdichtung"]),
      J("fbh", "Fußbodenheizung", ["fußbodenheizung", "bodenheizung"], "Belegreifheizen mit Protokoll nötig."),
      J("altweg", "Alte Fliesen entfernen", ["alte fliesen raus", "alte fliesen entfernen", "rausreißen", "abschlagen"]),
      N("profil", "Kantenprofile", "m", ["kantenprofile", "kantenprofil", "profile", "schiene"], "", 0, 200)
    ] },
    boden: { "*": [
      N("cm", "Restfeuchte (CM-Messung)", "%", ["cm-messung", "cm messung", "restfeuchte", "feuchte"], "Zementestrich meist max. 2,0 CM-% (mit Fußbodenheizung 1,8) – Herstellerangabe des Belags gilt.", 0, 10),
      N("eben", "Ebenheit: größte Abweichung", "mm", ["ebenheit", "abweichung", "uneben"], "Richtwert für Klickbeläge: ca. 3 mm auf 1 m – sonst spachteln.", 0, 50),
      J("fbh", "Fußbodenheizung", ["fußbodenheizung", "bodenheizung"], "Aufheizprotokoll anfordern."),
      S("fest", "Festigkeit (Kratzprobe)", ["fest", "sandet"], ["festigkeit", "kratzprobe", "estrich ist"]),
      N("uebg", "Übergänge / Schienen", "Stk.", ["übergänge", "übergang", "übergangsschienen"], "", 0, 30),
      N("sockel", "Sockelleisten", "m", ["sockelleisten", "sockelleiste", "sockel"], "", 0, 300),
      N("kuerzen", "Türen kürzen", "Stk.", ["türen kürzen", "kürzen"], "Neuer Boden ist höher – Türen müssen oft gekürzt werden.", 0, 20),
      S("raeumen", "Möbel räumen", ["Kunde räumt", "wir räumen"], ["möbel", "räumen"])
    ] },
    trockenbau: {
      Estrich: [
        N("hoehe", "Höhe Rohboden bis Fertigfußboden", "cm", ["rohboden", "aufbauhöhe", "fertigfußboden"], "Muss für Dämmung, Estrich und Belag reichen.", 3, 40),
        J("fbh", "Fußbodenheizung", ["fußbodenheizung", "bodenheizung"]),
        T("leitungen", "Leitungen auf dem Rohboden", ["leitungen", "rohre"]),
        S("trocken", "Trocknungszeit eingeplant", ["ja", "nein"], ["trocknung", "trocknungszeit"], "Zementestrich braucht je nach Dicke mehrere Wochen, Belag erst nach CM-Messung.")
      ],
      "*": [
        S("anschl", "Anschluss an Boden und Decke", ["Beton", "Estrich", "Holzbalken"], ["anschluss", "decke ist", "boden ist"]),
        S("schall", "Schallschutz", ["normal", "erhöht"], ["schallschutz", "schall"]),
        J("feucht", "Feuchtraum (imprägnierte Platten)", ["feuchtraum", "nassraum"]),
        T("install", "Steckdosen und Leitungen in der Wand", ["steckdosen", "leitungen", "installation"]),
        S("q", "Oberfläche", ["Q2", "Q3", "Q4"], ["oberfläche", "qualitätsstufe", "spachtelung"], "Q3 und Q4 bei Streiflicht oder glatter Farbe.")
      ]
    },
    schreiner: {
      Einbauschrank: [
        N("h_l", "Höhe links", "m", ["höhe links"], "Raumhöhe an mehreren Stellen messen – Wände und Decken sind selten gerade.", 0.3, 4),
        N("h_r", "Höhe rechts", "m", ["höhe rechts"], "", 0.3, 4),
        N("knie", "Kniestock (bei Dachschräge)", "m", ["kniestock", "drempel"], "", 0, 2.5),
        N("schraeg", "Neigung der Dachschräge", "°", ["dachschräge", "schräge", "neigung"], "", 0, 80),
        S("sockel", "Sockelleiste", ["vorhanden – ausklinken", "keine"], ["sockelleiste", "sockel"]),
        T("dosen", "Steckdosen / Schalter in der Nische", ["steckdose", "schalter", "lichtschalter"])
      ],
      "Küche": [
        N("raumh", "Raumhöhe (an mehreren Stellen, kleinster Wert)", "m", ["raumhöhe"], "Jede Wand von Ecke zu Ecke und auf zwei Höhen messen.", 2, 4),
        N("brue", "Fensterbrüstung Höhe", "m", ["brüstung", "brüstungshöhe", "fensterbrüstung"], "Arbeitsplatte vor dem Fenster muss darunter passen.", 0, 2),
        N("arbh", "Gewünschte Arbeitshöhe", "m", ["arbeitshöhe"], "Faustregel: ca. 10–15 cm unter dem Ellenbogen.", 0.75, 1.1),
        T("wasser", "Lage Wasser und Abwasser", ["wasser", "abwasser", "spüle"]),
        J("gas", "Gasanschluss", ["gas", "gasanschluss"]),
        S("abluft", "Dunstabzug", ["Abluft möglich", "Umluft"], ["abluft", "umluft", "dunstabzug"]),
        J("hk", "Heizkörper an der Küchenwand", ["heizkörper"]),
        N("neuboden", "Neuer Boden kommt dazu (Aufbau)", "cm", ["neuer boden", "bodenaufbau"], "", 0, 10)
      ],
      Treppe: [
        N("durchg", "Durchgangshöhe", "m", ["durchgangshöhe", "kopfhöhe"], "DIN 18065: mindestens 2,00 m lichte Durchgangshöhe.", 1.5, 3),
        N("loch_l", "Deckenöffnung Länge", "m", ["deckenöffnung länge", "treppenloch länge", "deckenöffnung", "treppenloch"], "", 1, 6),
        N("loch_b", "Deckenöffnung Breite", "m", ["deckenöffnung breite", "treppenloch breite"], "", 0.5, 2),
        S("okff", "Fertigfußboden oben und unten", ["bekannt", "kommt noch"], ["fertigfußboden", "fußbodenaufbau"], "Steigung immer von Fertigfußboden zu Fertigfußboden. Schrittmaß 2 × Steigung + Auftritt = 59–65 cm."),
        S("gel", "Geländer", ["eine Seite", "beide Seiten", "Wand auf beiden Seiten"], ["geländer", "handlauf"])
      ]
    },
    dach: { "*": [
      N("sparren", "Sparrenabstand", "cm", ["sparrenabstand"], "", 30, 120),
      S("unterd", "Unterdach / Unterspannbahn", ["vorhanden", "keine"], ["unterspannbahn", "unterdach"]),
      S("lattung", "Lattung", ["gut", "erneuern"], ["lattung", "latten"]),
      N("durchdr", "Kamin und Durchdringungen", "Stk.", ["durchdringungen", "kamine", "kamin"], "", 0, 20),
      N("rinne_l", "Rinnenlänge", "m", ["rinnenlänge", "rinne"], "", 0, 200),
      N("fallr", "Fallrohre", "Stk.", ["fallrohre", "fallrohr"], "", 0, 20),
      S("geruest", "Gerüst-Standfläche", ["frei", "Hindernisse"], ["gerüst"]),
      S("asbest", "Faserzement / Asbestverdacht", ["nein", "Verdacht"], ["asbest", "faserzement"], "Bis 1993 verbaute Faserzementplatten können Asbest enthalten – Fachfirma.")
    ] },
    fenster: {
      Tuer: [
        N("schwelle", "Höhe Fertigfußboden innen zu außen", "cm", ["schwelle", "höhenunterschied", "stufe"], "Barrierearm: möglichst flache Schwelle.", 0, 40),
        S("dinr", "Öffnungsrichtung (von außen gesehen)", ["DIN links", "DIN rechts"], ["öffnungsrichtung", "öffnet", "din"]),
        N("lai_i", "Laibungstiefe innen", "cm", ["laibung innen", "innenlaibung"], "", 0, 60),
        S("wand", "Wandaufbau", ["Mauerwerk", "WDVS", "Holz"], ["wandaufbau", "wand ist"]),
        T("strom", "Strom für E-Öffner / Klingel", ["strom", "klingel", "e-öffner"])
      ],
      Garagentor: [
        N("sturz", "Sturzhöhe (Platz über der Öffnung)", "cm", ["sturzhöhe", "sturz"], "Je nach Torsystem nötig – Herstellerangabe prüfen.", 0, 100),
        N("seite_l", "Seitenanschlag links", "cm", ["seitenanschlag links", "anschlag links"], "", 0, 100),
        N("seite_r", "Seitenanschlag rechts", "cm", ["seitenanschlag rechts", "anschlag rechts"], "", 0, 100),
        N("tiefe", "Einfahrtstiefe Garage", "m", ["einfahrtstiefe", "garagentiefe", "tiefe"], "Tor läuft unter der Decke nach hinten.", 1, 20),
        J("strom", "Stromanschluss für Antrieb", ["strom", "steckdose"])
      ],
      "*": [
        N("lai_i", "Laibungstiefe innen", "cm", ["laibung innen", "innenlaibung"], "Jedes Maß 3 × messen, das kleinste nehmen.", 0, 60),
        N("lai_a", "Laibungstiefe außen", "cm", ["laibung außen", "außenlaibung"], "", 0, 60),
        N("brue", "Brüstungshöhe", "cm", ["brüstungshöhe", "brüstung"], "Unter ca. 90 cm (Obergeschoss) an Absturzsicherung denken.", 0, 200),
        S("diag", "Diagonalen gleich", ["ja", "Differenz"], ["diagonale", "diagonalen"], "Zeigt, ob die Öffnung schief ist."),
        S("rk", "Rollladenkasten", ["keiner", "Vorbau", "Aufsatz", "alter Einbaukasten"], ["rollladenkasten", "kasten"]),
        S("griff", "Griffposition", ["Mitte", "außermittig"], ["griff"]),
        S("fb_a", "Fensterbank außen", ["bleibt", "neu"], ["fensterbank außen", "außenfensterbank"]),
        S("wand", "Wandaufbau", ["Mauerwerk", "WDVS", "Holz"], ["wandaufbau", "wand ist"])
      ]
    },
    sonnenschutz: {
      Terrassendach: [
        N("gef", "Gefälle", "°", ["gefälle", "neigung"], "Meist mindestens ca. 5°, damit Wasser abläuft.", 0, 30),
        S("fund", "Fundamente", ["vorhanden", "neu"], ["fundament", "fundamente"], "Neue Fundamente brauchen Zeit zum Aushärten."),
        S("eind", "Eindeckung", ["VSG-Glas", "Polycarbonat"], ["eindeckung", "glas", "dach aus"]),
        S("schnee", "Schneelastzone", ["1", "1a", "2", "2a", "3"], ["schneelastzone", "schneelast"], "Bestimmt Profile und Sparrenabstand."),
        S("genehm", "Genehmigung und Grenzabstand geprüft", ["ja", "noch prüfen"], ["genehmigung", "grenzabstand", "baugenehmigung"]),
        T("entw", "Entwässerung (Fallrohr wohin)", ["entwässerung", "regenwasser", "fallrohr"]),
        S("untergr", "Wand für den Wandanschluss", ["Beton", "Mauerwerk", "WDVS", "Holz"], ["wand ist", "untergrund", "wandanschluss"])
      ],
      Markise: [
        N("mh", "Montagehöhe", "m", ["montagehöhe"], "Unter dem ausgefahrenen Tuch sollten mindestens ca. 2,20 m frei bleiben.", 1.5, 6),
        S("untergr", "Wand / Untergrund", ["Beton", "Mauerwerk", "WDVS", "Holz / Sparren"], ["untergrund", "wand ist"], "WDVS: thermisch getrennte Abstandsmontage nötig."),
        N("abst", "Abstand über dem Fenstersturz", "cm", ["abstand über", "über dem fenster", "abstand fenster"], "Mehr als ca. 20 cm, damit Konsolen halten.", 0, 200),
        N("neig", "Neigung", "°", ["neigung"], "Üblich 15–25°.", 0, 45),
        J("strom", "Stromanschluss in der Nähe", ["strom", "steckdose"]),
        S("sensor", "Sensor", ["kein", "Wind", "Wind und Sonne"], ["sensor", "windwächter"]),
        S("notb", "Notbedienung", ["Kurbel", "keine"], ["notbedienung", "kurbel"])
      ],
      Rollladen: [
        S("panzer", "Panzer", ["Aluminium", "Kunststoff"], ["panzer", "lamellen"]),
        S("schiene", "Führungsschienen", ["in der Laibung", "auf der Fassade"], ["führungsschienen", "schienen"]),
        J("strom", "Strom am Fenster", ["strom", "steckdose"]),
        T("bestand", "Bestand (alter Kasten, Gurt)", ["bestand", "alter kasten"])
      ],
      "*": [
        S("montage", "Montage", ["Laibung", "Fassade", "Rahmen", "Glasleiste"], ["montage", "befestigung"]),
        J("griffst", "Fenstergriff stört", ["griff"]),
        J("strom", "Strom vorhanden", ["strom", "steckdose"]),
        T("wind", "Wind / Lage", ["wind", "lage"])
      ]
    },
    garten: {
      Pflaster: [
        N("aushub", "Aushubtiefe", "cm", ["aushubtiefe", "aushub", "auskoffern"], "Richtwert: Gehweg ca. 25–30 cm, PKW-Zufahrt ca. 40–50 cm.", 5, 100),
        S("boden", "Boden", ["sandig", "lehmig", "steinig"], ["boden ist", "untergrund", "boden"]),
        N("gef", "Gefälle vom Haus weg", "%", ["gefälle"], "Mindestens ca. 2 %, damit Wasser abläuft.", 0, 10),
        N("rand", "Randeinfassung", "m", ["randeinfassung", "randsteine", "randstein", "einfassung"], "", 0, 300),
        N("rinne", "Entwässerungsrinne", "m", ["entwässerungsrinne", "rinne"], "", 0, 100),
        J("zufahrt", "Zufahrt für Bagger / LKW", ["zufahrt für", "bagger", "lkw"])
      ],
      Hecke: [
        N("abst", "Abstand zur Grenze", "m", ["grenzabstand", "abstand zur grenze", "grenze"], "Bayern (Art. 47 AGBGB): bis 2 m Höhe 0,5 m, höher 2 m Abstand.", 0, 10),
        N("pflabst", "Pflanzabstand", "cm", ["pflanzabstand"], "", 10, 200),
        S("boden", "Boden", ["sandig", "lehmig", "steinig"], ["boden"])
      ],
      Zaun: [
        N("pfosten", "Pfostenabstand", "m", ["pfostenabstand"], "", 1, 4),
        S("gelaende", "Gelände", ["eben", "Hang"], ["gelände", "hang"]),
        S("leit", "Leitungen im Boden", ["geprüft", "unbekannt"], ["leitungen", "leitung"], "Vor dem Graben Leitungsauskunft einholen."),
        J("grenze", "Grundstücksgrenze markiert", ["grenzsteine", "grenze markiert", "grenze"])
      ],
      "*": [
        S("boden", "Boden", ["sandig", "lehmig", "steinig"], ["boden"]),
        S("wasser", "Bewässerung", ["keine", "Regner", "Tropfschlauch"], ["bewässerung", "regner"]),
        J("zufahrt", "Zufahrt für Maschinen", ["zufahrt", "maschinen"])
      ]
    },
    allgemein: { "*": [] }
  };
  function fensterGruppe(art) { return /Haustür|Nebeneingang/.test(art || "") ? "Tuer" : /Garagentor/.test(art || "") ? "Garagentor" : "*"; }
  VO.checkliste = function (gw, art) {
    var c = CHECK[gw] || CHECK.allgemein, key = gw === "fenster" ? fensterGruppe(art) : art && c[art] ? art : "*";
    return (c[key] || c["*"] || []).concat(ALLE);
  };

  /* ---------- 2. BEISPIEL-SPRACHNACHRICHTEN (erfundene Werte) ---------- */
  var BSP = {
    shk: "Bad im Obergeschoss. Länge 2,85 Meter, Breite 2,92 Meter, Höhe 2,48 Meter. Dusche bodengleich, keine Badewanne, ein WC, zwei Waschtische, Wandfliesen raumhoch. Fußbodenaufbau 14 Zentimeter, Abstand zum Fallrohr 1,8 Meter, Gefälle ja. Holzbalkendecke, Balkenrichtung quer zur Dusche. Abdichtung keine. Anschlüsse an der Innenwand links. Lüftung Fenster. Zugang erster Stock, Parken vor dem Haus.",
    heizung: "Wohnzimmer, Fläche 32 Quadratmeter, Zustand teilsaniert, Heizkörper heute 2. Heizlast berechnen. Verbrauch 21.000 kWh, Vorlauftemperatur 60 Grad, Baujahr 1984, Wohnfläche 145 Quadratmeter. Aufstellort Außengerät an der Garage auf der Ostseite. Abstand zum Nachbarfenster 6 Meter. Leitungsweg 4 Meter. Warmwasser über die Heizung.",
    elektro: "Küche: Steckdosen 12, Schalter 4, Lichtauslässe 3, Netzwerkdosen 1. Baujahr 1979, FI-Schalter keiner vorhanden. Hausanschluss 50 Ampere. Wallbox kommt in die Garage, Leitungsweg 14 Meter. Erdung prüfen, Potentialausgleich fehlt.",
    solar: "Dach Süd, Breite Traufe 10,6 Meter, Sparrenlänge 6,1 Meter, Ausrichtung Süd, Neigung 38 Grad, im Weg ein Kamin. Eindeckung Betondachstein, Dachalter 22 Jahre. Verschattung morgens durch einen Baum. Wechselrichter in den Keller neben den Zählerschrank. Kabelweg 18 Meter. Gerüst nötig. Stromrechnung liegt vor, ja.",
    maler: { Innenraum: "Wohnzimmer: Länge 5,2 Meter, Breite 4,1 Meter, Höhe 2,5 Meter. Decke streichen ja, Tapete Raufaser, Farbton Salbei. Untergrund Putz, Zustand Risse an der Fensterseite. Möbel bleiben im Raum. Türen lackieren 2. Abkleben Fenster und Parkett.",
      Fassade: "Fassade Süd: Länge 11,5 Meter, Höhe 6,2 Meter, Farbton Sand. Untergrund Putz, Zustand Algen am Sockel. Gerüst nötig. Fenster 6 Stück." },
    fliesen: "Bad: Länge 2,8 Meter, Breite 2,9 Meter, Höhe 2,5 Meter, Bereich Boden und Wand, Wandfliesen raumhoch. Untergrund alte Fliesen, Ebenheit Abweichung 4 Millimeter. Abdichtung ja, Fußbodenheizung nein, alte Fliesen entfernen ja. Kantenprofile 6 Meter.",
    boden: "Wohnzimmer: Länge 5,22 Meter, Breite 4,08 Meter, Belag Parkett, Verlegerichtung längs, Türen 1. CM-Messung 1,6 Prozent, Ebenheit 2 Millimeter, Fußbodenheizung ja, Festigkeit fest. Übergänge 2, Sockelleisten 17 Meter, Türen kürzen 1, Kunde räumt die Möbel.",
    trockenbau: { Trennwand: "Wand Ankleide: Länge 3,6 Meter, Höhe 2,55 Meter, Beplankung doppelt, Türöffnungen 1, Dämmung ja. Anschluss an Beton, Schallschutz erhöht, Feuchtraum nein. Steckdosen 2 in der neuen Wand. Oberfläche Q3.",
      Vorsatzschale: "Installationswand Bad: Länge 2,8 Meter, Höhe 2,55 Meter, Dämmung ja. Anschluss Estrich, Feuchtraum ja, Leitungen für WC und Waschtisch. Oberfläche Q2.",
      Abhangdecke: "Decke Flur: Länge 4 Meter, Breite 1,4 Meter. Anschluss an Beton, Schallschutz normal, Oberfläche Q3, Leitungen für 4 Spots.",
      Estrich: "Estrich Anbau: Länge 6 Meter, Breite 4,5 Meter, Heizestrich, Dicke 6,5 Zentimeter. Rohboden bis Fertigfußboden 14 Zentimeter. Fußbodenheizung ja. Leitungen Heizungsrohre und Leerrohr. Trocknungszeit ja." },
    schreiner: { Einbauschrank: "Schrank Dachschräge: Nischenbreite 2,4 Meter, Höhe 2,3 Meter, Tiefe 60 Zentimeter, Türen 4, Fachböden 4, Front Weiß matt. Höhe links 2,28 Meter, Höhe rechts 2,31 Meter. Kniestock 0,9 Meter, Dachschräge 40 Grad. Sockelleiste vorhanden. Eine Steckdose rechts in der Nische.",
      "Küche": "Küche L-Form, Länge Hauptzeile 3,6 Meter, Schenkel 2,2 Meter, Hängeschränke ja, Arbeitsplatte Massivholz, Front Lack Hochglanz. Raumhöhe 2,48 Meter, Brüstung 1,02 Meter, Arbeitshöhe 0,92 Meter. Wasser an der Fensterwand links. Gas nein. Dunstabzug Umluft. Heizkörper ja unter dem Fenster.",
      Treppe: "Treppe ins Dachgeschoss: Geschosshöhe 2,75 Meter, Lauflänge 3,4 Meter, Laufbreite 0,9 Meter, Form gerade, Holz Eiche. Durchgangshöhe 2,05 Meter. Deckenöffnung Länge 3,1 Meter, Deckenöffnung Breite 0,95 Meter. Fertigfußboden bekannt. Geländer eine Seite." },
    dach: "Wohnhaus Satteldach, Hauslänge 11,5 Meter, Hausbreite 9 Meter, Neigung 38 Grad, Dachüberstand 50 Zentimeter, Traufhöhe 5,8 Meter, Eindeckung Tondachziegel, Dachfenster 2. Sparrenabstand 75 Zentimeter, Unterspannbahn keine, Lattung erneuern. Kamin 1, Rinne 23 Meter, Fallrohre 4. Gerüst frei. Asbest nein.",
    fenster: { "*": "Schlafzimmer, Fenster 2-flügelig. Breite 1,51 Meter, Höhe 1,26 Meter, kleinstes Maß von drei Messungen. Anzahl 2. Material Kunststoff, Verglasung 3-fach. Laibung innen 24 Zentimeter, Laibung außen 12 Zentimeter. Brüstungshöhe 88 Zentimeter. Diagonalen gleich ja. Rollladenkasten Vorbau. Griff Mitte. Fensterbank außen bleibt. Wandaufbau Mauerwerk.",
      Tuer: "Haustür, Breite 1,12 Meter, Höhe 2,18 Meter, Anzahl 1. Schwelle 3 Zentimeter. Öffnungsrichtung DIN links. Laibung innen 30 Zentimeter. Wandaufbau WDVS. Strom für Klingel vorhanden.",
      Garagentor: "Garagentor, Breite 2,5 Meter, Höhe 2,13 Meter, Anzahl 1. Sturzhöhe 18 Zentimeter, Seitenanschlag links 12 Zentimeter, Seitenanschlag rechts 15 Zentimeter, Einfahrtstiefe 5,6 Meter. Strom ja, Steckdose hinten links." },
    sonnenschutz: { Terrassendach: "Terrasse Süd: Breite 5 Meter, Tiefe 3,5 Meter, Höhe am Haus 2,8 Meter, Höhe vorne 2,3 Meter. Gefälle 8 Grad. Fundamente neu. Eindeckung VSG-Glas. Schneelastzone 2. Genehmigung noch prüfen. Entwässerung Fallrohr links in den Garten. Wand ist WDVS.",
      Markise: "Balkon: Breite 4,2 Meter, Ausfall 2,5 Meter. Montagehöhe 2,6 Meter. Untergrund WDVS. Abstand über dem Fenster 25 Zentimeter. Neigung 15 Grad. Strom ja, Steckdose rechts. Sensor Wind und Sonne. Notbedienung Kurbel.",
      Rollladen: "Schlafzimmer: Lichtmaß Breite 1,26 Meter, Lichtmaß Höhe 1,38 Meter, Anzahl 2, Kasten Vorbau, Antrieb Motor mit App. Panzer Aluminium, Führungsschienen in der Laibung. Strom ja. Bestand alter Gurt.",
      Raffstore: "Wohnzimmer Süd: Breite 2,4 Meter, Höhe 2,2 Meter, Anzahl 1. Lamelle Z-Lamelle, Antrieb Motor mit Sonnenautomatik, Einbau Vorbau mit Blende. Montage Fassade. Strom ja. Wind: Lage frei, viel Wind.",
      Insektenschutz: "Küche und Bad: Breite 0,9 Meter, Höhe 1,1 Meter, Anzahl 2. Art Spannrahmen, Gewebe Pollenschutz. Montage Rahmen. Fenstergriff stört nein.",
      Plissee: "Kinderzimmer: Breite Glas 0,82 Meter, Höhe Glas 1,24 Meter, Anzahl 2. Stoff Verdunkelung, Befestigung Glasleiste, Bedienung Griff. Griff stört nein.",
      "*": "Breite 2,4 Meter, Höhe 2,2 Meter, Anzahl 1. Montage Fassade. Strom ja." },
    garten: { Pflaster: "Einfahrt: Länge 8 Meter, Breite 3,2 Meter, Belastung Zufahrt PKW, Stein Betonpflaster. Aushubtiefe 45 Zentimeter. Boden lehmig. Gefälle 2,5 Prozent. Randeinfassung 22 Meter. Rinne 3,2 Meter vor der Garage. Zufahrt für Bagger ja.",
      Rasen: "Rasen hinten: Länge 14 Meter, Breite 9 Meter, Ausführung Rollrasen. Boden sandig. Bewässerung Regner. Zufahrt ja.",
      Hecke: "Hecke Nachbar: Länge 18 Meter, Pflanze Hainbuche. Abstand zur Grenze 0,6 Meter. Pflanzabstand 30 Zentimeter. Boden lehmig.",
      Zaun: "Zaun Straße: Länge 22 Meter, Höhe 1,23 m, Tore 1. Pfostenabstand 2,5 Meter. Gelände eben. Leitungen unbekannt. Grenze markiert ja." },
    allgemein: "Büro: Länge 6,2 Meter, Breite 4,8 Meter, Höhe 2,8 Meter. Zugang Erdgeschoss, Parken im Hof."
  };
  VO.beispiel = function (gw, art) {
    var b = BSP[gw] || BSP.allgemein; if (typeof b === "string") return b;
    var key = gw === "fenster" ? fensterGruppe(art) : art;
    return b[key] || b["*"] || b[Object.keys(b)[0]];
  };

  /* ---------- 3. AUSWERTUNG ---------- */
  var ZAHLW = { eins: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, "zwölf": 12, ein: 1, eine: 1, einen: 1, einem: 1, einer: 1 };
  var GR = "[^a-zäöüß0-9]";
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function norm(s) { return " " + String(s).toLowerCase().replace(/\s+/g, " ") + " "; }
  function zahlWorte(t) {   // „zwei Waschtische“ → „2 Waschtische“; Tausenderpunkt „21.000“ → „21000“
    return t.replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2").replace(new RegExp("(" + GR + ")(" + Object.keys(ZAHLW).join("|") + ")(?=" + GR + ")", "gi"), function (m, a, w) {
      return a + ZAHLW[w.toLowerCase()];
    });
  }
  var LEN = { m: 1, meter: 1, cm: 0.01, zentimeter: 0.01, mm: 0.001, millimeter: 0.001 };
  function umrechnen(v, einh, ziel) {   // Zahl in die Einheit des Feldes bringen
    einh = (einh || "").toLowerCase().replace(/\.$/, "");
    if (ziel in LEN) {
      var f = LEN[einh];
      if (f == null) f = ziel === "m" ? (v >= 1000 ? 0.001 : v >= 20 ? 0.01 : 1) : ziel === "cm" ? (v < 3 && v % 1 ? 1 : 0.01) : 0.001;   // ohne Einheit: plausibel raten
      return Math.round(v * f / LEN[ziel] * 1000) / 1000;
    }
    return v;
  }
  function optionen(f) { return (f.o || []).map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; var k = [t, v, String(t).split(" (")[0], String(t).split(" – ")[0], String(t).split(" / ")[0], String(t).split(" ")[0].length >= 6 ? String(t).split(" ")[0] : ""].map(function (x) { return zahlWorte(" " + x + " ").toLowerCase().trim(); }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }); return { v: v, t: t, k: k }; }); }
  function synonyme(f, alle) {
    var s = (f.syn || []).concat(f.kern ? SYNK[f.k] || [] : []), roh = String(f.l).toLowerCase(), l = roh.replace(/\s*\(.*?\)/g, "").trim();
    [l, roh.replace(/[()]/g, "").replace(/\s+/g, " ").trim()].concat(f.kern ? (roh.match(/\(([^)]+)\)/) || []).slice(1) : []).forEach(function (x) { if (x && s.indexOf(x) < 0) s.push(x); });
    if (f.kern) {   // Kernfelder: erstes Wort nur, wenn es unter den Kernfeldern eindeutig ist (z. B. „Breite“)
      var w = l.split(/[ \/]/)[0];
      var gleich = alle.filter(function (g) { return g !== f && g.kern && String(g.l).toLowerCase().split(/[ \/]/)[0] === w; }).length;
      if (w.length > 2 && !gleich && s.indexOf(w) < 0) s.push(w);
    }
    return s;
  }
  var SYNK = { l1: ["hauptzeile"], l2: ["schenkel"], lr: ["lauflänge"], br: ["laufbreite"], anz: ["anzahl", "stück"], tue: ["türen"], fa: ["fachböden"], ue: ["überstand"], a: ["ausfall"], hs: ["höhe vorne"], th: ["traufhöhe"], l: ["länge"], wt: ["waschtisch"] };
  function jaNein(f) { var o = optionen(f).map(function (x) { return String(x.v); }).sort().join(); return f.ja || o === "ja,nein"; }
  /* felder: [{k,l,t,e,o,min,max,syn,kern}] → { werte:{k:v}, erkannt:[k], verworfen:[text] } */
  VO.auswerten = function (text, felder) {
    var t0 = zahlWorte(" " + String(text).replace(/\s+/g, " ") + " "), t = t0.toLowerCase(), belegt = new Uint8Array(t.length), werte = {}, erkannt = [], verworfen = [];
    var frei = function (a, b) { for (var i = a; i < b; i++) if (belegt[i]) return false; return true; };
    var belege = function (a, b) { for (var i = a; i < b; i++) belegt[i] = 1; };
    var paare = [];
    felder.forEach(function (f) { if (f.t === "foto" || f.k === "art" || f.k === "name") return; synonyme(f, felder).forEach(function (s) { paare.push([f, s]); }); });
    paare.sort(function (a, b) { return b[1].length - a[1].length; });
    var FUELL = "(?:\\s*(?:ist|sind|beträgt|betragen|von|mit|ca\\.?|circa|etwa|ungefähr|rund|je|jeweils|bei|auf|insgesamt|gesamt|:|=|-))*\\s*";
    var ZAHL = "(\\d+(?:[.,]\\d+)?)(?:\\s*(meter|m|zentimeter|cm|millimeter|mm|grad celsius|grad|°c|°|prozent|%|quadratmeter|m²|qm|kilowattstunden|kwh|kw|ampere|a|stück|stk\\.?|jahre|jahr)(?![a-zäöüß]))?(?:\\s+(\\d{1,2})(?![\\d.,]|\\s*(?:cm|mm|m|meter|zentimeter|grad|%|prozent)))?";
    paare.forEach(function (pr) {
      var f = pr[0], s = pr[1]; if (f.k in werte) return;
      var re = new RegExp("(?:^|" + GR + ")(" + rx(s) + ")(?=" + GR + ")", "g"), m;
      while ((m = re.exec(t))) {
        var a = m.index + m[0].length - m[1].length, b = a + m[1].length; if (!frei(a, b)) continue;
        var rest = t.slice(b);
        if (f.t === "n") {
          var mz = new RegExp("^" + FUELL + ZAHL).exec(rest);
          if (!mz && (f.e === "" || f.e === "Stk.")) {   // Anzahl davor: „2 Waschtische“, „1 WC“
            var mv = /(\d{1,3})\s*$/.exec(t.slice(Math.max(0, a - 6), a));
            if (mv) { werte[f.k] = +mv[1]; erkannt.push(f.k); belege(a - mv[0].length, b); break; }
          }
          if (!mz) continue;
          var v = parseFloat(mz[1].replace(",", ".")), einh = mz[2] || "";
          if (mz[3] && /^m(eter)?$/.test(einh)) v = v + parseInt(mz[3], 10) / 100;
          v = umrechnen(v, einh, f.e);
          if (f.min != null && (v < f.min || v > f.max)) { verworfen.push(f.l + ": " + mz[0].trim() + " liegt außerhalb " + f.min + "–" + f.max + " " + (f.e || "")); belege(a, b + mz[0].length); break; }
          werte[f.k] = v; erkannt.push(f.k); belege(a, b + mz[0].length); break;
        }
        if (f.t === "txt") {
          var mt = new RegExp("^" + FUELL + "([^.;\\n]{2,80})").exec(rest);
          if (!mt) continue;
          werte[f.k] = t0.substr(b + mt[0].length - mt[1].length, mt[1].length).trim().replace(/^./, function (c) { return c.toUpperCase(); }); erkannt.push(f.k); belege(a, b + mt[0].length); break;
        }
        if (f.t === "sel") {
          var fenster = rest.slice(0, 45).split(jaNein(f) ? /[.;,]/ : /[.;]/)[0], treffer = null;
          if (jaNein(f)) {
            if (/(^|\s)(nein|kein|keine|keiner|nicht|ohne|fehlt|0)(\s|,|$)/.test(fenster) || /(kein|keine|keiner|ohne|nicht)\s+$/.test(t.slice(Math.max(0, a - 12), a))) treffer = "nein";
            else treffer = "ja";
            werte[f.k] = treffer; erkannt.push(f.k); belege(a, b); break;
          }
          optionen(f).forEach(function (o) { o.k.forEach(function (k) { var i = norm(fenster).indexOf(" " + k); if (i >= 0 && (!treffer || i < treffer.i || (i === treffer.i && k.length > treffer.n))) treffer = { v: o.v, i: i, n: k.length }; }); });
          if (!treffer) continue;
          werte[f.k] = treffer.v; erkannt.push(f.k); belege(a, b + Math.min(fenster.length, treffer.i + treffer.n)); break;
        }
      }
    });
    // Auswahlfelder ohne Stichwort: eindeutige Optionen im ganzen Text („Kunststoff“, „DK rechts“, „Satteldach“)
    felder.forEach(function (f) {
      if (f.t !== "sel" || jaNein(f) || f.k in werte || f.k === "art") return;
      var best = null;
      optionen(f).forEach(function (o) {
        o.k.forEach(function (k) {
          if (k.length < 4 || /^(ja|nein|keine?|gut|neu|frei)$/.test(k)) return;
          var andere = felder.some(function (g) { return g !== f && g.t === "sel" && optionen(g).some(function (q) { return q.k.indexOf(k) >= 0; }); });
          if (andere) return;
          var re = new RegExp("(?:^|" + GR + ")(" + rx(k) + ")(?=" + GR + ")"), m = re.exec(t);
          if (m) { var a = m.index + m[0].length - m[1].length; if (frei(a, a + k.length) && (!best || k.length > best.l)) best = { v: o.v, l: k.length, a: a }; }
        });
      });
      if (best) { werte[f.k] = best.v; erkannt.push(f.k); belege(best.a, best.a + best.l); }
    });
    return { werte: werte, erkannt: erkannt, verworfen: verworfen };
  };

  /* ---------- 4. AUFMASSZETTEL ALS PDF ----------
     Eigener kleiner PDF-Schreiber: Helvetica (WinAnsi, Umlaute), Textfelder und Kästchen zum Ausfüllen
     am Gerät (AcroForm) – gedruckt sind alle Rahmen sichtbar. */
  var HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761, 556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500];
  var HWB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761, 556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556];
  var CP = { 8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133, 8224: 134, 8225: 135, 710: 136, 8240: 137, 352: 138, 8249: 139, 338: 140, 381: 142, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 732: 152, 8482: 153, 353: 154, 8250: 155, 339: 156, 382: 158, 376: 159 };
  function ersetze(s) { return String(s == null ? "" : s).replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->").replace(/ | /g, " ").replace(/[‐-‒]/g, "-"); }
  function ansi(s) { s = ersetze(s); var b = []; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); b.push(c < 128 || (c >= 160 && c < 256) ? c : CP[c] || 63); } return b; }
  function pdfStr(s) { return "(" + ansi(s).map(function (c) { return c === 40 || c === 41 || c === 92 ? "\\" + String.fromCharCode(c) : c < 32 || c > 126 ? "\\" + ("00" + c.toString(8)).slice(-3) : String.fromCharCode(c); }).join("") + ")"; }
  function pdfUtf16(s) { s = ersetze(s); var h = "FEFF"; for (var i = 0; i < s.length; i++) h += ("000" + s.charCodeAt(i).toString(16)).slice(-4).toUpperCase(); return "<" + h + ">"; }
  function breite(s, gr, fett) { var w = 0, t = fett ? HWB : HW; ansi(s).forEach(function (c) { w += c >= 32 ? t[c - 32] || 556 : 0; }); return w * gr / 1000; }
  function umbruch(s, gr, max, fett) {
    var zeilen = [], z = "";
    String(s).split(/\s+/).forEach(function (w) { var n = z ? z + " " + w : w; if (breite(n, gr, fett) > max && z) { zeilen.push(z); z = w; } else z = n; });
    if (z) zeilen.push(z); return zeilen.length ? zeilen : [""];
  }
  function f2(x) { return (Math.round(x * 100) / 100).toString(); }
  function zahlDe(v) { return v == null || v === "" ? "" : typeof v === "number" ? String(Math.round(v * 1000) / 1000).replace(".", ",") : String(v); }

  /* daten: { titel, untertitel, betrieb, kunde, adresse, datum, leer, gruppen:[{titel, felder:[{k,l,t,e,o,w,v}]}], foto:{bytes,w,h}, hinweis } */
  VO.zettelPdf = function (daten) {
    var W = 595.28, H = 841.89, R = 40, X2 = W - R, seiten = [], s = null, y = 0, felder = [], nr = 0;
    var neueSeite = function () { s = { ops: [], annots: [] }; seiten.push(s); y = H - R; kopf(); };
    var op = function (x) { s.ops.push(x); };
    var text = function (x, yy, gr, str, fett, farbe) { op((farbe || "0 g") + " BT /" + (fett ? "F2" : "F1") + " " + gr + " Tf " + f2(x) + " " + f2(yy) + " Td " + pdfStr(str) + " Tj ET"); };
    var rahmen = function (x, yy, w, h, grau) { op((grau || "0.55") + " G 0.6 w " + f2(x) + " " + f2(yy) + " " + f2(w) + " " + f2(h) + " re S"); };
    var linie = function (x1, y1, x2, y2, grau, dick) { op((grau || "0.55") + " G " + (dick || 0.6) + " w " + f2(x1) + " " + f2(y1) + " m " + f2(x2) + " " + f2(y2) + " l S"); };
    var feldName = function (k) { nr++; return (k || "f").replace(/[^A-Za-z0-9_]/g, "_") + "_" + nr; };
    var textfeld = function (k, x, yy, w, h, wert, mehrzeilig) { rahmen(x, yy, w, h); var f = { typ: "tx", name: feldName(k), r: [x, yy, x + w, yy + h], v: wert == null ? "" : String(wert), multi: !!mehrzeilig }; felder.push(f); s.annots.push(f); };
    var kaestchen = function (k, x, yy, an) { rahmen(x, yy, 9, 9, "0.35"); var f = { typ: "cb", name: feldName(k), r: [x, yy, x + 9, yy + 9], an: !!an }; felder.push(f); s.annots.push(f); };
    var platz = function (h) { if (y - h < R + 24) neueSeite(); };
    function kopf() {
      text(R, y - 14, 15, daten.titel, true); text(X2 - breite(daten.betrieb, 8.5), y - 12, 8.5, daten.betrieb, false, "0.35 g");
      y -= 30; if (daten.untertitel) { text(R, y, 9.5, daten.untertitel, false, "0.25 g"); y -= 8; }
      linie(R, y, X2, y, "0.2", 0.8); y -= 14;
    }
    neueSeite();
    // Kopfdaten
    [["kunde", "Kunde", daten.kunde], ["adresse", "Anschrift Baustelle", daten.adresse], ["datum", "Datum", daten.datum], ["von", "Aufgemessen von", ""]].forEach(function (z, i) {
      var x = i % 2 ? 310 : R, w = i % 2 ? X2 - 310 : 255; if (i % 2 === 0 && i) y -= 34;
      text(x, y, 7.5, z[1], false, "0.35 g"); textfeld(z[0], x, y - 20, w, 16, daten.leer ? "" : z[2]);
    });
    y -= 34;
    if (daten.hinweis) { umbruch(daten.hinweis, 8, X2 - R).forEach(function (z) { text(R, y, 8, z, false, "0.3 g"); y -= 10.5; }); y -= 4; }
    var LX = R, LW = 185, FX = R + 195, FW = X2 - FX;
    (daten.gruppen || []).forEach(function (g) {
      platz(40); op("0.93 g " + f2(R) + " " + f2(y - 4) + " " + f2(X2 - R) + " 15 re f"); text(R + 5, y, 9.5, g.titel, true); y -= 22;
      g.felder.forEach(function (f) {
        var lz = umbruch(f.l, 9, LW, true), wz = f.w ? umbruch(f.w, 7, LW) : [], v = daten.leer ? null : f.v;
        var optZeilen = [];
        if (f.t === "sel") {   // Optionen als Kästchen im Fluss
          var zx = 0, zeile = []; optionen(f).forEach(function (o) { var b = 13 + breite(o.t, 8.5) + 12; if (zx + b > FW && zeile.length) { optZeilen.push(zeile); zeile = []; zx = 0; } zeile.push({ o: o, x: zx }); zx += b; }); if (zeile.length) optZeilen.push(zeile);
        }
        var hFeld = f.t === "sel" ? optZeilen.length * 14 : f.t === "txt" ? 16 : 16, h = Math.max(lz.length * 11 + wz.length * 9, hFeld) + 9;
        platz(h);
        var y0 = y;
        lz.forEach(function (z, i) { text(LX, y0 - i * 11, 9, z, true); });
        wz.forEach(function (z, i) { text(LX, y0 - lz.length * 11 - i * 9 + 1, 7, z, false, "0.4 g"); });
        if (f.t === "n") { textfeld(f.k, FX, y0 - 5, 90, 16, zahlDe(v)); if (f.e) text(FX + 96, y0, 8.5, f.e, false, "0.35 g"); if (f.min != null && f.max != null && f.max < 9999) text(FX + 140, y0, 7, "plausibel " + zahlDe(f.min) + "–" + zahlDe(f.max) + (f.e ? " " + f.e : ""), false, "0.5 g"); }
        else if (f.t === "txt") textfeld(f.k, FX, y0 - 5, FW, 16, v);
        else if (f.t === "foto") { kaestchen(f.k, FX, y0 - 2, !!v); text(FX + 14, y0, 8.5, "erledigt", false); }
        else optZeilen.forEach(function (zeile, zi) { zeile.forEach(function (it) { var yy = y0 - zi * 14; kaestchen(f.k, FX + it.x, yy - 2, v != null && String(v) === String(it.o.v)); text(FX + it.x + 13, yy, 8.5, it.o.t, false); }); });
        y = y0 - h; linie(R, y + 9, X2, y + 9, "0.85", 0.4);
      });
      y -= 8;
    });
    // Foto
    if (daten.foto && !daten.leer) {
      var fw = 250, fh = fw * daten.foto.h / daten.foto.w; if (fh > 200) { fh = 200; fw = fh * daten.foto.w / daten.foto.h; }
      platz(fh + 30); text(R, y, 9.5, "Foto der Einbaustelle", true); y -= 8;
      op("q " + f2(fw) + " 0 0 " + f2(fh) + " " + f2(R) + " " + f2(y - fh) + " cm /Im1 Do Q"); s.bild = true; y -= fh + 16;
    }
    // Skizze mit 5-mm-Raster
    var frei = y - (R + 24) - 26 - 150, sh = frei >= 150 ? Math.min(300, frei) : 300; platz(sh + 26);
    text(R, y, 9.5, "Skizze: Lage, Maße, Anschlüsse, Himmelsrichtung", true); y -= 8;
    var mm5 = 14.17, gx; op("0.88 G 0.3 w"); for (gx = R; gx <= X2 + 0.1; gx += mm5) op(f2(gx) + " " + f2(y - sh) + " m " + f2(gx) + " " + f2(y) + " l S"); for (gx = y; gx >= y - sh - 0.1; gx -= mm5) op(f2(R) + " " + f2(gx) + " m " + f2(X2) + " " + f2(gx) + " l S");
    rahmen(R, y - sh, X2 - R, sh, "0.4"); y -= sh + 18;
    // Bemerkungen und Unterschriften
    platz(130); text(R, y, 9.5, "Bemerkungen", true); textfeld("bemerkung", R, y - 58, X2 - R, 50, daten.leer ? "" : daten.bemerkung, true); y -= 92;
    platz(50); [[R, "Aufgemessen (Name, Datum, Unterschrift)"], [310, "Kunde: Maße gemeinsam festgestellt (Unterschrift)"]].forEach(function (u) { linie(u[0], y, u[0] + 245, y, "0.2", 0.7); text(u[0], y - 11, 7.5, u[1], false, "0.35 g"); });
    // Fußzeilen
    seiten.forEach(function (sx, i) { s = sx; text(R, 22, 7, daten.fuss || "", false, "0.45 g"); var sz = "Seite " + (i + 1) + " von " + seiten.length; text(X2 - breite(sz, 7), 22, 7, sz, false, "0.45 g"); });

    // --- Datei zusammensetzen ---
    var teile = [], pos = 0, offs = [], enc = function (str) { var b = new Uint8Array(str.length); for (var i = 0; i < str.length; i++) b[i] = str.charCodeAt(i) & 255; return b; };
    var schreib = function (x) { var b = typeof x === "string" ? enc(x) : x; teile.push(b); pos += b.length; };
    var objs = [], neu = function () { objs.push(null); return objs.length; };
    var setz = function (id, inhalt) { objs[id - 1] = inhalt; };
    var strom = function (dict, daten2) { var b = typeof daten2 === "string" ? enc(daten2) : daten2; return { dict: dict + " /Length " + b.length, b: b }; };
    var katalog = neu(), seitenObj = neu(), f1 = neu(), f2o = neu(), zadb = neu(), form = neu();
    setz(f1, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    setz(f2o, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    setz(zadb, "<< /Type /Font /Subtype /Type1 /BaseFont /ZapfDingbats >>");
    var bildObj = null;
    if (daten.foto && !daten.leer) { bildObj = neu(); setz(bildObj, strom("<< /Type /XObject /Subtype /Image /Width " + daten.foto.w + " /Height " + daten.foto.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode", daten.foto.bytes)); }
    var apJa = neu(), apAus = neu();
    setz(apJa, strom("<< /Type /XObject /Subtype /Form /BBox [0 0 9 9] /Resources << /Font << /ZaDb " + zadb + " 0 R >> >>", "q 0 G 1.3 w 1 J 1 j 1.8 4.6 m 3.7 2.2 l 7.4 7.4 l S Q"));
    setz(apAus, strom("<< /Type /XObject /Subtype /Form /BBox [0 0 9 9]", ""));
    var seitenIds = [], feldIds = [];
    seiten.forEach(function (sx) {
      var pid = neu(), cid = neu(); seitenIds.push(pid);
      setz(cid, strom("<<", sx.ops.join("\n")));
      var an = sx.annots.map(function (f) {
        var id = neu(); feldIds.push(id); var r = "[" + f.r.map(f2).join(" ") + "]";
        if (f.typ === "cb") setz(id, "<< /Type /Annot /Subtype /Widget /FT /Btn /T " + pdfStr(f.name) + " /Rect " + r + " /F 4 /P " + pid + " 0 R /V /" + (f.an ? "Yes" : "Off") + " /AS /" + (f.an ? "Yes" : "Off") + " /MK << /CA (4) >> /DA (/ZaDb 0 Tf 0 g) /AP << /N << /Yes " + apJa + " 0 R /Off " + apAus + " 0 R >> >> >>");
        else {
          var w = f.r[2] - f.r[0], h = f.r[3] - f.r[1], ap = neu(), inhalt = "/Tx BMC EMC";
          if (f.v) { var zeilen = f.multi ? umbruch(f.v, 9, w - 6).slice(0, Math.floor((h - 4) / 11)) : [f.v]; inhalt = "/Tx BMC q BT /Helv 9 Tf 0 g " + zeilen.map(function (z, i) { return "1 0 0 1 3 " + f2(f.multi ? h - 11 - i * 11 : (h - 9) / 2 + 2) + " Tm " + pdfStr(z) + " Tj"; }).join(" ") + " ET Q EMC"; }
          setz(ap, strom("<< /Type /XObject /Subtype /Form /BBox [0 0 " + f2(w) + " " + f2(h) + "] /Resources << /Font << /Helv " + f1 + " 0 R >> >>", inhalt));
          setz(id, "<< /Type /Annot /Subtype /Widget /FT /Tx /T " + pdfStr(f.name) + " /Rect " + r + " /F 4 /P " + pid + " 0 R /DA (/Helv 9 Tf 0 g)" + (f.multi ? " /Ff 4096" : "") + (f.v ? " /V " + pdfUtf16(f.v) : "") + " /AP << /N " + ap + " 0 R >> >>");
        }
        return id + " 0 R";
      });
      setz(pid, "<< /Type /Page /Parent " + seitenObj + " 0 R /MediaBox [0 0 " + f2(W) + " " + f2(H) + "] /Resources << /Font << /F1 " + f1 + " 0 R /F2 " + f2o + " 0 R >>" + (sx.bild && bildObj ? " /XObject << /Im1 " + bildObj + " 0 R >>" : "") + " >> /Contents " + cid + " 0 R /Annots [" + an.join(" ") + "] >>");
    });
    setz(seitenObj, "<< /Type /Pages /Kids [" + seitenIds.map(function (i) { return i + " 0 R"; }).join(" ") + "] /Count " + seitenIds.length + " >>");
    setz(form, "<< /Fields [" + feldIds.map(function (i) { return i + " 0 R"; }).join(" ") + "] /DA (/Helv 9 Tf 0 g) /DR << /Font << /Helv " + f1 + " 0 R /ZaDb " + zadb + " 0 R >> >> >>");
    setz(katalog, "<< /Type /Catalog /Pages " + seitenObj + " 0 R /AcroForm " + form + " 0 R /Lang (de-DE) >>");
    schreib("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    objs.forEach(function (o, i) {
      offs[i] = pos; schreib((i + 1) + " 0 obj\n");
      if (typeof o === "string") schreib(o + "\n"); else { schreib(o.dict + " >>\nstream\n"); schreib(o.b); schreib("\nendstream\n"); }
      schreib("endobj\n");
    });
    var xref = pos; schreib("xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" + offs.map(function (o) { return ("000000000" + o).slice(-10) + " 00000 n \n"; }).join(""));
    schreib("trailer\n<< /Size " + (objs.length + 1) + " /Root " + katalog + " 0 R /Info << /Title " + pdfStr(daten.titel) + " /Producer (Kundario-Demo) >> >>\nstartxref\n" + xref + "\n%%EOF\n");
    var out = new Uint8Array(pos), o2 = 0; teile.forEach(function (b) { out.set(b, o2); o2 += b.length; });
    return out;
  };

  /* ---------- 5. BEISPIELFOTOS UND PERSPEKTIVE ---------- */
  var AUSSEN = { solar: 1, dach: 1, sonnenschutz: 1, fenster: 1, garten: 1, heizung: 1, elektro: 1, maler_Fassade: 1 };
  VO.istAussen = function (gw, art) { return !!(AUSSEN[gw] || AUSSEN[gw + "_" + art]) && !(gw === "sonnenschutz" && art === "Plissee"); };
  VO.fassadeFoto = function () {   // gezeichnete Hauswand mit Fenster, Terrasse und Rasen
    var W = 800, H = 560, c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d");
    var lin = function (x0, y0, x1, y1, a, b) { var gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    g.fillStyle = lin(0, 0, 0, 120, "#9cc7e6", "#d8eaf5"); g.fillRect(0, 0, W, 120);                               // Himmel
    g.fillStyle = "#8a4b3b"; g.beginPath(); g.moveTo(-20, 120); g.lineTo(400, 10); g.lineTo(820, 120); g.closePath(); g.fill();   // Dach
    g.strokeStyle = "rgba(0,0,0,.18)"; for (var i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, 120 - i * 12); g.lineTo(800, 120 - i * 12); g.stroke(); }
    g.fillStyle = lin(0, 120, 0, 430, "#efe9de", "#ddd4c6"); g.fillRect(0, 120, W, 310);                           // Putzfassade
    var rg = g.createRadialGradient(560, 200, 30, 560, 200, 520); rg.addColorStop(0, "rgba(255,250,230,.45)"); rg.addColorStop(1, "rgba(255,250,230,0)"); g.fillStyle = rg; g.fillRect(0, 120, W, 310);
    g.fillStyle = "rgba(0,0,0,.10)"; g.fillRect(0, 120, W, 14);                                                     // Schatten unter der Traufe
    g.fillStyle = "#f7f7f5"; g.fillRect(110, 190, 150, 150); g.fillStyle = lin(115, 195, 255, 335, "#cfe5f2", "#8fb9d4"); g.fillRect(120, 200, 60, 130); g.fillRect(190, 200, 60, 130);   // Fenster
    g.fillStyle = "#f7f7f5"; g.fillRect(440, 180, 220, 250); g.fillStyle = lin(450, 190, 650, 425, "#d5e8f3", "#8fb9d4"); g.fillRect(452, 192, 95, 238); g.fillRect(553, 192, 95, 238);   // Terrassentür
    g.fillStyle = "#c9c2b5"; g.fillRect(0, 420, W, 14);                                                            // Sockel
    g.fillStyle = lin(0, 434, 0, 560, "#a7a29a", "#8c877f"); g.beginPath(); g.moveTo(0, 434); g.lineTo(W, 434); g.lineTo(W, 560); g.lineTo(0, 560); g.closePath(); g.fill();   // Terrasse
    g.strokeStyle = "rgba(0,0,0,.15)"; for (i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 80, 434); g.lineTo(i * 110 - 160, 560); g.stroke(); } for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, 460 + i * 34); g.lineTo(W, 460 + i * 34); g.stroke(); }
    g.fillStyle = "#6f9a52"; g.fillRect(0, 520, 160, 40); g.fillRect(700, 500, 100, 60);
    g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, 434, W, 8);
    return c;
  };
  /* Viereck-Transformation: Rechteck w×h → vier Punkte (für CSS matrix3d) */
  VO.matrix = function (w, h, q) {
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, a, b, c, d, e, f, g, hh;
    if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x3 - x0; c = x0; d = y1 - y0; e = y3 - y0; f = y0; g = 0; hh = 0; }
    else {
      var det = dx1 * dy2 - dx2 * dy1; if (Math.abs(det) < 1e-9) det = 1e-9;
      g = (dx3 * dy2 - dx2 * dy3) / det; hh = (dx1 * dy3 - dx3 * dy1) / det;
      a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
    }
    var m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
    return "matrix3d(" + m.map(function (v) { return Math.round(v * 1e6) / 1e6; }).join(",") + ")";
  };
  VO.CHECK = CHECK;

  /* ---------- 6. FENSTER „VOR-ORT-AUFMASS“ ---------- */
  var X = function () { return window.DEMO_AM; }, vo = null;
  var MIC = '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>';
  var STANDPLATZ = {   // wo das Produkt im Beispielfoto zuerst sitzt (Anteile von Breite und Höhe)
    fenster: [[0.1375, 0.339], [0.325, 0.339], [0.325, 0.607], [0.1375, 0.607]], rollladen: [[0.1375, 0.31], [0.325, 0.31], [0.325, 0.607], [0.1375, 0.607]],
    raffstore: [[0.55, 0.3], [0.825, 0.3], [0.825, 0.768], [0.55, 0.768]], insektenschutz: [[0.1375, 0.339], [0.325, 0.339], [0.325, 0.607], [0.1375, 0.607]],
    plissee: [[0.66, 0.15], [0.88, 0.15], [0.88, 0.52], [0.66, 0.52]], haustuer: [[0.56, 0.33], [0.815, 0.33], [0.815, 0.768], [0.56, 0.768]],
    schiebetuer: [[0.55, 0.32], [0.825, 0.32], [0.825, 0.768], [0.55, 0.768]], _pv: [[0.33, 0.06], [0.67, 0.06], [0.76, 0.19], [0.24, 0.19]],
    dachfenster: [[0.44, 0.08], [0.54, 0.08], [0.555, 0.17], [0.425, 0.17]]
  };
  var BODEN = { fliese: 1, bodenbelag: 1, pflaster: 1, _rasen: 1, _flaeche: 1, dusche: 1 };
  var INNEN = { wandgestaltung: [[0.2125, 0.0], [1, 0.0], [1, 0.714], [0.2125, 0.714]] }, FASSADE = { wandgestaltung: [[0, 0.214], [1, 0.214], [1, 0.75], [0, 0.75]] };
  var FRONT = {   // Ansicht von vorne für Produkte, deren Konfigurator-Zeichnung eine Seitenansicht ist
    terrassendach: function (c) {
      var b = Math.max(2, +c.b || 5), hw = Math.max(2, +c.hw || 2.8), hs = Math.min(hw, +c.hs || 2.3), W = b * 100, H = hw * 100, yb = (hw - hs) * 100, n = b > 4.5 ? 3 : 2, g = "";
      g += '<polygon points="0,0 ' + W + ",0 " + W + "," + yb + " 0," + yb + '" fill="rgba(190,220,240,.55)" stroke="#5c6670" stroke-width="3"/>';
      for (var i = 1; i < 6; i++) g += '<line x1="' + (W * i / 6) + '" y1="0" x2="' + (W * i / 6) + '" y2="' + yb + '" stroke="#5c6670" stroke-width="4"/>';
      g += '<rect x="0" y="' + yb + '" width="' + W + '" height="16" fill="#3a3f44"/>';
      for (i = 0; i < n; i++) { var x = i === 0 ? 0 : i === n - 1 ? W - 12 : W / 2 - 6; g += '<rect x="' + x + '" y="' + (yb + 14) + '" width="12" height="' + (H - yb - 14) + '" fill="#3a3f44"/>'; }
      return [W, H, g];
    },
    markise: function (c) {
      var b = Math.max(2, +c.b || 4), a = Math.max(1.5, +c.a || 2.5), W = b * 100, fall = a * 100 * 0.38, H = 26 + fall + 24, g = '<rect width="' + W + '" height="26" rx="5" fill="#d9d9d4" stroke="#8a8a85" stroke-width="2"/>';
      for (var x = 0; x < W; x += 24) g += '<rect x="' + x + '" y="26" width="12" height="' + fall + '" fill="#2f6f8f"/><rect x="' + (x + 12) + '" y="26" width="12" height="' + fall + '" fill="#e9eef0"/>';
      for (x = 0; x < W; x += 30) g += '<path d="M' + x + " " + (26 + fall) + " h30 v14 q-15 12 -30 0 z" + '" fill="#2f6f8f"/>';
      g += '<rect y="' + (20 + fall) + '" width="' + W + '" height="8" fill="#b9bcbe"/>';
      return [W, H, g];
    }
  };
  function standard(gw, p) {
    var a = p.art || "";
    if (gw === "shk") return p.dusche === "bodengleich" ? "dusche" : "waschtisch";
    var m = { heizung: "waermepumpe", elektro: "wallbox", solar: "_pv", maler: "wandgestaltung", fliesen: "fliese", boden: "bodenbelag", dach: "dachfenster", allgemein: "_flaeche" }[gw];
    if (m) return m;
    if (gw === "trockenbau") return /Trennwand|Vorsatz/.test(a) ? "trennwand" : "_flaeche";
    if (gw === "schreiner") return { "Küche": "kueche", Treppe: "treppe" }[a] || "einbauschrank";
    if (gw === "fenster") return /Haustür|Nebeneingang/.test(a) ? "haustuer" : /Garagentor/.test(a) ? "garagentor" : "fenster";
    if (gw === "sonnenschutz") return { Terrassendach: "terrassendach", Markise: "markise", Rollladen: "rollladen", Raffstore: "raffstore", Insektenschutz: "insektenschutz", Plissee: "plissee" }[a] || "markise";
    if (gw === "garten") return { Pflaster: "pflaster", Zaun: "zaun", Hecke: "_hecke", Rasen: "_rasen" }[a] || "pflaster";
    return "_flaeche";
  }
  var EIGEN = { _pv: "PV-Module (Belegung)", _hecke: "Hecke", _rasen: "Rasenfläche", _flaeche: "Fläche" };
  function produkte(gw, p) {
    var P = window.GW.PRODUKTE, d = standard(gw, p), l = [d];
    Object.keys(P).forEach(function (k) { if (P[k].gw === gw && l.indexOf(k) < 0) l.push(k); });
    if (gw === "solar" && l.indexOf("_pv") < 0) l.unshift("_pv");
    if (gw === "garten") ["_hecke", "_rasen"].forEach(function (k) { if (l.indexOf(k) < 0) l.push(k); });
    return l;
  }
  function pname(pid) { return EIGEN[pid] || (window.GW.PRODUKTE[pid] || {}).name || pid; }
  function konfig(pid) {   // Konfiguration des Produkts aus dem Aufmaß-Eintrag (wie im Konfigurator)
    var P = window.GW.PRODUKTE[pid], c = P.start(), C = vo.C, A = vo.A, p = vo.p;
    var z = (C.ziel || {})[pid] || (vo.id === "shk" ? { dusche: "p.kd", waschtisch: "p.kw" }[pid] : null) || "p.k_" + pid;
    var quelle = z === "p" ? p : z.indexOf("e.") === 0 ? A.e[z.slice(2)] : p[z.slice(2)];
    if (quelle && typeof quelle === "object") Object.keys(c).forEach(function (k) { if (quelle[k] != null && typeof quelle[k] !== "object") c[k] = quelle[k]; });
    else (P.masse || []).forEach(function (m) { var v = vo.werte[m.k] != null ? vo.werte[m.k] : p[m.k]; if (v != null && v !== "" && isFinite(parseFloat(v))) c[m.k] = String(v); });
    return c;
  }
  function eigenSvg(pid) {
    var p = vo.werte, i, j, g = "";
    if (pid === "_pv") {
      var sp = Math.max(2, Math.min(14, Math.floor((+p.l || 10) / 1.13))), re = Math.max(1, Math.min(6, Math.floor((+p.b || 6) / 1.72)));
      for (i = 0; i < sp; i++) for (j = 0; j < re; j++) g += '<rect x="' + (i * 115 + 2) + '" y="' + (j * 174 + 2) + '" width="111" height="170" rx="3" fill="#1d2c4d" stroke="#9fb3d1" stroke-width="2"/><path d="M' + (i * 115 + 2) + " " + (j * 174 + 87) + "h111M" + (i * 115 + 57) + " " + (j * 174 + 2) + 'v170" stroke="#3c5684" stroke-width="1.5"/>';
      return [sp * 115 + 4, re * 174 + 4, g];
    }
    if (pid === "_hecke") { for (i = 0; i < 14; i++) g += '<ellipse cx="' + (25 + i * 40) + '" cy="' + (70 + (i % 3) * 6) + '" rx="34" ry="62" fill="' + ["#4f7a43", "#5d8a4c", "#456c3a"][i % 3] + '"/>'; return [600, 150, g]; }
    var gruen = pid === "_rasen", fb = gruen ? "#6f9a52" : "#c9c4b8";
    g = '<rect width="400" height="300" fill="' + fb + '"/>'; for (i = 0; i < 40; i++) g += '<path d="M' + (i * 23 % 400) + " " + (i * 37 % 300) + (gruen ? ' l3 -9 l3 9' : ' l12 0') + '" stroke="' + (gruen ? "#5b8a40" : "#aaa49a") + '" stroke-width="2" fill="none"/>';
    return [400, 300, g];
  }
  function objektSvg() {   // Produktzeichnung ohne Maßlinien und Titel, auf das Objekt zugeschnitten
    var pid = vo.prod, html, svgEl;
    if (EIGEN[pid] || FRONT[pid]) { var e = FRONT[pid] ? FRONT[pid](konfig(pid)) : eigenSvg(pid); vo.seite = e[0] / e[1]; return '<svg viewBox="0 0 ' + e[0] + " " + e[1] + '" preserveAspectRatio="none" class="vo-svg"><g class="vo-g">' + e[2] + "</g></svg>"; }
    html = window.GW.PRODUKTE[pid].zeichnung(konfig(pid));
    var mess = document.getElementById("vo-mess"); mess.innerHTML = html; svgEl = mess.querySelector("svg");
    svgEl.querySelectorAll(".am-mass, .am-masstext, .gw-titel, .gw-boden, .gw-haus, text").forEach(function (n) { n.remove(); });
    var inhalt = Array.prototype.filter.call(svgEl.childNodes, function (n) { return n.nodeName !== "defs"; });
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "vo-g"); inhalt.forEach(function (n) { g.appendChild(n); }); svgEl.appendChild(g);
    var bb = null; try { bb = g.getBBox(); } catch (x) { bb = null; }
    if (bb && bb.width > 2 && bb.height > 2) { svgEl.setAttribute("viewBox", [bb.x - 2, bb.y - 2, bb.width + 4, bb.height + 4].map(function (v) { return Math.round(v * 10) / 10; }).join(" ")); vo.seite = (bb.width + 4) / (bb.height + 4); }
    else { var vb = (svgEl.getAttribute("viewBox") || "0 0 360 270").split(/\s+/); vo.seite = +vb[2] / +vb[3]; }
    svgEl.setAttribute("preserveAspectRatio", "none"); svgEl.setAttribute("class", "vo-svg"); svgEl.removeAttribute("role");
    html = svgEl.outerHTML; mess.innerHTML = ""; return html;
  }
  function startViereck() {
    var bild = document.getElementById("vo-bild"), sw = bild.clientWidth || 600, sh = bild.clientHeight || 420, pid = vo.prod;
    var fest = vo.beispiel ? (vo.aussen ? STANDPLATZ[pid] || FASSADE[pid] : INNEN[pid]) : null;
    if (fest) return fest.map(function (q) { return q.slice(); });
    if (BODEN[pid] || (pid === "_flaeche" && /Estrich/.test(vo.p.art || ""))) return [[0.22, 0.79], [0.78, 0.79], [0.94, 0.97], [0.06, 0.97]];
    var wf = { terrassendach: 0.62, markise: 0.42, garagentor: 0.36, kueche: 0.62, einbauschrank: 0.5, treppe: 0.5, zaun: 0.8, _hecke: 0.8, wandgestaltung: 0.6, trennwand: 0.5 }[pid] || 0.28;
    var hf = wf * sw / (vo.seite || 1) / sh; if (hf > 0.75) { wf *= 0.75 / hf; hf = 0.75; }
    var boden = vo.aussen ? 0.77 : 0.73, cx = vo.aussen ? 0.6 : 0.62, oben = { markise: 0.24, klimageraet: 0.2, plissee: 0.15 }[pid];
    var y0 = oben != null ? oben : Math.max(0.03, boden - hf);
    return [[cx - wf / 2, y0], [cx + wf / 2, y0], [cx + wf / 2, y0 + hf], [cx - wf / 2, y0 + hf]];
  }
  function massLabels() {   // Breite/Höhe an den Kanten (nur in der Skizze)
    var f = vo.kern, w = vo.werte, k1 = ["b", "l", "l1", "lm", "lr", "gh"].filter(function (k) { return f.some(function (x) { return x.k === k; }) && w[k] != null && w[k] !== ""; })[0];
    var k2 = ["h", "hw", "a", "t", "b"].filter(function (k) { return k !== k1 && f.some(function (x) { return x.k === k; }) && w[k] != null && w[k] !== ""; })[0];
    var lab = function (k) { if (!k) return ""; var x = f.filter(function (q) { return q.k === k; })[0]; return x.l.split(/ \(|,| /)[0] + " " + zahlDe(+w[k]) + " " + (x.e || ""); };
    return [lab(k1), lab(k2)];
  }
  function zeichne() {
    if (!vo || !vo.quad || !document.getElementById("vo-bild")) return;
    var bild = document.getElementById("vo-bild"), obj = document.getElementById("vo-obj"), sw = bild.clientWidth, sh = bild.clientHeight;
    if (!sw || !sh) return;
    var ow = 400, oh = 400 / (vo.seite || 1), q = vo.quad.map(function (p) { return [p[0] * sw, p[1] * sh]; });
    obj.style.width = ow + "px"; obj.style.height = oh + "px"; obj.style.transform = VO.matrix(ow, oh, q); obj.style.opacity = vo.deck / 100;
    bild.querySelectorAll(".vo-griff").forEach(function (gr, i) { gr.style.left = q[i][0] + "px"; gr.style.top = q[i][1] + "px"; });
    var ml = massLabels(), mb = document.getElementById("vo-mb"), mh = document.getElementById("vo-mh");
    var mx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, my = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    var setz = function (el, a, b, t) {   // Beschriftung mittig an der Kante, 16 px nach außen
      var dx = b[0] - a[0], dy = b[1] - a[1], w = Math.atan2(dy, dx) * 180 / Math.PI, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
      if ((cx - mx) * nx + (cy - my) * ny < 0) { nx = -nx; ny = -ny; }
      if (w > 90) w -= 180; if (w < -90) w += 180; el.textContent = t; el.hidden = !t || vo.modus !== "skizze";
      el.style.left = cx + nx * 16 + "px"; el.style.top = cy + ny * 16 + "px"; el.style.transform = "translate(-50%,-50%) rotate(" + w + "deg)";
    };
    setz(mb, q[0], q[1], ml[0]); setz(mh, q[3], q[0], ml[1]);
    if (vo.modus === "real") obj.style.filter = "brightness(" + licht(q, sw, sh).toFixed(2) + ") drop-shadow(0 10px 10px rgba(0,0,0,.35))"; else obj.style.filter = "";
  }
  function licht(q, sw, sh) {   // mittlere Helligkeit des Fotos unter dem Produkt → Produkt passend abdunkeln
    if (!vo.klein) return 1;
    var k = vo.klein, xs = q.map(function (p) { return p[0] / sw * k.w; }), ys = q.map(function (p) { return p[1] / sh * k.h; });
    var x0 = Math.max(0, Math.floor(Math.min.apply(0, xs))), x1 = Math.min(k.w - 1, Math.ceil(Math.max.apply(0, xs))), y0 = Math.max(0, Math.floor(Math.min.apply(0, ys))), y1 = Math.min(k.h - 1, Math.ceil(Math.max.apply(0, ys)));
    var s = 0, n = 0; for (var y = y0; y <= y1; y += 2) for (var x = x0; x <= x1; x += 2) { var i = (y * k.w + x) * 4; s += 0.299 * k.d[i] + 0.587 * k.d[i + 1] + 0.114 * k.d[i + 2]; n++; }
    return n ? Math.max(0.62, Math.min(1.12, 0.5 + s / n / 255 * 0.65)) : 1;
  }
  function produktSetzen(pid, neuesViereck) {
    vo.prod = pid; document.getElementById("vo-obj").innerHTML = objektSvg();
    if (neuesViereck || !vo.quad) vo.quad = startViereck();
    zeichne();
  }
  function fotoSetzen(url, beispiel, w, h, quad) {
    vo.foto = url; vo.beispiel = !!beispiel; vo.fotoW = w; vo.fotoH = h;
    var img = document.getElementById("vo-foto");
    img.onload = function () {
      try { var c = document.createElement("canvas"); c.width = 96; c.height = Math.max(1, Math.round(96 * img.naturalHeight / img.naturalWidth)); var g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height); vo.klein = { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data }; } catch (x) { vo.klein = null; }
      vo.quad = quad || startViereck(); zeichne();
    };
    img.src = url;
    if (!beispiel) { vo.werte.f_gesamt = true; liste(); }
  }
  function beispielFoto() {
    var c = vo.aussen ? VO.fassadeFoto() : X().beispielFoto();
    fotoSetzen(c.toDataURL("image/jpeg", 0.86), true, c.width, c.height);
  }
  function fotoLaden(datei) {
    if (!datei || !/^image\//.test(datei.type)) { X().toast("Bitte ein Foto wählen."); return; }
    var img = new Image(), url = URL.createObjectURL(datei);
    img.onload = function () {
      var W = Math.min(1200, img.naturalWidth), H = Math.round(img.naturalHeight * W / img.naturalWidth), c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url); fotoSetzen(c.toDataURL("image/jpeg", 0.86), false, W, H); X().toast("Foto geladen – jetzt die Ecken des Produkts an die richtige Stelle ziehen.");
    };
    img.onerror = function () { X().toast("Das Foto konnte nicht geöffnet werden."); };
    img.src = url;
  }

  /* Checkliste */
  function hatWert(f) { var v = vo.werte[f.k]; return f.t === "foto" ? !!v : v != null && v !== ""; }
  function zeile(f) {
    var v = vo.werte[f.k], id = "vo-f-" + f.k, ein = "", esc = X().esc;
    if (f.t === "sel") ein = '<select id="' + id + '" data-vo-k="' + f.k + '">' + (f.kern ? "" : '<option value="">– offen –</option>') + optionen(f).map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(v) === String(o.v) ? " selected" : "") + ">" + esc(o.t) + "</option>"; }).join("") + "</select>";
    else if (f.t === "foto") ein = '<label class="vo-haken"><input type="checkbox" id="' + id + '" data-vo-k="' + f.k + '"' + (v ? " checked" : "") + "> erledigt</label>";
    else if (f.t === "txt") ein = '<input id="' + id + '" data-vo-k="' + f.k + '" value="' + esc(v == null ? "" : v) + '">';
    else ein = '<span class="vo-zahl"><input type="number" inputmode="decimal" step="any" id="' + id + '" data-vo-k="' + f.k + '" value="' + (v == null ? "" : v) + '"' + (f.min != null ? ' min="' + f.min + '"' : "") + (f.max != null ? ' max="' + f.max + '"' : "") + '><span>' + esc(f.e || "") + "</span></span>";
    return '<div class="vo-zeile' + (hatWert(f) ? " ok" : "") + (vo.neu[f.k] ? " neu" : "") + '" data-vo-zeile="' + f.k + '"><span class="vo-punkt" aria-hidden="true"></span><div class="vo-feld"><label for="' + id + '">' + esc(f.l) + "</label>" + ein + (f.w ? "<small>" + esc(f.w) + "</small>" : "") + "</div></div>";
  }
  function liste() {
    var el = document.getElementById("vo-liste"); if (!el) return;
    var k = vo.kern.filter(function (f) { return f.k !== "art"; }), e = vo.extra, alle = k.concat(e), n = alle.filter(hatWert).length;
    el.innerHTML = '<h4>Maße fürs Angebot</h4>' + k.map(zeile).join("") + "<h4>Vor Ort prüfen</h4>" + e.map(zeile).join("");
    document.getElementById("vo-zahl").textContent = n + " von " + alle.length + " erfasst";
  }
  function wertAus(f, el) {
    if (f.t === "foto") return el.checked;
    if (f.t === "n") { var x = parseFloat(String(el.value).replace(",", ".")); return isFinite(x) ? x : null; }
    return el.value;
  }
  function auswerten() {
    var text = document.getElementById("vo-text").value.trim(), out = document.getElementById("vo-erkannt");
    if (!text) { X().toast("Bitte zuerst eine Sprachnachricht aufnehmen oder Text eingeben."); return; }
    var r = VO.auswerten(text, vo.kern.concat(vo.extra)); vo.neu = {};
    r.erkannt.forEach(function (k) { vo.werte[k] = r.werte[k]; vo.neu[k] = true; });
    vo.text = text; liste(); if (vo.prod) produktSetzen(vo.prod, false);
    var namen = r.erkannt.map(function (k) { return vo.kern.concat(vo.extra).filter(function (f) { return f.k === k; })[0].l; });
    out.innerHTML = r.erkannt.length ? "<b>" + r.erkannt.length + " Angaben erkannt und eingetragen</b> (blau markiert): " + X().esc(namen.join(", ")) + ". Bitte kurz prüfen." : "Keine Maße erkannt – z. B. „Breite 1,20 Meter“ sagen oder die Felder unten ausfüllen.";
    if (r.verworfen.length) out.innerHTML += '<br><span class="vo-warn">Nicht übernommen: ' + X().esc(r.verworfen.join("; ")) + "</span>";
    X().toast(r.erkannt.length + " Angaben eingetragen – bitte prüfen.");
  }

  /* Sprachnachricht */
  function mikro() {
    var btn = document.querySelector("[data-vo-mic]"), ta = document.getElementById("vo-text");
    if (vo.rec) { stopp(); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { X().toast("Aufnehmen geht in diesem Browser nicht – bitte Text eintippen oder die Beispiel-Nachricht nutzen."); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (!vo) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      var stuecke = [], mr = window.MediaRecorder ? new MediaRecorder(stream) : null, basis = ta.value ? ta.value.trim() + " " : "";
      vo.rec = { stream: stream, mr: mr, sr: null };
      if (mr) { mr.ondataavailable = function (e) { if (e.data && e.data.size) stuecke.push(e.data); }; mr.onstop = function () { if (!stuecke.length) return; var a = document.getElementById("vo-audio"); if (a) { a.src = URL.createObjectURL(new Blob(stuecke, { type: mr.mimeType || "audio/webm" })); a.hidden = false; } }; mr.start(); }
      if (SR) {
        var sr = new SR(); sr.lang = "de-DE"; sr.continuous = true; sr.interimResults = true; vo.rec.sr = sr;
        sr.onresult = function (e) { var fest = "", zwischen = ""; for (var i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) fest += e.results[i][0].transcript + " "; else zwischen += e.results[i][0].transcript; } ta.value = basis + fest + zwischen; };
        sr.onerror = function () { /* z. B. kein Netz – Aufnahme läuft weiter */ };
        try { sr.start(); } catch (x) { vo.rec.sr = null; }
      }
      btn.classList.add("aktiv"); btn.lastChild.textContent = "Aufnahme beenden";
      document.getElementById("vo-hinweis-mic").textContent = SR ? "Aufnahme läuft – sprechen Sie Maße und Infos, z. B. „Breite 1,20 Meter, Höhe 1,35 Meter, Anschlag rechts“." : "Aufnahme läuft. Dieser Browser wandelt Sprache nicht selbst in Text um – danach bitte kurz eintippen (auf dem Handy geht auch das Mikrofon der Tastatur).";
      vo.rec.wache = setInterval(function () { if (!document.querySelector(".vo-drawer")) stopp(); }, 600);
    }).catch(function () { X().toast("Kein Zugriff aufs Mikrofon – bitte im Browser erlauben oder Text eintippen."); });
  }
  function stopp() {
    if (!vo || !vo.rec) return; var r = vo.rec; vo.rec = null; clearInterval(r.wache);
    try { if (r.sr) r.sr.stop(); } catch (x) { /* schon beendet */ }
    try { if (r.mr && r.mr.state !== "inactive") r.mr.stop(); } catch (x) { /* schon beendet */ }
    r.stream.getTracks().forEach(function (t) { t.stop(); });
    var btn = document.querySelector("[data-vo-mic]"); if (btn) { btn.classList.remove("aktiv"); btn.lastChild.textContent = "Sprachnachricht aufnehmen"; }
    var h = document.getElementById("vo-hinweis-mic"); if (h) h.textContent = "Aufnahme beendet. Text prüfen und „Auswerten und eintragen“ tippen.";
    var ta = document.getElementById("vo-text"); if (ta && ta.value.trim() && r.sr) setTimeout(auswerten, 400);
  }

  /* Aufmaßzettel */
  function heute() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear(); }
  function fotoBytes(url) { var b = atob(url.split(",")[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  VO.zettel = function (leer) {
    var x = X(), id, C, p, werte, kern, extra, foto = null;
    if (vo && document.querySelector(".vo-drawer")) { id = vo.id; C = vo.C; p = vo.p; werte = vo.werte; kern = vo.kern; extra = vo.extra; if (vo.foto && !vo.beispiel) foto = { url: vo.foto, w: vo.fotoW, h: vo.fotoH }; }
    else {
      id = x.id(); C = x.C(); p = x.p(); kern = C.felder(p).map(function (f) { return Object.assign({ kern: true }, f); }); extra = VO.checkliste(id, p.art);
      werte = Object.assign({}, p.info || {}); kern.forEach(function (f) { werte[f.k] = p[f.k]; });
      if (p.vorort && p.vorort.foto) foto = { url: p.vorort.foto, w: p.vorort.fw, h: p.vorort.fh };
    }
    var mit = function (f) { return Object.assign({}, f, { v: werte[f.k] }); };
    var l = x.lead(), art = p.art ? "Art: " + p.art + " · " : "";
    var bytes = VO.zettelPdf({
      titel: "Aufmaßzettel – " + x.gwName(id), untertitel: art + (C.posten || "Position") + ": " + (leer ? "____________________" : p.name || ""), betrieb: x.betrieb,
      kunde: x.nameT(x.kunde()), adresse: l && l.ort ? l.ort : "", datum: heute(), leer: !!leer, bemerkung: werte.bes || "",
      hinweis: "Jedes Maß dreimal messen (links, Mitte, rechts bzw. oben, Mitte, unten) und das kleinste eintragen. Einheiten wie angegeben. Foto der Einbaustelle und der Anschlüsse machen.",
      gruppen: [{ titel: "Maße fürs Angebot", felder: kern.filter(function (f) { return f.k !== "art" && f.k !== "name"; }).map(mit) }, { titel: "Vor Ort prüfen", felder: extra.filter(function (f) { return f.k !== "bes"; }).map(mit) }],
      foto: foto && foto.w ? { bytes: fotoBytes(foto.url), w: foto.w, h: foto.h } : null,
      fuss: x.betrieb + " · Aufmaßzettel aus der Kundario-Demo (Beispiel, ohne Gewähr)"
    });
    var blob = new Blob([bytes], { type: "application/pdf" }), a = document.createElement("a"), name = "Aufmasszettel_" + x.gwName(id).replace(/&/g, "und").replace(/[^A-Za-z0-9ÄÖÜäöüß]+/g, "-").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue") + (leer ? "_leer" : "") + ".pdf";
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
    VO.letzterZettel = { name: name, groesse: bytes.length };
    x.toast((leer ? "Leerer Aufmaßzettel" : "Aufmaßzettel mit Werten") + " erstellt – am Tablet ausfüllen oder ausdrucken.");
  };

  /* Speichern */
  function speichern() {
    var x = X(), p = vo.p, fehler = [];
    vo.kern.forEach(function (f) {
      if (f.k === "art") return; var v = vo.werte[f.k]; if (v == null || v === "") return;
      if (f.t === "n") { var m = x.pruefe(f, v); if (m) { fehler.push(m); return; } p[f.k] = +v; p.gescannt = false; } else p[f.k] = v;
    });
    var info = {}; vo.extra.forEach(function (f) { var v = vo.werte[f.k]; if (v != null && v !== "" && v !== false) info[f.k] = v; }); p.info = info;
    var daumen = null, fw = 0, fh = 0;
    if (vo.foto && !vo.beispiel) { try { var img = document.getElementById("vo-foto"), c = document.createElement("canvas"); fw = Math.min(480, img.naturalWidth); fh = Math.round(img.naturalHeight * fw / img.naturalWidth); c.width = fw; c.height = fh; c.getContext("2d").drawImage(img, 0, 0, fw, fh); daumen = c.toDataURL("image/jpeg", 0.72); } catch (e) { daumen = null; } }
    var alle = vo.kern.filter(function (f) { return f.k !== "art"; }).concat(vo.extra), n = alle.filter(hatWert).length;
    p.vorort = { foto: daumen, fw: fw, fh: fh, text: vo.text || document.getElementById("vo-text").value.trim(), prod: vo.prod, quad: vo.quad, modus: vo.modus, zeit: Date.now(), erfasst: n, gesamt: alle.length };
    var l = x.lead(); if (l) x.add(l, "Vor-Ort-Aufmaß " + (p.name || "") + ": " + (daumen ? "Foto, " : "") + (p.vorort.text ? "Sprachnachricht, " : "") + n + " von " + alle.length + " Punkten erfasst");
    x.speichern(); x.closeDrawer(); x.neuZeichnen();
    x.toast(fehler.length ? "Übernommen – bitte prüfen: " + fehler.join(" ") : "Ins Aufmaß übernommen: " + n + " von " + alle.length + " Punkten erfasst.");
  }
  VO.stand = function (p) { return p && p.vorort ? p.vorort : null; };

  /* Öffnen */
  VO.oeffnen = function () {
    var x = X(); if (!x) return;
    x.closeDrawer(); x.merkeFokus();
    var id = x.id(), C = x.C(), A = x.A(), p = x.p(), esc = x.esc, svg = x.svg, I = x.ICON;
    var kern = C.felder(p).map(function (f) { return Object.assign({ kern: true }, f); }), extra = VO.checkliste(id, p.art), werte = Object.assign({}, p.info || {});
    kern.forEach(function (f) { werte[f.k] = p[f.k]; });
    vo = { id: id, C: C, A: A, p: p, kern: kern, extra: extra, werte: werte, neu: {}, modus: (p.vorort && p.vorort.modus) || "skizze", deck: 100, aussen: VO.istAussen(id, p.art), text: p.vorort ? p.vorort.text : "" };
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", function () { stopp(); x.closeDrawer(); });
    var d = document.createElement("div"); d.className = "drawer kf-drawer vo-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title"); d.setAttribute("data-nt", "");
    var ecken = ["oben links", "oben rechts", "unten rechts", "unten links"];
    d.innerHTML = x.kopfX("Vor-Ort-Aufmaß · " + esc(p.name || C.posten) + (p.art ? " <small>" + esc(p.art) + "</small>" : "")) +
      '<div class="kf-layout"><div class="ff-buehne vo-buehne">' +
        '<div class="vo-bild vo-' + vo.modus + '" id="vo-bild"><img id="vo-foto" alt="Foto der Einbaustelle"><div class="vo-obj" id="vo-obj" tabindex="0" aria-label="Produkt verschieben"></div>' +
          ecken.map(function (e, i) { return '<span class="vo-griff" data-vo-ecke="' + i + '" tabindex="0" role="slider" aria-label="Ecke ' + e + ' verschieben (Pfeiltasten)"></span>'; }).join("") +
          '<span class="vo-mass" id="vo-mb" hidden></span><span class="vo-mass" id="vo-mh" hidden></span><div id="vo-mess" class="vo-mess" aria-hidden="true"></div>' +
          '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><filter id="vo-licht" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="b"/>' +
          '<feSpecularLighting in="b" surfaceScale="3" specularConstant=".55" specularExponent="16" lighting-color="#ffffff" result="s"><feDistantLight azimuth="235" elevation="42"/></feSpecularLighting>' +
          '<feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".8" k4="0"/></filter></defs></svg></div>' +
        '<div class="vo-steuer"><div class="filter" role="group" aria-label="Darstellung"><button type="button" data-vo-modus="skizze" aria-pressed="' + (vo.modus === "skizze") + '">Skizze mit Maßen</button><button type="button" data-vo-modus="real" aria-pressed="' + (vo.modus === "real") + '">So sieht es aus</button></div>' +
          '<label class="vo-prod">Produkt<select id="vo-prod">' + produkte(id, p).map(function (k) { return '<option value="' + k + '">' + esc(pname(k)) + "</option>"; }).join("") + "</select></label></div>" +
        '<label class="ff-schieber">Vorher / Nachher<input type="range" min="0" max="100" value="100" id="vo-deck"></label>' +
        '<div class="btn-row"><button class="btn-mini" type="button" data-vo-film>Vorher → Nachher abspielen</button><button class="btn-mini" type="button" data-vo-reset>Position zurücksetzen</button></div>' +
        '<p class="src">Die vier Ecken an die Stelle ziehen, wo das Produkt hinkommt – auch schräg fotografierte Wände passen so. Das Bild ist eine maßstäbliche Zeichnung im Foto, kein Foto des echten Produkts; Farben und Licht sind angenähert. Eine fotorealistische Bildmontage ist für die eigene Software geplant.</p></div>' +
      '<div class="kf-optionen"><ol class="ff-schritte">' +
        '<li><b>Foto der Einbaustelle</b><div class="btn-row"><label class="btn btn-outline ff-datei">' + svg(I.camera) + 'Foto aufnehmen oder wählen<input type="file" accept="image/*" capture="environment" id="vo-datei" hidden></label><button class="btn-mini" type="button" data-vo-bspfoto>Beispielfoto</button></div></li>' +
        '<li><b>Sprachnachricht mit Maßen und Infos</b><div class="btn-row"><button class="btn btn-outline vo-mic" type="button" data-vo-mic>' + svg(MIC) + '<span>Sprachnachricht aufnehmen</span></button><button class="btn-mini" type="button" data-vo-bsptext>Beispiel-Nachricht</button></div>' +
          '<p class="src" id="vo-hinweis-mic">Einfach sprechen wie in einer WhatsApp-Sprachnachricht. Der Text erscheint unten und kann korrigiert werden.</p><audio id="vo-audio" controls hidden></audio>' +
          '<label class="vo-text-l" for="vo-text">Text der Nachricht</label><textarea id="vo-text" rows="4" placeholder="z. B. Breite 1,20 Meter, Höhe 1,35 Meter, Laibung innen 24 Zentimeter, Anschlag rechts …">' + esc(vo.text || "") + "</textarea>" +
          '<div class="btn-row"><button class="btn btn-signal btn-klein" type="button" data-vo-auswerten>Auswerten und eintragen</button></div><p class="src vo-erkannt" id="vo-erkannt" aria-live="polite"></p></li>' +
        '<li><b>Checkliste <span class="pill" id="vo-zahl"></span></b><p class="src">Was bei ' + esc(x.gwName(id)) + (p.art ? " (" + esc(p.art) + ")" : "") + " vor Ort wichtig ist. Alles geht auch von Hand.</p><div id=\"vo-liste\" class=\"vo-liste\"></div></li></ol>" +
        '<div class="kf-knoepfe"><button class="btn btn-signal" type="button" data-vo-speichern>Ins Aufmaß übernehmen</button><button class="btn btn-outline" type="button" data-vo-pdf="werte">' + svg(I.doc) + 'Aufmaßzettel mit Werten (PDF)</button><button class="btn btn-outline" type="button" data-vo-pdf="leer">' + svg(I.doc) + "Leerer Aufmaßzettel zum Ausdrucken</button></div>" +
        '<p class="src">Foto und Sprachnachricht bleiben auf diesem Gerät; gespeichert wird nur ein kleines Vorschaubild, wenn Sie „Ins Aufmaß übernehmen“ tippen. Erkannte Maße immer kurz gegenprüfen. Der PDF-Zettel lässt sich am Tablet ausfüllen (Textfelder und Kästchen) oder ausdrucken.</p></div></div>';
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    liste();
    var sel = d.querySelector("#vo-prod"); vo.prod = (p.vorort && p.vorort.prod && produkte(id, p).indexOf(p.vorort.prod) >= 0) ? p.vorort.prod : standard(id, p); sel.value = vo.prod;
    document.getElementById("vo-obj").innerHTML = objektSvg();
    if (p.vorort && p.vorort.foto) fotoSetzen(p.vorort.foto, false, p.vorort.fw, p.vorort.fh, p.vorort.quad);
    else beispielFoto();
    // Ereignisse
    d.addEventListener("click", function (e) {
      var t = e.target, el;
      if ((el = t.closest("[data-vo-modus]"))) { vo.modus = el.getAttribute("data-vo-modus"); d.querySelectorAll("[data-vo-modus]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); }); var b2 = document.getElementById("vo-bild"); b2.classList.toggle("vo-real", vo.modus === "real"); b2.classList.toggle("vo-skizze", vo.modus === "skizze"); zeichne(); return; }
      if (t.closest("[data-vo-bspfoto]")) { beispielFoto(); return; }
      if (t.closest("[data-vo-bsptext]")) { document.getElementById("vo-text").value = VO.beispiel(id, p.art); auswerten(); return; }
      if (t.closest("[data-vo-auswerten]")) { auswerten(); return; }
      if (t.closest("[data-vo-mic]")) { mikro(); return; }
      if (t.closest("[data-vo-reset]")) { vo.quad = startViereck(); zeichne(); return; }
      if (t.closest("[data-vo-film]")) { film(); return; }
      if (t.closest("[data-vo-speichern]")) { stopp(); speichern(); return; }
      if ((el = t.closest("[data-vo-pdf]"))) { VO.zettel(el.getAttribute("data-vo-pdf") === "leer"); return; }
      if (t.closest("[data-close]")) stopp();
    });
    d.querySelector("#vo-datei").addEventListener("change", function (e) { fotoLaden(e.target.files && e.target.files[0]); });
    sel.addEventListener("change", function () { produktSetzen(sel.value, true); });
    d.querySelector("#vo-deck").addEventListener("input", function (e) { vo.deck = +e.target.value; zeichne(); });
    var aendern = function (e, neu) {
      var k = e.target.getAttribute && e.target.getAttribute("data-vo-k"); if (!k) return;
      var f = vo.kern.concat(vo.extra).filter(function (q) { return q.k === k; })[0]; if (!f) return;
      vo.werte[k] = wertAus(f, e.target); delete vo.neu[k];
      var z = d.querySelector('[data-vo-zeile="' + k + '"]'); if (z) { z.classList.toggle("ok", hatWert(f)); z.classList.remove("neu"); }
      var bad = f.t === "n" && vo.werte[k] != null && (vo.werte[k] < f.min || vo.werte[k] > f.max); e.target.setAttribute("aria-invalid", bad ? "true" : "false");
      var alle = vo.kern.filter(function (q) { return q.k !== "art"; }).concat(vo.extra); document.getElementById("vo-zahl").textContent = alle.filter(hatWert).length + " von " + alle.length + " erfasst";
      if (neu && f.kern) produktSetzen(vo.prod, false); else if (f.kern) zeichne();
    };
    d.addEventListener("input", function (e) { aendern(e, false); });
    d.addEventListener("change", function (e) { aendern(e, true); });
    // Ecken und Produkt ziehen
    var bild = d.querySelector("#vo-bild"), zug = null;
    var punkt = function (e) { var r = bild.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    bild.addEventListener("pointerdown", function (e) {
      var gr = e.target.closest(".vo-griff"), ob = e.target.closest(".vo-obj"); if (!gr && !ob) return;
      e.preventDefault(); zug = { i: gr ? +gr.getAttribute("data-vo-ecke") : -1, start: punkt(e), quad: vo.quad.map(function (q) { return q.slice(); }) };
      try { bild.setPointerCapture(e.pointerId); } catch (x2) { /* egal */ }
    });
    bild.addEventListener("pointermove", function (e) {
      if (!zug) return; var pt = punkt(e), dx = pt[0] - zug.start[0], dy = pt[1] - zug.start[1], kl = function (v) { return Math.max(-0.1, Math.min(1.1, v)); };
      if (zug.i >= 0) vo.quad[zug.i] = [kl(zug.quad[zug.i][0] + dx), kl(zug.quad[zug.i][1] + dy)];
      else vo.quad = zug.quad.map(function (q) { return [kl(q[0] + dx), kl(q[1] + dy)]; });
      zeichne();
    });
    var los = function () { zug = null; }; bild.addEventListener("pointerup", los); bild.addEventListener("pointercancel", los);
    bild.addEventListener("keydown", function (e) {
      var gr = e.target.closest(".vo-griff"), ob = e.target.closest(".vo-obj"), sch = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!sch || (!gr && !ob)) return;
      e.preventDefault(); var s = e.shiftKey ? 0.03 : 0.006, idx = gr ? [+gr.getAttribute("data-vo-ecke")] : [0, 1, 2, 3];
      idx.forEach(function (i) { vo.quad[i] = [vo.quad[i][0] + sch[0] * s, vo.quad[i][1] + sch[1] * s]; }); zeichne();
    });
    if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (!document.contains(bild)) { ro.disconnect(); return; } zeichne(); }); ro.observe(bild); }
    var c0 = d.querySelector("[data-close]"); if (c0) c0.focus();
  };
  function film() {
    var start = null, el = document.getElementById("vo-deck");
    var schritt = function (t) { if (!vo || !document.getElementById("vo-bild")) return; if (start == null) start = t; var k = Math.min(1, (t - start) / 1600); vo.deck = Math.round(k * 100); el.value = vo.deck; zeichne(); if (k < 1) requestAnimationFrame(schritt); };
    vo.deck = 0; zeichne(); setTimeout(function () { requestAnimationFrame(schritt); }, 350);
  }
})();
