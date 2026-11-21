/* Kundario – Checklisten vor Ort je Gewerk für das Aufmaß.
   Erzeugt aus der Demo (js/aufmass-vorort.js, Abschnitt CHECKLISTEN). Punkte hier ändern oder ergänzen.
   t: n = Zahl (e Einheit, min/max üblicher Bereich), s = Auswahl (o), t = Text; w = warum der Punkt wichtig ist */
window.K_CHECKLISTEN = {
 "shk": {
  "label": "Bad und Sanitär",
  "arten": {
   "*": [
    {
     "k": "aufbau",
     "l": "Fußbodenaufbau gesamt",
     "t": "n",
     "e": "cm",
     "min": 2,
     "max": 40,
     "w": "Bodengleiche Dusche: genug Höhe für Ablauf und Gefälle?"
    },
    {
     "k": "fallrohr",
     "l": "Abstand Ablauf bis Fallrohr",
     "t": "n",
     "e": "m",
     "min": 0.1,
     "max": 15,
     "w": "Je weiter weg, desto mehr Gefälle und Höhe braucht die Leitung."
    },
    {
     "k": "gefaelle",
     "l": "Gefälle zum Ablauf (1–2 %) möglich",
     "t": "s",
     "o": [
      "ja",
      "knapp",
      "nein"
     ],
     "w": "Richtwert für bodengleiche Duschen 1–2 %."
    },
    {
     "k": "decke",
     "l": "Decke unter dem Bad",
     "t": "s",
     "o": [
      "Betondecke",
      "Holzbalkendecke"
     ],
     "w": "Bei Holzbalken: Balkenrichtung notieren, Ablauf darf keinen Balken schneiden."
    },
    {
     "k": "balken",
     "l": "Balkenrichtung (nur Holzbalkendecke)",
     "t": "t"
    },
    {
     "k": "abdicht",
     "l": "Abdichtung heute",
     "t": "s",
     "o": [
      "vorhanden",
      "keine",
      "unbekannt"
     ]
    },
    {
     "k": "anschl",
     "l": "Lage Wasser- und Abwasseranschlüsse",
     "t": "t"
    },
    {
     "k": "lueft",
     "l": "Lüftung",
     "t": "s",
     "o": [
      "Fenster",
      "Lüfter",
      "keine"
     ]
    },
    {
     "k": "f_anschl",
     "l": "Foto Anschlüsse und Fallrohr",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "heizung": {
  "label": "Heizung und Wärmepumpe",
  "arten": {
   "*": [
    {
     "k": "heizlast",
     "l": "Heizlast nach DIN EN 12831",
     "t": "s",
     "o": [
      "liegt vor",
      "berechnen"
     ],
     "w": "Grundlage für die Größe der Wärmepumpe."
    },
    {
     "k": "verbrauch",
     "l": "Verbrauch pro Jahr (Mittel 3 Jahre)",
     "t": "n",
     "e": "kWh",
     "min": 500,
     "max": 200000,
     "w": "Aus den Abrechnungen; Öl: Liter × 10 ≈ kWh."
    },
    {
     "k": "vorlauf",
     "l": "Vorlauftemperatur heute",
     "t": "n",
     "e": "°C",
     "min": 20,
     "max": 90,
     "w": "Unter 55 °C ist günstig für eine Wärmepumpe."
    },
    {
     "k": "baujahr",
     "l": "Baujahr Haus",
     "t": "n",
     "e": "",
     "min": 1800,
     "max": 2030
    },
    {
     "k": "wohnfl",
     "l": "Wohnfläche beheizt",
     "t": "n",
     "e": "m²",
     "min": 20,
     "max": 1000
    },
    {
     "k": "aufst",
     "l": "Aufstellort Außengerät",
     "t": "t",
     "w": "Fester Untergrund, Kondensat abführen, Luft muss frei strömen."
    },
    {
     "k": "schall",
     "l": "Abstand zum nächsten Nachbarfenster",
     "t": "n",
     "e": "m",
     "min": 0.5,
     "max": 100,
     "w": "Schall: Herstellerangaben und TA Lärm prüfen, oft sind einige Meter nötig."
    },
    {
     "k": "leitung",
     "l": "Leitungsweg innen bis außen",
     "t": "n",
     "e": "m",
     "min": 0.5,
     "max": 50
    },
    {
     "k": "ww",
     "l": "Warmwasser heute",
     "t": "s",
     "o": [
      "über die Heizung",
      "Durchlauferhitzer",
      "Boiler"
     ]
    },
    {
     "k": "f_zs",
     "l": "Foto Zählerschrank",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wärmepumpe ist steuerbare Verbrauchseinrichtung nach § 14a EnWG – Platz für Zähler und Steuerbox prüfen."
    },
    {
     "k": "f_hk",
     "l": "Fotos Heizkörper und Heizraum",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "elektro": {
  "label": "Elektro",
  "arten": {
   "*": [
    {
     "k": "baujahr",
     "l": "Baujahr Elektroanlage",
     "t": "n",
     "e": "",
     "min": 1900,
     "max": 2030
    },
    {
     "k": "fi",
     "l": "FI-Schutzschalter vorhanden",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ],
     "w": "Fehlt er, ist bei Erweiterungen meist Nachrüsten nötig."
    },
    {
     "k": "hausanschl",
     "l": "Absicherung Hausanschluss",
     "t": "n",
     "e": "A",
     "min": 16,
     "max": 250
    },
    {
     "k": "wb_ort",
     "l": "Montageort Wallbox",
     "t": "s",
     "o": [
      "Garage",
      "Carport",
      "Außenwand"
     ]
    },
    {
     "k": "wb_weg",
     "l": "Leitungsweg Zählerschrank bis Wallbox",
     "t": "n",
     "e": "m",
     "min": 1,
     "max": 100,
     "w": "Länge bestimmt Querschnitt und Kosten. Wallbox beim Netzbetreiber melden (über 11 kW genehmigen lassen)."
    },
    {
     "k": "erdung",
     "l": "Erdung / Potentialausgleich",
     "t": "t"
    },
    {
     "k": "f_zs",
     "l": "Foto Zählerschrank geöffnet",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Bei Erweiterung gelten die Anschlussregeln des Netzbetreibers (VDE-AR-N 4100)."
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "solar": {
  "label": "Solar und Photovoltaik",
  "arten": {
   "*": [
    {
     "k": "eindeck",
     "l": "Dacheindeckung",
     "t": "s",
     "o": [
      "Tondachziegel",
      "Betondachstein",
      "Blech",
      "Schiefer",
      "Faserzement"
     ],
     "w": "Faserzement vor 1993: Asbestverdacht – nicht bohren, erst prüfen."
    },
    {
     "k": "dachalter",
     "l": "Alter der Eindeckung",
     "t": "n",
     "e": "Jahre",
     "min": 0,
     "max": 120,
     "w": "Älter als ca. 25 Jahre: Sanierung vor der PV mitdenken."
    },
    {
     "k": "statik",
     "l": "Sparren und Statik",
     "t": "t"
    },
    {
     "k": "versch",
     "l": "Verschattung",
     "t": "s",
     "o": [
      "keine",
      "morgens",
      "abends",
      "teilweise"
     ],
     "w": "Bäume, Gauben, Nachbarhäuser – kostet Ertrag."
    },
    {
     "k": "wr",
     "l": "Platz für Wechselrichter und Speicher",
     "t": "t"
    },
    {
     "k": "kabel",
     "l": "Kabelweg Dach bis Zählerschrank",
     "t": "n",
     "e": "m",
     "min": 1,
     "max": 100
    },
    {
     "k": "zugang_d",
     "l": "Zugang zum Dach",
     "t": "s",
     "o": [
      "Gerüst nötig",
      "Hubsteiger",
      "frei"
     ]
    },
    {
     "k": "rechnung",
     "l": "Jahresstromrechnung liegt vor",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "f_zs",
     "l": "Foto Zählerschrank",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Anschluss nach VDE-AR-N 4100; alter Schrank muss oft erneuert werden."
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "maler": {
  "label": "Maler",
  "arten": {
   "Innenraum": [
    {
     "k": "untergr",
     "l": "Untergrund",
     "t": "s",
     "o": [
      "Putz",
      "Gipskarton",
      "Tapete",
      "Beton"
     ]
    },
    {
     "k": "zust",
     "l": "Zustand",
     "t": "s",
     "o": [
      "gut",
      "Risse",
      "Feuchte / Schimmel",
      "stark verschmutzt"
     ],
     "w": "Feuchte und Schimmel zuerst klären, sonst hält der Anstrich nicht."
    },
    {
     "k": "moebel",
     "l": "Möbel",
     "t": "s",
     "o": [
      "Raum leer",
      "Möbel bleiben im Raum"
     ],
     "w": "Abdecken und Rücken kostet Zeit."
    },
    {
     "k": "lack",
     "l": "Türen / Heizkörper lackieren",
     "t": "n",
     "e": "Stk.",
     "min": 0,
     "max": 40
    },
    {
     "k": "abkleb",
     "l": "Abkleben (Fenster, Böden, Steckdosen)",
     "t": "t"
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Fassade": [
    {
     "k": "untergr",
     "l": "Untergrund",
     "t": "s",
     "o": [
      "Putz",
      "WDVS",
      "Klinker",
      "Holz"
     ]
    },
    {
     "k": "zust",
     "l": "Zustand",
     "t": "s",
     "o": [
      "gut",
      "Risse",
      "Algen / Moos",
      "Abplatzungen"
     ]
    },
    {
     "k": "geruest",
     "l": "Gerüst",
     "t": "s",
     "o": [
      "nötig",
      "nicht nötig"
     ],
     "w": "Standfläche, Nachbargrund und Gehweg (Genehmigung) prüfen."
    },
    {
     "k": "fenster_n",
     "l": "Fenster in der Fläche",
     "t": "n",
     "e": "Stk.",
     "min": 0,
     "max": 100,
     "w": "Nach VOB/C (DIN 18363) Öffnungen über 2,5 m² abziehen."
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "fliesen": {
  "label": "Fliesen",
  "arten": {
   "*": [
    {
     "k": "untergr",
     "l": "Untergrund",
     "t": "s",
     "o": [
      "Estrich",
      "alte Fliesen",
      "Gipskarton",
      "Putz"
     ]
    },
    {
     "k": "eben",
     "l": "Ebenheit: größte Abweichung",
     "t": "n",
     "e": "mm",
     "min": 0,
     "max": 50,
     "w": "Bei großen Formaten muss der Untergrund sehr eben sein, sonst spachteln."
    },
    {
     "k": "abdicht",
     "l": "Abdichtung im Nassbereich nötig",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "fbh",
     "l": "Fußbodenheizung",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ],
     "w": "Belegreifheizen mit Protokoll nötig."
    },
    {
     "k": "altweg",
     "l": "Alte Fliesen entfernen",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "profil",
     "l": "Kantenprofile",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 200
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "boden": {
  "label": "Boden",
  "arten": {
   "*": [
    {
     "k": "cm",
     "l": "Restfeuchte (CM-Messung)",
     "t": "n",
     "e": "%",
     "min": 0,
     "max": 10,
     "w": "Zementestrich meist max. 2,0 CM-% (mit Fußbodenheizung 1,8) – Herstellerangabe des Belags gilt."
    },
    {
     "k": "eben",
     "l": "Ebenheit: größte Abweichung",
     "t": "n",
     "e": "mm",
     "min": 0,
     "max": 50,
     "w": "Richtwert für Klickbeläge: ca. 3 mm auf 1 m – sonst spachteln."
    },
    {
     "k": "fbh",
     "l": "Fußbodenheizung",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ],
     "w": "Aufheizprotokoll anfordern."
    },
    {
     "k": "fest",
     "l": "Festigkeit (Kratzprobe)",
     "t": "s",
     "o": [
      "fest",
      "sandet"
     ]
    },
    {
     "k": "uebg",
     "l": "Übergänge / Schienen",
     "t": "n",
     "e": "Stk.",
     "min": 0,
     "max": 30
    },
    {
     "k": "sockel",
     "l": "Sockelleisten",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 300
    },
    {
     "k": "kuerzen",
     "l": "Türen kürzen",
     "t": "n",
     "e": "Stk.",
     "min": 0,
     "max": 20,
     "w": "Neuer Boden ist höher – Türen müssen oft gekürzt werden."
    },
    {
     "k": "raeumen",
     "l": "Möbel räumen",
     "t": "s",
     "o": [
      "Kunde räumt",
      "wir räumen"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "trockenbau": {
  "label": "Trockenbau und Estrich",
  "arten": {
   "Trockenbau": [
    {
     "k": "anschl",
     "l": "Anschluss an Boden und Decke",
     "t": "s",
     "o": [
      "Beton",
      "Estrich",
      "Holzbalken"
     ]
    },
    {
     "k": "schall",
     "l": "Schallschutz",
     "t": "s",
     "o": [
      "normal",
      "erhöht"
     ]
    },
    {
     "k": "feucht",
     "l": "Feuchtraum (imprägnierte Platten)",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "install",
     "l": "Steckdosen und Leitungen in der Wand",
     "t": "t"
    },
    {
     "k": "q",
     "l": "Oberfläche",
     "t": "s",
     "o": [
      "Q2",
      "Q3",
      "Q4"
     ],
     "w": "Q3 und Q4 bei Streiflicht oder glatter Farbe."
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Estrich": [
    {
     "k": "hoehe",
     "l": "Höhe Rohboden bis Fertigfußboden",
     "t": "n",
     "e": "cm",
     "min": 3,
     "max": 40,
     "w": "Muss für Dämmung, Estrich und Belag reichen."
    },
    {
     "k": "fbh",
     "l": "Fußbodenheizung",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "leitungen",
     "l": "Leitungen auf dem Rohboden",
     "t": "t"
    },
    {
     "k": "trocken",
     "l": "Trocknungszeit eingeplant",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ],
     "w": "Zementestrich braucht je nach Dicke mehrere Wochen, Belag erst nach CM-Messung."
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "schreiner": {
  "label": "Schreiner",
  "arten": {
   "Einbauschrank": [
    {
     "k": "h_l",
     "l": "Höhe links",
     "t": "n",
     "e": "m",
     "min": 0.3,
     "max": 4,
     "w": "Raumhöhe an mehreren Stellen messen – Wände und Decken sind selten gerade."
    },
    {
     "k": "h_r",
     "l": "Höhe rechts",
     "t": "n",
     "e": "m",
     "min": 0.3,
     "max": 4
    },
    {
     "k": "knie",
     "l": "Kniestock (bei Dachschräge)",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 2.5
    },
    {
     "k": "schraeg",
     "l": "Neigung der Dachschräge",
     "t": "n",
     "e": "°",
     "min": 0,
     "max": 80
    },
    {
     "k": "sockel",
     "l": "Sockelleiste",
     "t": "s",
     "o": [
      "vorhanden – ausklinken",
      "keine"
     ]
    },
    {
     "k": "dosen",
     "l": "Steckdosen / Schalter in der Nische",
     "t": "t"
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Küche": [
    {
     "k": "raumh",
     "l": "Raumhöhe (an mehreren Stellen, kleinster Wert)",
     "t": "n",
     "e": "m",
     "min": 2,
     "max": 4,
     "w": "Jede Wand von Ecke zu Ecke und auf zwei Höhen messen."
    },
    {
     "k": "brue",
     "l": "Fensterbrüstung Höhe",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 2,
     "w": "Arbeitsplatte vor dem Fenster muss darunter passen."
    },
    {
     "k": "arbh",
     "l": "Gewünschte Arbeitshöhe",
     "t": "n",
     "e": "m",
     "min": 0.75,
     "max": 1.1,
     "w": "Faustregel: ca. 10–15 cm unter dem Ellenbogen."
    },
    {
     "k": "wasser",
     "l": "Lage Wasser und Abwasser",
     "t": "t"
    },
    {
     "k": "gas",
     "l": "Gasanschluss",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "abluft",
     "l": "Dunstabzug",
     "t": "s",
     "o": [
      "Abluft möglich",
      "Umluft"
     ]
    },
    {
     "k": "hk",
     "l": "Heizkörper an der Küchenwand",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "neuboden",
     "l": "Neuer Boden kommt dazu (Aufbau)",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 10
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Treppe": [
    {
     "k": "durchg",
     "l": "Durchgangshöhe",
     "t": "n",
     "e": "m",
     "min": 1.5,
     "max": 3,
     "w": "DIN 18065: mindestens 2,00 m lichte Durchgangshöhe."
    },
    {
     "k": "loch_l",
     "l": "Deckenöffnung Länge",
     "t": "n",
     "e": "m",
     "min": 1,
     "max": 6
    },
    {
     "k": "loch_b",
     "l": "Deckenöffnung Breite",
     "t": "n",
     "e": "m",
     "min": 0.5,
     "max": 2
    },
    {
     "k": "okff",
     "l": "Fertigfußboden oben und unten",
     "t": "s",
     "o": [
      "bekannt",
      "kommt noch"
     ],
     "w": "Steigung immer von Fertigfußboden zu Fertigfußboden. Schrittmaß 2 × Steigung + Auftritt = 59–65 cm."
    },
    {
     "k": "gel",
     "l": "Geländer",
     "t": "s",
     "o": [
      "eine Seite",
      "beide Seiten",
      "Wand auf beiden Seiten"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "dach": {
  "label": "Dach",
  "arten": {
   "*": [
    {
     "k": "sparren",
     "l": "Sparrenabstand",
     "t": "n",
     "e": "cm",
     "min": 30,
     "max": 120
    },
    {
     "k": "unterd",
     "l": "Unterdach / Unterspannbahn",
     "t": "s",
     "o": [
      "vorhanden",
      "keine"
     ]
    },
    {
     "k": "lattung",
     "l": "Lattung",
     "t": "s",
     "o": [
      "gut",
      "erneuern"
     ]
    },
    {
     "k": "durchdr",
     "l": "Kamin und Durchdringungen",
     "t": "n",
     "e": "Stk.",
     "min": 0,
     "max": 20
    },
    {
     "k": "rinne_l",
     "l": "Rinnenlänge",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 200
    },
    {
     "k": "fallr",
     "l": "Fallrohre",
     "t": "n",
     "e": "Stk.",
     "min": 0,
     "max": 20
    },
    {
     "k": "geruest",
     "l": "Gerüst-Standfläche",
     "t": "s",
     "o": [
      "frei",
      "Hindernisse"
     ]
    },
    {
     "k": "asbest",
     "l": "Faserzement / Asbestverdacht",
     "t": "s",
     "o": [
      "nein",
      "Verdacht"
     ],
     "w": "Bis 1993 verbaute Faserzementplatten können Asbest enthalten – Fachfirma."
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "fenster": {
  "label": "Fenster und Türen",
  "arten": {
   "Fenster": [
    {
     "k": "lai_i",
     "l": "Laibungstiefe innen",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 60,
     "w": "Jedes Maß 3 × messen, das kleinste nehmen."
    },
    {
     "k": "lai_a",
     "l": "Laibungstiefe außen",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 60
    },
    {
     "k": "brue",
     "l": "Brüstungshöhe",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 200,
     "w": "Unter ca. 90 cm (Obergeschoss) an Absturzsicherung denken."
    },
    {
     "k": "diag",
     "l": "Diagonalen gleich",
     "t": "s",
     "o": [
      "ja",
      "Differenz"
     ],
     "w": "Zeigt, ob die Öffnung schief ist."
    },
    {
     "k": "rk",
     "l": "Rollladenkasten",
     "t": "s",
     "o": [
      "keiner",
      "Vorbau",
      "Aufsatz",
      "alter Einbaukasten"
     ]
    },
    {
     "k": "griff",
     "l": "Griffposition",
     "t": "s",
     "o": [
      "Mitte",
      "außermittig"
     ]
    },
    {
     "k": "fb_a",
     "l": "Fensterbank außen",
     "t": "s",
     "o": [
      "bleibt",
      "neu"
     ]
    },
    {
     "k": "wand",
     "l": "Wandaufbau",
     "t": "s",
     "o": [
      "Mauerwerk",
      "WDVS",
      "Holz"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Haustür": [
    {
     "k": "schwelle",
     "l": "Höhe Fertigfußboden innen zu außen",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 40,
     "w": "Barrierearm: möglichst flache Schwelle."
    },
    {
     "k": "dinr",
     "l": "Öffnungsrichtung (von außen gesehen)",
     "t": "s",
     "o": [
      "DIN links",
      "DIN rechts"
     ]
    },
    {
     "k": "lai_i",
     "l": "Laibungstiefe innen",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 60
    },
    {
     "k": "wand",
     "l": "Wandaufbau",
     "t": "s",
     "o": [
      "Mauerwerk",
      "WDVS",
      "Holz"
     ]
    },
    {
     "k": "strom",
     "l": "Strom für E-Öffner / Klingel",
     "t": "t"
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Garagentor": [
    {
     "k": "sturz",
     "l": "Sturzhöhe (Platz über der Öffnung)",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 100,
     "w": "Je nach Torsystem nötig – Herstellerangabe prüfen."
    },
    {
     "k": "seite_l",
     "l": "Seitenanschlag links",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 100
    },
    {
     "k": "seite_r",
     "l": "Seitenanschlag rechts",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 100
    },
    {
     "k": "tiefe",
     "l": "Einfahrtstiefe Garage",
     "t": "n",
     "e": "m",
     "min": 1,
     "max": 20,
     "w": "Tor läuft unter der Decke nach hinten."
    },
    {
     "k": "strom",
     "l": "Stromanschluss für Antrieb",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "sonnenschutz": {
  "label": "Sonnenschutz und Überdachung",
  "arten": {
   "Terrassendach": [
    {
     "k": "gef",
     "l": "Gefälle",
     "t": "n",
     "e": "°",
     "min": 0,
     "max": 30,
     "w": "Meist mindestens ca. 5°, damit Wasser abläuft."
    },
    {
     "k": "fund",
     "l": "Fundamente",
     "t": "s",
     "o": [
      "vorhanden",
      "neu"
     ],
     "w": "Neue Fundamente brauchen Zeit zum Aushärten."
    },
    {
     "k": "eind",
     "l": "Eindeckung",
     "t": "s",
     "o": [
      "VSG-Glas",
      "Polycarbonat"
     ]
    },
    {
     "k": "schnee",
     "l": "Schneelastzone",
     "t": "s",
     "o": [
      "1",
      "1a",
      "2",
      "2a",
      "3"
     ],
     "w": "Bestimmt Profile und Sparrenabstand."
    },
    {
     "k": "genehm",
     "l": "Genehmigung und Grenzabstand geprüft",
     "t": "s",
     "o": [
      "ja",
      "noch prüfen"
     ]
    },
    {
     "k": "entw",
     "l": "Entwässerung (Fallrohr wohin)",
     "t": "t"
    },
    {
     "k": "untergr",
     "l": "Wand für den Wandanschluss",
     "t": "s",
     "o": [
      "Beton",
      "Mauerwerk",
      "WDVS",
      "Holz"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Markise": [
    {
     "k": "mh",
     "l": "Montagehöhe",
     "t": "n",
     "e": "m",
     "min": 1.5,
     "max": 6,
     "w": "Unter dem ausgefahrenen Tuch sollten mindestens ca. 2,20 m frei bleiben."
    },
    {
     "k": "untergr",
     "l": "Wand / Untergrund",
     "t": "s",
     "o": [
      "Beton",
      "Mauerwerk",
      "WDVS",
      "Holz / Sparren"
     ],
     "w": "WDVS: thermisch getrennte Abstandsmontage nötig."
    },
    {
     "k": "abst",
     "l": "Abstand über dem Fenstersturz",
     "t": "n",
     "e": "cm",
     "min": 0,
     "max": 200,
     "w": "Mehr als ca. 20 cm, damit Konsolen halten."
    },
    {
     "k": "neig",
     "l": "Neigung",
     "t": "n",
     "e": "°",
     "min": 0,
     "max": 45,
     "w": "Üblich 15–25°."
    },
    {
     "k": "strom",
     "l": "Stromanschluss in der Nähe",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "sensor",
     "l": "Sensor",
     "t": "s",
     "o": [
      "kein",
      "Wind",
      "Wind und Sonne"
     ]
    },
    {
     "k": "notb",
     "l": "Notbedienung",
     "t": "s",
     "o": [
      "Kurbel",
      "keine"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Rollladen": [
    {
     "k": "panzer",
     "l": "Panzer",
     "t": "s",
     "o": [
      "Aluminium",
      "Kunststoff"
     ]
    },
    {
     "k": "schiene",
     "l": "Führungsschienen",
     "t": "s",
     "o": [
      "in der Laibung",
      "auf der Fassade"
     ]
    },
    {
     "k": "strom",
     "l": "Strom am Fenster",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "bestand",
     "l": "Bestand (alter Kasten, Gurt)",
     "t": "t"
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Raffstore / Insektenschutz": [
    {
     "k": "montage",
     "l": "Montage",
     "t": "s",
     "o": [
      "Laibung",
      "Fassade",
      "Rahmen",
      "Glasleiste"
     ]
    },
    {
     "k": "griffst",
     "l": "Fenstergriff stört",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "strom",
     "l": "Strom vorhanden",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "wind",
     "l": "Wind / Lage",
     "t": "t"
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "garten": {
  "label": "Garten- und Landschaftsbau",
  "arten": {
   "Pflaster": [
    {
     "k": "aushub",
     "l": "Aushubtiefe",
     "t": "n",
     "e": "cm",
     "min": 5,
     "max": 100,
     "w": "Richtwert: Gehweg ca. 25–30 cm, PKW-Zufahrt ca. 40–50 cm."
    },
    {
     "k": "boden",
     "l": "Boden",
     "t": "s",
     "o": [
      "sandig",
      "lehmig",
      "steinig"
     ]
    },
    {
     "k": "gef",
     "l": "Gefälle vom Haus weg",
     "t": "n",
     "e": "%",
     "min": 0,
     "max": 10,
     "w": "Mindestens ca. 2 %, damit Wasser abläuft."
    },
    {
     "k": "rand",
     "l": "Randeinfassung",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 300
    },
    {
     "k": "rinne",
     "l": "Entwässerungsrinne",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 100
    },
    {
     "k": "zufahrt",
     "l": "Zufahrt für Bagger / LKW",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Hecke": [
    {
     "k": "abst",
     "l": "Abstand zur Grenze",
     "t": "n",
     "e": "m",
     "min": 0,
     "max": 10,
     "w": "Bayern (Art. 47 AGBGB): bis 2 m Höhe 0,5 m, höher 2 m Abstand."
    },
    {
     "k": "pflabst",
     "l": "Pflanzabstand",
     "t": "n",
     "e": "cm",
     "min": 10,
     "max": 200
    },
    {
     "k": "boden",
     "l": "Boden",
     "t": "s",
     "o": [
      "sandig",
      "lehmig",
      "steinig"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Zaun": [
    {
     "k": "pfosten",
     "l": "Pfostenabstand",
     "t": "n",
     "e": "m",
     "min": 1,
     "max": 4
    },
    {
     "k": "gelaende",
     "l": "Gelände",
     "t": "s",
     "o": [
      "eben",
      "Hang"
     ]
    },
    {
     "k": "leit",
     "l": "Leitungen im Boden",
     "t": "s",
     "o": [
      "geprüft",
      "unbekannt"
     ],
     "w": "Vor dem Graben Leitungsauskunft einholen."
    },
    {
     "k": "grenze",
     "l": "Grundstücksgrenze markiert",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ],
   "Allgemein": [
    {
     "k": "boden",
     "l": "Boden",
     "t": "s",
     "o": [
      "sandig",
      "lehmig",
      "steinig"
     ]
    },
    {
     "k": "wasser",
     "l": "Bewässerung",
     "t": "s",
     "o": [
      "keine",
      "Regner",
      "Tropfschlauch"
     ]
    },
    {
     "k": "zufahrt",
     "l": "Zufahrt für Maschinen",
     "t": "s",
     "o": [
      "ja",
      "nein"
     ]
    },
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 },
 "allgemein": {
  "label": "Allgemein (Zugang, Besonderheiten)",
  "arten": {
   "*": [
    {
     "k": "f_gesamt",
     "l": "Foto der Einbaustelle (Übersicht)",
     "t": "s",
     "o": [
      "gemacht",
      "fehlt"
     ],
     "w": "Wird automatisch abgehakt, sobald ein Foto im Vor-Ort-Aufmaß ist."
    },
    {
     "k": "zugang",
     "l": "Zugang, Parken, Stockwerk",
     "t": "t",
     "w": "Wichtig für Anfahrt, Tragen und Gerüst."
    },
    {
     "k": "bes",
     "l": "Besonderheiten und Wünsche des Kunden",
     "t": "t"
    }
   ]
  }
 }
};
