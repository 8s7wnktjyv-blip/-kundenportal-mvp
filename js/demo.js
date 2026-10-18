/* =====================================================================
   DEMO-DASHBOARD (gehört zu demo.html)
   ---------------------------------------------------------------------
   1. BEISPIELDATEN   ← hier können Sie Testkunden ändern oder ergänzen
   2. Hilfsfunktionen
   3. Ansichten: Übersicht, Anfragen, Nachfassen, Kunden
   4. Detail-Ansicht einer Anfrage
   5. „Neue Anfrage simulieren“ (KI-Vorprüfung)
   6. Geführte Tour
   Alle Daten sind erfunden. Es wird nichts gespeichert oder verschickt.
   ===================================================================== */
(function () {
  "use strict";

  /* =====================================================================
     1. BEISPIELDATEN
     stage: "neu" | "angebot" | "auftrag" | "erledigt"
     tage:  vor wie vielen Tagen die Anfrage kam
     ki:    "passt" | "pruefen" | "passtnicht"
     ===================================================================== */
  var BETRIEB = "Musterbetrieb Haustechnik";

  var START_LEADS = [
    { name: "Familie Huber", ort: "Erlangen", kanal: "whatsapp", betreff: "Badsanierung, ca. 8 m²", wert: 14500, stage: "neu", tage: 0,
      tel: "0151 000 0001", mail: "huber@beispiel.de",
      nachricht: "Hallo, wir möchten unser Bad (ca. 8 m²) komplett sanieren, gerne mit bodengleicher Dusche. Wann hätten Sie Zeit für eine Besichtigung? Fotos schicke ich mit.",
      ki: "passt", kiText: "Komplettsanierung Bad, ca. 8 m², bodengleiche Dusche gewünscht. 4 Fotos vorhanden. Ort liegt im Einzugsgebiet (12 km).",
      kiRec: "Empfehlung: Besichtigungstermin diese Woche anbieten." },
    { name: "Thomas Bauer", ort: "Fürth", kanal: "telefon", betreff: "Heizung ausgefallen", wert: 450, stage: "neu", tage: 0, dringend: true,
      tel: "0151 000 0002", mail: "t.bauer@beispiel.de",
      nachricht: "(Anruf, vom Telefonassistenten aufgenommen) Heizung geht seit heute früh nicht mehr, Display zeigt Fehler F28. Bin ab 16 Uhr erreichbar.",
      ki: "passt", kiText: "Störung Gasheizung, Fehler F28 (Zündung). Kunde ab 16 Uhr erreichbar. Dringend: Haushalt ohne Heizung.",
      kiRec: "Empfehlung: Heute zurückrufen und Notdienst-Termin vereinbaren." },
    { name: "Sabine Wimmer", ort: "Herzogenaurach", kanal: "email", betreff: "Heizungswartung", wert: 260, stage: "neu", tage: 1,
      tel: "0151 000 0003", mail: "s.wimmer@beispiel.de",
      nachricht: "Guten Tag, ich hätte gern einen Termin für die jährliche Wartung unserer Gasheizung, gerne im Oktober.",
      ki: "passt", kiText: "Jährliche Wartung Gasheizung, Wunschzeitraum Oktober. Planbarer Auftrag.",
      kiRec: "Empfehlung: Wartungstermin mit anderen Terminen in Herzogenaurach bündeln." },
    { name: "WEG Regnitzstraße 12", ort: "Erlangen", kanal: "formular", betreff: "Strangsanierung, 18 Einheiten", wert: 85000, stage: "neu", tage: 2,
      tel: "0871 000 0004", mail: "verwaltung@beispiel.de",
      nachricht: "Für die Eigentümergemeinschaft suchen wir ein Angebot für die Strangsanierung (Trinkwasser und Abwasser) in 18 Wohnungen. Ausführung frühestens im Frühjahr.",
      ki: "pruefen", kiText: "Großprojekt (18 Einheiten), Ausführung Frühjahr. Eventuell mehrere Angebote angefragt.",
      kiRec: "Empfehlung: Kapazität im Frühjahr prüfen, dann Begehung vereinbaren." },
    { name: "Max Lechner", ort: "Hersbruck", kanal: "formular", betreff: "Wasserhahn tropft", wert: 90, stage: "neu", tage: 1,
      tel: "0151 000 0005", mail: "m.lechner@beispiel.de",
      nachricht: "Mein Küchenwasserhahn tropft. Können Sie vorbeikommen?",
      ki: "passtnicht", kiText: "Kleinauftrag, 38 km Anfahrt. Lohnt sich eher nicht.",
      kiRec: "Empfehlung: Freundlich absagen oder mit einem anderen Termin in Hersbruck verbinden." },

    { name: "Familie Maier", ort: "Erlangen", kanal: "whatsapp", betreff: "Badsanierung", wert: 14200, stage: "angebot", tage: 13, angebotVor: 9, erinnert: 1,
      tel: "0151 000 0006", mail: "maier@beispiel.de", nachricht: "Wir interessieren uns für ein neues Bad mit Badewanne und Dusche.",
      ki: "passt", kiText: "Badsanierung mit Wanne und Dusche, ca. 10 m².", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },
    { name: "Petra Schmid", ort: "Zirndorf", kanal: "email", betreff: "Wärmepumpe statt Ölheizung", wert: 24800, stage: "angebot", tage: 8, angebotVor: 4, erinnert: 1,
      tel: "0151 000 0007", mail: "p.schmid@beispiel.de", nachricht: "Wir möchten unsere alte Ölheizung durch eine Wärmepumpe ersetzen.",
      ki: "passt", kiText: "Tausch Ölheizung gegen Wärmepumpe, Einfamilienhaus Baujahr 1995.", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },
    { name: "Johann Forster", ort: "Schwabach", kanal: "telefon", betreff: "Gäste-WC erneuern", wert: 6900, stage: "angebot", tage: 21, angebotVor: 16, erinnert: 2,
      tel: "0151 000 0008", mail: "j.forster@beispiel.de", nachricht: "Gäste-WC soll komplett erneuert werden.",
      ki: "passt", kiText: "Gäste-WC komplett, ca. 3 m².", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },
    { name: "Andrea Kraus", ort: "Uttenreuth", kanal: "formular", betreff: "Heizkörper tauschen", wert: 3400, stage: "angebot", tage: 4, angebotVor: 2, erinnert: 0,
      tel: "0151 000 0009", mail: "a.kraus@beispiel.de", nachricht: "Fünf alte Heizkörper sollen getauscht werden.",
      ki: "passt", kiText: "Tausch von 5 Heizkörpern, Reihenhaus.", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },

    { name: "Familie Brandl", ort: "Erlangen", kanal: "whatsapp", betreff: "Heizungstausch", wert: 11600, stage: "auftrag", tage: 30,
      tel: "0151 000 0010", mail: "brandl@beispiel.de", nachricht: "Neue Gasbrennwerttherme gewünscht.",
      ki: "passt", kiText: "Tausch Gastherme gegen Brennwertgerät.", kiRec: "Auftrag läuft – Ausführung nächste Woche." },
    { name: "Martin Reiter", ort: "Buckenhof", kanal: "email", betreff: "Neue Badarmaturen", wert: 1250, stage: "auftrag", tage: 12,
      tel: "0151 000 0011", mail: "m.reiter@beispiel.de", nachricht: "Bitte Armaturen in Bad und Küche erneuern.",
      ki: "passt", kiText: "Armaturen Bad und Küche.", kiRec: "Auftrag läuft." },

    { name: "Claudia Fischer", ort: "Spardorf", kanal: "telefon", betreff: "Wartung Heizung", wert: 320, stage: "erledigt", tage: 18, bewertung: "offen",
      tel: "0151 000 0012", mail: "c.fischer@beispiel.de", nachricht: "Jährliche Wartung.",
      ki: "passt", kiText: "Wartung Gasheizung.", kiRec: "Erledigt – jetzt um eine Bewertung bitten." },
    { name: "Familie Obermeier", ort: "Baiersdorf", kanal: "whatsapp", betreff: "Badsanierung", wert: 16900, stage: "erledigt", tage: 60, bewertung: "erhalten",
      tel: "0151 000 0013", mail: "obermeier@beispiel.de", nachricht: "Komplettes Bad im Obergeschoss.",
      ki: "passt", kiText: "Badsanierung Obergeschoss.", kiRec: "Erledigt – Bewertung erhalten." }
  ];

  // Bestandskunden und alte Angebote (für „Kunden“ → Reaktivierung)
  // Kundenprofile: Gekauftes, Verbautes, Ideen und Notizen (alles erfunden, nur geschäftliche Angaben)
  var PROFIL = {
    "Familie Brandl": { seit: 2021, kanal: "WhatsApp", zahlung: "zahlt pünktlich · Ø 9 Tage", bewertung: true, empfehlungen: 1, tags: ["Stammkunde"],
      auftraege: [["Heizungstausch Gas-Brennwert", "Okt. 2026", 11600, "läuft", "–", 14, 6], ["Kundendienst: Thermostatventile", "März 2024", 640, "bezahlt", "2026", 3, 2], ["Badsanierung Obergeschoss", "Juni 2021", 14200, "bezahlt", "2026", 22, 9]],
      geraete: [["Gas-Brennwerttherme 24 kW", "Heizung", "Okt. 2026", "Okt. 2031", "Okt. 2027"], ["Warmwasserspeicher 200 l", "Heizung", "Okt. 2026", "Okt. 2031", "mit der Therme"], ["Unterputz-Spülkasten", "Bad OG", "Juni 2021", "Juni 2026", "–"]],
      ideen: [["Wartungsvertrag anbieten", "Neue Therme – jährliche Wartung sichert die Garantie", "Wartungsvertrag"], ["Gewährleistung Bad endet", "Bad von 2021 – Abschlussprüfung anbieten", "Termin vorschlagen"]],
      notizen: ["Bitte 30 Min. vorher anrufen", "Parken in der Einfahrt ok", "Hund im Garten – freundlich"] },
    "Familie Obermeier": { seit: 2025, kanal: "E-Mail", zahlung: "zahlt pünktlich · Ø 6 Tage", bewertung: true, empfehlungen: 2, tags: ["Empfehlungsgeber"],
      auftraege: [["Badsanierung komplett", "Sep. 2026", 16900, "bezahlt", "2031", 28, 11]],
      geraete: [["Bodengleiche Dusche mit Rinne", "Bad", "Sep. 2026", "Sep. 2031", "Silikonfugen prüfen 2028"], ["Unterputz-Spülkasten", "Bad", "Sep. 2026", "Sep. 2031", "–"], ["Handtuchheizkörper elektrisch", "Bad", "Sep. 2026", "Sep. 2028", "–"]],
      ideen: [["Gäste-WC fragen", "Hat beim Bad nach dem Gäste-WC gefragt", "Nachricht vorbereiten"], ["Danke für 2 Empfehlungen", "Zwei Neukunden über Familie Obermeier", "Dankeschön senden"]],
      notizen: ["Schlüssel bei Nachbarn Nr. 14, wenn niemand da ist"] },
    "Georg Hofbauer": { seit: 2016, kanal: "Telefon", zahlung: "zahlt pünktlich · Ø 12 Tage", bewertung: false, empfehlungen: 0, tags: ["Stammkunde", "Wartung"],
      auftraege: [["Wartung Gas-Brennwert", "Aug. 2025", 189, "bezahlt", "–", 2, 1], ["Heizungstausch", "Mai 2016", 7211, "bezahlt", "–", 8, 4]],
      geraete: [["Gas-Brennwerttherme 19 kW", "Keller", "Mai 2016", "abgelaufen", "fällig diese Woche"]],
      ideen: [["Wartung fällig", "Letzte Wartung vor 14 Monaten", "Termin vorschlagen"], ["Therme 10 Jahre alt", "Beratung zu Austausch oder Wärmepumpe anbieten", "Termin vorschlagen"]],
      notizen: ["Lieber Festnetz als Handy", "Vormittags erreichbar"] },
    "Anton Wagner": { seit: 2019, kanal: "Telefon", zahlung: "zahlt meist nach Erinnerung · Ø 21 Tage", bewertung: true, empfehlungen: 0, tags: ["Wartungsvertrag"],
      auftraege: [["Wartung Ölheizung", "Okt. 2025", 219, "bezahlt", "–", 1, 1], ["Ölheizung eingebaut", "Apr. 2019", 9581, "bezahlt", "–", 10, 5]],
      geraete: [["Öl-Brennwertkessel", "Keller", "Apr. 2019", "Apr. 2024", "in 12 Tagen"], ["Öltank 3.000 l", "Keller", "vorhanden", "–", "Tankprüfung 2027"]],
      ideen: [["Wartung in 12 Tagen", "Laut Wartungsvertrag", "Termin vorschlagen"]],
      notizen: ["Zugang Keller über Garage"] },
    "Familie Huber": { seit: 2026, kanal: "WhatsApp", zahlung: "noch keine Rechnung", bewertung: false, empfehlungen: 0, tags: ["Interessent"],
      auftraege: [], geraete: [["Bad (Bestand, ca. 1995)", "Bad und Gäste-WC", "–", "–", "–"]],
      ideen: [["Angebot aus dem Aufmaß", "Aufmaß liegt vor – Angebot erstellen", "Angebot öffnen"]],
      notizen: ["Wünscht bodengleiche Dusche", "Termine am liebsten nachmittags"] },
    "Johann Forster": { seit: 2026, kanal: "E-Mail", zahlung: "1 Rechnung 9 Tage überfällig", bewertung: false, empfehlungen: 0, tags: ["Neukunde"],
      auftraege: [["Kleinreparatur Heizung", "Sep. 2026", 1480, "offen", "2028", 2, 1]],
      geraete: [["Heizkörperventile (4 Stk.)", "Wohnung", "Sep. 2026", "Sep. 2028", "–"]],
      ideen: [["Angebot Badsanierung nachfassen", "Angebot 6.900 € seit 8 Tagen offen", "Nachfassen"]],
      notizen: [] }
  };
  function profilVon(name) {
    if (PROFIL[name]) return PROFIL[name];
    var k = (state.kunden || []).filter(function (x) { return x.name === name; })[0], l = state.leads.filter(function (x) { return x.name === name; })[0];
    var auftrag = l && (l.stage === "auftrag" || l.stage === "erledigt");
    return { seit: 2026, kanal: l && KANAL[l.kanal] ? KANAL[l.kanal].label : "Telefon", zahlung: auftrag ? "noch keine Rechnung fällig" : "–", bewertung: false, empfehlungen: 0,
      tags: [k && k.art === "alt" ? "Altes Angebot" : auftrag ? "Kunde" : "Interessent"],
      auftraege: auftrag ? [[l.betreff, "2026", l.wert, l.stage === "erledigt" ? "bezahlt" : "läuft", "–", 0, 1]] : [],
      geraete: [], ideen: k && k.art === "alt" ? [["Altes Angebot reaktivieren", k.info, "Reaktivieren"]] : [], notizen: [] };
  }
  var START_KUNDEN = [
    { name: "Georg Hofbauer", ort: "Erlangen", art: "bestand", info: "Letzte Wartung vor 14 Monaten", aktion: "Wartung anbieten", umsatz: 7400 },
    { name: "Anton Wagner", ort: "Heroldsberg", art: "bestand", info: "Heizung eingebaut vor 7 Jahren", aktion: "Wartung anbieten", umsatz: 9800 },
    { name: "Familie Stadler", ort: "Eckental", art: "alt", info: "Angebot Bad (12.300 €) vor 1 Jahr, nicht beauftragt", aktion: "Reaktivieren", umsatz: 0 },
    { name: "Renate Engl", ort: "Möhrendorf", art: "alt", info: "Angebot Wärmepumpe (21.500 €) vor 8 Monaten, nicht beauftragt", aktion: "Reaktivieren", umsatz: 0 },
    { name: "Stefan Huber", ort: "Uttenreuth", art: "alt", info: "Angebot Gäste-WC (5.800 €) vor 5 Monaten, nicht beauftragt", aktion: "Reaktivieren", umsatz: 0 }
  ];

  // Mögliche neue Anfragen für „Neue Anfrage simulieren“
  var NEUE_ANFRAGEN = [
    { name: "Julia Gruber", ort: "Erlangen", kanal: "whatsapp", betreff: "Dusche undicht", wert: 1800,
      tel: "0151 000 0020", mail: "j.gruber@beispiel.de",
      nachricht: "Hallo! Unsere Dusche ist seit ein paar Tagen undicht, unten kommt Wasser raus. Ich schick Ihnen gleich zwei Fotos. Wann könnten Sie mal schauen?",
      ki: "passt", kiText: "Undichte Dusche, vermutlich Silikonfuge oder Ablauf. 2 Fotos vorhanden. Ort im Einzugsgebiet (4 km).",
      kiRec: "Empfehlung: Kurzfristigen Termin anbieten – Folgeschäden möglich." },
    { name: "Bernhard Seidl", ort: "Buckenhof", kanal: "telefon", betreff: "Wärmepumpe – Beratung", wert: 26000,
      tel: "0151 000 0021", mail: "b.seidl@beispiel.de",
      nachricht: "(Anruf, vom Telefonassistenten aufgenommen) Möchte sich zu einer Wärmepumpe beraten lassen, Haus Baujahr 2002, aktuell Gasheizung.",
      ki: "passt", kiText: "Beratung Wärmepumpe, Einfamilienhaus Baujahr 2002, Gasheizung vorhanden. Förderung wahrscheinlich Thema.",
      kiRec: "Empfehlung: Vor-Ort-Beratung anbieten." },
    { name: "Laura Neumaier", ort: "Lauf a. d. Pegnitz", kanal: "email", betreff: "Kleines Bad modernisieren", wert: 9500,
      tel: "0151 000 0022", mail: "l.neumaier@beispiel.de",
      nachricht: "Guten Tag, wir möchten unser kleines Bad (ca. 5 m²) modernisieren. Budget etwa 10.000 €. Haben Sie im Winter Kapazität?",
      ki: "passt", kiText: "Modernisierung Bad, ca. 5 m², Budget ca. 10.000 € genannt. Ausführung Winter.",
      kiRec: "Empfehlung: Besichtigung anbieten, Budget passt." }
  ];

  /* =====================================================================
     2. HILFSFUNKTIONEN
     ===================================================================== */
  var KANAL = {
    whatsapp: { label: "WhatsApp", icon: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/>' },
    telefon:  { label: "Telefon",  icon: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>' },
    email:    { label: "E-Mail",   icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>' },
    formular: { label: "Website",  icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>' },
    ausschreibung: { label: "Ausschreibung", icon: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' },
    portal:   { label: "Vermittelt", icon: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.3 11l9.4-4.8M7.3 13l9.4 4.8"/>' }
  };
  var STAGES = [
    { id: "neu", label: "Neu" },
    { id: "angebot", label: "Angebot offen" },
    { id: "auftrag", label: "Auftrag" },
    { id: "erledigt", label: "Erledigt" }
  ];
  var KI = {
    passt: { cls: "ok", label: "KI: passt gut" },
    pruefen: { cls: "check", label: "KI: prüfen" },
    passtnicht: { cls: "no", label: "KI: lohnt kaum" }
  };
  var ICON = {
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    euro: '<path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/>',
    spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    radar: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    network: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.3 11l9.4-4.8M7.3 13l9.4 4.8"/>',
    job: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    flow: '<rect x="2" y="3" width="7" height="6" rx="1.5"/><rect x="15" y="15" width="7" height="6" rx="1.5"/><path d="M9 6h4a3 3 0 0 1 3 3v6"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    ruler: '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    megafon: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'
  };
  var VIEWS = [
    { id: "uebersicht", label: "Übersicht", icon: ICON.home },
    { id: "anfragen", label: "Anfragen", icon: ICON.inbox },
    { id: "nachfassen", label: "Nachfassen", icon: ICON.bell },
    { id: "vertrieb", label: "Vertrieb", icon: ICON.target },
    { id: "kunden", label: "Kunden", icon: ICON.users },
    { id: "dokumente", label: "Dokumente", icon: ICON.doc },
    { id: "angebote", label: "Angebote", icon: ICON.pen },
    { id: "auftraege", label: "Aufträge", icon: ICON.job },
    { id: "rechnungen", label: "Rechnungen", icon: ICON.euro },
    { id: "finanzen", label: "Finanzen", icon: ICON.chart },
    { id: "auswertungen", label: "Auswertungen", icon: ICON.chart },
    { id: "marketing", label: "Marketing", icon: ICON.megafon },
    { id: "einstellungen", label: "Einstellungen", icon: ICON.gear },
    { id: "termine", label: "Kalender", icon: ICON.calendar },
    { id: "aufmass", label: "Aufmaß", icon: ICON.ruler },
    { id: "monteure", label: "Montagekräfte", icon: ICON.wrench },
    { id: "ablaeufe", label: "Abläufe", icon: ICON.flow },
    { id: "vermittlung", label: "Vermittlung", icon: ICON.network },
    { id: "material", label: "Material", icon: ICON.box },
    { id: "wartung", label: "Wartung", icon: ICON.shield },
    { id: "fristen", label: "Pflichten & Fristen", icon: ICON.clock },
    { id: "portal", label: "Kundenportal", icon: ICON.link },
    { id: "ausschreibungen", label: "Ausschreibungen", icon: ICON.radar },
    { id: "netzwerk", label: "Netzwerk", icon: ICON.network },
    { id: "personal", label: "Personal", icon: ICON.job },
    { id: "preise", label: "Preise & Produkte", icon: ICON.euro },
    { id: "branchen", label: "Andere Branchen", icon: ICON.spark }   // nicht im Menü (Branche oben wählbar), erreichbar über demo.html#branchen
  ];
  var NACHFASS_TAGE = [3, 7, 14]; // Erinnerungen nach x Tagen

  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var svg = function (path, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : "") + ">" + path + "</svg>"; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var vorTagen = function (t) { return t <= 0 ? "heute" : t === 1 ? "gestern" : "vor " + t + " Tagen"; };
  var anrede = function (name) { return /^Familie|^WEG/.test(name) ? "Hallo " + name : "Hallo " + name.split(" ")[0]; };

  var state;
  function reset() {
    var id = 1;
    state = {
      view: "uebersicht",
      rolle: "gf",
      filter: "alle",
      suche: "",
      kundenFilter: "alle",
      autoNachfassen: true,
      flows: { anfrage: true, vermittlung: true, auftrag: true, regie: true, zahlung: true, nachher: true },
      log: [], vm: VM_START.map(function (v) { return Object.assign({}, v); }), signiert: {}, papier: [], dokFilter: "alle", dokStatus: "alle",
      stageM: "neu",
      pool: 0,
      leads: START_LEADS.map(function (l) {
        var lead = Object.assign({ id: id++ }, l);
        lead.verlauf = startVerlauf(lead);
        return lead;
      }),
      kunden: START_KUNDEN.map(function (k) { return Object.assign({ erledigt: false }, k); }),
      kal: { ansicht: null, offset: 0, wer: "alle", sync: { google: true, outlook: false, apple: false } }
    };
  }
  function startVerlauf(l) {
    var v = [{ t: l.tage, text: "Anfrage per " + KANAL[l.kanal].label + " eingegangen" },
             { t: l.tage, text: "KI-Vorprüfung: " + KI[l.ki].label.replace("KI: ", "") }];
    if (l.angebotVor !== undefined || l.stage === "auftrag" || l.stage === "erledigt") {
      var av = l.angebotVor !== undefined ? l.angebotVor : Math.max(l.tage - 3, 1);
      v.push({ t: av, text: "Angebot über " + euro.format(l.wert) + " gesendet" });
      for (var i = 0; i < (l.erinnert || 0); i++) v.push({ t: av - NACHFASS_TAGE[i], text: (i + 1) + ". Erinnerung automatisch gesendet" });
    }
    if (l.stage === "auftrag" || l.stage === "erledigt") v.push({ t: Math.max(l.tage - 8, 0), text: "Auftrag erhalten · Rechnung vorbereitet" });
    if (l.stage === "erledigt") v.push({ t: Math.max(l.tage - 14, 0), text: "Arbeiten abgeschlossen · Rechnung gestellt" });
    if (l.bewertung === "erhalten") v.push({ t: Math.max(l.tage - 20, 0), text: "Google-Bewertung erhalten" });
    return v;
  }

  var $main = document.getElementById("app-main");
  var $toasts = document.getElementById("toasts");
  if (window.MutationObserver) new MutationObserver(function () { if (state) kopfSchmuecken(); }).observe($main, { childList: true });

  function toast(text) {
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = svg(ICON.check) + "<span>" + text + "</span>";
    $toasts.appendChild(el);
    while ($toasts.children.length > 2) $toasts.removeChild($toasts.firstChild);   // höchstens 2 Meldungen gleichzeitig
    setTimeout(function () { el.remove(); }, 4200);
  }

  // Abgeleitete Zahlen
  function offeneAngebote() { return state.leads.filter(function (l) { return l.stage === "angebot"; }); }
  function faelligNachfassen() {
    return offeneAngebote().filter(function (l) {
      var naechste = NACHFASS_TAGE[l.erinnert];
      return naechste !== undefined && l.angebotVor >= naechste;
    });
  }
  function neueAnfragen() { return state.leads.filter(function (l) { return l.stage === "neu"; }); }

  /* =====================================================================
     3. ANSICHTEN
     ===================================================================== */
  var HAUPT = ["uebersicht", "anfragen", "kunden", "termine"];   // unten auf dem Handy, der Rest unter „Mehr“
  // Menü: 5 Gruppen, „Alltag“ immer offen, sonst nur die Gruppe mit der aktuellen Ansicht (oder per Klick geöffnet)
  var GRUPPEN = [["Alltag", ["uebersicht", "anfragen", "nachfassen", "vertrieb", "kunden", "termine"]], ["Baustelle", ["aufmass", "monteure", "material", "wartung"]],
    ["Büro & Geld", ["dokumente", "angebote", "auftraege", "rechnungen", "finanzen", "auswertungen", "ablaeufe"]], ["Betrieb", ["preise", "personal", "fristen", "einstellungen"]], ["Mehr Aufträge", ["marketing", "portal", "ausschreibungen", "netzwerk", "vermittlung"]]];
  var GKEY = { "Alltag": "alltag", "Baustelle": "baustelle", "Büro & Geld": "geld", "Betrieb": "betrieb", "Mehr Aufträge": "mehr" };
  function gruppeVon(id) { if (id === "akte") id = "kunden"; for (var i = 0; i < GRUPPEN.length; i++) if (GRUPPEN[i][1].indexOf(id) > -1) return GRUPPEN[i]; return GRUPPEN[0]; }
  function kopfSchmuecken() {   // Akzentfarbe der Gruppe und Symbol im Kopf jeder Ansicht
    var g = gruppeVon(state.view), key = GKEY[g[0]];
    $main.className = $main.className.replace(/\bg-\w+/g, "").trim() + " g-" + key;
    var vh = $main.querySelector(".view-head > div"); if (!vh || vh.querySelector(".vh-ic")) return;
    var v = VIEWS.filter(function (x) { return x.id === (state.view === "akte" ? "kunden" : state.view); })[0]; if (!v) return;
    var h1 = vh.querySelector("h1"); if (!h1) return;
    var box = document.createElement("div"); box.className = "vh-titel";
    box.innerHTML = '<span class="vh-ic">' + svg(v.icon) + '</span><span class="vh-txt"><em class="vh-gruppe">' + g[0] + "</em></span>";
    h1.parentNode.insertBefore(box, h1); box.querySelector(".vh-txt").appendChild(h1);
  }
  var MODULE = { finanzen: 1, personal: 1, fristen: 1, material: 1, ausschreibungen: 1 };   // dazubuchbar, im Menü markiert
  var navOffen = {};
  function navCounts() {
    return { vermittlung: state.vm.filter(function (v) { return v.status === "neu"; }).length, dokumente: dokumenteAlle().filter(function (d) { return d.st === "wartet"; }).length, anfragen: neueAnfragen().length, nachfassen: faelligNachfassen().length,
      rechnungen: mod.rechnungen.filter(function (r) { return r.status !== "bezahlt" && r.faellig > 0; }).length };
  }
  function renderNav() {
    var counts = navCounts();
    var aktiv = function (id) { return state.view === id || (state.view === "akte" && id === "kunden"); };
    var knopf = function (v) {
      var c = counts[v.id] ? '<span class="count">' + counts[v.id] + "</span>" : "";
      return '<button type="button" data-view="' + v.id + '"' + (aktiv(v.id) ? ' aria-current="page"' : "") + ">" +
             svg(v.icon) + "<span>" + v.label + "</span>" + (MODULE[v.id] ? '<em class="nav-modul">Modul</em>' : "") + c + "</button>";
    };
    var einfach = einfachAktiv(), alleErlaubt = VIEWS.filter(function (v) { return erlaubt(v.id) && v.id !== "branchen"; });
    var sichtbar = VIEWS.filter(function (v) { return erlaubt(v.id) && (!einfach || EINFACH.indexOf(v.id) > -1 || v.id === state.view); });
    var side = GRUPPEN.map(function (g, gi) {
      var items = sichtbar.filter(function (v) { return g[1].indexOf(v.id) > -1; });
      if (!items.length) return "";
      var offen = true;   // alles sichtbar, Gruppen nur als Überschrift
      var summe = items.reduce(function (n, v) { return n + (counts[v.id] || 0); }, 0);
      return '<div class="nav-block g-' + GKEY[g[0]] + (offen ? " offen" : "") + '">' +
        (true ? '<p class="nav-group">' + g[0] + "</p>" :
          '<button type="button" class="nav-kopf" data-nav-gruppe="' + g[0] + '" aria-expanded="' + !!offen + '"><span>' + g[0] + '</span><small>' + items.length + "</small>" +
          (!offen && summe ? '<span class="count">' + summe + "</span>" : "") + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>') +
        (offen ? '<div class="nav-items">' + items.map(knopf).join("") + "</div>" : "") + "</div>";
    }).join("");
    var gw = window.GW ? gwName(hauptGewerk()) : "";
    var kopf = (["gf", "buero", "aussen"].indexOf(state.rolle) > -1 ? '<div class="menue-modus" role="group" aria-label="Menü"><button type="button" data-menue="einfach" aria-pressed="' + einfach + '">Einfach</button><button type="button" data-menue="alle" aria-pressed="' + !einfach + '">Alle</button></div>' +
      (einfach ? '<p class="menue-hinweis">' + (alleErlaubt.length - EINFACH.length) + " weitere Bereiche unter „Alle Bereiche“</p>" : "") : "") +
      (gw ? '<button type="button" class="gw-chip" data-gewerk-wahl>' + (GW.IC[hauptGewerk()] ? svg(GW.IC[hauptGewerk()]) : "") + "<span>" + esc(gw) + (gewerkeAlle().length > 1 ? " +" + (gewerkeAlle().length - 1) : "") + "</span><small>ändern</small></button>" : "");
    document.getElementById("side-nav").innerHTML = kopf + side;
    var H = hauptFuer();
    var haupt = H.map(function (id) { return sichtbar.filter(function (v) { return v.id === id; })[0]; }).filter(Boolean);
    var rest = sichtbar.filter(function (v) { return H.indexOf(v.id) < 0; });
    var restAktiv = rest.some(function (v) { return aktiv(v.id); });
    var restCount = rest.reduce(function (s, v) { return s + (counts[v.id] || 0); }, 0);
    document.getElementById("app-tabs").innerHTML = haupt.map(knopf).join("") +
      '<button type="button" data-mehr aria-haspopup="dialog"' + (restAktiv ? ' aria-current="page"' : "") + ">" + svg(ICON.more) + "<span>" +
        (restAktiv ? sichtbar.filter(function (v) { return aktiv(v.id); })[0].label : "Mehr") + "</span>" + (restCount ? '<span class="count">' + restCount + "</span>" : "") + "</button>";
    document.body.classList.toggle("is-montage", state.rolle === "monteur");
  }
  function hauptFuer() { if (state.rolle === "betreiber") return ["vermittlung", "ablaeufe"]; return state.rolle === "aussen" ? ["uebersicht", "anfragen", "aufmass", "kunden", "termine"] : ["uebersicht", "anfragen", "kunden", "aufmass", "termine"]; }
  // „Mehr“ auf dem Handy: Liste in Gruppen, zugeklappt; nur Bereiche, die nicht unten in der Leiste stehen
  var sheetOffen = {};
  function sheetInhalt() {
    var counts = navCounts();
    var sichtbar = VIEWS.filter(function (v) { return erlaubt(v.id) && v.id !== "branchen" && hauptFuer().indexOf(v.id) < 0 && (!einfachAktiv() || EINFACH.indexOf(v.id) > -1); });
    var kachel = function (v) {
      return '<button type="button" data-view="' + v.id + '"' + (state.view === v.id ? ' aria-current="page"' : "") + ">" + svg(v.icon) + "<span>" + v.label + "</span>" +
        (MODULE[v.id] ? '<em class="nav-modul">Modul</em>' : "") + (counts[v.id] ? '<span class="count">' + counts[v.id] + "</span>" : "") + "</button>";
    };
    return '<span class="sheet-grip" aria-hidden="true"></span>' + (["gf", "buero", "aussen"].indexOf(state.rolle) > -1 ? '<div class="menue-modus" role="group" aria-label="Menü"><button type="button" data-menue="einfach" aria-pressed="' + einfachAktiv() + '">Einfach</button><button type="button" data-menue="alle" aria-pressed="' + !einfachAktiv() + '">Alle Bereiche</button></div>' : "") + GRUPPEN.map(function (g) {
        var items = sichtbar.filter(function (v) { return g[1].indexOf(v.id) > -1; });
        return items.length ? '<div class="g-' + GKEY[g[0]] + '"><p class="nav-group">' + g[0] + '</p><div class="sheet-grid">' + items.map(kachel).join("") + "</div></div>" : "";
      }).join("") +
      '<div class="sl-demo"><span>Demo</span><button class="btn-mini primary" type="button" data-tour>Tour</button><button class="btn-mini" type="button" data-reset>Zurücksetzen</button>' +
      '<a class="btn-mini" href="kontakt.html">Angebots-Check</a><a class="btn-mini" href="betriebe.html">Website</a></div>';
  }
  function mehrOeffnen() {
    closeDrawer();
    var back = document.createElement("div"); back.className = "drawer-backdrop sheet-back"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer sheet"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Weitere Bereiche");
    d.innerHTML = sheetInhalt();
    d.addEventListener("click", function (e) {
      var k = e.target.closest("[data-sheet-gruppe]"); if (!k) return;
      e.stopPropagation();
      var g = k.getAttribute("data-sheet-gruppe"); sheetOffen[g] = k.getAttribute("aria-expanded") !== "true";
      var y = d.scrollTop; d.innerHTML = sheetInhalt(); d.scrollTop = y;
    });
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
  }

  /* =====================================================================
     DURCHGEHENDE KETTE: Anfrage → Angebot → Auftrag → Regie → Rechnung → Zahlung
     Alles hängt an der Anfrage (lead.id). Rechenlogik zentral in rechne().
     Beträge: Positionen netto, 19 % USt., Rechnungsbetrag brutto.
     ===================================================================== */
  var UST = 0.19, STUNDENSATZ = 64;
  var eur2 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rund2 = function (x) { return Math.round((+x || 0) * 100) / 100; };
  function zahlOk(v) { return v !== "" && v !== null && isFinite(+v) && +v >= 0; }
  function rechne(pos) {
    var netto = 0, optional = 0, rabatt = 0, fehler = 0;
    (pos || []).forEach(function (p) {
      if (!zahlOk(p.menge) || !zahlOk(p.ep) || !zahlOk(p.rabatt || 0) || +(p.rabatt || 0) > 100) { fehler++; return; }
      var brutto = rund2(+p.menge * +p.ep), r = rund2(brutto * (+(p.rabatt || 0)) / 100), z = rund2(brutto - r);
      if (p.optional) optional = rund2(optional + z); else { netto = rund2(netto + z); rabatt = rund2(rabatt + r); }
    });
    var ust = rund2(netto * UST);
    return { netto: netto, rabatt: rabatt, ust: ust, brutto: rund2(netto + ust), optional: optional, fehler: fehler };
  }
  function zeilenSumme(p) { return zahlOk(p.menge) && zahlOk(p.ep) ? rund2(+p.menge * +p.ep * (1 - (+(p.rabatt || 0)) / 100)) : null; }
  var POS_VORLAGEN = [
    [/Bad|WC|Dusche/, [["Rückbau und Entsorgung", 0.12, "psch"], ["Sanitärinstallation (Vor- und Abwasser)", 0.38, "psch"], ["Fliesenarbeiten Boden und Wand", 0.32, "m²", 24], ["Sanitärobjekte und Armaturen liefern und montieren", 0.18, "psch"]]],
    [/Heiz|Wärmepumpe|Therme|Öl/, [["Demontage und Entsorgung Altanlage", 0.1, "psch"], ["Wärmeerzeuger liefern", 0.55, "Stk."], ["Montage und hydraulischer Anschluss", 0.25, "psch"], ["Inbetriebnahme und Einweisung", 0.1, "psch"]]],
    [/Strang/, [["Strangsanierung Trinkwasser", 0.55, "psch"], ["Strangsanierung Abwasser", 0.35, "psch"], ["Baustelleneinrichtung", 0.1, "psch"]]],
    [/./, [["Arbeitszeit Fachkraft", 0.65, "Std."], ["Material laut Aufmaß", 0.35, "psch"]]]
  ];
  function startPositionen(l) {
    var v = POS_VORLAGEN.filter(function (x) { return x[0].test(l.betreff); })[0][1], rest = l.wert, out = [];
    v.forEach(function (x, i) {
      var anteil = i === v.length - 1 ? rest : Math.round(l.wert * x[1]);
      rest -= anteil;
      var menge = x[2] === "Std." ? Math.max(1, Math.round(anteil / STUNDENSATZ)) : x[3] || 1;
      var ep = rund2(anteil / menge);
      out.push({ text: x[0], menge: menge, einheit: x[2], ep: ep, rabatt: 0, optional: false });
    });
    var d = rund2(l.wert - rechne(out).netto); if (d) out[out.length - 1].ep = rund2(out[out.length - 1].ep + d / out[out.length - 1].menge);
    return out;
  }
  var nrNeu = function (art) { state.nr = state.nr || { AN: 40, AU: 20, RE: 120, RB: 413 }; state.nr[art] = (state.nr[art] || 0) + 1; return art + "-2026-" + ("000" + state.nr[art]).slice(-3); };
  function verlaufK(obj, text) { (obj.verlauf = obj.verlauf || []).push({ wann: jetztZeit(), text: text, von: ichName() }); }
  function angebotVon(leadId) { return (state.angebote || []).filter(function (a) { return a.leadId === leadId && a.status !== "ersetzt"; })[0]; }
  function auftragVon(leadId) { return (state.auftraege || []).filter(function (a) { return a.leadId === leadId; })[0]; }
  function leadVon(id) { return state.leads.filter(function (l) { return l.id === id; })[0]; }
  function rechnungVon(nr) { return mod.rechnungen.filter(function (r) { return r.nr === nr; })[0]; }
  function bezahltVon(r) { return r.status === "bezahlt" && !(r.zahlungen && r.zahlungen.length) ? r.betrag : rund2((r.zahlungen || []).reduce(function (s, z) { return s + z.betrag; }, 0)); }
  function restVon(r) { return r.status === "bezahlt" ? 0 : rund2(r.betrag - bezahltVon(r)); }

  // Angebote/Aufträge zu allen Anfragen herstellen (idempotent; auch für ältere Wege wie „Auftrag erhalten“)
  function ketteSync() {
    state.angebote = state.angebote || []; state.auftraege = state.auftraege || [];
    state.leads.forEach(function (l) {
      var a = angebotVon(l.id);
      if (!a && (l.stage === "angebot" || l.stage === "auftrag" || l.stage === "erledigt")) {
        a = { id: "a" + l.id, nr: nrNeu("AN"), leadId: l.id, kunde: l.name, titel: l.betreff, positionen: startPositionen(l), status: "gesendet", version: 1, gueltig: 30, notiz: "", verlauf: [{ wann: "früher", text: "Angebot erstellt und gesendet", von: "Sabine (Büro)" }] };
        state.angebote.push(a);
      }
      if (a && (l.stage === "auftrag" || l.stage === "erledigt") && a.status !== "angenommen") { a.status = "angenommen"; verlaufK(a, "Angebot angenommen"); }
      if ((l.stage === "auftrag" || l.stage === "erledigt") && !auftragVon(l.id)) auftragAnlegen(l, a, true);
      var au = auftragVon(l.id); if (au && l.stage === "erledigt" && au.status !== "abgeschlossen") au.status = "abgeschlossen";
    });
  }
  function auftragAnlegen(l, a, still) {
    var vorhanden = auftragVon(l.id); if (vorhanden) return vorhanden;   // keine Duplikate
    var au = { id: "au" + l.id, nr: nrNeu("AU"), leadId: l.id, angebotId: a ? a.id : null, kunde: l.name, titel: l.betreff, status: l.stage === "erledigt" ? "abgeschlossen" : "geplant",
      verantwortlich: "Alex", aufgaben: [], rechnungen: [], verlauf: [{ wann: still ? "früher" : jetztZeit(), text: "Auftrag aus Angebot " + (a ? a.nr : "") + " angelegt", von: still ? "System" : ichName() }] };
    var r = mod.rechnungen.filter(function (x) { return x.name === l.name; })[0]; if (r) au.rechnungen.push(r.nr);
    state.auftraege.push(au); return au;
  }

  /* ---------- Angebote ---------- */
  var A_ST = { entwurf: ["Entwurf", ""], gesendet: ["gesendet", "check"], angenommen: ["angenommen", "ok"], abgelehnt: ["abgelehnt", "no"] };
  function viewAngebote() {
    ketteSync();
    if (state.angebotSel) return angebotEditor();
    var f = state.angebotFilter || "alle";
    var liste = state.angebote.filter(function (a) { return a.status !== "ersetzt" && (f === "alle" || a.status === f); });
    var summe = function (st) { return state.angebote.filter(function (a) { return a.status === st; }).reduce(function (s, a) { return s + rechne(a.positionen).brutto; }, 0); };
    $main.innerHTML = head("Angebote", "Angebote mit Positionen erstellen, senden und nachverfolgen – angenommene Angebote werden automatisch zum Auftrag.") +
      '<div class="kpis">' + kpi("Offen (gesendet)", euro.format(summe("gesendet")), state.angebote.filter(function (a) { return a.status === "gesendet"; }).length + " Angebote") +
        kpi("Angenommen", euro.format(summe("angenommen")), state.angebote.filter(function (a) { return a.status === "angenommen"; }).length + " Angebote") +
        kpi("Entwürfe", String(state.angebote.filter(function (a) { return a.status === "entwurf"; }).length), "noch nicht gesendet") +
        kpi("Abgelehnt", String(state.angebote.filter(function (a) { return a.status === "abgelehnt"; }).length), "mit Grund") + "</div>" +
      '<div class="toolbar" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;margin-bottom:12px"><div class="filter">' +
        [["alle", "Alle"], ["entwurf", "Entwürfe"], ["gesendet", "Gesendet"], ["angenommen", "Angenommen"], ["abgelehnt", "Abgelehnt"]].map(function (x) { return '<button type="button" data-an-filter="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + "</button>"; }).join("") +
        '</div><button class="btn btn-signal" type="button" data-an-neu' + (darf("angebot") ? "" : " disabled title=\"In dieser Rolle nicht erlaubt\"") + ">+ Neues Angebot</button></div>" +
      (liste.length ? '<div class="rows" id="an-liste">' + liste.map(function (a) {
        var s = rechne(a.positionen), l = leadVon(a.leadId);
        return '<div class="row"><div class="row-main"><strong>' + esc(a.nr) + " · " + esc(a.kunde) + "</strong><small>" + esc(a.titel) + " · Version " + a.version + (l && a.status === "gesendet" ? " · seit " + (l.angebotVor || 0) + " Tagen beim Kunden" : "") + "</small></div>" +
          '<div class="row-side"><span class="pill ' + A_ST[a.status][1] + '">' + A_ST[a.status][0] + '</span><span class="amount">' + euro.format(s.brutto) + '</span><button class="btn-mini primary" type="button" data-an-open="' + a.id + '">Öffnen</button></div></div>';
      }).join("") + "</div>" : '<p class="col-empty">Keine Angebote in diesem Filter.</p>');
  }
  function angebotEditor() {
    var a = state.angebote.filter(function (x) { return x.id === state.angebotSel; })[0]; if (!a) { state.angebotSel = null; return viewAngebote(); }
    var l = leadVon(a.leadId) || {}, s = rechne(a.positionen), edit = a.status === "entwurf" && darf("angebot"), au = auftragVon(a.leadId);
    var pz = function (p, i) {
      var z = zeilenSumme(p), bad = function (v, max) { return zahlOk(v) && (max == null || +v <= max) ? "" : ' aria-invalid="true"'; };
      return edit ? '<tr' + (p.optional ? ' class="opt"' : "") + (p.aufmass ? " data-nt" : "") + '><td>' + (i + 1) + '</td><td><input data-pos="' + i + '" data-f="text" value="' + esc(p.text) + '" aria-label="Leistung"></td>' +
          '<td><input data-pos="' + i + '" data-f="menge" inputmode="decimal" value="' + esc(p.menge) + '"' + bad(p.menge) + ' aria-label="Menge"></td><td><input data-pos="' + i + '" data-f="einheit" value="' + esc(p.einheit) + '" aria-label="Einheit" class="kurz"></td>' +
          '<td><input data-pos="' + i + '" data-f="ep" inputmode="decimal" value="' + esc(p.ep) + '"' + bad(p.ep) + ' aria-label="Einzelpreis netto"></td><td><input data-pos="' + i + '" data-f="rabatt" inputmode="decimal" value="' + esc(p.rabatt || 0) + '"' + bad(p.rabatt || 0, 100) + ' aria-label="Rabatt in Prozent" class="kurz"></td>' +
          '<td><label class="opt-l"><input type="checkbox" data-pos="' + i + '" data-f="optional"' + (p.optional ? " checked" : "") + "> optional</label></td><td class=\"num\">" + (z == null ? '<span class="fehler">prüfen</span>' : eur2.format(z)) + '</td><td><button class="icon-btn" type="button" data-pos-del="' + i + '" aria-label="Position entfernen">✕</button></td></tr>' :
        '<tr' + (p.optional ? ' class="opt"' : "") + (p.aufmass ? " data-nt" : "") + "><td>" + (i + 1) + "</td><td>" + esc(p.text) + (p.optional ? " <em>(optional)</em>" : "") + '</td><td class="num">' + String(p.menge).replace(".", ",") + "</td><td>" + esc(p.einheit) + '</td><td class="num">' + eur2.format(+p.ep) + '</td><td class="num">' + (+p.rabatt ? p.rabatt + " %" : "–") + '</td><td></td><td class="num">' + (z == null ? "–" : eur2.format(z)) + "</td><td></td></tr>";
    };
    var knoepfe = a.status === "entwurf" ? '<button class="btn btn-signal" type="button" data-an-senden' + (s.fehler || !a.positionen.length ? " disabled" : "") + ">Angebot senden …</button>" + (a.varianten ? "" : '<button class="btn btn-outline" type="button" data-an-varianten>3 Varianten anbieten</button>') :
      a.status === "gesendet" ? '<button class="btn btn-signal" type="button" data-an-annehmen>Kunde nimmt an (Demo)</button><button class="btn btn-outline" type="button" data-an-ablehnen>Kunde lehnt ab</button><button class="btn btn-outline" type="button" data-an-version>Neue Version bearbeiten</button>' :
      a.status === "angenommen" ? (au ? '<button class="btn btn-signal" type="button" data-au-open="' + au.id + '">Zum Auftrag ' + esc(au.nr) + "</button>" : "") : '<button class="btn btn-outline" type="button" data-an-version>Überarbeiten und neu senden</button>';
    $main.innerHTML = head("Angebot " + esc(a.nr), "Für " + esc(a.kunde) + " · " + esc(a.titel)) +
      '<p style="margin:-6px 0 14px"><button class="btn-mini" type="button" data-an-zurueck>← Alle Angebote</button> <button class="btn-mini" type="button" data-ar="' + arProduktFuer(a.titel) + '">Im Raum zeigen (AR)</button> <span class="pill ' + A_ST[a.status][1] + '">' + A_ST[a.status][0] + "</span> <span class=\"pill\">Version " + a.version + "</span>" + (l.id ? ' <button class="btn-mini" type="button" data-akte-open="' + esc(a.kunde) + '">Kundenakte</button>' : "") + "</p>" +
      '<div class="an-layout"><section class="panel"><div class="facts" style="margin-bottom:12px">' + fact("Kunde", a.kunde) + fact("Ort", l.ort || "–") + fact("Angebotsnummer", a.nr) + fact("Gültig", a.gueltig + " Tage ab Versand") + "</div>" +
        '<div class="an-tab-wrap"><table class="an-tab"><thead><tr><th>#</th><th>Leistung</th><th>Menge</th><th>Einh.</th><th>EP netto</th><th>Rabatt %</th><th></th><th class="num">Gesamt</th><th></th></tr></thead><tbody>' +
        (a.positionen.length ? a.positionen.map(pz).join("") : '<tr><td colspan="9" class="col-empty">Noch keine Positionen.</td></tr>') + "</tbody></table></div>" +
        (edit ? '<p class="btn-row"><button class="btn-mini" type="button" data-pos-neu>+ Position hinzufügen</button><button class="btn-mini primary" type="button" data-an-produkt>+ Produkt aus dem Katalog</button></p>' : "") + (a.varianten ? variantenEditor(a, edit) : "") +
        (s.fehler ? '<p class="fehler-box">' + s.fehler + " Position(en) mit ungültigen Werten – Menge und Preis müssen Zahlen ab 0 sein, Rabatt höchstens 100 %. Sie werden nicht mitgerechnet.</p>" : "") +
        '<label class="an-notiz">Notiz für den Kunden' + (edit ? '<textarea data-an-notiz rows="2">' + esc(a.notiz || "") + "</textarea>" : "<span>" + esc(a.notiz || "–") + "</span>") + "</label></section>" +
      '<aside class="panel an-summe"><h2>Summe</h2><dl><dt>Netto</dt><dd>' + eur2.format(s.netto) + "</dd>" + (s.rabatt ? "<dt>darin Rabatt</dt><dd>− " + eur2.format(s.rabatt) + "</dd>" : "") + "<dt>USt. 19 %</dt><dd>" + eur2.format(s.ust) + '</dd><dt class="gross">Brutto</dt><dd class="gross">' + eur2.format(s.brutto) + "</dd>" +
        (s.optional ? "<dt>Optional (nicht enthalten)</dt><dd>" + eur2.format(s.optional) + " netto</dd>" : "") + "</dl>" +
        '<div class="an-knoepfe">' + knoepfe + '<button class="btn btn-outline" type="button" data-an-vorschau>Vorschau</button>' + (a.status === "entwurf" ? '<button class="btn btn-outline danger" type="button" data-an-loeschen>Entwurf löschen</button>' : "") + "</div>" +
        "<h3>Verlauf</h3><ul class=\"timeline\">" + (a.verlauf || []).slice().reverse().map(function (e) { return "<li>" + esc(e.text) + "<small>" + esc(e.von) + " · " + esc(e.wann) + "</small></li>"; }).join("") + "</ul></aside></div>";
  }
  function angebotNeu(l) {
    var vorhanden = angebotVon(l.id); if (vorhanden) return vorhanden;
    var a = { id: "a" + l.id, nr: nrNeu("AN"), leadId: l.id, kunde: l.name, titel: l.betreff, positionen: startPositionen(l), status: "entwurf", version: 1, gueltig: 30, notiz: "", verlauf: [] };
    verlaufK(a, "Entwurf aus Anfrage erstellt"); state.angebote.push(a); add(l, "Angebotsentwurf " + a.nr + " erstellt"); return a;
  }
  function angebotVorschau(a) {
    var s = rechne(a.positionen), l = leadVon(a.leadId) || {};
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Vorschau");
    d.innerHTML = kopfX("Vorschau " + esc(a.nr)) + '<div class="beleg"><p class="beleg-muster">MUSTER – Demo-Vorschau, kein rechtsverbindliches Dokument</p><div class="beleg-kopf"><div><b>' + BETRIEB + "</b><br>Musterstraße 1 · 91052 Erlangen</div><div>" + esc(a.kunde) + "<br>" + esc(l.ort || "") + "</div></div>" +
      "<h3>" + (a.art === "rechnung" ? "Rechnung " : "Angebot ") + esc(a.nr) + "</h3><p>" + esc(a.titel) + "</p>" +
      '<table class="an-tab"><thead><tr><th>#</th><th>Leistung</th><th class="num">Menge</th><th class="num">EP</th><th class="num">Gesamt</th></tr></thead><tbody>' +
      a.positionen.map(function (p, i) { var z = zeilenSumme(p); return "<tr" + (p.optional ? ' class="opt"' : "") + (p.aufmass ? " data-nt" : "") + "><td>" + (i + 1) + "</td><td>" + esc(p.text) + (p.optional ? " (optional)" : "") + (+p.rabatt ? " · " + p.rabatt + " % Rabatt" : "") + '</td><td class="num">' + String(p.menge).replace(".", ",") + " " + esc(p.einheit) + '</td><td class="num">' + (zahlOk(p.ep) ? eur2.format(+p.ep) : "–") + '</td><td class="num">' + (z == null ? "–" : eur2.format(z)) + "</td></tr>"; }).join("") +
      '</tbody></table><dl class="beleg-summe"><dt>Netto</dt><dd>' + eur2.format(s.netto) + "</dd><dt>USt. 19 %</dt><dd>" + eur2.format(s.ust) + "</dd><dt><b>Gesamt</b></dt><dd><b>" + eur2.format(s.brutto) + "</b></dd></dl>" +
      (a.notiz ? "<p>" + esc(a.notiz) + "</p>" : "") + "<p class=\"src\">" + (a.art === "rechnung" ? "Zahlbar innerhalb von 14 Tagen. Eine gesetzeskonforme E-Rechnung (XRechnung/ZUGFeRD) erstellt im echten Betrieb das Rechnungsprogramm." : "Gültig " + a.gueltig + " Tage. Preise in Euro.") + "</p></div>";
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    d.querySelector("[data-close]").addEventListener("click", closeDrawer);
  }

  /* ---------- Aufträge ---------- */
  var AU_ST = { geplant: ["geplant", ""], arbeit: ["in Arbeit", "check"], abgeschlossen: ["abgeschlossen", "ok"] };
  function viewAuftraege() {
    ketteSync();
    if (state.auftragSel) return auftragDetail();
    var f = state.auftragFilter || "alle";
    var liste = state.auftraege.filter(function (a) { return f === "alle" || a.status === f; });
    $main.innerHTML = head("Aufträge", "Jeder angenommene Auftrag mit Terminen, Regieberichten, Rechnungen und Zahlungen an einem Ort.") +
      '<div class="kpis">' + ["geplant", "arbeit", "abgeschlossen"].map(function (st) { var x = state.auftraege.filter(function (a) { return a.status === st; }); return kpi(AU_ST[st][0], String(x.length), euro.format(x.reduce(function (s, a) { return s + auftragWert(a); }, 0)) + " netto"); }).join("") +
        kpi("Noch abzurechnen", euro.format(state.auftraege.filter(function (a) { return !a.rechnungen.length; }).reduce(function (s, a) { return s + auftragWert(a); }, 0)), "ohne Rechnung") + "</div>" +
      '<div class="filter" style="margin-bottom:12px">' + [["alle", "Alle"], ["geplant", "Geplant"], ["arbeit", "In Arbeit"], ["abgeschlossen", "Abgeschlossen"]].map(function (x) { return '<button type="button" data-au-filter="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      (liste.length ? '<div class="rows" id="au-liste">' + liste.map(function (a) {
        var t = termineVon(a)[0];
        return '<div class="row"><div class="row-main"><strong>' + esc(a.nr) + " · " + esc(a.kunde) + "</strong><small>" + esc(a.titel) + " · verantwortlich: " + esc(a.verantwortlich) + (t ? " · nächster Termin: " + esc(t.tag) + " " + esc(t.zeit) : "") + "</small></div>" +
          '<div class="row-side"><span class="pill ' + AU_ST[a.status][1] + '">' + AU_ST[a.status][0] + '</span><span class="amount">' + euro.format(auftragWert(a)) + '</span><button class="btn-mini primary" type="button" data-au-open="' + a.id + '">Öffnen</button></div></div>';
      }).join("") + "</div>" : '<p class="col-empty">Keine Aufträge in diesem Filter.</p>');
  }
  function auftragWert(au) { var a = (state.angebote || []).filter(function (x) { return x.id === au.angebotId; })[0]; return a ? rechne(a.positionen).netto : ((leadVon(au.leadId) || {}).wert || 0); }
  function termineVon(au) { return mod.termine.filter(function (t) { return t.auftragId === au.id || (!t.auftragId && t.name === au.kunde); }); }
  function regieVon(au) { return mt.berichte.filter(function (b) { return b.auftragId === au.id || (!b.auftragId && istKunde(au.kunde, b.baustelle)); }); }
  function auftragDetail() {
    var au = state.auftraege.filter(function (x) { return x.id === state.auftragSel; })[0]; if (!au) { state.auftragSel = null; return viewAuftraege(); }
    var an = state.angebote.filter(function (x) { return x.id === au.angebotId; })[0], tm = termineVon(au), rb = regieVon(au);
    var re = au.rechnungen.map(rechnungVon).filter(Boolean), entwurf = au.entwurf;
    var buero = darf("rechnung");
    $main.innerHTML = head("Auftrag " + esc(au.nr), esc(au.kunde) + " · " + esc(au.titel)) +
      '<p style="margin:-6px 0 14px"><button class="btn-mini" type="button" data-au-zurueck>← Alle Aufträge</button> <button class="btn-mini" type="button" data-akte-open="' + esc(au.kunde) + '">Kundenakte</button>' + (an ? ' <button class="btn-mini" type="button" data-an-open="' + an.id + '">Angebot ' + esc(an.nr) + "</button>" : "") + "</p>" +
      '<div class="au-status">' + ["geplant", "arbeit", "abgeschlossen"].map(function (st, i) { var idx = ["geplant", "arbeit", "abgeschlossen"].indexOf(au.status); return '<button type="button" data-au-status="' + st + '" class="' + (i < idx ? "done" : i === idx ? "now" : "") + '"' + (darf("auftrag") ? "" : " disabled") + ">" + (i + 1) + ". " + AU_ST[st][0] + "</button>"; }).join("") + "</div>" +
      '<div class="kpis">' + kpi("Auftragswert", euro.format(auftragWert(au)), "netto laut Angebot") + kpi("Regiestunden", String(rb.reduce(function (s, b) { return s + (+b.stunden || 0); }, 0)).replace(".", ","), rb.length + " Berichte") +
        kpi("Abgerechnet", euro.format(re.reduce(function (s, r) { return s + r.betrag; }, 0)), re.length + " Rechnungen") + kpi("Bezahlt", euro.format(re.reduce(function (s, r) { return s + bezahltVon(r); }, 0)), "Rest " + euro.format(re.reduce(function (s, r) { return s + restVon(r); }, 0))) + "</div>" +
      (konfKarten(au.kunde) ? '<section class="panel kf-block" style="margin-bottom:16px"><h2>Produkt für diesen Auftrag</h2>' + konfKarten(au.kunde) + "</section>" : "") +
      '<div class="panel-grid two"><div class="panel-grid">' +
        '<section class="panel"><h2>Termine</h2>' + (tm.length ? '<ul class="feed">' + tm.map(function (t) { return '<li><span class="ic">' + svg(ICON.calendar) + "</span><span>" + esc(t.tag) + " " + esc(t.zeit) + " · " + esc(t.art) + "<small>" + esc(t.wer) + (t.info ? " · " + esc(t.info) : "") + "</small></span></li>"; }).join("") + "</ul>" : '<p class="col-empty">Noch kein Termin.</p>') +
          '<form class="mini-form" data-au-termin onsubmit="return false"><input type="date" name="datum" required aria-label="Datum"><input type="time" name="zeit" value="08:00" required aria-label="Uhrzeit"><select name="art" aria-label="Art">' + ["Ausführung", "Besichtigung", "Aufmaß", "Abnahme"].map(function (x) { return "<option>" + x + "</option>"; }).join("") +
          '</select><select name="wer" aria-label="Wer">' + TEAM.map(function (x) { return "<option" + (x === au.verantwortlich ? " selected" : "") + ">" + x + "</option>"; }).join("") + '</select><button class="btn-mini primary" type="submit">Termin eintragen</button></form></section>' +
        '<section class="panel"><h2>Regieberichte</h2>' + (rb.length ? '<div class="rows">' + rb.map(function (b) { return '<div class="row"><div class="row-main"><strong>' + esc(b.nr) + " · " + esc(b.datum) + "</strong><small>" + String(b.stunden).replace(".", ",") + " Std. · " + esc(b.monteur || "") + " · " + esc(b.material || "") + (b.materialEuro ? " (" + eur2.format(b.materialEuro) + ")" : "") + (b.zusatz ? " · Zusatzleistung" : "") + '</small></div><div class="row-side"><span class="pill ' + (b.status === "unterschrieben" || b.status === "abgerechnet" ? "ok" : "check") + '">' + esc(b.status) + "</span>" + (b.status === "wartet auf Unterschrift" ? '<button class="btn-mini primary" type="button" data-rb-sign="' + esc(b.nr) + '">Kunde unterschreibt (Demo)</button>' : "") + "</div></div>"; }).join("") + "</div>" : '<p class="col-empty">Noch kein Regiebericht.</p>') +
          '<form class="mini-form" data-au-regie onsubmit="return false"><input name="stunden" inputmode="decimal" placeholder="Stunden" required aria-label="Stunden"><input name="taetigkeit" placeholder="Tätigkeit" required aria-label="Tätigkeit"><button class="btn-mini sprech-btn" type="button" data-sprechen>' + svg(ICON.sound) + 'Sprechen statt tippen</button><input name="material" placeholder="Material (optional)" aria-label="Material"><input name="materialEuro" inputmode="decimal" placeholder="Material € netto" aria-label="Material in Euro netto"><label class="opt-l"><input type="checkbox" name="zusatz"> Zusatzleistung</label><button class="btn-mini primary" type="submit">Regiebericht anlegen</button></form>' +
          '<p class="src">Im echten Betrieb erfasst die Montagekraft das in der App; hier zum Ausprobieren direkt.</p></section></div>' +
      '<div class="panel-grid"><section class="panel"><h2>Rechnung</h2>' +
        (re.length ? '<div class="rows">' + re.map(function (r) { return '<div class="row"><div class="row-main"><strong>' + esc(r.nr) + "</strong><small>" + (r.status === "bezahlt" ? "bezahlt" : r.status === "teilbezahlt" ? "teilweise bezahlt · Rest " + eur2.format(restVon(r)) : r.faellig > 0 ? r.faellig + " Tage überfällig" : "offen") + '</small></div><div class="row-side"><span class="amount">' + euro.format(r.betrag) + '</span><button class="btn-mini" type="button" data-re-open="' + esc(r.nr) + '">Öffnen</button></div></div>'; }).join("") + "</div>" : "") +
        (entwurf ? '<p><span class="pill">Entwurf</span> ' + eur2.format(rechne(entwurf.positionen).brutto) + ' brutto <button class="btn-mini primary" type="button" data-re-entwurf>Entwurf öffnen</button></p>' :
          (buero ? '<button class="btn btn-signal" type="button" data-re-vorbereiten>' + (re.length ? "Weitere Rechnung vorbereiten" : "Rechnung aus Auftrag vorbereiten") + "</button>" : '<p class="src">Rechnungen bereitet das Büro vor.</p>')) +
        "</section>" +
        '<section class="panel"><h2>Verantwortlich</h2><select data-au-wer aria-label="Verantwortlich"' + (darf("auftrag") ? "" : " disabled") + ">" + TEAM.map(function (x) { return "<option" + (x === au.verantwortlich ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select>" +
        '<h2 style="margin-top:16px">Aufgaben</h2>' + ((au.aufgaben || []).length ? '<ul class="au-aufg">' + au.aufgaben.map(function (a, i) {
            var ueber = !a.erledigt && a.bis && a.bis < heuteISO();
            return '<li class="' + (a.erledigt ? "erledigt" : ueber ? "ueber" : "") + '"><label><input type="checkbox" data-au-aufg="' + i + '"' + (a.erledigt ? " checked" : "") + "> " + esc(a.titel) + "</label><small>" + (a.bis ? (ueber ? "überfällig seit " : "bis ") + datumDE(a.bis) + " · " : "") + esc(a.wer) + "</small></li>";
          }).join("") + "</ul>" : '<p class="src">Noch keine Aufgaben.</p>') +
          '<form class="mini-form" data-au-aufgabe onsubmit="return false"><input name="titel" placeholder="Neue Aufgabe, z. B. Material bestellen" required aria-label="Aufgabe"><input type="date" name="bis" aria-label="Fällig bis"><select name="wer" aria-label="Wer">' + TEAM.concat(["Büro"]).map(function (x) { return "<option>" + x + "</option>"; }).join("") + '</select><button class="btn-mini primary" type="submit">Hinzufügen</button></form>' +
        "<h2 style=\"margin-top:16px\">Verlauf</h2><ul class=\"timeline\">" + au.verlauf.slice().reverse().map(function (e) { return "<li>" + esc(e.text) + "<small>" + esc(e.von) + " · " + esc(e.wann) + "</small></li>"; }).join("") + "</ul></section></div></div>";
  }
  function rechnungVorbereiten(au) {
    if (au.entwurf) return au.entwurf;   // keine doppelten Entwürfe
    var an = state.angebote.filter(function (x) { return x.id === au.angebotId; })[0];
    var pos = au.rechnungen.length ? [] : (an ? an.positionen.filter(function (p) { return !p.optional; }).map(function (p) { return Object.assign({}, p); }) : []);
    regieVon(au).filter(function (b) { return b.zusatz && !b.abgerechnet; }).forEach(function (b) {
      pos.push({ text: "Zusatzleistung " + b.nr + ": " + b.taetigkeit, menge: +b.stunden, einheit: "Std.", ep: STUNDENSATZ, rabatt: 0, rb: b.nr });
      if (b.materialEuro) pos.push({ text: "Material " + b.nr + ": " + (b.material || ""), menge: 1, einheit: "psch", ep: +b.materialEuro, rabatt: 0, rb: b.nr });
    });
    au.entwurf = { art: "rechnung", nr: "Entwurf", kunde: au.kunde, titel: au.titel, positionen: pos, gueltig: 14 };
    verlaufK(au, "Rechnungsentwurf vorbereitet"); return au.entwurf;
  }
  function entwurfAnsicht(au) {
    var e = au.entwurf, s = rechne(e.positionen);
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer re-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Rechnungsentwurf");
    var zeichne = function () {
      s = rechne(e.positionen);
      d.innerHTML = kopfX("Rechnungsentwurf · " + esc(au.kunde)) + '<p class="src">Positionen aus dem Angebot und aus Regieberichten mit Zusatzleistung. Ändern Sie Mengen und Preise direkt.</p>' +
        '<div class="an-tab-wrap"><table class="an-tab"><thead><tr><th>Leistung</th><th>Menge</th><th>EP netto</th><th class="num">Gesamt</th><th></th></tr></thead><tbody>' +
        e.positionen.map(function (p, i) { var z = zeilenSumme(p); return '<tr><td><input data-rpos="' + i + '" data-f="text" value="' + esc(p.text) + '" aria-label="Leistung"></td><td><input data-rpos="' + i + '" data-f="menge" inputmode="decimal" value="' + esc(p.menge) + '"' + (zahlOk(p.menge) ? "" : ' aria-invalid="true"') + ' aria-label="Menge" class="kurz"></td><td><input data-rpos="' + i + '" data-f="ep" inputmode="decimal" value="' + esc(p.ep) + '"' + (zahlOk(p.ep) ? "" : ' aria-invalid="true"') + ' aria-label="Einzelpreis"></td><td class="num">' + (z == null ? '<span class="fehler">prüfen</span>' : eur2.format(z)) + '</td><td><button class="icon-btn" type="button" data-rpos-del="' + i + '" aria-label="Entfernen">✕</button></td></tr>'; }).join("") +
        '</tbody></table></div><p><button class="btn-mini" type="button" data-rpos-neu>+ Position</button></p>' +
        '<dl class="beleg-summe"><dt>Netto</dt><dd>' + eur2.format(s.netto) + "</dd><dt>USt. 19 %</dt><dd>" + eur2.format(s.ust) + "</dd><dt><b>Brutto</b></dt><dd><b>" + eur2.format(s.brutto) + "</b></dd></dl>" +
        (s.fehler ? '<p class="fehler-box">Bitte ungültige Werte korrigieren.</p>' : "") +
        '<div class="drawer-actions"><button class="btn btn-signal" type="button" data-re-stellen' + (s.fehler || !e.positionen.length || !s.brutto ? " disabled" : "") + ">Rechnung stellen (" + eur2.format(s.brutto) + ")</button>" +
        '<button class="btn btn-outline" type="button" data-re-entwurf-vorschau>Vorschau (Muster)</button><button class="btn btn-outline danger" type="button" data-re-entwurf-weg>Entwurf verwerfen</button></div>';
    };
    zeichne();
    d.addEventListener("input", function (ev) {
      var t = ev.target; if (!t.hasAttribute("data-rpos")) return;
      var p = e.positionen[+t.getAttribute("data-rpos")], f = t.getAttribute("data-f"); p[f] = f === "text" ? t.value : t.value.replace(",", ".");
      var pos = t.selectionStart; zeichne(); var n = d.querySelector('[data-rpos="' + t.getAttribute("data-rpos") + '"][data-f="' + f + '"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} }
    });
    d.addEventListener("click", function (ev) {
      var t = ev.target, el;
      if (t.closest("[data-close]")) return closeDrawer();
      if ((el = t.closest("[data-rpos-del]"))) { e.positionen.splice(+el.getAttribute("data-rpos-del"), 1); return zeichne(); }
      if (t.closest("[data-rpos-neu]")) { e.positionen.push({ text: "Weitere Leistung", menge: 1, einheit: "psch", ep: 0, rabatt: 0 }); return zeichne(); }
      if (t.closest("[data-re-entwurf-vorschau]")) { closeDrawer(); return angebotVorschau(e); }
      if (t.closest("[data-re-entwurf-weg]")) { if (!confirm("Rechnungsentwurf verwerfen?")) return; au.entwurf = null; verlaufK(au, "Rechnungsentwurf verworfen"); closeDrawer(); return render(); }
      if ((el = t.closest("[data-re-stellen]"))) {
        if (el.disabled || el.getAttribute("data-geklickt")) return; el.setAttribute("data-geklickt", "1");   // Doppelklick-Schutz
        var s2 = rechne(e.positionen), nr = nrNeu("RE");
        var r = { nr: nr, name: au.kunde, betrag: s2.brutto, netto: s2.netto, ust: s2.ust, faellig: -14, status: "offen", positionen: e.positionen.map(function (p) { return Object.assign({}, p); }), zahlungen: [], auftragId: au.id, info: "heute gestellt · zahlbar in 14 Tagen" };
        mod.rechnungen.unshift(r); au.rechnungen.push(nr);
        e.positionen.forEach(function (p) { if (p.rb) mt.berichte.forEach(function (b) { if (b.nr === p.rb) { b.abgerechnet = true; b.status = "abgerechnet"; } }); });
        au.entwurf = null; verlaufK(au, "Rechnung " + nr + " über " + eur2.format(s2.brutto) + " gestellt");
        var l = leadVon(au.leadId); if (l) add(l, "Rechnung " + nr + " gestellt");
        protokoll("Rechnung " + nr + " für " + au.kunde + " gestellt (Demo, nichts verschickt)");
        closeDrawer(); toast("Rechnung " + nr + " gestellt – in der Demo wird nichts verschickt."); return render();
      }
    });
    d.addEventListener("change", function (ev) { var t = ev.target; if (t.hasAttribute("data-rpos")) { var p = e.positionen[+t.getAttribute("data-rpos")]; p[t.getAttribute("data-f")] = t.value.replace(",", "."); } });
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
  }

  /* ---------- Rechnung im Detail: Zahlungen ---------- */
  function rechnungDetail(r) {
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Rechnung " + r.nr);
    var zeichne = function (fehler) {
      var rest = restVon(r), au = (state.auftraege || []).filter(function (a) { return a.id === r.auftragId || a.rechnungen.indexOf(r.nr) > -1; })[0];
      d.innerHTML = kopfX("Rechnung " + esc(r.nr)) +
        '<div class="facts">' + fact("Kunde", r.name) + fact("Betrag brutto", eur2.format(r.betrag)) + fact("Bezahlt", eur2.format(bezahltVon(r))) + fact("Restbetrag", eur2.format(rest)) +
        fact("Status", r.status === "bezahlt" ? "bezahlt" : r.status === "teilbezahlt" ? "teilweise bezahlt" : r.faellig > 0 ? "überfällig (" + r.faellig + " Tage)" : "offen") + fact("Auftrag", au ? au.nr : "–") + "</div>" +
        (r.positionen ? '<p style="margin:10px 0 0"><button class="btn-mini" type="button" data-re-vorschau>Vorschau (Muster)</button></p>' : "") +
        '<p class="sec-title" style="margin-top:14px">Zahlungseingänge</p>' + ((r.zahlungen || []).length ? '<ul class="timeline">' + r.zahlungen.map(function (z) { return "<li>" + eur2.format(z.betrag) + "<small>" + esc(z.datum) + " · " + esc(z.von) + "</small></li>"; }).join("") + "</ul>" : '<p class="col-empty">' + (r.status === "bezahlt" ? "Vollständig bezahlt (automatisch zugeordnet)." : "Noch keine Zahlung.") + "</p>") +
        (rest > 0 ? '<form class="mini-form" data-zahlung onsubmit="return false"><input type="date" name="datum" required aria-label="Datum" value="' + new Date().toISOString().slice(0, 10) + '"><input name="betrag" inputmode="decimal" required placeholder="Betrag €" aria-label="Betrag in Euro" value="' + String(rest).replace(".", ",") + '"><button class="btn-mini primary" type="submit">Zahlung erfassen</button></form>' : "") +
        (fehler ? '<p class="fehler-box">' + fehler + "</p>" : "") + '<p class="src">Im echten Betrieb kommen Zahlungen über die Bankanbindung des Rechnungsprogramms; hier wird nur in der Demo gebucht.</p>';
    };
    zeichne();
    d.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t.closest("[data-close]")) return closeDrawer();
      if (t.closest("[data-re-vorschau]")) { closeDrawer(); return angebotVorschau({ art: "rechnung", nr: r.nr, kunde: r.name, titel: "Rechnung", positionen: r.positionen, gueltig: 14 }); }
    });
    d.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target, b = rund2(String(f.betrag.value).replace(/\./g, "").replace(",", ".")), rest = restVon(r);
      if (!f.datum.value) return zeichne("Bitte ein Datum angeben.");
      if (!(b > 0)) return zeichne("Bitte einen Betrag größer als 0 eingeben.");
      if (b > rest + 0.001) return zeichne("Der Betrag ist höher als der Restbetrag (" + eur2.format(rest) + ").");
      r.zahlungen = r.zahlungen || [];
      if (r.status === "bezahlt") return;
      r.zahlungen.push({ datum: f.datum.value.split("-").reverse().join("."), betrag: b, von: ichName() });
      r.status = restVon(r) <= 0.001 ? "bezahlt" : "teilbezahlt"; r.info = r.status === "bezahlt" ? "vollständig bezahlt" : "teilweise bezahlt · Rest " + eur2.format(restVon(r));
      var au = (state.auftraege || []).filter(function (a) { return a.rechnungen.indexOf(r.nr) > -1; })[0]; if (au) verlaufK(au, "Zahlung " + eur2.format(b) + " auf " + r.nr + " erfasst");
      var l = state.leads.filter(function (x) { return x.name === r.name; })[0]; if (l) add(l, "Zahlung " + eur2.format(b) + " auf " + r.nr + " eingegangen");
      protokoll("Zahlung " + eur2.format(b) + " von " + r.name + " erfasst"); toast("Zahlung erfasst. " + (r.status === "bezahlt" ? "Rechnung ist bezahlt." : "Rest: " + eur2.format(restVon(r))));
      zeichne(); renderNav(); if (state.view === "rechnungen" || state.view === "auftraege") render();
    });
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
  }

  /* ---------- Rechte je Rolle (Simulation) ---------- */
  /* =====================================================================
     ETAPPE 3: Dashboard aus echten Daten, Erinnerungen, Ausschreibungen,
     Auswertungen, Marketing, Einstellungen (alles Demo, klar gekennzeichnet)
     ===================================================================== */
  var heuteISO = function (plus) { var d = new Date(); d.setDate(d.getDate() + (plus || 0)); return d.toISOString().slice(0, 10); };
  var datumDE = function (iso) { if (!iso) return ""; var p = iso.split("-"); return p[2] + "." + p[1] + "." + p[0]; };
  function gewerkVon(l) {
    if (l.gewerk) return l.gewerk;
    var b = (l.betreff || "") + " " + (l.nachricht || "");
    return /Bad|WC|Dusche|Fliese|Armatur|Spül|Wasser/i.test(b) ? "Sanitär / Bad" : /Heiz|Therm|Wärme|Kessel|Brenn/i.test(b) ? "SHK / Heizung" : /Elektr|Steckdose|Strom/i.test(b) ? "Elektro" : /Mal|Anstrich|Fassade/i.test(b) ? "Maler" : /Dach|Rinne/i.test(b) ? "Dach" : "Sonstiges";
  }
  function verantwortlichVon(l) { return l.verantwortlich || (l.kanal === "portal" || l.dringend ? "Thomas (GF)" : l.wert >= 10000 ? "Stefan (Außendienst)" : "Sabine (Büro)"); }
  function erinnerungFaellig(l) { return l.erinnerung && !l.erinnerung.erledigt && l.erinnerung.datum <= heuteISO(); }

  /* ---------- Dashboard: Filter und Kennzahlen ---------- */
  function dashLeads() {
    var d = state.dash || (state.dash = { zeit: "alle", wer: "alle" });
    return state.leads.filter(function (l) {
      return (d.zeit === "alle" || (l.tage || 0) <= +d.zeit) && (d.wer === "alle" || verantwortlichVon(l) === d.wer);
    });
  }
  function kpiLink(label, wert, sub, ziel, extra) { return '<button type="button" class="kpi kpi-link" data-go="' + ziel + '"' + (extra || "") + "><span>" + label + "</span><strong>" + wert + "</strong><small>" + sub + "</small></button>"; }
  function dashboardBlock() {
    var d = state.dash || (state.dash = { zeit: "alle", wer: "alle" }), L = dashLeads();
    var neu = L.filter(function (l) { return l.stage === "neu"; }), ang = L.filter(function (l) { return l.stage === "angebot"; });
    var ids = L.map(function (l) { return l.id; });
    var A = (state.angebote || []).filter(function (a) { return ids.indexOf(a.leadId) > -1 && a.status !== "ersetzt"; });
    var aOffen = A.filter(function (a) { return a.status === "gesendet" || a.status === "entwurf"; }), aAn = A.filter(function (a) { return a.status === "angenommen"; }), aAb = A.filter(function (a) { return a.status === "abgelehnt"; });
    var AU = (state.auftraege || []).filter(function (a) { return ids.indexOf(a.leadId) > -1; });
    var auArbeit = AU.filter(function (a) { return a.status !== "abgeschlossen"; });
    var namen = L.map(function (l) { return l.name; });
    var R = mod.rechnungen.filter(function (r) { return d.zeit === "alle" && d.wer === "alle" ? true : namen.indexOf(r.name) > -1; });
    var offenR = R.filter(function (r) { return restVon(r) > 0; }), ueberR = offenR.filter(function (r) { return r.faellig > 0; });
    var sumRest = function (a) { return a.reduce(function (s, r) { return s + restVon(r); }, 0); };
    var eingang = R.reduce(function (s, r) { return s + bezahltVon(r); }, 0);
    var sumA = function (a) { return a.reduce(function (s, x) { return s + rechne(x.positionen).netto; }, 0); };
    var wer = ["alle", "Thomas (GF)", "Sabine (Büro)", "Stefan (Außendienst)"];
    return '<div class="dash-filter" role="group" aria-label="Kennzahlen filtern"><label>Zeitraum <select data-dash="zeit">' +
        [["alle", "alles"], ["7", "letzte 7 Tage"], ["30", "letzte 30 Tage"], ["90", "letzte 90 Tage"]].map(function (o) { return '<option value="' + o[0] + '"' + (d.zeit === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
        '<label>Verantwortlich <select data-dash="wer">' + wer.map(function (w) { return '<option value="' + w + '"' + (d.wer === w ? " selected" : "") + ">" + (w === "alle" ? "alle" : w) + "</option>"; }).join("") + "</select></label>" +
        '<small>Alle Zahlen werden aus den Demo-Daten berechnet · Klick führt zur Liste</small></div>' +
      '<div class="kpis" id="kpis">' +
        kpiLink("Neue Anfragen", neu.length, neu.filter(function (l) { return l.dringend; }).length + " davon dringend", "anfragen") +
        kpiLink("Angebote offen", euro.format(sumA(aOffen)), aOffen.length + " offen · " + aAn.length + " angenommen · " + aAb.length + " abgelehnt", "angebote") +
        kpiLink("Aufträge in Arbeit", auArbeit.length, euro.format(auArbeit.reduce(function (s, a) { return s + auftragWert(a); }, 0)) + " Auftragswert", "auftraege") +
        kpiLink("Offene Rechnungen", euro.format(sumRest(offenR)), offenR.length + " offen · " + ueberR.length + " überfällig (" + euro.format(sumRest(ueberR)) + ")", "rechnungen") +
        kpiLink("Zahlungseingänge", euro.format(eingang), "bisher erfasst", "rechnungen") +
        kpiLink("Heute nachfassen", faelligNachfassen().filter(function (l) { return ids.indexOf(l.id) > -1; }).length + L.filter(erinnerungFaellig).length, ang.length + " offene Angebote · " + L.filter(erinnerungFaellig).length + " Erinnerungen fällig", "nachfassen") +
      "</div>";
  }

  /* ---------- Erinnerungen planen ---------- */
  function erinnerungFormular(l) {
    var e = l.erinnerung || {};
    var d = formDrawer("Erinnerung für " + l.name,
      '<p class="cr-hinweis">Angebot „' + esc(l.betreff) + '“ · ' + euro.format(l.wert) + " · offen seit " + (l.angebotVor || 0) + " Tagen</p>" +
      '<div class="er-vorschlag"><span>Vorschlag:</span>' + [[2, "in 2 Tagen"], [7, "nächste Woche"], [14, "in 2 Wochen"]].map(function (v) { return '<button type="button" class="btn-mini" data-er-tag="' + heuteISO(v[0]) + '">' + v[1] + "</button>"; }).join("") + "</div>" +
      '<div class="cr-grid">' + feld("datum", "Nächste Kontaktaufnahme am", e.erledigt ? "" : e.datum || heuteISO(3), { typ: "date", pflicht: true }) +
        feld("art", "Wie", e.art || "Anruf", { select: ["Anruf", "E-Mail", "WhatsApp", "Termin vor Ort"] }) +
        feld("notiz", "Notiz", e.erledigt ? "" : e.notiz || (l.erinnert >= 3 ? "Alle Erinnerungen gesendet – persönlich anrufen" : "Fragen zum Angebot klären"), { area: true, breit: true }) + "</div>",
      function (f) {
        var dt = f.datum.value;
        var fehler = pruefe(f, [["datum", function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(v); }, "Bitte ein Datum wählen."], ["datum", function (v) { return v >= heuteISO(); }, "Das Datum darf nicht in der Vergangenheit liegen."]]);
        if (fehler) return fehler;
        var neuTermin = !!(l.erinnerung && !l.erinnerung.erledigt);
        l.erinnerung = { datum: dt, art: f.art.value, notiz: f.notiz.value.trim(), erledigt: false };
        add(l, (neuTermin ? "Erinnerung neu terminiert" : "Erinnerung geplant") + ": " + l.erinnerung.art + " am " + datumDE(dt) + (l.erinnerung.notiz ? " – " + l.erinnerung.notiz : ""));
        protokoll("Erinnerung für " + l.name + " am " + datumDE(dt));
        closeDrawer(); toast("Erinnerung gespeichert: " + datumDE(dt) + "."); render(); return "";
      });
    d.addEventListener("click", function (ev) { var b = ev.target.closest("[data-er-tag]"); if (b) d.querySelector('[name="datum"]').value = b.getAttribute("data-er-tag"); });
    return d;
  }
  function erinnerungZeile(l) {
    var e = l.erinnerung;
    if (e && !e.erledigt) {
      var f = e.datum <= heuteISO();
      return '<div class="er-zeile' + (f ? " faellig" : "") + '">' + svg(ICON.bell) + "<span><b>" + (f ? "Fällig: " : "Geplant: ") + e.art + " am " + datumDE(e.datum) + "</b>" + (e.notiz ? "<small>" + esc(e.notiz) + "</small>" : "") + "</span>" +
        '<button class="btn-mini primary" type="button" data-er-ok="' + l.id + '">Erledigt</button><button class="btn-mini" type="button" data-er-plan="' + l.id + '">Erneut terminieren</button></div>';
    }
    return '<div class="er-zeile leer"><button class="btn-mini" type="button" data-er-plan="' + l.id + '">' + svg(ICON.bell) + "Erinnerung planen</button>" + (e && e.erledigt ? "<small>Letzte Erinnerung erledigt am " + esc(e.erledigtAm || "") + "</small>" : "") + "</div>";
  }

  /* ---------- Ausschreibungen: Filter, Eignung, Dubletten ---------- */
  var AUS_META = {
    "Sanierung Sanitäranlagen Grundschule": { gewerk: "Sanitär", km: 6, wert: 85000, quelle: "Datenservice Öffentlicher Einkauf", ref: true, fehlt: ["Leistungsverzeichnis anfordern", "Eignungsnachweis: 3 Referenzen"] },
    "Austausch Heizungsanlage Feuerwehrhaus": { gewerk: "Heizung", km: 9, wert: 40000, quelle: "Datenservice Öffentlicher Einkauf", ref: true, fehlt: ["Ortstermin vereinbaren"] },
    "Rahmenvertrag Wartung Heizungsanlagen (2 Jahre)": { gewerk: "Heizung", km: 24, wert: 120000, quelle: "Datenservice Öffentlicher Einkauf", ref: false, fehlt: ["Nachweis 3 vergleichbare Wartungsverträge", "Präqualifikation (PQ-VOB) oder Einzelnachweise"] },
    "Neubau Kita – Gewerk Sanitär (Los 4)": { gewerk: "Sanitär", km: 22, wert: 260000, quelle: "EU-Amtsblatt TED", ref: false, fehlt: ["Bietergemeinschaft klären", "Bürgschaft prüfen", "Leistungsverzeichnis"] }
  };
  var AUS_DUBLETTE = { titel: "Sanierung Sanitäranlagen Grundschule", stelle: "Stadt Erlangen", ort: "Erlangen", frist: 12, wert: "ca. 85.000 €", eignung: "passt", grund: "Gleiche Ausschreibung, zusätzlich im EU-Amtsblatt veröffentlicht.", quelleX: "EU-Amtsblatt TED", dublette: true };
  function ausMeta(a) { var m = AUS_META[a.titel] || {}; return { gewerk: m.gewerk || "Sanitär", km: m.km || 30, wert: m.wert || parseInt(String(a.wert).replace(/\D/g, ""), 10) || 0, quelle: a.quelleX || m.quelle || "Beispielquelle", ref: !!m.ref, fehlt: m.fehlt || [] }; }
  function ausBewertung(a, m) {
    var k = [["Gewerk passt (" + m.gewerk + ")", 40, true], ["Entfernung " + m.km + " km", m.km <= 15 ? 25 : m.km <= 30 ? 15 : 5, true], ["Auftragsgröße " + euro.format(m.wert), m.wert >= 20000 && m.wert <= 150000 ? 20 : 8, true], ["Vergleichbare Referenzen", m.ref ? 15 : 0, m.ref]];
    var p = k.reduce(function (s, x) { return s + x[1]; }, 0);
    return { punkte: p, kriterien: k, prio: p >= 75 ? "hoch" : p >= 55 ? "mittel" : "niedrig" };
  }
  function viewAusschreibungen() {
    if (!mod.aus.some(function (a) { return a.dublette; })) mod.aus.push(Object.assign({}, AUS_DUBLETTE));
    var f = state.ausF || (state.ausF = { gewerk: "alle", km: "alle", frist: "alle", wert: "alle" });
    var liste = mod.aus.map(function (a) { var m = ausMeta(a); return { a: a, m: m, b: ausBewertung(a, m) }; }).filter(function (x) {
      return (f.gewerk === "alle" || x.m.gewerk === f.gewerk) && (f.km === "alle" || x.m.km <= +f.km) && (f.frist === "alle" || x.a.frist <= +f.frist) &&
        (f.wert === "alle" || (f.wert === "klein" ? x.m.wert < 100000 : x.m.wert >= 100000));
    }).sort(function (x, y) { return x.a.frist - y.a.frist; });
    var sel = function (k, opts) { return '<label>' + opts[0] + ' <select data-aus-f="' + k + '">' + opts[1].map(function (o) { return '<option value="' + o[0] + '"' + (f[k] === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>"; };
    $main.innerHTML = head("Ausschreibungen", "Passende öffentliche Aufträge mit nachvollziehbarer Eignungsprüfung – übernehmen Sie ein Projekt mit einem Klick in Ihre Anfragen.",
        "Beispieldaten: In der Demo ist keine Ausschreibungsplattform live angebunden. In der echten Version kommen die Daten aus dem Datenservice Öffentlicher Einkauf und dem EU-Amtsblatt TED.") +
      '<div class="dash-filter">' + sel("gewerk", ["Gewerk", [["alle", "alle"], ["Sanitär", "Sanitär"], ["Heizung", "Heizung"]]]) + sel("km", ["Entfernung", [["alle", "egal"], ["15", "bis 15 km"], ["30", "bis 30 km"]]]) +
        sel("frist", ["Frist", [["alle", "egal"], ["14", "bis 14 Tage"], ["21", "bis 21 Tage"]]]) + sel("wert", ["Auftragswert", [["alle", "egal"], ["klein", "unter 100.000 €"], ["gross", "ab 100.000 €"]]]) +
        "<small>" + liste.length + " von " + mod.aus.length + " Projekten</small></div>" +
      (liste.length ? '<div class="aus-liste" id="aus-liste">' + liste.map(function (x) {
        var a = x.a, m = x.m, b = x.b, i = mod.aus.indexOf(a);
        var dub = a.dublette ? '<span class="pill check">Dublette – auch im Datenservice veröffentlicht</span>' : mod.aus.some(function (y) { return y !== a && y.dublette && y.titel === a.titel; }) ? '<span class="pill">auch im EU-Amtsblatt</span>' : "";
        var knopf = a.dublette ? '<small class="hv-hinweis">Wird mit dem Original zusammengeführt</small>' : a.leadId ? '<button class="btn-mini" type="button" data-open="' + a.leadId + '">' + svg(ICON.check) + "In Bearbeitung – öffnen</button>" : '<button class="btn-mini primary" type="button" data-aus-ueber="' + i + '">In Bearbeitung übernehmen</button>';
        return '<article class="aus-karte' + (a.dublette ? " dublette" : "") + '"><div class="aus-frist' + (a.frist <= 10 ? " eilig" : "") + '"><b>' + a.frist + "</b><small>Tage Frist</small></div>" +
          '<div class="aus-inhalt"><div class="aus-kopf"><span class="ampel ' + (b.prio === "hoch" ? "gruen" : "gelb") + '"></span><small>Eignung ' + b.punkte + " % · Priorität " + b.prio + " · " + esc(a.stelle) + " · " + m.km + " km · Quelle: " + esc(m.quelle) + " (Beispiel)</small></div>" +
          "<h3>" + esc(a.titel) + "</h3>" + dub +
          '<details class="aus-details"><summary>Bewertung, fehlende Unterlagen, nächste Schritte</summary><ul class="aus-krit">' + b.kriterien.map(function (k) { return '<li class="' + (k[2] ? "ok" : "nein") + '">' + esc(k[0]) + " <b>+" + k[1] + "</b></li>"; }).join("") + "</ul>" +
            (m.fehlt.length ? "<p><b>Fehlt noch:</b> " + m.fehlt.map(esc).join(" · ") + "</p>" : "") +
            "<p><b>Nächste Schritte:</b> Unterlagen anfordern → Eignung bestätigen → Angebot bis " + datumDE(heuteISO(a.frist - 2)) + " abgeben.</p></details></div>" +
          '<div class="aus-seite"><span class="aus-wert">' + a.wert + "</span>" + knopf + "</div></article>";
      }).join("") + "</div>" : '<p class="col-empty">Keine Ausschreibung passt zu diesen Filtern.</p>');
  }
  function ausUebernehmen(i) {
    var a = mod.aus[i]; if (!a || a.dublette) return;
    if (a.leadId && leadVon(a.leadId)) return openLead(a.leadId);   // keine Duplikate
    var m = ausMeta(a), b = ausBewertung(a, m);
    var l = { id: Date.now(), name: a.stelle, ort: a.ort, kanal: "ausschreibung", betreff: a.titel, wert: m.wert, stage: "neu", tage: 0, tel: "", mail: "", gewerk: m.gewerk === "Heizung" ? "SHK / Heizung" : "Sanitär / Bad",
      nachricht: "Öffentliche Ausschreibung (Beispiel), Frist in " + a.frist + " Tagen. " + a.grund + (m.fehlt.length ? " Fehlt noch: " + m.fehlt.join(", ") + "." : ""),
      ki: b.prio === "hoch" ? "passt" : "pruefen", kiText: "Eignung " + b.punkte + " %: " + b.kriterien.map(function (k) { return k[0] + " (+" + k[1] + ")"; }).join(", ") + ".", kiRec: "Empfehlung: Unterlagen anfordern und bis " + datumDE(heuteISO(a.frist - 2)) + " entscheiden.",
      verantwortlich: "Thomas (GF)", verlauf: [{ t: 0, text: "Aus Ausschreibung übernommen (" + m.quelle + ", Beispiel)" }] };
    state.leads.unshift(l); a.leadId = l.id; a.gemerkt = true;
    protokoll("Ausschreibung „" + a.titel + "“ in Bearbeitung übernommen");
    toast("In Ihre Anfragen übernommen – mit Eignung und fehlenden Unterlagen."); render(); openLead(l.id);
  }

  /* ---------- Auswertungen ---------- */
  function viewAuswertungen() {
    var f = state.ausw || (state.ausw = { zeit: "alle", gewerk: "alle" });
    var L = state.leads.filter(function (l) { return (f.zeit === "alle" || (l.tage || 0) <= +f.zeit) && (f.gewerk === "alle" || gewerkVon(l) === f.gewerk); });
    var gw = ["alle"].concat(GEWERKE);
    var filt = '<div class="dash-filter"><label>Zeitraum <select data-ausw="zeit">' + [["alle", "alles"], ["30", "letzte 30 Tage"], ["90", "letzte 90 Tage"]].map(function (o) { return '<option value="' + o[0] + '"' + (f.zeit === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
      '<label>Gewerk <select data-ausw="gewerk">' + gw.map(function (g) { return '<option' + (f.gewerk === g ? " selected" : "") + ">" + g + "</option>"; }).join("") + "</select></label><small>Berechnet aus dem aktuellen Stand der Demo-Daten</small></div>";
    var kopf = head("Auswertungen", "Wie viele Anfragen werden zu Angeboten und Aufträgen, was ist offen und was ist eingegangen?");
    if (!L.length) { $main.innerHTML = kopf + filt + '<p class="col-empty">Für diese Auswahl gibt es noch keine Daten. Ändern Sie Zeitraum oder Gewerk.</p>'; return; }
    var ids = L.map(function (l) { return l.id; }), namen = L.map(function (l) { return l.name; });
    var st = STAGES.map(function (s) { return [s.label, L.filter(function (l) { return l.stage === s.id; }).length]; });
    var mitAng = L.filter(function (l) { return l.stage !== "neu"; }).length, mitAuf = L.filter(function (l) { return l.stage === "auftrag" || l.stage === "erledigt"; }).length;
    var A = (state.angebote || []).filter(function (a) { return ids.indexOf(a.leadId) > -1 && a.status !== "ersetzt"; });
    var vol = A.reduce(function (s, a) { return s + rechne(a.positionen).netto; }, 0), gew = A.filter(function (a) { return a.status === "angenommen"; }).reduce(function (s, a) { return s + rechne(a.positionen).netto; }, 0);
    var R = mod.rechnungen.filter(function (r) { return namen.indexOf(r.name) > -1; });
    var offen = R.reduce(function (s, r) { return s + restVon(r); }, 0), ein = R.reduce(function (s, r) { return s + bezahltVon(r); }, 0);
    var tageAng = L.filter(function (l) { return l.angebotVor != null && l.tage != null; }).map(function (l) { return Math.max(0, l.tage - l.angebotVor); });
    var ozeit = tageAng.length ? (tageAng.reduce(function (s, x) { return s + x; }, 0) / tageAng.length).toFixed(1).replace(".", ",") + " Tage" : "–";
    var mx = Math.max.apply(null, st.map(function (x) { return x[1]; })) || 1;
    var pr = function (a, b) { return b ? Math.round(a / b * 100) + " %" : "–"; };
    var gwz = GEWERKE.map(function (g) { var x = L.filter(function (l) { return gewerkVon(l) === g; }); return [g, x.length, x.reduce(function (s, l) { return s + (l.stage === "auftrag" || l.stage === "erledigt" ? l.wert : 0); }, 0)]; }).filter(function (x) { return x[1]; });
    var gmx = Math.max.apply(null, gwz.map(function (x) { return x[1]; })) || 1;
    $main.innerHTML = kopf + filt +
      '<div class="kpis">' + kpi("Anfragen", L.length, "in der Auswahl") + kpi("Anfrage → Angebot", pr(mitAng, L.length), mitAng + " mit Angebot") + kpi("Angebot → Auftrag", pr(mitAuf, mitAng), mitAuf + " Aufträge") + kpi("Ø bis zum Angebot", ozeit, "aus " + tageAng.length + " Angeboten") + "</div>" +
      '<div class="kpis">' + kpi("Angebotsvolumen", euro.format(vol), A.length + " Angebote netto") + kpi("Gewonnen", euro.format(gew), "angenommene Angebote netto") + kpi("Offene Rechnungen", euro.format(offen), R.filter(function (r) { return restVon(r) > 0; }).length + " Rechnungen") + kpi("Zahlungseingänge", euro.format(ein), "erfasst") + "</div>" +
      '<div class="panel-grid two"><section class="panel"><h2>Anfragen nach Status</h2><div class="bars">' + st.map(function (x) { return '<div class="bar-row" style="grid-template-columns:120px 1fr 30px"><span>' + x[0] + '</span><span class="bar"><i style="width:' + x[1] / mx * 100 + '%"></i></span><b>' + x[1] + "</b></div>"; }).join("") + "</div></section>" +
      '<section class="panel"><h2>Nach Gewerk</h2><div class="bars">' + gwz.map(function (x) { return '<div class="bar-row" style="grid-template-columns:120px 1fr auto"><span>' + x[0] + '</span><span class="bar"><i style="width:' + x[1] / gmx * 100 + '%"></i></span><b>' + x[1] + " · " + euro.format(x[2]) + "</b></div>"; }).join("") + '</div><p class="src" style="margin-top:8px">Zahl der Anfragen · Wert der gewonnenen Aufträge</p></section></div>';
  }

  /* ---------- Marketing und Kundengewinnung ---------- */
  var KOSTEN_KANAL = { whatsapp: 0, telefon: 0, email: 0, formular: 19, portal: null, ausschreibung: 0 };
  var KAMPAGNEN_START = [
    { id: "k1", name: "Wartungs-Erinnerung Herbst", kanal: "E-Mail an Bestandskunden mit Einwilligung", empf: 23, kosten: 0, status: "Entwurf", ergebnis: "" },
    { id: "k2", name: "Alte Angebote reaktivieren", kanal: "E-Mail / WhatsApp", empf: 3, kosten: 0, status: "läuft (simuliert)", ergebnis: "1 Rückmeldung" },
    { id: "k3", name: "Vorher-nachher: Bad Obermeier", kanal: "Google-Profil und Instagram", empf: 0, kosten: 0, status: "geplant", ergebnis: "" },
    { id: "k4", name: "Flyer im Großhandel", kanal: "Druck, 250 Stück", empf: 0, kosten: 120, status: "abgeschlossen", ergebnis: "2 Anfragen über QR-Code" }
  ];
  function viewMarketing() {
    state.kampagnen = state.kampagnen || KAMPAGNEN_START.map(function (k) { return Object.assign({}, k); });
    var kan = Object.keys(KANAL).map(function (k) {
      var L = state.leads.filter(function (l) { return l.kanal === k; }), W = L.filter(function (l) { return l.stage === "auftrag" || l.stage === "erledigt"; });
      var umsatz = W.reduce(function (s, l) { return s + l.wert; }, 0), kosten = KOSTEN_KANAL[k] === null ? Math.round(umsatz * 0.05) : (KOSTEN_KANAL[k] || 0);
      return [KANAL[k].label, L.length, W.length, umsatz, kosten];
    }).filter(function (x) { return x[1]; });
    var mx = Math.max.apply(null, kan.map(function (x) { return x[1]; })) || 1;
    $main.innerHTML = head("Marketing", "Woher kommen Ihre Anfragen, was hat es gekostet und welche Aktionen laufen?",
        "Nur Demo: Es wird keine echte Werbung gestartet. Google, Social Media und Messenger sind nicht angebunden; Kosten sind Beispielwerte.") +
      '<section class="panel"><h2>Anfragen nach Quelle</h2><table class="mk-tab"><thead><tr><th>Quelle</th><th>Anfragen</th><th>Aufträge</th><th>Umsatz</th><th>Kosten</th><th>Kosten je Auftrag</th></tr></thead><tbody>' +
        kan.map(function (x) { return "<tr><td>" + x[0] + '<span class="bar"><i style="width:' + x[1] / mx * 100 + '%"></i></span></td><td>' + x[1] + "</td><td>" + x[2] + "</td><td>" + euro.format(x[3]) + "</td><td>" + euro.format(x[4]) + "</td><td>" + (x[2] ? euro.format(x[4] / x[2]) : "–") + "</td></tr>"; }).join("") +
      '</tbody></table><p class="src" style="margin-top:8px">Die Quelle legen Sie bei jeder Anfrage fest („Bearbeiten“) oder hier unten neu zu.</p></section>' +
      '<div class="panel-grid two" style="margin-top:16px"><section class="panel"><h2>Aktionen</h2><div class="rows">' + state.kampagnen.map(function (k) {
          var aktiv = /Entwurf|geplant/.test(k.status);
          return '<div class="row"><div class="row-main"><strong>' + esc(k.name) + "</strong><small>" + esc(k.kanal) + (k.empf ? " · " + k.empf + " Empfänger" : "") + " · Kosten " + euro.format(k.kosten) + (k.ergebnis ? " · " + esc(k.ergebnis) : "") + "</small></div>" +
            '<div class="row-side"><span class="pill' + (/simuliert/.test(k.status) ? " check" : /abgeschlossen/.test(k.status) ? " ok" : "") + '">' + esc(k.status) + "</span>" +
            (aktiv && k.empf ? '<button class="btn-mini primary" type="button" data-kamp="' + k.id + '">Vorschau &amp; simulieren</button>' : "") + "</div></div>";
        }).join("") + "</div></section>" +
        '<section class="panel"><h2>Quelle zuordnen</h2><div class="rows">' + state.leads.slice(0, 6).map(function (l) {
          return '<div class="row"><div class="row-main"><strong>' + esc(l.name) + "</strong><small>" + esc(l.betreff) + '</small></div><div class="row-side"><select data-quelle="' + l.id + '" aria-label="Quelle für ' + esc(l.name) + '">' +
            Object.keys(KANAL).map(function (k) { return '<option value="' + k + '"' + (l.kanal === k ? " selected" : "") + ">" + KANAL[k].label + "</option>"; }).join("") + "</select></div></div>";
        }).join("") + "</div></section></div>";
  }

  /* ---------- Einstellungen, Integrationen, Rollen, Hilfe ---------- */
  var INTEGRATIONEN = [
    ["Rechnungsprogramm (z. B. Lexware Office, sevDesk)", "simuliert", "Rechnungen, Zahlungen und E-Rechnung kommen in der Demo aus Beispieldaten."],
    ["Kalender (Google, Outlook, iPhone)", "simuliert", "Die .ics-Datei funktioniert echt, der Abgleich ist simuliert."],
    ["E-Mail-Versand", "simuliert", "Es wird nichts verschickt – „Freigeben & senden“ zeigt nur, was passieren würde."],
    ["WhatsApp Business", "geplant", "Für die echte Version über einen offiziellen Anbieter."],
    ["Bankdaten", "geplant", "Nur über die Bankanbindung des Rechnungsprogramms, kein eigener Kontozugriff."],
    ["Belegtransfer an den Steuerberater (z. B. DATEV)", "geplant", "Übertragung über offizielle Schnittstellen."],
    ["Ausschreibungsdaten", "geplant", "Amtliche Open-Data-Schnittstellen; in der Demo Beispieldaten."],
    ["KI-Vorprüfung und Textvorschläge", "simuliert", "In der Demo vorbereitete Beispieltexte."]
  ];
  var RECHTE = [["Anfragen sehen und anlegen", "gf buero aussen"], ["Angebote erstellen", "gf buero aussen"], ["Aufträge anlegen", "gf buero"], ["Rechnungen und Zahlungen", "gf buero"], ["Löschen", "gf buero"], ["Finanzen und Vertriebsquoten aller", "gf"], ["Regieberichte und Arbeitszeit", "gf buero monteur"]];
  function viewEinstellungen() {
    var groesse = 0; try { groesse = (localStorage.getItem(SPEICHER) || "").length; } catch (e) { groesse = -1; }
    var R = ["gf", "buero", "aussen", "monteur"];
    $main.innerHTML = head("Einstellungen", "Betriebsdaten, Anbindungen, Rollen und Speicherung – mit ehrlichem Stand, was echt und was simuliert ist.") +
      '<div class="panel-grid two"><section class="panel"><h2>Betrieb</h2><div class="facts"><div class="fact"><span>Name</span><b>' + esc(BETRIEB) + '</b></div><div class="fact"><span>Stundensatz (Regie)</span><b>' + euro.format(STUNDENSATZ) + ' netto</b></div><div class="fact"><span>Umsatzsteuer</span><b>' + Math.round(UST * 100) + ' %</b></div><div class="fact"><span>Nummernkreise</span><b>AN-, AU-, RE-2026-…</b></div></div></section>' +
      '<section class="panel"><h2>Speicherung</h2><p>Ihre Änderungen werden <b>nur in diesem Browser</b> gespeichert (localStorage' + (groesse > 0 ? ", ca. " + Math.ceil(groesse / 1024) + " KB" : groesse < 0 ? ", hier gesperrt" : "") + '). Es gibt keinen Abgleich zwischen Geräten und kein Konto. Fotos, die Sie hochladen, bleiben nur bis zum Neuladen.</p>' +
        '<div class="btn-row" style="margin-top:10px"><button class="btn btn-outline" type="button" data-export>Daten als Datei sichern</button><button class="btn btn-outline" type="button" data-reset>Demo zurücksetzen</button></div></section></div>' +
      '<section class="panel" style="margin-top:16px"><h2>Anbindungen</h2><div class="rows">' + INTEGRATIONEN.map(function (x) {
        return '<div class="row"><div class="row-main"><strong>' + esc(x[0]) + "</strong><small>" + esc(x[2]) + '</small></div><div class="row-side"><span class="pill' + (x[1] === "simuliert" ? " check" : "") + '">' + x[1] + "</span></div></div>"; }).join("") + "</div></section>" +
      '<section class="panel" style="margin-top:16px"><h2>Rollen und Rechte</h2><p class="cr-hinweis">Rollen-Simulation: Die Auswahl „Ansicht als“ zeigt, was jede Rolle sieht. Eine echte, serverseitige Zugriffskontrolle und Benutzerkonten gibt es in der Demo noch nicht.</p>' +
        '<table class="mk-tab"><thead><tr><th>Recht</th>' + R.map(function (r) { return "<th>" + ROLLEN[r].label + "</th>"; }).join("") + "</tr></thead><tbody>" +
        RECHTE.map(function (x) { return "<tr><td>" + x[0] + "</td>" + R.map(function (r) { return "<td>" + (x[1].indexOf(r) > -1 ? "✓" : "–") + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></section>" +
      (erlaubt("preise") ? '<section class="panel" style="margin-top:16px"><h2>Preise & Produkte</h2><p>' + (state.preise && state.preise.produkte && Object.keys(state.preise.produkte).length ? Object.keys(state.preise.produkte).length + " Produkte rechnen mit Ihren Preislisten (zuletzt " + datumDE(state.preise.datum) + ")." : "Konfigurator und Angebote rechnen mit Beispielpreisen.") + '</p><div class="btn-row"><button class="btn btn-outline" type="button" data-view="preise">Preisliste einlesen</button></div></section>' : "") +
      '<section class="panel" style="margin-top:16px"><h2>Hilfe</h2><div class="btn-row"><button class="btn btn-signal" type="button" data-tour>Tour starten</button><a class="btn btn-outline" href="kontakt.html">Frage stellen</a><a class="btn btn-outline" href="preise.html">Preise</a></div></section>';
  }
  /* ---------- Preise & Produkte: Preislisten einlesen ---------- */
  var pl = { schritt: "start", rows: null, quelle: null, aufschlag: {}, rundung: "1", gueltig: null, bilder: false, rechte: false };
  function plBasis(pid) {   // Verkaufspreis der ersten Position in der Grundausstattung, ohne Preisliste
    var P = GW.PRODUKTE[pid]; if (!P || !P._roh) return 0; var x = P._roh(P.start())[0]; return x ? +x.ep : 0;
  }
  function plAktiv(pid) { var e = state.preise && state.preise.produkte && state.preise.produkte[pid]; return e && (!e.gueltig || e.gueltig <= heuteISO()) ? e : null; }
  function plRunden(x) { var r = pl.rundung; if (r === "90") return Math.ceil(x - 0.9) + 0.9; if (r === "5") return Math.round(x / 5) * 5; if (r === "1") return Math.round(x); return rund2(x); }
  function plVk(row) { var P = GW.PRODUKTE[row.pid]; if (!P) return 0; var a = pl.aufschlag[P.gw] != null ? pl.aufschlag[P.gw] : 35; return plRunden(row.ek * (1 + a / 100)); }
  function plBisher(pid) { var P = GW.PRODUKTE[pid]; if (!P) return 0; var x = P.preis(P.start())[0]; return x ? +x.ep : 0; }
  (function preiseEinhaengen() {   // jedes Produkt rechnet ab jetzt mit dem Preis aus der Preisliste (falls übernommen)
    Object.keys(GW.PRODUKTE).forEach(function (k) {
      var P = GW.PRODUKTE[k]; if (P._roh) return; P._roh = P.preis;
      P.preis = function (c) {
        var pos = P._roh(c), e = state && plAktiv(k); if (!e || !pos.length) return pos;
        pos = pos.map(function (x) { return Object.assign({}, x); }); pos[0].ep = rund2(pos[0].ep * e.faktor); return pos;
      };
    });
  })();
  function plZeilen(liste) {   // Beispiel-Preisliste → Prüfzeilen
    return liste.zeilen.map(function (z) {
      var basis = z[2] ? plBasis(z[2]) * (z[4] || 1) : 0, ek = z[2] ? rund2(basis / 1.35 * (1 + z[3])) : rund2(8 + (z[0].charCodeAt(4) % 7) * 11.5);
      var auto = window.PREISLISTE.zuordnen(z[1]);
      return { nr: z[0], text: z[1], ek: ek, pid: auto.pid === z[2] ? z[2] : (z[2] || auto.pid), sicher: z[2] ? (auto.pid === z[2] ? Math.max(0.86, auto.sicher) : 0.62) : 0, anteil: z[4] || 1, bild: !!z[2] };
    });
  }
  function plStufe(r) { return r.sicher >= 0.85 ? ["sicher", "ok"] : r.sicher >= 0.6 ? ["prüfen", "check"] : ["keine", ""]; }
  function plAenderung(r) { var b = plBisher(r.pid) * r.anteil; return b ? (plVk(r) - b) / b * 100 : 0; }
  function plStart(quelle, rows) {
    pl.quelle = quelle; pl.rows = rows; pl.schritt = "pruefen"; pl.bilder = rows.some(function (r) { return r.bild; }); pl.rechte = false; pl.gueltig = heuteISO();
    rows.forEach(function (r) { var P = GW.PRODUKTE[r.pid]; if (P && pl.aufschlag[P.gw] == null) pl.aufschlag[P.gw] = 35; r.an = !!r.pid && r.sicher >= 0.6 && Math.abs(plAenderung(r)) <= 40; });
    render();
  }
  function plErkennen(gruppe, dateiname) {   // PDF/Foto: in der Demo wird die Beispiel-Preisliste „erkannt“
    var L = window.PREISLISTE.LISTEN[gruppe]; pl.schritt = "lesen"; pl.lesen = { L: L, seite: 0, datei: dateiname }; render();
    var tick = function () { if (pl.schritt !== "lesen") return; pl.lesen.seite++; var el = document.getElementById("pl-lesen"); if (el) el.textContent = "Seite " + Math.min(pl.lesen.seite, L.seiten) + " von " + L.seiten + " wird gelesen …";
      if (pl.lesen.seite > L.seiten) plStart({ art: dateiname ? "Datei „" + dateiname + "“ (Demo: Beispielinhalt)" : "PDF", lieferant: L.lieferant, titel: L.titel, stand: L.stand }, plZeilen(L)); else setTimeout(tick, 450); };
    setTimeout(tick, 350);
  }
  function viewPreise() {
    var P = GW.PRODUKTE, e = (state.preise && state.preise.produkte) || {}, ids = Object.keys(e).filter(function (k) { return P[k]; });
    var kopf = head("Preise & Produkte", "Preislisten Ihrer Lieferanten einlesen: Einkaufspreise und Produktbilder werden erkannt, den Produkten zugeordnet und mit Ihrem Aufschlag zu Verkaufspreisen.");
    var hinweis = '<p class="cr-hinweis">Einkaufspreise und Aufschläge sehen nur Geschäftsführung und Büro. Kunden sehen im Angebot, Konfigurator und Portal ausschließlich Verkaufspreise. Bereits verschickte Angebote ändern sich nicht.</p>';
    if (pl.schritt === "lesen") { $main.innerHTML = kopf + '<section class="panel pl-lesen"><div class="ki-puls"></div><h2>' + esc(pl.lesen.L.lieferant) + "</h2><p>" + esc(pl.lesen.L.titel) + ' · Stand ' + esc(pl.lesen.L.stand) + '</p><p class="src" id="pl-lesen">Datei wird geöffnet …</p><p class="src">Erkannt werden Artikelnummer, Bezeichnung, Einheit, Preis und Produktbilder.</p></section>'; return; }
    if (pl.schritt === "pruefen") {
      var rows = pl.rows, gws = rows.map(function (r) { return P[r.pid] && P[r.pid].gw; }).filter(function (g, i, a) { return g && a.indexOf(g) === i; });
      var opts = function (sel) { return '<option value="">– nicht übernehmen –</option>' + Object.keys(P).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(P[k].name) + "</option>"; }).join(""); };
      var n = rows.filter(function (r) { return r.an && r.pid; }).length;
      $main.innerHTML = kopf +
        '<section class="panel"><div class="pl-quelle"><div><span class="pill ok">Erkannt</span><h2>' + esc(pl.quelle.lieferant) + "</h2><p>" + [pl.quelle.titel, pl.quelle.stand ? "Stand " + pl.quelle.stand : "", pl.quelle.art].filter(Boolean).map(esc).join(" · ") + '</p></div><button class="btn btn-outline" type="button" data-pl-abbrechen>Abbrechen</button></div>' +
        '<p class="pl-zusammen">' + rows.length + " Zeilen gelesen · " + rows.filter(function (r) { return r.pid; }).length + " einem Produkt zugeordnet · " + rows.filter(function (r) { return !r.pid; }).length + " Zubehör/Kleinteile ohne Konfigurator-Produkt.</p>" +
        '<div class="pl-regler"><div><b>Aufschlag je Gewerk</b><div class="pl-auf">' + gws.map(function (g) { return '<label>' + esc(gwName(g)) + '<span><input type="number" min="0" max="300" step="1" value="' + pl.aufschlag[g] + '" data-pl-auf="' + g + '"> %</span></label>'; }).join("") + "</div></div>" +
          '<label class="pl-feld">Runden<select data-pl-rundung>' + [["1", "auf volle Euro"], ["5", "auf 5 Euro"], ["90", "auf ,90"], ["0", "nicht runden"]].map(function (o) { return '<option value="' + o[0] + '"' + (pl.rundung === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
          '<label class="pl-feld">Gültig ab<input type="date" data-pl-gueltig value="' + pl.gueltig + '"></label></div>' +
        '<div class="pl-scroll"><table class="mk-tab pl-tab"><thead><tr><th>Übernehmen</th><th>Bild</th><th>Art.-Nr.</th><th>Bezeichnung</th><th class="r">EK netto</th><th>Zuordnung</th><th>Erkennung</th><th class="r">VK neu</th><th class="r">bisher</th><th class="r">Änderung</th></tr></thead><tbody>' +
          rows.map(function (r, i) { var st = plStufe(r), ae = r.pid ? plAenderung(r) : 0, bis = r.pid ? plBisher(r.pid) * r.anteil : 0;
            return '<tr class="' + (r.an ? "" : "pl-aus") + '"><td><input type="checkbox" data-pl-an="' + i + '"' + (r.an ? " checked" : "") + (r.pid ? "" : " disabled") + ' aria-label="Zeile übernehmen"></td>' +
              "<td>" + (r.bild && r.pid ? '<img class="pl-bild" src="img/produkte/' + r.pid + '.png" alt="">' : '<span class="pl-ohne">–</span>') + "</td><td>" + esc(r.nr) + "</td><td>" + esc(r.text) + '</td><td class="r">' + eur2.format(r.ek) + "</td>" +
              '<td><select data-pl-pid="' + i + '" aria-label="Produkt zuordnen">' + opts(r.pid) + "</select></td><td>" + (r.pid ? '<span class="pill ' + st[1] + '">' + st[0] + "</span>" : '<span class="src">Zubehör</span>') + "</td>" +
              '<td class="r"><b>' + (r.pid ? eur2.format(plVk(r)) : "–") + '</b></td><td class="r">' + (r.pid ? eur2.format(bis) : "–") + '</td><td class="r ' + (Math.abs(ae) > 40 ? "pl-warn" : ae > 0 ? "pl-hoch" : "pl-runter") + '">' + (r.pid ? (ae > 0 ? "+" : "") + ae.toFixed(1).replace(".", ",") + " %" : "") + "</td></tr>"; }).join("") +
        "</tbody></table></div>" +
        (rows.some(function (r) { return r.pid && Math.abs(plAenderung(r)) > 40; }) ? '<p class="fehler-box">Rot markierte Zeilen weichen mehr als 40 % vom bisherigen Preis ab – oft eine andere Einheit (je m² statt je Stück). Bitte prüfen, sie sind nicht vorausgewählt.</p>' : "") +
        (pl.bilder ? '<label class="ff-check pl-rechte"><input type="checkbox" data-pl-rechte' + (pl.rechte ? " checked" : "") + "> Ich darf die Produktbilder dieses Lieferanten für Angebote und Kundenportal nutzen (Händlervertrag bzw. Bedingungen des Herstellers). Ohne Haken werden nur die Preise übernommen.</label>" : "") +
        '<div class="btn-row"><button class="btn btn-signal" type="button" data-pl-uebernehmen>' + n + (n === 1 ? " Preis" : " Preise") + " übernehmen</button><button class=\"btn btn-outline\" type=\"button\" data-pl-alle>Alle zugeordneten auswählen</button></div>" + hinweis + "</section>";
      return;
    }
    var stand = ids.length ? '<section class="panel"><h2>Ihre Preise</h2><p class="src">' + ids.length + " Produkte rechnen mit Preisen aus Ihren Preislisten.</p>" +
        '<div class="pl-scroll"><table class="mk-tab pl-tab"><thead><tr><th>Bild</th><th>Produkt</th><th>Lieferant</th><th class="r">EK netto</th><th class="r">Aufschlag</th><th class="r">VK netto</th><th>gültig ab</th></tr></thead><tbody>' +
        ids.map(function (k) { var x = e[k]; return "<tr><td>" + (x.bild ? '<img class="pl-bild" src="img/produkte/' + k + '.png" alt="">' : '<span class="pl-ohne">–</span>') + "</td><td><b>" + esc(P[k].name) + "</b><br><small>" + esc(gwName(P[k].gw)) + " · Art.-Nr. " + esc(x.nr) + "</small></td><td>" + esc(x.lieferant) + '</td><td class="r">' + eur2.format(x.ek) + '</td><td class="r">' + x.aufschlag + ' %</td><td class="r"><b>' + eur2.format(x.vk) + "</b></td><td>" + datumDE(x.gueltig) + (x.gueltig > heuteISO() ? ' <span class="pill check">vorgemerkt</span>' : "") + "</td></tr>"; }).join("") +
        '</tbody></table></div><div class="btn-row"><button class="btn btn-outline" type="button" data-pl-reset>Auf Beispielpreise zurücksetzen</button></div></section>' :
      '<section class="panel pl-leer"><h2>Noch keine Preisliste eingelesen</h2><p>Konfigurator, Aufmaß und Angebote rechnen gerade mit Beispielpreisen. Lesen Sie eine Preisliste ein – danach stimmen die Preise mit Ihrem Einkauf überein.</p></section>';
    var gruppe = (function () { var h = hauptGewerk(); return { sonnenschutz: "sonnenschutz", fenster: "bau", shk: "haustechnik", heizung: "haustechnik", elektro: "haustechnik", solar: "haustechnik" }[h] || "bau"; })();
    $main.innerHTML = kopf + stand +
      '<section class="panel" style="margin-top:16px"><h2>Neue Preisliste einlesen</h2><div class="pl-wege">' +
        '<div class="pl-weg"><b>PDF oder Foto</b><p>Preisliste als PDF hochladen oder eine Seite abfotografieren. Preise, Artikelnummern und Bilder werden erkannt.</p><label class="btn btn-signal ff-datei">' + svg(ICON.camera) + 'Datei wählen<input type="file" accept="application/pdf,image/*" data-pl-pdf hidden></label>' +
          '<p class="src">Oder ein Beispiel ausprobieren:</p><div class="btn-row">' + Object.keys(window.PREISLISTE.LISTEN).map(function (g) { var L = window.PREISLISTE.LISTEN[g]; return '<button class="btn-mini' + (g === gruppe ? " primary" : "") + '" type="button" data-pl-beispiel="' + g + '">' + esc(L.lieferant) + "</button>"; }).join("") + "</div></div>" +
        '<div class="pl-weg"><b>CSV oder Excel-Export</b><p>Die meisten Lieferanten bieten ihre Liste als CSV an (in Excel: „Speichern unter → CSV“). Spalten werden selbst erkannt: Artikelnummer, Bezeichnung, Preis.</p><label class="btn btn-outline ff-datei">Datei wählen<input type="file" accept=".csv,.txt,text/csv" data-pl-csv hidden></label><button class="btn-mini" type="button" data-pl-csv-muster>Muster-CSV herunterladen</button></div>' +
        '<div class="pl-weg"><b>Datanorm</b><p>Der Standard im Großhandel (Datanorm 4/5): Preise, Rabattgruppen und Bildverweise kommen direkt vom Großhändler. Im echten Cockpit der bequemste Weg – in der Demo zeigen wir das Beispiel des Haustechnik-Großhandels.</p><button class="btn btn-outline" type="button" data-pl-beispiel="haustechnik">Datanorm-Beispiel</button></div>' +
      "</div>" + hinweis + '<p class="src">Demo: CSV-Dateien werden wirklich gelesen (nur in Ihrem Browser). PDF und Fotos werden in der Demo nicht ausgewertet – stattdessen sehen Sie eine erfundene Beispiel-Preisliste. Produktbilder in der Demo sind eigene, schlichte Darstellungen.</p></section>';
  }
  function plUebernehmen() {
    var gew = pl.rows.filter(function (r) { return r.an && r.pid; }); if (!gew.length) { toast("Bitte mindestens eine Zeile auswählen."); return; }
    state.preise = state.preise || { produkte: {} }; state.preise.produkte = state.preise.produkte || {};
    gew.forEach(function (r) { var P = GW.PRODUKTE[r.pid], vk = plVk(r), basis = plBasis(r.pid) * r.anteil, alt = state.preise.produkte[r.pid];
      state.preise.produkte[r.pid] = { ek: r.ek, vk: vk, faktor: basis ? vk / basis : 1, aufschlag: pl.aufschlag[P.gw], nr: r.nr, lieferant: pl.quelle.lieferant, gueltig: pl.gueltig || heuteISO(), datum: heuteISO(), bild: (pl.bilder && pl.rechte && r.bild) || !!(alt && alt.bild) }; });
    state.preise.datum = heuteISO();
    var vorgemerkt = pl.gueltig > heuteISO();
    toast(gew.length + (gew.length === 1 ? " Preis" : " Preise") + (vorgemerkt ? " vorgemerkt ab " + datumDE(pl.gueltig) + "." : " übernommen – Konfigurator und neue Angebote rechnen jetzt damit.") + (pl.bilder && pl.rechte ? " Bilder übernommen." : ""));
    pl.schritt = "start"; pl.rows = null; render();
  }
  function plKlick(t) {
    var el;
    if ((el = t.closest("[data-pl-beispiel]"))) { plErkennen(el.getAttribute("data-pl-beispiel")); return true; }
    if (t.closest("[data-pl-abbrechen]")) { pl.schritt = "start"; pl.rows = null; render(); return true; }
    if (t.closest("[data-pl-uebernehmen]")) { plUebernehmen(); return true; }
    if (t.closest("[data-pl-alle]")) { pl.rows.forEach(function (r) { if (r.pid) r.an = true; }); render(); return true; }
    if (t.closest("[data-pl-reset]")) { if (confirm("Alle eingelesenen Preise entfernen und wieder mit Beispielpreisen rechnen?")) { state.preise = null; render(); toast("Beispielpreise wiederhergestellt."); } return true; }
    if (t.closest("[data-pl-csv-muster]")) {
      var csv = "Artikelnummer;Bezeichnung;Einheit;EK netto\nA-100;Raffstore 80 mm, 1200 x 1400, Funk;Stk;905,00\nA-110;Insektenschutz Spannrahmen weiß;Stk;132,50\nA-120;Plissee verspannt 1060 x 1260;Stk;188,00\nA-130;Kassettenmarkise 4 x 3 m;Stk;2.190,00\nA-900;Montageschrauben VE 100;VE;12,40\n";
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "muster-preisliste.csv"; document.body.appendChild(a); a.click(); a.remove(); toast("„muster-preisliste.csv“ heruntergeladen – jetzt oben bei CSV einlesen."); return true;
    }
    if (t.closest("[data-preise-link]")) { closeDrawer(); go("preise"); return true; }
    return false;
  }
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.closest || !t.closest("#app-main")) return;
    if (t.matches("[data-pl-an]")) { pl.rows[+t.getAttribute("data-pl-an")].an = t.checked; render(); }
    else if (t.matches("[data-pl-pid]")) { var r = pl.rows[+t.getAttribute("data-pl-pid")]; r.pid = t.value || null; r.sicher = r.pid ? 0.9 : 0; r.an = !!r.pid; var P = GW.PRODUKTE[r.pid]; if (P && pl.aufschlag[P.gw] == null) pl.aufschlag[P.gw] = 35; render(); }
    else if (t.matches("[data-pl-auf]")) { pl.aufschlag[t.getAttribute("data-pl-auf")] = Math.max(0, Math.min(300, +t.value || 0)); render(); }
    else if (t.matches("[data-pl-rundung]")) { pl.rundung = t.value; render(); }
    else if (t.matches("[data-pl-gueltig]")) { pl.gueltig = t.value || heuteISO(); }
    else if (t.matches("[data-pl-rechte]")) { pl.rechte = t.checked; }
    else if (t.matches("[data-pl-pdf]")) { var f = t.files && t.files[0]; if (f) plErkennen((function () { var h = hauptGewerk(); return { sonnenschutz: "sonnenschutz", fenster: "bau", shk: "haustechnik", heizung: "haustechnik", elektro: "haustechnik", solar: "haustechnik" }[h] || "bau"; })(), f.name); }
    else if (t.matches("[data-pl-csv]")) {
      var d = t.files && t.files[0]; if (!d) return;
      var fr = new FileReader(); fr.onload = function () {
        var erg = window.PREISLISTE.csvLesen(fr.result); if (erg.fehler) { toast(erg.fehler); return; }
        if (!erg.rows.length) { toast("Keine Zeilen mit Preis gefunden."); return; }
        plStart({ art: "CSV „" + d.name + "“ · Spalten: " + [erg.spalten.nr, erg.spalten.text, erg.spalten.preis].filter(Boolean).join(", "), lieferant: d.name.replace(/\.(csv|txt)$/i, ""), titel: "" }, erg.rows.map(function (r) { r.anteil = 1; r.bild = false; return r; }));
      }; fr.readAsText(d, "utf-8");
    }
  });
  function exportieren() {
    try {
      var blob = new Blob([localStorage.getItem(SPEICHER) || JSON.stringify({ state: state, mod: mod })], { type: "application/json" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "demo-daten.json"; document.body.appendChild(a); a.click(); a.remove();
      toast("Datei „demo-daten.json“ heruntergeladen.");
    } catch (e) { toast("Export ist in diesem Browser nicht möglich."); }
  }

  function etappe3Klick(t) {
    var el;
    if ((el = t.closest("[data-er-plan]"))) { erinnerungFormular(leadVon(+el.getAttribute("data-er-plan"))); return true; }
    if ((el = t.closest("[data-er-ok]"))) { var l = leadVon(+el.getAttribute("data-er-ok")); if (l && l.erinnerung && !l.erinnerung.erledigt) { l.erinnerung.erledigt = true; l.erinnerung.erledigtAm = datumDE(heuteISO()); add(l, "Erinnerung erledigt: " + l.erinnerung.art + (l.erinnerung.notiz ? " – " + l.erinnerung.notiz : "")); toast("Als erledigt vermerkt."); render(); } return true; }
    if ((el = t.closest("[data-aus-ueber]"))) { ausUebernehmen(+el.getAttribute("data-aus-ueber")); return true; }
    if ((el = t.closest("[data-kamp]"))) {
      var k = state.kampagnen.filter(function (x) { return x.id === el.getAttribute("data-kamp"); })[0]; if (!k || !window.MailVorschau) return true;
      MailVorschau.zeigen({ zweck: k.name + " · " + k.empf + " Empfänger (Simulation)", von: BETRIEB, vonMail: "info@musterbetrieb.de", an: k.empf + " Empfänger", anMail: "Bestandskunden mit Einwilligung", betreff: k.id === "k1" ? "Zeit für die Heizungswartung" : "Ihr Angebot – noch aktuell?",
        mail: [k.id === "k1" ? "Guten Tag,\n\nbevor es richtig kalt wird, lohnt sich ein kurzer Blick auf die Heizung. Wenn Sie einen Wartungstermin möchten, antworten Sie einfach mit einem Wunschtag – oder buchen Sie online.\n\nViele Grüße\n" + absender()[0] + "\n" + BETRIEB + "\n\nSie möchten keine Erinnerungen mehr? Ein kurzes „Stopp“ genügt." : "Guten Tag,\n\nvor einiger Zeit hatten wir Ihnen ein Angebot geschickt. Ist das Thema bei Ihnen noch aktuell? Wenn sich etwas geändert hat, passen wir es gern an.\n\nViele Grüße\n" + absender()[0] + "\n" + BETRIEB],
        wa: ["Hallo, bevor es kalt wird: Sollen wir Ihre Heizung warten? Schreiben Sie uns einfach einen Wunschtag. (Keine Nachrichten mehr? Einfach „Stopp“ antworten.)"],
        senden: function () { k.status = "simuliert gesendet"; k.ergebnis = "Simulation – nichts verschickt"; protokoll("Aktion „" + k.name + "“ simuliert"); render(); } });
      return true;
    }
    if (t.closest("[data-export]")) { exportieren(); return true; }
    return false;
  }
  document.addEventListener("change", function (e) {
    var t = e.target, k;
    if ((k = t.getAttribute && t.getAttribute("data-anf"))) { state[k] = t.value; return viewAnfragen(); }
    if ((k = t.getAttribute && t.getAttribute("data-dash"))) { state.dash[k] = t.value; return render(); }
    if ((k = t.getAttribute && t.getAttribute("data-aus-f"))) { state.ausF[k] = t.value; return viewAusschreibungen(); }
    if ((k = t.getAttribute && t.getAttribute("data-ausw"))) { state.ausw[k] = t.value; return viewAuswertungen(); }
    if (t.hasAttribute && t.hasAttribute("data-po-kunde")) { state.portalKunde = t.value; return viewPortal(); }
    if (t.getAttribute && t.getAttribute("data-quelle")) { var l = leadVon(+t.getAttribute("data-quelle")); if (l) { var alt = KANAL[l.kanal] ? KANAL[l.kanal].label : l.kanal; l.kanal = t.value; add(l, "Quelle geändert: " + alt + " → " + KANAL[t.value].label); toast("Quelle zugeordnet."); viewMarketing(); } }
  });

  /* =====================================================================
     AUFMASS: maßstabsgetreuer Grundriss, 3D-Ansicht, Foto mit Maßen,
     Scan-Simulation (LiDAR), Übernahme ins Angebot.  AR: Produkt im Raum.
     ===================================================================== */
  var m2 = function (n) { return zahl(n); };
  var cm = function (n) { return zahl(n).replace(/,(\d)0$/, ",$1") + " m"; };
  function amRaum() { var i = Math.min(state.amSel || 0, am.raeume.length - 1); state.amSel = Math.max(0, i); return am.raeume[state.amSel]; }
  // Grundriss (o.muster: eigenes SVG-Muster, o.fill: Füllung, o.boden: CSS-Klasse für den Boden)
  function amGrundriss(r, o) {
    o = o || {};
    var W = 360, H = 280, pad = 54, s = Math.min((W - 2 * pad) / r.l, (H - 2 * pad) / r.b), x0 = (W - r.l * s) / 2, y0 = (H - r.b * s) / 2, w = r.l * s, h = r.b * s;
    var tueren = (r.ab || []).filter(function (a) { return a.art === "Tür"; }), fenster = (r.ab || []).filter(function (a) { return a.art !== "Tür"; });
    var oeff = "", pos = 0.3;
    tueren.forEach(function (t) { var tx = x0 + Math.min(pos, Math.max(0, r.l - t.b)) * s, tb = t.b * s;
      oeff += '<rect x="' + tx + '" y="' + (y0 + h - 4) + '" width="' + tb + '" height="8" class="am-luecke"/><path d="M' + tx + " " + (y0 + h) + " L" + tx + " " + (y0 + h - tb) + " A" + tb + " " + tb + " 0 0 1 " + (tx + tb) + " " + (y0 + h) + '" class="am-tuer"/>' +
        '<text x="' + (tx + tb / 2) + '" y="' + (y0 + h + 18) + '" class="am-klein" text-anchor="middle">Tür ' + cm(t.b) + "</text>"; pos += t.b + 0.4; });
    pos = 0.3;
    fenster.forEach(function (f) { var fx = x0 + w - (Math.min(pos, Math.max(0, r.l - f.b)) + f.b) * s, fb = f.b * s;
      oeff += '<rect x="' + fx + '" y="' + (y0 - 4) + '" width="' + fb + '" height="8" class="am-fenster"/><line x1="' + fx + '" y1="' + y0 + '" x2="' + (fx + fb) + '" y2="' + y0 + '" class="am-glas"/>' +
        '<text x="' + (fx + fb / 2) + '" y="' + (y0 - 10) + '" class="am-klein" text-anchor="middle">' + (f.art === "Nische" ? "Nische " : "Fenster ") + cm(f.b) + "</text>"; pos += f.b + 0.4; });
    var pfeil = function (x1, y1, x2, y2, txt, vert) {
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="am-mass" marker-start="url(#pf)" marker-end="url(#pf)"/>' +
        (vert ? '<text x="' + (x1 - 8) + '" y="' + ((y1 + y2) / 2) + '" class="am-masstext" text-anchor="middle" transform="rotate(-90 ' + (x1 - 8) + " " + ((y1 + y2) / 2) + ')">' + txt + "</text>"
              : '<text x="' + ((x1 + x2) / 2) + '" y="' + (y1 - 7) + '" class="am-masstext" text-anchor="middle">' + txt + "</text>");
    };
    var fill = o.fill || (o.boden ? "" : "url(#fliese)");
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="am-svg" role="img" aria-label="Grundriss ' + esc(r.name || "") + ": " + cm(r.l) + " × " + cm(r.b) + '">' +
      '<defs><marker id="pf" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="am-pfeil"/></marker>' +
      '<pattern id="fliese" width="' + (0.3 * s) + '" height="' + (0.3 * s) + '" patternUnits="userSpaceOnUse"><path d="M ' + (0.3 * s) + " 0 L 0 0 0 " + (0.3 * s) + '" class="am-fuge"/></pattern>' + (o.muster || "") + "</defs>" +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '"' + (fill ? ' fill="' + fill + '"' : "") + ' class="am-boden ' + (o.boden || "") + '"/>' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" class="am-wand"/>' + oeff +
      pfeil(x0, y0 - 28, x0 + w, y0 - 28, "Länge " + cm(r.l)) + pfeil(x0 - 24, y0, x0 - 24, y0 + h, "Breite " + cm(r.b), true) +
      (o.ohneText ? "" : '<text x="' + (x0 + w / 2) + '" y="' + (y0 + h / 2 + (o.textUnten ? h / 2 - 10 : 0)) + '" class="am-flaeche" text-anchor="middle">' + m2(r.l * r.b) + " m²</text>") + "</svg>";
  }
  // 3D-Ansicht (o.farbe: Wandfarbe, o.ohneFugen: ohne Fliesenraster, o.boden: CSS-Klasse)
  function am3d(r, o) {
    o = o || {};
    var hh = r.h || 2.5, W = 360, H = 280, s = Math.min(150 / Math.max(r.l, r.b), 60 / Math.max(hh, 1) * 1.6), c = Math.cos(Math.PI / 6), sn = 0.5;
    var P = function (x, y, z) { return [W / 2 + (x - z) * c * s, 70 + (x + z) * sn * s - y * s + hh * s * 0.55]; };
    var poly = function (pts, cls, extra) { return '<polygon points="' + pts.map(function (p) { var q = P(p[0], p[1], p[2]); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ") + '" class="' + cls + '"' + (extra || "") + "/>"; };
    var linien = "", st = 0.3, x, z, y;
    if (!o.ohneFugen) {
      for (x = st; x < r.l; x += st) { var a = P(x, 0, 0), b = P(x, hh, 0); linien += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="am-fuge"/>'; }
      for (z = st; z < r.b; z += st) { var a2 = P(0, 0, z), b2 = P(0, hh, z); linien += '<line x1="' + a2[0] + '" y1="' + a2[1] + '" x2="' + b2[0] + '" y2="' + b2[1] + '" class="am-fuge"/>'; }
      for (y = st; y < hh; y += st) { var a3 = P(0, y, 0), b3 = P(r.l, y, 0), c3 = P(0, y, r.b); linien += '<line x1="' + a3[0] + '" y1="' + a3[1] + '" x2="' + b3[0] + '" y2="' + b3[1] + '" class="am-fuge"/><line x1="' + a3[0] + '" y1="' + a3[1] + '" x2="' + c3[0] + '" y2="' + c3[1] + '" class="am-fuge"/>'; }
    }
    var oeff = "", tz = 0.3;
    (r.ab || []).forEach(function (q) {
      if (q.art === "Tür") { oeff += poly([[0, 0, tz], [0, q.h, tz], [0, q.h, Math.min(r.b, tz + q.b)], [0, 0, Math.min(r.b, tz + q.b)]], "am3-tuer"); tz += q.b + 0.3; }
      else { var fx = Math.max(0, (r.l - q.b) / 2), fy = Math.min(hh - q.h - 0.1, 1.0); oeff += poly([[fx, fy, 0], [fx + q.b, fy, 0], [fx + q.b, fy + q.h, 0], [fx, fy + q.h, 0]], "am3-fenster"); }
    });
    var fl = flaechen(r), farbe = o.farbe ? ' style="fill:' + o.farbe + '"' : "";
    var lab = function (p, t) { var q = P(p[0], p[1], p[2]); return '<text x="' + q[0] + '" y="' + q[1] + '" class="am-masstext" text-anchor="middle">' + t + "</text>"; };
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="am-svg" role="img" aria-label="3D-Ansicht ' + esc(r.name || "") + '">' +
      poly([[0, 0, 0], [r.l, 0, 0], [r.l, 0, r.b], [0, 0, r.b]], "am3-boden " + (o.boden || "")) + poly([[0, 0, 0], [r.l, 0, 0], [r.l, hh, 0], [0, hh, 0]], "am3-wand", farbe) +
      poly([[0, 0, 0], [0, 0, r.b], [0, hh, r.b], [0, hh, 0]], "am3-wand2", farbe) + linien + oeff +
      lab([r.l / 2, 0, r.b + 0.35], "Länge " + cm(r.l)) + lab([r.l + 0.35, 0, r.b / 2], "Breite " + cm(r.b)) + lab([0, hh + 0.15, 0], "Höhe " + cm(hh)) +
      '<text x="12" y="' + (H - 12) + '" class="am-klein">Wand nach Abzug ' + m2(fl.wand) + " m² · Boden " + m2(fl.boden) + " m²</text></svg>";
  }
  function amFoto(r) {
    var fen = (r.ab || []).filter(function (a) { return a.art !== "Tür"; })[0];
    return '<svg viewBox="0 0 360 280" class="am-svg am-foto" role="img" aria-label="Foto mit eingezeichneten Maßen (Illustration)">' +
      '<defs><linearGradient id="licht" x1="0" x2="1"><stop offset="0" stop-color="#e3e6df"/><stop offset="1" stop-color="#c7cbc3"/></linearGradient>' +
      '<pattern id="kachel" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#eef1ee"/><path d="M22 0H0V22" fill="none" stroke="#cfd4d0" stroke-width="1"/></pattern></defs>' +
      '<rect width="360" height="280" fill="url(#licht)"/><rect x="0" y="120" width="360" height="160" fill="url(#kachel)"/><rect x="0" y="236" width="360" height="44" fill="#a99d90"/>' +
      (fen ? '<rect x="200" y="40" width="96" height="80" fill="#d7eaf5" stroke="#fff" stroke-width="5"/><line x1="248" y1="40" x2="248" y2="120" stroke="#fff" stroke-width="4"/>' : "") +
      '<rect x="40" y="150" width="110" height="20" rx="4" fill="#f6f6f4"/><rect x="60" y="170" width="70" height="66" fill="#dccfbf"/>' +
      '<g class="am-foto-mass"><line x1="10" y1="252" x2="350" y2="252"/><text x="180" y="247" text-anchor="middle">' + cm(r.l) + "</text>" +
      '<line x1="330" y1="236" x2="330" y2="14"/><text x="324" y="130" text-anchor="end">' + cm(r.h || 2.5) + "</text>" +
      (fen ? '<line x1="200" y1="30" x2="296" y2="30"/><text x="248" y="25" text-anchor="middle">' + cm(fen.b) + " × " + cm(fen.h) + "</text>" : "") + "</g>" +
      '<text x="12" y="20" class="am-foto-hinweis">Illustration · Maße per Fingertipp ins Foto gesetzt</text></svg>';
  }
  var ZEICHNEN = { grund: amGrundriss, iso: am3d, foto: amFoto };

  /* ---------- Gewerke des Betriebs ---------- */
  var GWK = "auftragscockpit-gewerke";
  function hauptGewerk() { var b = window.DEMO_BRANCHE || "shk"; return window.GW && GW.AUFMASS[b] ? b : (window.GW && GW.AUFMASS_FUER[b]) || "allgemein"; }
  function gewerkeAlle() {
    var h = hauptGewerk(), liste = [];
    try { liste = JSON.parse(localStorage.getItem(GWK) || "{}").weitere || []; } catch (e) { liste = []; }
    return [h].concat(liste.filter(function (g) { return g !== h && GW.AUFMASS[g]; }));
  }
  function gwName(id) { var g = (GW.GEWERKE || []).filter(function (x) { return x.id === id; })[0]; return g ? g.name : id === "allgemein" ? "Flächen" : id; }
  function amGw(id) {
    am.gw = am.gw || {};
    if (!am.gw[id]) { var s = GW.AUFMASS[id].start(); am.gw[id] = { posten: s.posten, e: s.e }; }
    return am.gw[id];
  }
  function amAktivId() { var alle = gewerkeAlle(); if (alle.indexOf(state.gwTab) < 0) state.gwTab = alle[0]; return state.gwTab; }
  function amPosten() { var A = amGw(amAktivId()); state.amSel = Math.max(0, Math.min(state.amSel || 0, A.posten.length - 1)); return A.posten[state.amSel]; }
  function nameT(n) { return window.DEMO_UEBERSETZE ? DEMO_UEBERSETZE(n) : n; }

  /* ---------- Formularfelder aus der Gewerk-Beschreibung ---------- */
  function gwFeld(f, wert, attr) {
    var lab = f.l + (f.e && f.t === "n" ? " (" + f.e + ")" : "");
    if (f.t === "sel") return '<label>' + lab + '<select ' + attr + '="' + f.k + '">' + f.o.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (String(wert) === String(v) ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select></label>";
    if (f.t === "txt") return '<label>' + lab + '<input ' + attr + '="' + f.k + '" value="' + esc(wert == null ? "" : wert) + '"></label>';
    return '<label>' + lab + '<input type="number" inputmode="decimal" ' + attr + '="' + f.k + '" value="' + esc(wert == null ? "" : wert) + '" min="' + f.min + '" max="' + f.max + '" step="' + (f.st || 0.01) + '"></label>';
  }
  function gwPruefe(f, v) {
    if (f.t !== "n") return "";
    var x = parseFloat(String(v).replace(",", "."));
    if (!isFinite(x) || x < f.min || x > f.max) return f.l + ": bitte einen Wert zwischen " + String(f.min).replace(".", ",") + " und " + String(f.max).replace(".", ",") + (f.e ? " " + f.e : "") + " eingeben.";
    return "";
  }

  /* ---------- Ansicht Aufmaß ---------- */
  function viewAufmass() {
    var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id), p = amPosten(), alle = gewerkeAlle();
    var kunden = state.leads.map(function (l) { return l.name; }); if (kunden.indexOf(am.kunde) < 0) kunden.unshift(am.kunde);
    var ans = C.ansichten(p); if (!ans.some(function (x) { return x[0] === state.amAnsicht; })) state.amAnsicht = ans[0][0];
    var prod = C.produkte ? C.produkte(p) : [];
    var oe = C.oeff && p.ab ? (p.ab || []).map(function (o, j) {
      return '<div class="am-oe"><select data-gw-ab="' + j + '" data-k="art" aria-label="Art">' + ["Tür", "Fenster", "Nische"].map(function (x) { return "<option" + (o.art === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select>" +
        '<label>B <input type="number" step="0.01" min="0.1" max="10" inputmode="decimal" data-gw-ab="' + j + '" data-k="b" value="' + o.b + '"></label><label>H <input type="number" step="0.01" min="0.1" max="10" inputmode="decimal" data-gw-ab="' + j + '" data-k="h" value="' + o.h + '"></label>' +
        '<button class="icon-btn" type="button" data-gw-abdel="' + j + '" aria-label="Öffnung entfernen">✕</button></div>';
    }).join("") : "";
    var vorschau = C.positionen(A), sv = rechne(vorschau);
    $main.innerHTML = '<div data-nt>' + head(C.titel + (alle.length > 1 ? "" : ""), "Maße eintragen oder messen lassen – Zeichnung, Mengen und Angebotspositionen entstehen sofort.",
        (C.scan ? "Messen ist in der Demo simuliert (in echt: LiDAR-Sensor im iPhone Pro, Laser-Messgerät per Bluetooth oder Luftbild). " : "") + "Preise sind Beispielpreise und im echten Cockpit frei einstellbar.") +
      (alle.length > 1 ? '<div class="gw-tabs" role="tablist" aria-label="Gewerk">' + alle.map(function (g) { return '<button type="button" data-gw-tab="' + g + '" aria-pressed="' + (g === id) + '">' + (GW.IC[g] ? svg(GW.IC[g]) : "") + esc(gwName(g)) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="dash-filter am-leiste"><label>Kunde <select data-gw-kunde>' + kunden.map(function (k) { return '<option value="' + esc(k) + '"' + (k === am.kunde ? " selected" : "") + ">" + esc(nameT(k)) + "</option>"; }).join("") + "</select></label>" +
        (C.scan ? '<button class="btn btn-outline" type="button" data-gw-scan>' + svg(ICON.camera) + esc(C.scan.label) + "</button>" : "") +
        prod.map(function (x) { return '<button class="btn btn-outline" type="button" data-konf="' + x + '">' + svg(ICON.box) + esc(GW.PRODUKTE[x].name) + " konfigurieren</button>"; }).join("") +
        '<button class="btn btn-outline" type="button" data-konf-katalog>' + svg(ICON.spark) + "Produktkatalog</button>" +
        (id === "maler" ? '<button class="btn btn-outline" type="button" data-foto-faerben>' + svg(ICON.camera) + "Wand im Foto färben</button>" : "") +
        '<button class="btn btn-signal" type="button" data-gw-angebot>Ins Angebot übernehmen</button></div>' +
      '<div class="filter am-raeume" role="tablist">' + A.posten.map(function (x, i) { return '<button type="button" data-gw-p="' + i + '" aria-pressed="' + (i === state.amSel) + '">' + esc(x.name || C.posten) + (x.art && C.arten ? ' <small>' + esc(x.art) + "</small>" : "") + "</button>"; }).join("") +
        (C.arten ? C.arten.map(function (a) { return '<button type="button" class="am-plus" data-gw-neu="' + esc(a) + '">+ ' + esc(a) + "</button>"; }).join("") : '<button type="button" class="am-plus" data-gw-neu>+ ' + esc(C.posten) + "</button>") + "</div>" +
      '<div class="panel-grid two am-layout"><section class="panel" id="aufmass-panel"><h2>' + esc(p.name || C.posten) + "</h2>" +
        '<div class="am-grid2">' + C.felder(p).map(function (f) { return gwFeld(f, p[f.k], "data-gw-f"); }).join("") + "</div>" +
        (C.oeff && p.ab ? '<h3 class="am-h3">Türen, Fenster, Nischen</h3>' + (oe || '<p class="src">Keine Öffnungen.</p>') + '<div class="btn-row" style="margin-top:8px"><button class="btn-mini" type="button" data-gw-abneu>+ Öffnung</button></div>' : "") +
        (C.einst && C.einst.length ? '<h3 class="am-h3">Gilt für alle ' + (C.posten === "Raum" ? "Räume" : "Einträge") + '</h3><div class="am-grid2">' + C.einst.map(function (f) { return gwFeld(f, A.e[f.k], "data-gw-e"); }).join("") + "</div>" : "") +
        '<p class="fehler-box" id="am2-fehler" hidden></p>' +
        (A.posten.length > 1 ? '<p style="margin-top:12px"><button class="btn-mini" type="button" data-gw-del>' + esc(C.posten) + " entfernen</button></p>" : "") + "</section>" +
      '<section class="panel" id="am-vis-panel"><div class="filter am-tabs" role="tablist">' + ans.map(function (x) { return '<button type="button" data-gw-ansicht="' + x[0] + '" aria-pressed="' + (state.amAnsicht === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
        '<div class="am-vis" id="am-vis">' + gwBild() + "</div></section></div>" +
      '<section class="panel" id="am-ergebnis" style="margin-top:16px">' + gwErgebnis() + "</section></div>";
  }
  function gwBild() {
    var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id), p = amPosten();
    return C.bild(state.amAnsicht, p, A, ZEICHNEN) + (p.gescannt ? '<span class="pill ok am-scan-pill">' + svg(ICON.check) + "gemessen (Simulation)</span>" : "");
  }
  function gwErgebnis() {
    var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id), v = C.positionen(A), s = rechne(v);
    return "<h2>Ergebnis für " + esc(nameT(am.kunde)) + "</h2>" + C.ergebnis(A) +
      '<details class="gw-vorschau"><summary><span>Angebot daraus: <b>' + v.length + " Positionen · " + eur2.format(s.netto) + " netto</b>" + (s.optional ? " (+ " + eur2.format(s.optional) + " optional)" : "") + "</span><span class=\"gw-auf\">Positionen ansehen</span></summary>" +
      '<table class="mk-tab am-tab"><tbody>' + v.map(function (x) { return "<tr" + (x.optional ? ' class="opt"' : "") + "><td>" + esc(x.text) + (x.optional ? " <em>(optional)</em>" : "") + '</td><td class="num">' + zahl(x.menge) + " " + esc(x.einheit) + '</td><td class="num">' + eur2.format(zeilenSumme(x) || 0) + "</td></tr>"; }).join("") + "</tbody></table></details>";
  }
  function amAktualisieren() { var v = document.getElementById("am-vis"); if (v) v.innerHTML = gwBild(); var e = document.getElementById("am-ergebnis"); if (e) e.innerHTML = gwErgebnis(); }
  function amScan() {
    var v = document.getElementById("am-vis"); if (!v || v.querySelector(".am-scan")) return;
    var id = amAktivId(), C = GW.AUFMASS[id], p = amPosten();
    v.insertAdjacentHTML("beforeend", '<div class="am-scan" aria-live="polite"><div class="am-scan-linie"></div><span>' + esc(C.scan.text) + "</span></div>");
    setTimeout(function () {
      var txt;
      if (C.scan.run) txt = C.scan.run(p);
      else {
        var rund = function (x, d) { return Math.round((x + d) * 100) / 100; };
        p.l = rund(+p.l, 0.02); p.b = rund(+p.b, -0.01); if (p.h) p.h = rund(+p.h, 0.01);
        if (p.ab && !p.ab.some(function (a) { return a.art === "Fenster"; })) p.ab.push({ art: "Fenster", b: 0.9, h: 1.0 });
        txt = "Gescannt (Simulation): " + cm(p.l) + " × " + cm(p.b) + (p.h ? ", Höhe " + cm(p.h) : "") + " – Fenster und Türen erkannt.";
      }
      p.gescannt = true;
      var l = state.leads.filter(function (x) { return x.name === am.kunde; })[0]; if (l) add(l, "Aufmaß " + (p.name || "") + ": " + txt);
      toast(txt); if (state.view === "aufmass") viewAufmass();
    }, 2300);
  }
  function amInsAngebot() {
    var l = state.leads.filter(function (x) { return x.name === am.kunde; })[0];
    if (!l) { toast("Zu „" + nameT(am.kunde) + "“ gibt es keine Anfrage – bitte zuerst eine Anfrage anlegen."); return; }
    if (!darf("angebot")) { toast("Angebote erstellen ist in dieser Rolle nicht erlaubt (Rollen-Simulation)."); return; }
    var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id), a = angebotNeu(l);
    if (a.status !== "entwurf") { alert("Das Angebot " + a.nr + " ist bereits " + (A_ST[a.status] || [a.status])[0] + ". Bitte im Angebot eine neue Version anlegen und dann das Aufmaß übernehmen."); state.angebotSel = a.id; state.view = "angebote"; render(); return; }
    var neu = C.positionen(A).map(function (x) { x.aufmass = true; x.gw = id; return x; });
    a.positionen = neu.concat(a.positionen.filter(function (x) { return !x.aufmass; }).filter(function (x) { return !x.start; }));
    if (!a.aufmassOk) { a.positionen = neu; a.aufmassOk = true; }   // erste Übernahme ersetzt die groben Startpositionen
    verlaufK(a, "Aufmaß " + gwName(id) + " übernommen (" + A.posten.map(function (x) { return x.name; }).join(", ") + ")"); add(l, "Aufmaß " + gwName(id) + " ins Angebot " + a.nr + " übernommen");
    toast("Übernommen – " + neu.length + " Positionen stehen im Angebot " + a.nr + "."); state.angebotSel = a.id; state.view = "angebote"; render(); window.scrollTo(0, 0);
  }
  function amEingabe(t, neuZeichnen) {
    var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id), p = amPosten(), fb = document.getElementById("am2-fehler"), fehler = "";
    var k = t.getAttribute("data-gw-f"), e = t.getAttribute("data-gw-e"), j = t.getAttribute("data-gw-ab");
    var zahlW = function (v) { return parseFloat(String(v).replace(",", ".")); };
    if (k) { var f = C.felder(p).filter(function (x) { return x.k === k; })[0]; if (f) { fehler = gwPruefe(f, t.value); if (!fehler) { p[k] = f.t === "n" ? zahlW(t.value) : t.value; if (f.t === "n") p.gescannt = false; } } }
    if (e) { var fe = C.einst.filter(function (x) { return x.k === e; })[0]; if (fe) { fehler = gwPruefe(fe, t.value); if (!fehler) A.e[e] = fe.t === "n" ? zahlW(t.value) : t.value; } }
    if (j !== null && p.ab && p.ab[+j]) { var kk = t.getAttribute("data-k"); if (kk === "art") p.ab[+j].art = t.value; else { var y = zahlW(t.value); if (!(y > 0 && y <= 10)) fehler = "Türen und Fenster: Breite und Höhe zwischen 0,01 und 10 m."; else p.ab[+j][kk] = y; } }
    t.setAttribute("aria-invalid", fehler ? "true" : "false");
    if (fb) { fb.hidden = !fehler; fb.textContent = fehler; }
    if (neuZeichnen && !fehler) viewAufmass(); else amAktualisieren();
  }
  function aufmassKlick(t) {
    var el;
    if ((el = t.closest("[data-ar]"))) { konfOeffnen(el.getAttribute("data-ar")); return true; }
    if ((el = t.closest("[data-konf]"))) { var pid = el.getAttribute("data-konf"); if (state.view === "aufmass") konfOeffnen(pid, { aufmass: true }); else konfOeffnen(pid); return true; }
    if ((el = t.closest("[data-gw-produkt]")) && state.view === "aufmass") { konfOeffnen(el.getAttribute("data-gw-produkt"), { aufmass: true }); return true; }
    if (state.view !== "aufmass") return false;
    var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id);
    if ((el = t.closest("[data-gw-tab]"))) { state.gwTab = el.getAttribute("data-gw-tab"); state.amSel = 0; state.amAnsicht = null; viewAufmass(); return true; }
    if ((el = t.closest("[data-gw-p]"))) { state.amSel = +el.getAttribute("data-gw-p"); state.amAnsicht = null; viewAufmass(); return true; }
    if ((el = t.closest("[data-gw-neu]"))) { A.posten.push(C.neu(el.getAttribute("data-gw-neu") || undefined)); state.amSel = A.posten.length - 1; state.amAnsicht = null; viewAufmass(); return true; }
    if (t.closest("[data-gw-del]")) { if (A.posten.length > 1 && confirm("„" + (amPosten().name || C.posten) + "“ entfernen?")) { A.posten.splice(state.amSel, 1); state.amSel = 0; viewAufmass(); } return true; }
    if (t.closest("[data-gw-abneu]")) { (amPosten().ab = amPosten().ab || []).push({ art: "Fenster", b: 1.0, h: 1.2 }); viewAufmass(); return true; }
    if ((el = t.closest("[data-gw-abdel]"))) { amPosten().ab.splice(+el.getAttribute("data-gw-abdel"), 1); viewAufmass(); return true; }
    if ((el = t.closest("[data-gw-ansicht]"))) { state.amAnsicht = el.getAttribute("data-gw-ansicht"); viewAufmass(); return true; }
    if (t.closest("[data-gw-scan]")) { amScan(); return true; }
    if (t.closest("[data-gw-angebot]")) { amInsAngebot(); return true; }
    return false;
  }
  document.addEventListener("input", function (e) { var t = e.target; if (state && state.view === "aufmass" && t.closest && t.closest("#aufmass-panel") && t.matches("input") && (t.hasAttribute("data-gw-f") || t.hasAttribute("data-gw-e") || t.hasAttribute("data-gw-ab"))) amEingabe(t, false); });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!state || state.view !== "aufmass" || !t.getAttribute) return;
    if (t.hasAttribute("data-gw-kunde")) { am.kunde = t.value; viewAufmass(); return; }
    if (t.closest && t.closest("#aufmass-panel") && (t.matches("select") || t.getAttribute("data-gw-f") === "name")) amEingabe(t, true);
  });

  /* =====================================================================
     PRODUKT-KONFIGURATOR mit 3D/AR: Maße, Farben, Ausstattung, Preis
     ===================================================================== */
  function arProduktFuer(t) { t = t || ""; return /Wärmepumpe/i.test(t) ? "waermepumpe" : /Heiz|Therm|Kessel/i.test(t) ? "heizkoerper" : /Waschtisch|Gäste/i.test(t) ? "waschtisch" : /Terrass|Wintergarten/i.test(t) ? "terrassendach" : /Markise/i.test(t) ? "markise" : /Haustür/i.test(t) ? "haustuer" : /Wallbox/i.test(t) ? "wallbox" : /Speicher|PV|Photovoltaik/i.test(t) ? "stromspeicher" : /Klima/i.test(t) ? "klimageraet" : /Kamin/i.test(t) ? "kaminofen" : "dusche"; }
  var MV_URL = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.4.0/dist/model-viewer.min.js";
  function arLaden() {
    if (window.customElements && customElements.get("model-viewer")) return;
    if (document.querySelector("script[data-mv-lib]")) return;
    var sc = document.createElement("script"); sc.type = "module"; sc.src = MV_URL; sc.setAttribute("data-mv-lib", ""); document.head.appendChild(sc);
  }
  function hexRgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function konfZiel(pid, o) {   // Wo die Konfiguration gespeichert wird: am Aufmaß-Eintrag oder als eigene Konfiguration
    var P = GW.PRODUKTE[pid];
    if (o && o.cfg) return o.cfg;
    if (o && o.aufmass) {
      var id = amAktivId(), C = GW.AUFMASS[id], A = amGw(id), p = amPosten(), z = (C.ziel || {})[pid] || (id === "shk" ? { dusche: "p.kd", waschtisch: "p.kw" }[pid] : null) || "p.k_" + pid;
      if (z === "p") { var d = P.start(); Object.keys(d).forEach(function (k) { if (p[k] === undefined) p[k] = d[k]; }); return p; }
      var teile = z.split("."), obj = teile[0] === "e" ? A.e : p;
      if (!obj[teile[1]]) obj[teile[1]] = P.start();
      return obj[teile[1]];
    }
    state.konfAktiv = state.konfAktiv || {};
    return state.konfAktiv[pid] = state.konfAktiv[pid] || P.start();
  }
  function konfSichtbar(P, c) {   // Materialien je Option: sichtbar / versteckt
    var an = {}, aus = {};
    (P.optionen || []).forEach(function (o) {
      if (!o.mat) return;
      Object.keys(o.mat).forEach(function (wert) { o.mat[wert].forEach(function (m) { if (String(c[o.k]) === wert && (!o.wenn || o.wenn(c))) an[m] = 1; else aus[m] = 1; }); });
    });
    (P.immer || []).forEach(function (m) { an[m] = 1; });
    Object.keys(an).forEach(function (m) { delete aus[m]; });
    return { an: an, aus: aus };
  }
  function mvAnwenden(mv, P, c) {
    if (!mv) return;
    var sk = P.skal(c); mv.setAttribute("scale", sk.map(function (x) { return (+x || 1).toFixed(3); }).join(" "));
    if (!mv.model || !mv.model.materials) return;
    var vis = konfSichtbar(P, c), farbe = {};
    (P.farben || []).forEach(function (f) { var o = f.o.filter(function (x) { return x[0] === c[f.k]; })[0]; if (o) f.mat.forEach(function (m) { farbe[m] = { rgb: hexRgb(o[1]), alpha: !!f.alpha }; }); });
    (P.optionen || []).forEach(function (o) { if (o.tint && o.tint.w[c[o.k]]) farbe[o.tint.mat] = { rgb: hexRgb(o.tint.w[c[o.k]]), alpha: true }; });
    mv.model.materials.forEach(function (m) {
      var pbr = m.pbrMetallicRoughness; if (!m._orig) m._orig = { f: pbr.baseColorFactor.slice(), mode: m.getAlphaMode ? m.getAlphaMode() : "OPAQUE" };
      var f = m._orig.f.slice(), fa = farbe[m.name] || (/_r$/.test(m.name) && farbe["*_r"]);
      if (fa) { f[0] = fa.rgb[0]; f[1] = fa.rgb[1]; f[2] = fa.rgb[2]; }
      if (vis.aus[m.name] || (/^o_/.test(m.name) && !vis.an[m.name])) { f[3] = 0; if (m.setAlphaMode) m.setAlphaMode("BLEND"); }
      else if (m.setAlphaMode) m.setAlphaMode(m._orig.mode);
      pbr.setBaseColorFactor(f);
    });
    mvTextur(mv, P, c);
  }
  var konf = null;   // offener Konfigurator { pid, cfg, o }
  function konfOeffnen(pid, o) {
    o = o || {};
    if (!pid) pid = konfProdukteWahl()[0] || "dusche";
    var P = GW.PRODUKTE[pid] || GW.PRODUKTE[arProduktFuer(pid)]; if (!P) return;
    arLaden(); closeDrawer(); lastFocus = document.activeElement;
    var cfg = konfZiel(P.id, o);
    konf = { pid: P.id, cfg: cfg, o: o, ansicht: P.modell ? "3d" : "zeichnung", katalog: !!o.katalog, katGw: "meine", suche: "" };
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer kf-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title"); d.setAttribute("data-nt", "");
    d.innerHTML = kopfX(o.kunde ? "Produkte ansehen" : "Konfigurator") + '<div id="kf-inhalt"></div>';
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    konfZeichnen(true);
    d.querySelector("[data-close]").focus();
  }
  function konfProdukteWahl() {   // Produkte, zwischen denen man im Konfigurator wechseln kann
    var gws = gewerkeAlle(); return Object.keys(GW.PRODUKTE).filter(function (k) { return gws.indexOf(GW.PRODUKTE[k].gw) > -1; });
  }
  var KAT_REIHE = ["Bad", "Wärme", "Strom", "Wohnen", "Außen"];
  function abPreis(P) { return rechne(P.preis(P.start())).netto; }
  function konfKatalog() {
    var box = document.getElementById("kf-inhalt"); if (!box || !konf) return;
    var meine = gewerkeAlle(), alle = Object.keys(GW.PRODUKTE).map(function (k) { return GW.PRODUKTE[k]; }), q = (konf.suche || "").toLowerCase();
    var liste = alle.filter(function (P) { return (konf.katGw === "alle" || (konf.katGw === "meine" ? meine.indexOf(P.gw) > -1 : P.gw === konf.katGw)) && (!q || (P.name + " " + gwName(P.gw) + " " + (P.kat || "")).toLowerCase().indexOf(q) > -1); });
    if (q) { var nur = liste.filter(function (P) { return (P.name + " " + (P.uk || "")).toLowerCase().indexOf(q) > -1; }); if (nur.length) liste = nur; }
    var uks = liste.map(function (P) { return P.uk || "Weitere"; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    if (konf.katUk && uks.indexOf(konf.katUk) < 0) konf.katUk = null;
    var ukChips = uks.length > 1 ? '<div class="filter kat-chips kat-uk"><span class="kat-uk-l">Kategorie</span><button type="button" data-kf-katuk="" aria-pressed="' + !konf.katUk + '">Alle</button>' + uks.map(function (u) { return '<button type="button" data-kf-katuk="' + esc(u) + '" aria-pressed="' + (konf.katUk === u) + '">' + esc(u) + " <small>" + liste.filter(function (P) { return (P.uk || "Weitere") === u; }).length + "</small></button>"; }).join("") + "</div>" : "";
    if (konf.katUk) liste = liste.filter(function (P) { return (P.uk || "Weitere") === konf.katUk; });
    var chips = [["meine", "Ihre Gewerke"], ["alle", "Alle Produkte"]].concat(GW.GEWERKE.map(function (g) { return [g.id, g.name]; }));
    var karte = function (P) {
      return '<button type="button" class="kat-karte' + (P.id === konf.pid ? " aktiv" : "") + '" data-kf-waehle="' + P.id + '"><span class="kat-bild">' + (plAktiv(P.id) && plAktiv(P.id).bild ? '<img src="img/produkte/' + P.id + '.png" alt="" loading="lazy">' : P.zeichnung(P.start())) + '</span><span class="kat-text"><b>' + esc(P.name) + "</b><small>" + esc(gwName(P.gw)) + '</small><span class="kat-fuss"><em>ab ' + euro.format(abPreis(P)) + (plAktiv(P.id) && !(konf.o && konf.o.kunde) ? ' <i class="kat-pl" title="Preis aus Ihrer Preisliste">Preisliste</i>' : "") + "</em>" + (P.modell ? '<span class="pill ok">3D &amp; AR</span>' : '<span class="pill">Zeichnung</span>') + "</span></span></button>";
    };
    var gruppen = KAT_REIHE.map(function (k) { var x = liste.filter(function (P) { return (P.kat || "Weitere") === k; }); if (!x.length) return "";
      var unter = x.map(function (P) { return P.uk || "Weitere"; }).filter(function (u, i, a) { return a.indexOf(u) === i; });
      return '<h4 class="kat-h">' + k + " <small>" + x.length + "</small></h4>" + unter.map(function (u) { var y = x.filter(function (P) { return (P.uk || "Weitere") === u; }); return '<h5 class="kat-uh">' + esc(u) + '</h5><div class="kat-grid">' + y.map(karte).join("") + "</div>"; }).join(""); }).join("");
    box.innerHTML = '<div class="kat"><div class="kat-kopf"><div><h3>Produkt wählen</h3><p class="src">' + alle.length + " Produkte · Maße, Farben und Ausstattung stellen Sie danach ein.</p></div>" +
        (konf.pid ? '<button class="btn btn-outline" type="button" data-kf-zurueck>Zurück zu „' + esc(GW.PRODUKTE[konf.pid].name) + "“</button>" : "") + "</div>" +
      '<input type="search" class="kat-suche" data-kf-suche placeholder="Suchen, z. B. Markise, Fenster, Küche …" value="' + esc(konf.suche || "") + '" aria-label="Produkt suchen">' +
      '<div class="filter kat-chips">' + chips.map(function (c) { return '<button type="button" data-kf-katgw="' + c[0] + '" aria-pressed="' + (konf.katGw === c[0]) + '">' + esc(c[1]) + "</button>"; }).join("") + "</div>" + ukChips +
      (gruppen || '<p class="col-empty">Kein Produkt gefunden. Versuchen Sie „Alle Produkte“.</p>') + "</div>";
  }
  function konfZeichnen(neuesModell) {
    var box = document.getElementById("kf-inhalt"); if (!box || !konf) return;
    if (konf.katalog) return konfKatalog();
    var P = GW.PRODUKTE[konf.pid], c = konf.cfg, o = konf.o, preis = P.preis(c), s = rechne(preis);
    if (!P.modell) konf.ansicht = "zeichnung";
    var opt = function (f) { return gwFeld(f, c[f.k], "data-kf"); };
    var mv = box.querySelector("model-viewer");
    var buehne = '<div class="kf-buehne"><div class="filter kf-ansicht">' + (P.modell ? '<button type="button" data-kf-ansicht="3d" aria-pressed="' + (konf.ansicht === "3d") + '">3D &amp; AR</button>' : "") + '<button type="button" data-kf-ansicht="zeichnung" aria-pressed="' + (konf.ansicht === "zeichnung") + '">Zeichnung</button></div>' +
      (P.modell ? "" : '<p class="src kf-ohne3d">Für dieses Produkt gibt es in der Demo nur die Zeichnung.</p>') +
      '<div class="ar-buehne" ' + (konf.ansicht === "3d" && P.modell ? "" : "hidden") + '><model-viewer src="models/' + (P.modell || "dusche") + '.glb" alt="3D-Modell: ' + esc(P.name) + '" ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" ar-placement="' + (P.platzierung || "floor") + '" camera-controls touch-action="pan-y" shadow-intensity="1" exposure="1.05" camera-orbit="35deg 72deg auto" style="width:100%;height:100%;background:transparent">' +
        '<button slot="ar-button" class="btn btn-signal ar-knopf" type="button">' + svg(ICON.camera) + "In meinem Raum ansehen</button></model-viewer>" +
        '<p class="ar-fallback" hidden>Die 3D-Ansicht braucht eine Internetverbindung zur 3D-Bibliothek. Auf dem Handy mit Internet funktioniert sie – hier sehen Sie solange die Zeichnung.</p></div>' +
      '<div class="kf-zeichnung" ' + (konf.ansicht === "zeichnung" ? "" : "hidden") + ">" + P.zeichnung(c) + "</div></div>";
    var rechts = '<div class="kf-optionen">' +
      '<div class="kf-titel">' + (plAktiv(P.id) && plAktiv(P.id).bild ? '<img class="kf-plbild" src="img/produkte/' + P.id + '.png" alt="Produktbild">' : "") + "<h3>" + esc(P.name) + "</h3>" + (o.aufmass ? "" : '<button class="btn-mini" type="button" data-kf-katalog>Anderes Produkt</button>') + "</div>" + '<p class="kf-modellhinweis">' + esc(gwName(P.gw)) + " · " + esc(P.kat || "") + "</p>" + "<h3 hidden>" + esc(P.name) + '</h3><p class="kf-mass">' + esc(P.mass(c)) + " · Originalgröße im Raum</p>" +
      (P.masse.length ? '<h4>Maße</h4><div class="am-grid2">' + P.masse.map(opt).join("") + "</div>" : "") +
      (P.farben || []).map(function (f) { return "<h4>" + esc(f.l) + '</h4><div class="kf-farben" role="radiogroup" aria-label="' + esc(f.l) + '">' + f.o.map(function (x) { return '<button type="button" role="radio" aria-checked="' + (c[f.k] === x[0]) + '" data-kf-farbe="' + f.k + '" data-wert="' + esc(x[0]) + '" title="' + esc(x[0]) + '"><span style="background:' + x[1] + '"></span>' + esc(x[0]) + "</button>"; }).join("") + "</div>"; }).join("") +
      ((P.optionen || []).filter(function (x) { return !x.wenn || x.wenn(c); }).length ? '<h4>Ausstattung</h4><div class="am-grid2">' + P.optionen.filter(function (x) { return !x.wenn || x.wenn(c); }).map(opt).join("") + "</div>" : "") +
      '<p class="fehler-box" id="kf-fehler" hidden></p>' + (P.hinweise ? '<div class="kf-hinweise">' + P.hinweise(c) + "</div>" : "") +
      '<div class="kf-preis"><div><span>Preis netto</span><b>' + eur2.format(s.netto) + "</b><small>" + eur2.format(s.brutto) + " inkl. 19 % USt.</small>" + (o.kunde ? "" : plAktiv(P.id) ? '<small class="kf-pl">Preis laut Preisliste ' + esc(plAktiv(P.id).lieferant) + " vom " + datumDE(plAktiv(P.id).datum) + "</small>" : '<small class="kf-pl">Beispielpreis · <button class="ff-link" type="button" data-preise-link>eigene Preisliste einlesen</button></small>') + "</div>" +
        '<details><summary>' + preis.length + " Positionen</summary><ul>" + preis.map(function (x) { return "<li><span>" + esc(x.text) + "</span><b>" + eur2.format(zeilenSumme(x) || 0) + "</b></li>"; }).join("") + "</ul></details></div>" +
      '<div class="kf-knoepfe">' +
        (o.kunde ? '<button class="btn btn-signal" type="button" data-kf-wunsch>Diese Variante wünsche ich</button>' :
          (o.aufmass ? '<button class="btn btn-signal" type="button" data-kf-fertig>Fertig – zurück zum Aufmaß</button>' : '<button class="btn btn-signal" type="button" data-kf-angebot>Ins Angebot übernehmen</button>') +
          '<button class="btn btn-outline" type="button" data-kf-speichern>Für den Kunden speichern</button>') +
        (P.foto ? '<button class="btn btn-outline" type="button" data-foto-faerben>' + svg(ICON.camera) + "Im eigenen Foto ausprobieren</button>" : "") +
      "</div>" + '<p class="src">Eigene, schlichte Demo-Modelle. Im echten Cockpit lädt der Betrieb die Modelle seiner Hersteller hoch (mit deren Nutzungsrechten). Die Kamera fragt das Handy selbst an; Raumbilder werden nicht gespeichert.</p></div>';
    if (neuesModell || !box.querySelector(".kf-layout") || (P.modell && (!mv || mv.getAttribute("src") !== "models/" + P.modell + ".glb")) || (!P.modell && mv && !box.querySelector(".ar-buehne").hidden)) {
      box.innerHTML = '<div class="kf-layout">' + buehne + rechts + "</div>";
      mv = box.querySelector("model-viewer");
      if (mv) mv.addEventListener("load", function () { mvAnwenden(mv, P, konf.cfg); });
      setTimeout(function () { if (!(window.customElements && customElements.get("model-viewer"))) { var fb = box.querySelector(".ar-fallback"); if (fb) fb.hidden = false; if (konf && konf.ansicht === "3d") { konf.ansicht = "zeichnung"; konfZeichnen(false); } } }, 5000);
    } else {
      box.querySelector(".kf-optionen").outerHTML = rechts;
      var z = box.querySelector(".kf-zeichnung"); if (z) z.innerHTML = P.zeichnung(c);
      box.querySelector(".ar-buehne").hidden = konf.ansicht !== "3d" || !P.modell; box.querySelector(".kf-zeichnung").hidden = konf.ansicht !== "zeichnung";
      box.querySelectorAll("[data-kf-ansicht]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-kf-ansicht") === konf.ansicht)); });
    }
    if (P.modell) mvAnwenden(mv, P, c);
  }
  function konfBild(P, c, mv) {   // Bild für Kundenakte und Portal: Foto der 3D-Ansicht, sonst die Zeichnung
    var foto = null;
    try { if (mv && mv.toDataURL && mv.loaded) foto = mv.toDataURL("image/jpeg", 0.8); } catch (e) { foto = null; }
    return { foto: foto, svg: P.zeichnung(c) };
  }
  function konfSpeichern(kundeName) {
    var P = GW.PRODUKTE[konf.pid], c = JSON.parse(JSON.stringify(konf.cfg)), mv = document.querySelector(".kf-drawer model-viewer"), b = konfBild(P, c, mv), s = rechne(P.preis(c));
    state.konfigs = state.konfigs || [];
    var k = { id: "k" + Date.now(), pid: P.id, name: P.name, kunde: kundeName, cfg: c, mass: P.mass(c), netto: s.netto, svg: b.svg, foto: b.foto, datum: datumDE(heuteISO()), von: ichName(), wunsch: false };
    state.konfigs.unshift(k);
    var l = state.leads.filter(function (x) { return x.name === kundeName; })[0]; if (l) add(l, "Konfiguration gespeichert: " + P.name + " (" + P.mass(c) + ") – im Kundenportal sichtbar");
    return k;
  }
  function konfKlick(t) {
    if (!konf || !t.closest(".kf-drawer")) return false;
    var el, P = GW.PRODUKTE[konf.pid];
    if ((el = t.closest("[data-kf-ansicht]"))) { konf.ansicht = el.getAttribute("data-kf-ansicht"); konfZeichnen(false); return true; }
    if ((el = t.closest("[data-kf-produkt], [data-kf-waehle]"))) { var pid = el.getAttribute("data-kf-produkt") || el.getAttribute("data-kf-waehle"); konf.pid = pid; konf.cfg = konfZiel(pid, {}); konf.o.aufmass = false; konf.o.cfg = null; konf.katalog = false; konf.ansicht = GW.PRODUKTE[pid].modell ? "3d" : "zeichnung"; konfZeichnen(true); var dr = document.querySelector(".kf-drawer"); if (dr) dr.scrollTop = 0; return true; }
    if (t.closest("[data-kf-katalog]")) { konf.katalog = true; konfZeichnen(true); var dr2 = document.querySelector(".kf-drawer"); if (dr2) dr2.scrollTop = 0; return true; }
    if (t.closest("[data-kf-zurueck]")) { konf.katalog = false; konfZeichnen(true); return true; }
    if ((el = t.closest("[data-kf-katgw]"))) { konf.katGw = el.getAttribute("data-kf-katgw"); konf.katUk = null; konfKatalog(); return true; }
    if ((el = t.closest("[data-kf-katuk]"))) { konf.katUk = el.getAttribute("data-kf-katuk") || null; konfKatalog(); return true; }
    if ((el = t.closest("[data-kf-farbe]"))) { konf.cfg[el.getAttribute("data-kf-farbe")] = el.getAttribute("data-wert"); konfZeichnen(false); return true; }
    if (t.closest("[data-kf-fertig]")) { closeDrawer(); konf = null; if (state.view === "aufmass") viewAufmass(); toast("Konfiguration übernommen – Zeichnung und Positionen sind aktualisiert."); return true; }
    if (t.closest("[data-kf-speichern]")) {
      var kunden = state.leads.map(function (l) { return l.name; }), vor = konf.o.aufmass ? am.kunde : (state.konfKunde || am.kunde);
      formDrawerIn(t.closest(".kf-knoepfe"), '<label>Für welchen Kunden?<select name="kunde">' + kunden.map(function (k) { return "<option" + (k === vor ? " selected" : "") + ' value="' + esc(k) + '">' + esc(nameT(k)) + "</option>"; }).join("") + '</select></label><div class="btn-row"><button class="btn btn-signal" type="submit">Speichern</button></div>', function (fd) {
        state.konfKunde = fd.kunde; var k = konfSpeichern(fd.kunde); toast("Gespeichert – " + nameT(fd.kunde) + " sieht „" + k.name + "“ jetzt in der Kundenakte und im Kundenportal.");
      });
      return true;
    }
    if (t.closest("[data-kf-angebot]")) {
      var zielA = konf.o.angebot && state.angebote.filter(function (x) { return x.id === konf.o.angebot; })[0];
      var l = zielA ? leadVon(zielA.leadId) : state.leads.filter(function (x) { return x.name === (state.konfKunde || am.kunde); })[0];
      if (!l) { toast("Bitte zuerst über „Für den Kunden speichern“ einen Kunden wählen."); return true; }
      if (!darf("angebot")) { toast("Angebote erstellen ist in dieser Rolle nicht erlaubt (Rollen-Simulation)."); return true; }
      var a = angebotNeu(l); if (a.status !== "entwurf") { toast("Angebot " + a.nr + " ist schon " + A_ST[a.status][0] + " – bitte dort eine neue Version anlegen."); return true; }
      a.positionen = a.positionen.concat(P.preis(konf.cfg).map(function (x) { x.aufmass = true; x.gw = P.gw; return x; }));
      verlaufK(a, "Konfiguration " + P.name + " übernommen"); add(l, P.name + " aus dem Konfigurator ins Angebot " + a.nr + " übernommen");
      closeDrawer(); konf = null; state.angebotSel = a.id; state.view = "angebote"; render(); toast("Übernommen – stehen jetzt im Angebot " + a.nr + "."); return true;
    }
    if (t.closest("[data-kf-wunsch]")) {
      var kk = konfSpeichern(konf.o.kunde); kk.wunsch = true;
      var l2 = state.leads.filter(function (x) { return x.name === konf.o.kunde; })[0]; if (l2) add(l2, "Kunde hat im Portal eine Variante gewählt: " + P.name + ", " + P.mass(konf.cfg));
      closeDrawer(); konf = null; toast("Danke! Ihr Wunsch ist beim Betrieb angekommen (Demo)."); render(); return true;
    }
    return false;
  }
  function formDrawerIn(ziel, html, onSubmit) {   // kleines Formular direkt unter den Knöpfen
    var alt = ziel.parentNode.querySelector(".kf-mini"); if (alt) alt.remove();
    var f = document.createElement("form"); f.className = "kf-mini"; f.innerHTML = html;
    f.addEventListener("submit", function (e) { e.preventDefault(); var fd = {}; new FormData(f).forEach(function (v, k) { fd[k] = v; }); f.remove(); onSubmit(fd); });
    ziel.insertAdjacentElement("afterend", f); var s = f.querySelector("select, input"); if (s) s.focus();
  }
  function konfEingabe(t) {
    if (!konf || !t.closest || !t.closest(".kf-drawer")) return;
    var k = t.getAttribute("data-kf"); if (!k) return;
    var P = GW.PRODUKTE[konf.pid], f = P.masse.concat(P.optionen || []).filter(function (x) { return x.k === k; })[0]; if (!f) return;
    var fehler = gwPruefe(f, t.value), fb = document.getElementById("kf-fehler");
    t.setAttribute("aria-invalid", fehler ? "true" : "false"); if (fb) { fb.hidden = !fehler; fb.textContent = fehler; }
    if (fehler) return;
    konf.cfg[k] = f.t === "n" ? parseFloat(String(t.value).replace(",", ".")) : t.value;
    if (t.matches("select")) konfZeichnen(false);
    else { var P2 = P, c = konf.cfg, s = rechne(P2.preis(c)), pr = document.querySelector(".kf-preis b"); if (pr) pr.textContent = eur2.format(s.netto); var z = document.querySelector(".kf-zeichnung"); if (z) z.innerHTML = P2.zeichnung(c); var m = document.querySelector(".kf-mass"); if (m) m.textContent = P2.mass(c) + " · Originalgröße im Raum"; mvAnwenden(document.querySelector(".kf-drawer model-viewer"), P2, c); }
  }
  document.addEventListener("input", function (e) {
    if (e.target.matches && e.target.matches(".kf-drawer input[data-kf]")) konfEingabe(e.target);
    if (e.target.matches && e.target.matches("[data-kf-suche]") && konf) { konf.suche = e.target.value; var pos = e.target.selectionStart; if (konf.suche && konf.katGw !== "alle") konf.katGw = "alle"; konfKatalog(); var i = document.querySelector("[data-kf-suche]"); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) { /* egal */ } } }
  });
  document.addEventListener("change", function (e) { if (e.target.matches && e.target.matches(".kf-drawer [data-kf]")) { konfEingabe(e.target); if (e.target.matches("input")) konfZeichnen(false); } });
  /* =====================================================================
     WANDSTRUKTUREN und WAND IM FOTO FÄRBEN (Maler)
     Strukturen werden im Browser erzeugt (Graustufen, 1 m je Kachel).
     Das Foto bleibt auf dem Gerät; gespeichert wird nur auf Wunsch.
     ===================================================================== */
  var TEX = {};
  function zufall(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function wandTextur(technik) {   // Canvas 256 × 256 in Graustufen; Farbe kommt per Multiplikation dazu
    if (TEX[technik]) return TEX[technik];
    var c = document.createElement("canvas"); c.width = c.height = 256; var g = c.getContext("2d"), r = zufall(technik.length * 7919 + 13), i, x, y;
    g.fillStyle = "#fff"; g.fillRect(0, 0, 256, 256);
    var flecken = function (n, rmin, rmax, amin, amax, hell) { for (i = 0; i < n; i++) { x = r() * 256; y = r() * 256; var rr = rmin + r() * (rmax - rmin), gr = g.createRadialGradient(x, y, 0, x, y, rr), a = amin + r() * (amax - amin); gr.addColorStop(0, "rgba(" + (hell ? "255,255,255," : "0,0,0,") + a + ")"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); } };
    var punkte = function (n, gr, a) { for (i = 0; i < n; i++) { g.fillStyle = "rgba(0,0,0," + (a * r()) + ")"; g.fillRect(r() * 256, r() * 256, gr, gr); } };
    if (technik === "Kalkputz") { flecken(70, 20, 70, 0.04, 0.12); flecken(40, 15, 50, 0.1, 0.25, true); }
    else if (technik === "Betonoptik") { g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, 256, 256); flecken(60, 10, 60, 0.05, 0.14); flecken(30, 10, 40, 0.08, 0.2, true); for (i = 0; i < 40; i++) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(r() * 256, r() * 256, 0.6 + r() * 1.6, 0, 7); g.fill(); } g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, 127, 256, 1.5); g.fillRect(127, 0, 1.5, 256); }
    else if (technik === "Raufaser") { punkte(2600, 2, 0.16); punkte(900, 1, 0.25); }
    else if (technik === "Mineralputz (Kratzputz)") { punkte(5000, 2, 0.18); punkte(1500, 3, 0.12); }
    else if (technik === "Vliestapete") { for (x = 0; x < 256; x += 4) { g.fillStyle = "rgba(0,0,0," + (0.03 + r() * 0.05) + ")"; g.fillRect(x, 0, 2, 256); } flecken(20, 30, 80, 0.02, 0.05); }
    TEX[technik] = { canvas: c, url: c.toDataURL("image/png") };
    return TEX[technik];
  }
  function mvTextur(mv, P, c) {   // Struktur auf die Musterwand legen (model-viewer: createTexture / setTexture)
    if (!P.textur || !mv || !mv.model) return;
    var m = mv.model.materials.filter(function (x) { return x.name === "Farbe"; })[0], key = P.textur(c);
    if (!m || !m.pbrMetallicRoughness.baseColorTexture) return;
    if (!key) { if (mv._tex) { m.pbrMetallicRoughness.baseColorTexture.setTexture(null); mv._tex = null; } return; }
    if (mv._tex === key || !mv.createTexture) return;
    mv._tex = key;
    mv.createTexture(wandTextur(key).url).then(function (t) { if (mv._tex === key) m.pbrMetallicRoughness.baseColorTexture.setTexture(t); }).catch(function () { /* ohne Struktur weiter */ });
  }

  /* ---------- Wand im Foto färben ---------- */
  var ff = null;   // { orig, bild (Canvas), maske[], verlauf[], farbe, technik, kunde }
  var WANDFARBEN = function () { return GW.PRODUKTE.wandgestaltung.farben[0].o; };
  function beispielFoto() {   // gezeichnetes Wohnzimmer mit Licht und Schatten
    var W = 800, H = 560, c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d");
    var lin = function (x0, y0, x1, y1, a, b) { var gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    g.fillStyle = lin(0, 0, 0, 380, "#e9e6df", "#d9d4ca"); g.fillRect(170, 0, 630, 400);                       // Rückwand
    var rg = g.createRadialGradient(620, 150, 20, 620, 150, 420); rg.addColorStop(0, "rgba(255,250,235,.55)"); rg.addColorStop(1, "rgba(255,250,235,0)"); g.fillStyle = rg; g.fillRect(170, 0, 630, 400);
    g.fillStyle = lin(0, 0, 170, 0, "#b9b4aa", "#cbc6bc"); g.beginPath(); g.moveTo(0, 0); g.lineTo(170, 0); g.lineTo(170, 400); g.lineTo(0, 480); g.closePath(); g.fill();   // Seitenwand
    g.fillStyle = "#f4f2ee"; g.fillRect(170, 392, 630, 10); g.beginPath(); g.moveTo(0, 470); g.lineTo(170, 392); g.lineTo(170, 400); g.lineTo(0, 480); g.closePath(); g.fill();   // Sockelleisten
    g.fillStyle = lin(0, 400, 0, 560, "#b38a5e", "#8f6a45"); g.beginPath(); g.moveTo(0, 480); g.lineTo(170, 402); g.lineTo(800, 402); g.lineTo(800, 560); g.lineTo(0, 560); g.closePath(); g.fill();   // Boden
    g.strokeStyle = "rgba(80,50,25,.25)"; for (var i = 0; i < 9; i++) { g.beginPath(); g.moveTo(170 + i * 80, 402); g.lineTo(-200 + i * 140, 560); g.stroke(); }
    g.fillStyle = "#f7f7f5"; g.fillRect(520, 70, 200, 230); g.fillStyle = lin(530, 80, 710, 290, "#cfe5f2", "#9cc4dc"); g.fillRect(532, 82, 82, 206); g.fillRect(626, 82, 82, 206);   // Fenster
    g.fillStyle = "#3d3a36"; g.fillRect(250, 120, 150, 100); g.fillStyle = lin(255, 125, 395, 215, "#c97f5b", "#5f7d8c"); g.fillRect(258, 128, 134, 84);   // Bild
    g.fillStyle = "#5b5f63"; g.fillRect(220, 300, 330, 110); g.fillStyle = "#6a6e72"; g.fillRect(205, 270, 360, 60); g.fillRect(200, 300, 40, 110); g.fillRect(530, 300, 40, 110);   // Sofa
    g.fillStyle = "#c9a76f"; g.fillRect(270, 285, 70, 40); g.fillStyle = "#8aa38e"; g.fillRect(430, 285, 70, 40);   // Kissen
    g.fillStyle = "#7b5a3c"; g.fillRect(650, 360, 70, 60); g.fillStyle = "#4f7a43"; for (i = 0; i < 9; i++) { g.beginPath(); g.ellipse(685 + Math.cos(i) * 22, 330 - i * 9, 16, 8, i, 0, 7); g.fill(); }   // Pflanze
    g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.ellipse(385, 412, 210, 14, 0, 0, 7); g.fill();
    return c;
  }
  function ffBildLaden(quelle) {   // Bild auf Arbeitsgröße (max. 900 px breit) bringen
    var W = Math.min(900, quelle.width || quelle.naturalWidth), H = Math.round((quelle.height || quelle.naturalHeight) * W / (quelle.width || quelle.naturalWidth));
    var o = document.createElement("canvas"); o.width = W; o.height = H; o.getContext("2d").drawImage(quelle, 0, 0, W, H);
    ff.orig = o.getContext("2d").getImageData(0, 0, W, H); ff.W = W; ff.H = H; ff.wande = []; ff.verlauf = []; ff.ecken = []; ff.letzt = null; ffVorbereiten(); ff.zeichne();
  }
  function lum(d, i) { return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; }
  function ffVorbereiten() {   // einmal je Foto: geglättete Helligkeit und Kantenstärke über einige Pixel Abstand (erkennt auch weiche Raumecken)
    var d = ff.orig.data, W = ff.W, H = ff.H, n = W * H, L = new Float32Array(n), B = new Float32Array(n), T = new Float32Array(n), K = new Float32Array(n), x, y, p, k;
    for (p = 0; p < n; p++) L[p] = lum(d, p * 4);
    var box = function (von, nach, dx) {   // Boxfilter Radius 2, waagrecht (dx = 1) oder senkrecht (dx = W)
      for (p = 0; p < n; p++) { var s = 0, c = 0; for (k = -2; k <= 2; k++) { var q = p + k * dx; if (dx === 1 ? ((p % W) + k < 0 || (p % W) + k >= W) : (q < 0 || q >= n)) continue; s += von[q]; c++; } nach[p] = s / c; } };
    box(L, T, 1); box(T, B, W); box(B, T, 1); box(T, B, W);
    var r = 3, rr = 2;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { p = y * W + x;
      if (x < r || y < r || x >= W - r || y >= H - r) { K[p] = 99; continue; }
      K[p] = Math.max(Math.abs(B[p + r] - B[p - r]), Math.abs(B[p + r * W] - B[p - r * W]), Math.abs(B[p + rr * W + rr] - B[p - rr * W - rr]), Math.abs(B[p + rr * W - rr] - B[p - rr * W + rr])); }
    ff.L = B; ff.K = K;
  }
  function ffChroma(d, i, r, g, b) { var s = d[i] + d[i + 1] + d[i + 2] + 1, s0 = r + g + b + 1; return Math.abs(d[i] / s - r / s0) + Math.abs(d[i + 1] / s - g / s0) + Math.abs(d[i + 2] / s - b / s0); }
  function ffLoecher(m, W, H, runden) {   // kleine Lücken (Struktur, Rauschen) schließen
    for (var k = 0; k < runden; k++) { var neu = [];
      for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) { var p = y * W + x; if (m[p]) continue; var z = m[p - 1] + m[p + 1] + m[p - W] + m[p + W] + m[p - W - 1] + m[p - W + 1] + m[p + W - 1] + m[p + W + 1]; if (z >= 5) neu.push(p); }
      neu.forEach(function (p) { m[p] = 1; }); }
    return m;
  }
  function ffFlaeche(x0, y0, stufe) {   // Wand ab dem angetippten Punkt: ähnliche Farbe und an Kanten (Ecken, Decke, Möbel) stoppen
    var d = ff.orig.data, W = ff.W, H = ff.H, L = ff.L, K = ff.K, m = new Uint8Array(W * H), s = stufe == null ? 5 : stufe;
    var kante = 1.4 + s * 0.55, tolC = 0.018 + s * 0.005, tolL = 0.08 + s * 0.03;
    var q = new Int32Array(W * H), kopf = 0, ende = 0, start = y0 * W + x0, i0 = start * 4;
    var mr = d[i0], mg = d[i0 + 1], mb = d[i0 + 2], ml = L[start], anz = 0, sr = 0, sg = 0, sb = 0, sl = 0;
    q[ende++] = start; m[start] = 1;
    while (kopf < ende) {
      var p = q[kopf++], i = p * 4; anz++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; sl += L[p];
      if ((anz & 1023) === 0) { mr = sr / anz; mg = sg / anz; mb = sb / anz; ml = sl / anz; }   // Vergleich mit dem Mittel der bisherigen Fläche, nicht nur mit dem Startpunkt
      var x = p % W;
      for (var v = 0; v < 4; v++) {
        var n = v === 0 ? (x < W - 1 ? p + 1 : -1) : v === 1 ? (x > 0 ? p - 1 : -1) : v === 2 ? p + W : p - W;
        if (n < 0 || n >= W * H || m[n]) continue;
        if (K[n] > kante) continue;
        var j = n * 4; if (ffChroma(d, j, mr, mg, mb) > tolC || Math.abs(L[n] - ml) > ml * tolL + 6) continue;
        m[n] = 1; q[ende++] = n;
      }
    }
    ffLoecher(m, W, H, 3); anz = 0; for (var t = 0; t < m.length; t++) anz += m[t];
    return { maske: m, anz: anz, mittelL: sl / Math.max(1, kopf) };
  }
  function ffPolygon(pkte, aussparen) {   // Fläche aus gesetzten Ecken; auf Wunsch Möbel, Bilder und Fenster darin aussparen
    var c = document.createElement("canvas"); c.width = ff.W; c.height = ff.H; var g = c.getContext("2d");
    g.fillStyle = "#000"; g.beginPath(); pkte.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fill();
    var a = g.getImageData(0, 0, ff.W, ff.H).data, d = ff.orig.data, m = new Uint8Array(ff.W * ff.H), p, anz = 0, sl = 0, rs = [], gs = [], bs = [], ls = [];
    for (p = 0; p < m.length; p++) if (a[p * 4 + 3] > 127) { m[p] = 1; if ((p & 7) === 0) { rs.push(d[p * 4]); gs.push(d[p * 4 + 1]); bs.push(d[p * 4 + 2]); ls.push(ff.L[p]); } }
    if (aussparen && ls.length > 50) {
      var med = function (x) { x.sort(function (u, v) { return u - v; }); return x[x.length >> 1]; }, mr = med(rs), mg = med(gs), mb = med(bs), ml = med(ls);
      for (p = 0; p < m.length; p++) if (m[p] && (ffChroma(d, p * 4, mr, mg, mb) > 0.09 || ff.L[p] < ml * 0.5 || ff.L[p] > ml * 1.75)) m[p] = 0;
      ffLoecher(m, ff.W, ff.H, 2);
    }
    for (p = 0; p < m.length; p++) if (m[p]) { anz++; sl += ff.L[p]; }
    return { maske: m, anz: anz, mittelL: anz ? sl / anz : 180 };
  }
  function ffPinsel(x, y, plus) {   // Auswahl der aktiven Wand mit Pinsel ergänzen oder mit Radierer verkleinern
    var w = ff.wande[ff.wande.length - 1]; if (!w) return;
    var r = ff.pinsel, W = ff.W, H = ff.H;
    for (var yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++) for (var xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) if ((xx - x) * (xx - x) + (yy - y) * (yy - y) <= r * r) w.maske[yy * W + xx] = plus ? 1 : 0;
  }
  function ffRechnen() {   // alle getönten Wände auf das Originalbild legen
    var out = new ImageData(new Uint8ClampedArray(ff.orig.data), ff.W, ff.H), d = out.data, o = ff.orig.data;
    ff.wande.forEach(function (w) {
      var t = hexRgb(w.hex), tex = w.technik && w.technik !== "Dispersion glatt" ? wandTextur(w.technik).canvas.getContext("2d").getImageData(0, 0, 256, 256).data : null, kachel = Math.max(80, ff.W / 4);
      for (var p = 0; p < w.maske.length; p++) {
        if (!w.maske[p]) continue;
        var i = p * 4, f = Math.min(1.45, lum(o, i) / w.mittelL), st = 1;
        if (tex) { var x = p % ff.W, y = (p - x) / ff.W, tx = Math.floor((x % kachel) / kachel * 256), ty = Math.floor((y % kachel) / kachel * 256); st = tex[(ty * 256 + tx) * 4] / 255; }
        d[i] = 255 * t[0] * f * st; d[i + 1] = 255 * t[1] * f * st; d[i + 2] = 255 * t[2] * f * st;
      }
    });
    return out;
  }
  var FF_MODI = [["tippen", "Antippen", "Automatisch: Tippen Sie mitten auf die Wand. Ist zu viel oder zu wenig gefärbt, den Regler „Wie weit färben“ verschieben – die letzte Wand passt sich sofort an."],
    ["ecken", "Ecken setzen", "Genau: Tippen Sie nacheinander auf die Ecken der Wand (z. B. oben links, oben rechts, unten rechts, unten links) und dann auf „Fläche schließen“ – oder noch einmal auf den ersten Punkt."],
    ["pinsel", "Pinsel +", "Nachbessern: Mit dem Finger über Stellen fahren, die noch zur letzten Wand gehören."],
    ["radierer", "Radierer −", "Nachbessern: Über Stellen fahren, die nicht gefärbt werden sollen (Decke, Türrahmen, Möbel)."]];
  function ffHex() { return ff.eigenHex && /^Eigener/.test(ff.farbe) ? ff.eigenHex : (WANDFARBEN().filter(function (w) { return w[0] === ff.farbe; })[0] || ["", "#cccccc"])[1]; }
  function ffNeueWand(fl, quelle) {
    if (fl.anz < ff.W * ff.H * 0.003) { toast(quelle === "ecken" ? "Die Fläche ist zu klein – bitte die Ecken weiter außen setzen." : "Hier ist keine größere Fläche – mitten auf die Wand tippen oder „Ecken setzen“ nutzen."); return false; }
    ff.wande.push({ maske: fl.maske, mittelL: fl.mittelL, hex: ffHex(), farbe: ff.farbe, technik: ff.technik });
    ff.verlauf.push({ typ: "neu" });
    var anteil = fl.anz / (ff.W * ff.H);
    if (quelle === "tippen" && anteil > 0.45) toast("Die Fläche ist sehr groß. Regler „Wie weit färben“ nach links schieben oder „Ecken setzen“ nehmen.");
    return true;
  }
  function ffAuswahlZeichnen() {   // Umriss der letzten Wand und gesetzte Ecken anzeigen
    var a = document.getElementById("ff-auswahl"); if (!a || !ff.orig) return;
    a.width = ff.W; a.height = ff.H; var g = a.getContext("2d"), W = ff.W, H = ff.H, w = ff.wande[ff.wande.length - 1];
    if (w && ff.modus !== "ecken") {
      var img = g.createImageData(W, H), d = img.data, m = w.maske;
      for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) { var p = y * W + x; if (!m[p]) continue;
        if (!m[p - 1] || !m[p + 1] || !m[p - W] || !m[p + W]) { var hell = ((x + y) >> 3) & 1, i = p * 4; d[i] = hell ? 255 : 30; d[i + 1] = hell ? 255 : 110; d[i + 2] = hell ? 255 : 220; d[i + 3] = 255; } }
      g.putImageData(img, 0, 0);
    }
    if (ff.modus === "ecken" && ff.ecken.length) {
      var s = Math.max(1, W / 450);
      g.lineWidth = 2.5 * s; g.strokeStyle = "#1e6edc"; g.fillStyle = "rgba(30,110,220,.18)"; g.setLineDash([8 * s, 5 * s]);
      g.beginPath(); ff.ecken.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); if (ff.ecken.length > 2) { g.closePath(); g.fill(); } g.stroke(); g.setLineDash([]);
      ff.ecken.forEach(function (p, i) { g.beginPath(); g.arc(p[0], p[1], (i ? 6 : 9) * s, 0, 7); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 3 * s; g.strokeStyle = "#1e6edc"; g.stroke(); });
    }
  }
  function ffModusZeigen() {
    var d = document.querySelector(".ff-drawer"); if (!d) return;
    d.querySelectorAll("[data-ff-modus]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-ff-modus") === ff.modus)); });
    var m = FF_MODI.filter(function (x) { return x[0] === ff.modus; })[0]; d.querySelector("#ff-hilfe").textContent = m[2];
    d.querySelector("#ff-reg-tippen").hidden = ff.modus !== "tippen"; d.querySelector("#ff-reg-ecken").hidden = ff.modus !== "ecken"; d.querySelector("#ff-reg-pinsel").hidden = ff.modus !== "pinsel" && ff.modus !== "radierer";
    d.querySelector("#ff-bild").setAttribute("data-modus", ff.modus);
    ffAuswahlZeichnen();
  }
  function fotoFaerben(o) {
    o = o || {}; closeDrawer(); lastFocus = document.activeElement;
    ff = { wande: [], verlauf: [], ecken: [], farbe: o.farbe || "Salbei", technik: o.technik || "Dispersion glatt", kunde: o.kunde || null, teilung: 0, modus: "tippen", stufe: 5, pinsel: 14, aussparen: true };
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer kf-drawer ff-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title"); d.setAttribute("data-nt", "");
    d.innerHTML = kopfX("Wand im Foto färben") +
      '<div class="kf-layout"><div class="ff-buehne"><div class="ff-bild" id="ff-bild" data-modus="tippen"><canvas id="ff-vorher"></canvas><canvas id="ff-nachher"></canvas><canvas id="ff-auswahl"></canvas><span class="ff-griff" id="ff-griff"></span><span class="ff-label l">Vorher</span><span class="ff-label r">Nachher</span></div>' +
        '<label class="ff-schieber">Vorher / Nachher vergleichen<input type="range" min="0" max="100" value="0" id="ff-teilung"></label>' +
        '<p class="src">Licht und Schatten bleiben erhalten. Der blau-weiße Rahmen zeigt, welche Fläche zuletzt gefärbt wurde.</p></div>' +
      '<div class="kf-optionen"><ol class="ff-schritte"><li><b>Foto wählen</b><div class="btn-row"><label class="btn btn-outline ff-datei">' + svg(ICON.camera) + 'Foto aufnehmen oder wählen<input type="file" accept="image/*" capture="environment" id="ff-datei" hidden></label><button class="btn-mini" type="button" data-ff-beispiel>Beispielfoto</button></div></li>' +
        '<li><b>Farbton wählen</b><div class="kf-farben" role="radiogroup" aria-label="Farbton">' + WANDFARBEN().map(function (x) { return '<button type="button" role="radio" aria-checked="' + (x[0] === ff.farbe) + '" data-ff-farbe="' + esc(x[0]) + '"><span style="background:' + x[1] + '"></span>' + esc(x[0]) + "</button>"; }).join("") +
          '<label class="ff-eigen" title="Eigener Farbton"><input type="color" id="ff-eigen" value="#b5c1a8"> eigener Farbton</label></div>' +
          '<label class="ff-technik">Technik<select id="ff-technik">' + ["Dispersion glatt", "Kalkputz", "Betonoptik", "Raufaser", "Mineralputz (Kratzputz)", "Vliestapete"].map(function (t) { return "<option" + (t === ff.technik ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select></label>" +
          '<p class="src ff-klein">Farbe oder Technik geändert? Gilt für die nächste Wand – oder <button class="ff-link" type="button" data-ff-umfaerben>auf die letzte Wand anwenden</button>.</p></li>' +
        '<li><b>Wand auswählen</b><div class="filter ff-modi" role="group" aria-label="Werkzeug">' + FF_MODI.map(function (m) { return '<button type="button" data-ff-modus="' + m[0] + '" aria-pressed="' + (m[0] === ff.modus) + '">' + m[1] + "</button>"; }).join("") + "</div>" +
          '<p class="ff-hilfe" id="ff-hilfe"></p>' +
          '<label class="ff-schieber" id="ff-reg-tippen">Wie weit färben <span class="ff-skala"><small>nur ähnliche Stellen</small><small>großzügig</small></span><input type="range" min="1" max="10" value="5" id="ff-stufe"></label>' +
          '<div id="ff-reg-ecken" hidden><label class="ff-check"><input type="checkbox" id="ff-aussparen" checked> Möbel, Bilder und Fenster in der Fläche aussparen</label><div class="btn-row"><button class="btn btn-signal btn-klein" type="button" data-ff-schliessen>Fläche schließen</button><button class="btn-mini" type="button" data-ff-ecke-weg>Letzten Punkt löschen</button></div></div>' +
          '<label class="ff-schieber" id="ff-reg-pinsel" hidden>Pinselgröße<input type="range" min="4" max="50" value="14" id="ff-pinsel"></label>' +
          '<p class="src" id="ff-status">Noch keine Wand gefärbt.</p><div class="btn-row"><button class="btn-mini" type="button" data-ff-zurueck>Rückgängig</button><button class="btn-mini" type="button" data-ff-leer>Alles zurücksetzen</button></div></li></ol>' +
        '<div class="kf-knoepfe">' + (ff.kunde ? '<button class="btn btn-signal" type="button" data-ff-speichern>An den Maler schicken</button>' : '<button class="btn btn-signal" type="button" data-ff-speichern>Für den Kunden speichern</button><button class="btn btn-outline" type="button" data-ff-konf>Preis im Konfigurator</button>') + "</div>" +
        '<p class="src">Das Foto bleibt auf diesem Gerät. Gespeichert wird nur, wenn Sie auf „' + (ff.kunde ? "An den Maler schicken" : "Speichern") + '“ tippen – in der Demo nur in diesem Browser. Farben am Bildschirm weichen vom echten Anstrich ab; vor dem Streichen eine Probefläche anlegen.</p></div></div>';
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    ff.zeichne = function () {
      var v = document.getElementById("ff-vorher"), n = document.getElementById("ff-nachher"); if (!v || !ff.orig) return;
      [v, n].forEach(function (c) { c.width = ff.W; c.height = ff.H; });
      v.getContext("2d").putImageData(ff.orig, 0, 0); n.getContext("2d").putImageData(ffRechnen(), 0, 0);
      ffTeilung(); ffAuswahlZeichnen();
      var st = document.getElementById("ff-status"), l = ff.wande[ff.wande.length - 1];
      if (st) st.textContent = ff.modus === "ecken" && ff.ecken.length ? ff.ecken.length + (ff.ecken.length === 1 ? " Ecke" : " Ecken") + " gesetzt" + (ff.ecken.length > 2 ? " – „Fläche schließen“ tippen." : " – weiter tippen.") :
        l ? ff.wande.length + (ff.wande.length === 1 ? " Fläche" : " Flächen") + " gefärbt · zuletzt " + l.farbe + ", " + l.technik : "Noch keine Wand gefärbt.";
    };
    ffBildLaden(beispielFoto()); ffModusZeigen();
    d.querySelector("#ff-datei").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      if (!/^image\//.test(f.type)) { toast("Bitte ein Foto wählen."); return; }
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () { ffBildLaden(img); URL.revokeObjectURL(url); toast("Foto geladen – jetzt auf die Wand tippen."); };
      img.onerror = function () { toast("Das Foto konnte nicht geöffnet werden."); };
      img.src = url;
    });
    d.querySelector("#ff-teilung").addEventListener("input", function (e) { ff.teilung = +e.target.value; ffTeilung(); });
    d.querySelector("#ff-technik").addEventListener("change", function (e) { ff.technik = e.target.value; });
    d.querySelector("#ff-eigen").addEventListener("input", function (e) { ff.farbe = "Eigener Farbton " + e.target.value.toUpperCase(); ff.eigenHex = e.target.value; d.querySelectorAll("[data-ff-farbe]").forEach(function (b) { b.setAttribute("aria-checked", "false"); }); });
    d.querySelector("#ff-stufe").addEventListener("input", function (e) {   // letzte angetippte Wand sofort neu berechnen
      ff.stufe = +e.target.value; var l = ff.letzt; if (!l || ff.wande[ff.wande.length - 1] !== l.wand) return;
      var fl = ffFlaeche(l.x, l.y, ff.stufe); l.wand.maske = fl.maske; l.wand.mittelL = fl.mittelL; ff.zeichne();
    });
    d.querySelector("#ff-pinsel").addEventListener("input", function (e) { ff.pinsel = +e.target.value; });
    d.querySelector("#ff-aussparen").addEventListener("change", function (e) { ff.aussparen = e.target.checked; });
    var bild = d.querySelector("#ff-bild"), malt = false, warte = 0;
    var punkt = function (e) { var r = bild.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * ff.W), Math.floor((e.clientY - r.top) / r.height * ff.H)]; };
    bild.addEventListener("pointerdown", function (e) {
      if (!ff.orig) return; var p = punkt(e); if (p[0] < 0 || p[1] < 0 || p[0] >= ff.W || p[1] >= ff.H) return;
      if (ff.modus === "pinsel" || ff.modus === "radierer") {
        var w = ff.wande[ff.wande.length - 1]; if (!w) { toast("Zuerst eine Wand antippen oder Ecken setzen – dann nachbessern."); return; }
        e.preventDefault(); malt = true; try { bild.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
        ff.verlauf.push({ typ: "maske", wand: w, alt: new Uint8Array(w.maske) }); ff.letzt = null;
        ffPinsel(p[0], p[1], ff.modus === "pinsel"); ff.zeichne();
      }
    });
    bild.addEventListener("pointermove", function (e) {
      if (!malt) return; var p = punkt(e); ffPinsel(p[0], p[1], ff.modus === "pinsel");
      if (!warte) warte = requestAnimationFrame(function () { warte = 0; if (ff) ff.zeichne(); });
    });
    var stopp = function () { if (malt) { malt = false; ff.zeichne(); } };
    bild.addEventListener("pointerup", stopp); bild.addEventListener("pointercancel", stopp);
    bild.addEventListener("click", function (e) {
      if (!ff.orig || ff.modus === "pinsel" || ff.modus === "radierer") return;
      var p = punkt(e), x = p[0], y = p[1];
      if (x < 0 || y < 0 || x >= ff.W || y >= ff.H) return;
      if (ff.modus === "ecken") {
        var e0 = ff.ecken[0], nah = Math.max(14, ff.W / 40);
        if (e0 && ff.ecken.length > 2 && Math.abs(e0[0] - x) < nah && Math.abs(e0[1] - y) < nah) { ffEckenSchliessen(); return; }
        ff.ecken.push([x, y]); ff.zeichne(); return;
      }
      var fl = ffFlaeche(x, y, ff.stufe);
      if (ffNeueWand(fl, "tippen")) { ff.letzt = { x: x, y: y, wand: ff.wande[ff.wande.length - 1] }; ff.zeichne(); }
    });
    var c0 = d.querySelector("[data-close]"); if (c0) c0.focus();
  }
  function ffEckenSchliessen() {
    if (ff.ecken.length < 3) { toast("Bitte mindestens 3 Ecken setzen."); return; }
    if (ffNeueWand(ffPolygon(ff.ecken, ff.aussparen), "ecken")) { ff.ecken = []; ff.letzt = null; ff.zeichne(); }
  }
  function ffTeilung() { var n = document.getElementById("ff-nachher"), g = document.getElementById("ff-griff"), r = document.getElementById("ff-teilung"); if (!n) return; n.style.clipPath = "inset(0 0 0 " + ff.teilung + "%)"; if (g) { g.style.left = ff.teilung + "%"; g.hidden = ff.teilung < 2; } var lb = document.querySelector(".ff-label.l"); if (lb) lb.hidden = ff.teilung < 2; if (r) r.value = ff.teilung; }
  function ffKlick(t) {
    if (!ff || !t.closest(".ff-drawer")) return false;
    var el;
    if (t.closest("[data-ff-beispiel]")) { ffBildLaden(beispielFoto()); return true; }
    if ((el = t.closest("[data-ff-farbe]"))) { ff.farbe = el.getAttribute("data-ff-farbe"); ff.eigenHex = null; document.querySelectorAll("[data-ff-farbe]").forEach(function (b) { b.setAttribute("aria-checked", String(b === el)); }); return true; }
    if ((el = t.closest("[data-ff-modus]"))) { ff.modus = el.getAttribute("data-ff-modus"); if (ff.modus !== "ecken") ff.ecken = []; ffModusZeigen(); ff.zeichne(); return true; }
    if (t.closest("[data-ff-schliessen]")) { ffEckenSchliessen(); return true; }
    if (t.closest("[data-ff-ecke-weg]")) { ff.ecken.pop(); ff.zeichne(); return true; }
    if (t.closest("[data-ff-umfaerben]")) { var lw = ff.wande[ff.wande.length - 1]; if (!lw) { toast("Noch keine Wand gefärbt."); return true; } ff.verlauf.push({ typ: "farbe", wand: lw, alt: { hex: lw.hex, farbe: lw.farbe, technik: lw.technik } }); lw.hex = ffHex(); lw.farbe = ff.farbe; lw.technik = ff.technik; ff.zeichne(); return true; }
    if (t.closest("[data-ff-zurueck]")) {
      if (ff.modus === "ecken" && ff.ecken.length) { ff.ecken.pop(); ff.zeichne(); return true; }
      var sch = ff.verlauf.pop(); if (!sch) { toast("Nichts zum Rückgängigmachen."); return true; }
      if (sch.typ === "neu") ff.wande.pop(); else if (sch.typ === "maske") sch.wand.maske = sch.alt; else Object.assign(sch.wand, sch.alt);
      ff.letzt = null; ff.zeichne(); return true;
    }
    if (t.closest("[data-ff-leer]")) { ff.wande = []; ff.verlauf = []; ff.ecken = []; ff.letzt = null; ff.zeichne(); return true; }
    if (t.closest("[data-ff-konf]")) { var f0 = ff.wande[ff.wande.length - 1]; state.konfAktiv = state.konfAktiv || {}; var cfg = state.konfAktiv.wandgestaltung = state.konfAktiv.wandgestaltung || GW.PRODUKTE.wandgestaltung.start(); if (f0 && !/^Eigener/.test(f0.farbe)) cfg.farbe = f0.farbe; if (f0) cfg.technik = f0.technik; ff = null; konfOeffnen("wandgestaltung"); return true; }
    if (t.closest("[data-ff-speichern]")) {
      if (!ff.wande.length) { toast("Bitte zuerst eine Wand antippen."); return true; }
      var speichern = function (kunde) {
        var n = document.getElementById("ff-nachher"), k = document.createElement("canvas"), W = Math.min(640, ff.W); k.width = W; k.height = Math.round(ff.H * W / ff.W); k.getContext("2d").drawImage(n, 0, 0, k.width, k.height);
        var w = ff.wande[ff.wande.length - 1], farben = ff.wande.map(function (x) { return x.farbe; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        state.konfigs = state.konfigs || [];
        var alte = state.konfigs.filter(function (x) { return x.pid === "wandfoto"; }); if (alte.length >= 3) state.konfigs.splice(state.konfigs.indexOf(alte[alte.length - 1]), 1);   // höchstens 3 Fotos im Browser
        state.konfigs.unshift({ id: "k" + Date.now(), pid: "wandgestaltung", name: "Wand im Foto: " + farben.join(", "), kunde: kunde, cfg: Object.assign(GW.PRODUKTE.wandgestaltung.start(), /^Eigener/.test(w.farbe) ? {} : { farbe: w.farbe }, { technik: w.technik }), mass: w.technik + " · " + ff.wande.length + (ff.wande.length === 1 ? " Fläche" : " Flächen"), netto: 0, svg: "", foto: k.toDataURL("image/jpeg", 0.72), datum: datumDE(heuteISO()), von: ff.kunde ? kunde : ichName(), wunsch: !!ff.kunde, art: "wandfoto" });
        var l = state.leads.filter(function (x) { return x.name === kunde; })[0]; if (l) add(l, (ff.kunde ? "Kunde hat im Portal ein Wandfoto gefärbt: " : "Wandfoto gefärbt: ") + farben.join(", "));
        toast(ff.kunde ? "Danke! Ihr Foto ist beim Maler angekommen (Demo)." : "Gespeichert – " + nameT(kunde) + " sieht das Foto in Kundenakte und Kundenportal.");
      };
      if (ff.kunde) { speichern(ff.kunde); closeDrawer(); ff = null; render(); return true; }
      var kunden = state.leads.map(function (l) { return l.name; });
      formDrawerIn(t.closest(".kf-knoepfe"), '<label>Für welchen Kunden?<select name="kunde">' + kunden.map(function (k) { return "<option" + (k === am.kunde ? " selected" : "") + ' value="' + esc(k) + '">' + esc(nameT(k)) + "</option>"; }).join("") + '</select></label><div class="btn-row"><button class="btn btn-signal" type="submit">Speichern</button></div>', function (fd) { speichern(fd.kunde); });
      return true;
    }
    return false;
  }

  function arZeigen(id) { konfOeffnen(id); }

  /* Gespeicherte Konfigurationen eines Kunden (Kundenakte, Auftrag, Portal) */
  function konfKarten(kunde, modus) {
    var liste = (state.konfigs || []).filter(function (k) { return k.kunde === kunde; });
    if (!liste.length) return "";
    return '<div class="kf-karten">' + liste.map(function (k) {
      return '<article class="kf-karte"><div class="kf-bild">' + (k.foto ? '<img src="' + k.foto + '" alt="' + esc(k.name) + '">' : k.svg) + "</div><div class=\"kf-text\"><b>" + esc(k.name) + (k.wunsch ? ' <span class="pill ok">Kundenwunsch</span>' : "") + "</b><small>" + esc(k.mass) + "</small><small>" + (modus === "portal" || !k.netto ? "" : eur2.format(k.netto) + " netto · ") + esc(k.datum) + "</small>" +
        '<div class="btn-row"><button class="btn-mini primary" type="button" data-kf-oeffnen="' + k.id + '"' + (modus === "portal" ? ' data-kf-kunde="1"' : "") + ">" + (modus === "portal" ? "Im eigenen Raum ansehen" : "Öffnen") + "</button></div></div></article>";
    }).join("") + "</div>";
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-kf-oeffnen]"); if (!el) return;
    var k = (state.konfigs || []).filter(function (x) { return x.id === el.getAttribute("data-kf-oeffnen"); })[0]; if (!k) return;
    e.stopPropagation();
    konfOeffnen(k.pid, { cfg: k.cfg, kunde: el.hasAttribute("data-kf-kunde") ? k.kunde : null });
  }, true);


  function darf(was) {
    var r = state.rolle;
    if (was === "angebot") return r === "gf" || r === "buero" || r === "aussen";
    if (was === "rechnung") return r === "gf" || r === "buero";
    if (was === "auftrag") return r === "gf" || r === "buero";
    if (was === "loeschen") return r === "gf" || r === "buero";
    return true;
  }

  /* ---------- Klicks und Eingaben der Kette ---------- */
  function ketteKlick(t) {
    var el;
    if ((el = t.closest("[data-an-filter]"))) { state.angebotFilter = el.getAttribute("data-an-filter"); render(); return true; }
    if ((el = t.closest("[data-au-filter]"))) { state.auftragFilter = el.getAttribute("data-au-filter"); render(); return true; }
    if ((el = t.closest("[data-an-open]"))) { closeDrawer(); state.angebotSel = el.getAttribute("data-an-open"); state.view = "angebote"; render(); window.scrollTo(0, 0); return true; }
    if ((el = t.closest("[data-au-open]"))) { closeDrawer(); state.auftragSel = el.getAttribute("data-au-open"); state.view = "auftraege"; render(); window.scrollTo(0, 0); return true; }
    if (t.closest("[data-an-zurueck]")) { state.angebotSel = null; render(); return true; }
    if (t.closest("[data-au-zurueck]")) { state.auftragSel = null; render(); return true; }
    if (t.closest("[data-an-neu]")) { neuesAngebotWahl(); return true; }
    var a = state.angebotSel && state.angebote.filter(function (x) { return x.id === state.angebotSel; })[0];
    if (a) {
      var l = leadVon(a.leadId);
      if ((el = t.closest("[data-pos-del]"))) { a.positionen.splice(+el.getAttribute("data-pos-del"), 1); render(); return true; }
      if (t.closest("[data-pos-neu]")) { a.positionen.push({ text: "Neue Leistung", menge: 1, einheit: "psch", ep: 0, rabatt: 0, optional: false }); render(); var ins = $main.querySelectorAll('[data-f="text"]'); if (ins.length) ins[ins.length - 1].select(); return true; }
      if (t.closest("[data-an-vorschau]")) { angebotVorschau(a); return true; }
      if (t.closest("[data-an-varianten]")) { variantenAnlegen(a); verlaufK(a, "Varianten Gut / Besser / Premium angelegt"); toast("Drei Varianten angelegt – der Kunde wählt im Portal."); render(); return true; }
      if (t.closest("[data-an-varianten-weg]")) { delete a.varianten; verlaufK(a, "Varianten entfernt"); render(); return true; }
      if (t.closest("[data-an-loeschen]")) { if (!confirm("Entwurf " + a.nr + " löschen?")) return true; state.angebote = state.angebote.filter(function (x) { return x !== a; }); if (l) add(l, "Angebotsentwurf " + a.nr + " gelöscht"); state.angebotSel = null; toast("Entwurf gelöscht."); render(); return true; }
      if (t.closest("[data-an-senden]") && window.MailVorschau && l) {
        var s = rechne(a.positionen), o = kiNachricht(l, "nachfassen");
        MailVorschau.zeigen({ zweck: "Angebot " + a.nr + " an " + a.kunde, von: BETRIEB, vonMail: "info@musterbetrieb.de", an: l.name, anMail: l.mail, anTel: l.tel, betreff: "Ihr Angebot " + a.nr + ": " + a.titel, anhang: a.nr + ".pdf", kanal: o.kanal,
          mail: [gruss(l.name) + ",\n\nwie besprochen schicke ich Ihnen unser Angebot für „" + a.titel + "“. " + (a.varianten ? "Ich habe Ihnen drei Varianten zusammengestellt:\n" + variantenSummen(a).map(function (v) { return "– " + v[0] + ": " + eur2.format(v[1]) + " brutto"; }).join("\n") + "\n\nIm Kundenportal sehen Sie, was jeweils dazugehört, und können direkt wählen. Das Angebot gilt " + a.gueltig + " Tage." : "Es liegt bei " + eur2.format(s.brutto) + " inklusive Mehrwertsteuer und gilt " + a.gueltig + " Tage.") + "\n\nSchauen Sie es in Ruhe an. Wenn Sie etwas anders haben möchten, sagen Sie einfach Bescheid." + signatur(),
                 gruss(l.name) + ",\n\nanbei das Angebot " + a.nr + " für „" + a.titel + "“ über " + eur2.format(s.brutto) + " brutto. Ich habe alles so eingeplant, wie wir es vor Ort besprochen haben. Fragen kläre ich gern am Telefon – meistens geht das in fünf Minuten." + signatur()],
          wa: [gruss(l.name, true) + ", hier ist das Angebot für „" + a.titel + "“: " + (a.varianten ? "drei Varianten ab " + eur2.format(variantenSummen(a)[0][1]) + " brutto. Im Kundenportal sehen Sie, was jeweils dabei ist, und können direkt wählen." : eur2.format(s.brutto) + " brutto. Schauen Sie es in Ruhe an und melden Sie sich bei Fragen.") + "\nViele Grüße, " + absender()[1]],
          senden: function () {
            if (a.status !== "entwurf") return;   // Doppelklick-Schutz
            a.status = "gesendet"; verlaufK(a, "Angebot gesendet (Demo – nichts verschickt)");
            l.stage = "angebot"; l.angebotVor = 0; l.erinnert = 0; l.wert = Math.round(s.netto); add(l, "Angebot " + a.nr + " über " + euro.format(s.brutto) + " gesendet (Demo)");
            protokoll("Angebot " + a.nr + " an " + l.name + " gesendet (Demo)"); toast("Angebot gesendet (Demo – es wurde nichts verschickt)."); render();
          } });
        return true;
      }
      if ((el = t.closest("[data-an-annehmen]"))) {
        if (a.status !== "gesendet") return true;
        a.status = "angenommen"; verlaufK(a, "Kunde hat angenommen (Demo)");
        if (l) { l.stage = "auftrag"; add(l, "Angebot " + a.nr + " angenommen"); }
        var au = auftragAnlegen(l, a, false); verlaufK(au, "Auftrag angelegt"); protokoll("Angebot " + a.nr + " angenommen – Auftrag " + au.nr + " angelegt");
        toast("Angenommen – Auftrag " + au.nr + " wurde automatisch angelegt."); render(); return true;
      }
      if (t.closest("[data-an-ablehnen]")) {
        var g = prompt("Grund der Absage (z. B. zu teuer, Termin zu spät, anderer Betrieb):", "zu teuer"); if (g === null) return true;
        a.status = "abgelehnt"; a.grund = g; verlaufK(a, "Kunde hat abgelehnt: " + g); if (l) { add(l, "Angebot abgelehnt: " + g); l.stage = "neu"; l.verloren = g; }
        mod.vt.verl[l ? l.id : a.id] = /teuer/.test(g) ? "zu teuer" : /Termin/.test(g) ? "Termin zu spät" : /Betrieb/.test(g) ? "anderer Betrieb" : "keine Rückmeldung";
        toast("Als abgelehnt markiert – der Grund fließt in die Vertriebsquoten ein."); render(); return true;
      }
      if (t.closest("[data-an-version]")) {
        var neu = JSON.parse(JSON.stringify(a)); a.status = "ersetzt"; neu.id = a.id + "v" + (a.version + 1); neu.version = a.version + 1; neu.status = "entwurf"; neu.verlauf = (a.verlauf || []).slice();
        verlaufK(neu, "Version " + neu.version + " angelegt (Version " + a.version + " bleibt gespeichert)"); state.angebote.push(neu); state.angebotSel = neu.id; render(); return true;
      }
    }
    var au2 = state.auftragSel && state.auftraege.filter(function (x) { return x.id === state.auftragSel; })[0];
    if (au2) {
      if ((el = t.closest("[data-au-status]"))) { if (!darf("auftrag")) { toast("In dieser Rolle nicht erlaubt (Rollen-Simulation)."); return true; } var st = el.getAttribute("data-au-status"); if (st !== au2.status) { au2.status = st; verlaufK(au2, "Status: " + AU_ST[st][0]); var l2 = leadVon(au2.leadId); if (l2 && st === "abgeschlossen") { l2.stage = "erledigt"; l2.bewertung = l2.bewertung || "offen"; add(l2, "Arbeiten abgeschlossen"); } } render(); return true; }
      if ((el = t.closest("[data-rb-sign]"))) { var nr = el.getAttribute("data-rb-sign"); mt.berichte.forEach(function (b) { if (b.nr === nr) b.status = "unterschrieben"; }); verlaufK(au2, "Regiebericht " + nr + " vom Kunden unterschrieben (Demo)"); toast("Unterschrift erfasst (Demo)."); render(); return true; }
      if (t.closest("[data-re-vorbereiten]")) { rechnungVorbereiten(au2); entwurfAnsicht(au2); return true; }
      if (t.closest("[data-re-entwurf]")) { entwurfAnsicht(au2); return true; }
    }
    if ((el = t.closest("[data-re-open]"))) { var r = rechnungVon(el.getAttribute("data-re-open")); if (r) { closeDrawer(); rechnungDetail(r); } return true; }
    return false;
  }
  function ketteEingabe(t) {
    var a = state.angebotSel && state.angebote.filter(function (x) { return x.id === state.angebotSel; })[0];
    if (a && t.hasAttribute("data-pos")) {
      var p = a.positionen[+t.getAttribute("data-pos")], f = t.getAttribute("data-f");
      if (f === "optional") p.optional = t.checked; else p[f] = f === "text" || f === "einheit" ? t.value : t.value.replace(",", ".");
      var pos = t.selectionStart; render();
      var n = $main.querySelector('[data-pos="' + t.getAttribute("data-pos") + '"][data-f="' + f + '"]'); if (n && f !== "optional") { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} }
      return true;
    }
    if (a && t.hasAttribute("data-an-notiz")) { a.notiz = t.value; return true; }
    return false;
  }
  function neuesAngebotWahl() {
    var kandidaten = state.leads.filter(function (l) { return l.stage === "neu" && !angebotVon(l.id); });
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Neues Angebot");
    d.innerHTML = kopfX("Neues Angebot") + "<p>Für welche Anfrage?</p>" + (kandidaten.length ? '<div class="rows">' + kandidaten.map(function (l) { return '<div class="row"><div class="row-main"><strong>' + esc(l.name) + "</strong><small>" + esc(l.betreff) + " · " + esc(l.ort) + '</small></div><div class="row-side"><button class="btn-mini primary" type="button" data-an-aus="' + l.id + '">Angebot erstellen</button></div></div>'; }).join("") + "</div>" : '<p class="col-empty">Alle neuen Anfragen haben schon ein Angebot. Legen Sie zuerst eine neue Anfrage an.</p>');
    d.addEventListener("click", function (ev) {
      var el = ev.target.closest("[data-an-aus]"); if (ev.target.closest("[data-close]")) return closeDrawer();
      if (!el) return; var l = leadVon(+el.getAttribute("data-an-aus")); if (!l) return;
      var a = angebotNeu(l); closeDrawer(); state.angebotSel = a.id; state.view = "angebote"; render(); window.scrollTo(0, 0);
    });
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
  }
  document.addEventListener("input", function (e) { if (state && (state.view === "angebote") && ketteEingabe(e.target)) e.stopPropagation(); }, true);
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-au-wer")) { var au = state.auftraege.filter(function (x) { return x.id === state.auftragSel; })[0]; if (au) { au.verantwortlich = t.value; verlaufK(au, "Verantwortlich: " + t.value); render(); } }
    if (t.hasAttribute && t.getAttribute("data-f") === "optional" && state.view === "angebote") ketteEingabe(t);
    if (t.hasAttribute && t.hasAttribute("data-au-aufg")) { var au2 = state.auftraege.filter(function (x) { return x.id === state.auftragSel; })[0], ag = au2 && au2.aufgaben[+t.getAttribute("data-au-aufg")]; if (ag) { ag.erledigt = t.checked; verlaufK(au2, "Aufgabe " + (t.checked ? "erledigt" : "wieder offen") + ": " + ag.titel); render(); } }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-po-frage")) {
      e.preventDefault(); var fq = e.target.frage.value.trim(), pl = state.leads.filter(function (x) { return x.name === state.portalKunde; })[0];
      if (fq.length < 3) { toast("Bitte eine Frage eingeben."); return; }
      if (pl) { add(pl, "Rückfrage im Kundenportal: „" + fq + "“"); protokoll("Rückfrage von " + pl.name + " im Portal"); if (window.Glocke) Glocke.push("anfrage", "Rückfrage von " + pl.name, fq, "anfragen"); }
      toast("Frage gesendet – sie steht jetzt im Verlauf der Anfrage (Demo)."); viewPortal(); return;
    }
    var f = e.target, au = state.auftragSel && state.auftraege.filter(function (x) { return x.id === state.auftragSel; })[0]; if (!au) return;
    if (f.hasAttribute("data-au-termin")) {
      e.preventDefault(); if (!f.datum.value || !f.zeit.value) { toast("Bitte Datum und Uhrzeit angeben."); return; }
      var d = tagDatum(null, f.datum.value), t = { tag: tagLabel(d), datum: f.datum.value, zeit: f.zeit.value, art: f.art.value, name: au.kunde, ort: (leadVon(au.leadId) || {}).ort || "", wer: f.wer.value, info: au.titel, auftragId: au.id };
      mod.termine.push(t); verlaufK(au, "Termin " + t.tag + " " + t.zeit + " (" + t.art + ", " + t.wer + ") eingetragen"); if (au.status === "geplant" && t.art === "Ausführung") au.status = "geplant";
      toast("Termin eingetragen – steht auch im Kalender."); render();
    }
    if (f.hasAttribute("data-au-aufgabe")) {
      e.preventDefault(); var ti = f.titel.value.trim(); if (ti.length < 3) { toast("Bitte die Aufgabe kurz beschreiben."); return; }
      if (f.bis.value && f.bis.value < heuteISO()) { toast("Das Fälligkeitsdatum liegt in der Vergangenheit."); return; }
      au.aufgaben = au.aufgaben || []; au.aufgaben.push({ titel: ti, bis: f.bis.value || "", wer: f.wer.value, erledigt: false });
      verlaufK(au, "Aufgabe angelegt: " + ti + (f.bis.value ? " (bis " + datumDE(f.bis.value) + ")" : "")); toast("Aufgabe angelegt."); render(); return;
    }
    if (f.hasAttribute("data-au-regie")) {
      e.preventDefault(); var h = String(f.stunden.value).replace(",", "."), me = String(f.materialEuro.value || "0").replace(",", ".");
      if (!zahlOk(h) || +h <= 0) { toast("Bitte gültige Stunden eingeben (z. B. 2,5)."); return; }
      if (!f.taetigkeit.value.trim()) { toast("Bitte die Tätigkeit angeben."); return; }
      if (!zahlOk(me)) { toast("Materialbetrag ist ungültig."); return; }
      mt.nr = (mt.nr || 413) + 1; var nr = "RB-0" + mt.nr;
      mt.berichte.unshift({ nr: nr, baustelle: au.kunde + ", " + ((leadVon(au.leadId) || {}).ort || ""), monteur: au.verantwortlich, datum: "heute", stunden: +h, taetigkeit: f.taetigkeit.value.trim(), material: f.material.value.trim() || "–", materialEuro: +me || 0, zusatz: f.zusatz.checked, status: "wartet auf Unterschrift", auftragId: au.id });
      verlaufK(au, "Regiebericht " + nr + " angelegt (" + String(h).replace(".", ",") + " Std.)"); if (au.status === "geplant") { au.status = "arbeit"; verlaufK(au, "Status: in Arbeit"); }
      toast("Regiebericht " + nr + " angelegt."); render();
    }
  });

  /* =====================================================================
     ANFRAGEN UND KUNDEN: anlegen, bearbeiten, löschen (mit Prüfung)
     ===================================================================== */
  var GEWERKE = ["SHK / Heizung", "Sanitär / Bad", "Elektro", "Maler", "Dach", "Fenster", "Innenausbau", "Sonstiges"];
  var mailOk = function (m) { return !m || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m); };
  var norm = function (s) { return String(s || "").toLowerCase().replace(/^familie\s+/, "").replace(/[^a-z0-9äöüß@.]/g, ""); };
  function dubletten(d, ausser) {
    var treffer = [];
    state.leads.forEach(function (l) {
      if (l === ausser) return;
      var g = (d.name && norm(l.name) === norm(d.name)) ? "gleicher Name" : (d.tel && norm(l.tel) && norm(l.tel) === norm(d.tel)) ? "gleiche Telefonnummer" : (d.mail && norm(l.mail) === norm(d.mail)) ? "gleiche E-Mail" : "";
      if (g) treffer.push({ name: l.name, grund: g, art: "Anfrage" });
    });
    (state.kunden || []).forEach(function (k) {
      if (k === ausser) return;
      var g = (d.name && norm(k.name) === norm(d.name)) ? "gleicher Name" : (d.tel && k.tel && norm(k.tel) === norm(d.tel)) ? "gleiche Telefonnummer" : (d.mail && k.mail && norm(k.mail) === norm(d.mail)) ? "gleiche E-Mail" : "";
      if (g) treffer.push({ name: k.name, grund: g, art: "Kunde" });
    });
    return treffer;
  }
  function formDrawer(titel, html, onSubmit) {
    closeDrawer(); lastFocus = document.activeElement;
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title");
    d.innerHTML = kopfX(titel) + '<form class="cr-form" novalidate>' + html + '<p class="fehler-box" data-fehler hidden></p><div class="drawer-actions"><button class="btn btn-signal" type="submit">Speichern</button><button class="btn btn-outline" type="button" data-close>Abbrechen</button></div></form>';
    d.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeDrawer(); });
    var form = d.querySelector("form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fb = d.querySelector("[data-fehler]"), fehler = onSubmit(form, function (msg) { fb.innerHTML = msg; fb.hidden = false; });
      if (fehler) { fb.innerHTML = fehler; fb.hidden = false; var x = form.querySelector('[aria-invalid="true"]'); if (x) x.focus(); }
    });
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    var erst = form.querySelector("input, select, textarea"); if (erst) erst.focus();
    return d;
  }
  var feld = function (name, label, wert, opt) {
    opt = opt || {};
    var pflicht = opt.pflicht ? ' required aria-required="true"' : "";
    var inner = opt.select ? '<select name="' + name + '">' + opt.select.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (String(v) === String(wert) ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" :
      opt.area ? '<textarea name="' + name + '" rows="' + (opt.rows || 3) + '"' + pflicht + ">" + esc(wert || "") + "</textarea>" :
      opt.check ? '<input type="checkbox" name="' + name + '"' + (wert ? " checked" : "") + ">" :
      '<input name="' + name + '" type="' + (opt.typ || "text") + '"' + (opt.mode ? ' inputmode="' + opt.mode + '"' : "") + ' value="' + esc(wert == null ? "" : wert) + '"' + pflicht + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : "") + ">";
    return '<label class="cr-feld' + (opt.check ? " cr-check" : "") + (opt.breit ? " breit" : "") + '"><span>' + label + (opt.pflicht ? " *" : "") + "</span>" + inner + "</label>";
  };
  function pruefe(form, regeln) {
    var fehler = [];
    form.querySelectorAll("[aria-invalid]").forEach(function (x) { x.removeAttribute("aria-invalid"); });
    regeln.forEach(function (r) { var el = form[r[0]], v = el.value.trim(); if (!r[1](v)) { el.setAttribute("aria-invalid", "true"); fehler.push(r[2]); } });
    return fehler.length ? fehler.join("<br>") : "";
  }
  function anfrageFormular(l) {
    var neu = !l; l = l || {};
    var d = formDrawer(neu ? "Neue Anfrage" : "Anfrage bearbeiten",
      '<div class="cr-grid">' + feld("name", "Name / Firma", l.name, { pflicht: true }) + feld("ort", "Ort", l.ort, { pflicht: true }) + feld("tel", "Telefon", l.tel, { typ: "tel", mode: "tel" }) + feld("mail", "E-Mail", l.mail, { typ: "email", mode: "email" }) +
      feld("gewerk", "Gewerk", l.gewerk || GEWERKE[0], { select: GEWERKE }) + feld("kanal", "Quelle", l.kanal || "telefon", { select: Object.keys(KANAL).map(function (k) { return [k, KANAL[k].label]; }) }) +
      feld("betreff", "Anliegen (kurz)", l.betreff, { pflicht: true, breit: true, ph: "z. B. Heizung ausgefallen" }) + feld("nachricht", "Beschreibung", l.nachricht, { area: true, breit: true }) +
      feld("wert", "Geschätzter Auftragswert (€ netto)", l.wert != null ? l.wert : "", { mode: "decimal" }) + feld("verantwortlich", "Verantwortlich", l.name ? verantwortlichVon(l) : "Sabine (Büro)", { select: ["Thomas (GF)", "Sabine (Büro)", "Stefan (Außendienst)"] }) +
      feld("dringend", "Dringend", l.dringend, { check: true }) + "</div>" +
      '<div class="cr-dubletten" data-dub hidden></div>',
      function (f, zeigen) {
        var fehler = pruefe(f, [["name", function (v) { return v.length >= 2; }, "Bitte einen Namen angeben."], ["ort", function (v) { return v.length >= 2; }, "Bitte einen Ort angeben."], ["betreff", function (v) { return v.length >= 3; }, "Bitte das Anliegen kurz beschreiben."],
          ["mail", function (v) { return mailOk(v); }, "Die E-Mail-Adresse ist ungültig."], ["wert", function (v) { return v === "" || zahlOk(v.replace(/\./g, "").replace(",", ".")); }, "Der Auftragswert muss eine Zahl ab 0 sein."]]);
        if (fehler) return fehler;
        var dat = { name: f.name.value.trim(), ort: f.ort.value.trim(), tel: f.tel.value.trim(), mail: f.mail.value.trim(), gewerk: f.gewerk.value, kanal: f.kanal.value, betreff: f.betreff.value.trim(), nachricht: f.nachricht.value.trim() || f.betreff.value.trim(),
          wert: f.wert.value === "" ? 0 : Math.round(+f.wert.value.replace(/\./g, "").replace(",", ".")), verantwortlich: f.verantwortlich.value, dringend: f.dringend.checked };
        var dub = dubletten(dat, neu ? null : l), box = d.querySelector("[data-dub]");
        if (dub.length && !f.getAttribute("data-trotzdem")) {
          box.hidden = false; box.innerHTML = "<b>Möglicherweise schon vorhanden:</b><ul>" + dub.map(function (x) { return "<li>" + esc(x.art) + " „" + esc(x.name) + "“ – " + esc(x.grund) + ' <button class="btn-mini" type="button" data-akte-open="' + esc(x.name) + '">ansehen</button></li>'; }).join("") + '</ul><button class="btn-mini primary" type="button" data-trotzdem>Trotzdem speichern</button>';
          box.querySelector("[data-trotzdem]").addEventListener("click", function () { f.setAttribute("data-trotzdem", "1"); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); });
          return "";
        }
        if (neu) {
          var nl = Object.assign({ id: Date.now(), stage: "neu", tage: 0, ki: "passt", kiText: "Manuell erfasst – " + dat.betreff + " in " + dat.ort + ".", kiRec: "Empfehlung: Termin vereinbaren oder Angebot erstellen.", verlauf: [] }, dat);
          nl.verlauf.push({ t: 0, text: "Anfrage manuell angelegt (" + KANAL[dat.kanal].label + ") von " + ichName() });
          state.leads.unshift(nl); protokoll("Neue Anfrage " + nl.name + " manuell angelegt");
          if (window.Glocke) Glocke.push("anfrage", "Neue Anfrage: " + nl.name, nl.betreff, "anfragen");
          closeDrawer(); toast("Anfrage angelegt."); state.view = "anfragen"; state.stageM = "neu"; render(); return openLead(nl.id);
        }
        var geaendert = Object.keys(dat).filter(function (k) { return String(l[k] == null ? "" : l[k]) !== String(dat[k]); });
        var alterName = l.name; Object.assign(l, dat);
        if (alterName !== l.name) { (state.angebote || []).forEach(function (a) { if (a.leadId === l.id) a.kunde = l.name; }); (state.auftraege || []).forEach(function (a) { if (a.leadId === l.id) a.kunde = l.name; }); mod.rechnungen.forEach(function (r) { if (r.name === alterName) r.name = l.name; }); mod.termine.forEach(function (t) { if (t.name === alterName) t.name = l.name; }); }
        if (geaendert.length) add(l, "Anfrage bearbeitet: " + geaendert.join(", ") + " (" + ichName() + ")");
        closeDrawer(); toast("Gespeichert."); render(); return openLead(l.id);
      });
    return d;
  }
  function anfrageLoeschen(l) {
    if (!darf("loeschen")) { toast("Löschen ist in dieser Rolle nicht erlaubt (Rollen-Simulation)."); return; }
    var au = auftragVon(l.id), an = angebotVon(l.id), re = mod.rechnungen.filter(function (r) { return r.name === l.name; });
    if (au || re.length || (an && an.status !== "entwurf")) { alert("„" + l.name + "“ kann nicht gelöscht werden: Es gibt verknüpfte " + [au ? "Aufträge" : "", re.length ? "Rechnungen" : "", an && an.status !== "entwurf" ? "gesendete Angebote" : ""].filter(Boolean).join(", ") + ". Setzen Sie die Anfrage stattdessen auf „erledigt“ oder lehnen Sie das Angebot ab."); return; }
    if (!confirm("Anfrage „" + l.name + "“ wirklich löschen?" + (an ? " Der Angebotsentwurf " + an.nr + " wird mit gelöscht." : "") + " Termine ohne Auftrag zu dieser Anfrage werden ebenfalls entfernt.")) return;
    state.leads = state.leads.filter(function (x) { return x !== l; });
    state.angebote = (state.angebote || []).filter(function (a) { return a.leadId !== l.id; });
    mod.termine = mod.termine.filter(function (t) { return !(t.name === l.name && !t.auftragId); });
    protokoll("Anfrage " + l.name + " gelöscht"); closeDrawer(); toast("Anfrage gelöscht."); render();
  }
  function kundeFormular(k) {
    var neu = !k; k = k || {};
    formDrawer(neu ? "Neuer Kunde" : "Kunde bearbeiten",
      '<div class="cr-grid">' + feld("name", "Name / Firma", k.name, { pflicht: true }) + feld("ort", "Ort", k.ort, { pflicht: true }) + feld("tel", "Telefon", k.tel, { typ: "tel", mode: "tel" }) + feld("mail", "E-Mail", k.mail, { typ: "email", mode: "email" }) +
      feld("ansprech", "Ansprechpartner (eine Zeile je Person: Name – Rolle – Telefon)", (k.ansprech || []).join("\n"), { area: true, breit: true, rows: 3 }) + feld("info", "Notiz", k.info && k.info !== "neu angelegt" ? k.info : "", { breit: true }) + "</div>",
      function (f) {
        var fehler = pruefe(f, [["name", function (v) { return v.length >= 2; }, "Bitte einen Namen angeben."], ["ort", function (v) { return v.length >= 2; }, "Bitte einen Ort angeben."], ["mail", function (v) { return mailOk(v); }, "Die E-Mail-Adresse ist ungültig."]]);
        if (fehler) return fehler;
        var dat = { name: f.name.value.trim(), ort: f.ort.value.trim(), tel: f.tel.value.trim(), mail: f.mail.value.trim(), ansprech: f.ansprech.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean), info: f.info.value.trim() || "neu angelegt" };
        var dub = dubletten(dat, neu ? null : k);
        if (dub.length) return "Diesen Kunden gibt es schon: " + dub.map(function (x) { return x.art + " „" + esc(x.name) + "“ (" + x.grund + ")"; }).join(", ") + ". Bitte den vorhandenen Eintrag verwenden.";
        if (neu) { state.kunden.unshift(Object.assign({ art: "bestand", aktion: "Angebot anbieten", umsatz: 0 }, dat)); protokoll("Kunde " + dat.name + " angelegt"); closeDrawer(); toast("Kunde angelegt."); return akteOeffnen(dat.name); }
        var alt = k.name; Object.assign(k, dat);
        if (alt !== k.name && akte[alt]) { akte[k.name] = akte[alt]; delete akte[alt]; }
        closeDrawer(); toast("Gespeichert."); akteOeffnen(k.name);
      });
  }
  function kundeLoeschen(name) {
    if (!darf("loeschen")) { toast("Löschen ist in dieser Rolle nicht erlaubt (Rollen-Simulation)."); return; }
    var k = state.kunden.filter(function (x) { return x.name === name; })[0], l = state.leads.filter(function (x) { return x.name === name; })[0];
    var verkn = [l ? "Anfrage" : "", mod.rechnungen.some(function (r) { return r.name === name; }) ? "Rechnungen" : "", (state.auftraege || []).some(function (a) { return a.kunde === name; }) ? "Aufträge" : ""].filter(Boolean);
    if (!k || verkn.length) { alert("„" + name + "“ kann nicht gelöscht werden: Es gibt verknüpfte " + (verkn.join(", ") || "Vorgänge") + ". Kundendaten mit Aufträgen oder Rechnungen müssen aufbewahrt werden."); return; }
    if (!confirm("Kunde „" + name + "“ wirklich löschen? Notizen und Fotos in der Kundenakte werden ebenfalls entfernt.")) return;
    state.kunden = state.kunden.filter(function (x) { return x !== k; }); delete akte[name];
    mod.termine = mod.termine.filter(function (t) { return t.name !== name; });
    protokoll("Kunde " + name + " gelöscht"); toast("Kunde gelöscht."); state.view = "kunden"; render();
  }

  /* Zurück-Taste: jeder Bereich bekommt einen Eintrag im Browser-Verlauf (#bereich) */
  var verlauf = { aus: false, letzter: null };
  function verlaufMerken() {
    if (verlauf.aus || !window.history || !history.pushState) return;
    var key = state.view + (state.view === "akte" ? "|" + state.akteKunde : "");
    if (key === verlauf.letzter) return;
    var st = { v: state.view, k: state.view === "akte" ? state.akteKunde : null }, url = location.pathname + location.search + "#" + state.view;
    try { if (verlauf.letzter === null) history.replaceState(st, "", url); else history.pushState(st, "", url); } catch (e) { /* z. B. in Vorschauen */ }
    verlauf.letzter = key;
  }
  window.addEventListener("popstate", function (e) {
    var st = e.state || {}, v = st.v || location.hash.slice(1) || "uebersicht";
    if (v !== "akte" && !VIEWS.some(function (x) { return x.id === v; })) v = "uebersicht";
    if (v === "akte") { if (st.k) state.akteKunde = st.k; else v = "kunden"; }
    closeDrawer(); if (typeof tourEnd === "function") tourEnd();
    state.view = v; verlauf.aus = true; render(); verlauf.aus = false;
    verlauf.letzter = v + (v === "akte" ? "|" + state.akteKunde : ""); window.scrollTo(0, 0);
  });
  function render() {
    if (!erlaubt(state.view)) state.view = (ROLLEN[state.rolle].views || ["uebersicht"]).filter(function (x) { return x !== "akte"; })[0] || "uebersicht";
    if (state.view === "akte" && !state.akteKunde) state.view = erlaubt("kunden") ? "kunden" : "uebersicht";
    ketteSync();
    verlaufMerken();
    renderNav();
    if (sprache.laeuft) setTimeout(function () { document.querySelectorAll("[data-vorlesen]").forEach(function (b) { b.classList.add("spricht"); b.lastChild.textContent = "Stopp"; }); });
    syncVermittlung();
    ({ branchen: viewBranchen, vermittlung: viewVermittlung, aufmass: viewAufmass, dokumente: viewDokumente, ablaeufe: viewAblaeufe,  uebersicht: viewUebersicht, anfragen: viewAnfragen, nachfassen: viewNachfassen, kunden: viewKunden, rechnungen: viewRechnungen, finanzen: viewFinanzen, auswertungen: viewAuswertungen, marketing: viewMarketing, einstellungen: viewEinstellungen, preise: viewPreise, vertrieb: viewVertrieb, angebote: viewAngebote, auftraege: viewAuftraege, termine: viewTermine, monteure: viewMonteure, wartung: viewWartung, portal: viewPortal, akte: viewKundenakte, ausschreibungen: viewAusschreibungen, netzwerk: viewNetzwerk, personal: viewPersonal, fristen: viewFristen, material: viewMaterial })[state.view]();
  }

  function go(view) {
    state.view = view;
    state.suche = "";
    render();
    window.scrollTo(0, 0);
  }

  /* --- Morgenbericht: kurze Zusammenfassung wie die tägliche Nachricht --- */
  function morgenbericht(neu, faellig) {
    var dringend = neu.filter(function (l) { return l.dringend; });
    var auftrag = state.leads.filter(function (l) { return l.stage === "auftrag"; });
    var bewOffen = state.leads.filter(function (l) { return l.stage === "erledigt" && l.bewertung === "offen"; });
    var aeltestes = offeneAngebote().slice().sort(function (a, b) { return b.angebotVor - a.angebotVor; })[0];
    var li = function (t) { return "<li>" + t + "</li>"; };
    var erledigt = [neu.length + (neu.length === 1 ? " neue Anfrage" : " neue Anfragen") + " erfasst und vorgeprüft"];
    if (auftrag.length) erledigt.push("Rechnung für " + esc(auftrag[0].name) + " vorbereitet");
    if (state.autoNachfassen) erledigt.push("Erinnerungen für offene Angebote eingeplant");
    erledigt.push("2 verpasste Anrufe vom Telefonassistenten angenommen");
    erledigt.push("Regiebericht von gestern (Familie Brandl) in eine Rechnungsvorlage übernommen");
    erledigt.push("Terminerinnerungen für morgen an 4 Kunden per WhatsApp geplant");
    erledigt.push("Bewertungsbitte an Familie Obermeier gesendet (geht an alle Kunden) – sie gibt 5 von 5");
    var bezahlt = mod.rechnungen.filter(function (r) { return r.status === "bezahlt"; });
    if (bezahlt.length) erledigt.push(bezahlt.length + " Zahlungseingänge zugeordnet");
    var freigabe = faellig.map(function (l) {
      return li('Nachfass-Mail an <b>' + esc(l.name) + "</b> (" + euro.format(l.wert) + ') <button class="btn-mini primary" type="button" data-open="' + l.id + '" data-act="nachfassen">Ansehen &amp; senden</button>');
    }).concat(bewOffen.map(function (l) {
      return li('Bewertungsanfrage an <b>' + esc(l.name) + '</b> <button class="btn-mini primary" type="button" data-open="' + l.id + '" data-act="bewertung">Ansehen &amp; senden</button>');
    })).concat(mod.rechnungen.filter(function (r) { return state.rolle !== "aussen" && r.status !== "bezahlt" && r.faellig > 0; }).map(function (r) {
      return li('Zahlungserinnerung an <b>' + esc(r.name) + "</b> (" + euro.format(r.betrag) + ') <button class="btn-mini primary" type="button" data-go="rechnungen">Ansehen</button>');
    }));
    if (!state.socialOk) freigabe.push(li('Vorher-nachher-Beitrag „Bad Familie Obermeier“ für Instagram und Google <button class="btn-mini primary" type="button" data-social>Ansehen</button>'));
    var fehlt = dokumenteAlle().filter(function (x) { return x.st === "wartet"; }).length;
    if (fehlt) freigabe.push(li("<b>" + fehlt + " Unterschriften</b> fehlen noch (Angebote, Abnahme) " + '<button class="btn-mini primary" type="button" data-go="dokumente">Ansehen</button>'));
    var termineHeute = mod.termine.filter(function (t) { return t.tag === "Heute"; });
    return '<section class="panel briefing' + (state.briefingOffen ? " offen" : "") + '" id="briefing" aria-labelledby="briefing-h">' +
      '<div class="briefing-head"><h2 id="briefing-h">' + svg(ICON.spark) + "Ihr Morgenbericht</h2>" +
        '<span class="voice-btns"><button class="btn-mini primary" type="button" data-vorlesen>' + svg(ICON.sound) + "<span>Vorlesen</span></button>" +
        '<button class="btn-mini" type="button" data-stimme-toggle aria-expanded="false" aria-controls="voice-set">Stimme</button></span></div>' + stimmenHtml() +
      "<p>Seit gestern " + (neu.length === 1 ? "ist <b>1 neue Anfrage</b>" : "sind <b>" + neu.length + " neue Anfragen</b>") + " eingegangen" +
        (dringend.length ? ", davon " + (dringend.length === 1 ? "eine dringend (" + esc(dringend[0].betreff) + " in " + esc(dringend[0].ort) + ")" : dringend.length + " dringend") : "") + ".</p>" +
      '<div class="briefing-cols">' +
        "<div><h3>Schon erledigt</h3><ul>" + erledigt.map(li).join("") + "</ul></div>" +
        "<div><h3>Zur Freigabe bereit</h3>" + (freigabe.length ? "<ul>" + freigabe.join("") + "</ul>" : "<p>Nichts offen.</p>") + "</div>" +
      "</div>" +
      (aeltestes ? '<p class="briefing-tip"><b>Heute wichtig:</b> Angebot ' + esc(aeltestes.name) + " ist seit " + aeltestes.angebotVor + " Tagen offen – ein Anruf lohnt sich." +
        (termineHeute.length ? " Heute stehen " + termineHeute.length + " Termine an, der erste um " + termineHeute[0].zeit + " Uhr." : "") + "</p>" : "") +
      '<p class="briefing-tip"><b>Wetter:</b> Morgen ab 13 Uhr Starkregen und Sturmböen – die Abnahme in Fürth ist innen, kein Problem. Material für Brandl bitte nicht im Hof lagern.</p>' +
      '<p class="briefing-note">Diesen Bericht bekommen Sie jeden Morgen im Cockpit, per E-Mail oder WhatsApp. Verschickt wird nur, was Sie freigeben.</p>' +
      '<button class="btn-mini briefing-more" type="button" data-briefing-more>' + (state.briefingOffen ? "Weniger anzeigen" : "Ganzen Bericht anzeigen") + "</button>" +
    "</section>";
  }

  /* =====================================================================
     EINSTIEG: Gewerk wählen, „Ihr Morgen“, Geld-Box, Rückruf-Wächter,
     Feierabend-Bericht, Menü „Einfach / Alle Bereiche“
     ===================================================================== */
  var T0 = Date.now();
  var EINFACH = ["uebersicht", "anfragen", "angebote", "aufmass", "termine", "kunden", "rechnungen"];
  function menueModus() { if (state.menue) return state.menue; try { return localStorage.getItem("auftragscockpit-menue") || "einfach"; } catch (e) { return "einfach"; } }
  function einfachAktiv() { return menueModus() !== "alle" && ["gf", "buero", "aussen"].indexOf(state.rolle) > -1; }
  function gwSpeicher() { try { return JSON.parse(localStorage.getItem(GWK) || "{}"); } catch (e) { return {}; } }
  function gwSpeichern(d) { try { localStorage.setItem(GWK, JSON.stringify(d)); } catch (e) { /* privat */ } }

  function onboarding() {
    if (!window.GW) return;
    closeDrawer(); lastFocus = document.activeElement;
    var alt = gwSpeicher(), wahl = { haupt: alt.haupt || window.DEMO_BRANCHE || "shk", weitere: (alt.weitere || []).slice() };
    var back = document.createElement("div"); back.className = "drawer-backdrop onb-back";
    var d = document.createElement("div"); d.className = "onb"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "onb-titel"); d.setAttribute("data-nt", "");
    function zeichnen() {
      var gruppen = {}; GW.GEWERKE.forEach(function (g) { (gruppen[g.gruppe] = gruppen[g.gruppe] || []).push(g); });
      d.innerHTML = '<div class="onb-kopf"><span class="onb-schritt">Schritt 1 von 2</span><h2 id="onb-titel">Für welches Gewerk wollen Sie die Demo sehen?</h2>' +
        "<p>Beispiele, Aufmaß, Produkte und Nachrichten passen sich an. Sie können das jederzeit oben bei „Gewerk“ ändern.</p></div>" +
        Object.keys(gruppen).map(function (gr) {
          return '<h3 class="onb-gruppe">' + gr + '</h3><div class="onb-grid">' + gruppen[gr].map(function (g) {
            return '<button type="button" class="onb-karte" data-onb-haupt="' + g.id + '" aria-pressed="' + (wahl.haupt === g.id) + '"><span class="onb-ic">' + svg(g.icon) + '</span><span><b>' + g.name + "</b><small>" + g.bsp + "</small></span></button>";
          }).join("") + "</div>";
        }).join("") +
        '<div class="onb-weitere"><span class="onb-schritt">Schritt 2 von 2 (freiwillig)</span><h3>Machen Sie noch mehr?</h3><p>Weitere Gewerke bekommen im Aufmaß einen eigenen Reiter.</p><div class="onb-chips">' +
          GW.GEWERKE.filter(function (g) { return g.id !== wahl.haupt; }).map(function (g) { return '<button type="button" data-onb-weitere="' + g.id + '" aria-pressed="' + (wahl.weitere.indexOf(g.id) > -1) + '">' + g.name + "</button>"; }).join("") + "</div></div>" +
        '<p class="onb-andere">Andere Branche: ' + GW.ANDERE.map(function (a) { return '<button type="button" class="linkbtn" data-onb-haupt="' + a[0] + '" data-onb-sofort>' + a[1] + "</button>"; }).join(" · ") + "</p>" +
        '<div class="onb-fuss"><button class="btn btn-signal" type="button" data-onb-start>Demo starten</button><button class="btn btn-outline" type="button" data-onb-spaeter>Erst mal umsehen</button></div>';
    }
    function starten() {
      wahl.weitere = wahl.weitere.filter(function (g) { return g !== wahl.haupt; });
      gwSpeichern({ haupt: wahl.haupt, weitere: wahl.weitere, gesehen: 1 });
      if (wahl.haupt !== (window.DEMO_BRANCHE || "shk")) { location.href = "demo.html" + (wahl.haupt === "shk" ? "" : "?branche=" + wahl.haupt); return; }
      d.remove(); back.remove(); document.body.style.overflow = ""; state.gwTab = null; render();
      toast("Fertig – die Demo zeigt jetzt " + gwName(wahl.haupt) + (wahl.weitere.length ? " und " + wahl.weitere.length + " weitere Gewerke" : "") + ".");
    }
    d.addEventListener("click", function (e) {
      var el = e.target.closest("button"); if (!el) return;
      if (el.hasAttribute("data-onb-haupt")) { wahl.haupt = el.getAttribute("data-onb-haupt"); if (el.hasAttribute("data-onb-sofort")) return starten(); zeichnen(); var w = d.querySelector(".onb-weitere"); if (w) w.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
      if (el.hasAttribute("data-onb-weitere")) { var g = el.getAttribute("data-onb-weitere"), i = wahl.weitere.indexOf(g); if (i > -1) wahl.weitere.splice(i, 1); else wahl.weitere.push(g); el.setAttribute("aria-pressed", String(i < 0)); return; }
      if (el.hasAttribute("data-onb-start")) return starten();
      if (el.hasAttribute("data-onb-spaeter")) { var s0 = gwSpeicher(); s0.gesehen = 1; gwSpeichern(s0); d.remove(); back.remove(); document.body.style.overflow = ""; }
    });
    zeichnen();
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    var f = d.querySelector('[aria-pressed="true"]') || d.querySelector("button"); if (f) f.focus();
  }

  function minutenWartet(l) { var basis = { "Thomas Bauer": 160, "Familie Huber": 45 }[l.name]; if (l.ankunft) return Math.round((Date.now() - l.ankunft) / 60000); return basis == null ? null : basis + Math.round((Date.now() - T0) / 60000); }
  function dauer(min) { return min < 60 ? min + " Min." : Math.floor(min / 60) + " Std. " + (min % 60 ? (min % 60) + " Min." : ""); }
  function rueckrufListe() { return neueAnfragen().filter(function (l) { var m = minutenWartet(l); return !l.kontaktiert && m != null && m >= 30; }).sort(function (a, b) { return minutenWartet(b) - minutenWartet(a); }); }
  function rueckrufWaechter() {
    var liste = rueckrufListe(); if (!liste.length) return "";
    return '<section class="rr-waechter" id="rueckruf" aria-label="Rückruf-Wächter">' + liste.map(function (l) {
      var m = minutenWartet(l), ueber = m >= 120;
      return '<div class="rr-zeile' + (ueber ? " ueber" : "") + '">' + svg(ICON.clock) + '<div><b>' + (ueber ? "Rückruf überfällig: " : "Wartet auf Antwort: ") + esc(l.name) + "</b><small>" + esc(l.betreff) + " · wartet seit " + dauer(m) + (l.dringend ? " · dringend" : "") + "</small></div>" +
        '<div class="btn-row"><a class="btn-mini primary" href="tel:' + esc((l.tel || "").replace(/\s/g, "")) + '" data-rr-anruf="' + l.id + '">Anrufen</a><button class="btn-mini" type="button" data-rr-ok="' + l.id + '">Erledigt</button></div></div>';
    }).join("") + '<p class="rr-hinweis">Der Rückruf-Wächter meldet sich, wenn eine Anfrage länger als 2 Stunden unbeantwortet ist. Schnell zurückrufen erhöht die Chance auf den Auftrag deutlich.</p></section>';
  }
  function geldBox() {
    var fa = faelligNachfassen(), sfa = fa.reduce(function (s, l) { return s + l.wert; }, 0);
    var ue = mod.rechnungen.filter(function (r) { return restVon(r) > 0 && r.faellig > 0; }), sue = ue.reduce(function (s, r) { return s + restVon(r); }, 0);
    var alt = (state.kunden || []).filter(function (k) { return k.art === "alt" && !k.erledigt; }), salt = alt.reduce(function (s, k) { var m = String(k.info).match(/([\d.]+) €/); return s + (m ? +m[1].replace(/\./g, "") : 0); }, 0);
    var wa = (mod.wartung || []).filter(function (w) { return /fällig|Tagen/.test(w.status || w.info || ""); });
    var zeilen = [];
    if (fa.length) zeilen.push([svg(ICON.bell), fa.length + (fa.length === 1 ? " Angebot wartet" : " Angebote warten") + " auf eine Nachfrage", euro.format(sfa), "Die Nachrichten sind schon vorbereitet.", "nachfassen", "Nachrichten prüfen"]);
    if (ue.length) zeilen.push([svg(ICON.euro), ue.length + (ue.length === 1 ? " Rechnung ist" : " Rechnungen sind") + " überfällig", euro.format(sue), "Erinnerung mit Zahlungslink ist vorbereitet.", "rechnungen", "Ansehen"]);
    if (alt.length) zeilen.push([svg(ICON.users), alt.length + " alte Angebote nie nachgefasst", euro.format(salt), "Eine freundliche Nachfrage bringt oft noch Aufträge.", "kunden", "Ansehen"]);
    if (!zeilen.length) return "";
    var summe = sfa + sue + salt;
    return '<section class="panel geld-box" id="geld"><div class="geld-kopf"><h2>Hier liegt Geld herum</h2><b class="geld-summe">' + euro.format(summe) + "</b></div>" +
      '<ul class="geld-liste">' + zeilen.map(function (z) { return '<li><span class="geld-ic">' + z[0] + '</span><span class="geld-txt"><b>' + z[1] + "</b><small>" + z[3] + '</small></span><span class="geld-wert">' + z[2] + '</span><button class="btn-mini primary" type="button" data-go="' + z[4] + '">' + z[5] + "</button></li>"; }).join("") + "</ul></section>";
  }
  function ihrMorgen(gruss, bericht) {
    var neu = neueAnfragen(), dr = neu.filter(function (l) { return l.dringend; })[0], th = mod.termine.filter(function (t) { return t.tag === "Heute"; });
    var frei = faelligNachfassen().length + state.leads.filter(function (l) { return l.stage === "erledigt" && l.bewertung === "offen"; }).length + mod.rechnungen.filter(function (r) { return restVon(r) > 0 && r.faellig > 0; }).length;
    var karte = function (zahl, titel, text, knopf, attr, cls) { return '<button type="button" class="mg-karte ' + (cls || "") + '" ' + attr + '><b class="mg-zahl">' + zahl + '</b><span class="mg-titel">' + titel + '</span><small>' + text + '</small><span class="mg-los">' + knopf + " →</span></button>"; };
    var ich = absender()[1];
    return '<section class="morgen" id="morgen"><div class="mg-kopf"><div><h1>' + gruss + ", " + (state.rolle === "gf" ? "Thomas" : ich) + '.</h1><p>Das steht heute an. Ein Klick, und Sie sind mittendrin.</p></div>' +
        '<div class="mg-aktion"><button class="btn btn-outline" type="button" data-feierabend>' + svg(ICON.clock) + "Feierabend-Bericht</button><button class=\"btn btn-signal\" type=\"button\" data-simulate>+ Anfrage simulieren</button></div></div>" +
      (bericht || "") + '<div class="mg-karten">' +
        karte(neu.length, neu.length === 1 ? "neue Anfrage" : "neue Anfragen", dr ? "Dringend: " + esc(dr.betreff) + " (" + esc(dr.ort) + ")" : "Alle schon von der KI vorgeprüft", "Ansehen", dr ? 'data-open="' + dr.id + '"' : 'data-go="anfragen"', dr ? "warn" : "") +
        karte(th.length, th.length === 1 ? "Termin heute" : "Termine heute", th[0] ? "Erster um " + th[0].zeit + " Uhr: " + esc(th[0].art) + ", " + esc(th[0].name) : "Heute ist nichts eingetragen", "Zum Kalender", 'data-go="termine"') +
        karte(frei, frei === 1 ? "Nachricht zum Freigeben" : "Nachrichten zum Freigeben", "Nachfassen, Bewertung, Zahlungserinnerung – schon geschrieben", "Prüfen", 'data-go="nachfassen"', "ok") +
      "</div>" +
      '<p class="mg-nutzen">' + svg(ICON.spark) + "<span>Diese Woche für Sie erledigt: <b>23 Nachrichten vorbereitet</b>, <b>6 Anrufe angenommen</b>, <b>4 Angebote nachgefasst</b> – ungefähr <b>4 Stunden</b> weniger Büro (Beispielwoche).</span></p></section>";
  }
  function feierabendBericht() {
    closeDrawer(); lastFocus = document.activeElement;
    var heute = (state.log || []).slice(-8).reverse(), morgen = mod.termine.filter(function (t) { return t.tag === "Morgen"; }), offen = neueAnfragen().length + faelligNachfassen().length;
    var fertig = ["3 Anfragen vorgeprüft und beantwortet", "2 Angebote nachgefasst", "Regiebericht Familie Brandl in eine Rechnungsvorlage übernommen", "1 Zahlung zugeordnet (Familie Obermeier)"];
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title");
    d.innerHTML = kopfX("Feierabend-Bericht") + '<p class="fb-intro">Jeden Tag um 17 Uhr – im Cockpit, per E-Mail oder WhatsApp. Kurz, damit Sie mit gutem Gefühl nach Hause gehen.</p>' +
      '<div class="fb-block ok"><h3>' + svg(ICON.check) + "Heute erledigt</h3><ul>" + heute.map(function (x) { return "<li>" + esc(x[1]) + " <small>" + esc(x[0]) + "</small></li>"; }).join("") + fertig.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>" +
      '<div class="fb-block"><h3>' + svg(ICON.calendar) + "Morgen</h3><ul>" + (morgen.length ? morgen.map(function (t) { return "<li><b>" + esc(t.zeit) + "</b> " + esc(t.art) + " · " + esc(t.name) + " · " + esc(t.wer) + "</li>"; }).join("") : "<li>Noch keine Termine.</li>") + "</ul></div>" +
      '<div class="fb-block warn"><h3>' + svg(ICON.bell) + "Bleibt liegen</h3><ul><li>" + offen + " Vorgänge warten auf Sie – das Cockpit erinnert morgen früh daran.</li>" + (rueckrufListe().length ? "<li><b>Rückruf offen:</b> " + rueckrufListe().map(function (l) { return esc(l.name); }).join(", ") + "</li>" : "") + "</ul></div>" +
      '<p class="src">Inhalt in der Demo teils Beispielwerte. Verschickt wird nichts.</p>';
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    d.querySelector("[data-close]").focus();
  }
  function einstiegKlick(t) {
    var el;
    if (t.closest("[data-feierabend]")) { feierabendBericht(); return true; }
    if ((el = t.closest("[data-rr-ok]"))) { var l = leadVon(+el.getAttribute("data-rr-ok")); if (l) { l.kontaktiert = true; add(l, "Kunde zurückgerufen (" + ichName() + ")"); toast("Vermerkt: " + l.name + " ist zurückgerufen."); render(); } return true; }
    if ((el = t.closest("[data-rr-anruf]"))) { var l2 = leadVon(+el.getAttribute("data-rr-anruf")); if (l2) { l2.kontaktiert = true; add(l2, "Anruf gestartet (" + ichName() + ")"); setTimeout(render, 300); } return false; }
    if ((el = t.closest("[data-menue]"))) { state.menue = el.getAttribute("data-menue"); try { localStorage.setItem("auftragscockpit-menue", state.menue); } catch (e) { /* privat */ } renderNav(); if (el.closest(".sheet")) { var sh = document.querySelector(".sheet"); if (sh) sh.innerHTML = sheetInhalt(); } return true; }
    if (t.closest("[data-gewerk-wahl]")) { onboarding(); return true; }
    if ((el = t.closest("[data-foto-faerben]"))) { var kk0 = konf && konf.cfg, ko = konf && konf.o && konf.o.kunde; fotoFaerben({ farbe: kk0 && kk0.farbe, technik: kk0 && kk0.technik, kunde: ko || el.getAttribute("data-foto-kunde") }); return true; }
    if (t.closest("[data-konf-katalog]")) { state.konfKunde = am.kunde; konfOeffnen(null, { katalog: true }); return true; }
    if (t.closest("[data-an-produkt]")) { var aa = state.angebotSel && state.angebote.filter(function (x) { return x.id === state.angebotSel; })[0]; if (aa) { state.konfKunde = aa.kunde; konfOeffnen(arProduktFuer(aa.titel), { katalog: true, angebot: aa.id }); } return true; }
    if ((el = t.closest("[data-konf-kunde]"))) { var kk = el.getAttribute("data-konf-kunde").split("|"); konfOeffnen(kk[0], { kunde: kk[1] }); return true; }
    if ((el = t.closest("[data-po-variante]"))) { var pv = el.getAttribute("data-po-variante").split("|"), pl = leadVon(+pv[0]), pa = pl && angebotVon(pl.id); if (pa && pa.varianten && pa.status === "gesendet") { variantenWaehlen(pa, pv[1]); add(pl, "Im Kundenportal Variante „" + pv[1] + "“ gewählt"); var ak = document.createElement("button"); ak.setAttribute("data-po-annehmen", pl.id); document.body.appendChild(ak); ak.click(); ak.remove(); } return true; }
    if ((el = t.closest("[data-sprechen]"))) { sprechen(el); return true; }
    if (t.closest("[data-mehr-zahlen]")) { state.mehrZahlen = !state.mehrZahlen; render(); return true; }
    if (t.closest("[data-tour-alle]")) { TOUR = TOUR_ALLE; tourShow(0); return true; }
    return false;
  }

  /* =====================================================================
     NEUE HELFER: Gut / Besser / Premium, Angebot aus Fotos, Sprechen statt tippen
     ===================================================================== */
  var VARIANTEN = {   // Kandidaten je Gewerk für Besser und Premium (Beispielpreise netto); schon Enthaltenes wird übersprungen
    shk: [[["Markenarmaturen mit Thermostat", 1, "psch", 690], ["Wandnische mit LED-Licht", 1, "Stk.", 490], ["Handtuchheizkörper elektrisch", 1, "Stk.", 590]], [["Großformatfliesen 60 × 120 (Aufpreis)", 1, "psch", 1450], ["Dusch-WC statt Standard-WC (Aufpreis)", 1, "Stk.", 1890], ["Fußbodenheizung elektrisch", 1, "psch", 990]]],
    heizung: [[["Smarte Steuerung mit App und Raumthermostaten", 1, "psch", 890], ["Heizkörper-Thermostate smart", 1, "psch", 490]], [["PV-Überschuss-Steuerung und Monitoring", 1, "psch", 650], ["Wartungsvertrag 5 Jahre", 1, "psch", 990]]],
    elektro: [[["Smart Home für Licht und Rollläden", 1, "psch", 1890], ["Zusätzliche Netzwerkdosen", 4, "Stk.", 159]], [["Wallbox 11 kW inkl. Montage", 1, "Stk.", 1680], ["Überspannungsschutz Typ 1+2", 1, "Stk.", 690]]],
    solar: [[["Stromspeicher 5 kWh", 1, "Stk.", 3900], ["Energiemanager mit App", 1, "Stk.", 490]], [["Ersatzstrom bei Stromausfall", 1, "Stk.", 890], ["Wallbox mit PV-Überschussladen", 1, "Stk.", 1880]]],
    maler: [[["Wände spachteln Q3 für glatte Oberflächen", 1, "psch", 890], ["Türen und Zargen lackieren", 1, "psch", 690]], [["Premium-Wandfarbe, scheuerbeständig Klasse 1 (Aufpreis)", 1, "psch", 590], ["Akzentwand in Wunschfarbe", 1, "Stk.", 290]]],
    fliesen: [[["Großformat 60 × 120 statt 30 × 60 (Aufpreis)", 1, "psch", 1290], ["Edelstahl-Abschlussschienen", 1, "psch", 290]], [["Feinsteinzeug in Natursteinoptik, rektifiziert (Aufpreis)", 1, "psch", 1890], ["Wandnische mit LED-Licht", 1, "Stk.", 490]]],
    boden: [[["Sockelleisten in Bodenfarbe statt weiß", 1, "psch", 290], ["Trittschalldämmung Premium", 1, "psch", 340]], [["Eiche-Landhausdiele geölt statt Vinyl (Aufpreis)", 1, "psch", 2400]]],
    trockenbau: [[["Schallschutz-Dämmung verstärkt", 1, "psch", 490]], [["Oberfläche Q3, malerfertig", 1, "psch", 690], ["Indirekte LED-Beleuchtung in der Decke", 1, "psch", 890]]],
    schreiner: [[["Soft-Close für alle Türen und Auszüge", 1, "psch", 390]], [["LED-Innenbeleuchtung", 1, "psch", 590], ["Front Eiche furniert (Aufpreis)", 1, "psch", 1490]]],
    dach: [[["Aufsparrendämmung statt Zwischensparren (Aufpreis)", 1, "psch", 3900], ["Schneefanggitter", 1, "psch", 590]], [["Dachfenster mit Solar-Rollladen", 1, "Stk.", 1290], ["Dachrinne Kupfer statt Titanzink (Aufpreis)", 1, "psch", 1690]]],
    fenster: [[["Sicherheitsbeschläge RC2", 1, "psch", 690], ["Fensterbänke innen Kunststein", 1, "psch", 390]], [["Elektrische Rollläden mit App", 1, "psch", 2400], ["Schallschutzglas", 1, "psch", 890]]],
    sonnenschutz: [[["LED-Spots dimmbar", 1, "psch", 590], ["Unterdachmarkise", 1, "Stk.", 2290], ["Senkrechtmarkise vorne (Screen)", 1, "psch", 1950]], [["Glasschiebewand vorne", 1, "psch", 3450], ["Infrarot-Heizstrahler", 1, "Stk.", 490], ["Wind- und Sonnensensor", 1, "Stk.", 290]]],
    garten: [[["Randeinfassung Naturstein statt Beton (Aufpreis)", 1, "psch", 890]], [["Gartenbeleuchtung LED, 6 Spots", 1, "psch", 1290], ["Automatische Bewässerung", 1, "psch", 1890]]],
    allgemein: [[["Erweiterter Leistungsumfang", 1, "psch", 500]], [["Premium-Ausführung", 1, "psch", 1000]]]
  };
  function variantenAnlegen(a) {
    var v = VARIANTEN[hauptGewerk()] || VARIANTEN.allgemein, mk = function (x) { return { text: x[0], menge: x[1], einheit: x[2], ep: x[3], rabatt: 0, optional: false, aufmass: true }; };
    var schon = a.positionen.map(function (p) { return String(p.text).toLowerCase(); }).join(" | ");
    var frei = function (x) { var w = x[0].toLowerCase().split(/[\s,(]+/)[0]; return schon.indexOf(w) < 0; };
    var besser = v[0].filter(frei).slice(0, 2), premium = v[1].filter(frei).slice(0, 2);
    if (!besser.length) besser = [["Wartung im ersten Jahr inklusive", 1, "psch", 290]];
    if (!premium.length) premium = [["Erweiterte Herstellergarantie", 1, "psch", 590]];
    a.varianten = { besser: besser.map(mk), premium: premium.map(mk) };
  }
  function variantenPos(a, name) { return name === "Premium" ? a.positionen.concat(a.varianten.besser, a.varianten.premium) : name === "Besser" ? a.positionen.concat(a.varianten.besser) : a.positionen; }
  function variantenSummen(a) { return ["Gut", "Besser", "Premium"].map(function (n) { return [n, rechne(variantenPos(a, n)).brutto]; }); }
  function variantenWaehlen(a, name) { a.positionen = variantenPos(a, name).map(function (p) { var q = Object.assign({}, p); return q; }); a.gewaehlt = name; delete a.varianten; verlaufK(a, "Kunde hat Variante „" + name + "“ gewählt"); }
  function variantenEditor(a, edit) {
    var sum = variantenSummen(a), extra = function (l) { return "<ul>" + l.map(function (p) { return "<li>" + esc(p.text) + " <b>+ " + eur2.format(p.menge * p.ep) + "</b></li>"; }).join("") + "</ul>"; };
    return '<div class="var-box" data-nt><div class="var-kopf"><h3>Drei Varianten für den Kunden</h3>' + (edit ? '<button class="btn-mini" type="button" data-an-varianten-weg>Varianten entfernen</button>' : "") + "</div>" +
      '<div class="var-karten"><div class="var-karte"><span>Gut</span><b>' + eur2.format(sum[0][1]) + "</b><small>alles wie oben</small></div>" +
      '<div class="var-karte empfohlen"><span>Besser <em>beliebt</em></span><b>' + eur2.format(sum[1][1]) + "</b>" + extra(a.varianten.besser) + "</div>" +
      '<div class="var-karte"><span>Premium</span><b>' + eur2.format(sum[2][1]) + "</b><small>Besser, plus:</small>" + extra(a.varianten.premium) + "</div></div>" +
      '<p class="src">Preise brutto. Der Kunde wählt im Kundenportal – die gewählte Variante wird automatisch zum Auftrag. Erfahrungsgemäß wählen viele die mittlere Variante.</p></div>';
  }
  function variantenPortal(a, l) {
    var sum = variantenSummen(a), extra = function (n) { return n === "Gut" ? "<li>Alles, was Sie brauchen</li>" : (n === "Besser" ? a.varianten.besser : a.varianten.besser.concat(a.varianten.premium)).map(function (p) { return "<li>" + esc(p.text.replace(/ \(Aufpreis\)/, "")) + "</li>"; }).join(""); };
    return '<div class="po-box po-varianten" data-nt><b>Ihr Angebot ' + esc(a.nr) + ': Bitte wählen Sie</b><div class="var-karten">' + sum.map(function (v) {
      return '<div class="var-karte' + (v[0] === "Besser" ? " empfohlen" : "") + '"><span>' + v[0] + (v[0] === "Besser" ? " <em>beliebt</em>" : "") + "</span><b>" + eur2.format(v[1]) + "</b><ul>" + extra(v[0]) + '</ul><button class="btn ' + (v[0] === "Besser" ? "btn-signal" : "btn-outline") + '" type="button" data-po-variante="' + l.id + "|" + v[0] + '">' + v[0] + " wählen</button></div>";
    }).join("") + '</div><p class="src">Preise inkl. 19 % USt. Mit der Wahl nehmen Sie das Angebot an (Demo).</p></div>';
  }
  function fotoAngebot(l, knopf) {
    var box = knopf.closest(".drawer"), anz = 4, ziel = knopf.parentNode;
    ziel.innerHTML = '<div class="ki-schaetzt"><span class="ki-puls"></span><div><b>Die KI schaut sich ' + anz + ' Fotos an …</b><small>Raum erkennen · Maße schätzen · passende Positionen suchen</small></div></div>';
    setTimeout(function () {
      if (!document.body.contains(box)) return;
      var id = hauptGewerk(), C = GW.AUFMASS[id], A = C.start(), a = angebotNeu(l);
      if (a.status !== "entwurf") { closeDrawer(); state.angebotSel = a.id; state.view = "angebote"; render(); return; }
      a.positionen = C.positionen(A).map(function (p) { p.aufmass = true; p.text += " (aus Fotos geschätzt)"; return p; });
      a.notiz = "Richtwert aus den Fotos. Die genauen Mengen stehen nach dem Aufmaß vor Ort fest.";
      verlaufK(a, "Entwurf aus " + anz + " Fotos geschätzt (KI) – bitte vor Ort prüfen"); add(l, "Angebotsentwurf aus Fotos geschätzt (" + a.nr + ")");
      closeDrawer(); state.angebotSel = a.id; state.view = "angebote"; render(); window.scrollTo(0, 0);
      toast("Entwurf aus den Fotos steht – bitte prüfen. Die genauen Mengen kommen nach dem Aufmaß.");
    }, 1900);
  }
  var SAETZE = ["Alte Armatur abgebaut, neue montiert und abgedichtet. Zwei Stunden. Material Dichtungssatz.", "Heizkörper im Bad getauscht und entlüftet, Kunde eingewiesen. Drei Stunden.", "Silikonfugen in der Dusche erneuert. Eine Stunde. Material zwei Kartuschen Silikon."];
  function sprechen(btn) {
    var f = btn.closest("form"); if (!f || btn.classList.contains("hoert")) return;
    var satz = SAETZE[(state.sprechNr = ((state.sprechNr || 0) + 1)) % SAETZE.length], std = /Drei/.test(satz) ? 3 : /Eine/.test(satz) ? 1 : 2, matM = satz.match(/Material (.+)\.$/);
    btn.classList.add("hoert"); var alt = btn.innerHTML; btn.innerHTML = '<span class="ki-puls"></span>Hört zu …';
    setTimeout(function () {
      btn.innerHTML = "Schreibt …";
      var t = f.querySelector('[name="taetigkeit"]'), ziel = satz.replace(/ (Zwei|Drei|Eine) Stunden?\..*$/, "").replace(/\.$/, ""), i = 0;
      (function tipp() { i = Math.min(ziel.length, i + 3); t.value = ziel.slice(0, i); if (i < ziel.length) setTimeout(tipp, 18); else {
        f.querySelector('[name="stunden"]').value = String(std);
        if (matM) f.querySelector('[name="material"]').value = matM[1];
        btn.classList.remove("hoert"); btn.innerHTML = alt; toast("Aus der Sprachnachricht übernommen – bitte kurz prüfen (Simulation).");
      } })();
    }, 1400);
  }

  /* --- Übersicht --- */
  function viewUebersicht() {
    var h = new Date().getHours();
    var gruss = h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
    var neu = neueAnfragen(), angebote = offeneAngebote(), faellig = faelligNachfassen();
    var auftraege = state.leads.filter(function (l) { return l.stage === "auftrag" || l.stage === "erledigt"; });
    var summe = function (arr) { return arr.reduce(function (s, l) { return s + l.wert; }, 0); };

    // Heute zu tun
    var todo = [];
    neu.forEach(function (l) {
      todo.push({ id: l.id, dot: l.dringend ? "warn" : "", text: (l.dringend ? "Dringend: " : "Neue Anfrage: ") + l.betreff, sub: l.name + " · " + l.ort, btn: "Ansehen" });
    });
    faellig.forEach(function (l) {
      todo.push({ id: l.id, text: "Angebot nachfassen: " + l.betreff, sub: l.name + " · offen seit " + l.angebotVor + " Tagen", btn: "Nachfassen", act: "nachfassen" });
    });
    (state.auftraege || []).forEach(function (au) { (au.aufgaben || []).forEach(function (a) { if (!a.erledigt && a.bis && a.bis <= heuteISO()) todo.push({ id: au.leadId, dot: "warn", text: "Aufgabe " + (a.bis < heuteISO() ? "überfällig" : "heute") + ": " + a.titel, sub: au.nr + " · " + au.kunde + " · " + a.wer, btn: "Öffnen" }); }); });
    state.leads.filter(erinnerungFaellig).forEach(function (l) {
      todo.push({ id: l.id, dot: "warn", text: "Erinnerung fällig: " + l.erinnerung.art + " – " + l.name, sub: l.erinnerung.notiz || l.betreff, btn: "Öffnen" });
    });
    state.leads.filter(function (l) { return l.stage === "erledigt" && l.bewertung === "offen"; }).forEach(function (l) {
      todo.push({ id: l.id, text: "Um Bewertung bitten: " + l.name, sub: l.betreff + " abgeschlossen", btn: "Anfragen", act: "bewertung" });
    });

    // Letzte Aktivitäten
    var feed = [];
    state.leads.forEach(function (l) { l.verlauf.forEach(function (e) { feed.push({ t: e.t, text: e.text, name: l.name }); }); });
    feed.sort(function (a, b) { return a.t - b.t; });

    // Kanäle
    var kanaele = Object.keys(KANAL).map(function (k) { return { k: k, n: state.leads.filter(function (l) { return l.kanal === k; }).length }; });
    var max = Math.max.apply(null, kanaele.map(function (x) { return x.n; }));

    $main.innerHTML =
      ihrMorgen(gruss, morgenbericht(neu, faellig)) + rueckrufWaechter() + geldBox() +
      '<div class="mehr-zahlen"><button class="btn btn-outline" type="button" data-mehr-zahlen aria-expanded="' + !!state.mehrZahlen + '">' + (state.mehrZahlen ? "Zahlen ausblenden" : "Alle Kennzahlen anzeigen") + "</button></div>" +
      (state.mehrZahlen ? dashboardBlock() + (state.rolle === "gf" ? gfPanel() : "") : "") +
      '<div class="panel-grid two">' +
        '<section class="panel" id="todo" aria-labelledby="todo-h"><h2 id="todo-h">Heute zu tun</h2>' +
          (todo.length ? '<ul class="todo">' + todo.map(function (t) {
            return '<li><span class="dot ' + (t.dot || "") + '"></span><span class="txt">' + esc(t.text) + "<small>" + esc(t.sub) + "</small></span>" +
                   '<button class="btn-mini' + (t.act ? " primary" : "") + '" type="button" data-open="' + t.id + '"' + (t.act ? ' data-act="' + t.act + '"' : "") + ">" + t.btn + "</button></li>";
          }).join("") + "</ul>" : '<p class="col-empty">Alles erledigt.</p>') +
        "</section>" +
        '<div class="panel-grid">' +
          '<section class="panel" aria-labelledby="feed-h"><h2 id="feed-h">Letzte Aktivitäten</h2><ul class="feed">' +
            feed.slice(0, 6).map(function (f) { return '<li><span class="ic">' + svg(ICON.check) + "</span><span>" + esc(f.text) + "<small>" + esc(f.name) + " · " + vorTagen(f.t) + "</small></span></li>"; }).join("") +
          "</ul></section>" +
          '<section class="panel hide-m" aria-labelledby="kanal-h"><h2 id="kanal-h">Anfragen nach Kanal</h2><div class="bars">' +
            kanaele.map(function (x) { return '<div class="bar-row"><span>' + KANAL[x.k].label + '</span><span class="bar"><i style="width:' + (max ? x.n / max * 100 : 0) + '%"></i></span><b>' + x.n + "</b></div>"; }).join("") +
          "</div></section>" +
        "</div>" +
      "</div>";
  }
  function kpi(label, wert, sub) { return '<div class="kpi"><span>' + label + "</span><strong>" + wert + "</strong><small>" + sub + "</small></div>"; }

  /* --- Anfragen (Spalten) --- */
  function leadCard(l) {
    var ki = l.denkt ? '<span class="pill thinking">KI prüft …</span>' : '<span class="pill ' + KI[l.ki].cls + '">' + KI[l.ki].label + "</span>";
    return '<button class="lead' + (l.frisch ? " is-new" : "") + '" type="button" data-open="' + l.id + '">' +
      '<span class="lead-top"><strong>' + esc(l.name) + "</strong><span>" + vorTagen(l.tage) + "</span></span>" +
      '<span class="lead-sub">' + esc(l.betreff) + " · " + esc(l.ort) + "</span>" +
      '<span class="lead-meta">' + (l.dringend ? '<span class="pill urgent">Dringend</span>' : "") +
        '<span class="pill">' + svg(KANAL[l.kanal].icon) + KANAL[l.kanal].label + "</span>" + ki +
        '<span class="lead-value">' + euro.format(l.wert) + "</span></span>" +
      '<span class="lead-wer">' + esc(verantwortlichVon(l)) + (l.erinnerung && !l.erinnerung.erledigt ? " · 🔔 " + datumDE(l.erinnerung.datum) : "") + "</span>" +
    "</button>";
  }
  function viewAnfragen() {
    var q = state.suche.toLowerCase();
    var list = state.leads.filter(function (l) {
      return (state.filter === "alle" || l.kanal === state.filter) &&
             (!q || (l.name + " " + l.ort + " " + l.betreff + " " + (l.tel || "") + " " + (l.mail || "")).toLowerCase().indexOf(q) > -1) &&
             (!state.anfWer || state.anfWer === "alle" || verantwortlichVon(l) === state.anfWer);
    });
    if (state.anfSort === "wert") list.sort(function (a, b) { return b.wert - a.wert; });
    else if (state.anfSort === "alt") list.sort(function (a, b) { return (b.tage || 0) - (a.tage || 0); });
    else list.sort(function (a, b) { return (a.tage || 0) - (b.tage || 0); });
    var filterBtns = [["alle", "Alle"]].concat(Object.keys(KANAL).map(function (k) { return [k, KANAL[k].label]; }))
      .map(function (f) { return '<button type="button" data-filter="' + f[0] + '" aria-pressed="' + (state.filter === f[0]) + '">' + f[1] + "</button>"; }).join("");

    $main.innerHTML =
      '<div class="view-head"><div><h1>Anfragen</h1><p>Alle Kanäle an einem Ort. Tippen Sie auf eine Anfrage für Details.</p></div>' +
        '<div class="view-actions"><button class="btn btn-signal" type="button" data-simulate>+ Neue Anfrage simulieren</button><button class="btn btn-outline" type="button" data-anfrage-neu>+ Anfrage erfassen</button></div></div>' +
      '<div class="toolbar"><input class="search" id="suche" type="search" placeholder="Suchen: Name, Ort, Auftrag …" aria-label="Anfragen durchsuchen" value="' + esc(state.suche) + '">' +
        '<div class="filter" role="group" aria-label="Nach Kanal filtern">' + filterBtns + "</div>" +
        '<div class="dash-filter" style="margin:0"><label>Verantwortlich <select data-anf="anfWer">' + ["alle", "Thomas (GF)", "Sabine (Büro)", "Stefan (Außendienst)"].map(function (w) { return "<option" + ((state.anfWer || "alle") === w ? " selected" : "") + ">" + w + "</option>"; }).join("") + "</select></label>" +
        '<label>Sortieren <select data-anf="anfSort">' + [["neu", "neueste zuerst"], ["alt", "älteste zuerst"], ["wert", "nach Wert"]].map(function (o) { return '<option value="' + o[0] + '"' + ((state.anfSort || "neu") === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div></div>" +
      (q && !list.length ? '<p class="col-empty">Keine Anfrage gefunden für „' + esc(state.suche) + '“.</p>' : "") +
      '<div class="stage-seg" role="group" aria-label="Spalte wählen">' + STAGES.map(function (st) {
        var n = list.filter(function (l) { return l.stage === st.id; }).length;
        return '<button type="button" data-stage-m="' + st.id + '" aria-pressed="' + (state.stageM === st.id) + '">' + st.label.replace(" offen", "") + " <b>" + n + "</b></button>"; }).join("") + "</div>" +
      '<div class="board-wrap" id="board"><div class="board">' +
        STAGES.map(function (s) {
          var items = list.filter(function (l) { return l.stage === s.id; });
          var sum = items.reduce(function (a, l) { return a + l.wert; }, 0);
          return '<section class="col' + (state.stageM === s.id ? " is-m" : "") + '" aria-label="' + s.label + '"><div class="col-head"><h2>' + s.label + ' <span class="count">' + items.length + "</span></h2><small>" + euro.format(sum) + "</small></div>" +
            (items.length ? items.map(leadCard).join("") : '<div class="col-empty">Keine Einträge</div>') + "</section>";
        }).join("") +
      "</div></div>";
    state.leads.forEach(function (l) { l.frisch = false; });

    var input = document.getElementById("suche");
    input.addEventListener("input", function () {
      state.suche = input.value;
      var pos = input.selectionStart;
      viewAnfragen();
      var again = document.getElementById("suche");
      again.focus(); again.setSelectionRange(pos, pos);
    });
  }

  /* --- Nachfassen --- */
  /* --- Texte, die die KI vorbereitet (E-Mail und WhatsApp, je zwei Fassungen) --- */
  /* ---------- Nachrichten: kurz und natürlich, wie ein Mensch aus dem Betrieb schreibt ---------- */
  var ABSENDER = { gf: ["Thomas Berger", "Thomas"], buero: ["Sabine Lang", "Sabine"], aussen: ["Stefan Roth", "Stefan"] };
  function absender() { return ABSENDER[state && state.rolle] || ABSENDER.buero; }
  function signatur() { return "\n\nViele Grüße\n" + absender()[0] + "\n" + BETRIEB + "\nTel. 09131 000 000"; }
  var SIGNATUR = "\n\nViele Grüße\nSabine Lang\n" + BETRIEB + "\nTel. 09131 000 000";
  var FRAU = /^(Sabine|Petra|Andrea|Claudia|Julia|Laura|Renate|Maria|Anna|Lisa|Katrin|Sandra)\b/, HERR = /^(Thomas|Max|Johann|Martin|Georg|Anton|Bernhard|Stefan|Jonas|Michael|Peter|Klaus)\b/;
  function anredeName(name) {   // „Frau Wimmer“, „Herr Bauer“, „Familie Huber“ – sonst der volle Name
    if (/^(WEG|Hausverwaltung|Wohnbau)/.test(name)) return "";
    if (/^Familie /.test(name)) return name;
    var t = name.split(" "), nach = t.slice(1).join(" ");
    return FRAU.test(name) ? "Frau " + nach : HERR.test(name) ? "Herr " + nach : name;
  }
  function gruss(name, wa) { var n = anredeName(name); return (wa ? "Hallo" : "Guten Tag") + (n ? " " + n : ""); }
  function kiNachricht(l, art) {
    var a = gruss(l.name), w = gruss(l.name, true), b = "„" + l.betreff + "“", vor = l.name.split(" ")[0] === "Familie" ? l.name : l.name.split(" ")[0];
    var sig = signatur(), ich = absender(), wsig = "\nViele Grüße, " + ich[1] + " (" + BETRIEB + ")";
    var weit = /km/.test(l.kiText || "") && /Anfahrt|lohnt/.test(l.kiText || "");
    var T = {
      eingang: { betreff: "Ihre Anfrage: " + l.betreff,
        mail: [a + ",\n\n" + (l.dringend ? "Ihre Nachricht ist angekommen. Das klingt dringend, deshalb rufe ich Sie heute bis 12 Uhr an. Dann machen wir gleich einen Termin aus." : "danke für Ihre Nachricht" + (/Foto/.test(l.kiText || "") ? " und die Fotos" : "") + ". Ich würde mir das gern vor Ort anschauen. Passt Ihnen Donnerstag um 9 Uhr oder Freitag um 14 Uhr?") + sig,
               a + ",\n\n" + (l.dringend ? "danke, dass Sie sich gleich gemeldet haben. Ich habe Ihre Anfrage zu " + b + " vor mir liegen und rufe Sie heute Vormittag an. Bis dahin gilt: Wenn etwas schlimmer wird, rufen Sie uns bitte direkt an." :
                 "danke für Ihre Anfrage zu " + b + ". Damit das Angebot nachher wirklich passt, schaue ich mir das kurz bei Ihnen an. Das dauert etwa eine halbe Stunde.\n\nFrei hätte ich:\n– Donnerstag, 9:00 Uhr\n– Freitag, 14:00 Uhr\n\nSchreiben Sie mir einfach, was Ihnen lieber ist. Wenn beides nicht klappt, finden wir einen anderen Termin.") + sig],
        wa: [w + ", danke für die Nachricht! " + (l.dringend ? "Ich rufe Sie heute bis 12 Uhr an." : "Passt Ihnen Do um 9 oder Fr um 14 Uhr? Dann schau ich mir das vor Ort an.") + wsig,
             w + ", Ihre Anfrage ist bei mir angekommen. " + (l.dringend ? "Ich melde mich heute Vormittag telefonisch, versprochen." : "Wann darf ich kurz vorbeikommen? Donnerstag 9 Uhr oder Freitag 14 Uhr wären frei.") + wsig] },
      absage: { betreff: "Ihre Anfrage: " + l.betreff,
        mail: [a + ",\n\ndanke, dass Sie an uns gedacht haben. " + (weit ? "Für diese Arbeit sind wir leider zu weit weg – die Anfahrt würde Sie mehr kosten als die Reparatur selbst." : "Diesen Auftrag schaffen wir leider gerade nicht zeitnah, wir sind gut ausgelastet.") + " Wenn Sie möchten, nenne ich Ihnen gern einen Betrieb in Ihrer Nähe." + sig,
               a + ",\n\nich sage es lieber gleich ehrlich: " + b + " können wir gerade nicht übernehmen. " + (weit ? "Der Weg nach " + l.ort + " ist für so einen Auftrag einfach zu weit." : "Wir sind die nächsten Wochen voll.") + " Ein Kollege aus der Gegend kann Ihnen sicher schneller helfen – soll ich Ihnen einen Kontakt schicken?" + sig],
        wa: [w + ", danke für die Anfrage. " + (weit ? "Ehrlich gesagt sind wir für so einen kleinen Auftrag zu weit weg, das würde für Sie unnötig teuer." : "Wir schaffen das leider gerade nicht zeitnah.") + " Soll ich Ihnen einen Betrieb in der Nähe nennen?" + wsig,
             w + ", leider können wir " + b + " gerade nicht übernehmen. Gern schicke ich Ihnen einen Kontakt aus Ihrer Gegend." + wsig] },
      nachfassen: { betreff: (l.erinnert ? "Kurze Nachfrage" : "Ihr Angebot") + ": " + l.betreff, anhang: "Angebot_" + vor.replace(/\s+/g, "_").replace("Familie_", "") + ".pdf",
        mail: [[a + ",\n\nhaben Sie unser Angebot gut bekommen? Wenn noch etwas unklar ist oder Sie etwas ändern möchten, sagen Sie einfach Bescheid. Ich kann Sie auch kurz anrufen." + sig,
                a + ",\n\nich melde mich noch einmal wegen " + b + ". Oft passt nicht alles auf Anhieb – beim Material oder beim Zeitraum haben wir Spielraum. Was meinen Sie?" + sig,
                a + ",\n\nkurze Info: Ende des Monats hätte ich noch ein paar Tage frei. Wenn Sie " + b + " dann machen lassen möchten, halte ich Ihnen den Termin gern frei. Ein kurzes Ja per Mail reicht." + sig][Math.min(l.erinnert || 0, 2)],
               a + ",\n\nwenn Sie möchten, gehen wir das Angebot zu " + b + " in zehn Minuten am Telefon zusammen durch. Meistens sind Fragen so am schnellsten geklärt. Wann passt es Ihnen?" + sig],
        wa: [w + ", kurze Nachfrage zum Angebot " + b + ": Passt alles, oder sollen wir noch etwas ändern?" + wsig,
             w + ", Ende des Monats wäre bei uns noch etwas frei. Soll ich Ihnen den Termin für " + b + " reservieren?" + wsig] },
      bewertung: { betreff: "Danke für Ihren Auftrag",
        mail: [a + ",\n\nschön, dass wir " + b + " für Sie machen durften. Wir würden uns über Ihre ehrliche Meinung bei Google freuen, ein paar Sätze reichen:\nhttps://g.page/r/musterbetrieb/review\n\nUnd wenn etwas nicht gepasst hat, sagen Sie es mir bitte direkt. Dann kümmern wir uns darum." + sig,
               a + ",\n\nnoch einmal danke für Ihr Vertrauen. Wenn Sie zwei Minuten Zeit haben: Eine Bewertung bei Google hilft einem kleinen Betrieb wie unserem sehr.\nhttps://g.page/r/musterbetrieb/review" + sig],
        wa: [w + ", danke noch mal für den Auftrag! Wenn Sie mögen, schreiben Sie uns ein paar ehrliche Sätze bei Google: https://g.page/r/musterbetrieb/review" + wsig,
             w + ", ist alles in Ordnung? Falls ja, würde uns eine kurze Google-Bewertung sehr helfen: https://g.page/r/musterbetrieb/review" + wsig] },
      termin: { betreff: "Termin: " + l.betreff,
        mail: [a + ",\n\ndanke für den Auftrag! Wir fangen wie besprochen am Montag um 8 Uhr an. Alex ruft Sie kurz vorher an. Wenn Sie den Arbeitsbereich vorher ein bisschen frei räumen, sparen wir uns allen Zeit." + sig,
               a + ",\n\nder Termin steht: Montag, 8 Uhr. Am Sonntag schicke ich Ihnen noch eine kurze Erinnerung." + sig],
        wa: [w + ", danke für den Auftrag! Wir starten Montag um 8 Uhr, Alex meldet sich vorher kurz." + wsig,
             w + ", Termin steht: Montag 8 Uhr. Am Vortag kommt eine kurze Erinnerung." + wsig] }
    }[art];
    return { von: ich[0] + " · " + BETRIEB, vonMail: "info@musterbetrieb.de", an: l.name, anMail: l.mail, anTel: l.tel, betreff: T.betreff, anhang: T.anhang, mail: T.mail, wa: T.wa, kanal: l.kanal === "whatsapp" ? "wa" : "mail" };
  }
  function nachfassText(l) {
    return gruss(l.name) + ",\n\nhaben Sie unser Angebot für „" + l.betreff + "“ gut bekommen? Wenn noch etwas unklar ist oder Sie etwas ändern möchten, sagen Sie einfach Bescheid. Ich kann Sie auch kurz anrufen." + signatur();
  }
  function viewNachfassen() {
    var list = offeneAngebote().slice().sort(function (a, b) { return b.angebotVor - a.angebotVor; });
    $main.innerHTML =
      '<div class="view-head"><div><h1>Nachfassen</h1><p>Offene Angebote werden automatisch und freundlich nachgefasst.</p></div></div>' +
      '<div class="panel-grid">' +
        '<section class="panel" id="auto"><div class="switch-row"><div><h2 style="margin:0">Automatisch nachfassen</h2>' +
          "<p>Erinnerungen nach " + NACHFASS_TAGE.join(", ").replace(/, (\d+)$/, " und $1") + " Tagen – per WhatsApp oder E-Mail, je nachdem, wie der Kunde angefragt hat.</p></div>" +
          '<label class="switch"><input type="checkbox" id="auto-switch"' + (state.autoNachfassen ? " checked" : "") + ' aria-label="Automatisch nachfassen"><span></span></label></div></section>' +
        '<div class="rows" id="nachfass-liste">' +
          (list.length ? list.map(function (l) {
            var next = NACHFASS_TAGE[l.erinnert];
            var due = next !== undefined && l.angebotVor >= next;
            var steps = NACHFASS_TAGE.map(function (_, i) { return '<i class="' + (i < l.erinnert ? "on" : "") + '"></i>'; }).join("");
            var info = next === undefined ? "Alle Erinnerungen gesendet – jetzt anrufen" : due ? "Erinnerung " + (l.erinnert + 1) + " heute fällig" : "Nächste Erinnerung in " + (next - l.angebotVor) + " Tagen";
            return '<div class="row"><div class="row-main"><strong>' + esc(l.name) + " · " + esc(l.betreff) + "</strong>" +
              "<small>Angebot vor " + l.angebotVor + " Tagen · " + info + "</small>" + erinnerungZeile(l) + "</div>" +
              '<div class="row-side"><span class="steps" title="Gesendete Erinnerungen">' + steps + "</span>" +
              '<span class="amount">' + euro.format(l.wert) + "</span>" +
              '<button class="btn-mini' + (due ? " primary" : "") + '" type="button" data-open="' + l.id + '" data-act="nachfassen">Jetzt nachfassen</button></div></div>';
          }).join("") : '<p class="col-empty">Keine offenen Angebote.</p>') +
        "</div>" +
        '<section class="panel"><h2>So sieht eine Erinnerung aus</h2><div class="template">' + esc(list[0] ? nachfassText(list[0]) : nachfassText({ name: "Familie Muster", betreff: "Badsanierung" })) + "</div></section>" +
      "</div>";
    document.getElementById("auto-switch").addEventListener("change", function (e) {
      state.autoNachfassen = e.target.checked;
      toast(state.autoNachfassen ? "Automatisches Nachfassen ist eingeschaltet." : "Automatisches Nachfassen ist ausgeschaltet.");
      renderNav();
    });
  }

  /* --- Kunden --- */
  document.addEventListener("change", function (e) { if (e.target.id === "ksort") { state.kundenSort = e.target.value; viewKunden(); } });
  function viewKunden() {
    var q = state.suche.toLowerCase();
    var ausLeads = state.leads.map(function (l) {
      return { name: l.name, ort: l.ort, art: l.stage === "auftrag" || l.stage === "erledigt" ? "bestand" : "anfrage",
               info: l.betreff + " · " + STAGES.filter(function (s) { return s.id === l.stage; })[0].label, leadId: l.id,
               umsatz: l.stage === "auftrag" || l.stage === "erledigt" ? l.wert : 0 };
    });
    var alle = ausLeads.concat(state.kunden.map(function (k, i) { return Object.assign({ idx: i }, k); }));
    alle.forEach(function (k) { var P = profilVon(k.name); k.P = P; k.gesamt = P.auftraege.reduce(function (s2, a) { return s2 + a[2]; }, 0) || k.umsatz || 0;
      k.wartung = P.geraete.some(function (g) { return /diese Woche|Tagen/.test(g[4]); }); k.gewaehr = P.ideen.some(function (x) { return /Gewährleistung/.test(x[0]); }); });
    var list = alle.filter(function (k) {
      var f2 = state.kundenFilter;
      return (f2 === "alle" || k.art === f2 || (f2 === "wartung" && k.wartung) || (f2 === "gewaehr" && k.gewaehr)) && (!q || (k.name + " " + k.ort).toLowerCase().indexOf(q) > -1);
    });
    if (state.kundenSort === "umsatz") list.sort(function (a, b) { return b.gesamt - a.gesamt; });
    if (state.kundenSort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "de"); });
    var f = [["alle", "Alle"], ["bestand", "Bestandskunden"], ["alt", "Alte Angebote"], ["anfrage", "Interessenten"], ["wartung", "Wartung fällig"], ["gewaehr", "Gewährleistung endet"]]
      .map(function (x) { return '<button type="button" data-kfilter="' + x[0] + '" aria-pressed="' + (state.kundenFilter === x[0]) + '">' + x[1] + "</button>"; }).join("");

    $main.innerHTML =
      '<div class="view-head"><div><h1>Kunden</h1><p>Alle Kunden an einem Ort – und alte Angebote, die sich wieder lohnen.</p></div><div class="view-actions"><button class="btn btn-signal" type="button" data-kunde-neu>+ Neuer Kunde</button></div></div>' +
      '<div class="toolbar"><input class="search" id="ksuche" type="search" placeholder="Kunden suchen …" aria-label="Kunden durchsuchen" value="' + esc(state.suche) + '">' +
        '<div class="filter" role="group" aria-label="Kunden filtern">' + f + "</div>" +
        '<label class="kp-sort">Sortieren <select id="ksort"><option value="">zuletzt aktiv</option><option value="umsatz"' + (state.kundenSort === "umsatz" ? " selected" : "") + '>nach Umsatz</option><option value="name"' + (state.kundenSort === "name" ? " selected" : "") + ">nach Name</option></select></label></div>" +
      '<div class="rows" id="kunden-liste">' +
        list.map(function (k) {
          var btn = "";
          if (k.leadId) btn = "";
          else if (k.erledigt) btn = '<span class="pill ok">' + svg(ICON.check) + "Gesendet</span>";
          else btn = '<button class="btn-mini primary" type="button" data-kunde="' + k.idx + '">' + k.aktion + "</button>";
          btn += '<button class="btn-mini' + (k.leadId ? " primary" : "") + '" type="button" data-akte-open="' + esc(k.name) + '">Kundenakte</button>';
          var tag = k.art === "alt" ? '<span class="pill check">Reaktivierbar</span>' : k.art === "bestand" ? '<span class="pill ok">Bestandskunde</span>' : '<span class="pill">Interessent</span>';
          var letzter = k.P.auftraege[0];
          var ini = k.name.replace(/^Familie /, "").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2);
          return '<div class="row kd-zeile"><div class="row-main"><span class="kd-av">' + esc(ini) + '</span><div><strong>' + esc(k.name) + "</strong><small>" + esc(k.ort) + " · " + esc(k.info) + "</small>" +
            '<span class="kd-meta">' + (letzter ? "<span>Letzter Auftrag: " + esc(letzter[0]) + " (" + letzter[1] + ")</span>" : "") + "<span>Kunde seit " + k.P.seit + "</span>" +
            (k.wartung ? '<span class="kd-hinweis">Wartung fällig</span>' : "") + (k.gewaehr ? '<span class="kd-hinweis">Gewährleistung endet</span>' : "") + "</span></div></div>" +
            '<div class="row-side">' + tag + (k.gesamt ? '<span class="amount" title="Umsatz gesamt">' + euro.format(k.gesamt) + "</span>" : "") + btn + "</div></div>";
        }).join("") +
      "</div>";
    var input = document.getElementById("ksuche");
    input.addEventListener("input", function () {
      state.suche = input.value;
      var pos = input.selectionStart;
      viewKunden();
      var again = document.getElementById("ksuche");
      again.focus(); again.setSelectionRange(pos, pos);
    });
  }

  /* =====================================================================
     4. DETAIL-ANSICHT EINER ANFRAGE
     ===================================================================== */
  var lastFocus = null;
  function openLead(id, act) {
    var l = state.leads.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    if (act === "nachfassen" || act === "bewertung") act = "zeigen";   // erst die Nachricht zeigen, gesendet wird nach Freigabe
    closeDrawer();
    lastFocus = document.activeElement;

    var stage = STAGES.filter(function (s) { return s.id === l.stage; })[0].label;
    var actions = "";
    if (l.stage === "neu" && l.vermittelt && !l.angenommen) actions = btn("vm-an", "Vermittelten Auftrag annehmen", "btn-signal") + btn("vm-ab", "Ablehnen – geht an einen anderen Betrieb", "btn-outline");
    else if (l.stage === "neu") actions = (angebotVon(l.id) ? btn("angebot-oeffnen", "Angebotsentwurf öffnen", "btn-signal") : btn("angebot-erstellen", "Angebot erstellen", "btn-signal") + btn("foto-angebot", "Angebot aus den Fotos schätzen", "btn-outline")) + btn("anrufen", "Termin vereinbaren", "btn-outline") + btn("anfrage-bearbeiten", "Anfrage bearbeiten", "btn-outline");
    if (l.stage === "angebot") actions = btn("vorort", "Auftrag vor Ort unterschreiben lassen", "btn-signal") + btn("nachfassen", "Jetzt nachfassen", "btn-outline") + btn("auftrag", "Auftrag erhalten (Papier oder Portal)", "btn-outline");
    if (l.stage === "angebot") actions += btn("angebot-oeffnen", "Angebot ansehen", "btn-outline");
    if (l.stage === "auftrag") actions = btn("auftrag-oeffnen", "Auftrag öffnen", "btn-signal") + btn("erledigt", "Als erledigt markieren", "btn-outline");
    if (l.stage === "erledigt") actions = l.bewertung === "offen" ? btn("bewertung", "Um Google-Bewertung bitten", "btn-signal") : '<p class="pill ok" style="justify-self:start">' + svg(ICON.star) + (l.bewertung === "erhalten" ? "Bewertung erhalten" : "Bewertungsanfrage gesendet") + "</p>";

    var verlauf = l.verlauf.slice().sort(function (a, b) { return b.t - a.t; });

    var back = document.createElement("div");
    back.className = "drawer-backdrop";
    back.addEventListener("click", closeDrawer);
    var d = document.createElement("div");
    d.className = "drawer";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-labelledby", "drawer-title");
    d.innerHTML =
      '<div class="drawer-head"><div><h2 id="drawer-title">' + esc(l.name) + "</h2>" +
        '<div class="lead-meta"><span class="pill ok">' + stage + "</span>" + (l.dringend ? '<span class="pill urgent">Dringend</span>' : "") +
        '<span class="pill">' + svg(KANAL[l.kanal].icon) + KANAL[l.kanal].label + "</span></div></div>" +
        '<button class="icon-btn" type="button" data-close aria-label="Schließen">' + svg(ICON.x) + "</button></div>" +
      '<div class="facts">' +
        fact("Auftrag", l.betreff) + fact("Ort", l.ort) + fact("Telefon", l.tel) + fact("E-Mail", l.mail) +
        fact("Eingegangen", vorTagen(l.tage)) + fact(l.stage === "neu" ? "Geschätzter Wert" : "Auftragswert", euro.format(l.wert)) +
        fact("Quelle", KANAL[l.kanal] ? KANAL[l.kanal].label : "–") + fact("Verantwortlich", l.verantwortlich || "Sabine (Büro)") +
      "</div>" +
      (l.vermittelt ? (function () {
        var vmv = state.vm.filter(function (x) { return x.id === l.vmId; })[0] || {};
        var rp = l.angenommen && vmv.status === "angenommen" ?
          '<div class="vm-rp"><label for="rp-wert"><b>Richtpreis aus den Fotos</b> – erst wenn der Kunde zustimmt, fahren Sie raus</label><div class="vm-rp-row"><input id="rp-wert" type="number" step="100" value="' + Math.round(typVon(vmv) * 1.05 / 100) * 100 + '"><span>€</span><button class="btn-mini primary" type="button" data-rp-senden="' + l.id + '">Richtpreis senden</button></div><small>Portal-Orientierung für den Kunden: typisch ' + euro.format(typVon(vmv)) + " (" + euro.format(vmv.von) + "–" + euro.format(vmv.bis) + ")</small></div>" :
          vmv.status === "richtpreis" ? '<p><span class="pill check">Richtpreis ' + euro.format(vmv.richtpreis) + " gesendet – Kunde prüft</span></p>" :
          vmv.status === "besichtigung" ? '<p><span class="pill ok">Kunde hat den Richtpreis ' + euro.format(vmv.richtpreis) + " bestätigt – Besichtigung vereinbaren</span></p>" : "";
        var rm = l.angenommen && ["angenommen", "richtpreis", "besichtigung", "angebot"].indexOf(vmv.status) > -1 ?
          '<div class="vm-rm"><small>Lief nicht? Kurze Rückmeldung (keine Provision):</small><span class="run-btns"><button class="btn-mini" type="button" data-rm="nicht erreichbar">Nicht erreichbar</button><button class="btn-mini" type="button" data-rm="nur Preisvergleich">Nur Preisvergleich</button><button class="btn-mini" type="button" data-rm="unseriös">Unseriös</button></span></div>' : "";
        return '<div class="vm-box"><b>' + svg(KANAL.portal.icon) + "Über das Auftragsportal vermittelt" + (vmv.note ? ' <span class="pill ' + NOTE[vmv.note][1] + '">Note ' + vmv.note + "</span>" : "") + "</b><p>" + (l.angenommen ? "Angenommen – nennen Sie dem Kunden zuerst einen Richtpreis." : "Bitte innerhalb von 24 Stunden annehmen oder ablehnen.") +
          " Provision nur bei Auftrag: 5 % vom Nettoauftragswert, mindestens 75 €, unter 500 € frei.</p>" + rp + rm + "</div>";
      })() : "") +
      (l.denkt ? '<div class="ki-box"><h3><span class="pill thinking">KI prüft …</span></h3><p>Die Anfrage wird gerade zusammengefasst.</p></div>' :
      '<div class="ki-box"><h3>' + svg(ICON.spark, "") .replace("<svg", '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2"') + 'KI-Einschätzung <span class="pill ' + KI[l.ki].cls + '">' + KI[l.ki].label.replace("KI: ", "") + "</span></h3>" +
        "<p>" + esc(l.kiText) + '</p><p class="rec">' + esc(l.kiRec) + "</p></div>") +
      '<div><p class="sec-title">Nachricht des Kunden</p><p class="quote">' + esc(l.nachricht) + "</p></div>" +
      (function () {
        if (l.denkt || l.vermittelt) return "";
        var art = l.stage === "neu" ? (l.beantwortet ? null : l.ki === "passtnicht" ? "absage" : "eingang") : l.stage === "angebot" ? (l.erinnert < NACHFASS_TAGE.length ? "nachfassen" : null) :
          l.stage === "auftrag" ? (l.bestaetigt ? null : "termin") : l.stage === "erledigt" && l.bewertung === "offen" ? "bewertung" : null;
        if (!art) return "";
        var o = kiNachricht(l, art);
        o.titel = { eingang: "Antwortvorschlag der KI", absage: "Absage – von der KI vorbereitet", nachfassen: (l.erinnert + 1) + ". Erinnerung – von der KI vorbereitet", bewertung: "Bewertungsbitte – von der KI vorbereitet", termin: "Terminbestätigung – von der KI vorbereitet" }[art];
        o.senden = function (text, kanal) {
          var wie = kanal === "wa" ? "WhatsApp" : "E-Mail";
          if (art === "nachfassen") return nachfassen(l, false);
          if (art === "bewertung") { bewertung(l); return openLead(l.id); }
          if (art === "eingang" || art === "absage") { l.beantwortet = true; add(l, (art === "absage" ? "Absage" : "Antwort mit Terminvorschlag") + " per " + wie + " gesendet"); protokoll((art === "absage" ? "Absage" : "Antwort") + " an " + l.name + " gesendet (von Ihnen freigegeben)"); }
          if (art === "termin") { l.bestaetigt = true; add(l, "Terminbestätigung per " + wie + " gesendet"); }
          toast(wie + " an " + l.name + " gesendet (Demo)."); render(); openLead(l.id);
        };
        return '<div id="mv-anker">' + MailVorschau.html(o) + "</div>";
      })() +
      '<div><p class="sec-title">Kundenakte <button class="btn-mini" type="button" data-akte-open="' + esc(l.name) + '" style="margin-left:8px">Alle Vorgänge öffnen →</button></p>' + akteHtml(l.name) + "</div>" +
      '<div><p class="sec-title">Verlauf</p><ul class="timeline">' +
        verlauf.map(function (e) { return "<li>" + esc(e.text) + "<small>" + vorTagen(e.t) + "</small></li>"; }).join("") + "</ul></div>" +
      '<div class="drawer-actions">' + actions + (darf("loeschen") && (l.stage === "neu" || l.stage === "angebot") ? btn("anfrage-loeschen", "Anfrage löschen", "btn-outline danger") : "") + (l.stage !== "neu" ? btn("anfrage-bearbeiten", "Kontaktdaten bearbeiten", "btn-outline") : "") + "</div>";

    document.body.appendChild(back);
    document.body.appendChild(d);
    document.body.style.overflow = "hidden";
    d.querySelector("[data-close]").focus();
    if (window.MailVorschau) MailVorschau.start(d);
    if (act === "zeigen") { var mva = d.querySelector("#mv-anker"); if (mva) setTimeout(function () { mva.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80); }

    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-do]");
      if (e.target.closest("[data-close]")) return closeDrawer();
      var vmr = l.vmId ? state.vm.filter(function (x) { return x.id === l.vmId; })[0] : null;
      if (e.target.closest("[data-rp-senden]") && vmr) {
        vmr.richtpreis = Math.max(0, +document.getElementById("rp-wert").value || 0); vmr.status = "richtpreis";
        add(l, "Richtpreis " + euro.format(vmr.richtpreis) + " an den Kunden gesendet"); protokoll(BETRIEB + ": Richtpreis " + euro.format(vmr.richtpreis) + " an " + l.name);
        toast("Richtpreis gesendet. Der Kunde bestätigt im Portal – erst dann fahren Sie raus.");
        setTimeout(function () { if (vmr.status !== "richtpreis") return; vmr.status = "besichtigung"; vmr.hinweis = "Richtpreis " + euro.format(vmr.richtpreis) + " bestätigt"; add(l, "Kunde hat den Richtpreis bestätigt – Besichtigung vereinbaren"); toast(l.name + " hat den Richtpreis bestätigt – jetzt Besichtigung vereinbaren."); if (document.querySelector(".drawer")) openLead(l.id); else render(); }, 1800);
        render(); return openLead(l.id);
      }
      var rmb = e.target.closest("[data-rm]");
      if (rmb && vmr) { vmr.status = "verloren"; vmr.hinweis = "Rückmeldung: " + rmb.getAttribute("data-rm"); state.leads = state.leads.filter(function (x) { return x !== l; }); protokoll("Rückmeldung von " + BETRIEB + " zu " + l.name + ": " + rmb.getAttribute("data-rm")); closeDrawer(); render(); return toast("Danke für die Rückmeldung – keine Provision. Solche Anfragen werden künftig schlechter bewertet."); }
      if (!b) return;
      var what = b.getAttribute("data-do");
      if (what === "angebot") { l.stage = "angebot"; l.angebotVor = 0; l.erinnert = 0; l.dringend = false; add(l, "Angebot über " + euro.format(l.wert) + " gesendet"); toast("Angebot an " + l.name + " gesendet. Erinnerungen laufen automatisch."); }
      if (what === "angebot-erstellen" || what === "angebot-oeffnen") { var an0 = angebotVon(l.id) || angebotNeu(l); closeDrawer(); state.angebotSel = an0.id; state.view = "angebote"; render(); window.scrollTo(0, 0); return; }
      if (what === "foto-angebot") { fotoAngebot(l, b); return; }
      if (what === "auftrag-oeffnen") { ketteSync(); var au0 = auftragVon(l.id); closeDrawer(); state.auftragSel = au0 ? au0.id : null; state.view = "auftraege"; render(); window.scrollTo(0, 0); return; }
      if (what === "anfrage-bearbeiten") { closeDrawer(); return anfrageFormular(l); }
      if (what === "anfrage-loeschen") return anfrageLoeschen(l);
      if (what === "anrufen") { add(l, "Termin vereinbart"); l.dringend = false; toast("Termin mit " + l.name + " eingetragen."); }
      if (what === "nachfassen") { var mva2 = d.querySelector("#mv-anker"); if (mva2) return mva2.scrollIntoView({ behavior: "smooth", block: "start" }); return nachfassen(l, false); }
      if (what === "vorort") return unterschreibenOeffnen(l.id);
      var vmx = l.vmId ? state.vm.filter(function (x) { return x.id === l.vmId; })[0] : null;
      if (what === "vm-an" && vmx) { l.angenommen = true; vmx.status = "angenommen"; vmx.hinweis = "meldet sich beim Kunden"; add(l, "Vermittelten Auftrag angenommen"); protokoll(BETRIEB + " hat die vermittelte Anfrage von " + l.name + " angenommen"); toast("Angenommen. " + l.name + " bekommt Ihre Kontaktdaten und weiß, dass Sie sich melden."); }
      if (what === "vm-ab" && vmx) { vmx.status = "neu"; vmx.partner = null; vmx.abgelehnt = true; state.leads = state.leads.filter(function (x) { return x !== l; }); protokoll(BETRIEB + " hat die Anfrage von " + l.name + " abgelehnt – zurück an den Betreiber"); closeDrawer(); render(); return toast("Abgelehnt – die Anfrage geht an einen anderen Betrieb. Keine Kosten für Sie."); }
      if (what === "auftrag") { l.stage = "auftrag"; add(l, "Auftrag erhalten · Rechnung vorbereitet"); toast("Auftrag erhalten! Die Rechnung ist schon vorbereitet."); }
      if (what === "erledigt") { l.stage = "erledigt"; l.bewertung = "offen"; add(l, "Arbeiten abgeschlossen · Rechnung gestellt"); toast("Erledigt. Tipp: Jetzt um eine Bewertung bitten."); }
      if (what === "bewertung") bewertung(l);
      render(); openLead(l.id);
    });
  }
  function btn(act, label, cls) { return '<button class="btn ' + cls + '" type="button" data-do="' + act + '">' + label + "</button>"; }
  function fact(k, v) { return '<div class="fact"><span>' + k + "</span><b>" + esc(v) + "</b></div>"; }
  function add(l, text) { l.verlauf.push({ t: 0, text: text }); }

  function nachfassen(l, ausListe) {
    if (l.erinnert < NACHFASS_TAGE.length) l.erinnert++;
    add(l, l.erinnert + ". Erinnerung per " + (l.kanal === "whatsapp" ? "WhatsApp" : "E-Mail") + " gesendet");
    protokoll(l.erinnert + ". Erinnerung an " + l.name + " gesendet (von Ihnen freigegeben)");
    toast("Erinnerung an " + l.name + " gesendet (Demo – es wurde nichts verschickt).");
    render();
    if (!ausListe) openLead(l.id);
  }
  function bewertung(l) {
    l.bewertung = "angefragt";
    protokoll("Bitte um Google-Bewertung an " + l.name + " gesendet");
    add(l, "Bitte um Google-Bewertung gesendet");
    toast("Bewertungsanfrage an " + l.name + " gesendet (Demo).");
    render();
  }
  function closeDrawer() {
    document.querySelectorAll(".drawer, .drawer-backdrop").forEach(function (el) { el.remove(); });
    document.body.style.overflow = "";
    konf = null;
    if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* alter Browser */ } }
  }
  // Jedes X und jedes „Abbrechen“ (data-close) schließt das Fenster – zentral, damit kein Fenster hängen bleibt
  document.addEventListener("click", function (e) {
    var c = e.target.closest && e.target.closest("[data-close]");
    if (!c || !c.closest(".drawer")) return;
    e.preventDefault(); e.stopPropagation(); closeDrawer();
  }, true);

  /* =====================================================================
     5. NEUE ANFRAGE SIMULIEREN (zeigt die KI-Vorprüfung)
     ===================================================================== */
  function simulieren() {
    var vorlage = NEUE_ANFRAGEN[state.pool % NEUE_ANFRAGEN.length];
    state.pool++;
    var l = Object.assign({}, vorlage, { id: Date.now(), stage: "neu", tage: 0, denkt: true, frisch: true, ankunft: Date.now() });
    l.verlauf = [{ t: 0, text: "Anfrage per " + KANAL[l.kanal].label + " eingegangen" }];
    state.leads.unshift(l);
    protokoll("Anfrage per " + KANAL[l.kanal].label + " von " + l.name + " erfasst, Eingangsbestätigung gesendet");
    toast("Neue Anfrage per " + KANAL[l.kanal].label + ": " + l.name + " – die KI prüft …");
    if (window.Glocke) Glocke.push("anfrage", "Neue Anfrage per " + KANAL[l.kanal].label + ": " + l.name, l.betreff, "anfragen");
    if (state.view !== "anfragen") state.view = "anfragen";
    state.stageM = "neu";
    render();
    setTimeout(function () {
      l.denkt = false;
      add(l, "KI-Vorprüfung: " + KI[l.ki].label.replace("KI: ", ""));
      protokoll("KI-Vorprüfung " + l.name + ": " + KI[l.ki].label.replace("KI: ", ""));
      if (state.view === "anfragen" && !document.querySelector(".drawer")) render();
      toast("KI-Einschätzung fertig: " + l.betreff + " – " + KI[l.ki].label.replace("KI: ", "") + ".");
    }, 1800);
  }

  /* =====================================================================
     7. WEITERE MODULE (Rechnungen, Termine, Ausschreibungen, Netzwerk, Personal)
     Alle Daten sind erfunden. Ändern Sie sie hier.
     ===================================================================== */
  var RECHNUNGEN = [
    { nr: "RE-2026-118", name: "Familie Brandl", betrag: 11600, faellig: -2, status: "offen" },
    { nr: "RE-2026-112", name: "Johann Forster", betrag: 1480, faellig: 9, status: "offen", erinnert: 0 },
    { nr: "RE-2026-109", name: "Hausverwaltung Kaya", betrag: 900, faellig: 16, status: "offen", erinnert: 1 },
    { nr: "RE-2026-115", name: "Familie Obermeier", betrag: 16900, faellig: 0, status: "bezahlt", info: "Zahlung heute zugeordnet" },
    { nr: "RE-2026-111", name: "Georg Hofbauer", betrag: 380, faellig: 0, status: "bezahlt", info: "Zahlung gestern zugeordnet" }
  ];
  // Finanz-Cockpit: Beispieldaten (Belege werden fotografiert und an den Steuerberater übertragen)
  var BELEGE = [
    { name: "Großhandel Heizung & Sanitär", info: "Material Baustelle Brandl", betrag: 2840, tage: 0, st: "neu" },
    { name: "Tankstelle", info: "Diesel Firmenwagen", betrag: 96, tage: 1, st: "neu" },
    { name: "Baumarkt", info: "Kleinmaterial, Dichtungen", betrag: 54, tage: 2, st: "neu" },
    { name: "Mobilfunk", info: "Diensthandys Oktober", betrag: 78, tage: 5, st: "uebertragen" },
    { name: "Werkzeugverleih", info: "Kernbohrgerät, 2 Tage", betrag: 165, tage: 8, st: "uebertragen" }
  ];
  var AUSGABEN = [["Löhne und Sozialabgaben", 14200], ["Material und Großhandel", 7900], ["Fahrzeuge und Tanken", 1350], ["Miete Werkstatt", 950], ["Versicherungen, Telefon, Software", 820]];
  var TERMINE = [
    { tag: "Heute", zeit: "07:15", art: "Lager", name: "Material laden", ort: "Werkstatt", wer: "Alex", info: "Abgasrohr, Kondensatpumpe, Dichtungen", typ: "lager" },
    { tag: "Heute", zeit: "08:00", art: "Ausführung", name: "Familie Brandl", ort: "Erlangen", wer: "Alex, Robin", info: "Heizungstausch, Tag 2 von 3", typ: "regie" },
    { tag: "Heute", zeit: "12:30", art: "Kundendienst", name: "Max Lechner", ort: "Uttenreuth", wer: "Alex", info: "Küchenarmatur tropft, Kleinreparatur", typ: "regie", offen: true },
    { tag: "Heute", zeit: "14:00", art: "Wartung", name: "Anton Wagner", ort: "Heroldsberg", wer: "Alex", info: "Wartung Ölheizung laut Vertrag", typ: "wartung", offen: true },
    { tag: "Heute", zeit: "14:30", art: "Besichtigung", name: "Familie Huber", ort: "Erlangen", wer: "Stefan (Außendienst)", info: "Badsanierung, Fotos liegen vor", offen: true },
    { tag: "Heute", zeit: "16:00", art: "Aufmaß", name: "Familie Huber", ort: "Erlangen", wer: "Alex, Stefan (Außendienst)", info: "Aufmaß Bad und Gäste-WC nach der Besichtigung", typ: "aufmass" },
    { tag: "Morgen", zeit: "07:30", art: "Ausführung", name: "Familie Brandl", ort: "Erlangen", wer: "Alex, Robin", info: "Heizungstausch, Tag 3 von 3, Inbetriebnahme", typ: "regie" },
    { tag: "Morgen", zeit: "09:00", art: "Wartung", name: "Georg Hofbauer", ort: "Erlangen", wer: "Robin", info: "Jährliche Wartung Gasheizung" },
    { tag: "Morgen", zeit: "13:00", art: "Notdienst", name: "Thomas Bauer", ort: "Fürth", wer: "Alex", info: "Heizung ausgefallen", offen: true, typ: "regie" },
    { tag: "Morgen", zeit: "15:30", art: "Abnahme", name: "Wohnbau Fürth, Whg. 4", ort: "Fürth", wer: "Alex", info: "Abnahme mit der Hausverwaltung", typ: "abnahme" },
    { tag: "Donnerstag", zeit: "10:00", art: "Besichtigung", name: "WEG Regnitzstraße 12", ort: "Erlangen", wer: "Stefan (Außendienst)", info: "Strangsanierung, 18 Einheiten" },
    { tag: "Donnerstag", zeit: "07:00", art: "Intern", name: "Teambesprechung", ort: "Werkstatt", wer: "Alex, Robin, Stefan (Außendienst)", info: "Wochenplanung, Material, Urlaub", typ: "lager" },
    { tag: "Freitag", zeit: "08:00", art: "Ausführung", name: "Andrea Kraus", ort: "Uttenreuth", wer: "Robin", info: "Heizkörper tauschen, 3 Räume" },
    { tag: "Freitag", zeit: "13:30", art: "Besichtigung", name: "Petra Schmid", ort: "Zirndorf", wer: "Stefan (Außendienst)", info: "Wärmepumpe statt Ölheizung" }
  ];
  var AUSSCHREIBUNGEN = [
    { titel: "Sanierung Sanitäranlagen Grundschule", stelle: "Stadt Erlangen", ort: "Erlangen", frist: 12, wert: "ca. 85.000 €", eignung: "passt", grund: "Gewerk, Region und Auftragsgröße passen. Referenzen aus Badsanierungen vorhanden." },
    { titel: "Austausch Heizungsanlage Feuerwehrhaus", stelle: "Gemeinde Uttenreuth", ort: "Uttenreuth", frist: 19, wert: "ca. 40.000 €", eignung: "passt", grund: "Passt gut zu Ihren Heizungsaufträgen, kurze Anfahrt." },
    { titel: "Rahmenvertrag Wartung Heizungsanlagen (2 Jahre)", stelle: "Landkreis Erlangen-Höchstadt", ort: "Landkreis", frist: 26, wert: "ca. 120.000 €", eignung: "pruefen", grund: "Interessant, aber Nachweis von 3 vergleichbaren Wartungsverträgen gefordert." },
    { titel: "Neubau Kita – Gewerk Sanitär (Los 4)", stelle: "Stadt Fürth", ort: "Fürth", frist: 8, wert: "ca. 260.000 €", eignung: "pruefen", grund: "Großes Los. Gemeinsam mit einem Partnerbetrieb als Bietergemeinschaft möglich." }
  ];
  var NETZWERK = [
    { titel: "Bad im Mieterwechsel erneuern", von: "Hausverwaltung Kaya", ort: "Fürth", wert: 9800, prov: 0.05, info: "Ausführung bis Ende November" },
    { titel: "Heizungsprüfung in 6 Wohnungen", von: "Hausverwaltung Lang", ort: "Erlangen", wert: 2400, prov: 0.05, info: "Rahmenauftrag möglich" },
    { titel: "Sanitär im Umbau eines Bürogebäudes", von: "Projektkoordination (Bauherr)", ort: "Nürnberg", wert: 64000, prov: 0.03, info: "Weitere Gewerke sind bereits vergeben" }
  ];
  // Pflichten & Fristen: Prüfungen, Unterweisungen, Nachweise von Nachunternehmern (Tage bis fällig, negativ = überfällig)
  var FRISTEN = [
    { was: "Freistellungsbescheinigung § 48b EStG", wer: "Elektro Lang", art: "Nachunternehmer", tage: -3, akt: "Neue Bescheinigung anfordern" },
    { was: "Prüfung elektrischer Geräte (DGUV V3)", wer: "Bohrhammer, Kernbohrgerät, 6 Kabeltrommeln", art: "Geräte", tage: 12, akt: "Prüftermin eintragen" },
    { was: "Hauptuntersuchung", wer: "Firmenwagen ERH-AB 214", art: "Fahrzeuge", tage: 21, akt: "Termin eintragen" },
    { was: "Jährliche Unterweisung Arbeitsschutz", wer: "Alex, Robin", art: "Unterweisung", tage: 30, akt: "Unterweisung planen" },
    { was: "Leitern und Tritte prüfen", wer: "4 Leitern, 2 Tritte", art: "Geräte", tage: 45, akt: "Prüftermin eintragen" },
    { was: "Unbedenklichkeitsbescheinigung Krankenkasse", wer: "Fliesen Yilmaz", art: "Nachunternehmer", tage: 60, akt: "Rechtzeitig anfordern" }
  ];
  // Material & Bestellung: Bedarf aus Aufträgen und Lager im Firmenwagen
  var MATERIAL = [
    { name: "Kondensatpumpe", auftrag: "Familie Brandl", menge: 1, einheit: "Stk.", preis: 89, an: true },
    { name: "Abgasrohr DN 80, 1 m", auftrag: "Familie Brandl", menge: 3, einheit: "Stk.", preis: 42, an: true },
    { name: "Flexschlauch 3/8\", 50 cm", auftrag: "Max Lechner", menge: 2, einheit: "Stk.", preis: 9, an: true },
    { name: "Unterputz-Spülkasten", auftrag: "Familie Huber", menge: 1, einheit: "Stk.", preis: 185, an: true },
    { name: "Fliesenkleber flexibel, 25 kg", auftrag: "Familie Huber", menge: 6, einheit: "Sack", preis: 24, an: false }
  ];
  var LAGER = [
    { name: "Dichtungen Sortiment", ist: 2, min: 5 },
    { name: "Pressfittinge 15 mm", ist: 14, min: 20 },
    { name: "Silikon sanitär weiß", ist: 6, min: 4 },
    { name: "Kupferrohr 15 mm, 5 m", ist: 3, min: 2 }
  ];
  var BEWERBER = [
    { name: "Daniel S.", stelle: "Anlagenmechaniker SHK", info: "Geselle, 6 Jahre Erfahrung, Führerschein B", passt: true, wann: "heute" },
    { name: "Lea M.", stelle: "Auszubildende SHK", info: "Mittlere Reife, Praktikum im Handwerk", passt: true, wann: "gestern" },
    { name: "Kevin R.", stelle: "Anlagenmechaniker SHK", info: "Quereinsteiger, kein Gesellenbrief", passt: false, wann: "vor 3 Tagen" }
  ];
  var mod;
  function resetModule() {
    var cp = function (a) { return a.map(function (x) { return Object.assign({}, x); }); };
    mod = { rechnungen: cp(RECHNUNGEN), termine: cp(TERMINE), aus: cp(AUSSCHREIBUNGEN), netz: cp(NETZWERK), bew: cp(BEWERBER), belege: cp(BELEGE), satz: 25, fristen: cp(FRISTEN), mat: cp(MATERIAL), lager: cp(LAGER), grosshandel: "Großhandel Muster", bestellt: false, vt: { zeit: "monat", wer: "alle", buero: false, verl: {} } };
  }
  resetModule();

  function head(titel, text, quelle) {
    return '<div class="view-head"><div><h1>' + titel + "</h1><p>" + text + "</p>" + (quelle ? '<p class="src">' + quelle + "</p>" : "") + "</div></div>";
  }

  /* --- Rechnungen --- */
  function viewRechnungen() {
    var offen = mod.rechnungen.filter(function (r) { return r.status !== "bezahlt"; });
    var ueber = offen.filter(function (r) { return r.faellig > 0; });
    var sum = function (a) { return a.reduce(function (s, r) { return s + restVon(r); }, 0); };
    $main.innerHTML = head("Rechnungen", "Wer muss noch zahlen? Zahlungserinnerungen sind vorbereitet, Sie geben sie frei.",
        '<span class="pill">Demo</span> Im echten Betrieb kommen Rechnungen und Zahlungen aus Ihrem Rechnungsprogramm (z. B. Lexware Office, sevDesk), das auch die E-Rechnung (XRechnung, ZUGFeRD) erzeugt. Hier sind es Beispieldaten; Rechnungsvorschauen sind Muster.') +
      '<div class="kpis" id="rg-kpis">' +
        kpi("Offen", euro.format(sum(offen)), offen.length + " Rechnungen") +
        kpi("Überfällig", euro.format(sum(ueber)), ueber.length + " Rechnungen") +
        kpi("Bezahlt", euro.format(mod.rechnungen.reduce(function (s, r) { return s + bezahltVon(r); }, 0)), "inkl. Teilzahlungen") +
        kpi("Ø Zahlungsdauer", "11 Tage", "Ziel: 14 Tage") +
      "</div>" +
      (function () {
        var b = [["noch nicht fällig", 0], ["1–14 Tage", 0], ["15–30 Tage", 0], ["über 30 Tage", 0]];
        offen.forEach(function (r) { b[r.faellig <= 0 ? 0 : r.faellig <= 14 ? 1 : r.faellig <= 30 ? 2 : 3][1] += restVon(r); });
        var g = sum(offen) || 1, farbe = ["var(--acc)", "#E0A400", "#E5603A", "#B42318"];
        return '<section class="panel" id="rg-alter" style="margin-bottom:14px"><h2>Offene Beträge nach Alter</h2><div class="alter-bar">' +
          b.map(function (x, i) { return x[1] ? '<i style="flex:' + x[1] + ';background:' + farbe[i] + '" title="' + x[0] + '"></i>' : ""; }).join("") + '</div><div class="alter-leg">' +
          b.map(function (x, i) { return '<span><i style="background:' + farbe[i] + '"></i>' + x[0] + "<b>" + euro.format(x[1]) + "</b><small>" + Math.round(x[1] / g * 100) + " %</small></span>"; }).join("") + "</div></section>";
      })() +
      '<div class="rows" id="rg-liste">' + mod.rechnungen.map(function (r, i) {
        var st = r.status === "bezahlt" ? '<span class="pill ok">bezahlt</span>' : r.status === "teilbezahlt" ? '<span class="pill check">teilweise bezahlt · Rest ' + euro.format(restVon(r)) + "</span>" :
                 r.faellig > 0 ? '<span class="pill no">' + r.faellig + " Tage überfällig</span>" : '<span class="pill">fällig in ' + (-r.faellig) + " Tagen</span>";
        var btn = r.status === "bezahlt" ? "" : r.faellig > 0 ?
          '<button class="btn-mini primary" type="button" data-rg="' + i + '">' + (r.erinnert ? (r.erinnert + 1) + ". Erinnerung freigeben" : "Erinnerung freigeben") + "</button>" :
          '<button class="btn-mini" type="button" data-rgpaid="' + i + '">Als bezahlt markieren</button>';
        var lohn = Math.round(r.betrag * (r.betrag > 5000 ? 0.4 : 0.6) / 10) * 10, bonus = Math.min(1200, Math.round(lohn * 0.2));
        if (!/Hausverwaltung/.test(r.name)) btn += (r.status === "bezahlt" ? "" : '<button class="btn-mini" type="button" data-zlink="' + i + '">Zahlungslink senden</button>');
        return '<div class="row"><div class="row-main"><strong>' + esc(r.name) + " · " + r.nr + "</strong><small>" + (r.info || (r.erinnert ? r.erinnert + " Erinnerung gesendet" : "noch keine Erinnerung")) + "</small>" +
          (/Hausverwaltung/.test(r.name) ? "" : '<small class="bonus">Steuerbonus ausgewiesen: Lohnanteil ' + euro.format(lohn) + " → Ihr Kunde spart bis zu " + euro.format(bonus) + " Steuern</small>") + "</div>" +
          '<div class="row-side">' + st + '<span class="amount">' + euro.format(r.betrag) + "</span>" + btn + '<button class="btn-mini" type="button" data-re-open="' + esc(r.nr) + '">' + (r.status === "bezahlt" ? "Öffnen" : "Zahlung erfassen") + "</button></div></div>";
      }).join("") + "</div>";
  }

  /* --- Finanzen (Modul Finanz-Cockpit) ---
     Reine Übersicht und Rechenhilfe für den Betrieb. Keine Steuerberatung:
     keine Buchungen, keine Steuererklärungen, keine Voranmeldungen. */
  function finanzLinie(konto, stand) {
    // Wochenwerte: Eingänge verteilt, Löhne und Fixkosten jeweils zum Monatsende
    var p = [], wert = konto, ziele = [konto].concat(stand);
    for (var w = 0; w <= 13; w++) {
      var m = Math.min(2, Math.floor(w / 4.34)), a = ziele[m], z = ziele[m + 1], t = (w - m * 4.34) / 4.34;
      wert = a + (z - a) * t + (t > .1 && t < .9 ? 5200 * Math.sin(t * Math.PI) : 0);
      p.push(Math.round(wert));
    }
    var W = 560, H = 190, L = 54, R = 10, T = 12, B = 26, mx = 26000, mn = 0, puffer = 8000;
    var x = function (i) { return L + i / 13 * (W - L - R); }, y = function (v) { return T + (1 - (v - mn) / (mx - mn)) * (H - T - B); };
    var pfad = p.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    var achse = [0, 10000, 20000].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="fl-grid"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (v / 1000) + " Tsd.</text>"; }).join("");
    var marken = [[0, "heute"], [4.34, "30 Tage"], [8.68, "60 Tage"], [13, "90 Tage"]].map(function (m) { return '<text x="' + x(m[0]) + '" y="' + (H - 6) + '" text-anchor="middle">' + m[1] + "</text>"; }).join("");
    var ende = p[13];
    return '<svg class="fin-linie" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Kontostand von ' + euro.format(konto) + " heute auf " + euro.format(ende) + ' in 90 Tagen">' + achse +
      '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(puffer) + '" y2="' + y(puffer) + '" class="fl-puffer"/><text x="' + (L + 6) + '" y="' + (y(puffer) + 14) + '" class="fl-pt">Mindestpuffer 8 Tsd.</text>' +
      '<path d="' + pfad + " L" + x(13) + " " + y(0) + " L" + x(0) + " " + y(0) + ' Z" class="fl-flaeche"/><path d="' + pfad + '" class="fl-linie"/>' +
      '<circle cx="' + x(13) + '" cy="' + y(ende) + '" r="4.5" class="fl-punkt"/><text x="' + (x(13) - 8) + '" y="' + (y(ende) - 10) + '" text-anchor="end" class="fl-wert">' + euro.format(ende) + "</text>" + marken + "</svg>";
  }
  function viewFinanzen() {
    var sum = function (a) { return a.reduce(function (s, x) { return s + x; }, 0); };
    var konto = 18420;
    var offen = mod.rechnungen.filter(function (r) { return r.status !== "bezahlt"; });
    var rein = [sum(offen.map(function (r) { return restVon(r); })) + 6200, 21500, 24800];   // offene Rechnungen + geplante Abschläge
    var raus = sum(AUSGABEN.map(function (a) { return a[1]; }));
    var umsatzMonat = 41300, kostenMonat = raus, ust = Math.round(umsatzMonat * 0.19 - 6900 * 0.19), gewinn = umsatzMonat - kostenMonat;
    var stand = [konto + rein[0] - raus, 0, 0]; stand[1] = stand[0] + rein[1] - raus; stand[2] = stand[1] + rein[2] - raus;
    var max = Math.max.apply(null, stand.concat([konto]));
    var neu = mod.belege.filter(function (b) { return b.st === "neu"; });
    $main.innerHTML = head("Finanzen", "Kontostand, was in den nächsten Wochen kommt und geht, Rücklagen und Belege für Ihren Steuerberater.",
        '<span class="pill ok">Modul Finanz-Cockpit</span> Demo: Kontostand, Ausgaben und Belege sind Beispielwerte – keine Bankanbindung. In der echten Version kommen die Kontodaten über die Bankanbindung Ihres Rechnungsprogramms · Belegtransfer zu DATEV Unternehmen online, Lexware Office oder sevDesk') +
      '<div class="kpis" id="fin-kpis">' +
        kpi("Kontostand", euro.format(konto), "Geschäftskonto, heute") +
        kpi("Kommt rein (30 Tage)", euro.format(rein[0]), offen.length + " offene Rechnungen + Abschläge") +
        kpi("Geht raus (30 Tage)", euro.format(raus), "Löhne, Material, laufende Kosten") +
        kpi("Rücklage empfohlen", euro.format(ust + Math.round(gewinn * mod.satz / 100)), "Umsatzsteuer + Ihr Prozentsatz") +
      "</div>" +
      '<div class="panel-grid two">' +
        '<section class="panel" id="fin-vorschau" aria-labelledby="fv-h"><h2 id="fv-h">Kontostand in den nächsten 90 Tagen</h2>' + finanzLinie(konto, stand) +
          '<p class="src" style="margin-top:14px">Feste Ausgaben pro Monat</p><div class="bars">' +
          AUSGABEN.map(function (a) { return '<div class="bar-row" style="grid-template-columns:1fr auto"><span>' + a[0] + "</span><b>" + euro.format(a[1]) + "</b></div>"; }).join("") + "</div></section>" +
        '<section class="panel" id="fin-ruecklage" aria-labelledby="fr-h"><h2 id="fr-h">Rücklage für Steuern</h2>' +
          '<div class="facts"><div class="fact"><span>Umsatzsteuer diesen Monat</span><b>' + euro.format(ust) + '</b></div><div class="fact"><span>Gewinn diesen Monat (vor Steuern)</span><b>' + euro.format(gewinn) + "</b></div></div>" +
          '<label style="display:block;margin:14px 0 6px;font-weight:600">Ihr Prozentsatz für die Einkommensteuer: <span id="fin-satz-wert">' + mod.satz + " %</span></label>" +
          '<input type="range" id="fin-satz" min="10" max="45" step="1" value="' + mod.satz + '" style="width:100%">' +
          '<p style="margin:10px 0 0">Zurücklegen diesen Monat: <b id="fin-rl">' + euro.format(ust + Math.round(gewinn * mod.satz / 100)) + "</b></p>" +
          '<p class="src" style="margin-top:10px">Grobe Schätzung mit Ihrem eigenen Prozentsatz, keine Steuerberatung. Den passenden Satz klären Sie mit Ihrem Steuerberater. Die Umsatzsteuer-Voranmeldung macht weiterhin Ihr Steuerberater oder Ihr Rechnungsprogramm.</p>' +
        "</section>" +
      "</div>" +
      '<section class="panel" id="fin-belege" aria-labelledby="fb-h" style="margin-top:16px"><h2 id="fb-h">Belege für den Steuerberater</h2>' +
        '<p class="src">Mit dem Handy fotografiert, automatisch gelesen und an Ihren Steuerberater übertragen. Gebucht wird dort.</p>' +
        '<div class="view-actions" style="margin:8px 0 12px">' + (neu.length ? '<button class="btn btn-signal" type="button" data-fin-alle>' + neu.length + " Belege übertragen</button>" : "") +
          '<button class="btn btn-outline" type="button" data-fin-pdf>' + svg(ICON.doc) + "Monatsübersicht als PDF</button></div>" +
        '<div class="rows">' + mod.belege.map(function (b, i) {
          return '<div class="row"><div class="row-main"><strong>' + esc(b.name) + "</strong><small>" + esc(b.info) + " · " + vorTagen(b.tage) + "</small></div>" +
            '<div class="row-side">' + (b.st === "neu" ? '<span class="pill check">neu</span>' : '<span class="pill ok">' + svg(ICON.check) + "beim Steuerberater</span>") +
            '<span class="amount">' + euro.format(b.betrag) + "</span>" + (b.st === "neu" ? '<button class="btn-mini primary" type="button" data-fin-beleg="' + i + '">Übertragen</button>' : "") + "</div></div>";
        }).join("") + "</div></section>";
    var sl = document.getElementById("fin-satz");
    sl.addEventListener("input", function () {
      mod.satz = +sl.value;
      var rl = euro.format(ust + Math.round(gewinn * mod.satz / 100));
      document.getElementById("fin-satz-wert").textContent = mod.satz + " %";
      document.getElementById("fin-rl").textContent = rl;
      var k = document.querySelectorAll("#fin-kpis .kpi strong"); if (k[3]) k[3].textContent = rl;
    });
  }

  /* --- Vertrieb: Quoten vom Kontakt bis zum Auftrag ---
     Beispielzahlen pro Monat; Quartal und Jahr hochgerechnet. Geschäftsführung sieht alle,
     Außendienst nur sich selbst, Büro nur nach Freigabe. */
  var VT = {
    personen: [
      { id: "gf", name: "Geschäftsführung", n: [30, 19, 16, 6], wert: 41000, angebot: 112000, ziel: [40, 60000], vj: 29 },
      { id: "stefan", name: "Stefan (Außendienst)", n: [18, 12, 10, 3], wert: 19500, angebot: 64000, ziel: [35, 30000], vj: 24 }
    ],
    kanal: [["Telefon", 14, 3], ["WhatsApp", 10, 2], ["Website", 11, 1], ["Empfehlung", 6, 3], ["Google", 7, 0]],
    leistung: [["Bad", 12, 2, 28000], ["Heizung", 9, 3, 27500], ["Kundendienst", 27, 4, 5000]],
    gruende: [["zu teuer", 7], ["Termin zu spät", 4], ["keine Rückmeldung", 4], ["anderer Betrieb", 2]],
    zeit: { monat: [1, "Oktober", 1], quartal: [3, "3. Quartal", 1.04], jahr: [10, "Januar bis Oktober", 0.97] }
  };
  var GRUENDE = ["zu teuer", "Termin zu spät", "keine Rückmeldung", "anderer Betrieb"];
  function viewVertrieb() {   // alle Zahlen aus den Demo-Daten (Anfragen, Angebote, Aufträge)
    var vt = mod.vt, TAGE = { monat: 30, quartal: 90, jahr: 365 }[vt.zeit] || 30, FAKT = { monat: 1, quartal: 3, jahr: 12 }[vt.zeit] || 1;
    var eigen = EIGEN[state.rolle] === "Stefan";
    if (state.rolle === "buero" && !vt.buero) {
      $main.innerHTML = head("Vertrieb", "Quoten vom Kontakt bis zum Auftrag.") +
        '<section class="panel"><h2>Noch nicht freigegeben</h2><p>Die Vertriebszahlen sieht das Büro erst, wenn die Geschäftsführung sie freigibt.</p><button class="btn-mini" type="button" data-rolle-wechsel="gf">Als Geschäftsführung ansehen</button></section>';
      return;
    }
    var PERS = [["gf", "Thomas (GF)", "Geschäftsführung", [40, 60000]], ["buero", "Sabine (Büro)", "Büro", [35, 25000]], ["stefan", "Stefan (Außendienst)", "Stefan (Außendienst)", [35, 40000]]];
    var wer = eigen ? "stefan" : vt.wer;
    var P = PERS.filter(function (x) { return wer === "alle" || x[0] === wer; });
    var inP = function (l) { return P.some(function (x) { return verantwortlichVon(l) === x[1]; }); };
    var L = state.leads.filter(function (l) { return (l.tage || 0) <= TAGE && inP(l); });
    var istTermin = function (l) { return l.stage !== "neu" || (l.verlauf || []).some(function (e) { return /Termin|Besichtigung|Aufmaß/.test(e.text); }); };
    var istAng = function (l) { return l.stage !== "neu" || !!l.verloren; }, istAuf = function (l) { return l.stage === "auftrag" || l.stage === "erledigt"; };
    var n = [L.length, L.filter(istTermin).length, L.filter(istAng).length, L.filter(istAuf).length];
    var wert = L.filter(istAuf).reduce(function (x, l) { return x + l.wert; }, 0), angebot = L.filter(istAng).reduce(function (x, l) { return x + l.wert; }, 0);
    var pr = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
    var tageAng = L.filter(function (l) { return l.angebotVor != null; }).map(function (l) { return Math.max(0, (l.tage || 0) - l.angebotVor); });
    var dAng = tageAng.length ? (tageAng.reduce(function (x, y) { return x + y; }, 0) / tageAng.length).toFixed(1).replace(".", ",") : "–";
    var durchNach = L.filter(function (l) { return istAuf(l) && (l.erinnert || 0) > 0; });
    var stufen = [["Anfragen", n[0], ""], ["Besichtigung / Aufmaß", n[1], pr(n[1], n[0]) + " % der Anfragen"], ["Angebote", n[2], pr(n[2], n[1]) + " % der Termine"], ["Aufträge", n[3], pr(n[3], n[2]) + " % der Angebote"]];
    var gruende = {}; L.forEach(function (l) { var g = vt.verl[l.id] || l.verloren; if (g) gruende[g] = (gruende[g] || 0) + 1; });
    (state.angebote || []).forEach(function (a) { if (a.status === "abgelehnt" && a.grund && !L.some(function (l) { return l.id === a.leadId && (vt.verl[l.id] || l.verloren); })) gruende[a.grund] = (gruende[a.grund] || 0) + 1; });
    var gr = Object.keys(gruende).map(function (k) { return [k, gruende[k]]; }).sort(function (x, y) { return y[1] - x[1]; });
    var grSum = gr.reduce(function (x, g) { return x + g[1]; }, 0) || 1, grMax = gr.length ? gr[0][1] : 1;
    var balken = function (label, w2, max, rechts) { return '<div class="bar-row" style="grid-template-columns:minmax(90px,140px) 1fr auto"><span>' + label + '</span><span class="bar"><i style="width:' + (max ? Math.max(3, w2 / max * 100) : 0) + '%"></i></span><b>' + rechts + "</b></div>"; };
    var kan = Object.keys(KANAL).map(function (k) { var x = L.filter(function (l) { return l.kanal === k; }); return [KANAL[k].label, x.length, x.filter(istAuf).length]; }).filter(function (x) { return x[1]; });
    var lei = GEWERKE.map(function (g) { var x = L.filter(function (l) { return gewerkVon(l) === g; }); return [g, x.filter(istAuf).length, x.filter(istAuf).reduce(function (y, l) { return y + l.wert; }, 0), x.length]; }).filter(function (x) { return x[3]; });
    var leiMax = Math.max.apply(null, lei.map(function (x) { return x[2]; }).concat([1]));
    var offen = offeneAngebote().filter(function (l) { return inP(l) && !vt.verl[l.id]; }).slice(0, 3);
    var leer = !L.length;
    $main.innerHTML = head(eigen ? "Mein Vertrieb" : "Vertrieb", "Wie viele Anfragen werden zu Aufträgen – und an welcher Stelle gehen sie verloren?",
        eigen ? "Sie sehen nur Ihre eigenen Zahlen." : "Berechnet aus den Anfragen, Angeboten und Aufträgen der Demo · Die Mitarbeiter sind informiert; die Zahlen dienen der Steuerung, nicht der Leistungskontrolle.") +
      '<div class="toolbar" style="display:flex;flex-wrap:wrap;gap:10px 18px;margin-bottom:14px"><div class="filter" role="tablist">' +
        [["monat", "30 Tage"], ["quartal", "90 Tage"], ["jahr", "12 Monate"]].map(function (z) { return '<button type="button" data-vt-zeit="' + z[0] + '" aria-pressed="' + (vt.zeit === z[0]) + '">' + z[1] + "</button>"; }).join("") + "</div>" +
        (eigen ? "" : '<div class="filter">' + [["alle", "Alle"]].concat(PERS.map(function (x) { return [x[0], x[2]]; })).map(function (w) { return '<button type="button" data-vt-wer="' + w[0] + '" aria-pressed="' + (vt.wer === w[0]) + '">' + w[1] + "</button>"; }).join("") + "</div>") +
        (state.rolle === "gf" ? '<button class="btn-mini" type="button" data-vt-buero>' + (vt.buero ? svg(ICON.check) + "Für das Büro freigegeben" : "Für das Büro freigeben") + "</button>" : "") +
      "</div>" +
      (leer ? '<p class="col-empty">In diesem Zeitraum gibt es für diese Auswahl keine Anfragen.</p>' :
      '<div class="kpis" id="vt-kpis">' +
        kpi("Abschlussquote", pr(n[3], n[2]) + " %", "nach Euro " + pr(wert, angebot) + " %") +
        kpi("Auftragswert", euro.format(wert), n[3] + " Aufträge · Ø " + euro.format(n[3] ? wert / n[3] : 0)) +
        kpi("Bis zum Angebot", dAng + " Tage", "Durchschnitt aus " + tageAng.length + " Angeboten") +
        kpi("Durch Nachfassen", durchNach.length + " Aufträge", euro.format(durchNach.reduce(function (x, l) { return x + l.wert; }, 0)) + " nach mindestens einer Erinnerung") +
      "</div>" +
      '<div class="panel-grid two">' +
        '<section class="panel" id="vt-trichter" aria-labelledby="vtt-h"><h2 id="vtt-h">Vom Kontakt zum Auftrag</h2><div class="vt-trichter">' +
          stufen.map(function (st) { return '<div class="vt-stufe"><div class="vt-balken" style="width:' + Math.max(18, n[0] ? st[1] / n[0] * 100 : 18) + '%"><b>' + st[1] + "</b></div><span><b>" + st[0] + "</b>" + (st[2] ? "<small>" + st[2] + "</small>" : "") + "</span></div>"; }).join("") +
        '</div><p class="src" style="margin-top:10px">Größter Verlust: ' + ["zwischen Anfrage und Termin – schnelle Rückmeldung und Richtpreis helfen.", "zwischen Termin und Angebot – Angebote schneller schreiben.", "zwischen Angebot und Auftrag – Nachfassen und die Gründe unten ansehen."][[pr(n[1], n[0]), pr(n[2], n[1]), pr(n[3], n[2])].reduce(function (m, x, i, a) { return x < a[m] ? i : m; }, 0)] + "</p></section>" +
        '<section class="panel" id="vt-ziele" aria-labelledby="vtz-h"><h2 id="vtz-h">Ziele</h2>' +
          P.map(function (x) {
            var LP = L.filter(function (l) { return verantwortlichVon(l) === x[1]; }), a2 = LP.filter(istAng).length, w2 = LP.filter(istAuf).reduce(function (y, l) { return y + l.wert; }, 0), q = pr(LP.filter(istAuf).length, a2), zw = x[3][1] * FAKT;
            return '<div class="vt-ziel"><b>' + x[2] + '</b><div class="bars">' + balken("Quote " + q + " %", q, x[3][0], "Ziel " + x[3][0] + " %") + balken(euro.format(w2), w2, zw, "Ziel " + euro.format(zw)) + "</div></div>";
          }).join("") + '<p class="src" style="margin-top:8px">Ziele sind Beispielwerte und in der echten Version einstellbar.</p></section>' +
      "</div>" +
      '<div class="panel-grid two" style="margin-top:16px">' +
        '<section class="panel" aria-labelledby="vtk-h"><h2 id="vtk-h">Nach Kanal</h2><div class="bars">' +
          kan.map(function (k) { return balken(k[0], pr(k[2], k[1]), 100, k[2] + " von " + k[1] + " · " + pr(k[2], k[1]) + " %"); }).join("") +
        '</div><h2 style="margin-top:16px">Nach Leistung</h2><div class="bars">' +
          lei.map(function (k) { return balken(k[0], k[2], leiMax, k[1] + " Aufträge · " + euro.format(k[2])); }).join("") +
        '</div><p class="src" style="margin-top:8px">Balken Kanal: Abschlussquote · Balken Leistung: Auftragswert</p></section>' +
        '<section class="panel" id="vt-gruende" aria-labelledby="vtg-h"><h2 id="vtg-h">Warum verloren?</h2>' +
          (gr.length ? '<div class="bars">' + gr.map(function (g) { return balken(g[0], g[1], grMax, g[1] + " · " + Math.round(g[1] / grSum * 100) + " %"); }).join("") + "</div>" : '<p class="col-empty">Noch keine Absagen erfasst.</p>') +
          (offen.length ? '<p class="src" style="margin-top:14px">Offene Angebote – bei einer Absage den Grund wählen:</p><div class="rows">' + offen.map(function (l) {
            return '<div class="row"><div class="row-main"><strong>' + esc(l.name) + "</strong><small>" + euro.format(l.wert) + "</small></div>" +
              '<div class="row-side"><select data-vt-grund="' + l.id + '" aria-label="Grund für ' + esc(l.name) + '"><option value="">verloren, weil …</option>' + GRUENDE.map(function (g) { return "<option>" + g + "</option>"; }).join("") + "</select></div></div>";
          }).join("") + "</div>" : "") +
        "</section>" +
      "</div>");
  }

  /* --- Termine --- */
  /* =====================================================================
     KALENDER: Woche, Tag, Monat, Liste · Termine anlegen und verschieben ·
     Abgleich mit Google, Outlook und iPhone (Demo) · .ics-Datei (echt)
     ===================================================================== */
  var WTAG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  var WK = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  var MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  var DAUER = { Lager: 30, Intern: 60, "Ausführung": 480, Kundendienst: 60, Wartung: 90, Besichtigung: 60, "Aufmaß": 60, Notdienst: 120, Abnahme: 60 };
  var KFARBE = { "Ausführung": "k-aus", Besichtigung: "k-bes", "Aufmaß": "k-auf", Wartung: "k-wart", Kundendienst: "k-wart", Notdienst: "k-not", Abnahme: "k-bes", Lager: "k-int", Intern: "k-int" };
  var TEAM = ["Alex", "Robin", "Stefan"];
  var PRIVAT = [{ tag: "Morgen", zeit: "17:30", dauer: 90, wer: "Alex", quelle: "Google Kalender" }, { tag: "Freitag", zeit: "12:00", dauer: 60, wer: "Stefan", quelle: "iPhone-Kalender" }];
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  function heute0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function plusTage(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function gleicherTag(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function tagDatum(tag, datum) {
    if (datum) { var x = new Date(datum); x.setHours(0, 0, 0, 0); return x; }
    var h = heute0();
    if (tag === "Heute") return h;
    if (tag === "Morgen") return plusTage(h, 1);
    var i = WTAG.indexOf(tag); if (i < 0) return plusTage(h, 2);
    var o = (i - h.getDay() + 7) % 7; if (o < 2) o += 7;
    return plusTage(h, o);
  }
  function tagLabel(d) {
    var h = heute0(), diff = Math.round((d - h) / 864e5);
    if (diff === 0) return "Heute"; if (diff === 1) return "Morgen";
    if (diff > 1 && diff < 7) return WTAG[d.getDay()];
    return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1) + ".";
  }
  function terminZeit(t) {
    var d = tagDatum(t.tag, t.datum), z = String(t.zeit).split(":");
    var start = new Date(d); start.setHours(+z[0], +z[1] || 0, 0, 0);
    var ende = new Date(start.getTime() + (t.dauer || DAUER[t.art] || 60) * 6e4);
    return { start: start, ende: ende };
  }
  function kalListe() {
    var k = state.kal, liste = mod.termine.map(function (t, i) { var z = terminZeit(t); return { t: t, i: i, start: z.start, ende: z.ende }; });
    if (k.sync.google || k.sync.apple || k.sync.outlook) PRIVAT.forEach(function (p) {
      if ((p.quelle === "Google Kalender" && !k.sync.google) || (p.quelle === "iPhone-Kalender" && !k.sync.apple)) return;
      var z = terminZeit({ tag: p.tag, zeit: p.zeit, dauer: p.dauer }); liste.push({ privat: p, start: z.start, ende: z.ende });
    });
    if (k.wer !== "alle") liste = liste.filter(function (e) { return new RegExp(k.wer).test(e.t ? e.t.wer : e.privat.wer); });
    return liste.sort(function (a, b) { return a.start - b.start; });
  }
  var uhrzeit = function (d) { return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); };
  function wochenStart(d) { var x = new Date(d); var w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); x.setHours(0, 0, 0, 0); return x; }
  function kwNr(d) { var x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var n = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - n); var j = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - j) / 864e5 + 1) / 7); }

  /* Wer sieht was: Geschäftsführung und Büro alle Termine, alle anderen nur die eigenen */
  var EIGEN = { aussen: "Stefan", monteur: "Alex" };
  function viewTermine() {
    var k = state.kal, eigen = EIGEN[state.rolle];
    k.wer = eigen ? eigen : (TEAM.indexOf(k.wer) > -1 || k.wer === "alle" ? k.wer : "alle");
    if (!k.ansicht || !k.gewaehlt) k.ansicht = "tag";   // Start: Tagesansicht; danach bleibt, was man selbst eingestellt hat
    var h = heute0(), basis, titel, inhalt, alle = kalListe();
    if (k.ansicht === "woche") {
      basis = plusTage(wochenStart(h), k.offset * 7);
      var tage = [0, 1, 2, 3, 4, 5].map(function (n) { return plusTage(basis, n); });
      titel = "KW " + kwNr(basis) + " · " + basis.getDate() + ". – " + tage[5].getDate() + ". " + MON[tage[5].getMonth()];
      inhalt = kalRaster(tage, alle);
    } else if (k.ansicht === "tag") {
      basis = plusTage(h, k.offset);
      titel = WTAG[basis.getDay()] + ", " + basis.getDate() + ". " + MON[basis.getMonth()];
      inhalt = !eigen && k.wer === "alle" ? kalRaster([basis], alle, TEAM) : kalRaster([basis], alle);
    } else if (k.ansicht === "monat") {
      basis = new Date(h.getFullYear(), h.getMonth() + k.offset, 1);
      titel = MON[basis.getMonth()] + " " + basis.getFullYear();
      inhalt = kalMonat(basis, alle);
    } else {
      basis = plusTage(h, k.offset * 14);
      titel = "Nächste 14 Tage";
      inhalt = kalAgenda(basis, alle);
    }
    var sync = k.sync, verbunden = ["google", "outlook", "apple"].filter(function (x) { return sync[x]; }).length;
    $main.innerHTML = head(eigen ? "Mein Kalender" : "Kalender", eigen ? "Ihre eigenen Termine. Büro und Geschäftsführung sehen sie ebenfalls und können Ihnen Termine eintragen – Sie bekommen dann eine Mitteilung aufs Handy." : "Jede Person hat ihren eigenen Kalender. Hier sehen Sie alle zusammen und weisen Termine zu – jede Person sieht auf ihrem Handy nur ihre eigenen.",
        (verbunden ? '<span class="pill ok">' + svg(ICON.check) + "verbunden</span> " + ["Google Kalender", "Outlook", "iPhone-Kalender"].filter(function (_, n) { return sync[["google", "outlook", "apple"][n]]; }).join(", ") + " · private Termine erscheinen nur als „belegt“" : '<span class="pill check">nicht verbunden</span> Kalender verbinden, damit nichts doppelt gebucht wird')) +
      '<div class="kal" id="termine">' +
        '<div class="kal-leiste">' +
          '<div class="kal-nav"><button class="icon-btn" type="button" data-kal-nav="-1" aria-label="Zurück">‹</button><button class="btn-mini" type="button" data-kal-nav="0">Heute</button><button class="icon-btn" type="button" data-kal-nav="1" aria-label="Weiter">›</button><b class="kal-titel">' + titel + "</b></div>" +
          '<div class="kal-ansicht" role="tablist">' + [["tag", "Tag"], ["woche", "Woche"], ["monat", "Monat"], ["liste", "Liste"]].map(function (a) { return '<button type="button" role="tab" data-kal-ansicht="' + a[0] + '" aria-selected="' + (k.ansicht === a[0]) + '">' + a[1] + "</button>"; }).join("") + "</div>" +
          '<div class="kal-aktionen"><button class="btn-mini" type="button" data-kal-buchung>Online-Buchung</button><button class="btn-mini" type="button" data-kal-sync>' + svg(ICON.calendar) + "Kalender verbinden</button><button class=\"btn-mini primary\" type=\"button\" data-kal-neu>+ Termin</button></div>" +
        "</div>" +
        '<div class="kal-wer">' + (eigen ? '<span class="kal-ich"><i class="kal-avatar">' + eigen[0] + "</i>Kalender von " + eigen + (eigen === "Stefan" ? " (Außendienst)" : "") + "</span>" : "") + (eigen ? [] : ["alle"].concat(TEAM)).map(function (w) { return '<button type="button" data-kal-wer="' + w + '" aria-pressed="' + (k.wer === w) + '">' + (w === "alle" ? "Alle" : '<i class="kal-avatar">' + w[0] + "</i>" + w) + "</button>"; }).join("") +
          '<span class="kal-legende"><i class="k-aus"></i>Ausführung <i class="k-bes"></i>Besichtigung/Abnahme <i class="k-auf"></i>Aufmaß <i class="k-wart"></i>Wartung/Kundendienst <i class="k-not"></i>Notdienst <i class="k-privat"></i>privat belegt</span></div>' +
        inhalt +
      "</div>";
    var jetzt = document.querySelector(".kal-jetzt"); if (jetzt && k.ansicht !== "monat") { var sc = document.querySelector(".kal-scroll"); if (sc) sc.scrollTop = Math.max(0, jetzt.offsetTop - 120); }
  }
  var VON = 6, BIS = 20, PX = 46;
  function kalRaster(tage, alle, personen) {
    var h = heute0(), now = new Date();
    var spaltenDef = personen ? personen.map(function (p) { return { d: tage[0], p: p }; }) : tage.map(function (d) { return { d: d }; });
    var kopf = '<div class="kal-kopf" style="grid-template-columns:52px repeat(' + spaltenDef.length + ',1fr)"><span></span>' + spaltenDef.map(function (c) {
      if (c.p) return '<span class="kal-person"><i class="kal-avatar">' + c.p[0] + "</i><b>" + c.p + "</b></span>";
      return '<span class="' + (gleicherTag(c.d, h) ? "ist-heute" : "") + '"><small>' + WK[c.d.getDay()] + "</small><b>" + c.d.getDate() + "</b></span>";
    }).join("") + "</div>";
    var stunden = ""; for (var s = VON; s < BIS; s++) stunden += '<div class="kal-std" style="height:' + PX + 'px"><span>' + pad2(s) + ":00</span></div>";
    var spalten = spaltenDef.map(function (c) {
      var d = c.d, ev = alle.filter(function (e) { return gleicherTag(e.start, d) && (!c.p || new RegExp(c.p).test(e.t ? e.t.wer : e.privat.wer)); }).map(function (e) { return Object.assign({}, e); });
      var spuren = [];
      ev.forEach(function (e) { var n = 0; while (spuren[n] && spuren[n] > e.start) n++; spuren[n] = e.ende; e.spur = n; });
      var breite = Math.max(1, spuren.length);
      var html = ev.map(function (e) {
        var top = ((e.start.getHours() + e.start.getMinutes() / 60) - VON) * PX, hoch = Math.max(22, (e.ende - e.start) / 36e5 * PX - 2);
        var st = "top:" + top + "px;height:" + hoch + "px;left:calc(" + (e.spur / breite * 100) + "% + 2px);width:calc(" + (100 / breite) + "% - 4px)";
        if (e.privat) return '<div class="kal-ev k-privat" style="' + st + '" title="Privat belegt (' + e.privat.quelle + ')"><b>belegt</b><small>' + e.privat.wer + " · " + e.privat.quelle + "</small></div>";
        var t = e.t;
        return '<button type="button" class="kal-ev ' + (KFARBE[t.art] || "k-aus") + (t.offen ? " offen" : "") + (t.erledigt ? " erledigt" : "") + '" style="' + st + '" data-kal-ev="' + e.i + '"><b>' + uhrzeit(e.start) + " " + esc(t.art) + "</b><span>" + esc(t.name) + "</span><small>" + esc(t.wer.replace(" (Außendienst)", "")) + " · " + esc(t.ort) + "</small></button>";
      }).join("");
      var linie = gleicherTag(d, h) && now.getHours() >= VON && now.getHours() < BIS ? '<div class="kal-jetzt" style="top:' + ((now.getHours() + now.getMinutes() / 60) - VON) * PX + 'px"></div>' : "";
      return '<div class="kal-spalte" data-kal-tag="' + d.toISOString() + '"' + (c.p ? ' data-kal-person="' + c.p + '"' : "") + ' style="height:' + (BIS - VON) * PX + 'px">' + html + linie + "</div>";
    }).join("");
    return '<div class="kal-raster">' + kopf + '<div class="kal-scroll"><div class="kal-koerper" style="grid-template-columns:52px repeat(' + spaltenDef.length + ',1fr)"><div>' + stunden + "</div>" + spalten + "</div></div></div>";
  }
  function kalMonat(basis, alle) {
    var start = wochenStart(basis), h = heute0(), zellen = "";
    for (var n = 0; n < 42; n++) {
      var d = plusTage(start, n), ev = alle.filter(function (e) { return gleicherTag(e.start, d); });
      zellen += '<div class="kal-mz' + (d.getMonth() !== basis.getMonth() ? " fremd" : "") + (gleicherTag(d, h) ? " ist-heute" : "") + '" data-kal-tag="' + d.toISOString() + '"><span class="kal-mz-nr">' + d.getDate() + "</span>" +
        ev.slice(0, 3).map(function (e) { return e.privat ? '<span class="kal-chip k-privat">belegt</span>' : '<button type="button" class="kal-chip ' + (KFARBE[e.t.art] || "k-aus") + '" data-kal-ev="' + e.i + '">' + uhrzeit(e.start) + " " + esc(e.t.name) + "</button>"; }).join("") +
        (ev.length > 3 ? '<small class="kal-mehr">+' + (ev.length - 3) + " weitere</small>" : "") + "</div>";
    }
    return '<div class="kal-monat"><div class="kal-mkopf">' + ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div><div class=\"kal-mgrid\">" + zellen + "</div></div>";
  }
  function kalAgenda(basis, alle) {
    var html = "";
    for (var n = 0; n < 14; n++) {
      var d = plusTage(basis, n), ev = alle.filter(function (e) { return gleicherTag(e.start, d); });
      if (!ev.length) continue;
      html += '<section class="kal-atag"><h3>' + (n === 0 && state.kal.offset === 0 ? "Heute · " : n === 1 && state.kal.offset === 0 ? "Morgen · " : "") + WTAG[d.getDay()] + ", " + d.getDate() + ". " + MON[d.getMonth()] + "</h3>" +
        ev.map(function (e) {
          if (e.privat) return '<div class="kal-azeile k-privat"><span class="kal-azeit">' + uhrzeit(e.start) + "</span><div><b>Privat belegt</b><small>" + e.privat.wer + " · aus " + e.privat.quelle + "</small></div></div>";
          var t = e.t;
          return '<button type="button" class="kal-azeile ' + (KFARBE[t.art] || "k-aus") + (t.erledigt ? " erledigt" : "") + '" data-kal-ev="' + e.i + '"><span class="kal-azeit">' + uhrzeit(e.start) + "<small>" + uhrzeit(e.ende) + "</small></span><div><b>" + esc(t.art) + ": " + esc(t.name) + "</b><small>" + esc(t.ort) + " · " + esc(t.wer) + (t.offen ? " · Bestätigung offen" : "") + "</small></div></button>";
        }).join("") + "</section>";
    }
    return '<div class="kal-agenda">' + (html || '<p class="src">Keine Termine in diesem Zeitraum.</p>') + "</div>";
  }

  /* --- .ics-Datei: funktioniert wirklich mit iPhone, Android, Outlook und Google --- */
  function icsText(liste) {
    var e = function (x) { return String(x || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); };
    var f = function (d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00"; };
    var now = new Date(), stamp = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) + "T" + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + "00Z";
    var z = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Auftragsassi//Cockpit//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    liste.forEach(function (t, n) {
      var tz = terminZeit(t);
      z.push("BEGIN:VEVENT", "UID:" + stamp + "-" + n + "-" + Math.random().toString(36).slice(2, 8) + "@auftragsassistent", "DTSTAMP:" + stamp,
        "DTSTART:" + f(tz.start), "DTEND:" + f(tz.ende), "SUMMARY:" + e(t.art + ": " + t.name), "LOCATION:" + e(t.ort),
        "DESCRIPTION:" + e(t.info + "\nTeam: " + t.wer + "\n(Beispieldaten aus der Demo)"),
        "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:" + e(t.art + " in 30 Minuten"), "END:VALARM", "END:VEVENT");
    });
    z.push("END:VCALENDAR");
    return z.join("\r\n");
  }
  function icsLaden(liste, name) {
    var url = URL.createObjectURL(new Blob([icsText(liste)], { type: "text/calendar;charset=utf-8" }));
    var a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function kalDrawer(html) {
    closeDrawer(); lastFocus = document.activeElement;
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title");
    d.innerHTML = html; document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    var c = d.querySelector("[data-close]"); if (c) c.focus();
    d.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeDrawer(); });
    return d;
  }
  var kopfX = function (t) { return '<div class="drawer-head"><div><h2 id="drawer-title">' + t + '</h2></div><button class="icon-btn" type="button" data-close aria-label="Schließen">' + svg(ICON.x) + "</button></div>"; };
  function konflikt(neu, ohne) {
    var z = terminZeit(neu);
    return mod.termine.filter(function (t, i) {
      if (i === ohne) return false;
      var y = terminZeit(t); if (!(z.start < y.ende && y.start < z.ende)) return false;
      return TEAM.some(function (p) { return new RegExp(p).test(neu.wer) && new RegExp(p).test(t.wer); });
    })[0];
  }
  function kalTermin(i) {
    var t = mod.termine[i], z = terminZeit(t);
    var d = kalDrawer(kopfX(esc(t.art) + ": " + esc(t.name)) +
      '<div class="facts">' + fact("Wann", WTAG[z.start.getDay()] + ", " + z.start.getDate() + ". " + MON[z.start.getMonth()] + " · " + uhrzeit(z.start) + "–" + uhrzeit(z.ende)) + fact("Ort", t.ort) + fact("Team", t.wer) + fact("Worum es geht", t.info) + "</div>" +
      (t.typ !== "lager" ? '<p class="src">' + (t.offen ? '<span class="pill check">Bestätigung an den Kunden noch offen</span>' : '<span class="pill ok">' + svg(ICON.check) + "Kunde hat bestätigt</span>") + " Erinnerung per WhatsApp am Vortag um 18 Uhr.</p>" : "") +
      '<div class="kal-form"><p class="sec-title">Verschieben</p><div class="kal-fz"><label>Tag<input type="date" id="kv-tag" value="' + z.start.getFullYear() + "-" + pad2(z.start.getMonth() + 1) + "-" + pad2(z.start.getDate()) + '"></label><label>Uhrzeit<input type="time" id="kv-zeit" step="900" value="' + uhrzeit(z.start) + '"></label></div><p class="kal-warn" id="kv-warn"></p></div>' +
      '<div class="drawer-actions">' +
        (t.offen && t.typ !== "lager" ? '<button class="btn btn-signal" type="button" data-kd="bestaetigen">Bestätigung an Kunden senden</button>' : "") +
        '<button class="btn btn-outline" type="button" data-kd="verschieben">Verschieben und Kunden informieren</button>' +
        '<button class="btn btn-outline" type="button" data-kd="ics">' + svg(ICON.calendar) + "In meinen Kalender (.ics)</button>" +
        '<button class="btn btn-outline" type="button" data-kd="akte">Kundenakte öffnen</button>' +
        '<button class="btn btn-outline" type="button" data-kd="erledigt">' + (t.erledigt ? "Wieder als offen markieren" : "Als erledigt markieren") + "</button>" +
        '<button class="btn btn-outline danger" type="button" data-kd="loeschen">Termin löschen</button>' +
      "</div>");
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kd]"); if (!b) return;
      var a = b.getAttribute("data-kd");
      if (a === "bestaetigen") { t.offen = false; closeDrawer(); render(); toast("Terminbestätigung an " + t.name + " gesendet – mit Link zum Eintragen in den eigenen Kalender (Demo)."); }
      if (a === "ics") { icsLaden([t], "termin-" + t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".ics"); toast("Datei geladen – öffnen, dann landet der Termin im Kalender von Handy oder PC."); }
      if (a === "akte") { closeDrawer(); akteOeffnen(t.name); }
      if (a === "erledigt") { t.erledigt = !t.erledigt; var auE = t.auftragId && (state.auftraege || []).filter(function (x) { return x.id === t.auftragId; })[0]; if (auE) verlaufK(auE, "Termin " + t.tag + " " + t.zeit + (t.erledigt ? " erledigt" : " wieder offen")); closeDrawer(); render(); toast(t.erledigt ? "Termin erledigt." : "Termin wieder offen."); }
      if (a === "loeschen") { if (!confirm("Termin „" + t.art + ": " + t.name + "“ wirklich löschen?")) return; var auL = t.auftragId && (state.auftraege || []).filter(function (x) { return x.id === t.auftragId; })[0]; if (auL) verlaufK(auL, "Termin " + t.tag + " " + t.zeit + " gelöscht"); mod.termine.splice(i, 1); closeDrawer(); render(); toast("Termin gelöscht."); }
      if (a === "verschieben") {
        var tag = document.getElementById("kv-tag").value, zeit = document.getElementById("kv-zeit").value;
        if (!tag || !zeit) return;
        var neu = Object.assign({}, t, { datum: tag + "T00:00", zeit: zeit });
        var k = konflikt(neu, i);
        if (k && !b.dataset.trotzdem) { document.getElementById("kv-warn").textContent = "Achtung: Überschneidung mit „" + k.art + ": " + k.name + "“ (" + k.zeit + " Uhr). Nochmal tippen, um trotzdem zu verschieben."; b.dataset.trotzdem = "1"; return; }
        t.datum = neu.datum; t.zeit = zeit; t.tag = tagLabel(tagDatum(null, t.datum)); t.offen = t.typ !== "lager";
        closeDrawer(); render(); toast("Verschoben auf " + t.tag + " " + zeit + " Uhr – " + (t.typ !== "lager" ? t.name + " bekommt eine Nachricht, " : "") + "das Team sieht es sofort auf dem Handy (Demo).");
      }
    });
  }
  function kalNeu(tagIso, zeit, person) {
    var d0 = tagIso ? new Date(tagIso) : plusTage(heute0(), 1), eigen = EIGEN[state.rolle];
    var vor = eigen || person || (TEAM.indexOf(state.kal.wer) > -1 ? state.kal.wer : "Alex");
    var d = kalDrawer(kopfX("Neuer Termin") +
      '<div class="kal-form">' +
        '<label>Kunde oder Titel<input type="text" id="kn-name" placeholder="z. B. Familie Huber" value=""></label>' +
        '<div class="kal-fz"><label>Art<select id="kn-art">' + ["Besichtigung", "Aufmaß", "Ausführung", "Wartung", "Kundendienst", "Abnahme", "Notdienst", "Intern"].map(function (a) { return "<option>" + a + "</option>"; }).join("") + '</select></label>' +
        '<label>Dauer<select id="kn-dauer">' + [[30, "30 Min."], [60, "1 Std."], [90, "1,5 Std."], [120, "2 Std."], [240, "4 Std."], [480, "ganzer Tag"]].map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === 60 ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select></label></div>" +
        '<div class="kal-fz"><label>Tag<input type="date" id="kn-tag" value="' + d0.getFullYear() + "-" + pad2(d0.getMonth() + 1) + "-" + pad2(d0.getDate()) + '"></label><label>Uhrzeit<input type="time" id="kn-zeit" step="900" value="' + (zeit || "09:00") + '"></label></div>' +
        '<label>Ort<input type="text" id="kn-ort" placeholder="z. B. Erlangen"></label>' +
        '<fieldset class="kal-team"><legend>Wer? Der Termin erscheint im Kalender dieser Personen</legend>' + TEAM.map(function (p) { return '<label><input type="checkbox" value="' + p + '"' + (p === vor ? " checked" : "") + (eigen && p !== eigen ? " disabled" : "") + "> " + p + "</label>"; }).join("") + "</fieldset>" +
        (eigen ? '<p class="src">Sie tragen Termine in Ihren eigenen Kalender ein. Für andere Personen trägt das Büro ein.</p>' : "") +
        '<label class="kal-check"><input type="checkbox" id="kn-kunde" checked> Kunde bekommt eine Bestätigung mit Kalender-Eintrag</label>' +
        '<p class="kal-warn" id="kn-warn"></p>' +
      '</div><div class="drawer-actions"><button class="btn btn-signal" type="button" id="kn-speichern">Termin anlegen</button><button class="btn btn-outline" type="button" data-close>Abbrechen</button></div>');
    d.querySelector("#kn-name").focus();
    d.querySelector("#kn-speichern").addEventListener("click", function () {
      var name = d.querySelector("#kn-name").value.trim(), tag = d.querySelector("#kn-tag").value, zeit = d.querySelector("#kn-zeit").value;
      var wer = Array.prototype.filter.call(d.querySelectorAll(".kal-team input"), function (x) { return x.checked; }).map(function (x) { return x.value === "Stefan" ? "Stefan (Außendienst)" : x.value; }).join(", ");
      if (!name || !tag || !zeit || !wer) { d.querySelector("#kn-warn").textContent = "Bitte Titel, Tag, Uhrzeit und mindestens eine Person angeben."; return; }
      var art = d.querySelector("#kn-art").value;
      var t = { datum: tag + "T00:00", zeit: zeit, art: art, name: name, ort: d.querySelector("#kn-ort").value.trim() || "Ort folgt", wer: wer, info: "Neu angelegt im Kalender", dauer: +d.querySelector("#kn-dauer").value, offen: d.querySelector("#kn-kunde").checked, typ: art === "Intern" ? "lager" : art === "Aufmaß" ? "aufmass" : art === "Wartung" ? "wartung" : art === "Abnahme" ? "abnahme" : "regie" };
      t.tag = tagLabel(tagDatum(null, t.datum));
      var k = konflikt(t, -1), btn = this;
      if (k && !btn.dataset.trotzdem) { d.querySelector("#kn-warn").textContent = "Achtung: " + wer.replace(" (Außendienst)", "") + " hat zu dieser Zeit schon „" + k.art + ": " + k.name + "“. Nochmal tippen, um trotzdem anzulegen."; btn.dataset.trotzdem = "1"; return; }
      mod.termine.push(t); closeDrawer(); render();
      toast("Termin angelegt – erscheint sofort im Handy-Kalender von " + wer.replace(" (Außendienst)", "") + (t.offen ? "; der Kunde bekommt eine Bestätigung" : "") + " (Demo).");
    });
  }
  function kalSync() {
    var s = state.kal.sync;
    var zeile = function (id, name, text) { return '<div class="switch-row"><div><b>' + name + "</b><p>" + text + '</p></div><label class="switch"><input type="checkbox" data-kal-dienst="' + id + '"' + (s[id] ? " checked" : "") + '><span></span></label></div>'; };
    var d = kalDrawer(kopfX("Kalender verbinden") +
      '<p>Termine aus dem Cockpit erscheinen automatisch im Kalender auf Handy und PC – und umgekehrt blockieren private Termine die Zeit im Cockpit, damit nichts doppelt gebucht wird. Private Termine sieht im Betrieb niemand im Detail, nur als „belegt“.</p>' +
      zeile("google", "Google Kalender", "Android-Handys und Gmail · Abgleich in beide Richtungen") +
      zeile("outlook", "Outlook / Microsoft 365", "PC im Büro · Abgleich in beide Richtungen") +
      zeile("apple", "iPhone / iCloud-Kalender", "iPhone, iPad und Mac · Abgleich in beide Richtungen") +
      '<div class="kal-abo"><p class="sec-title">Für jedes Handy: Kalender-Abo</p><p>' + (EIGEN[state.rolle] ? "Ihr persönlicher Link mit Ihren Terminen." : "Jede Person bekommt einen eigenen Link nur mit ihren Terminen; Büro und Geschäftsführung zusätzlich einen Link mit allen Terminen.") + ' Einmal antippen – fertig, auch ohne Konto bei Google oder Apple.</p>' +
        '<div class="kal-abo-link"><code>webcal://kalender.' + (window.SITE && window.SITE.domain && window.SITE.domain.indexOf("[") < 0 ? window.SITE.domain : "ihre-domain.de") + '/abo/' + (EIGEN[state.rolle] || "team").toLowerCase() + '-7f3k.ics</code><button class="btn-mini" type="button" data-kal-kopie>Kopieren</button></div></div>' +
      '<div class="kal-abo"><p class="sec-title">Sofort ausprobieren</p><p>Laden Sie die Termine dieser Woche als Datei. Auf dem Handy öffnen – die Termine landen in Ihrem echten Kalender.</p><button class="btn btn-outline" type="button" data-kal-woche>' + svg(ICON.calendar) + "Diese Woche als .ics laden</button></div>" +
      '<p class="src">In der echten Version erfolgt die Anmeldung bei Google, Microsoft oder Apple einmalig mit dem jeweiligen Konto; Zugriff nur auf den Kalender.</p>');
    d.addEventListener("change", function (e) {
      var c = e.target.closest("[data-kal-dienst]"); if (!c) return;
      s[c.getAttribute("data-kal-dienst")] = c.checked; render();
      toast(c.checked ? "Kalender verbunden (Demo) – private Termine erscheinen als „belegt“." : "Verbindung getrennt (Demo).");
    });
    d.addEventListener("click", function (e) {
      if (e.target.closest("[data-kal-kopie]")) { var t = d.querySelector(".kal-abo-link code").textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {}); toast("Abo-Link kopiert (Demo-Link)."); }
      if (e.target.closest("[data-kal-woche]")) {
        var ws = wochenStart(heute0()), we = plusTage(ws, 7);
        var ich = EIGEN[state.rolle];
        icsLaden(mod.termine.filter(function (t) { var z = terminZeit(t); return z.start >= ws && z.start < we && (!ich || new RegExp(ich).test(t.wer)); }), "termine-diese-woche.ics");
        toast("Datei geladen – öffnen, dann sind alle Termine dieser Woche in Ihrem Kalender.");
      }
    });
  }


  /* =====================================================================
     BRANCHEN-VORSCHAU: dasselbe Cockpit für IT-Service, Reinigung,
     Hausmeister/GaLaBau und Sicherheits-/Klimatechnik
     ===================================================================== */
  var BRANCHEN = {
    it: { name: "IT-Service", betrieb: "Muster IT-Service GmbH", worte: [["Anfragen", "Tickets"], ["Montagekräfte", "Techniker"], ["Regiebericht", "Einsatzbericht"], ["Aufmaß", "Bestandsaufnahme"]],
      liste: "Offene Tickets", zeilen: [["Server startet nicht", "Kanzlei Weber · Erlangen", "Priorität hoch", "urgent", "noch 1:20 Std. bis Reaktionszeit"], ["Drucker im 2. OG offline", "Autohaus Lindner · Fürth", "normal", "check", "heute bis 16 Uhr"], ["Neuer Arbeitsplatz einrichten", "Praxis Dr. Sommer · Nürnberg", "geplant", "ok", "Do 09:00 · Robin"], ["Angebot 5 Notebooks", "Bauer Logistik · Schwabach", "Angebot offen", "check", "Nachfassen morgen (Tag 7)"]],
      form: "Einsatzbericht", punkte: ["Störung aufgenommen und Ursache gefunden", "Netzteil getauscht (Material: 1 Stück)", "System getestet, Datensicherung geprüft", "Kunde eingewiesen"], kpi: [["Tickets offen", "7"], ["Reaktionszeit eingehalten", "96 %"], ["Wartungsverträge", "23"]] },
    reinigung: { name: "Gebäudereinigung", betrieb: "Muster Gebäudedienste", worte: [["Anfragen", "Anfragen"], ["Montagekräfte", "Reinigungskräfte"], ["Regiebericht", "Reinigungsnachweis"], ["Aufmaß", "Objektaufnahme"]],
      liste: "Objekte heute", zeilen: [["Bürohaus Am Hafen, 3 Etagen", "Nürnberg · Tour 1", "erledigt 06:42", "ok", "Nachweis mit 6 Fotos"], ["Arztpraxis Hauptstraße", "Erlangen · Tour 1", "läuft", "check", "seit 07:15 · Nadia"], ["Wohnanlage Regnitzstraße 12", "Erlangen · Treppenhaus", "geplant", "ok", "14:00 · Jonas"], ["Reklamation Küche 2. OG", "Bürohaus Am Hafen", "Frist heute", "urgent", "Nachbesserung bis 17 Uhr"]],
      form: "Reinigungsnachweis", punkte: ["Böden gesaugt und gewischt", "Sanitärräume gereinigt, Verbrauchsmaterial aufgefüllt", "Küche und Oberflächen gereinigt", "Müll entsorgt"], kpi: [["Objekte", "41"], ["Nachweise diese Woche", "188"], ["Reklamationen", "1"]] },
    hausmeister: { name: "Hausmeister & GaLaBau", betrieb: "Muster Hausmeisterservice", worte: [["Anfragen", "Anfragen"], ["Montagekräfte", "Mitarbeiter"], ["Regiebericht", "Leistungsnachweis"], ["Aufmaß", "Objektbegehung"]],
      liste: "Einsätze heute", zeilen: [["Winterdienst Tour Nord", "8 Objekte · Erlangen", "Frost ab 4 Uhr", "urgent", "Start 05:30 · Protokoll läuft"], ["Rasenpflege WEG Sonnenhang", "Fürth", "geplant", "ok", "10:00 · Ben"], ["Leuchtmittel Treppenhaus", "HV Kaya · Fürth", "Auftrag", "check", "Meldung mit Foto von Mieterin"], ["Angebot Heckenschnitt", "Familie Roth · Erlangen", "Angebot offen", "check", "Nachfassen heute (Tag 3)"]],
      form: "Winterdienst-Protokoll", punkte: ["Gehwege geräumt", "Gestreut (Splitt, 2 Säcke)", "Zugänge und Treppen geprüft", "Foto mit Uhrzeit aufgenommen"], kpi: [["Objekte", "64"], ["Einsätze diese Woche", "121"], ["Nachweise an HV", "100 %"]] },
    sicherheit: { name: "Sicherheits- & Klimatechnik", betrieb: "Muster Sicherheitstechnik", worte: [["Anfragen", "Anfragen und Störungen"], ["Montagekräfte", "Techniker"], ["Regiebericht", "Prüfprotokoll"], ["Aufmaß", "Anlagenaufnahme"]],
      liste: "Fristen und Störungen", zeilen: [["Alarmanlage meldet Fehler", "Juwelier Stein · Nürnberg", "Störung", "urgent", "Bereitschaft: Tim · unterwegs"], ["Jahreswartung Videoanlage", "Autohaus Lindner · Fürth", "fällig in 9 Tagen", "check", "Termin vorgeschlagen"], ["Dichtheitsprüfung Kälteanlage", "Metzgerei Huber · Erlangen", "fällig in 21 Tagen", "check", "gesetzliche Frist"], ["Klimaanlage Büro, 4 Geräte", "Kanzlei Weber · Erlangen", "Angebot offen", "check", "Nachfassen morgen"]],
      form: "Prüfprotokoll Alarmanlage", punkte: ["Zentrale und Akku geprüft", "Melder ausgelöst und getestet", "Übertragung zur Leitstelle getestet", "Mängel: keine"], kpi: [["Anlagen", "312"], ["Fristen diesen Monat", "27"], ["Verträge", "88"]] }
  };
  function viewBranchen() {
    if (!state.branche) state.branche = "it";
    var b = BRANCHEN[state.branche] || BRANCHEN.it;
    $main.innerHTML = head("Andere Branchen", "Dasselbe Cockpit – mit Begriffen, Vorlagen und Kennzahlen Ihrer Branche. Vertriebsschwerpunkt im ersten Jahr ist das Handwerk, die Vorlagen für diese Branchen sind bereits vorbereitet.") +
      '<div class="br-tabs" role="tablist">' + Object.keys(BRANCHEN).map(function (k) { return '<button type="button" role="tab" data-branche="' + k + '" aria-selected="' + (k === state.branche) + '">' + BRANCHEN[k].name + "</button>"; }).join("") + "</div>" +
      '<div class="br-voll"><p class="src">So sähe das Cockpit für <b>' + esc(b.betrieb) + "</b> aus (Beispieldaten).</p>" +
      '<a class="btn btn-dark" href="demo.html?branche=' + state.branche + '">Komplette Demo für ' + esc(b.name) + " öffnen</a></div>" +
      '<div class="kpis">' + b.kpi.map(function (x) { return '<div class="kpi"><span>' + x[0] + "</span><b>" + x[1] + "</b></div>"; }).join("") + "</div>" +
      '<div class="br-grid"><section class="panel"><h2>' + b.liste + '</h2><div class="rows">' + b.zeilen.map(function (z) {
        return '<div class="row"><div class="row-main"><strong>' + esc(z[0]) + "</strong><small>" + esc(z[1]) + " · " + esc(z[4]) + '</small></div><div class="row-side"><span class="pill ' + z[3] + '">' + esc(z[2]) + "</span></div></div>";
      }).join("") + "</div></section>" +
      '<section class="panel br-form"><h2>' + b.form + ' <small>am Handy</small></h2><ul class="br-check">' + b.punkte.map(function (p, i) { return '<li><label><input type="checkbox"' + (i < 2 ? " checked" : "") + "> " + esc(p) + "</label></li>"; }).join("") + "</ul>" +
        '<p class="src">' + svg(ICON.camera) + " 3 Fotos · Uhrzeit und Ort werden automatisch gespeichert</p>" +
        '<button class="btn btn-signal" type="button" data-br-fertig>Abschließen und an den Kunden senden</button></section></div>' +
      '<section class="panel"><h2>So heißt es bei Ihnen</h2><div class="br-worte">' + b.worte.map(function (w) { return "<span><s>" + w[0] + "</s> → <b>" + w[1] + "</b></span>"; }).join("") + "</div>" +
        '<p class="src">Alle anderen Funktionen – Kalender, Nachfassen, Rechnungen, Bewertungen, Kundenbereich, Unterschriften – sind gleich. Neue Branche einrichten: 2–3 Arbeitstage.</p></section>';
  }

  /* --- Ausschreibungen --- */

  /* --- Netzwerk / Vermittlung --- */
  var BEW_START = [
    { name: "Maria R.", ort: "Erlangen", titel: "Wasserhahn Küche", sterne: 5, noten: { qualitaet: 5, preis: 5, termin: 5, sauber: 5, kontakt: 5 }, text: "Super, vielen Dank für den schnellen Termin!", datum: "10.09.2026", antwort: "Danke, Frau R. – gern wieder!" },
    { name: "Stefan K.", ort: "Fürth", titel: "Heizungswartung", sterne: 4, noten: { qualitaet: 5, preis: 4, termin: 3, sauber: 5, kontakt: 4 }, text: "Gute Arbeit, Termin musste einmal verschoben werden.", datum: "28.08.2026" },
    { name: "Petra L.", ort: "Herzogenaurach", titel: "Badsanierung", sterne: 5, noten: { qualitaet: 5, preis: 5, termin: 4, sauber: 5, kontakt: 5 }, text: "Angebot wurde genau eingehalten, sehr ordentlich.", datum: "02.08.2026" }];
  function bewertungenAlle() {
    state.bew = state.bew || JSON.parse(JSON.stringify(BEW_START));
    var aus = []; try { aus = JSON.parse(localStorage.getItem("portal-bewertungen") || "[]"); } catch (e) { aus = []; }
    return aus.slice().reverse().map(function (b, i) { return Object.assign({ name: "Kundschaft", demo: true, key: "p" + i }, b, { antwort: (state.bewAntwort || {})["p" + i] }); }).concat(state.bew.map(function (b, i) { return Object.assign({ key: "s" + i }, b); }));
  }
  function bewertungenPanel() {
    var L = bewertungenAlle(), K = window.BETRIEBE ? window.BETRIEBE.KRIT : [];
    var mittel = function (k) { var x = L.filter(function (b) { return b.noten && b.noten[k]; }); return x.length ? x.reduce(function (s2, b) { return s2 + b.noten[k]; }, 0) / x.length : 0; };
    var ges = L.length ? L.reduce(function (s2, b) { return s2 + b.sterne; }, 0) / L.length : 0;
    return '<section class="panel" id="nz-bewertungen" style="margin-bottom:14px"><h2>Ihre Bewertungen im Portal</h2>' +
      '<div class="bw-kopf"><div class="bw-gesamt"><b>' + ges.toFixed(1).replace(".", ",") + '</b><span class="bw-sterne">' + "★★★★★".slice(0, Math.round(ges)) + "</span><small>" + L.length + " geprüfte Bewertungen</small></div>" +
        '<div class="bw-krit">' + K.map(function (k) { var m = mittel(k[0]); return '<div><span>' + k[1] + '</span><i><em style="width:' + (m / 5 * 100) + '%"></em></i><b>' + m.toFixed(1).replace(".", ",") + "</b></div>"; }).join("") + "</div></div>" +
      '<div class="rows">' + L.map(function (b) {
        return '<div class="row bw-row"><div class="row-main"><strong><span class="bw-sterne">' + "★★★★★".slice(0, b.sterne) + "</span> " + esc(b.titel || "") + "</strong><small>" + esc(b.name) + (b.ort ? " aus " + esc(b.ort) : "") + " · " + esc(b.datum || "") + " · Auftrag abgeschlossen, Rechnung bezahlt" + (b.demo ? " · aus dem Kundenbereich (Demo, Betrieb: " + esc(b.betrieb) + ")" : "") + "</small>" +
          (b.text ? "<p>„" + esc(b.text) + "“</p>" : "") + (b.antwort ? '<p class="bw-antwort"><b>Ihre Antwort:</b> ' + esc(b.antwort) + "</p>" : "") + '</div><div class="row-side">' +
          (b.antwort ? "" : '<button class="btn-mini" type="button" data-bw-antwort="' + b.key + '">Öffentlich antworten</button>') + '<button class="btn-mini" type="button" data-bw-melden="' + b.key + '">Melden</button></div></div>'; }).join("") + "</div>" +
      '<p class="src">Bewerten kann nur Kundschaft mit abgeschlossenem und bezahltem Auftrag über das Portal. Bewertungen können Sie nicht löschen, aber öffentlich antworten. Beleidigungen oder falsche Tatsachen melden Sie – wir prüfen innerhalb von 3 Werktagen. Nach jeder Bewertung bekommt die Kundschaft Ihren Google-Link angeboten – unabhängig von der Sternezahl, wie Google es verlangt.</p></section>';
  }
  function bwKlick(t) {
    var el;
    if ((el = t.closest("[data-bw-antwort]"))) {
      var key = el.getAttribute("data-bw-antwort");
      formDrawerIn(el.closest(".row"), '<label>Ihre öffentliche Antwort<textarea name="text" rows="3" required placeholder="Kurz, freundlich und sachlich – andere Kunden lesen mit."></textarea></label><div class="btn-row"><button class="btn btn-signal" type="submit">Antwort veröffentlichen</button></div>', function (fd) {
        if (!String(fd.text || "").trim()) return;
        if (key[0] === "s") state.bew[+key.slice(1)].antwort = fd.text.trim(); else { state.bewAntwort = state.bewAntwort || {}; state.bewAntwort[key] = fd.text.trim(); }
        toast("Antwort veröffentlicht."); render();
      });
      return true;
    }
    if (t.closest("[data-bw-melden]")) { toast("Gemeldet – wir prüfen die Bewertung innerhalb von 3 Werktagen. Sie bleibt bis dahin sichtbar."); return true; }
    return false;
  }
  function viewNetzwerk() {
    var ich = PARTNER[0], meine = state.vm.filter(function (v) { return v.partner === BETRIEB; });
    $main.innerHTML = head("Aufträge aus dem Netzwerk", "Hausverwaltungen, Bauherren und Endkunden aus dem Auftragsportal suchen Fachbetriebe. Den Vertrag schließen Sie direkt mit dem Auftraggeber.",
        "Kein Monatsbeitrag. Provision nur, wenn Sie den Auftrag bekommen.") +
      '<section class="panel" id="nz-filter" style="margin-bottom:14px"><h2>Ihre Einstellungen für vermittelte Aufträge</h2><div class="nz-grid">' +
        '<label class="nz-feld">Mindestauftragswert<select id="nz-min">' + [0, 1000, 3000, 5000, 10000].map(function (w) { return '<option value="' + w + '"' + ((ich.min || 0) === w ? " selected" : "") + ">" + (w ? "ab " + euro.format(w) : "jede Größe") + "</option>"; }).join("") + "</select></label>" +
        '<div class="nz-feld">Gewerke<div class="nz-chips" data-nt>' + gewerkeAlle().map(function (id) { return [gwName(id), gwName(id)]; }).concat(ich.gewerk.filter(function (g) { return gewerkeAlle().map(gwName).indexOf(g) < 0; }).map(function (g) { return [g, g]; })).map(function (g) { return '<label><input type="checkbox" data-nz-gewerk="' + g[0] + '"' + (ich.gewerk.indexOf(g[0]) > -1 ? " checked" : "") + "> " + g[1] + "</label>"; }).join("") + "</div></div>" +
        '<label class="nz-feld">Vergleichsanfragen<select id="nz-vgl">' + [["ja", "annehmen (max. 3 Betriebe)"], ["ab5000", "erst ab 5.000 €"], ["nein", "keine annehmen"]].map(function (o) { return '<option value="' + o[0] + '"' + ((ich.vgl || "ja") === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
        '<label class="nz-feld">Ihr Google-Bewertungslink<input id="nz-google" type="url" placeholder="https://g.page/r/…/review" value="' + esc(ich.google || "") + '"><small class="src">Steht in Ihrem Google-Unternehmensprofil unter „Mehr Rezensionen erhalten“. Kundschaft bekommt ihn nach jeder Portal-Bewertung angeboten.</small></label>' +
        '<div class="switch-row nz-feld"><div><b>Gerade voll</b><p>Keine neuen Anfragen, bis Sie wieder Platz haben</p></div><label class="switch"><input type="checkbox" id="nz-voll"' + (ich.voll ? " checked" : "") + ' aria-label="Gerade voll"><span></span></label></div>' +
      '</div><p class="src">Diesen Monat über das Portal vermittelt: <b>' + meine.length + "</b> · daraus Aufträge: <b>" + meine.filter(function (v) { return v.status === "auftrag"; }).length + "</b> · Sie bekommen nur Anfragen mit Note A oder B – vorgeprüft, mit Fotos und Budget-Abgleich.</p></section>" +
      bewertungenPanel() +
      '<div class="nz-karten" id="netz-liste">' + mod.netz.map(function (n, i) {
        return '<article class="nz-karte"><div class="nz-oben"><span class="nz-ort">' + svg(ICON.home) + esc(n.ort) + '</span><span class="nz-von">' + esc(n.von) + "</span></div>" +
          "<h3>" + esc(n.titel) + '</h3><p class="nz-info">' + esc(n.info) + '</p><div class="nz-zahlen"><div><small>Auftragswert</small><b>' + euro.format(n.wert) + "</b></div><div><small>Provision bei Auftrag</small><b>" + Math.round(n.prov * 100) + " % · " + euro.format(n.wert * n.prov) + "</b></div></div>" +
          (n.gemeldet ? '<span class="pill ok">' + svg(ICON.check) + "Interesse gemeldet</span>" : '<button class="btn btn-signal" type="button" data-netz="' + i + '">Interesse melden</button>') + "</article>";
      }).join("") + "</div>";
  }

  /* --- Personal --- */
  function viewPersonal() {
    var stufe = function (b) { return b.stufe || (b.erledigt ? (b.passt ? "gespraech" : "abgesagt") : "neu"); };
    var SP = [["neu", "Neu"], ["gespraech", "Gespräch"], ["zusage", "Zusage"]];
    var abgesagt = mod.bew.filter(function (b) { return stufe(b) === "abgesagt"; }).length;
    var karte = function (b) {
      var i = mod.bew.indexOf(b), st = stufe(b);
      var knopf = st === "neu" ? '<button class="btn-mini primary" type="button" data-bew="' + i + '">' + (b.passt ? "Gespräch vorschlagen" : "Freundlich absagen") + "</button>" :
        st === "gespraech" ? '<button class="btn-mini primary" type="button" data-bew-zusage="' + i + '">Zusage senden</button>' : '<span class="pill ok">' + svg(ICON.check) + "Vertrag folgt</span>";
      return '<div class="lead pers-karte"><div class="lead-top"><span class="pers-av">' + b.name.charAt(0) + "</span><div><strong>" + esc(b.name) + "</strong><small>" + esc(b.stelle) + "</small></div></div>" +
        '<p class="lead-sub">' + esc(b.info) + "</p>" + '<div class="lead-meta">' + (b.passt ? '<span class="pill ok">Muss-Kriterien erfüllt</span>' : '<span class="pill check">Kriterien prüfen</span>') + "<small>" + b.wann + "</small></div>" + knopf + "</div>";
    };
    $main.innerHTML = head("Personal finden", "Stellenanzeigen und Bewerbungen an einem Ort. Antworten sind vorbereitet – entscheiden tun immer Sie.",
        '<span class="pill ok">Modul Personal finden</span> Kurzbewerbung per WhatsApp in 60 Sekunden, ohne Lebenslauf · Anzeigen geprüft nach dem Gleichbehandlungsgesetz · Bewerberdaten werden nach 6 Monaten gelöscht') +
      '<div class="kpis">' + kpi("Offene Stellen", "2", "Anlagenmechaniker, Azubi") + kpi("Bewerbungen", String(mod.bew.length), "diese Woche") +
        kpi("Anzeige läuft auf", "4 Kanälen", "Jobbörse der Arbeitsagentur, Indeed, Website, Instagram") + kpi("Antwortzeit", "unter 24 h", abgesagt ? abgesagt + " freundlich abgesagt" : "schnelle Antwort zählt") + "</div>" +
      '<div class="board-wrap"><div class="board pers-board" id="bew-liste">' + SP.map(function (sp) {
        var items = mod.bew.filter(function (b) { return stufe(b) === sp[0]; });
        return '<section class="col"><div class="col-head"><h2>' + sp[1] + "</h2><small>" + items.length + "</small></div>" + (items.length ? items.map(karte).join("") : '<p class="col-empty">Noch niemand</p>') + "</section>";
      }).join("") + "</div></div>";
  }

  /* --- Pflichten & Fristen (Modul) ---
     Erinnerung und Ablage der Nachweise, keine Rechtsberatung. */
  function viewFristen() {
    var liste = mod.fristen.slice().sort(function (a, b) { return a.tage - b.tage; });
    var ueber = liste.filter(function (f) { return !f.ok && f.tage < 0; }), bald = liste.filter(function (f) { return !f.ok && f.tage >= 0 && f.tage <= 30; });
    var heute = heute0(), monat = function (f) { if (f.tage < 0 && !f.ok) return "Überfällig"; var d = plusTage(heute, Math.max(f.tage, 0)); return MON[d.getMonth()] + " " + d.getFullYear(); };
    var gruppen = []; liste.forEach(function (f) { var m = monat(f); var g = gruppen.filter(function (x) { return x[0] === m; })[0]; if (!g) gruppen.push(g = [m, []]); g[1].push(f); });
    $main.innerHTML = head("Pflichten & Fristen", "Prüfungen, Unterweisungen und Nachweise von Nachunternehmern – das Cockpit erinnert rechtzeitig, die Nachweise liegen an einem Ort.",
        '<span class="pill ok">Modul Pflichten &amp; Fristen</span> Erinnerung und Ablage, keine Rechtsberatung') +
      '<div class="kpis">' + kpi("Überfällig", String(ueber.length), ueber.length ? "bitte erledigen" : "alles aktuell") + kpi("In 30 Tagen fällig", String(bald.length), "Termine vorschlagen") +
        kpi("Nachunternehmer", "2", "Nachweise vollständig: " + (mod.fristen[0].ok ? "ja" : "1 fehlt")) + kpi("Nächste Unterweisung", "in 30 Tagen", "digital mit Unterschrift") + "</div>" +
      '<section class="panel" id="fristen-liste"><div class="zl">' + gruppen.map(function (g) {
        return '<div class="zl-monat' + (g[0] === "Überfällig" ? " ueber" : "") + '"><h3>' + g[0] + "</h3>" + g[1].map(function (f) {
          var i = mod.fristen.indexOf(f), cls = f.ok ? "ok" : f.tage < 0 ? "rot" : f.tage <= 30 ? "gelb" : "grau";
          return '<div class="zl-punkt ' + cls + '"><div class="zl-inhalt"><b>' + esc(f.was) + "</b><small>" + esc(f.art) + " · " + esc(f.wer) + " · " +
            (f.ok ? "erledigt" : f.tage < 0 ? "seit " + (-f.tage) + " Tagen fällig" : "in " + f.tage + " Tagen") + "</small></div>" +
            (f.ok ? '<span class="pill ok">' + svg(ICON.check) + "erledigt</span>" : '<button class="btn-mini' + (f.tage < 0 ? " primary" : "") + '" type="button" data-frist="' + i + '">' + f.akt + "</button>") + "</div>";
        }).join("") + "</div>";
      }).join("") + "</div></section>" +
      '<p class="src" style="margin-top:12px">Warum das wichtig ist: Fehlt die Freistellungsbescheinigung eines Nachunternehmers, muss der Betrieb 15 % der Rechnung als Bauabzugsteuer einbehalten und ans Finanzamt zahlen – sonst haftet er dafür.</p>';
  }

  /* --- Material & Bestellung (Modul) --- */
  function viewMaterial() {
    var an = mod.mat.filter(function (m) { return m.an; });
    var summe = an.reduce(function (s, m) { return s + m.menge * m.preis; }, 0);
    var knapp = mod.lager.filter(function (l) { return l.ist < l.min; });
    $main.innerHTML = head("Material & Bestellung", "Material aus Aufmaß und Aufträgen sammeln, beim Großhändler bestellen und den Bestand im Firmenwagen im Blick behalten.",
        '<span class="pill ok">Modul Material &amp; Bestellung</span> Bestellung über die Schnittstelle Ihres Großhändlers (IDS) · Preise aus Ihren Konditionen (Datanorm)') +
      '<div class="mat-layout">' +
        '<section id="mat-liste" aria-labelledby="ml-h"><h2 id="ml-h" class="sec-title">Material aus Ihren Aufträgen</h2><div class="mat-grid">' +
          mod.mat.map(function (m, i) {
            return '<button type="button" class="mat-kachel' + (m.an ? " an" : "") + '" data-mat="' + i + '" aria-pressed="' + m.an + '"><span class="mat-ic">' + svg(ICON.box) + '</span><b>' + esc(m.name) + "</b><small>für " + esc(m.auftrag) + '</small><span class="mat-fuss"><span class="mat-menge">' + m.menge + " " + m.einheit + "</span><span>" + euro.format(m.menge * m.preis) + "</span></span>" +
              '<span class="mat-check">' + (m.an ? svg(ICON.check) : "+") + "</span></button>";
          }).join("") + "</div>" +
          '<h2 class="sec-title" style="margin-top:18px">Lager im Firmenwagen</h2><div class="lager-grid" id="mat-lager">' +
          mod.lager.map(function (l, i) {
            var pr = Math.min(100, l.ist / (l.min * 2) * 100), knp = l.ist < l.min;
            return '<div class="lager' + (knp ? " knapp" : "") + '"><b>' + esc(l.name) + '</b><span class="lager-bar"><i style="width:' + pr + '%"></i><em style="left:50%"></em></span><small>' + l.ist + " da · mindestens " + l.min + "</small>" +
              (knp ? '<button class="btn-mini" type="button" data-lager="' + i + '">nachbestellen</button>' : "") + "</div>";
          }).join("") + "</div></section>" +
        '<aside class="panel mat-korb" aria-labelledby="mk-h"><h2 id="mk-h">Bestellung</h2><p class="src">' + esc(mod.grosshandel) + " · Lieferung morgen 7 Uhr an die Werkstatt</p>" +
          (an.length ? '<ul class="korb">' + an.map(function (m) { return "<li><span>" + m.menge + " × " + esc(m.name) + "</span><b>" + euro.format(m.menge * m.preis) + "</b></li>"; }).join("") + "</ul>" : '<p class="col-empty">' + (mod.bestellt ? "Bestellung ist unterwegs." : "Noch nichts ausgewählt.") + "</p>") +
          '<div class="korb-summe"><span>Summe netto</span><b>' + euro.format(summe) + "</b></div>" +
          (mod.bestellt && !an.length ? '<span class="pill ok">' + svg(ICON.check) + "an " + esc(mod.grosshandel) + " gesendet</span>" :
            '<button class="btn btn-signal" type="button" data-mat-bestellen' + (an.length ? "" : " disabled") + ' style="width:100%">Bestellung freigeben</button>') +
          (knapp.length ? '<p class="src" style="margin-top:10px">' + knapp.length + " Artikel im Firmenwagen knapp</p>" : "") +
        "</aside></div>";
  }

  /* --- Vorlesen (Morgenbericht) ---------------------------------------
     Eigener Sprechtext in ganzen Sätzen, Absatz für Absatz mit Pause.
     Die Stimme kommt vom Gerät; wir nehmen automatisch die natürlichste
     deutsche Stimme. Unter „Stimme“ lässt sie sich ändern.            */
  var sprache = { stimme: null, tempo: 1, laeuft: false, timer: null };
  try { sprache.stimme = localStorage.getItem("demo-stimme"); sprache.tempo = parseFloat(localStorage.getItem("demo-tempo")) || 1; } catch (e) { /* privat */ }
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function stimmen() {
    if (!("speechSynthesis" in window)) return [];
    var punkte = function (v) {
      var n = v.name;
      return (/Natural|Neural|Online|Multilingual/i.test(n) ? 60 : 0) + (/Katja|Conrad|Seraphina|Florian|Amala|Killian|Anna|Petra|Markus|Helena|Yannick/i.test(n) ? 20 : 0) + (/Hedda|Stefan - German|Microsoft Hedda|eSpeak|espeak/i.test(n) ? -40 : 0) + (/Premium/i.test(n) ? 50 : 0) + (/Enhanced|Erweitert|Verbessert/i.test(n) ? 40 : 0) +
        (/Siri/i.test(n) ? 35 : 0) + (/Google/i.test(n) ? 25 : 0) + (/de-DE/i.test(v.lang) ? 5 : 0) + (/Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley/i.test(n) ? -30 : 0);
    };
    return speechSynthesis.getVoices().filter(function (v) { return /^de/i.test(v.lang); })
      .sort(function (a, b) { return punkte(b) - punkte(a); });
  }
  function aktuelleStimme() {
    var alle = stimmen();
    return alle.filter(function (v) { return v.name === sprache.stimme; })[0] || alle[0] || null;
  }
  var STD = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
  var uhr = function (z) {   // „Viertel nach sieben“, „halb drei“, „um vier“ – so wie man es sagt
    var p = String(z).split(":"), h = +p[0], m = +p[1] || 0, h12 = function (x) { x = x % 12; return x === 0 ? "zwölf" : x === 1 ? "eins" : STD[x]; };
    if (m === 0) return (h % 12 === 1 ? "ein" : h12(h)) + " Uhr";
    if (m === 15) return "Viertel nach " + h12(h);
    if (m === 30) return "halb " + h12(h + 1);
    if (m === 45) return "Viertel vor " + h12(h + 1);
    return h + " Uhr " + m;
  };
  var euroSp = function (n) { n = Math.round(n); if (n >= 1000) { var r = Math.round(n / 100) * 100; return (r === n ? "" : "rund ") + r.toLocaleString("de-DE") + " Euro"; } return n + " Euro"; };
  var zahlWort = function (n) { return ["keine", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"][n] || String(n); };
  var vorname = function () { return { gf: "Thomas", buero: "Sabine", aussen: "Stefan", monteur: MONTEUR }[state.rolle] || ""; };
  var wer = function (name, dativ) { if (/^WEG /.test(name)) return (dativ ? "der Eigentümergemeinschaft " : "die Eigentümergemeinschaft ") + name.replace(/^WEG /, "in der "); if (/^Hausverwaltung|^Wohnbau/.test(name)) return (dativ ? "der " : "die ") + name; var n = anredeName(name) || name; return dativ ? n.replace(/^Herr /, "Herrn ") : n; };
  var ohneZusatz = function (t) { return String(t).replace(/,? ?ca\. ?[\d,]+ ?m²/g, "").replace(/\s*\(.*?\)/g, ""); };
  var waehle = function (liste) { return liste[new Date().getDate() % liste.length]; };   // jeden Tag etwas anders formuliert

  function sprechtextBuero() {
    var neu = neueAnfragen(), faellig = faelligNachfassen();
    var dringend = neu.filter(function (l) { return l.dringend; });
    var auftrag = state.leads.filter(function (l) { return l.stage === "auftrag"; });
    var bewOffen = state.leads.filter(function (l) { return l.stage === "erledigt" && l.bewertung === "offen"; });
    var bezahlt = mod.rechnungen.filter(function (r) { return r.status === "bezahlt"; });
    var ueber = mod.rechnungen.filter(function (r) { return state.rolle !== "aussen" && r.status !== "bezahlt" && r.faellig > 0; });
    var aeltestes = offeneAngebote().slice().sort(function (a, b) { return b.angebotVor - a.angebotVor; })[0];
    var termine = mod.termine.filter(function (t) { return t.tag === "Heute"; });
    var h = new Date().getHours(), a = [];
    a.push((h < 11 ? waehle(["Guten Morgen", "Morgen", "Guten Morgen"]) : h < 18 ? "Hallo" : "Guten Abend") + ", " + vorname() + ". " + waehle(["Kurz das Wichtigste für heute.", "Ich fass Ihnen den Tag kurz zusammen.", "Hier kommt der kurze Überblick."]));
    var s1 = neu.length ? (neu.length === 1 ? "Seit gestern ist eine neue Anfrage reingekommen." : "Seit gestern sind " + zahlWort(neu.length) + " neue Anfragen reingekommen.") : "Neue Anfragen gab es seit gestern keine.";
    if (dringend.length) s1 += " " + (dringend.length === 1 ? "Eine davon ist dringend: " + ohneZusatz(dringend[0].betreff) + " bei " + wer(dringend[0].name, true) + " in " + dringend[0].ort + ". Da sollten wir heute noch zurückrufen." : zahlWort(dringend.length).replace(/^./, function (c) { return c.toUpperCase(); }) + " davon sind dringend.");
    a.push(s1);
    var erl = "Ein paar Sachen sind schon erledigt. Die Anfragen sind vorgeprüft";
    erl += auftrag.length ? ", die Rechnung für " + wer(auftrag[0].name).replace(/^Herr /, "Herrn ") + " ist vorbereitet" : "";
    erl += ", und der Telefonassistent hat zwei Anrufe angenommen, die Sie sonst verpasst hätten.";
    if (bezahlt.length) erl += " Außerdem " + (bezahlt.length === 1 ? "ist eine Zahlung" : "sind " + zahlWort(bezahlt.length) + " Zahlungen") + " eingegangen.";
    a.push(erl);
    var teile = [];
    if (faellig.length) teile.push(faellig.length === 1 ? "eine Nachfrage zum Angebot von " + wer(faellig[0].name, true) : zahlWort(faellig.length) + " Nachfragen zu offenen Angeboten");
    if (ueber.length) teile.push(ueber.length === 1 ? "eine Zahlungserinnerung an " + wer(ueber[0].name).replace(/^Herr /, "Herrn ") : zahlWort(ueber.length) + " Zahlungserinnerungen");
    if (bewOffen.length) teile.push(bewOffen.length === 1 ? "eine Bitte um Bewertung" : zahlWort(bewOffen.length) + " Bitten um Bewertung");
    if (teile.length) a.push("Für Sie zum Durchschauen liegen " + (teile.length > 1 ? teile.slice(0, -1).join(", ") + " und " + teile[teile.length - 1] : teile[0]) + " bereit. Die Texte sind schon geschrieben, Sie müssen nur noch freigeben.");
    var fehltU = dokumenteAlle().filter(function (x) { return x.st === "wartet"; }).length;
    if (fehltU) a.push("Und bei " + zahlWort(fehltU) + " Dokumenten fehlt noch eine Unterschrift.");
    if (termine.length) a.push("Heute " + (termine.length === 1 ? "steht ein Termin" : "stehen " + zahlWort(termine.length) + " Termine") + " im Kalender. Los geht's um " + uhr(termine[0].zeit) + (termine[0].typ === "lager" ? " mit dem Material in der Werkstatt." : " bei " + wer(termine[0].name, true) + "."));
    a.push("Noch was zum Wetter: Morgen Nachmittag soll es stürmen und kräftig regnen. Die Abnahme in Fürth ist drinnen, also kein Problem.");
    if (aeltestes) a.push(waehle(["Mein Tipp:", "Und ein Tipp von mir:", "Was sich heute lohnt:"]) + " Das Angebot für " + wer(aeltestes.name).replace(/^Herr /, "Herrn ") + " ist seit " + aeltestes.angebotVor + " Tagen offen. Ein kurzer Anruf bringt da oft mehr als eine weitere Mail.");
    a.push(waehle(["Das war's. Einen guten Tag!", "So weit von mir. Viel Erfolg heute!", "Das war's fürs Erste. Bis später!"]));
    return a;
  }
  function sprechtextMontage() {
    var heute = mod.termine.filter(function (t) { return t.tag === "Heute" && /Alex/.test(t.wer); });
    var a = ["Morgen, " + MONTEUR + ". " + (heute.length === 1 ? "Heute hast du einen Termin." : "Heute stehen " + zahlWort(heute.length) + " Termine an.")];
    heute.forEach(function (t, i) {
      var vor = i === 0 ? "Los geht's um " : i === heute.length - 1 ? "Und zum Schluss um " : "Danach um ";
      a.push(vor + uhr(t.zeit) + (t.typ === "lager" ? " in der Werkstatt, Material laden: " + t.info + "." : ", " + t.art + " bei " + wer(t.name, true) + " in " + t.ort + ". " + ohneZusatz(t.info) + "."));
    });
    var offen = MATERIAL.filter(function (m) { return !mt.material[m.id]; });
    if (offen.length) a.push("Im Lager liegen " + zahlWort(offen.length) + " Sachen für dich bereit.");
    a.push("Komm gut hin, und bis später!");
    return a;
  }
  function vorlesenStop() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    clearTimeout(sprache.timer); sprache.laeuft = false;
    document.querySelectorAll("[data-vorlesen]").forEach(function (b) { b.classList.remove("spricht"); b.lastChild.textContent = "Vorlesen"; });
  }
  function sprechbar(t) {   // Zeichen und Abkürzungen so, wie man sie ausspricht
    return String(t).replace(/€/g, " Euro").replace(/ – /g, ", ").replace(/·/g, ",").replace(/\bca\. ?/g, "etwa ").replace(/\bz\. ?B\./g, "zum Beispiel").replace(/ m²/g, " Quadratmeter").replace(/\bStd\./g, "Stunden").replace(/\bNr\./g, "Nummer").replace(/\bkWh\b/g, "Kilowattstunden").replace(/\bkW\b/g, "Kilowatt").replace(/\s+/g, " ").trim();
  }
  function saetze(t) { return sprechbar(t).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [t]; }
  function sprich(text, fertig, nr) {
    var u = new SpeechSynthesisUtterance(sprechbar(text));
    var frage = /\?$/.test(text), anfang = nr === 0;
    u.lang = "de-DE"; u.rate = sprache.tempo * (anfang ? 0.97 : 1 + ((nr || 0) % 3 - 1) * 0.02); u.pitch = frage ? 1.06 : anfang ? 1.03 : 1 - ((nr || 0) % 2) * 0.02;
    var v = aktuelleStimme(); if (v) { u.voice = v; u.lang = v.lang; }
    if (fertig) u.onend = fertig;
    speechSynthesis.speak(u);
  }
  function vorlesen(art) {
    if (!("speechSynthesis" in window)) return toast("Ihr Browser kann leider nicht vorlesen.");
    if (sprache.laeuft) return vorlesenStop();
    var absaetze = art === "montage" ? sprechtextMontage() : sprechtextBuero();
    var stuecke = []; absaetze.forEach(function (abs, ai) { saetze(abs).forEach(function (st, si) { stuecke.push({ t: st, pause: si === saetze(abs).length - 1 ? 520 : 170, erster: ai === 0 && si === 0 }); }); });
    speechSynthesis.cancel();
    sprache.laeuft = true;
    document.querySelectorAll("[data-vorlesen]").forEach(function (b) { b.classList.add("spricht"); b.lastChild.textContent = "Stopp"; });
    var ende = function () { vorlesenStop(); };
    if (IOS) {   // iOS: alles auf einmal einreihen, sonst blockiert Safari
      stuecke.forEach(function (x, i) { sprich(x.t, i === stuecke.length - 1 ? ende : null, i); });
    } else {     // sonst Absatz für Absatz mit kurzer Pause dazwischen
      var i = 0;
      var weiter = function () {
        if (!sprache.laeuft) return;
        if (i >= stuecke.length) return ende();
        var x = stuecke[i]; sprich(x.t, function () { sprache.timer = setTimeout(weiter, x.pause); }, i); i++;
      };
      weiter();
    }
  }
  function stimmenHtml() {
    var alle = stimmen(), akt = aktuelleStimme();
    var opt = alle.length ? alle.map(function (v) {
      return '<option value="' + esc(v.name) + '"' + (akt && v.name === akt.name ? " selected" : "") + ">" + esc(v.name.replace(/Microsoft |Google |\(.*?\)/g, "").trim() || v.name) + (/Natural|Neural|Online|Premium|Enhanced|Erweitert/i.test(v.name) ? " – natürlich" : "") + "</option>";
    }).join("") : "<option>Standardstimme des Geräts</option>";
    return '<div class="voice-set" id="voice-set" hidden><div class="voice-row">' +
      '<label>Stimme<select id="stimme">' + opt + "</select></label>" +
      '<label>Tempo<select id="tempo">' + [[0.9, "ruhig"], [1, "normal"], [1.1, "zügig"]].map(function (t) { return '<option value="' + t[0] + '"' + (Math.abs(sprache.tempo - t[0]) < 0.01 ? " selected" : "") + ">" + t[1] + "</option>"; }).join("") + "</select></label>" +
      '<button class="btn-mini" type="button" data-stimme-probe>Probe hören</button></div>' +
      '<p class="src">In der Demo spricht die Stimme Ihres Geräts – das Cockpit sucht automatisch die natürlichste. Am besten klingt es in Microsoft Edge (z. B. „Katja“ oder „Conrad“, Kennzeichen „natürlich“). Im echten Cockpit ist eine professionelle Sprecherstimme (neuronale Sprachausgabe mit Server in der EU) vorgesehen. Auf dem iPhone: Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch, dort eine „erweiterte“ Stimme laden.</p></div>';
  }
  if ("speechSynthesis" in window) speechSynthesis.addEventListener && speechSynthesis.addEventListener("voiceschanged", function () {
    var sel = document.getElementById("stimme"), set = document.getElementById("voice-set");
    if (sel && set) { var offen = !set.hidden; set.outerHTML = stimmenHtml(); if (offen) document.getElementById("voice-set").hidden = false; }
  });

  /* =====================================================================
     8. MONTEURE: Handy-Ansicht mit Tagesplan und digitalem Regiebericht
     ===================================================================== */
  var MONTEUR = "Alex";
  var BERICHTE = [
    { nr: "RB-0412", baustelle: "Familie Brandl, Erlangen", monteur: "Alex, Robin", datum: "gestern", stunden: 15, material: "Brennwerttherme, Abgasrohr 2 m", status: "Rechnung vorbereitet" },
    { nr: "RB-0411", baustelle: "Georg Hofbauer, Erlangen", monteur: "Robin", datum: "vor 2 Tagen", stunden: 1.5, material: "Dichtungssatz", status: "abgerechnet" }
  ];
  var ZEITEN = [
    { name: "Alex", beginn: "07:00", baustelle: "Familie Brandl", stunden: "läuft" },
    { name: "Robin", beginn: "07:00", baustelle: "Familie Brandl", stunden: "läuft" },
    { name: "Sandra (Azubi)", beginn: "07:30", baustelle: "Lager / Werkstatt", stunden: "läuft" }
  ];
  var mt;
  function resetMonteur() {
    mt = { tab: "heute", btab: "team", berichte: BERICHTE.map(function (b) { return Object.assign({}, b); }), fotos: 0, unterschrift: false, diktiert: false, nr: 413,
           material: {}, zeit: { an: true, seit: "07:00", pause: false, pausen: 0, baustelle: "Familie Brandl" } };
  }
  resetMonteur();

  var MATERIAL = [
    { id: "m1", name: "Abgasrohr DN 80, 2 m", menge: "1 Stück", fuer: "Familie Brandl" },
    { id: "m2", name: "Kondensatpumpe", menge: "1 Stück", fuer: "Familie Brandl" },
    { id: "m3", name: "Dichtungssatz Armatur", menge: "1 Satz", fuer: "Max Lechner" },
    { id: "m4", name: "Ölfilter und Düse", menge: "1 Satz", fuer: "Anton Wagner" },
    { id: "m5", name: "Laser-Messgerät", menge: "Werkzeug", fuer: "Aufmaß Familie Huber" }
  ];
  var WOCHE = [["Mo", 8.5], ["Di", 9], ["Mi", 8], ["Do", 0], ["Fr", 0]];
  var meinTermin = function (t) { return /Alex/.test(t.wer); };

  function terminKnoepfe(t) {
    var icsB = '<button class="btn-mini" type="button" data-ics="' + mod.termine.indexOf(t) + '">' + svg(ICON.calendar) + 'In Kalender</button>';
    if (t.typ === "lager") return '<button class="btn-mini" type="button" data-mt="tab-heute-material">Materialliste</button>' + icsB;
    var ak = akteVon(t.name);
    var b = icsB + '<button class="btn-mini" type="button" data-mt="navi">Navigation</button><button class="btn-mini" type="button" data-mt="akte" data-name="' + esc(t.name) + '">' + svg(ICON.camera) + "Fotos &amp; Chat" + (ak.chat.length ? " (" + ak.chat.length + ")" : "") + "</button>";
    if (t.typ === "aufmass") return b + '<button class="btn-mini primary" type="button" data-mt="tab-aufmass">Aufmaß</button>';
    if (t.typ === "wartung") return b + '<button class="btn-mini primary" type="button" data-mt="fo-open" data-id="wartung">Wartungsprotokoll</button>';
    if (t.typ === "abnahme") return b + '<button class="btn-mini primary" type="button" data-mt="fo-open" data-id="abnahme">Abnahmeprotokoll</button>';
    return b + '<button class="btn-mini primary" type="button" data-mt="regie">Regiebericht</button>';
  }
  function terminListe(arr) {
    return '<ul class="ph-list">' + arr.map(function (t) {
      return '<li><span class="ph-zeitpunkt">' + t.zeit + "</span><b>" + esc(t.art) + ": " + esc(t.name) + "</b><small>" + esc(t.ort) + " · " + esc(t.info) + (t.wer !== MONTEUR ? " · mit " + esc(t.wer.replace(MONTEUR + ", ", "").replace(", " + MONTEUR, "")) : "") + "</small>" +
        '<span class="ph-actions">' + terminKnoepfe(t) + "</span></li>"; }).join("") + "</ul>";
  }
  function phoneHeute() {
    var heute = mod.termine.filter(function (t) { return t.tag === "Heute" && meinTermin(t); });
    var morgen = mod.termine.filter(function (t) { return t.tag === "Morgen" && meinTermin(t); });
    var jetzt = heute.filter(function (t) { return t.name === mt.zeit.baustelle; })[0] || heute[1] || heute[0];
    var erledigt = MATERIAL.filter(function (m) { return mt.material[m.id]; }).length;
    var fremd = TX[mt.lang];
    return '<div class="ph-msg"><div class="ph-msg-head"><b>' + (fremd ? "" : "Guten Morgen, " + MONTEUR + ".") + '</b><button class="btn-mini" type="button" data-vorlesen="montage">' + svg(ICON.sound) + "<span>Vorlesen</span></button></div>" +
        (fremd ? esc(fremd.gruss) + '<small class="ph-uebersetzt">' + esc(fremd.hinweis) + "</small>" : "Heute " + heute.length + " Termine. Los geht es um 07:15 im Lager, dann ab 08:00 bei Familie Brandl in Erlangen (Tag 2 von 3). Um 16:00 Aufmaß bei Familie Huber zusammen mit Stefan.") + "</div>" +
      (jetzt ? '<section class="ph-jetzt"><span class="ph-label">' + T("Jetzt") + "</span><b>" + esc(jetzt.name) + "</b><small>" + esc(jetzt.ort) + " · " + esc(fremd && jetzt.name === "Familie Brandl" ? fremd.info : jetzt.info) + "</small>" +
        (function () { var nz = (profilVon(jetzt.name).notizen || []).concat((state.kpNotiz || {})[jetzt.name] || []); return nz.length ? '<p class="ph-notiz">📌 ' + nz.map(esc).join(" · ") + "</p>" : ""; })() +
        '<div class="ph-big"><button type="button" data-mt="unterwegs">' + svg(ICON.send) + T("Navigation") + "</button>" +
        '<button type="button" data-mt="anruf">' + svg(KANAL.telefon.icon) + T("Anrufen") + "</button>" +
        '<button type="button" data-mt="akte" data-name="' + esc(jetzt.name) + '">' + svg(ICON.camera) + esc(T("Fotos & Chat")) + "</button>" +
        '<button type="button" class="primary" data-mt="regie">' + svg(ICON.wrench) + T("Regiebericht") + "</button></div></section>" : "") +
      "<h4>" + T("Heute") + "</h4>" + terminListe(heute) +
      '<h4 id="ph-material">' + T("Material für heute") + ' <span class="ph-count">' + erledigt + " von " + MATERIAL.length + " eingeladen</span></h4>" +
      '<ul class="ph-check">' + MATERIAL.map(function (m) {
        return '<li><label><input type="checkbox" data-mat="' + m.id + '"' + (mt.material[m.id] ? " checked" : "") + "><span><b>" + esc(m.name) + "</b><small>" + esc(m.menge) + " · " + esc(m.fuer) + "</small></span></label></li>"; }).join("") + "</ul>" +
      '<button class="btn-mini" type="button" data-mt="nachbestellen">Fehlt etwas? Nachbestellen</button>' +
      "<h4>" + T("Morgen") + "</h4>" + terminListe(morgen) + meineWoche();
  }
  function meineWoche() {
    var h = heute0(), liste = mod.termine.map(function (t, i) { var z = terminZeit(t); return { t: t, i: i, start: z.start }; })
      .filter(function (e) { var diff = (e.start - h) / 864e5; return meinTermin(e.t) && diff >= 2 && diff < 9; })
      .sort(function (a, b) { return a.start - b.start; });
    return '<h4>Meine Woche</h4>' + (liste.length ? '<ul class="ph-woliste">' + liste.map(function (e) {
        return '<li><span class="ph-wo-tag">' + WK[e.start.getDay()] + " " + e.start.getDate() + ".<b>" + uhrzeit(e.start) + '</b></span><span class="ph-wo-text"><b>' + esc(e.t.art) + ": " + esc(e.t.name) + "</b><small>" + esc(e.t.ort) + "</small></span></li>";
      }).join("") + "</ul>" : '<p class="ph-note">Keine weiteren Termine in dieser Woche.</p>') +
      '<button class="btn-mini" type="button" data-ics-mein>' + svg(ICON.calendar) + "Alle meine Termine in den Handy-Kalender</button>" +
      '<p class="ph-note">Neue Termine vom Büro erscheinen automatisch – du bekommst eine Mitteilung.</p>';
  }
  function phoneKunden() {
    var namen = [];
    mod.termine.forEach(function (t) { if (meinTermin(t) && t.typ !== "lager" && namen.indexOf(t.name) < 0) namen.push(t.name); });
    return '<p class="ph-note">Deine Baustellen und Kunden dieser Woche. Fotos und Chat sieht das ganze Team – der Kunde nicht.</p>' +
      '<ul class="ph-list">' + namen.map(function (n) {
        var t = mod.termine.filter(function (x) { return x.name === n && meinTermin(x); })[0], ak = akteVon(n);
        return '<li><b>' + esc(n) + "</b><small>" + esc(t.ort) + " · nächster Termin: " + t.tag + " " + t.zeit + " · " + ak.fotos.length + " Fotos · " + ak.chat.length + " Nachrichten</small>" +
          '<span class="ph-actions"><button class="btn-mini primary" type="button" data-mt="akte" data-name="' + esc(n) + '">Öffnen</button><button class="btn-mini" type="button" data-mt="anruf">Anrufen</button><button class="btn-mini" type="button" data-mt="navi">Navigation</button></span></li>';
      }).join("") + "</ul>";
  }
  function phoneZeit() {
    var z = mt.zeit, heute = 7.5 - z.pausen;
    var max = 10, summe = WOCHE.reduce(function (s, w) { return s + w[1]; }, 0) + (z.an ? heute : 0);
    var baustellen = mod.termine.filter(function (t) { return t.tag === "Heute" && meinTermin(t) && t.typ !== "lager"; }).map(function (t) { return t.name; });
    return '<section class="ph-stempel ' + (z.an ? (z.pause ? "pause" : "an") : "aus") + '"><span class="ph-label">' + (z.an ? (z.pause ? "Pause läuft" : "Eingestempelt seit " + z.seit) : "Ausgestempelt") + "</span>" +
        "<b>" + (z.an ? (z.pause ? "Pause" : esc(z.baustelle)) : "Feierabend") + "</b>" +
        '<div class="ph-big two">' + (z.an ? '<button type="button" data-mt="pause">' + (z.pause ? "Pause beenden" : "Pause starten") + '</button><button type="button" data-mt="aus">Ausstempeln</button>' :
          '<button type="button" class="primary" data-mt="ein">Einstempeln</button>') + "</div></section>" +
      (z.an ? '<div class="field"><label for="zt-bs">Baustelle wechseln</label><select id="zt-bs">' + baustellen.map(function (b) { return "<option" + (b === z.baustelle ? " selected" : "") + ">" + esc(b) + "</option>"; }).join("") + "</select></div>" : "") +
      "<h4>Heute</h4><ul class=\"ph-zeiten\"><li><span>07:00 – 07:15</span><b>Lager, Material laden</b></li><li><span>07:15 – 08:00</span><b>Fahrt nach Erlangen</b></li>" +
        "<li><span>ab 08:00</span><b>" + esc(z.baustelle) + (z.an ? " · läuft" : "") + "</b></li>" + (z.pausen ? "<li><span>Pause</span><b>" + String(z.pausen * 60) + " Min.</b></li>" : "") + "</ul>" +
      '<h4>Diese Woche <span class="ph-count">' + String(summe).replace(".", ",") + " Std.</span></h4>" +
      '<div class="ph-woche">' + WOCHE.map(function (w, i) {
        var std = i === 3 ? (z.an ? heute : 7.5) : w[1];
        return '<div class="' + (i === 3 ? "heute" : "") + '"><i style="height:' + Math.round(std / max * 100) + '%"></i><b>' + (std ? String(std).replace(".", ",") : "–") + "</b><span>" + w[0] + "</span></div>"; }).join("") + "</div>" +
      '<p class="ph-note">Überstundenkonto: <b>+6,5 Std.</b> · Resturlaub: <b>14 Tage</b></p>' +
      '<div class="ph-actions"><button class="btn-mini" type="button" data-mt="urlaub">Urlaub beantragen</button><button class="btn-mini" type="button" data-mt="krank">Krank melden</button></div>';
  }
  function phoneRegie() {
    var fotos = ""; for (var i = 0; i < mt.fotos; i++) fotos += '<span class="ph-foto" aria-label="Foto ' + (i + 1) + '">Foto ' + (i + 1) + "</span>";
    return '<form class="ph-form" id="regie-form" novalidate>' +
      '<div class="field"><label for="rg-bs">Baustelle</label><select id="rg-bs"><option>Familie Brandl, Erlangen</option><option>Familie Huber, Erlangen</option><option>Thomas Bauer, Fürth</option></select></div>' +
      '<div class="ph-row"><div class="field"><label for="rg-von">von</label><input id="rg-von" type="time" value="07:00"></div><div class="field"><label for="rg-bis">bis</label><input id="rg-bis" type="time" value="15:30"></div><div class="field"><label for="rg-p">Pause</label><select id="rg-p"><option>30 Min.</option><option>45 Min.</option><option>keine</option></select></div></div>' +
      '<div class="field"><label for="rg-wer">Mitarbeiter</label><input id="rg-wer" value="Alex, Robin"></div>' +
      '<div class="field"><label for="rg-txt">Ausgeführte Arbeiten <button class="btn-mini" type="button" data-mt="diktat">' + svg(ICON.sound) + "Diktieren</button></label>" +
        '<textarea id="rg-txt" placeholder="Was wurde gemacht?">' + (mt.diktiert ? "Alte Gastherme demontiert und entsorgt. Neue Brennwerttherme montiert, Abgasleitung angeschlossen, Kondensatpumpe gesetzt. Anlage befüllt, entlüftet und in Betrieb genommen. Kunde eingewiesen." : "") + "</textarea></div>" +
      '<div class="field"><label>Material</label><div class="ph-mat"><input aria-label="Material 1" value="Abgasrohr DN 80, 2 m"><input aria-label="Menge 1" value="1" inputmode="numeric"></div><div class="ph-mat"><input aria-label="Material 2" value="Kondensatpumpe"><input aria-label="Menge 2" value="1" inputmode="numeric"></div></div>' +
      '<div class="field"><label>Fotos</label><div class="ph-fotos">' + fotos + '<button class="btn-mini" type="button" data-mt="foto">+ Foto</button></div></div>' +
      '<div class="field"><label for="sig">Unterschrift Kunde</label><canvas id="sig" class="ph-sig" width="600" height="180" aria-label="Unterschriftenfeld: mit Finger oder Maus unterschreiben"></canvas>' +
        '<div class="ph-row"><input id="rg-kunde" aria-label="Name des Kunden" placeholder="Name des Kunden" value="Familie Brandl"><button class="btn-mini" type="button" data-mt="sig-clear">Löschen</button></div></div>' +
      '<button class="btn btn-signal" type="button" data-mt="senden" style="width:100%">Bericht abschließen &amp; senden</button>' +
      '<p class="ph-hint">Der Kunde bekommt den Bericht als PDF per E-Mail, das Büro sieht ihn sofort.</p></form>';
  }

  /* Sprache der Montage-App: Oberfläche und Arbeitsanweisungen werden übersetzt (KI, wenige Cent) */
  var SPRACHEN = { de: "Deutsch", pl: "Polski", ro: "Română", tr: "Türkçe" };
  var TX = {
    pl: { "Mein Tag": "Mój dzień", "Heute": "Dziś", "Morgen": "Jutro", "Jetzt": "Teraz", "Aufmaß": "Pomiar", "Formulare": "Formularze", "Kunden": "Klienci", "Zeit": "Czas", "Navigation": "Nawigacja", "Anrufen": "Zadzwoń", "Fotos & Chat": "Zdjęcia i czat", "Regiebericht": "Raport pracy", "Material für heute": "Materiał na dziś", "Arbeitszeit": "Czas pracy",
      gruss: "Dzień dobry, Alex. Dziś 5 terminów. Start o 07:15 w magazynie, potem od 08:00 u rodziny Brandl w Erlangen (dzień 2 z 3).", info: "Wymiana kotła, dzień 2 z 3: podłączyć rurę spalinową, zamontować pompę kondensatu, napełnić i odpowietrzyć instalację.", hinweis: "Instrukcje są automatycznie tłumaczone na Twój język." },
    ro: { "Mein Tag": "Ziua mea", "Heute": "Azi", "Morgen": "Mâine", "Jetzt": "Acum", "Aufmaß": "Măsurători", "Formulare": "Formulare", "Kunden": "Clienți", "Zeit": "Timp", "Navigation": "Navigare", "Anrufen": "Sună", "Fotos & Chat": "Poze și chat", "Regiebericht": "Raport de lucru", "Material für heute": "Material pentru azi", "Arbeitszeit": "Timp de lucru",
      gruss: "Bună dimineața, Alex. Azi ai 5 programări. Începem la 07:15 în depozit, apoi de la 08:00 la familia Brandl în Erlangen (ziua 2 din 3).", info: "Schimb centrală, ziua 2 din 3: racordați coșul de evacuare, montați pompa de condens, umpleți și aerisiți instalația.", hinweis: "Instrucțiunile sunt traduse automat în limba ta." },
    tr: { "Mein Tag": "Günüm", "Heute": "Bugün", "Morgen": "Yarın", "Jetzt": "Şimdi", "Aufmaß": "Ölçüm", "Formulare": "Formlar", "Kunden": "Müşteriler", "Zeit": "Zaman", "Navigation": "Navigasyon", "Anrufen": "Ara", "Fotos & Chat": "Fotoğraf ve sohbet", "Regiebericht": "İş raporu", "Material für heute": "Bugünkü malzeme", "Arbeitszeit": "Çalışma süresi",
      gruss: "Günaydın Alex. Bugün 5 randevun var. 07:15'te depoda başlıyoruz, sonra 08:00'den itibaren Erlangen'de Brandl ailesinde (3 günün 2. günü).", info: "Kombi değişimi, 3 günün 2. günü: baca borusunu bağlayın, yoğuşma pompasını takın, sistemi doldurun ve havasını alın.", hinweis: "Talimatlar otomatik olarak senin diline çevrilir." }
  };
  function T(k) { return (TX[mt.lang] && TX[mt.lang][k]) || k; }

  /* Für die Rolle „Montagekraft“: die komplette App im Vollbild */
  var MAPP_TABS = [["heute", "Heute", "home"], ["aufmass", "Aufmaß", "wrench"], ["formulare", "Formulare", "check"], ["kunden", "Kunden", "users"], ["zeit", "Zeit", "calendar"]];
  function viewMontageApp() {
    var aktiv = { regie: "formulare", akte: "kunden" }[mt.tab] || mt.tab;
    var titel = { heute: T("Mein Tag"), aufmass: T("Aufmaß"), formulare: mt.tab === "regie" ? "Regiebericht" : ex.form ? ex.form.name : "Formulare", kunden: mt.tab === "akte" ? mt.akteName : T("Kunden"), zeit: T("Arbeitszeit") }[aktiv];
    var inhalt = ({ heute: phoneHeute, aufmass: phoneAufmass, formulare: phoneFormulare, regie: phoneRegie, akte: phoneAkte, kunden: phoneKunden, zeit: phoneZeit })[mt.tab]();
    $main.innerHTML = '<div class="mapp" id="mapp">' +
      '<header class="mapp-head"><div><small>' + esc(BETRIEB) + "</small><h1>" + esc(titel) + "</h1></div>" +
        '<span class="mapp-rechts"><select id="mapp-lang" aria-label="Sprache">' + Object.keys(SPRACHEN).map(function (k) { return '<option value="' + k + '"' + ((mt.lang || "de") === k ? " selected" : "") + ">" + SPRACHEN[k] + "</option>"; }).join("") + "</select>" +
        '<span class="mapp-status ' + (mt.zeit.an ? (mt.zeit.pause ? "pause" : "an") : "") + '">' + (mt.zeit.an ? (mt.zeit.pause ? "Pause" : "seit " + mt.zeit.seit) : "aus") + "</span></span></header>" +
      '<div class="mapp-body ph-body">' + inhalt + "</div>" +
      '<nav class="mapp-tabs" aria-label="Montage-App">' + MAPP_TABS.map(function (t) {
        return '<button type="button" data-mt="tab-' + t[0] + '"' + (aktiv === t[0] ? ' aria-current="page"' : "") + ">" + svg(ICON[t[2]]) + "<span>" + T(t[1]) + "</span></button>"; }).join("") + "</nav>" +
    "</div>";
    initSignatur();
    if (mt.tab === "aufmass") amSumme();
  }

  /* Für Geschäftsführung, Büro und Außendienst: Team, Berichte, Aufmaß */
  function viewMonteure() {
    mt.unterschrift = false;
    if (state.rolle === "monteur") return viewMontageApp();
    if (state.view === "aufmass") return viewAufmass();
    var neu = mt.berichte.filter(function (b) { return b.status !== "abgerechnet"; }).length;

    $main.innerHTML = head("Montagekräfte", "Wer ist wo, was ist erledigt, was kann abgerechnet werden. Ihre Montagekräfte arbeiten mit der Montage-App auf dem Handy. Die ersten 2 sind kostenlos, jede weitere 25 € im Monat.") +
      '<div class="view-actions" style="margin:-6px 0 14px"><button class="btn btn-outline" type="button" data-rolle-wechsel="monteur">' + svg(ICON.wrench) + "Montage-App ansehen</button></div>" +
      '<div class="kpis">' + kpi("Im Einsatz", "3", "Alex, Robin, Sandra") + kpi("Stunden heute", "bisher 21,5", "laut Zeiterfassung") +
        kpi("Berichte offen", String(neu), "zur Abrechnung bereit") + kpi("Montage-Zugänge", "3", "2 kostenlos + 1 × 25 €") + "</div>" +
      '<div class="panel-grid two">' +
        '<section class="panel" aria-labelledby="az-h"><h2 id="az-h">Team heute <button class="btn-mini" type="button" data-lohn style="float:right">Stunden an Lohnabrechnung</button></h2><div class="rows">' +
          ZEITEN.map(function (z) {
            var ort = z.name === MONTEUR ? mt.zeit.baustelle : z.baustelle;
            var st = z.name === MONTEUR ? (mt.zeit.an ? (mt.zeit.pause ? "Pause" : "im Einsatz") : "ausgestempelt") : "im Einsatz";
            return '<div class="row"><div class="row-main"><strong>' + esc(z.name) + "</strong><small>seit " + z.beginn + " · " + esc(ort) + '</small></div><div class="row-side"><span class="pill ' + (st === "im Einsatz" ? "ok" : "check") + '">' + st + "</span>" +
              (ort !== "Lager / Werkstatt" ? '<button class="btn-mini" type="button" data-akte-open="' + esc(ort) + '">Baustelle</button>' : "") + "</div></div>"; }).join("") +
        "</div></section>" +
        '<div class="panel-grid">' + angebotsEntwurf() +
          '<section class="panel" aria-labelledby="rb-h" id="rb-panel"><h2 id="rb-h">Im Büro eingegangen</h2><div class="rows">' +
            mt.berichte.map(function (b) {
              return '<div class="row"><div class="row-main"><strong>' + b.nr + " · " + esc(b.baustelle) + "</strong><small>" + esc(b.monteur) + " · " + (b.stunden != null ? b.stunden.toString().replace(".", ",") + " Std. · " : "") + esc(b.material) + " · " + b.datum + "</small></div>" +
                '<div class="row-side"><span class="pill ' + (b.status === "abgerechnet" ? "" : "ok") + '">' + b.status + "</span></div></div>";
            }).join("") +
          '</div><p class="src">Aus jedem Regiebericht wird automatisch eine Rechnungsvorlage mit Stunden und Material – Sie prüfen und geben frei.</p></section>' +
        "</div>" +
      "</div>";
  }
  function angebotsEntwurf() {
    if (!ex.angebot) return "";
    return '<section class="panel" id="am-angebot"><h2>Angebotsentwurf aus dem Aufmaß</h2><div class="rows">' + ex.angebot.pos.map(function (p) {
        return '<div class="row"><div class="row-main"><strong>' + p[0] + "</strong><small>" + zahl(p[1]) + " m² × " + euro.format(p[2]) + '</small></div><div class="row-side"><span class="amount">' + euro.format(p[1] * p[2]) + "</span></div></div>"; }).join("") +
      '<div class="row"><div class="row-main"><strong>Sanitär-Pauschale (Dusche, WC, Waschtisch)</strong><small>aus Vorlage</small></div><div class="row-side"><span class="amount">' + euro.format(9800) + "</span></div></div>" +
      "</div>" + (state.kiText ? '<div class="template ki-text"><b>Leistungstext (von der KI aus Aufmaß und Notizen):</b>\nBad 8,12 m²: Rückbau der vorhandenen Fliesen und Sanitärobjekte inkl. Entsorgung. Herstellen einer bodengleichen Dusche mit Rinne und Abdichtung nach DIN 18534. Verlegen von Bodenfliesen 60 × 60 cm und Wandfliesen raumhoch im Duschbereich. Montage von WC, Waschtisch und Armaturen nach Auswahl. Gäste-WC 1,92 m² sinngemäß.</div>' : '<p><button class="btn-mini" type="button" data-ki-text>' + svg(ICON.spark) + "Leistungstext von der KI schreiben lassen</button></p>") +
      '<p class="src">Summe netto <b>' + euro.format(ex.angebot.summe) + '</b> · liegt im Cockpit zur Freigabe, der Kunde sieht es im <button class="btn-mini" type="button" data-go="portal">Kundenportal</button></p></section>';
  }

  function initSignatur(id, beimZeichnen) {
    var c = document.getElementById(id || "sig");
    if (!c) return;
    var ctx = c.getContext("2d"), drawing = false;
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#1d3a8a";   // Kugelschreiber-Blau, auch im dunklen Design gut lesbar
    function pos(e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; }
    c.addEventListener("pointerdown", function (e) { drawing = true; c.setPointerCapture(e.pointerId); var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); });
    c.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); if (beimZeichnen) beimZeichnen(); else mt.unterschrift = true; });
    c.addEventListener("pointerup", function () { drawing = false; });
    c.addEventListener("pointercancel", function () { drawing = false; });
  }

  function monteurAktion(a, el) {
    if (a === "tab-heute-material") { mt.tab = "heute"; viewMonteure(); var mm = document.getElementById("ph-material"); if (mm) mm.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (a.indexOf("tab-") === 0) { mt.tab = a.slice(4); ex.form = null; viewMonteure(); return window.scrollTo(0, 0); }
    if (a === "ein") { mt.zeit.an = true; mt.zeit.pause = false; var jz = new Date(); mt.zeit.seit = ("0" + jz.getHours()).slice(-2) + ":" + ("0" + jz.getMinutes()).slice(-2); viewMonteure(); return toast("Eingestempelt. Die Zeit läuft auf " + mt.zeit.baustelle + "."); }
    if (a === "aus") { mt.zeit.an = false; mt.zeit.pause = false; viewMonteure(); return toast("Ausgestempelt. Schönen Feierabend! Die Stunden sind im Büro."); }
    if (a === "nachbestellen") { akteVon("Familie Brandl").chat.push({ von: ichName(), text: "Bitte nachbestellen: Verlängerung Abgasrohr DN 80, 0,5 m.", wann: "gerade eben" }); return toast("Nachbestellung ans Büro geschickt – steht auch im Chat der Baustelle."); }
    if (a === "urlaub") return toast("Urlaubsantrag geöffnet: Zeitraum wählen, die Geschäftsführung gibt frei (Demo).");
    if (a === "krank") return toast("Krankmeldung ans Büro geschickt. Gute Besserung! (Demo)");
    if (a === "am-raum") { am.raeume.push({ name: "Raum " + (am.raeume.length + 1), l: 3, b: 3, h: 2.5, ab: [{ art: "Tür", b: 0.8, h: 2.0 }] }); return viewMonteure(); }
    if (a === "am-del") { am.raeume.splice(+el.getAttribute("data-i"), 1); return viewMonteure(); }
    if (a === "ab-add") { am.raeume[+el.getAttribute("data-i")].ab.push({ art: "Fenster", b: 1.0, h: 1.2 }); return viewMonteure(); }
    if (a === "ab-del") { am.raeume[+el.getAttribute("data-i")].ab.splice(+el.getAttribute("data-j"), 1); return viewMonteure(); }
    if (a === "am-foto") { var rn = am.raeume[+el.getAttribute("data-i")].name; akteVon(am.kunde).fotos.push({ label: "Aufmaß " + rn, von: ichName(), wann: "gerade eben" });
      return toast("Foto „" + rn + "“ in der Kundenakte von " + am.kunde + " gespeichert."); }
    if (a === "am-material") { var s2 = summen(), v2 = 1 + am.verschnitt / 100, pk = Math.ceil(s2.boden * v2 / 1.44) + Math.ceil(s2.wand * v2 / 1.44);
      akteVon(am.kunde).chat.push({ von: ichName(), text: "Material laut Aufmaß bestellt: " + pk + " Pakete Fliesen, " + zahl(s2.sockel) + " m Sockel.", wann: "gerade eben" });
      return toast("Bestellung über " + pk + " Pakete Fliesen an den Großhändler vorbereitet (Demo). Notiz im Kunden-Chat."); }
    if (a === "am-pdf") return toast("Aufmaß als PDF an " + am.kunde + " gesendet (Demo).");
    if (a === "akte") { mt.akteName = el.getAttribute("data-name"); mt.tab = "akte"; return viewMonteure(); }
    if (a === "am-angebot") { var an = aufmassAngebot(); viewMonteure(); var e2 = document.getElementById("am-angebot"); if (e2) { e2.classList.add("flash"); e2.scrollIntoView({ block: "nearest" }); }
      return toast("Aufmaß übernommen: Angebotsentwurf über " + euro.format(an.summe) + " für Familie Huber erstellt."); }
    if (a === "fo-open") { var v = findeVorlage(el.getAttribute("data-id")); if (v.id === "regie") { mt.tab = "regie"; return viewMonteure(); } mt.tab = "formulare"; ex.form = v; return viewMonteure(); }
    if (a === "fo-zurueck") { ex.form = null; return viewMonteure(); }
    if (a === "fo-senden") {
      if (!mt.unterschrift) return toast("Bitte den Kunden im Feld unterschreiben lassen.");
      var n = document.querySelectorAll("[data-fo]:checked").length;
      var sigFo = document.getElementById("sig");
      mt.berichte.unshift({ nr: "FO-0" + (mt.nr++), sig: sigFo ? sigFo.toDataURL("image/png") : null, baustelle: ex.form.name, monteur: MONTEUR, datum: "gerade eben", stunden: null, material: n + " von " + ex.form.punkte.length + " Punkten erledigt · unterschrieben", status: "neu · PDF erstellt" });
      var name = ex.form.name; ex.form = null; viewMonteure();
      var rp = document.getElementById("rb-panel"); if (rp) rp.classList.add("flash");
      return toast(name + " abgeschlossen: PDF an Kunde und Büro gesendet (Demo).");
    }
    if (a === "regie") { mt.tab = "regie"; mt.unterschrift = false; return viewMonteure(); }
    if (a === "navi") return toast("Navigation zur Baustelle wird geöffnet (Demo).");
    if (a === "unterwegs") return toast("Navigation startet – Familie Brandl bekommt automatisch per WhatsApp: „Alex ist unterwegs, Ankunft ca. 08:05“ (Demo).");
    if (a === "anruf") return toast("Kunde wird angerufen (Demo).");
    if (a === "pause") { if (mt.zeit.pause) { mt.zeit.pausen += 0.5; } mt.zeit.pause = !mt.zeit.pause; if (state.rolle === "monteur") viewMonteure(); return toast(mt.zeit.pause ? "Pause gestartet. Die Zeit wird automatisch erfasst." : "Pause beendet – weiter geht's."); }
    if (a === "erledigt") return toast("Erledigt – das Büro sieht es sofort.");
    if (a === "foto") {
      mt.fotos++;
      if (mt.tab === "regie") { var txt = document.getElementById("rg-txt"); var keep = txt ? txt.value : ""; viewMonteure(); var t2 = document.getElementById("rg-txt"); if (t2) t2.value = keep; }
      return toast("Foto " + mt.fotos + " gespeichert und der Baustelle zugeordnet.");
    }
    if (a === "diktat") { mt.diktiert = true; var keepF = mt.fotos; viewMonteure(); mt.fotos = keepF; return toast("Sprachnotiz übernommen: Der Text wurde automatisch geschrieben."); }
    if (a === "sig-clear") { var c = document.getElementById("sig"); c.getContext("2d").clearRect(0, 0, c.width, c.height); mt.unterschrift = false; return; }
    if (a === "senden") {
      var text = document.getElementById("rg-txt").value.trim();
      if (!text) return toast("Bitte die ausgeführten Arbeiten eintragen – oder auf „Diktieren“ tippen.");
      if (!mt.unterschrift) return toast("Bitte den Kunden im Feld unterschreiben lassen.");
      var von = document.getElementById("rg-von").value.split(":"), bis = document.getElementById("rg-bis").value.split(":");
      var p = { "30 Min.": 0.5, "45 Min.": 0.75, "keine": 0 }[document.getElementById("rg-p").value];
      var std = Math.max(0, (+bis[0] + bis[1] / 60) - (+von[0] + von[1] / 60) - p);
      var wer = document.getElementById("rg-wer").value;
      var personen = wer.split(",").filter(function (x) { return x.trim(); }).length || 1;
      mt.berichte.unshift({ nr: "RB-0" + (mt.nr++), sig: document.getElementById("sig").toDataURL("image/png"), baustelle: document.getElementById("rg-bs").value, monteur: wer, datum: "gerade eben",
        stunden: Math.round(std * personen * 100) / 100, material: "Abgasrohr DN 80, Kondensatpumpe" + (mt.fotos ? " · " + mt.fotos + " Fotos" : ""), status: "neu · Rechnung vorbereitet" });
      mt.tab = "heute"; mt.fotos = 0; mt.unterschrift = false; mt.diktiert = false;
      protokoll("Regiebericht " + mt.berichte[0].nr + " unterschrieben: PDF an Kunden, Rechnungsvorlage erstellt");
      viewMonteure(); window.scrollTo(0, 0);
      var rp2 = document.getElementById("rb-panel"); if (rp2) rp2.classList.add("flash");
      return toast("Regiebericht unterschrieben: PDF an den Kunden gesendet, im Büro angekommen (Demo).");
    }
  }

  /* =====================================================================
     9. ROLLEN, AUFMASS, FORMULARE, WARTUNG, KUNDENPORTAL
     ===================================================================== */
  // Welche Bereiche sieht welche Rolle?
  var ROLLEN = {
    gf:      { label: "Geschäftsführung", views: ["akte", "uebersicht", "anfragen", "nachfassen", "vertrieb", "kunden", "dokumente", "termine", "aufmass", "monteure", "material", "wartung", "fristen", "angebote", "auftraege", "rechnungen", "finanzen", "ablaeufe", "portal", "ausschreibungen", "netzwerk", "personal", "branchen", "auswertungen", "marketing", "einstellungen", "preise"] },
    buero:   { label: "Büro", views: ["akte", "ablaeufe", "dokumente", "aufmass", "uebersicht", "anfragen", "nachfassen", "vertrieb", "kunden", "angebote", "auftraege", "rechnungen", "finanzen", "termine", "monteure", "material", "wartung", "fristen", "portal", "ausschreibungen", "netzwerk", "personal", "auswertungen", "marketing", "einstellungen", "preise"] },
    aussen:  { label: "Außendienst", views: ["uebersicht", "anfragen", "aufmass", "nachfassen", "vertrieb", "angebote", "auftraege", "kunden", "dokumente", "akte", "termine", "monteure", "material", "wartung", "portal", "einstellungen"] },
    monteur: { label: "Montagekraft", views: ["monteure"] },
    betreiber: { label: "Betreiber (Vermittlung)", views: ["vermittlung", "ablaeufe"] }
  };
  function erlaubt(v) { var r = ROLLEN[state.rolle || "gf"]; return !r.views || r.views.indexOf(v) > -1; }

  // Aufmaß: Beispielraum für das Bad von Familie Huber
  var START_RAEUME = [
    { name: "Bad", l: 2.8, b: 2.9, h: 2.5, abzug: 3.2 },
    { name: "Gäste-WC", l: 1.2, b: 1.6, h: 2.5, abzug: 1.8 }
  ];
  var EP = { boden: 89, wand: 98, decke: 14 }; // Beispiel-Einheitspreise je m²

  // Formulare je Branche
  var VORLAGEN = {
    "Alle Gewerke": [
      { id: "regie", name: "Regiebericht", punkte: null },
      { id: "abnahme", name: "Abnahmeprotokoll", punkte: ["Arbeiten vollständig ausgeführt", "Baustelle gereinigt", "Kunde eingewiesen", "Keine sichtbaren Mängel"] },
      { id: "maengel", name: "Mängelliste", punkte: ["Mangel beschrieben", "Foto aufgenommen", "Frist zur Behebung vereinbart"] },
      { id: "unterweisung", name: "Sicherheitsunterweisung (jährlich)", punkte: ["Leitern und Gerüste", "Elektrische Geräte und Werkzeuge", "Persönliche Schutzausrüstung", "Gefahrstoffe (z. B. Silikon, Lösemittel)", "Erste Hilfe und Notruf", "Video angesehen und verstanden"] }
    ],
    "SHK": [
      { id: "wartung", name: "Wartung Heizung", punkte: ["Brenner gereinigt", "Abgaswerte gemessen", "Anlagendruck geprüft", "Sicherheitsventil geprüft", "Ausdehnungsgefäß geprüft"] }
    ],
    "Elektro": [
      { id: "echeck", name: "Prüfprotokoll E-Check / DGUV V3", punkte: ["Sichtprüfung ohne Befund", "Schutzleiter gemessen", "Isolationswiderstand gemessen", "FI-Schutzschalter ausgelöst", "Prüfplakette angebracht"] }
    ],
    "Maler, Boden, Fliesen": [
      { id: "farbe", name: "Farbtöne und Material je Raum", punkte: ["Farbton Wand festgelegt", "Farbton Decke festgelegt", "Untergrund geprüft", "Material bestellt"] }
    ],
    "Fenster, Rollladen, Dach": [
      { id: "montage", name: "Montageprotokoll", punkte: ["Maße je Öffnung geprüft", "Anschlussfugen abgedichtet", "Funktion geprüft", "Altfenster entsorgt"] }
    ],
    "GaLaBau, Hausmeister, Reinigung": [
      { id: "objekt", name: "Reinigungs- / Pflegenachweis", punkte: ["Treppenhaus gereinigt", "Außenanlage gepflegt", "Müllplatz kontrolliert", "Winterdienst erledigt"] }
    ],
    "Hausverwaltung, Makler": [
      { id: "begehung", name: "Objektbegehung / Übergabe", punkte: ["Zählerstände erfasst", "Schlüssel übergeben", "Zustand fotografiert", "Mängel aufgenommen"] }
    ]
  };

  var WARTUNG = [
    { kunde: "Georg Hofbauer", ort: "Erlangen", anlage: "Gasbrennwert, Baujahr 2016", faellig: "diese Woche", preis: 189, art: "Wartung" },
    { kunde: "Anton Wagner", ort: "Heroldsberg", anlage: "Ölheizung, Baujahr 2019", faellig: "in 12 Tagen", preis: 219, art: "Wartung" },
    { kunde: "Hausverwaltung Kaya", ort: "Fürth", anlage: "6 Gasthermen, Objekt Schwabacher Str.", faellig: "in 3 Wochen", preis: 980, art: "Wartung" },
    { kunde: "Büro Lang Immobilien", ort: "Erlangen", anlage: "Elektroanlage Büro (DGUV V3)", faellig: "überfällig", preis: 390, art: "Prüffrist" },
    { kunde: "Familie Brandl", ort: "Erlangen", anlage: "neue Brennwerttherme (nach Einbau)", faellig: "in 11 Monaten", preis: 189, art: "Wartung", neu: true },
    { kunde: "Familie Obermeier", ort: "Baiersdorf", anlage: "Badsanierung – alle Unterlagen in der Gewährleistungsakte", faellig: "in 4 Jahren 10 Monaten", preis: 0, art: "Gewährleistung endet" }
  ];

  var ex;
  function resetErweiterung() {
    ex = { raeume: START_RAEUME.map(function (r) { return Object.assign({}, r); }), branche: "Alle Gewerke", form: null, angebot: null,
           wartung: WARTUNG.map(function (w) { return Object.assign({}, w); }), portal: "angebot" };
  }
  resetErweiterung();

  var zahl = function (n) { return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function flaechen(r) {
    var boden = r.l * r.b, wand = Math.max(0, 2 * (r.l + r.b) * r.h - r.abzug);
    return { boden: boden, wand: wand, decke: boden };
  }
  function summen() {
    return ex.raeume.reduce(function (s, r) { var f = flaechen(r); s.boden += f.boden; s.wand += f.wand; s.decke += f.decke; return s; }, { boden: 0, wand: 0, decke: 0 });
  }

  /* --- Aufmaß auf dem Handy --- */
  function phoneAufmass() {
    return '<p class="ph-note">Kunde: <b>Familie Huber, Erlangen</b> · Badsanierung</p>' +
      ex.raeume.map(function (r, i) {
        var f = flaechen(r);
        return '<div class="am-raum"><div class="am-head"><input aria-label="Raumname" data-am="' + i + '" data-k="name" value="' + esc(r.name) + '"></div>' +
          '<div class="am-grid">' +
            ["l", "b", "h", "abzug"].map(function (k) {
              var lab = { l: "Länge m", b: "Breite m", h: "Höhe m", abzug: "Abzug m² (Tür, Fenster)" }[k];
              return '<label><span>' + lab + '</span><input type="number" step="0.01" min="0" inputmode="decimal" data-am="' + i + '" data-k="' + k + '" value="' + r[k] + '"></label>';
            }).join("") + "</div>" +
          '<p class="am-erg" id="am-erg-' + i + '">Boden ' + zahl(f.boden) + " m² · Wände " + zahl(f.wand) + " m² · Decke " + zahl(f.decke) + " m²</p></div>";
      }).join("") +
      '<button class="btn-mini" type="button" data-mt="am-raum">+ Raum hinzufügen</button>' +
      '<div class="am-sum" id="am-sum"></div>' +
      '<button class="btn btn-signal" type="button" data-mt="am-angebot" style="width:100%">Ins Angebot übernehmen</button>' +
      '<p class="ph-hint">Maße auch per Laser-Messgerät (Bluetooth) oder per Sprache möglich.</p>';
  }
  function amSumme() {
    var s = summen(), el = document.getElementById("am-sum");
    if (el) el.innerHTML = "<b>Gesamt:</b> Boden " + zahl(s.boden) + " m² · Wände " + zahl(s.wand) + " m² · Decke " + zahl(s.decke) + " m²";
  }

  /* --- Formulare je Branche --- */
  function phoneFormulare() {
    if (ex.form) {
      var f = ex.form;
      return '<p class="ph-note"><button class="btn-mini" type="button" data-mt="fo-zurueck">← Zurück</button> <b>' + esc(f.name) + "</b></p>" +
        '<div class="ph-form">' + f.punkte.map(function (p, i) {
          return '<label class="fo-check"><input type="checkbox" data-fo="' + i + '"> <span>' + esc(p) + "</span></label>";
        }).join("") +
        '<div class="field"><label for="fo-txt">Bemerkung</label><textarea id="fo-txt" placeholder="optional"></textarea></div>' +
        '<div class="field"><label for="sig">Unterschrift Kunde</label><canvas id="sig" class="ph-sig" width="600" height="180" aria-label="Unterschriftenfeld"></canvas></div>' +
        '<button class="btn btn-signal" type="button" data-mt="fo-senden" style="width:100%">Abschließen &amp; senden</button></div>';
    }
    return '<div class="field"><label for="fo-branche">Branche</label><select id="fo-branche">' +
        Object.keys(VORLAGEN).map(function (b) { return "<option" + (b === ex.branche ? " selected" : "") + ">" + esc(b) + "</option>"; }).join("") + "</select></div>" +
      '<ul class="ph-list">' + VORLAGEN["Alle Gewerke"].concat(ex.branche === "Alle Gewerke" ? [] : VORLAGEN[ex.branche]).map(function (v) {
        return '<li><b>' + esc(v.name) + '</b><span class="ph-actions"><button class="btn-mini primary" type="button" data-mt="fo-open" data-id="' + v.id + '">Öffnen</button></span></li>';
      }).join("") + "</ul>" +
      '<p class="ph-hint">Jede Vorlage mit Fotos und Unterschrift. Das PDF geht an Kunde und Büro.</p>';
  }
  function findeVorlage(id) {
    var all = []; Object.keys(VORLAGEN).forEach(function (b) { all = all.concat(VORLAGEN[b]); });
    return all.filter(function (v) { return v.id === id; })[0];
  }

  /* --- Wartung & Prüffristen --- */
  function viewWartung() {
    var jahr = ex.wartung.reduce(function (s, w) { return s + w.preis; }, 0), vertraege = ex.wartung.filter(function (w) { return w.preis > 0; });
    $main.innerHTML = head("Wartung & Prüffristen", "Wartungsverträge und Prüffristen Ihrer Kunden. Das System erinnert rechtzeitig und schlägt Termine vor – planbarer Umsatz für Sie.") +
      '<div class="kpis">' + kpi("Wartungsverträge", String(vertraege.length), "aktiv · plus Gewährleistungsakten") + kpi("Umsatz pro Jahr", euro.format(jahr), "aus Verträgen") +
        kpi("Fällig in 30 Tagen", String(ex.wartung.filter(function (w) { return /Woche|Tagen|überfällig/.test(w.faellig); }).length), "Termine vorschlagen") +
        kpi("Neu nach Einbau", "1", "automatisch angelegt") + "</div>" +
      '<div class="wt-grid" id="wartung-liste">' + ex.wartung.map(function (w, i) {
        var tage = { "überfällig": -5, "diese Woche": 4, "in 12 Tagen": 12, "in 3 Wochen": 21, "in 11 Monaten": 335 }[w.faellig], intervall = w.art === "Gewährleistung endet" ? 1825 : 365;
        if (tage === undefined) tage = /Jahren/.test(w.faellig) ? 1765 : 200;
        var anteil = tage < 0 ? 1 : 1 - tage / intervall, farbe = tage < 0 ? "#B42318" : tage <= 30 ? "#E0A400" : "var(--acc)", U = 2 * Math.PI * 26;
        var ring = '<svg class="wt-ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" class="wt-bahn"/><circle cx="32" cy="32" r="26" style="stroke:' + farbe + ';stroke-dasharray:' + (U * Math.max(.04, anteil)).toFixed(1) + " " + U.toFixed(1) + '" class="wt-fort"/></svg>';
        var knopf = w.erledigt ? '<span class="pill ok">' + svg(ICON.check) + "Termin vorgeschlagen</span>" :
          /Woche|Tagen|überfällig/.test(w.faellig) ? '<button class="btn-mini primary" type="button" data-wt="' + i + '">Termin vorschlagen</button>' : (w.preis ? "" : '<button class="btn-mini" type="button" data-akte-open="' + esc(w.kunde) + '">Akte öffnen</button>');
        return '<article class="wt-karte"><div class="wt-oben">' + ring + '<div><span class="wt-art">' + w.art + (w.neu ? " · neu" : "") + "</span><strong>" + esc(w.kunde) + "</strong><small>" + esc(w.ort) + "</small></div></div>" +
          '<p class="wt-anlage">' + esc(w.anlage) + '</p><div class="wt-unten"><span class="wt-faellig" style="color:' + farbe + '">' + (w.faellig === "überfällig" ? "überfällig" : "fällig " + w.faellig) + "</span>" + (w.preis ? '<span class="amount">' + euro.format(w.preis) + "</span>" : "") + "</div>" + knopf + "</article>";
      }).join("") + "</div>";
  }

  /* --- Kundenportal (Sicht des Endkunden) --- */
  function viewPortal() {   // Kundenportal: Sicht genau eines Demo-Kunden (Rollen-Simulation)
    var kandidaten = state.leads.filter(function (l) { return l.stage !== "neu" || l.name === "Familie Huber"; });
    if (!kandidaten.some(function (l) { return l.name === state.portalKunde; })) state.portalKunde = (kandidaten.filter(function (l) { return l.name === "Familie Huber"; })[0] || kandidaten[0] || {}).name;
    var l = state.leads.filter(function (x) { return x.name === state.portalKunde; })[0];
    var kopf = head("Kundenportal", "So sieht Ihr Kunde seinen Auftrag – per Link auf dem Handy, ohne App und ohne Passwort.",
      "Rollen-Simulation: Oben wählen Sie, welchen Kunden Sie ansehen. In der echten Version bekommt jeder Kunde einen eigenen, geschützten Link und sieht nur seine Daten – eine echte Zugriffskontrolle gibt es in der Demo noch nicht.");
    if (!l) { $main.innerHTML = kopf + '<p class="col-empty">Noch kein Kunde mit Angebot oder Auftrag.</p>'; return; }
    var a = angebotVon(l.id), au = auftragVon(l.id), sA = a ? rechne(a.positionen) : null;
    var tm = mod.termine.filter(function (t) { return t.name === l.name && !t.erledigt; });
    var re = mod.rechnungen.filter(function (r) { return r.name === l.name; });
    var docs = dokumenteAlle().filter(function (x) { return x.kunde === l.name || istKunde(l.name, x.kunde); });
    var st = [["Anfrage", true], ["Besichtigung", l.stage !== "neu" || tm.some(function (t) { return /Besichtigung|Aufmaß/.test(t.art); })], ["Angebot", !!a || l.stage !== "neu"], ["Auftrag", l.stage === "auftrag" || l.stage === "erledigt"],
      ["Ausführung", au && (au.status === "arbeit" || au.status === "abgeschlossen")], ["Abnahme", l.stage === "erledigt" || (au && au.status === "abgeschlossen")]];
    var jetzt = st.filter(function (x) { return x[1]; }).length;
    var box = a && a.status === "gesendet" && a.varianten ? variantenPortal(a, l) : a && a.status === "gesendet" ?
        '<div class="po-box"><b>Ihr Angebot ' + esc(a.nr) + " liegt bereit</b><p>" + eur2.format(sA.brutto) + " brutto · " + esc(a.titel) + '</p><div class="btn-row"><button class="btn btn-signal" type="button" data-po-annehmen="' + l.id + '">Angebot annehmen</button></div></div>' :
      l.stage === "auftrag" ? '<div class="po-box"><b>Vielen Dank für Ihren Auftrag!</b><p>' + (tm[0] ? "Nächster Termin: " + esc(tm[0].tag) + ", " + esc(tm[0].zeit) + " Uhr (" + esc(tm[0].art) + ")" : "Wir melden uns mit dem Starttermin.") + "</p>" +
          (tm[0] && tm[0].offen ? '<button class="btn btn-signal" type="button" data-po-termin="' + mod.termine.indexOf(tm[0]) + '">Termin bestätigen</button>' : "") + "</div>" :
      l.stage === "erledigt" ? '<div class="po-box"><b>Ihr Auftrag ist abgeschlossen.</b><p>Danke für Ihr Vertrauen! Alle Unterlagen finden Sie unten.</p></div>' :
      '<div class="po-box"><b>Wir bereiten Ihr Angebot vor.</b><p>Sie bekommen eine Nachricht, sobald es hier bereitliegt.</p></div>';
    $main.innerHTML = kopf +
      '<div class="dash-filter"><label>Kunde (Simulation) <select data-po-kunde>' + kandidaten.map(function (k) { return "<option" + (k.name === l.name ? " selected" : "") + ">" + esc(k.name) + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="panel-grid two"><section class="panel portal" id="portal" aria-labelledby="po-h">' +
        '<p class="src">' + esc(BETRIEB) + '</p><h2 id="po-h">' + esc(anrede(l.name)) + ",</h2><p>hier sehen Sie jederzeit den Stand von „" + esc(l.betreff) + "“.</p>" +
        '<ol class="po-steps">' + st.map(function (x, i) { return '<li class="' + (x[1] ? "done" : i === jetzt ? "now" : "") + '">' + x[0] + "</li>"; }).join("") + "</ol>" + box +
        (hauptGewerk() === "maler" ? '<div class="po-box po-3d"><b>Ihre Wand in der Wunschfarbe</b><p>Foto vom Raum machen, auf die Wand tippen, Farbe ausprobieren – und das Ergebnis direkt an uns schicken.</p><button class="btn btn-outline" type="button" data-foto-faerben data-foto-kunde="' + esc(l.name) + '">' + svg(ICON.camera) + "Wand im Foto färben</button></div>" : "") +
        (konfKarten(l.name, "portal") ? '<h3>Ihr Produkt</h3>' + konfKarten(l.name, "portal") : '<div class="po-box po-3d"><b>Ihr Produkt in 3D ansehen</b><p>Drehen, Farbe wählen – und auf dem Handy direkt in Originalgröße in Ihren Raum stellen.</p><button class="btn btn-outline" type="button" data-konf-kunde="' + esc(arProduktFuer(l.betreff) + "|" + l.name) + '">' + svg(ICON.box) + "Ansehen und ausprobieren</button></div>") +
        (re.length ? "<h3>Ihre Rechnungen</h3><ul class=\"po-docs\">" + re.map(function (r) { var rest = restVon(r); return "<li>" + esc(r.nr) + " · " + euro.format(r.betrag) + " · " + (rest > 0 ? "offen " + euro.format(rest) : "bezahlt ✓") + "</li>"; }).join("") + "</ul>" : "") +
        "<h3>Ihre Unterlagen</h3>" + (docs.length || a ? '<ul class="po-docs">' + (a ? "<li>Angebot " + esc(a.nr) + " (Vorschau)</li>" : "") + docs.map(function (x) { return "<li>" + esc(x.titel || x.art) + "</li>"; }).join("") + "</ul>" : '<p class="src">Noch keine Unterlagen.</p>') +
        '<h3>Frage an den Betrieb</h3><form class="mini-form" data-po-frage onsubmit="return false"><input name="frage" placeholder="z. B. Können wir den Termin verschieben?" aria-label="Ihre Frage" required><button class="btn-mini primary" type="submit">Senden</button></form>' +
      "</section>" +
      '<section class="panel"><h2>Was der Betrieb davon hat</h2><ul class="checklist" style="margin-top:8px">' +
        "<li><span>Weniger Anrufe: Der Kunde sieht Status, Termin und Unterlagen selbst.</span></li>" +
        "<li><span>Schnellere Zusage: Angebot online annehmen.</span></li>" +
        "<li><span>Fragen landen direkt beim Vorgang im Cockpit.</span></li></ul>" +
        '<div class="po-box" style="margin-top:12px"><b>Produkt im eigenen Raum ansehen</b><p>Der Kunde sieht „' + esc((GW.PRODUKTE[arProduktFuer(l.betreff)] || {}).name || "sein Produkt") + '“ in Originalgröße über die Handykamera.</p><button class="btn btn-outline" type="button" data-ar="' + arProduktFuer(l.betreff) + '">Im Raum ansehen (AR)</button></div>' +
        '<p class="src" style="margin-top:12px">Alles, was der Kunde hier tut, erscheint sofort im Verlauf der Anfrage und in der Kundenakte.</p></section></div>';
  }

  /* --- Geschäftsführung: Kennzahlen auf der Übersicht --- */
  function gfPanel() {   // Geschäftszahlen, alle aus den Demo-Daten berechnet
    var ein = mod.rechnungen.reduce(function (x, r) { return x + bezahltVon(r); }, 0);
    var offen = mod.rechnungen.reduce(function (x, r) { return x + restVon(r); }, 0), ueber = mod.rechnungen.filter(function (r) { return r.faellig > 0 && restVon(r) > 0; }).reduce(function (x, r) { return x + restVon(r); }, 0);
    var mitAng = state.leads.filter(function (l) { return l.stage !== "neu"; }).length, mitAuf = state.leads.filter(function (l) { return l.stage === "auftrag" || l.stage === "erledigt"; }).length;
    var einsaetze = mod.termine.filter(function (t) { return !/Lager|Intern/.test(t.art || ""); }).length, kap = TEAM.length * 10;
    return '<section class="panel gf-panel" aria-labelledby="gf-h"><h2 id="gf-h">Geschäftszahlen · nur für die Geschäftsführung</h2><div class="kpis">' +
      kpiLink("Zahlungseingänge", euro.format(ein), "aus den erfassten Zahlungen", "finanzen") + kpiLink("Offene Posten", euro.format(offen), euro.format(ueber) + " davon überfällig", "rechnungen") +
      kpiLink("Auslastung Team", Math.min(100, Math.round(einsaetze / kap * 100)) + " %", einsaetze + " Einsätze für " + TEAM.length + " Personen (Kalender)", "termine") +
      kpiLink("Abschlussquote", mitAng ? Math.round(mitAuf / mitAng * 100) + " %" : "–", mitAuf + " Aufträge aus " + mitAng + " Angeboten", "vertrieb") + "</div></section>";
  }

  function aufmassAngebot() {
    var s = summen();
    var pos = [["Bodenfliesen verlegen inkl. Material", s.boden, EP.boden], ["Wandfliesen verlegen inkl. Material", s.wand, EP.wand], ["Decke spachteln und streichen", s.decke, EP.decke]];
    var summe = pos.reduce(function (a, p) { return a + p[1] * p[2]; }, 0) + 9800;
    ex.angebot = { pos: pos, summe: Math.round(summe), datum: "heute" };
    var huber = state.leads.filter(function (l) { return l.name === am.kunde; })[0];
    if (huber) { huber.stage = "angebot"; huber.wert = ex.angebot.summe; huber.angebotVor = 0; huber.erinnert = 0; huber.verlauf.push({ t: 0, text: "Aufmaß übernommen · Angebot über " + euro.format(ex.angebot.summe) + " erstellt" }); }
    return ex.angebot;
  }

  /* =====================================================================
     10. KUNDENAKTE: Fotos und interner Chat je Kunde, erweitertes Aufmaß
     ===================================================================== */
  var AKTE_START = {
    "Familie Huber": {
      fotos: [{ label: "Bad, Bestand", von: "Kunde (WhatsApp)", wann: "heute 07:40" }, { label: "Dusche, Ablauf", von: "Kunde (WhatsApp)", wann: "heute 07:40" }, { label: "Gäste-WC", von: "Kunde (WhatsApp)", wann: "heute 07:41" }],
      chat: [{ von: "Sabine (Büro)", text: "Kundin wünscht bodengleiche Dusche. Bitte bei der Besichtigung das Gefälle prüfen.", wann: "08:12" },
             { von: "Stefan (Außendienst)", text: "Mach ich. Alex, kannst du um 16 Uhr zum Aufmaß dazukommen?", wann: "08:20" },
             { von: "Alex", text: "Passt, bin um 16 Uhr da.", wann: "08:31" }]
    },
    "Familie Brandl": {
      fotos: [{ label: "Alte Therme", von: "Alex", wann: "gestern" }, { label: "Neue Therme montiert", von: "Robin", wann: "gestern" }],
      chat: [{ von: "Alex", text: "Abgasrohr ist 20 cm zu kurz, brauche morgen ein Verlängerungsstück.", wann: "gestern 15:10" },
             { von: "Sabine (Büro)", text: "Ist bestellt, liegt morgen früh im Lager.", wann: "gestern 15:25" }]
    },
    "Max Lechner": { fotos: [], chat: [{ von: "Sabine (Büro)", text: "Kleinauftrag, bitte gleich vor Ort abrechnen (Regiebericht).", wann: "07:55" }] },
    "Anton Wagner": { fotos: [{ label: "Typenschild Ölbrenner", von: "Robin", wann: "letztes Jahr" }], chat: [] },
    "Wohnbau Fürth, Whg. 4": { fotos: [{ label: "Wohnzimmer fertig", von: "Lena", wann: "vor 2 Tagen" }], chat: [{ von: "Thomas (GF)", text: "Abnahme bitte mit Fotos von jedem Raum dokumentieren.", wann: "gestern" }] },
    "Thomas Bauer": { fotos: [], chat: [] }
  };
  var akte;
  function resetAkte() {
    akte = {};
    Object.keys(AKTE_START).forEach(function (k) {
      akte[k] = { fotos: AKTE_START[k].fotos.map(function (f) { return Object.assign({}, f); }), chat: AKTE_START[k].chat.map(function (c) { return Object.assign({}, c); }), tab: "fotos" };
    });
  }
  resetAkte();
  function akteVon(name) { if (!akte[name]) akte[name] = { fotos: [], chat: [], tab: "fotos" }; return akte[name]; }
  function ichName() { return { gf: "Thomas (GF)", buero: "Sabine (Büro)", aussen: "Stefan (Außendienst)", monteur: "Alex", betreiber: "Dominik (Betreiber)" }[state.rolle] || "Sabine (Büro)"; }
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"); };

  function akteHtml(name) {
    var a = akteVon(name), id = "akte-" + slug(name);
    var fotos = '<div class="ak-fotos">' + (a.fotos.length ? a.fotos.map(function (f) {
        return '<figure class="ak-foto">' + (f.src ? '<img src="' + f.src + '" alt="' + esc(f.label) + '">' : '<span class="ak-ph" aria-hidden="true">' + svg(ICON.camera) + "</span>") +
          "<figcaption>" + esc(f.label) + "<small>" + esc(f.von) + " · " + esc(f.wann) + "</small></figcaption></figure>";
      }).join("") : '<p class="col-empty">Noch keine Fotos.</p>') + "</div>" +
      '<label class="btn-mini primary ak-up">' + svg(ICON.camera) + 'Foto aufnehmen oder hochladen<input type="file" accept="image/*" capture="environment" multiple data-akte-up="' + esc(name) + '" hidden></label>';
    var chat = '<div class="ak-chat" aria-live="polite">' + (a.chat.length ? a.chat.map(function (c) {
        var ich = c.von === ichName();
        return '<div class="ak-msg' + (ich ? " me" : "") + '"><b>' + esc(c.von) + "</b>" + esc(c.text) + "<small>" + esc(c.wann) + "</small></div>";
      }).join("") : '<p class="col-empty">Noch keine Nachrichten. Stimmen Sie sich hier intern ab – der Kunde sieht das nicht.</p>') + "</div>" +
      '<div class="ak-send"><input type="text" placeholder="Nachricht an das Team …" aria-label="Nachricht an das Team" data-akte-in="' + esc(name) + '"><button class="btn-mini primary" type="button" data-akte-send="' + esc(name) + '">Senden</button></div>';
    return '<div class="akte" id="' + id + '"><div class="ak-tabs" role="tablist">' +
        '<button type="button" role="tab" data-akte-tab="fotos" data-akte-name="' + esc(name) + '" aria-selected="' + (a.tab === "fotos") + '">Fotos (' + a.fotos.length + ")</button>" +
        '<button type="button" role="tab" data-akte-tab="chat" data-akte-name="' + esc(name) + '" aria-selected="' + (a.tab === "chat") + '">Interner Chat (' + a.chat.length + ")</button></div>" +
      (a.tab === "fotos" ? fotos : chat) + "</div>";
  }
  function akteNeu(name) {
    var el = document.getElementById("akte-" + slug(name));
    if (el) el.outerHTML = akteHtml(name);
    var c = document.querySelector("#akte-" + slug(name) + " .ak-chat"); if (c) c.scrollTop = c.scrollHeight;
  }
  var ANTWORTEN = ["Danke, ist notiert.", "Alles klar, kümmere mich drum.", "Passt so – gib Bescheid, wenn noch was fehlt.", "Gesehen 👍"];
  function akteSenden(name) {
    var inp = document.querySelector('[data-akte-in="' + name.replace(/"/g, '\\"') + '"]');
    if (!inp || !inp.value.trim()) return;
    var a = akteVon(name), jetzt = new Date();
    var zeit = ("0" + jetzt.getHours()).slice(-2) + ":" + ("0" + jetzt.getMinutes()).slice(-2);
    a.chat.push({ von: ichName(), text: inp.value.trim(), wann: zeit });
    a.tab = "chat"; akteNeu(name);
    var antwortVon = ichName() === "Sabine (Büro)" ? "Alex" : "Sabine (Büro)";
    setTimeout(function () { a.chat.push({ von: antwortVon, text: ANTWORTEN[a.chat.length % ANTWORTEN.length], wann: zeit }); akteNeu(name); }, 1400);
  }

  /* --- Aufmaß, erweitert: Abzüge je Öffnung, Verschnitt, Sockel, Material --- */
  var AM_KUNDEN = ["Familie Huber", "Familie Brandl", "Wohnbau Fürth, Whg. 4"];
  var AM_START = [
    { name: "Bad", l: 2.8, b: 2.9, h: 2.5, ab: [{ art: "Tür", b: 0.8, h: 2.0 }, { art: "Fenster", b: 0.9, h: 1.0 }] },
    { name: "Gäste-WC", l: 1.2, b: 1.6, h: 2.5, ab: [{ art: "Tür", b: 0.7, h: 2.0 }] }
  ];
  var am;
  function resetAufmass() { am = { kunde: "Familie Huber", verschnitt: 10, raeume: AM_START.map(function (r) { return { name: r.name, l: r.l, b: r.b, h: r.h, ab: r.ab.map(function (x) { return Object.assign({}, x); }) }; }) }; }
  resetAufmass();
  flaechen = function (r) {
    var abz = (r.ab || []).reduce(function (s, x) { return s + x.b * x.h; }, 0);
    var tuer = (r.ab || []).filter(function (x) { return x.art === "Tür"; }).reduce(function (s, x) { return s + x.b; }, 0);
    var boden = r.l * r.b;
    return { boden: boden, wand: Math.max(0, 2 * (r.l + r.b) * r.h - abz), decke: boden, sockel: Math.max(0, 2 * (r.l + r.b) - tuer), abz: abz };
  };
  summen = function () {
    return am.raeume.reduce(function (s, r) { var f = flaechen(r); s.boden += f.boden; s.wand += f.wand; s.decke += f.decke; s.sockel += f.sockel; return s; }, { boden: 0, wand: 0, decke: 0, sockel: 0 });
  };
  ex.raeume = am.raeume;
  function amErgebnis(i) { var f = flaechen(am.raeume[i]); return "Boden " + zahl(f.boden) + " m² · Wände " + zahl(f.wand) + " m² · Decke " + zahl(f.decke) + " m² · Sockel " + zahl(f.sockel) + " m"; }
  amSumme = function () {
    var s = summen(), v = 1 + am.verschnitt / 100, el = document.getElementById("am-sum");
    if (!el) return;
    var bf = s.boden * v, wf = s.wand * v;
    el.innerHTML = "<b>Gesamt:</b> Boden " + zahl(s.boden) + " m² · Wände " + zahl(s.wand) + " m² · Decke " + zahl(s.decke) + " m² · Sockel " + zahl(s.sockel) + " m" +
      '<br><b>Material inkl. ' + am.verschnitt + " % Verschnitt:</b> Bodenfliesen " + zahl(bf) + " m² (" + Math.ceil(bf / 1.44) + " Pakete) · Wandfliesen " + zahl(wf) + " m² (" + Math.ceil(wf / 1.44) + " Pakete)";
  };
  phoneAufmass = function () {
    return '<div class="field"><label for="am-kunde">Kunde</label><select id="am-kunde">' + AM_KUNDEN.map(function (k) { return "<option" + (k === am.kunde ? " selected" : "") + ">" + esc(k) + "</option>"; }).join("") + "</select></div>" +
      am.raeume.map(function (r, i) {
        return '<div class="am-raum"><div class="am-head"><input aria-label="Raumname" data-am="' + i + '" data-k="name" value="' + esc(r.name) + '">' +
            '<button class="btn-mini" type="button" data-mt="am-foto" data-i="' + i + '">' + svg(ICON.camera) + 'Foto</button><button class="btn-mini" type="button" data-mt="am-del" data-i="' + i + '" aria-label="Raum löschen">✕</button></div>' +
          '<div class="am-grid three">' + [["l", "Länge m"], ["b", "Breite m"], ["h", "Höhe m"]].map(function (k) {
            return '<label><span>' + k[1] + '</span><input type="number" step="0.01" min="0" inputmode="decimal" data-am="' + i + '" data-k="' + k[0] + '" value="' + r[k[0]] + '"></label>'; }).join("") + "</div>" +
          '<div class="am-ab"><span class="am-ab-t">Abzüge</span>' + r.ab.map(function (x, j) {
            return '<div class="am-ab-row"><select data-ab="' + i + "," + j + '" data-k="art" aria-label="Art"><option' + (x.art === "Tür" ? " selected" : "") + ">Tür</option><option" + (x.art === "Fenster" ? " selected" : "") + ">Fenster</option><option" + (x.art === "Sonstiges" ? " selected" : "") + ">Sonstiges</option></select>" +
              '<input type="number" step="0.01" min="0" inputmode="decimal" aria-label="Breite" data-ab="' + i + "," + j + '" data-k="b" value="' + x.b + '"><span>×</span>' +
              '<input type="number" step="0.01" min="0" inputmode="decimal" aria-label="Höhe" data-ab="' + i + "," + j + '" data-k="h" value="' + x.h + '"><button class="btn-mini" type="button" data-mt="ab-del" data-i="' + i + '" data-j="' + j + '" aria-label="Abzug löschen">✕</button></div>';
          }).join("") + '<button class="btn-mini" type="button" data-mt="ab-add" data-i="' + i + '">+ Tür / Fenster</button></div>' +
          '<p class="am-erg" id="am-erg-' + i + '">' + amErgebnis(i) + "</p></div>";
      }).join("") +
      '<button class="btn-mini" type="button" data-mt="am-raum">+ Raum hinzufügen</button>' +
      '<div class="field"><label for="am-vs">Verschnitt in %</label><input id="am-vs" type="number" min="0" max="40" value="' + am.verschnitt + '"></div>' +
      '<div class="am-sum" id="am-sum"></div>' +
      '<div class="am-buttons"><button class="btn btn-signal" type="button" data-mt="am-angebot">Ins Angebot übernehmen</button>' +
      '<button class="btn btn-outline" type="button" data-mt="am-material">Material bestellen</button>' +
      '<button class="btn btn-outline" type="button" data-dok="am-live">Aufmaß ansehen</button>' +
      '<button class="btn btn-outline" type="button" data-mt="am-pdf">Aufmaß als PDF an Kunde</button></div>' +
      '<p class="ph-hint">Maße auch per Laser-Messgerät (Bluetooth) oder per Sprache. Fotos landen automatisch in der Kundenakte.</p>';
  };

  /* --- Kundenakte auf dem Handy --- */
  function phoneAkte() {
    var t = mod.termine.filter(function (x) { return x.name === mt.akteName; })[0];
    return '<p class="ph-note"><button class="btn-mini" type="button" data-mt="tab-kunden">← Alle Kunden</button> <b>' + esc(mt.akteName) + "</b>" + (t ? " · " + esc(t.ort) : "") + "</p>" +
      (t ? '<p class="ph-note" style="color:var(--muted)">' + esc(t.info) + "</p>" : "") +
      dokumenteAlle().filter(function (x) { return x.art === "aufmass" && x.kunde === mt.akteName; }).map(function (x) { return '<button class="btn btn-outline" type="button" data-dok="' + x.id + '" style="width:100%">' + svg(ICON.doc) + "Aufmaß ansehen</button>"; }).join("") +
      akteHtml(mt.akteName);
  }

  /* =====================================================================
     11. KUNDENAKTE ALS EIGENE SEITE: alle Vorgänge eines Kunden an einem Ort
     ===================================================================== */
  var AKTE_EXTRA = {   // Beispiel-Vorgänge, die es in den anderen Listen nicht gibt
    "Familie Brandl": [
      { t: 28, typ: "aufmass", text: "Aufmaß Heizraum: 2,40 × 1,80 m, Abgasweg 6,5 m", von: "Stefan (Außendienst)" },
      { t: 22, typ: "auftrag", text: "Angebot im Kundenportal angenommen und unterschrieben", von: "Kunde" },
      { t: 3, typ: "regie", text: "Regiebericht RB-0410: Demontage alte Therme, 8 Std., Entsorgung", von: "Alex, Robin" }
    ],
    "Familie Huber": [
      { t: 0, typ: "termin", text: "Besichtigung 14:30, danach Aufmaß 16:00", von: "Stefan (Außendienst)" }
    ]
  };
  var TYP = {
    anfrage: ["Anfrage", "inbox"], angebot: ["Angebot", "send"], auftrag: ["Auftrag", "check"], aufmass: ["Aufmaß", "wrench"],
    foto: ["Foto", "camera"], chat: ["Chat", "inbox"], regie: ["Regiebericht", "wrench"], formular: ["Formular", "check"],
    rechnung: ["Rechnung", "euro"], zahlung: ["Zahlung", "euro"], termin: ["Termin", "calendar"], dokument: ["Dokument", "doc"], wartung: ["Wartung", "shield"], info: ["Info", "spark"]
  };
  var wannZuT = function (w) {
    w = String(w || "");
    if (/gerade|heute|^\d\d:\d\d$/.test(w)) return 0;
    if (/gestern/.test(w)) return 1;
    var m = w.match(/vor (\d+) Tag/); if (m) return +m[1];
    if (/letztes Jahr/.test(w)) return 300;
    return 0;
  };
  var istKunde = function (name, text) { return String(text || "").indexOf(name) > -1; };

  function vorgaenge(name) {
    var v = [], lead = state.leads.filter(function (l) { return l.name === name; })[0];
    if (lead) lead.verlauf.forEach(function (e) {
      var typ = /Angebot/.test(e.text) ? "angebot" : /Auftrag|angenommen/.test(e.text) ? "auftrag" : /Rechnung/.test(e.text) ? "rechnung" : /Aufmaß/.test(e.text) ? "aufmass" : /Anfrage|Vorprüfung/.test(e.text) ? "anfrage" : "info";
      v.push({ t: e.t, typ: typ, text: e.text, von: "System" });
    });
    (AKTE_EXTRA[name] || []).forEach(function (e) { v.push(Object.assign({}, e)); });
    var a = akteVon(name);
    a.fotos.forEach(function (f) { v.push({ t: wannZuT(f.wann), typ: "foto", text: "Foto: " + f.label, von: f.von, foto: f }); });
    a.chat.forEach(function (c) { v.push({ t: wannZuT(c.wann), typ: "chat", text: c.text, von: c.von }); });
    mt.berichte.filter(function (b) { return istKunde(name, b.baustelle) || (b.nr.indexOf("FO") === 0 && name === "Familie Brandl"); }).forEach(function (b) {
      v.push({ t: wannZuT(b.datum), typ: b.nr.indexOf("FO") === 0 ? "formular" : "regie", text: (b.nr.indexOf("FO") === 0 ? b.baustelle : "Regiebericht " + b.nr) + ": " + (b.stunden != null ? String(b.stunden).replace(".", ",") + " Std., " : "") + b.material, von: b.monteur });
    });
    if (am.kunde === name && ex.angebot) v.push({ t: 0, typ: "angebot", text: "Angebotsentwurf aus Aufmaß: " + euro.format(ex.angebot.summe), von: ichName() });
    if (am.kunde === name) v.push({ t: 0, typ: "aufmass", text: "Aufmaß: " + am.raeume.map(function (r) { return r.name; }).join(", ") + " – Boden " + zahl(summen().boden) + " m², Wände " + zahl(summen().wand) + " m²", von: "Alex, Stefan" });
    mod.rechnungen.filter(function (r) { return r.name === name; }).forEach(function (r) {
      v.push({ t: Math.max(1, (r.faellig || 0) + 14), typ: "rechnung", text: (lead && lead.stage === "auftrag" ? "Abschlagsrechnung " : "Rechnung ") + r.nr + " über " + euro.format(r.betrag) + " gestellt", von: "Sabine (Büro)" });
      if (r.status === "bezahlt") v.push({ t: 0, typ: "zahlung", text: "Zahlung " + euro.format(r.betrag) + " eingegangen und zugeordnet", von: "System" });
      if (r.erinnert) v.push({ t: 0, typ: "rechnung", text: r.erinnert + ". Zahlungserinnerung gesendet", von: "Sabine (Büro)" });
    });
    mod.termine.filter(function (t) { return t.name === name; }).forEach(function (t) { v.push({ t: t.tag === "Heute" ? 0 : -1, typ: "termin", text: t.tag + " " + t.zeit + ": " + t.art + " (" + t.wer + ")", von: "Kalender" }); });
    if (lead && state.signiert[lead.id]) v.push({ t: 0, typ: "dokument", text: "Auftrag unterschrieben " + state.signiert[lead.id].wie, von: ichName() });
    state.papier.filter(function (x) { return x.kunde === name; }).forEach(function (x) { v.push({ t: 0, typ: "dokument", text: x.titel + " (Papier, eingescannt)", von: ichName() }); });
    (state.angebote || []).filter(function (a) { return a.kunde === name && a.status !== "ersetzt"; }).forEach(function (a) { v.push({ t: 0, typ: "angebot", text: "Angebot " + a.nr + " (" + A_ST[a.status][0] + "): " + euro.format(rechne(a.positionen).brutto) + " brutto", von: "Angebote" }); });
    (state.auftraege || []).filter(function (a) { return a.kunde === name; }).forEach(function (a) { v.push({ t: 0, typ: "auftrag", text: "Auftrag " + a.nr + " · " + AU_ST[a.status][0] + " · verantwortlich " + a.verantwortlich, von: "Aufträge" }); });
    mod.rechnungen.filter(function (r) { return r.name === name; }).forEach(function (r) { (r.zahlungen || []).forEach(function (z) { v.push({ t: 0, typ: "zahlung", text: "Zahlung " + eur2.format(z.betrag) + " auf " + r.nr + " (" + z.datum + ")", von: z.von }); }); });
    ex.wartung.filter(function (w) { return w.kunde === name; }).forEach(function (w) { v.push({ t: -2, typ: "wartung", text: w.art + " " + w.anlage + ", fällig " + w.faellig, von: "System" }); });
    return v.sort(function (x, y) { return x.t - y.t; });
  }

  function viewKundenakte() {
    var name = state.akteKunde, lead = state.leads.filter(function (l) { return l.name === name; })[0];
    var alle = vorgaenge(name), tab = state.akteTab || "alles";
    if (state.rolle === "aussen" && tab === "geld") tab = "alles";
    var rech = mod.rechnungen.filter(function (r) { return r.name === name; });
    var offen = rech.filter(function (r) { return r.status !== "bezahlt"; }).reduce(function (s, r) { return s + r.betrag; }, 0);
    var stunden = mt.berichte.filter(function (b) { return istKunde(name, b.baustelle) && b.stunden != null; }).reduce(function (s, b) { return s + b.stunden; }, 0) + (name === "Familie Brandl" ? 8 : 0);
    var P = profilVon(name);
    var TABS = [["ueberblick", "Überblick"], ["alles", "Alle Vorgänge"], ["dokumente", "Dokumente & Unterschriften"], ["aufmass", "Aufmaß"], ["fotos", "Fotos & Chat"], ["berichte", "Regie & Formulare"], ["geld", "Angebote & Rechnungen"], ["termine", "Termine & Wartung"]]
      .filter(function (t) { return !(state.rolle === "aussen" && t[0] === "geld"); });
    var filter = { alles: null, aufmass: ["aufmass"], berichte: ["regie", "formular"], geld: ["angebot", "auftrag", "rechnung", "zahlung"], termine: ["termin", "wartung"] }[tab];
    var liste = alle.filter(function (e) { return !filter || filter.indexOf(e.typ) > -1; });
    var wann = function (t) { return t < 0 ? "geplant" : vorTagen(t); };
    var dokK = dokumenteAlle().filter(function (x) { return x.kunde === name || istKunde(name, x.kunde); });
    var kfK = konfKarten(name), kfBlock = kfK ? '<div class="kf-block"><h3>Produkte &amp; Konfigurationen</h3>' + kfK + "</div>" : "";
    var inhalt = tab === "ueberblick" ? kfBlock + akteUeberblick(name, P) :  tab === "dokumente" ? (dokK.length ? '<div class="rows">' + dokK.map(dokZeile).join("") + "</div>" : '<p class="col-empty">Noch keine Dokumente.</p>') + '<p style="margin:12px 0 0">' + papierKnopf(name) + "</p>" :
      tab === "fotos" ? akteHtml(name) :
      (liste.length ? '<ol class="ka-tl">' + liste.map(function (e) {
        return '<li class="ka-' + e.typ + '"><span class="ka-ic">' + svg(ICON[TYP[e.typ][1]] || ICON.check) + '</span><div><span class="pill">' + TYP[e.typ][0] + "</span> " + esc(e.text) +
          (e.foto && e.foto.src ? '<img class="ka-img" src="' + e.foto.src + '" alt="' + esc(e.foto.label) + '">' : "") +
          "<small>" + esc(e.von) + " · " + wann(e.t) + "</small></div></li>";
      }).join("") + "</ol>" : '<p class="col-empty">Noch keine Einträge in diesem Bereich.</p>');
    if (tab === "aufmass") {
      var ams = dokumenteAlle().filter(function (x) { return x.art === "aufmass" && x.am && x.kunde === name; });
      inhalt = ams.length ? ams.map(function (x) { return '<article class="am-karte"><div class="am-karte-kopf"><div><h3>' + esc(x.titel) + "</h3><small>" + esc(x.wie) + " · " + tageText(x.t) + '</small></div><button class="btn-mini" type="button" data-dok="' + x.id + '">Als PDF ansehen</button></div>' + aufmassHtml(x.am) + aufmassFotos(name) + "</article>"; }).join("") :
        '<p class="col-empty">Für diesen Kunden gibt es noch kein Aufmaß.</p>';
    }
    if (tab === "aufmass" && kfBlock) inhalt = kfBlock + inhalt;
    if (tab === "aufmass" && state.rolle !== "monteur") inhalt += '<p style="margin:12px 0 0"><button class="btn btn-outline" type="button" data-am-neu="' + esc(name) + '">' + svg(ICON.ruler) + "Neues Aufmaß für " + esc(name) + "</button></p>";
    var umsatz = P.auftraege.reduce(function (s2, a) { return s2 + a[2]; }, 0), kd = (state.kunden || []).filter(function (x) { return x.name === name; })[0];
    $main.innerHTML =
      '<div class="view-head"><div><p><button class="btn-mini" type="button" data-go="kunden">← Alle Kunden</button> <button class="btn-mini" type="button" data-kunde-edit="' + esc(name) + '">Bearbeiten</button>' + (darf("loeschen") ? ' <button class="btn-mini danger" type="button" data-kunde-del="' + esc(name) + '">Löschen</button>' : "") + "</p><h1>" + esc(name) + "</h1>" +
        "<p>Kundenakte</p></div></div>" +
      '<section class="kp-karte"><span class="kp-av">' + esc(name.replace(/^Familie /, "").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2)) + "</span>" +
        '<div class="kp-kontakt"><b>Kontakt</b><small>' + esc(lead ? lead.ort : kd ? kd.ort : "") + (lead ? " · " + esc(lead.tel || "") + " · " + esc(lead.mail || "") : kd && (kd.tel || kd.mail) ? " · " + esc(kd.tel || "") + " · " + esc(kd.mail || "") : "") + "</small>" +
        (kd && kd.ansprech && kd.ansprech.length ? "<small>Ansprechpartner: " + kd.ansprech.map(esc).join(" · ") + "</small>" : "") +
        '<div class="kp-tags">' + P.tags.map(function (t2) { return '<span class="pill ok">' + esc(t2) + "</span>"; }).join("") + '<span class="pill">am liebsten ' + esc(P.kanal) + "</span></div></div>" +
        '<div class="kp-zahlen"><div><small>Kunde seit</small><b>' + P.seit + "</b></div><div><small>Umsatz gesamt</small><b>" + euro.format(umsatz) + "</b></div><div><small>Aufträge</small><b>" + P.auftraege.length + "</b></div>" +
        "<div><small>Ø Auftrag</small><b>" + (P.auftraege.length ? euro.format(umsatz / P.auftraege.length) : "–") + "</b></div>" +
        '<div class="kp-breit"><small>Zahlung</small><b>' + esc(P.zahlung) + '</b></div><div class="kp-breit"><small>Bewertung · Empfehlungen</small><b>' + (P.bewertung ? "★ abgegeben" : "noch keine") + " · " + P.empfehlungen + "</b></div></div></section>" +
      '<div class="kpis" style="display:none">' +
        kpi("Vorgänge", String(alle.length), "alles an einem Ort") +
        kpi(lead && (lead.stage === "auftrag" || lead.stage === "erledigt") ? "Auftragswert" : "Angebotswert", lead ? euro.format(lead.wert) : "–", lead ? STAGES.filter(function (s) { return s.id === lead.stage; })[0].label : "") +
        (state.rolle === "aussen" ? kpi("Fotos", String(akteVon(name).fotos.length), "in der Akte") : kpi("Offene Rechnungen", euro.format(offen), rech.length + " Rechnungen gesamt")) +
        kpi("Stunden laut Regie", String(stunden).replace(".", ","), "aus Regieberichten") +
      "</div>" +
      '<div class="filter ka-tabs" role="tablist" aria-label="Bereiche der Kundenakte">' + TABS.map(function (t) {
        return '<button type="button" role="tab" data-ka-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<section class="panel" id="kundenakte">' + inhalt + "</section>";
  }
  function akteUeberblick(name, P) {
    var auftr = P.auftraege.length ? '<div class="kp-auftraege">' + P.auftraege.map(function (a) {
        var pill = a[3] === "bezahlt" ? '<span class="pill ok">' + svg(ICON.check) + "bezahlt</span>" : a[3] === "offen" ? '<span class="pill no">Rechnung offen</span>' : '<span class="pill check">läuft</span>';
        return '<article class="kp-auftrag"><div class="kp-a-kopf"><b>' + esc(a[0]) + "</b>" + pill + '</div><span class="kp-betrag">' + euro.format(a[2]) + "</span><small>" + a[1] + (a[4] !== "–" ? " · Gewährleistung bis " + a[4] : "") + '</small><div class="kp-a-fuss"><span>' + svg(ICON.camera) + a[5] + " Fotos</span><span>" + svg(ICON.doc) + a[6] + " Unterlagen</span></div></article>";
      }).join("") + "</div>" : '<p class="col-empty">Noch keine Aufträge.</p>';
    var ger = P.geraete.length ? '<div class="rows">' + P.geraete.map(function (g) {
        var bald = /diese Woche|Tagen|abgelaufen/.test(g[4] + g[3]);
        return '<div class="row"><div class="row-main"><strong>' + esc(g[0]) + "</strong><small>" + esc(g[1]) + " · eingebaut " + esc(g[2]) + " · Garantie bis " + esc(g[3]) + "</small></div>" +
          '<div class="row-side">' + (g[4] !== "–" ? '<span class="pill' + (bald ? " check" : "") + '">Wartung: ' + esc(g[4]) + "</span>" : "") + "</div></div>";
      }).join("") + "</div>" : '<p class="col-empty">Noch nichts erfasst.</p>';
    var ideen = P.ideen.length ? '<ul class="kp-ideen">' + P.ideen.map(function (x, i) {
        var erl = (state.kpIdee || {})[name + i];
        return '<li><span class="kp-idee-ic">' + svg(ICON.spark) + "</span><span><b>" + esc(x[0]) + "</b><small>" + esc(x[1]) + "</small></span>" +
          (erl ? '<span class="pill ok">' + svg(ICON.check) + "vorbereitet</span>" : '<button class="btn-mini primary" type="button" data-kp-idee="' + esc(name) + "|" + i + '">' + esc(x[2]) + "</button>") + "</li>";
      }).join("") + "</ul>" : '<p class="col-empty">Gerade nichts.</p>';
    var notizen = (P.notizen || []).concat((state.kpNotiz || {})[name] || []);
    return '<div class="kp-raster"><section><h2 class="kp-h">Gekauft &amp; erledigt</h2>' + auftr + '<h2 class="kp-h">Beim Kunden verbaut</h2>' + ger + "</section>" +
      '<section><h2 class="kp-h">Passt als Nächstes</h2>' + ideen + '<p class="src">Vorschläge aus den Daten. Verschickt wird nur nach Ihrer Freigabe.</p>' +
      '<h2 class="kp-h">Notizen fürs Team</h2><ul class="kp-notizen">' + (notizen.length ? notizen.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") : '<li class="leer">Noch keine Notizen</li>') + "</ul>" +
      '<form class="kp-notiz-form" data-kp-notiz="' + esc(name) + '" onsubmit="return false"><input type="text" placeholder="Notiz hinzufügen, z. B. „bitte klingeln“" aria-label="Notiz hinzufügen"><button class="btn-mini" type="submit">Speichern</button></form>' +
      '<p class="src">Die Montagekraft sieht die Notizen in ihrer App. Nur sachliche, geschäftliche Angaben – Kunden können jederzeit Auskunft verlangen.</p></section></div>';
  }
  function akteOeffnen(name) { closeDrawer(); state.akteKunde = name; state.akteTab = "ueberblick"; state.view = "akte"; render(); window.scrollTo(0, 0); }

  /* =====================================================================
     14. AUFTRAGSPORTAL (Zusatztool): Endkunden fragen an, der Betreiber
     vermittelt jede Anfrage an EINEN Betrieb aus seinem Netzwerk.
     Provision nur bei Auftrag: 5 % vom Nettoauftragswert, mindestens 75 €,
     Aufträge unter 500 € provisionsfrei. Kein Monatsbeitrag, keine Kosten
     pro Anfrage. Den Vertrag schließt der Endkunde direkt mit dem Betrieb.
     ===================================================================== */
  var PARTNER = [
    { name: BETRIEB, gewerk: ["Sanitär & Bad", "Heizung, Wärmepumpe & Klima"], gebiet: "Erlangen, Herzogenaurach, Fürth", bew: 4.8, annahme: 92, kap: "frei ab KW 46", zuletzt: 6, min: 0 },
    { name: "Bad & Wärme Schmitt", gewerk: ["Sanitär & Bad", "Heizung, Wärmepumpe & Klima"], gebiet: "Nürnberg, Fürth", bew: 4.6, annahme: 84, kap: "frei ab KW 48", zuletzt: 2, min: 5000 },
    { name: "Fliesen Yilmaz", gewerk: ["Fliesen", "Sanitär & Bad", "Boden & Parkett"], gebiet: "Erlangen, Nürnberg", bew: 4.9, annahme: 95, kap: "frei", zuletzt: 9, voll: false },
    { name: "Elektro Wagner", gewerk: ["Elektro", "Solar & Photovoltaik"], gebiet: "Erlangen, Nürnberg-Nord", bew: 4.7, annahme: 88, kap: "frei", zuletzt: 4 },
    { name: "Malerbetrieb Kraus", gewerk: ["Maler & Fassade", "Trockenbau & Estrich"], gebiet: "Fürth, Zirndorf, Erlangen", bew: 4.5, annahme: 90, kap: "frei ab KW 45", zuletzt: 12, min: 1500 },
    { name: "Dachdeckerei Lang", gewerk: ["Dach & Spengler"], gebiet: "Landkreis Erlangen-Höchstadt", bew: 4.8, annahme: 80, kap: "frei ab KW 50", zuletzt: 20, min: 1000 },
    { name: "Fensterbau Huber", gewerk: ["Fenster, Türen & Tore", "Sonnenschutz & Terrassendach", "Schreiner, Küche & Treppen"], gebiet: "Nürnberg, Erlangen, Fürth", bew: 4.6, annahme: 91, kap: "frei", zuletzt: 7 },
    { name: "Hausmeisterservice Franken", gewerk: ["Garten, Pflaster & Zaun"], gebiet: "Nürnberg, Fürth, Erlangen", bew: 4.4, annahme: 97, kap: "frei", zuletzt: 3 }
  ];
  var VM_START = [
    { id: "v1", name: "Familie Roth", ort: "Erlangen", vorhaben: "Sanitär & Bad", gewerk: "Sanitär & Bad", wunsch: ["Fliesen Yilmaz", "Bad & Wärme Schmitt", BETRIEB], details: "9 m² · Komplett neu", zeit: "In den nächsten 3 Monaten", rolle: "Im Eigentum", von: 17000, bis: 26000, fotos: 3, status: "neu", eingang: "heute 07:12", note: "A", budget: "Ja, das passt",
      ki: "Komplettsanierung, 3 Fotos, Budget zur Preisspanne passend. Eigentümer, Start in 3 Monaten – gute Abschlusschance." },
    { id: "v2", name: "Klaus Meier", ort: "Fürth", vorhaben: "Heizung, Wärmepumpe & Klima", gewerk: "Heizung, Wärmepumpe & Klima", details: "Neue Wärmepumpe · 160 m²", zeit: "In den nächsten 3 Monaten", rolle: "Im Eigentum", von: 31000, bis: 46000, fotos: 2, status: "neu", eingang: "heute 06:40", note: "B", gruende: ["Budget noch unklar – kurz nachfragen"], budget: "Weiß ich noch nicht",
      ki: "Wärmepumpe statt Ölheizung, Baujahr 1998. Förderung wahrscheinlich Thema – Betrieb mit Fördererfahrung wählen." },
    { id: "v11", name: "Kevin Lorenz", ort: "Nürnberg", vorhaben: "Sanitär & Bad", gewerk: "Sanitär & Bad", details: "6 m² · Komplett neu · Einfach", zeit: "Später / noch in Planung", rolle: "Mietpartei", von: 9500, bis: 12500, fotos: 0, status: "neu", eingang: "gestern", note: "C",
      gruende: ["Mietpartei – Zustimmung der Vermietung nötig", "noch in Planung – in 3 Monaten nachfragen"], budget: "Eher nicht", ki: "Mietpartei, Budget passt laut Kunde nicht, Start offen." },
    { id: "v3", name: "Jonas Pfeiffer", ort: "Erlangen", vorhaben: "Sanitär & Bad", gewerk: "Sanitär & Bad", details: "5 m² · Teilweise (Dusche)", zeit: "So schnell wie möglich", rolle: "Im Eigentum", von: 4500, bis: 7500, fotos: 4, status: "zugewiesen", partner: BETRIEB, eingang: "heute 08:05", seit: "vor 2 Std.",
      ki: "Dusche undicht, Fliesen alt. Schneller Start gewünscht." },
    { id: "v4", name: "Sandra Weiß", ort: "Nürnberg", vorhaben: "Elektro", gewerk: "Elektro", details: "Wallbox fürs E-Auto", zeit: "In den nächsten 3 Monaten", rolle: "Im Eigentum", von: 1200, bis: 2800, fotos: 1, status: "zugewiesen", partner: "Elektro Wagner", eingang: "heute 07:30", seit: "vor 3 Std.", ki: "Wallbox in Garage, Hausanschluss prüfen." },
    { id: "v5", name: "Thomas Becker", ort: "Erlangen", vorhaben: "Fenster, Türen & Tore", gewerk: "Fenster, Türen & Tore", details: "8 Stück · Kunststoff", zeit: "In den nächsten 3 Monaten", rolle: "Im Eigentum", von: 7000, bis: 11000, fotos: 2, status: "besichtigung", partner: "Fensterbau Huber", eingang: "vor 3 Tagen", richtpreis: 9200, hinweis: "Richtpreis 9.200 € bestätigt · Aufmaß am Donnerstag" },
    { id: "v6", name: "Familie Arslan", ort: "Herzogenaurach", vorhaben: "Maler & Fassade", gewerk: "Maler & Fassade", details: "Streichen · 95 m²", zeit: "So schnell wie möglich", rolle: "Mietpartei", von: 2100, bis: 3800, fotos: 0, status: "angebot", partner: "Malerbetrieb Kraus", eingang: "vor 6 Tagen", angebot: 3900 },
    { id: "v7", name: "Peter Graf", ort: "Fürth", vorhaben: "Sanitär & Bad", gewerk: "Sanitär & Bad", details: "6 m² · Teilweise", zeit: "In den nächsten 3 Monaten", rolle: "Im Eigentum", von: 5500, bis: 9000, fotos: 3, status: "auftrag", partner: "Fliesen Yilmaz", eingang: "vor 19 Tagen", auftrag: 7800, bezahlt: true, typ: 7250 },
    { id: "v8", name: "Tanja Vogel", ort: "Baiersdorf", vorhaben: "Dach & Spengler", gewerk: "Dach & Spengler", details: "Reparatur (undicht)", zeit: "So schnell wie möglich", rolle: "Im Eigentum", von: 400, bis: 3500, fotos: 2, status: "auftrag", partner: "Dachdeckerei Lang", eingang: "vor 12 Tagen", auftrag: 2400, typ: 1950 },
    { id: "v9", name: "Lisa König", ort: "Erlangen", vorhaben: "Sanitär & Bad", gewerk: "Sanitär & Bad", details: "Wasserhahn tropft", zeit: "So schnell wie möglich", rolle: "Mietpartei", von: 120, bis: 800, fotos: 1, status: "auftrag", partner: BETRIEB, eingang: "vor 9 Tagen", auftrag: 180 },
    { id: "v10", name: "Markus Ott", ort: "Schwabach", vorhaben: "Heizung, Wärmepumpe & Klima", gewerk: "Heizung, Wärmepumpe & Klima", details: "Neue Gas-Brennwertheizung · 120 m²", zeit: "Später / noch in Planung", rolle: "Im Eigentum", von: 9500, bis: 14000, fotos: 0, status: "verloren", partner: "Bad & Wärme Schmitt", eingang: "vor 25 Tagen", hinweis: "Kunde hat sich für später entschieden" }
  ];
  var VM_POOL = [
    { name: "Daniela Fuchs", ort: "Erlangen", vorhaben: "Boden & Parkett", gewerk: "Boden & Parkett", details: "Vinyl verlegen · 70 m²", zeit: "In den nächsten 3 Monaten", rolle: "Im Eigentum", von: 3850, bis: 7700, fotos: 2, ki: "Vinyl in Wohnung, Möbel werden selbst geräumt.", note: "A", budget: "Ja, das passt" },
    { name: "Hausverwaltung Lang", ort: "Erlangen", vorhaben: "Sanitär & Bad", gewerk: "Sanitär & Bad", details: "6 m² · Komplett neu", zeit: "So schnell wie möglich", rolle: "Hausverwaltung", von: 11500, bis: 17500, fotos: 4, ki: "Mieterwechsel, fester Termin, Hausverwaltung – mögliche Folgeaufträge.", note: "A", budget: "Ja, das passt" },
    { name: "Uwe Schreiber", ort: "Fürth", vorhaben: "Elektro", gewerk: "Elektro", details: "Kleinauftrag (Steckdosen, Lampen)", zeit: "So schnell wie möglich", rolle: "Mietpartei", von: 150, bis: 700, fotos: 0, ki: "Kleinauftrag, vermutlich unter 500 € – provisionsfrei.", note: "B", gruende: ["nur E-Mail angegeben"], budget: "Ja, das passt" }
  ];
  var VM_ST = { neu: ["neu – zuweisen", "check", 1], zugewiesen: ["wartet auf Annahme", "check", 2], angenommen: ["angenommen – Richtpreis folgt", "ok", 3], richtpreis: ["Richtpreis – Kunde prüft", "check", 4],
    besichtigung: ["Richtpreis bestätigt – Besichtigung", "ok", 5], angebot: ["Angebot beim Kunden", "ok", 5], auftrag: ["Auftrag erteilt", "ok", 6], verloren: ["kein Auftrag", "no", 6] };
  var VM_SCHRITTE = ["Anfrage", "Zuweisung", "Annahme", "Richtpreis", "Angebot", "Auftrag"];
  var NOTE = { A: ["A · sofort vermitteln", "ok"], B: ["B · kurz nachfragen", "check"], C: ["C · nicht vermitteln", "no"] };
  var typVon = function (v) { return v.typ || Math.round((v.von + v.bis) / 2 / 100) * 100; };
  function provision(w) { if (!w || w < 500) return 0; return Math.max(75, Math.round(w / 1.19 * 0.05)); }
  function vorschlaege(v) {
    var passend = PARTNER.map(function (p, i) { return { p: p, i: i, score: p.bew * 10 + p.annahme / 10 + Math.min(p.zuletzt, 14) - (/ab KW/.test(p.kap) ? 3 : 0) }; })
      .filter(function (x) { return x.p.gewerk.indexOf(v.gewerk) > -1; });
    var vgl = v.wunsch && v.wunsch.length > 1;
    var frei = passend.filter(function (x) { return !x.p.voll && typVon(v) >= (x.p.min || 0) && !(vgl && (x.p.vgl === "nein" || (x.p.vgl === "ab5000" && typVon(v) < 5000))); });
    if (v.wunsch && v.wunsch.length) frei.forEach(function (x) { if (v.wunsch.indexOf(x.p.name) > -1) x.score += 100; });   // vom Kunden gewählte Betriebe zuerst
    var liste = frei.sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    liste.ausgeblendet = passend.length - frei.length;
    return liste;
  }
  function portalLaden() {
    var neu = [];
    try { neu = JSON.parse(localStorage.getItem("portal-anfragen") || "[]"); } catch (e) { neu = []; }
    var n = 0;
    neu.forEach(function (a) {
      if (state.vm.some(function (v) { return v.id === "p" + a.id; })) return;
      state.vm.unshift({ id: "p" + a.id, name: a.name, ort: a.ort, vorhaben: a.vorhaben, gewerk: a.gewerk, details: a.details, zeit: a.zeit, rolle: a.rolle, von: a.von, bis: a.bis, fotos: a.fotos, status: "neu",
        eingang: "gerade eben", ausPortal: true, konfig: a.konfig || null, wunsch: a.betriebe || null, vergleich: a.vergleich || 1, text: a.text, note: a.note || "A", gruende: a.gruende || [], budget: a.budget, typ: a.typ, ki: "Aus Ihrem Portal: " + a.vorhaben + ", " + a.details + ". " + (a.fotos ? a.fotos + " Fotos. " : "") + "Start: " + a.zeit + "." });
      n++;
    });
    return n;
  }
  /* Was der Betrieb im Cockpit macht, landet beim Betreiber (und umgekehrt) */
  function syncVermittlung() {
    state.vm.forEach(function (v) {
      var l = state.leads.filter(function (x) { return x.vmId === v.id; })[0];
      if (v.status === "zugewiesen" && v.partner === BETRIEB && !l && !v.abgelehnt) {
        l = { id: 900 + state.vm.indexOf(v), vmId: v.id, name: v.name, ort: v.ort, kanal: "portal", betreff: v.vorhaben + " – " + v.details, wert: Math.round((v.von + v.bis) / 2), stage: "neu", tage: 0, vermittelt: true,
          tel: "0151 000 09" + (10 + state.vm.indexOf(v)), mail: "kunde@beispiel.de", nachricht: "(Über das Auftragsportal) " + v.vorhaben + ": " + v.details + ". Start: " + v.zeit + ". " + (v.text || ""),
          ki: "passt", kiText: v.ki || "Vermittelte Anfrage aus dem Auftragsportal.", kiRec: (v.wunsch && v.wunsch.length > 1 ? "Der Kunde vergleicht mit " + (v.wunsch.length - 1) + (v.wunsch.length === 2 ? " weiterem Betrieb" : " weiteren Betrieben") + ". Tipp: zuerst Richtpreis per Foto, Besichtigung erst wenn er passt. " : "Der Kunde hat nur Sie angefragt. ") + "Bitte innerhalb von 24 Stunden annehmen oder ablehnen." };
        l.verlauf = [{ t: 0, text: "Über das Auftragsportal vermittelt" }];
        if (v.konfig && GW.PRODUKTE[v.konfig.pid]) { var KP = GW.PRODUKTE[v.konfig.pid], kc = Object.assign(KP.start(), v.konfig.cfg || {}); state.konfigs = state.konfigs || [];
          state.konfigs.unshift({ id: "k" + v.id, pid: KP.id, name: KP.name, kunde: v.name, cfg: kc, mass: KP.mass(kc), netto: rechne(KP.preis(kc)).netto, svg: KP.zeichnung(kc), foto: null, datum: datumDE(heuteISO()), von: v.name, wunsch: true });
          l.verlauf.push({ t: 0, text: "Kunde hat im Portal konfiguriert: " + KP.name + " (" + KP.mass(kc) + ")" }); }
        state.leads.unshift(l);
      }
      if (!l) return;
      if (l.stage === "angebot" && ["zugewiesen", "angenommen", "richtpreis", "besichtigung"].indexOf(v.status) > -1) { v.status = "angebot"; v.angebot = l.wert; }
      if ((l.stage === "auftrag" || l.stage === "erledigt") && v.status !== "auftrag") { v.status = "auftrag"; v.auftrag = l.wert; protokoll("Vermittlung " + v.name + ": Auftrag über " + euro.format(l.wert) + " erteilt – Provision " + euro.format(provision(l.wert))); }
    });
  }
  function vmZeile(v) {
    var st = VM_ST[v.status], schritt = st[2];
    var punkte = VM_SCHRITTE.map(function (_, i) { var cls = v.status === "verloren" && i === 5 ? "pause" : i < schritt - 1 || (v.status === "auftrag" && i <= 5) ? "done" : i === schritt - 1 ? (st[1] === "check" ? "wait" : "now") : ""; return '<i class="' + cls + '"></i>'; }).join("");
    var info = v.status === "zugewiesen" ? "an " + v.partner + " · " + (v.seit || "gerade eben") + " · Frist 24 Std." :
      v.status === "angenommen" ? v.partner + (v.hinweis ? " · " + v.hinweis : " · meldet sich beim Kunden") :
      v.status === "richtpreis" ? v.partner + " · Richtpreis " + euro.format(v.richtpreis || 0) + " · Kunde prüft" :
      v.status === "besichtigung" ? v.partner + " · " + (v.hinweis || "Richtpreis " + euro.format(v.richtpreis || 0) + " bestätigt") :
      v.status === "angebot" ? v.partner + " · Angebot " + euro.format(v.angebot || 0) :
      v.status === "auftrag" ? v.partner + " · Auftrag " + euro.format(v.auftrag || 0) + " · Provision " + (provision(v.auftrag) ? euro.format(provision(v.auftrag)) : "frei (unter 500 €)") :
      v.status === "verloren" ? (v.partner || "") + " · " + (v.hinweis || "kein Auftrag") : "";
    var knopf = v.status === "zugewiesen" ? '<button class="btn-mini" type="button" data-vm-erinnern="' + v.id + '">Erinnern</button><button class="btn-mini" type="button" data-vm-neu="' + v.id + '">Anderem Betrieb geben</button>' :
      v.status === "angebot" ? '<button class="btn-mini" type="button" data-vm-auftrag="' + v.id + '">Auftrag melden (Demo)</button>' : "";
    return '<div class="run"><div class="run-main"><strong>' + esc(v.name) + ' · <span data-nt>' + esc(v.vorhaben) + "</span></strong><small>" + esc(v.ort) + " · " + esc(v.details) + "</small></div>" +
      '<span class="run-steps">' + punkte + '</span><span class="run-hint"><span class="pill ' + st[1] + '">' + st[0] + "</span><small>" + esc(info) + "</small></span>" + (knopf ? '<span class="run-btns">' + knopf + "</span>" : "<span></span>") + "</div>";
  }
  function viewVermittlung() {
    var neuAusPortal = portalLaden();
    if (neuAusPortal) setTimeout(function () { toast(neuAusPortal === 1 ? "1 neue Anfrage aus Ihrem Portal ist eingegangen." : neuAusPortal + " neue Anfragen aus Ihrem Portal sind eingegangen."); });
    var neuAlle = state.vm.filter(function (v) { return v.status === "neu"; });
    var neu = neuAlle.filter(function (v) { return v.note !== "C"; }), cListe = neuAlle.filter(function (v) { return v.note === "C"; });
    var vergleich = state.vm.filter(function (v) { return v.status === "auftrag" && v.auftrag >= 1000; });
    var laufend = state.vm.filter(function (v) { return v.status !== "neu"; });
    var auftraege = state.vm.filter(function (v) { return v.status === "auftrag"; });
    var vermittelt = state.vm.filter(function (v) { return v.status !== "neu" && v.status !== "zugewiesen"; });
    var provSumme = auftraege.reduce(function (s2, v) { return s2 + provision(v.auftrag); }, 0);
    var provOffen = auftraege.filter(function (v) { return !v.bezahlt; }).reduce(function (s2, v) { return s2 + provision(v.auftrag); }, 0);
    var abgeschlossen = state.vm.filter(function (v) { return v.status === "auftrag" || v.status === "verloren"; });
    $main.innerHTML = head("Vermittlung", "Ihr Auftragsportal: Endkunden fragen an, Sie geben jede Anfrage an einen passenden Betrieb aus Ihrem Netzwerk. Provision nur bei Auftrag.",
        "Zusatztool · Endkunden-Anfragen ab ca. 10 Partnerbetrieben, Hausverwaltungen ab Start · 5 % vom Nettoauftragswert, mindestens 75 €, unter 500 € provisionsfrei · kein Monatsbeitrag, keine Kosten pro Anfrage") +
      '<div class="view-actions" style="margin:-6px 0 14px"><a class="btn btn-outline" href="anfrage.html" target="_blank" rel="noopener">Portal für Endkunden ansehen</a><button class="btn btn-signal" type="button" data-vm-sim>+ Portal-Anfrage simulieren</button></div>' +
      '<div class="kpis">' + kpi("Anfragen im Oktober", String(state.vm.length), neu.length + " zuweisen · " + cListe.length + " nicht vermittelt") +
        kpi("Auftragsquote", abgeschlossen.length ? Math.round(auftraege.length / abgeschlossen.length * 100) + " %" : "–", auftraege.length + " Aufträge aus " + abgeschlossen.length + " abgeschlossenen") +
        kpi("Provision Oktober", euro.format(provSumme), "davon offen " + euro.format(provOffen)) + kpi("Partnerbetriebe", String(PARTNER.length), "nur Cockpit-Kunden") + "</div>" +
      '<section class="panel vm-neu" id="vm-neu"><h2>Neu – bitte zuweisen (' + neu.length + ")</h2>" + (neu.length ? neu.map(function (v) {
        return '<article class="vm-karte"><div class="vm-kopf"><div><strong>' + esc(v.name) + ' · <span data-nt>' + esc(v.vorhaben) + "</span></strong><small>" + esc(v.ort) + " · " + esc(v.details) + " · " + esc(v.zeit) + " · " + esc(v.rolle) + " · " + v.eingang + "</small></div>" +
          '<span class="vm-preis">typ. ' + euro.format(typVon(v)) + "</span></div>" +
          '<div class="vm-note"><span class="pill ' + NOTE[v.note || "A"][1] + '">' + NOTE[v.note || "A"][0] + "</span>" + (v.budget ? '<span class="pill">Budget bis ' + euro.format(v.bis) + ": " + esc(v.budget) + "</span>" : "") +
            (v.gruende || []).map(function (g) { return '<small>' + esc(g) + "</small>"; }).join("") +
            (v.note === "B" ? '<button class="btn-mini" type="button" data-vm-geklaert="' + v.id + '">Kurz angerufen – passt</button>' : "") + "</div>" +
          '<p class="vm-ki">' + svg(ICON.spark) + esc(v.ki || "") + (v.ausPortal ? ' <span class="pill ok">aus Ihrem Portal</span>' : "") + "</p>" +
          (v.konfig ? '<p class="vm-wunsch" data-nt><b>Selbst konfiguriert:</b> ' + esc(v.konfig.name) + " · " + esc(v.konfig.mass || "") + "</p>" : "") +
          (v.wunsch && v.wunsch.length ? '<p class="vm-wunsch" data-nt><b>Vom Kunden gewählt:</b> ' + v.wunsch.map(esc).join(", ") + (v.wunsch.length > 1 ? ' <span class="pill check">Vergleich – ' + v.wunsch.length + " Betriebe</span>" : ' <span class="pill ok">nur dieser Betrieb</span>') + "</p>" : "") +
          '<div class="vm-vorschlag"><span class="sec-title">Passende Betriebe</span>' + vorschlaege(v).map(function (x, k) {
            return '<div class="vm-partner"><div><b>' + esc(x.p.name) + (k === 0 ? ' <span class="pill ok">Empfehlung</span>' : "") + "</b><small>★ " + String(x.p.bew).replace(".", ",") + " · nimmt " + x.p.annahme + " % an · " + esc(x.p.kap) + " · letzte Vermittlung vor " + x.p.zuletzt + " Tagen</small></div>" +
              '<button class="btn-mini' + (k === 0 ? " primary" : "") + '" type="button" data-vm-zuweisen="' + v.id + "|" + x.i + '">Zuweisen</button></div>'; }).join("") +
            (function () { var a = vorschlaege(v).ausgeblendet; return a ? '<small class="vm-aus">' + a + (a === 1 ? " Betrieb" : " Betriebe") + " ausgeblendet: Mindestauftragswert, gerade voll oder keine Vergleichsanfragen</small>" : ""; })() + "</div></article>";
      }).join("") : '<p class="col-empty">Alle Anfragen sind zugewiesen.</p>') +
      (cListe.length ? '<details class="vm-c"><summary>Nicht vermittelt – Note C (' + cListe.length + ")</summary>" + cListe.map(function (v) {
        return '<div class="vm-partner"><div><b>' + esc(v.name) + " · " + esc(v.vorhaben) + "</b><small>" + esc((v.gruende || []).join(" · ")) + "</small></div>" +
          '<span class="run-btns">' + (v.nachfrage ? '<span class="pill ok">Nachfrage geplant</span>' : '<button class="btn-mini" type="button" data-vm-spaeter="' + v.id + '">In 3 Monaten nachfragen</button>') +
          '<button class="btn-mini" type="button" data-vm-doch="' + v.id + '">Doch vermitteln</button></span></div>'; }).join("") +
        '<p class="src">Diese Anfragen bekommen keine Betriebe – so fährt niemand umsonst raus. Der Kunde erhält Tipps (z. B. einfachere Ausstattung, Förderung) und eine Nachfrage später.</p></details>' : "") + "</section>" +
      '<div class="flow-layout"><div class="panel-grid">' +
        '<section class="panel" id="vm-laufend"><h2>Laufende und abgeschlossene Vermittlungen</h2><div class="flow-runs">' + laufend.map(vmZeile).join("") + "</div></section>" +
        '<section class="panel" id="vm-prov"><h2>Provisionen</h2><div class="rows">' + auftraege.map(function (v) {
          var pr = provision(v.auftrag);
          return '<div class="row"><div class="row-main"><strong>' + esc(v.partner) + " · " + esc(v.name) + "</strong><small>" + esc(v.vorhaben) + " · Auftrag " + euro.format(v.auftrag) + " brutto</small></div>" +
            '<div class="row-side"><span class="pill ' + (pr ? (v.bezahlt ? "ok" : "check") : "") + '">' + (pr ? (v.bezahlt ? "bezahlt" : "fällig") : "provisionsfrei") + '</span><span class="amount">' + euro.format(pr) + "</span></div></div>";
        }).join("") + '</div><p class="src">Fällig mit der Auftragserteilung, nicht erst nach Fertigstellung. Der Endkunde bestätigt im Portal, ob er beauftragt hat – so geht keine Provision verloren. <button class="btn-mini" type="button" data-toast="Monatsabrechnung für alle Partnerbetriebe erstellt und als PDF verschickt (Demo).">Monatsabrechnung erstellen</button></p></section>' +
        '<section class="panel" id="vm-preise"><h2>Stimmen die Preise im Portal?</h2><div class="rows">' + vergleich.map(function (v) {
          var t = typVon(v), d = Math.round((v.auftrag - t) / t * 100);
          return '<div class="row"><div class="row-main"><strong>' + esc(v.vorhaben) + " · " + esc(v.name) + "</strong><small>Portal typisch " + euro.format(t) + " · Auftrag " + euro.format(v.auftrag) + '</small></div><div class="row-side"><span class="pill ' + (Math.abs(d) <= 15 ? "ok" : "check") + '">' + (d >= 0 ? "+" : "") + d + " %</span></div></div>"; }).join("") +
        '</div><p class="src">Bisher 14 Aufträge ausgewertet: im Schnitt <b>+6 %</b> über dem typischen Portal-Preis. Die Werte im Portal werden jeden Monat mit den echten Auftragswerten je Gewerk und Region nachgezogen – so stimmen die Preise immer besser.</p></section>' +
      "</div>" +
      '<aside class="panel flow-log" id="vm-partner"><h2>Partnerbetriebe</h2><div class="vm-plist">' + PARTNER.map(function (p) {
        var anz = state.vm.filter(function (v) { return v.partner === p.name; }).length, auf = state.vm.filter(function (v) { return v.partner === p.name && v.status === "auftrag"; }).length;
        return '<div class="vm-p"><b>' + esc(p.name) + "</b><small data-nt>" + esc(p.gewerk.filter(function (g) { return g !== "nach Beschreibung"; }).join(", ") || "Kleinaufträge") + " · " + esc(p.gebiet) + "</small><small>★ " + String(p.bew).replace(".", ",") + " · Annahme " + p.annahme + " % · " + anz + " vermittelt, " + auf + " Aufträge</small>" +
          ((p.min || p.voll) ? '<small class="vm-filter">' + (p.voll ? "gerade voll – bekommt nichts" : "nur ab " + euro.format(p.min)) + "</small>" : "") + "</div>";
      }).join("") + '</div><p class="src"><b>Verteilregeln:</b> Gewerk und Gebiet müssen passen. Bei Gleichstand reihum. Wer schnell annimmt und gut bewertet wird, kommt öfter dran. Keine Garantie auf eine Anzahl Aufträge.</p></aside></div>';
  }

  /* =====================================================================
     13. DOKUMENTE & UNTERSCHRIFTEN: alles Wichtige an einem Ort
     Digital unterschrieben (Handy, Tablet, Kundenportal) oder vom Papier
     eingescannt. Fehlende Unterschriften stehen oben.
     ===================================================================== */
  var ART = { angebot: "Angebot", auftrag: "Auftrag", regie: "Regiebericht", protokoll: "Protokoll", rechnung: "Rechnung", vertrag: "Vertrag", aufmass: "Aufmaß" };
  var AUFTRAG_SIG = {
    "Familie Brandl": { st: "unterschrieben", wie: "im Kundenportal", t: 22 },
    "Martin Reiter": { st: "papier", wie: "auf Papier, eingescannt von Sabine (Büro)", t: 10 },
    "Claudia Fischer": { st: "unterschrieben", wie: "vor Ort auf dem Handy von Stefan (Außendienst)", t: 20 },
    "Familie Obermeier": { st: "unterschrieben", wie: "vor Ort auf dem Tablet von Stefan (Außendienst)", t: 58 }
  };
  var DOK_FEST = [
    { art: "protokoll", titel: "Abnahmeprotokoll", kunde: "Familie Obermeier", st: "unterschrieben", wie: "vor Ort auf dem Handy von Alex", t: 45 },
    { art: "protokoll", titel: "Abnahmeprotokoll", kunde: "Wohnbau Fürth, Whg. 4", st: "wartet", sub: "Abnahme morgen 15:30 mit der Hausverwaltung", t: -1, montage: true },
    { art: "vertrag", titel: "Rahmenvertrag Wartung, 6 Gasthermen", kunde: "Hausverwaltung Kaya", st: "unterschrieben", wie: "im Kundenportal", t: 90 },
    { art: "vertrag", titel: "Wartungsvertrag Ölheizung", kunde: "Anton Wagner", st: "unterschrieben", wie: "vor Ort auf dem Handy von Robin", t: 300 },
    { art: "vertrag", titel: "Wartungsvertrag Gasheizung", kunde: "Georg Hofbauer", st: "papier", wie: "auf Papier, eingescannt von Sabine (Büro)", t: 420 },
    { art: "aufmass", titel: "Aufmaß Heizraum", kunde: "Familie Brandl", st: "ohne", wie: "erstellt von Stefan (Außendienst)", t: 28, sub: "Heizraum · Boden 4,32 m² · Abgasweg 6,5 m",
      am: { verschnitt: 0, notiz: "Abgasweg 6,5 m bis Schornstein, Kondensatablauf vorhanden, Stromanschluss 230 V an der Wand links.", raeume: [{ name: "Heizraum", l: 2.4, b: 1.8, h: 2.2, ab: [{ art: "Tür", b: 0.8, h: 2.0 }, { art: "Fenster", b: 0.6, h: 0.5 }] }] } },
    { art: "aufmass", titel: "Aufmaß Wohnung 4", kunde: "Wohnbau Fürth, Whg. 4", st: "ohne", wie: "erstellt von Alex", t: 12, sub: "Wohnzimmer, Flur · Boden 31,04 m²",
      am: { verschnitt: 8, notiz: "Malerarbeiten nach Mieterwechsel, Untergrund geprüft, keine Feuchtigkeit.", raeume: [{ name: "Wohnzimmer", l: 5.2, b: 4.1, h: 2.5, ab: [{ art: "Tür", b: 0.9, h: 2.0 }, { art: "Fenster", b: 1.8, h: 1.4 }, { art: "Fenster", b: 1.0, h: 1.4 }] }, { name: "Flur", l: 4.6, b: 2.1, h: 2.5, ab: [{ art: "Tür", b: 0.9, h: 2.0 }, { art: "Tür", b: 0.8, h: 2.0 }, { art: "Tür", b: 0.8, h: 2.0 }] }] } }
  ];
  var tageText = function (t) { return t < 0 ? "geplant" : t > 365 ? "vor über einem Jahr" : t >= 60 ? "vor " + Math.round(t / 30) + " Monaten" : vorTagen(t); };

  function dokumenteAlle() {
    var d = [], nr = function (l) { return "AN-2026-0" + (80 + l.id); };
    state.leads.forEach(function (l) {
      if (l.stage === "angebot") d.push({ id: "an-" + l.id, art: "angebot", titel: "Angebot " + nr(l), kunde: l.name, sub: l.betreff + " · " + euro.format(l.wert) + " · gesendet " + vorTagen(l.angebotVor), st: "wartet", t: l.angebotVor, lead: l.id, betrag: l.wert, betreff: l.betreff });
      if (l.stage === "auftrag" || l.stage === "erledigt") {
        var sig = state.signiert[l.id] || AUFTRAG_SIG[l.name] || { st: "unterschrieben", wie: "im Kundenportal", t: Math.max(l.tage - 8, 0) };
        d.push({ id: "au-" + l.id, art: "auftrag", titel: "Auftrag " + nr(l).replace("AN", "AU"), kunde: l.name, sub: l.betreff + " · " + euro.format(l.wert), st: sig.st, wie: sig.wie, t: sig.t || 0, lead: l.id, sig: sig.bild, src: sig.src, widerruf: sig.widerruf, sofort: sig.sofort, zeit: sig.zeit, betrag: l.wert, betreff: l.betreff });
      }
    });
    mt.berichte.forEach(function (b) {
      var fo = b.nr.indexOf("FO") === 0;
      d.push({ id: "rb-" + b.nr, art: fo ? "protokoll" : "regie", titel: (fo ? "" : "Regiebericht ") + b.nr + (fo ? " · " + b.baustelle : ""), kunde: fo ? "Familie Brandl" : b.baustelle.split(",")[0],
        sub: (b.stunden != null ? String(b.stunden).replace(".", ",") + " Std. · " : "") + b.material, st: "unterschrieben", wie: "vor Ort auf dem Handy von " + b.monteur.split(",")[0], t: wannZuT(b.datum), sig: b.sig });
    });
    var sAm = summen();
    d.push({ id: "am-live", art: "aufmass", titel: "Aufmaß " + am.raeume.map(function (r) { return r.name; }).join(", "), kunde: am.kunde, st: "ohne", wie: "erstellt von Alex und Stefan (Außendienst)", t: 0,
      sub: am.raeume.length + (am.raeume.length === 1 ? " Raum" : " Räume") + " · Boden " + zahl(sAm.boden) + " m² · Wände " + zahl(sAm.wand) + " m²", am: am, live: true });
    DOK_FEST.forEach(function (x, i) { d.push(Object.assign({ id: "fx-" + i }, x)); });
    if (state.rolle !== "aussen") mod.rechnungen.forEach(function (r) {
      d.push({ id: "re-" + r.nr, art: "rechnung", titel: "Rechnung " + r.nr, kunde: r.name, sub: euro.format(r.betrag) + " · " + (r.status === "bezahlt" ? "bezahlt" : "gesendet"), st: "ohne", wie: "aus dem Rechnungsprogramm", t: Math.max(1, (r.faellig || 0) + 14) });
    });
    state.papier.forEach(function (x, i) { d.push(Object.assign({ id: "pa-" + i, st: "papier", t: 0, wie: "auf Papier, eingescannt von " + ichName() }, x)); });
    return d.sort(function (a, b) { return (a.st === "wartet" ? -1000 : 0) + a.t - ((b.st === "wartet" ? -1000 : 0) + b.t); });
  }
  var DST = { unterschrieben: ["unterschrieben", "ok"], papier: ["Papier · eingescannt", ""], wartet: ["wartet auf Unterschrift", "check"], ohne: ["ohne Unterschrift", ""] };
  function dokZeile(x) {
    var knopf = '<button class="btn-mini" type="button" data-dok="' + x.id + '">Ansehen</button>';
    if (x.st === "wartet" && x.lead) knopf = '<button class="btn-mini primary" type="button" data-vorort="' + x.lead + '">' + svg(ICON.pen) + "Vor Ort unterschreiben</button>" +
      '<button class="btn-mini" type="button" data-dok-link="' + esc(x.kunde) + '">Link zum Unterschreiben senden</button>';
    if (x.st === "wartet" && x.montage) knopf = '<span class="pill">wird in der Montage-App unterschrieben</span>';
    return '<div class="row dok"><div class="row-main"><strong><span class="dok-ic">' + svg(x.st === "papier" ? ICON.camera : ICON.doc) + "</span>" + esc(x.titel) + " · " + esc(x.kunde) + "</strong>" +
      "<small>" + esc(x.sub || ART[x.art]) + (x.st !== "wartet" ? "<br>" + esc((x.st === "ohne" ? "" : "Unterschrieben ") + (x.wie || "")) + " · " + tageText(x.t) : "") + "</small></div>" +
      '<div class="row-side"><span class="pill ' + DST[x.st][1] + '">' + DST[x.st][0] + "</span>" + knopf + "</div></div>";
  }
  function papierKnopf(kunde) {
    return '<label class="btn btn-outline papier-up">' + svg(ICON.camera) + 'Papier-Dokument hinzufügen<input type="file" accept="image/*,application/pdf" capture="environment" data-papier-up="' + esc(kunde || "") + '" hidden></label>';
  }

  function viewDokumente() {
    var alle = dokumenteAlle(), q = (state.suche || "").toLowerCase();
    var wartet = alle.filter(function (x) { return x.st === "wartet"; });
    var FIL = [["alle", "Alle"], ["auftrag", "Angebote & Aufträge"], ["regie", "Regie & Protokolle"], ["vertrag", "Verträge"], ["rechnung", "Rechnungen"], ["aufmass", "Aufmaße"]]
      .filter(function (f) { return !(state.rolle === "aussen" && f[0] === "rechnung"); });
    var gruppe = { auftrag: ["angebot", "auftrag"], regie: ["regie", "protokoll"], vertrag: ["vertrag"], rechnung: ["rechnung"], aufmass: ["aufmass"] }[state.dokFilter];
    var liste = alle.filter(function (x) {
      return (!gruppe || gruppe.indexOf(x.art) > -1) && (state.dokStatus === "alle" ? x.st !== "wartet" : x.st === state.dokStatus) && (!q || (x.titel + " " + x.kunde).toLowerCase().indexOf(q) > -1);
    });
    var anz = function (st) { return alle.filter(function (x) { return x.st === st; }).length; };
    $main.innerHTML = head("Dokumente", "Alle Unterschriften und Dokumente Ihrer Firma an einem Ort – digital unterschrieben oder vom Papier eingescannt. Jedes Dokument liegt auch in der Kundenakte.") +
      (wartet.length ? '<section class="panel dok-fehlt" id="dok-fehlt"><h2>' + svg(ICON.pen) + "Es fehlen noch " + wartet.length + (wartet.length === 1 ? " Unterschrift" : " Unterschriften") + '</h2><div class="rows">' + wartet.map(dokZeile).join("") + "</div></section>" : "") +
      '<div class="kpis">' + kpi("Dokumente", String(alle.length), "alles an einem Ort") + kpi("Digital unterschrieben", String(anz("unterschrieben")), "Handy, Tablet, Portal") +
        kpi("Papier eingescannt", String(anz("papier")), "trotzdem digital da") + kpi("Fehlende Unterschriften", String(wartet.length), wartet.length ? "siehe oben" : "alles komplett") + "</div>" +
      '<div class="toolbar"><input class="search" id="dsuche" type="search" placeholder="Dokument oder Kunde suchen …" aria-label="Dokumente durchsuchen" value="' + esc(state.suche || "") + '">' + papierKnopf("") + "</div>" +
      '<div class="filter" role="group" aria-label="Nach Art filtern" style="margin-bottom:8px">' + FIL.map(function (f) { return '<button type="button" data-dfilter="' + f[0] + '" aria-pressed="' + (state.dokFilter === f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      '<div class="filter" role="group" aria-label="Nach Status filtern" style="margin-bottom:14px">' + [["alle", "Jeder Status"], ["unterschrieben", "Digital unterschrieben"], ["papier", "Papier"], ["wartet", "Fehlt noch"]].map(function (f) {
        return '<button type="button" data-dstatus="' + f[0] + '" aria-pressed="' + (state.dokStatus === f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      '<div class="rows" id="dok-liste">' + (liste.length ? liste.map(dokZeile).join("") : '<p class="col-empty">Keine Dokumente für diese Auswahl.</p>') + "</div>";
    var inp = document.getElementById("dsuche");
    inp.addEventListener("input", function () { state.suche = inp.value; var pos = inp.selectionStart; viewDokumente(); var a = document.getElementById("dsuche"); a.focus(); a.setSelectionRange(pos, pos); });
  }

  /* Aufmaß zum Ansehen: Räume, Maße, Abzüge, Flächen, Material, Skizze */
  function raumSkizze(r) {
    var W = 150, H = 110, sc = Math.min((W - 30) / Math.max(r.l, 0.1), (H - 30) / Math.max(r.b, 0.1));
    var w = r.l * sc, h = r.b * sc, x = (W - w) / 2, y = (H - h) / 2 - 2;
    var tueren = (r.ab || []).filter(function (a) { return a.art === "Tür"; }), fenster = (r.ab || []).filter(function (a) { return a.art === "Fenster"; });
    var marks = tueren.map(function (a, i) { var tw = Math.min(a.b * sc, w / 2), tx = x + 8 + i * (tw + 6); return '<line x1="' + tx + '" y1="' + (y + h) + '" x2="' + (tx + tw) + '" y2="' + (y + h) + '" class="sk-tuer"/><path d="M' + tx + " " + (y + h) + " A" + tw + " " + tw + " 0 0 1 " + (tx + tw) + " " + (y + h - tw) + '" class="sk-bogen"/>'; }).join("") +
      fenster.map(function (a, i) { var fw = Math.min(a.b * sc, w / 2), fx = x + w - 8 - fw - i * (fw + 6); return '<line x1="' + fx + '" y1="' + y + '" x2="' + (fx + fw) + '" y2="' + y + '" class="sk-fenster"/>'; }).join("");
    return '<svg class="skizze" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Skizze ' + esc(r.name) + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" class="sk-raum"/>' + marks +
      '<text x="' + (W / 2) + '" y="' + (y - 4) + '" text-anchor="middle">' + zahl(r.l) + ' m</text><text x="' + (x - 4) + '" y="' + (y + h / 2) + '" text-anchor="end" dominant-baseline="middle">' + zahl(r.b) + "</text></svg>";
  }
  function aufmassHtml(a) {
    var tot = { boden: 0, wand: 0, decke: 0, sockel: 0 };
    var raeume = a.raeume.map(function (r) {
      var f = flaechen(r); tot.boden += f.boden; tot.wand += f.wand; tot.decke += f.decke; tot.sockel += f.sockel;
      return '<div class="am-blatt-raum">' + raumSkizze(r) + '<div><b>' + esc(r.name) + "</b><small>" + zahl(r.l) + " × " + zahl(r.b) + " m, Höhe " + zahl(r.h) + " m</small>" +
        ((r.ab || []).length ? "<small>Abzüge: " + r.ab.map(function (x) { return x.art + " " + zahl(x.b) + " × " + zahl(x.h); }).join(", ") + " = " + zahl(f.abz) + " m²</small>" : "") +
        '<table class="dok-tab"><tr><td>Boden</td><td>' + zahl(f.boden) + " m²</td></tr><tr><td>Wände (abzgl. Öffnungen)</td><td>" + zahl(f.wand) + " m²</td></tr><tr><td>Decke</td><td>" + zahl(f.decke) + " m²</td></tr><tr><td>Sockel</td><td>" + zahl(f.sockel) + " m</td></tr></table></div></div>";
    }).join("");
    var v = 1 + (a.verschnitt || 0) / 100;
    return raeume + '<table class="dok-tab am-summe"><tr class="sum"><td>Gesamt Boden</td><td>' + zahl(tot.boden) + " m²</td></tr><tr class=\"sum\"><td>Gesamt Wände</td><td>" + zahl(tot.wand) + ' m²</td></tr><tr><td>Gesamt Decke</td><td>' + zahl(tot.decke) + " m²</td></tr><tr><td>Gesamt Sockel</td><td>" + zahl(tot.sockel) + " m</td></tr>" +
      (a.verschnitt ? "<tr><td>Material inkl. " + a.verschnitt + " % Verschnitt</td><td>Boden " + zahl(tot.boden * v) + " m² · Wand " + zahl(tot.wand * v) + " m²</td></tr>" : "") + "</table>" +
      (a.notiz ? '<p class="dok-klein"><b>Notiz:</b> ' + esc(a.notiz) + "</p>" : "");
  }
  function aufmassFotos(kunde) {
    var f = akteVon(kunde).fotos.filter(function (x) { return /Aufmaß|Heizraum|Bad|Gäste|Wohnzimmer/i.test(x.label); });
    return f.length ? '<div class="ak-fotos">' + f.map(function (x) { return '<figure class="ak-foto">' + (x.src ? '<img src="' + x.src + '" alt="' + esc(x.label) + '">' : '<span class="ak-ph" aria-hidden="true">' + svg(ICON.camera) + "</span>") + "<figcaption>" + esc(x.label) + "</figcaption></figure>"; }).join("") + "</div>" : "";
  }

  /* Vorschau eines Dokuments wie ein PDF */
  var KRITZEL = '<svg viewBox="0 0 220 60" class="dok-kritzel" aria-hidden="true"><path d="M8 42c14-22 22-30 26-20s-6 26 4 20 14-30 22-26-4 24 6 22 12-18 20-16 2 14 10 12 16-12 24-10 6 8 14 6 20-10 40-12"/></svg>';
  function dokOeffnen(id) {
    var x = dokumenteAlle().filter(function (d) { return d.id === id; })[0];
    if (!x) return;
    var lead = x.lead ? state.leads.filter(function (l) { return l.id === x.lead; })[0] : null;
    var unterschrift = x.st === "ohne" ? "" : x.st === "wartet" ? '<div class="dok-sig leer">Unterschrift fehlt noch</div>' :
      x.st === "papier" ? (x.src && /^blob:/.test(x.src) && !/pdf/i.test(x.typ || "") ? '<img class="dok-scan" src="' + x.src + '" alt="Eingescanntes Dokument">' : '<div class="dok-sig">' + KRITZEL + "</div>") :
      '<div class="dok-sig">' + (x.sig ? '<img src="' + x.sig + '" alt="Unterschrift">' : KRITZEL) + "</div>";
    openSheetDrawer("dok", '<div class="drawer-head"><div><h2 id="drawer-title">' + esc(x.titel) + '</h2><div class="lead-meta"><span class="pill ' + DST[x.st][1] + '">' + DST[x.st][0] + '</span><span class="pill">' + ART[x.art] + "</span></div></div>" +
        '<button class="icon-btn" type="button" data-close aria-label="Schließen">' + svg(ICON.x) + "</button></div>" +
      '<article class="dok-blatt"><header><b>' + esc(BETRIEB) + "</b><small>Musterstraße 1 · 91052 Erlangen</small></header>" +
        "<h3>" + esc(ART[x.art]) + "</h3><p><b>Kunde:</b> " + esc(x.kunde) + (lead ? ", " + esc(lead.ort) : "") + "<br><b>Betreff:</b> " + esc(x.betreff || x.sub || x.titel) + "</p>" +
        (x.am ? aufmassHtml(x.am) + aufmassFotos(x.kunde) : "") +
        (x.betrag ? '<table class="dok-tab"><tr><td>Leistung laut Angebot</td><td>' + euro.format(x.betrag / 1.19) + "</td></tr><tr><td>zzgl. 19 % MwSt.</td><td>" + euro.format(x.betrag - x.betrag / 1.19) + '</td></tr><tr class="sum"><td>Gesamt</td><td>' + euro.format(x.betrag) + "</td></tr></table>" : "") +
        (x.widerruf ? '<p class="dok-klein">Widerrufsbelehrung erhalten und bestätigt (Vertrag außerhalb von Geschäftsräumen, 14 Tage).' + (x.sofort ? " Der Kunde verlangt ausdrücklich, dass die Arbeiten vor Ende der Widerrufsfrist beginnen." : "") + "</p>" : "") +
        unterschrift +
        (x.st !== "ohne" && x.st !== "wartet" ? '<p class="dok-pruef">' + svg(ICON.check) + "Unterschrieben " + esc(x.wie || "") + " · " + (x.zeit || tageText(x.t)) + (x.st === "unterschrieben" ? " · Zeitstempel und Gerät gespeichert, Dokument gegen Änderungen gesichert" : "") + "</p>" : "") +
      "</article>" +
      '<div class="drawer-actions">' + (x.live ? '<button class="btn btn-signal" type="button" data-am-bearbeiten>Aufmaß bearbeiten</button>' : "") + (x.st === "wartet" && x.lead ? '<button class="btn btn-signal" type="button" data-vorort="' + x.lead + '">Jetzt vor Ort unterschreiben lassen</button>' : "") +
        '<button class="btn btn-outline" type="button" data-dok-senden="' + esc(x.kunde) + '">PDF an den Kunden senden</button>' +
        '<button class="btn btn-outline" type="button" data-akte-open="' + esc(x.kunde) + '">Zur Kundenakte</button></div>');
  }
  function openSheetDrawer(kind, html) {
    closeDrawer(); lastFocus = document.activeElement;
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", closeDrawer);
    var d = document.createElement("div"); d.className = "drawer drawer-" + kind; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title");
    d.innerHTML = html;
    d.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeDrawer(); });
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    var c = d.querySelector("[data-close]"); if (c) c.focus();
    return d;
  }

  /* Auftrag vor Ort unterschreiben (Außendienst, Handy oder Tablet) */
  var WIDERRUF = "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Frist beginnt mit dem Tag des Vertragsschlusses. Um Ihr Widerrufsrecht auszuüben, genügt eine eindeutige Erklärung (z. B. per Brief oder E-Mail) an " + "den Betrieb. (Beispieltext – im echten System steht hier die vollständige Belehrung mit Muster-Widerrufsformular.)";
  function unterschreibenOeffnen(leadId) {
    var l = state.leads.filter(function (x) { return x.id === leadId; })[0];
    if (!l) return;
    var gezeichnet = false;
    var d = openSheetDrawer("sign", '<div class="drawer-head"><div><h2 id="drawer-title">Auftrag unterschreiben</h2><div class="lead-meta"><span class="pill">' + esc(l.name) + '</span><span class="pill">' + esc(l.ort) + "</span></div></div>" +
        '<button class="icon-btn" type="button" data-close aria-label="Schließen">' + svg(ICON.x) + "</button></div>" +
      '<div class="dok-blatt kompakt"><p><b>' + esc(l.betreff) + "</b><br>laut Angebot AN-2026-0" + (80 + l.id) + "</p>" +
        '<table class="dok-tab"><tr><td>Netto</td><td>' + euro.format(l.wert / 1.19) + "</td></tr><tr><td>19 % MwSt.</td><td>" + euro.format(l.wert - l.wert / 1.19) + '</td></tr><tr class="sum"><td>Gesamt</td><td>' + euro.format(l.wert) + "</td></tr></table>" +
        '<button class="btn-mini" type="button" data-toast="Das vollständige Angebot mit allen Positionen öffnet sich als PDF (Demo).">Angebot vollständig ansehen</button></div>' +
      '<div class="field"><label for="sg-typ">Der Kunde ist</label><select id="sg-typ"><option value="privat">Privatperson</option><option value="firma">Firma / Hausverwaltung</option></select></div>' +
      '<div id="sg-widerruf" class="sg-widerruf">' +
        '<label class="fo-check"><input type="checkbox" id="sg-wr"> <span>Ich habe die Widerrufsbelehrung erhalten. <button class="btn-mini" type="button" data-wr-zeigen>Belehrung anzeigen</button></span></label>' +
        '<p class="dok-klein" id="sg-wr-text" hidden>' + esc(WIDERRUF) + "</p>" +
        '<label class="fo-check"><input type="checkbox" id="sg-sofort"> <span>Ich verlange ausdrücklich, dass die Arbeiten vor Ende der Widerrufsfrist beginnen. Mir ist bekannt, dass ich bei einem Widerruf die bis dahin erbrachten Leistungen anteilig bezahle und mein Widerrufsrecht bei vollständiger Ausführung erlischt. <small>(freiwillig)</small></span></label></div>' +
      '<div class="field"><label for="sg-name">Name des Kunden</label><input id="sg-name" value="' + esc(l.name) + '"></div>' +
      '<div class="field"><label for="sig-auftrag">Unterschrift des Kunden</label><canvas id="sig-auftrag" class="ph-sig" width="600" height="180" aria-label="Unterschriftenfeld: mit Finger oder Maus unterschreiben"></canvas>' +
        '<button class="btn-mini" type="button" data-sig-leeren style="margin-top:6px">Löschen</button></div>' +
      '<p class="dok-klein">' + esc(l.ort) + ", " + new Date().toLocaleDateString("de-DE") + " · Datum, Uhrzeit und Gerät werden automatisch gespeichert.</p>" +
      '<div class="drawer-actions"><button class="btn btn-signal" type="button" data-sign-ok>Verbindlich unterschreiben</button><button class="btn btn-outline" type="button" data-close>Abbrechen</button></div>');
    initSignatur("sig-auftrag", function () { gezeichnet = true; });
    d.addEventListener("change", function (e) { if (e.target.id === "sg-typ") document.getElementById("sg-widerruf").hidden = e.target.value !== "privat"; });
    d.addEventListener("click", function (e) {
      if (e.target.closest("[data-wr-zeigen]")) { var w = document.getElementById("sg-wr-text"); w.hidden = !w.hidden; return; }
      if (e.target.closest("[data-sig-leeren]")) { var c = document.getElementById("sig-auftrag"); c.getContext("2d").clearRect(0, 0, c.width, c.height); gezeichnet = false; return; }
      if (!e.target.closest("[data-sign-ok]")) return;
      var privat = document.getElementById("sg-typ").value === "privat";
      if (privat && !document.getElementById("sg-wr").checked) return toast("Bitte zuerst die Widerrufsbelehrung bestätigen lassen.");
      if (!gezeichnet) return toast("Bitte den Kunden im Feld unterschreiben lassen.");
      var jetzt = new Date();
      state.signiert[l.id] = { st: "unterschrieben", wie: "vor Ort auf dem Handy von " + ichName(), t: 0, bild: document.getElementById("sig-auftrag").toDataURL("image/png"),
        widerruf: privat, sofort: privat && document.getElementById("sg-sofort").checked, zeit: jetzt.toLocaleDateString("de-DE") + ", " + jetztZeit() + " Uhr" };
      l.stage = "auftrag"; l.dringend = false;
      add(l, "Auftrag vor Ort unterschrieben · PDF an Kunden gesendet");
      protokoll("Auftrag " + l.name + " vor Ort unterschrieben: PDF an Kunden, Auftragsbestätigung gesendet, Termin wird geplant");
      closeDrawer(); render();
      toast("Unterschrieben! " + l.name + " bekommt das PDF per E-Mail, das Büro sieht den Auftrag sofort (Demo).");
      setTimeout(function () { dokOeffnen("au-" + l.id); }, 300);
    });
  }

  /* Papier-Dokument zuordnen */
  function papierZuordnen(file, kunde) {
    var namen = []; state.leads.forEach(function (l) { if (namen.indexOf(l.name) < 0) namen.push(l.name); });
    state.kunden.forEach(function (k) { if (namen.indexOf(k.name) < 0) namen.push(k.name); });
    ["Hausverwaltung Kaya", "Wohnbau Fürth, Whg. 4"].forEach(function (n) { if (namen.indexOf(n) < 0) namen.push(n); });
    var src = URL.createObjectURL(file), bild = /^image\//.test(file.type);
    var d = openSheetDrawer("papier", '<div class="drawer-head"><div><h2 id="drawer-title">Papier-Dokument hinzufügen</h2><p class="src" style="margin:0">' + esc(file.name) + "</p></div>" +
        '<button class="icon-btn" type="button" data-close aria-label="Schließen">' + svg(ICON.x) + "</button></div>" +
      (bild ? '<img class="dok-scan" src="' + src + '" alt="Vorschau">' : '<div class="dok-sig leer">PDF: ' + esc(file.name) + "</div>") +
      '<div class="field"><label for="pa-kunde">Kunde</label><select id="pa-kunde">' + namen.map(function (n) { return "<option" + (n === kunde ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="pa-art">Art des Dokuments</label><select id="pa-art">' + ["auftrag", "angebot", "regie", "protokoll", "vertrag", "aufmass"].map(function (a) { return '<option value="' + a + '">' + ART[a] + (a === "auftrag" ? " (unterschrieben)" : "") + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="pa-titel">Bezeichnung</label><input id="pa-titel" value="' + esc(file.name.replace(/\.[^.]+$/, "")) + '"></div>' +
      '<div class="drawer-actions"><button class="btn btn-signal" type="button" data-papier-ok>Speichern und zuordnen</button></div>');
    d.addEventListener("click", function (e) {
      if (!e.target.closest("[data-papier-ok]")) return;
      var kd = document.getElementById("pa-kunde").value, art = document.getElementById("pa-art").value;
      state.papier.push({ art: art, titel: ART[art] + ": " + document.getElementById("pa-titel").value, kunde: kd, sub: "Papier-Dokument mit Unterschrift", src: src, typ: file.type });
      var l = state.leads.filter(function (x) { return x.name === kd; })[0];
      if (l && art === "auftrag" && l.stage === "angebot") { l.stage = "auftrag"; add(l, "Auftrag auf Papier unterschrieben · eingescannt"); state.signiert[l.id] = { st: "papier", wie: "auf Papier, eingescannt von " + ichName(), t: 0, src: src }; state.papier.pop(); }
      protokoll("Papier-Dokument für " + kd + " eingescannt und der Kundenakte zugeordnet");
      closeDrawer(); render();
      toast("Papier-Dokument gespeichert: liegt unter Dokumente und in der Kundenakte von " + kd + " (nur in Ihrem Browser, Demo).");
    });
  }

  /* =====================================================================
     12. ABLÄUFE: was die Automatik im Hintergrund erledigt (Arbeitsfläche mit Bausteinen)
     Jeder Ablauf ist eine Kette von Schritten. Bei jedem Vorgang sehen Sie,
     wo er gerade steht. Die Vorgänge kommen aus den echten Demo-Daten.
     ===================================================================== */
  var ABLAEUFE = [
    { id: "anfrage", titel: "Neue Anfrage", text: "Jede Anfrage wird erfasst, vorgeprüft und bekommt sofort eine Eingangsbestätigung.",
      schritte: ["Anfrage kommt rein", "KI-Vorprüfung", "Eingangsbestätigung", "Termin vorschlagen", "Ihre Entscheidung"], zweig: { nach: 1, label: "passt nicht", schritt: "Absage vorbereiten" } },
    { id: "nachfassen", titel: "Angebot nachfassen", text: "Offene Angebote werden freundlich erinnert. Nach der dritten Erinnerung bekommen Sie einen Anruf-Hinweis.",
      schritte: ["Angebot gesendet", "Erinnerung nach 3 Tagen", "nach 7 Tagen", "nach 14 Tagen", "Anruf-Hinweis an Sie"] },
    { id: "auftrag", titel: "Auftrag unterschrieben", text: "Sobald der Kunde unterschreibt – vor Ort, im Portal oder auf Papier – läuft der Rest von selbst.",
      schritte: ["Unterschrift", "PDF an Kunden", "Auftragsbestätigung", "Termin planen", "Material bestellen"] },
    { id: "regie", titel: "Regiebericht → Rechnung", text: "Unterschriebene Berichte werden zur Rechnungsvorlage. Sie prüfen und geben frei.",
      schritte: ["Bericht unterschrieben", "PDF an Kunden", "Rechnungsvorlage", "Freigabe im Büro", "ins Rechnungsprogramm"] },
    { id: "zahlung", titel: "Zahlungen & Erinnerungen", text: "Zahlungseingänge werden täglich zugeordnet. Bei Verzug liegt die Erinnerung zur Freigabe bereit.",
      schritte: ["Rechnung gestellt", "Konto täglich prüfen", "Zahlung zugeordnet", "Erinnerung vorbereitet", "Ihre Freigabe"] },
    { id: "vermittlung", titel: "Vermittlung (Auftragsportal)", text: "Endkunden-Anfrage aus dem Portal bis zum Auftrag – und die Provision.",
      schritte: ["Anfrage im Portal", "KI-Vorprüfung", "Zuweisung durch Sie", "Betrieb nimmt an", "Angebot", "Auftrag & Provision"] },
    { id: "nachher", titel: "Nach dem Auftrag", text: "Nach der Fertigstellung: Bitte um Bewertung und Wartungsvertrag mit Erinnerung.",
      schritte: ["Arbeiten erledigt", "Bitte um Bewertung", "Wartung anlegen", "Wartungserinnerung"] }
  ];
  var LOG_START = [
    ["06:00", "Morgenbericht erstellt und an die Geschäftsführung gesendet"],
    ["06:02", "Kontoumsätze geprüft: 2 Zahlungen zugeordnet (Familie Obermeier, Georg Hofbauer)"],
    ["06:03", "Zahlungserinnerungen für Johann Forster und Hausverwaltung Kaya vorbereitet – warten auf Freigabe"],
    ["07:40", "WhatsApp von Familie Huber: Anfrage erfasst, KI-Vorprüfung „passt gut“"],
    ["07:41", "Eingangsbestätigung an Familie Huber gesendet"],
    ["07:52", "Anruf von Thomas Bauer angenommen, als dringend markiert"],
    ["08:05", "Regiebericht RB-0412 in eine Rechnungsvorlage übernommen"],
    ["08:10", "Terminbestätigung an Familie Brandl gesendet"]
  ];
  function jetztZeit() { var d = new Date(); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function protokoll(text) { if (state) { state.log = state.log || []; state.log.push([jetztZeit(), text]); } }
  function flowAn(id) { return id === "nachfassen" ? state.autoNachfassen : (state.flows || {})[id] !== false; }

  function vorgaengeFuer(id) {
    var r = [];
    if (id === "anfrage") neueAnfragen().forEach(function (l) {
      if (l.denkt) r.push({ name: l.name, sub: l.betreff, stand: 1, st: "laeuft", hinweis: "KI prüft gerade", lead: l.id });
      else if (l.dringend) r.push({ name: l.name, sub: l.betreff, stand: 4, st: "wartet", hinweis: "Dringend – Rückruf heute", lead: l.id });
      else if (l.ki === "passtnicht") r.push({ name: l.name, sub: l.betreff, stand: 4, st: "wartet", hinweis: "Absage vorbereitet – Ihre Entscheidung", lead: l.id });
      else r.push({ name: l.name, sub: l.betreff, stand: 3, st: "laeuft", hinweis: "Terminvorschlag gesendet, Antwort offen", lead: l.id });
    });
    if (id === "nachfassen") offeneAngebote().slice().sort(function (a, b) { return b.angebotVor - a.angebotVor; }).forEach(function (l) {
      var e = l.erinnert || 0, next = NACHFASS_TAGE[e];
      if (next === undefined) r.push({ name: l.name, sub: euro.format(l.wert), stand: 4, st: "wartet", hinweis: "Alle Erinnerungen gesendet – bitte anrufen", lead: l.id });
      else if (l.angebotVor >= next) r.push({ name: l.name, sub: euro.format(l.wert), stand: e + 1, st: state.autoNachfassen ? "laeuft" : "wartet", hinweis: (e + 1) + ". Erinnerung " + (state.autoNachfassen ? "geht heute raus" : "fällig – wartet auf Sie"), lead: l.id, act: "nachfassen" });
      else r.push({ name: l.name, sub: euro.format(l.wert), stand: e + 1, st: "laeuft", hinweis: "Nächste Erinnerung in " + (next - l.angebotVor) + (next - l.angebotVor === 1 ? " Tag" : " Tagen"), lead: l.id });
    });
    if (id === "auftrag") state.leads.forEach(function (l) {
      if (l.stage !== "auftrag") return;
      var sg = state.signiert[l.id] || AUFTRAG_SIG[l.name];
      if (state.signiert[l.id]) r.push({ name: l.name, sub: euro.format(l.wert) + " · " + sg.wie, stand: 3, st: "laeuft", hinweis: "Unterschrieben heute – Termin wird geplant", lead: l.id });
      else r.push({ name: l.name, sub: euro.format(l.wert) + (sg ? " · " + sg.wie : ""), stand: 4, st: "fertig", hinweis: "Termin steht, Material bestellt", lead: l.id });
    });
    if (id === "regie") mt.berichte.forEach(function (b) {
      if (b.nr.indexOf("RB") !== 0) return;
      if (b.status === "abgerechnet") r.push({ name: b.baustelle, sub: b.nr, stand: 5, st: "fertig", hinweis: "Abgerechnet", go: "monteure" });
      else r.push({ name: b.baustelle, sub: b.nr + (b.stunden != null ? " · " + String(b.stunden).replace(".", ",") + " Std." : ""), stand: 3, st: "wartet", hinweis: "Rechnungsvorlage wartet auf Freigabe", go: "monteure" });
    });
    if (id === "zahlung") mod.rechnungen.forEach(function (x) {
      if (x.status === "bezahlt") r.push({ name: x.name, sub: x.nr + " · " + euro.format(x.betrag), stand: 3, st: "fertig", hinweis: "Bezahlt und zugeordnet", go: "rechnungen", skip: [3, 4] });
      else if (x.faellig > 0) r.push({ name: x.name, sub: x.nr + " · " + euro.format(x.betrag), stand: 4, st: "wartet", hinweis: x.faellig + " Tage überfällig – Erinnerung bereit", go: "rechnungen", skip: [2] });
      else r.push({ name: x.name, sub: x.nr + " · " + euro.format(x.betrag), stand: 1, st: "laeuft", hinweis: "Fällig in " + (-x.faellig) + " Tagen – wird täglich geprüft", go: "rechnungen" });
    });
    if (id === "vermittlung") state.vm.forEach(function (v) {
      var m = { neu: [2, v.note === "C" ? "fertig" : "wartet", v.note === "C" ? "Note C – nicht vermittelt" : "Bitte einem Betrieb zuweisen"], zugewiesen: [3, "laeuft", "Wartet auf Annahme durch " + v.partner], angenommen: [4, "laeuft", v.partner + " schickt einen Richtpreis"],
        richtpreis: [4, "laeuft", "Richtpreis beim Kunden"], besichtigung: [4, "laeuft", "Richtpreis bestätigt – Besichtigung"], angebot: [5, "laeuft", "Angebot von " + v.partner + " beim Kunden"], auftrag: [5, "fertig", "Auftrag erteilt · Provision " + (provision(v.auftrag) ? euro.format(provision(v.auftrag)) : "frei")], verloren: [4, "fertig", "Kein Auftrag"] }[v.status];
      r.push({ name: v.name, sub: v.vorhaben + " · " + v.ort, stand: m[0], st: m[1], hinweis: m[2], go: "vermittlung" });
    });
    if (id === "nachher") state.leads.forEach(function (l) {
      if (l.stage === "auftrag") r.push({ name: l.name, sub: l.betreff, stand: 0, st: "laeuft", hinweis: "Arbeiten laufen", lead: l.id });
      if (l.stage !== "erledigt") return;
      if (l.bewertung === "offen") r.push({ name: l.name, sub: l.betreff, stand: 1, st: "wartet", hinweis: "Bitte um Bewertung – wartet auf Freigabe", lead: l.id, act: "bewertung" });
      else if (l.bewertung === "angefragt") r.push({ name: l.name, sub: l.betreff, stand: 2, st: "laeuft", hinweis: "Bewertung angefragt, Wartung wird angelegt", lead: l.id });
      else r.push({ name: l.name, sub: l.betreff, stand: 4, st: "fertig", hinweis: "Bewertung erhalten · Wartung eingeplant", lead: l.id });
    });
    return r;
  }

  // Art eines Bausteins: Symbol und Farbe
  var WF_IC = {
    blitz: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    ki: ICON.spark, mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', kal: ICON.calendar, geld: ICON.euro,
    mensch: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', box: ICON.box, doc: ICON.doc, stern: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
  };
  function wfArt(text, i) {
    if (i === 0) return "blitz";
    if (/KI/.test(text)) return "ki";
    if (/Freigabe|Entscheidung|Anruf|Zuweisung|Ihre/.test(text)) return "mensch";
    if (/Termin|Wartung/.test(text)) return "kal";
    if (/Rechnung|Zahlung|Konto|Provision|Rechnungsprogramm/.test(text)) return "geld";
    if (/Material/.test(text)) return "box";
    if (/Bewertung/.test(text)) return "stern";
    if (/PDF|Unterschrift|Bericht|Angebot/.test(text)) return "doc";
    return "mail";
  }
  var WF_BEISPIEL = {
    anfrage: [["Name", "Familie Huber"], ["Kanal", "WhatsApp"], ["Ort", "Erlangen"], ["Anliegen", "Badsanierung"], ["Fotos", "3"]],
    nachfassen: [["Kunde", "Johann Forster"], ["Angebot", "6.900 €"], ["gesendet", "vor 8 Tagen"], ["Erinnerungen", "1"]],
    auftrag: [["Kunde", "Familie Brandl"], ["Auftrag", "11.600 €"], ["unterschrieben", "vor Ort, Handy"]],
    regie: [["Bericht", "RB-0412"], ["Baustelle", "Max Lechner"], ["Stunden", "2,5"], ["Material", "Flexschlauch, Dichtungen"]],
    zahlung: [["Rechnung", "RE-2026-112"], ["Kunde", "Johann Forster"], ["Betrag", "1.480 €"], ["fällig seit", "9 Tagen"]],
    vermittlung: [["Anfrage", "Heizung, Schwabach"], ["Budget", "9.500–12.000 €"], ["Note", "A"]],
    nachher: [["Kunde", "Familie Obermeier"], ["Leistung", "Badsanierung"], ["fertig", "vor 3 Tagen"]]
  };
  var WF_NEU = { ki: ["Bewertung", "passt gut"], mail: ["gesendet", "07:41 Uhr, Text aus Ihrer Vorlage"], kal: ["Termin", "Do 9:00 vorgeschlagen"], geld: ["Status", "zugeordnet"],
    mensch: ["wartet auf", "Ihre Freigabe"], box: ["Bestellung", "vorbereitet"], doc: ["PDF", "erstellt und gespeichert"], stern: ["Bitte", "per WhatsApp vorbereitet"], blitz: ["Start", "heute 07:40"] };
  var WF_WAS = { blitz: "Startet den Ablauf, sobald das Ereignis eintritt.", ki: "Die KI liest die Angaben, ergänzt Fehlendes und bewertet. Sie trifft keine Entscheidung allein.",
    mail: "Verschickt eine Nachricht mit dem Text aus Ihrer Vorlage – per E-Mail oder WhatsApp.", kal: "Schlägt einen passenden Termin vor und trägt ihn nach Bestätigung in den Kalender ein.",
    geld: "Gleicht mit Ihrem Rechnungsprogramm und dem Konto ab.", mensch: "Hält an, bis Sie oder Ihr Büro freigeben. Ohne Freigabe geht nichts raus.",
    box: "Setzt das Material auf die Bestellliste.", doc: "Erstellt das Dokument als PDF und legt es in der Kundenakte ab.", stern: "Bittet den Kunden um eine Bewertung – jeden gleich, ohne Belohnung." };
  function wfKnoten(f, i, n, warten, aktiv) {
    var art = wfArt(f.schritte[i], i);
    return '<button type="button" class="wf-node art-' + art + (i === 0 ? " start" : "") + (aktiv ? " gewaehlt" : "") + '" data-wf-node="' + i + '" style="grid-column:' + (i * 2 + 1) + ';grid-row:1;order:' + (i * 2) + '">' +
      '<span class="wf-box">' + svg(WF_IC[art]) + (n ? '<span class="wf-n' + (warten ? " warten" : "") + '" title="Vorgänge in diesem Schritt">' + n + "</span>" : "") + '<span class="wf-ok">' + svg(ICON.check) + "</span></span>" +
      '<span class="wf-name">' + esc(f.schritte[i]) + "</span></button>";
  }
  function viewAblaeufe() {
    var alle = ABLAEUFE.filter(function (f) { return state.rolle === "betreiber" ? f.id === "vermittlung" : f.id !== "vermittlung"; }).map(function (f) { return { f: f, v: vorgaengeFuer(f.id), an: flowAn(f.id) }; });
    if (!alle.some(function (x) { return x.f.id === state.wfSel; })) { state.wfSel = alle[0].f.id; state.wfNode = null; }
    var x = alle.filter(function (a) { return a.f.id === state.wfSel; })[0], f = x.f;
    var wartet = alle.reduce(function (s, a) { return s + a.v.filter(function (v) { return v.st === "wartet"; }).length; }, 0);
    var log = LOG_START.concat(state.log || []).slice().reverse();
    var ST = { laeuft: ["läuft", "ok"], wartet: ["wartet auf Sie", "check"], fertig: ["fertig", ""], pause: ["pausiert", "no"] };
    var proSchritt = f.schritte.map(function (_, i) { return x.v.filter(function (v) { return v.st !== "fertig" && v.stand === i; }); });
    var n = f.schritte.length, z = f.zweig;
    // Arbeitsfläche: Spalten abwechselnd Baustein und Verbindung
    var spalten = f.schritte.map(function () { return "112px"; }).join(" 64px ");
    var kanten = "";
    for (var i = 0; i < n - 1; i++) {
      var mitZweig = z && z.nach === i;
      kanten += '<span class="wf-kante' + (mitZweig ? " mit-zweig" : "") + '" data-wf-kante="' + i + '" style="grid-column:' + (i * 2 + 2) + ";grid-row:1" + (mitZweig ? " / span 2" : "") + ";order:" + (i * 2 + 1) + '">' +
        '<svg viewBox="0 0 64 ' + (mitZweig ? 300 : 150) + '" preserveAspectRatio="none" aria-hidden="true"><path class="wf-linie" d="M0 56 H64"/>' +
        (mitZweig ? '<path class="wf-linie zweig" d="M0 56 C 32 56, 32 206, 64 206"/>' : "") + '</svg><i class="wf-punkt"></i>' +
        (mitZweig ? '<em class="wf-label">passt</em><em class="wf-label unten">' + esc(z.label) + "</em>" : "") + "</span>";
    }
    var zweigKnoten = z ? '<div class="wf-node art-mail neben" style="grid-column:' + (z.nach * 2 + 3) + ';grid-row:2;order:' + (z.nach * 2 + 1) + '"><em class="wf-wenn">wenn ' + esc(z.label) + ':</em><span class="wf-box">' + svg(WF_IC.mail) + '</span><span class="wf-name">' + esc(z.schritt) + "</span></div>" : "";
    var detail = "";
    if (state.wfNode != null && f.schritte[state.wfNode] !== undefined) {
      var k = state.wfNode, art = wfArt(f.schritte[k], k), rein = (WF_BEISPIEL[f.id] || []).slice();
      for (var q = 1; q < k; q++) { var a2 = wfArt(f.schritte[q], q); if (WF_NEU[a2]) rein.push(WF_NEU[a2]); }
      var raus = k === 0 ? rein : rein.concat([WF_NEU[art]]);
      var tab = function (rows, neu) { return '<table class="wf-tab">' + rows.map(function (r2, ri) { return "<tr" + (neu && ri === rows.length - 1 ? ' class="neu"' : "") + "><th>" + esc(r2[0]) + "</th><td>" + esc(r2[1]) + "</td></tr>"; }).join("") + "</table>"; };
      detail = '<aside class="wf-detail" aria-label="Baustein ' + esc(f.schritte[k]) + '"><div class="wf-detail-kopf"><span class="wf-mini art-' + art + '">' + svg(WF_IC[art]) + "</span><b>" + esc(f.schritte[k]) + '</b><button class="icon-btn" type="button" data-wf-node="x" aria-label="Schließen">✕</button></div>' +
        "<p>" + WF_WAS[art] + "</p>" + (k ? "<h4>Kommt herein</h4>" + tab(rein) : "") + "<h4>" + (k ? "Geht weiter" : "Startdaten") + "</h4>" + tab(raus, k > 0) +
        (proSchritt[k].length ? "<h4>Gerade hier</h4><ul>" + proSchritt[k].map(function (v) { return "<li>" + esc(v.name) + " <small>" + esc(v.hinweis) + "</small></li>"; }).join("") + "</ul>" : "") + "</aside>";
    }
    var flowLog = log.filter(function (e) {
      var t = e[1]; return { anfrage: /Anfrage|Anruf|Eingangsbest|WhatsApp/, nachfassen: /Erinnerung an|Nachfass|Angebot/, auftrag: /Termin|Auftrag|Unterschrift/, regie: /Regiebericht|Rechnungsvorlage/, zahlung: /Zahlung|Kontoums/, vermittlung: /Portal|Vermitt/, nachher: /Bewertung|Wartung/ }[f.id].test(t) || t.indexOf(f.titel) > -1;
    });
    $main.innerHTML = head("Abläufe", "Was die Automatik im Hintergrund erledigt – als Kette aus Bausteinen. Tippen Sie auf einen Baustein oder starten Sie einen Testlauf.") +
      '<div class="kpis">' + kpi("Aktive Abläufe", alle.filter(function (a) { return a.an; }).length + " von " + alle.length, "an- und ausschaltbar") +
        kpi("Heute automatisch", String(log.length), "Schritte erledigt") + kpi("Wartet auf Sie", String(wartet), "Freigabe oder Anruf") + kpi("Gesparte Zeit", "ca. 6 Std.", "diese Woche, geschätzt") + "</div>" +
      '<div class="wf">' +
        '<nav class="wf-liste" aria-label="Abläufe">' + alle.map(function (a) {
          var w = a.v.filter(function (v) { return v.st === "wartet"; }).length;
          return '<div class="wf-eintrag' + (a.f.id === f.id ? " aktiv" : "") + (a.an ? "" : " aus") + '"><button type="button" data-wf-sel="' + a.f.id + '"><span class="wf-mini art-blitz">' + svg(WF_IC.blitz) + "</span><span><b>" + a.f.titel + "</b><small>" + a.f.schritte.length + " Bausteine" + (w ? " · " + w + " warten" : "") + "</small></span></button>" +
            '<label class="switch"><input type="checkbox" data-flow="' + a.f.id + '"' + (a.an ? " checked" : "") + ' aria-label="Ablauf ' + esc(a.f.titel) + ' an oder aus"><span></span></label></div>';
        }).join("") + "</nav>" +
        '<section class="wf-flaeche' + (x.an ? "" : " aus") + (detail ? " mit-detail" : "") + '" id="flows" aria-label="Ablauf ' + esc(f.titel) + '">' +
          '<div class="wf-leiste"><div><b>' + f.titel + "</b><small>" + (x.an ? '<span class="wf-aktiv"></span>aktiv' : "ausgeschaltet") + " · " + esc(f.text) + '</small></div><button class="btn btn-signal" type="button" data-wf-test' + (x.an ? "" : " disabled") + ">" + svg('<path d="M6 4l14 8-14 8z"/>') + "Testlauf</button></div>" +
          '<div class="wf-scroll"><div class="wf-graph' + (z ? " zwei" : "") + '" style="grid-template-columns:' + spalten + '">' +
            f.schritte.map(function (_, i) { return wfKnoten(f, i, proSchritt[i].length, proSchritt[i].some(function (v) { return v.st === "wartet"; }), state.wfNode === i); }).join("") + kanten + zweigKnoten +
          "</div></div>" + detail +
        "</section>" +
      "</div>" +
      '<div class="panel-grid two" style="margin-top:16px">' +
        '<section class="panel" aria-labelledby="wfv-h"><h2 id="wfv-h">Vorgänge in diesem Ablauf</h2>' +
          (x.v.length ? '<div class="flow-runs">' + x.v.slice().sort(function (a, b) { var o = { wartet: 0, laeuft: 1, fertig: 2 }; return o[a.st] - o[b.st]; }).slice(0, (state.flowAlle || {})[f.id] ? 99 : 4).map(function (v) {
            var st = x.an ? v.st : (v.st === "fertig" ? "fertig" : "pause");
            var punkte = f.schritte.map(function (_, i) {
              var cls = (v.skip || []).indexOf(i) > -1 ? "skip" : i < v.stand || (v.st === "fertig" && i <= v.stand) ? "done" : i === v.stand ? (st === "wartet" ? "wait" : st === "pause" ? "pause" : "now") : "";
              return '<i class="' + cls + '" title="' + esc(f.schritte[i]) + '"></i>'; }).join("");
            var knopf = v.lead ? '<button class="btn-mini' + (st === "wartet" ? " primary" : "") + '" type="button" data-open="' + v.lead + '"' + (st === "wartet" && v.act ? ' data-act="' + v.act + '"' : "") + ">" + (st === "wartet" && v.act ? "Freigeben" : "Öffnen") + "</button>" :
              '<button class="btn-mini' + (st === "wartet" ? " primary" : "") + '" type="button" data-go="' + v.go + '">Öffnen</button>';
            return '<div class="run"><div class="run-main"><strong>' + esc(v.name) + "</strong><small>" + esc(v.sub) + "</small></div>" +
              '<span class="run-steps" aria-label="Schritt ' + (Math.min(v.stand, n - 1) + 1) + " von " + n + '">' + punkte + "</span>" +
              '<span class="run-hint"><span class="pill ' + ST[st][1] + '">' + ST[st][0] + "</span><small>" + esc(x.an || st === "fertig" ? v.hinweis : "Ablauf ist ausgeschaltet") + "</small></span>" + knopf + "</div>";
          }).join("") + (x.v.length > 4 ? '<button class="btn-mini flow-mehr" type="button" data-flow-alle="' + f.id + '">' + ((state.flowAlle || {})[f.id] ? "Weniger anzeigen" : "Alle " + x.v.length + " Vorgänge anzeigen") + "</button>" : "") + "</div>" : '<p class="col-empty">Gerade keine Vorgänge.</p>') +
        "</section>" +
        '<section class="panel flow-log" aria-labelledby="log-h"><h2 id="log-h">Ausführungen heute</h2><ul class="wf-exec">' +
          (flowLog.length ? flowLog : log.slice(0, 6)).map(function (e) { var w = /wart|Freigabe/.test(e[1]); return '<li><span class="wf-st ' + (w ? "w" : "ok") + '"></span><span>' + esc(e[1]) + "<small>" + e[0] + " Uhr · " + (w ? "wartet auf Freigabe" : "erfolgreich") + "</small></span></li>"; }).join("") + "</ul>" +
          '<p class="src">In der echten Version laufen diese Abläufe mit einem bewährten Automatik-Programm auf einem Server in Deutschland. Neue Abläufe richte ich nach Ihren Wünschen ein – verschickt wird nur, was Sie freigeben.</p></section>' +
      "</div>";
  }
  function wfTestlauf() {
    var fl = document.getElementById("flows"); if (!fl || fl.classList.contains("laeuft")) return;
    var f = ABLAEUFE.filter(function (a) { return a.id === state.wfSel; })[0], n = f.schritte.length, schritt = 0;
    fl.classList.add("laeuft"); fl.querySelectorAll(".wf-node").forEach(function (k) { k.classList.remove("fertig"); });
    var t0 = Date.now();
    (function weiter() {
      var k = fl.querySelector('.wf-node[data-wf-node="' + schritt + '"]'); if (k) { k.classList.add("dran"); }
      setTimeout(function () {
        if (k) { k.classList.remove("dran"); k.classList.add("fertig"); }
        var kante = fl.querySelector('[data-wf-kante="' + schritt + '"]');
        schritt++;
        if (schritt < n) { if (kante) { kante.classList.add("fliesst"); setTimeout(function () { kante.classList.remove("fliesst"); kante.classList.add("fertig"); weiter(); }, 420); } else weiter(); }
        else {
          fl.classList.remove("laeuft");
          var sek = ((Date.now() - t0) / 1000 * 0.35).toFixed(1).replace(".", ",");
          protokoll("Testlauf „" + f.titel + "“: alle " + n + " Schritte erfolgreich");
          toast("Testlauf erfolgreich: " + n + " Bausteine in " + sek + " Sekunden. Es wurde nichts verschickt.");
        }
      }, 520);
    })();
  }

  /* =====================================================================
     6. GEFÜHRTE TOUR
     ===================================================================== */
  var TOUR_ALLE = [
    { view: "uebersicht", sel: "#briefing", title: "Jeden Morgen ein Bericht",
      text: "Was ist neu, was ist schon erledigt, was liegt zur Freigabe bereit? Diese Zusammenfassung bekommen Sie jeden Morgen – im Cockpit, per E-Mail oder WhatsApp. Verschickt wird nur, was Sie freigeben." },
    { view: "uebersicht", sel: "#kpis", title: "Alles auf einen Blick",
      text: "Hier sehen Sie sofort: neue Anfragen, offene Angebote, was heute nachgefasst wird und welche Aufträge laufen." },
    { view: "uebersicht", sel: "#todo", title: "Heute zu tun",
      text: "Das System sagt Ihnen, was ansteht – dringende Anfragen, fällige Erinnerungen, Bitten um Bewertungen. Ein Tipp genügt." },
    { view: "anfragen", sel: "[data-simulate]", title: "Neue Anfrage? Landet automatisch hier.",
      text: "Egal ob WhatsApp, Telefon, E-Mail oder Website. Tippen Sie nach der Tour auf diesen Knopf und sehen Sie zu, wie die KI eine Anfrage prüft." },
    { view: "anfragen", sel: "#board", title: "Von der Anfrage zum Auftrag",
      text: "Jede Anfrage wandert durch die Spalten Neu → Angebot → Auftrag → Erledigt. Nichts geht mehr verloren." },
    { view: "anfragen", sel: ".lead", title: "Die KI prüft vor",
      text: "Jede Anfrage wird zusammengefasst und eingeschätzt: Passt der Auftrag? Ist er dringend? Tippen Sie auf eine Karte für alle Details." },
    { view: "nachfassen", sel: "#auto", title: "Nachfassen passiert automatisch",
      text: "Offene Angebote werden freundlich erinnert – nach 3, 7 und 14 Tagen. Sie müssen nicht mehr daran denken." },
    { view: "vertrieb", sel: "#vt-trichter", title: "Ihre Quoten im Vertrieb",
      text: "Wie viele Anfragen werden zu Terminen, Angeboten und Aufträgen? Je Person, Kanal und Leistung, mit Zielen und den Gründen, warum Aufträge verloren gehen." },
    { view: "kunden", sel: "#kunden-liste", title: "Alte Angebote werden wieder zu Aufträgen",
      text: "Bestandskunden und nicht beauftragte Angebote werden gezielt wieder angesprochen – ohne Kosten pro Anfrage." },
    { view: "akte", akte: "Familie Brandl", sel: "#kundenakte", title: "Die Kundenakte: alles zu einem Kunden",
      text: "Jeder Vorgang an einem Ort: Anfrage, Aufmaß, Angebot, Auftrag, Fotos, interner Chat, Regieberichte, Rechnungen und Zahlungen, Termine und Wartung. Die Geschäftsführung sieht alles, oben filtern Sie nach Bereich." },
    { view: "dokumente", sel: "#dok-fehlt", title: "Alle Unterschriften an einem Ort",
      text: "Aufträge unterschreibt der Kunde direkt vor Ort auf dem Handy oder Tablet – mit Widerrufsbelehrung. Regieberichte und Abnahmen unterschreibt er bei der Montagekraft. Papier wird eingescannt. Oben steht, welche Unterschriften noch fehlen." },
    { view: "vermittlung", sel: "#vm-neu", rolle: "betreiber", title: "Zusatztool: Ihr Auftragsportal",
      text: "Endkunden beschreiben ihr Vorhaben im Portal und sehen eine Preisspanne. Sie als Betreiber geben jede Anfrage an einen passenden Betrieb aus Ihrem Netzwerk. Der Betrieb zahlt nur bei Auftrag eine Provision – kein Monatsbeitrag, keine Kosten pro Anfrage." },
    { view: "rechnungen", sel: "#rg-liste", title: "Wer muss noch zahlen?",
      text: "Offene Rechnungen aus Ihrem Rechnungsprogramm. Zahlungseingänge werden automatisch zugeordnet, Erinnerungen geben Sie mit einem Klick frei." },
    { view: "finanzen", sel: "#fin-vorschau", title: "Finanzen im Blick",
      text: "Kontostand, was in den nächsten 90 Tagen kommt und geht, eine Rücklage für Steuern und Belege, die direkt beim Steuerberater landen. Eine Übersicht für Sie, keine Steuerberatung." },
    { view: "ablaeufe", sel: "#flows", title: "Abläufe: Sie sehen, was passiert",
      text: "Jeder Ablauf ist eine Kette aus Bausteinen. Tippen Sie auf einen Baustein, um zu sehen, was er macht, oder starten Sie einen Testlauf. Bei jedem Vorgang sehen Sie, wo er steht und ob er auf Ihre Freigabe wartet. Dazu der Verlauf, was heute automatisch erledigt wurde." },
    { view: "termine", sel: "#termine", title: "Termine und Team",
      text: "Alle Termine mit Mitarbeiter. Ihr Team sieht seine Termine auf dem Handy. Bestätigungen an Kunden sind vorbereitet." },
    { view: "uebersicht", sel: "#rolle", title: "Jeder sieht, was er braucht",
      text: "Wechseln Sie oben die Ansicht: Geschäftsführung sieht alles inklusive Geschäftszahlen, das Büro den Alltag, der Außendienst Kunden, Angebote und seinen eigenen Aufmaß-Bereich – und Montagekräfte ihre eigene Montage-App." },
    { view: "monteure", sel: "#mapp", mt: "heute", rolle: "monteur", title: "Die Montage-App",
      text: "So sieht es Ihre Montagekraft auf dem Handy: Tagesplan mit Vorlesen, die aktuelle Baustelle mit Navigation und Anruf, Materialliste – und unten Aufmaß, Formulare, Kunden und Arbeitszeit." },
    { view: "monteure", sel: "#mapp", mt: "zeit", rolle: "monteur", title: "Arbeitszeit ohne Zettel",
      text: "Ein- und ausstempeln, Pausen, Baustelle wechseln, Wochenübersicht, Urlaub und Krankmeldung. Das Büro sieht die Stunden sofort." },
    { view: "monteure", sel: "#mapp", mt: "aufmass", rolle: "monteur", title: "Aufmaß direkt ins Angebot",
      text: "Maße je Raum, Türen und Fenster werden abgezogen, Sockel und Material inklusive Verschnitt berechnet. Dann ins Angebot übernehmen, Material bestellen oder als PDF an den Kunden – probieren Sie es aus." },
    { view: "monteure", sel: "#mapp", mt: "kunden", rolle: "monteur", title: "Fotos und interner Chat je Kunde",
      text: "Zu jedem Kunden gibt es eine Akte mit Fotos und einem internen Chat. So stimmen sich Büro, Außendienst und Montage ab – der Kunde sieht davon nichts." },
    { view: "monteure", sel: "#mapp", mt: "formulare", rolle: "monteur", title: "Formulare für jede Branche",
      text: "Regiebericht, Abnahme, Wartung Heizung, E-Check, Montageprotokoll, Reinigungsnachweis … Wählen Sie Ihre Branche – jedes Formular mit Fotos und Unterschrift." },
    { view: "material", sel: "#mat-liste", title: "Material bestellen",
      text: "Material aus Aufmaß und Aufträgen landet auf einer Liste. Sie geben frei, die Bestellung geht direkt an Ihren Großhändler. Was im Firmenwagen knapp wird, schlägt das Cockpit zur Nachbestellung vor." },
    { view: "wartung", sel: "#wartung-liste", title: "Wartung und Prüffristen",
      text: "Wartungsverträge und Prüffristen Ihrer Kunden – das System erinnert rechtzeitig und schlägt Termine vor. Planbarer Umsatz für Sie." },
    { view: "portal", sel: "#portal", title: "Das Kundenportal",
      text: "Ihr Kunde sieht per Link Stand, Termin und Unterlagen – und nimmt das Angebot online an. Weniger Anrufe, schnellere Zusagen." },
    { view: "ausschreibungen", sel: "#aus-liste", title: "Öffentliche Aufträge finden",
      text: "Das Ausschreibungsradar sucht täglich passende Aufträge und prüft vorab, ob Sie die Anforderungen erfüllen." },
    { view: "netzwerk", sel: "#netz-liste", title: "Aufträge aus dem Netzwerk",
      text: "Hausverwaltungen und Bauherren suchen Fachbetriebe. Sie zahlen keinen Beitrag, nur eine Provision, wenn Sie den Auftrag bekommen." },
    { view: "fristen", sel: "#fristen-liste", title: "Pflichten und Fristen",
      text: "Geräteprüfung, Hauptuntersuchung, Unterweisungen und die Nachweise Ihrer Nachunternehmer: Das Cockpit erinnert rechtzeitig, damit keine Frist verpasst wird." },
    { view: "personal", sel: "#bew-liste", title: "Mitarbeiter finden",
      text: "Bewerbungen an einem Ort, Antworten vorbereitet. Über Bewerber entscheiden immer Sie." },
    { view: "uebersicht", sel: null, title: "Jetzt sind Sie dran",
      text: "Klicken Sie sich frei durch die Demo. Wie das in Ihrem Betrieb aussehen würde, zeige ich Ihnen gern im kostenlosen Angebots-Check.", ende: true }
  ];
  var TOUR_KURZ = [
    { view: "uebersicht", sel: "#morgen", title: "Ihr Morgen in 30 Sekunden", text: "Oben steht, was heute zählt: neue Anfragen, Termine und Nachrichten, die schon geschrieben sind. Ein Klick, und Sie sind beim richtigen Vorgang." },
    { view: "uebersicht", sel: "#geld", title: "Hier liegt Geld herum", text: "Angebote ohne Nachfrage, überfällige Rechnungen, alte Angebote: Das Cockpit zeigt, wo Umsatz liegen bleibt – mit dem Betrag und dem nächsten Schritt." },
    { view: "anfragen", sel: "[data-simulate]", title: "Eine Anfrage kommt rein", text: "Egal ob Telefon, WhatsApp, E-Mail oder Website: Alles landet hier, die KI fasst zusammen und schlägt eine Antwort vor. Probieren Sie den Knopf nach der Tour aus." },
    { view: "aufmass", sel: "#am-vis-panel", title: "Aufmaß für Ihr Gewerk", text: "Jedes Gewerk hat sein eigenes Aufmaß. Maße eintragen oder messen lassen – Zeichnung, Mengen und Material entstehen sofort." },
    { view: "aufmass", sel: ".am-leiste", title: "Konfigurieren und ins Angebot", text: "Produkte konfigurieren Sie mit Maßen, Farbe und Ausstattung, der Kunde sieht sie in 3D oder im eigenen Raum. Ein Klick, und alle Positionen stehen im Angebot." },
    { view: "nachfassen", sel: "#auto", title: "Nachfassen passiert von selbst", text: "Offene Angebote werden freundlich erinnert – in Ihrem Ton, verschickt erst nach Ihrer Freigabe." },
    { view: "portal", sel: "#portal", title: "Ihr Kunde ist immer im Bild", text: "Im Kundenportal sieht der Kunde Angebot, Termin, Fortschritt und sein Produkt – und sagt online zu. Weniger Anrufe, schnellere Zusagen." },
    { view: "rechnungen", sel: "#rg-liste", title: "Und das Geld kommt rein", text: "Offene Rechnungen im Blick, Zahlungseingänge werden zugeordnet, Erinnerungen geben Sie mit einem Klick frei." },
    { view: "uebersicht", sel: null, title: "Das war's – in drei Minuten", text: "Jetzt klicken Sie sich am besten selbst durch. Alle weiteren Bereiche finden Sie links unter „Alle Bereiche“ – oder in der ausführlichen Tour.", ende: true, alle: true }
  ];
  var TOUR = TOUR_KURZ;
  var tourStep = -1;
  function tourShow(i) {
    tourEnd(true);
    tourStep = i;
    var s = TOUR[i];
    closeDrawer();
    var soll = s.rolle || "gf";
    if (state.rolle !== soll) { state.rolle = soll; var rsel = document.getElementById("rolle"); if (rsel) rsel.value = soll; }
    if (s.akte) { state.akteKunde = s.akte; state.akteTab = "ueberblick"; state.view = "akte"; }
    else if (s.mt) { mt.tab = s.mt; ex.form = null; state.view = s.view; }
    else state.view = s.view;
    render();
    var dim = document.createElement("div"); dim.className = "tour-dim"; dim.addEventListener("click", function () { tourEnd(); });
    document.body.appendChild(dim);
    var target = s.sel ? document.querySelector(s.sel) : null;
    if (target) {
      target.classList.add("tour-focus");
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    var card = document.createElement("div");
    card.className = "tour-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-labelledby", "tour-title");
    card.innerHTML = '<span class="step">Schritt ' + (i + 1) + " von " + TOUR.length + "</span>" +
      '<h2 id="tour-title">' + s.title + "</h2><p>" + s.text + "</p>" +
      '<div class="tour-nav"><button class="tour-skip" type="button" data-tour-end>' + (s.ende ? "Schließen" : "Tour beenden") + "</button>" +
      '<div style="display:flex;gap:8px">' + (i > 0 ? '<button class="btn btn-outline" type="button" data-tour-prev>Zurück</button>' : "") +
      (s.ende ? (s.alle ? '<button class="btn btn-outline" type="button" data-tour-alle>Ausführliche Tour</button>' : "") + '<a class="btn btn-signal" href="kontakt.html">Angebots-Check</a>' : '<button class="btn btn-signal" type="button" data-tour-next>Weiter</button>') + "</div></div>";
    document.body.appendChild(card);
    (card.querySelector("[data-tour-next]") || card.querySelector("a.btn")).focus({ preventScroll: true });
  }
  function tourEnd(silent) {
    document.querySelectorAll(".tour-dim, .tour-card").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".tour-focus").forEach(function (el) { el.classList.remove("tour-focus"); });
    if (!silent) tourStep = -1;
  }

  function rolleWechseln(r, still) {
    state.rolle = r; closeDrawer(); tourEnd();
    var sel = document.getElementById("rolle"); if (sel) sel.value = r;
    if (r === "monteur") { mt.tab = "heute"; ex.form = null; state.view = "monteure"; }
    if (!erlaubt(state.view)) state.view = (ROLLEN[state.rolle].views || ["uebersicht"]).filter(function (x) { return x !== "akte"; })[0] || "uebersicht";
    if (state.view === "akte" && !state.akteKunde) state.view = erlaubt("kunden") ? "kunden" : "uebersicht";
    render(); window.scrollTo(0, 0);
    if (!still && r === "monteur") toast("Ansicht: Montagekraft – so sieht Alex die App. Oben zurück zur Geschäftsführung.");
  }

  /* =====================================================================
     KLICKS VERTEILEN
     ===================================================================== */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var el;
    if (ketteKlick(t)) return;
    if (etappe3Klick(t)) return;
    if (einstiegKlick(t)) return; if (plKlick(t)) return; if (bwKlick(t)) return; if (ffKlick(t)) return; if (konfKlick(t)) return; if (aufmassKlick(t)) return;
    if (t.closest("[data-anfrage-neu]")) return anfrageFormular(null);
    if (t.closest("[data-kunde-neu]")) return kundeFormular(null);
    if ((el = t.closest("[data-kunde-edit]"))) { var kn = el.getAttribute("data-kunde-edit"), kk = state.kunden.filter(function (x) { return x.name === kn; })[0], kl = state.leads.filter(function (x) { return x.name === kn; })[0]; return kk ? kundeFormular(kk) : kl ? anfrageFormular(kl) : null; }
    if ((el = t.closest("[data-kunde-del]"))) return kundeLoeschen(el.getAttribute("data-kunde-del"));
    if ((el = t.closest("[data-nav-gruppe]"))) { var gn = el.getAttribute("data-nav-gruppe"); navOffen[gn] = el.getAttribute("aria-expanded") !== "true"; if (!navOffen[gn]) GRUPPEN.forEach(function (g) { if (g[0] === gn && g[1].indexOf(state.view) > -1) navOffen[gn] = true; }); return renderNav(); }
    if ((el = t.closest("[data-view]"))) { if (el.closest(".sheet")) closeDrawer(); return go(el.getAttribute("data-view")); }
    if ((el = t.closest("[data-branche]"))) { state.branche = el.getAttribute("data-branche"); return render(); }
    if (t.closest("[data-br-fertig]")) return toast("Bericht abgeschlossen – PDF mit Fotos geht an Kunde und Büro (Demo).");
    if ((el = t.closest("[data-kal-ev]"))) return kalTermin(+el.getAttribute("data-kal-ev"));
    if ((el = t.closest("[data-kal-ansicht]"))) { state.kal.ansicht = el.getAttribute("data-kal-ansicht"); state.kal.gewaehlt = true; state.kal.offset = 0; return render(); }
    if ((el = t.closest("[data-kal-nav]"))) { var nv = +el.getAttribute("data-kal-nav"); state.kal.offset = nv ? state.kal.offset + nv : 0; return render(); }
    if ((el = t.closest("[data-kal-wer]"))) { state.kal.wer = el.getAttribute("data-kal-wer"); return render(); }
    if (t.closest("[data-kal-neu]")) return kalNeu();
    if (t.closest("[data-kal-sync]")) return kalSync();
    if ((el = t.closest(".kal-spalte")) && !t.closest(".kal-ev")) {
      var r = el.getBoundingClientRect(), std = VON + (e.clientY - r.top) / PX, m = Math.round(std * 4) / 4;
      return kalNeu(el.getAttribute("data-kal-tag"), pad2(Math.floor(m)) + ":" + pad2(Math.round((m % 1) * 60)), el.getAttribute("data-kal-person"));
    }
    if ((el = t.closest(".kal-mz")) && !t.closest(".kal-chip")) return kalNeu(el.getAttribute("data-kal-tag"));
    if (t.closest("[data-ics-mein]")) { icsLaden(mod.termine.filter(meinTermin), "meine-termine.ics"); return toast("Datei geladen – öffnen, dann stehen alle deine Termine im Handy-Kalender."); }
    if ((el = t.closest("[data-ics]"))) { var ti = mod.termine[+el.getAttribute("data-ics")]; icsLaden([ti], "termin.ics"); return toast("Datei geladen – öffnen, dann steht der Termin in deinem Handy-Kalender."); }
    if ((el = t.closest("[data-go]"))) return go(el.getAttribute("data-go"));
    if (t.closest("[data-simulate]")) return simulieren();
    if (t.closest("[data-tour]") || t.closest("#tour-start")) { closeDrawer(); TOUR = TOUR_KURZ; return tourShow(0); }
    if (t.closest("[data-tour-next]")) return tourShow(tourStep + 1);
    if (t.closest("[data-tour-prev]")) return tourShow(tourStep - 1);
    if (t.closest("[data-tour-end]")) return tourEnd();
    if ((el = t.closest("[data-filter]"))) { state.filter = el.getAttribute("data-filter"); return viewAnfragen(); }
    if ((el = t.closest("[data-kfilter]"))) { state.kundenFilter = el.getAttribute("data-kfilter"); return viewKunden(); }
    if ((el = t.closest("[data-kunde]"))) {
      var k = state.kunden[+el.getAttribute("data-kunde")];
      k.erledigt = true;
      toast((k.art === "alt" ? "Reaktivierung" : "Wartungsangebot") + " an " + k.name + " gesendet (Demo).");
      return viewKunden();
    }
    if ((el = t.closest("[data-vorlesen]"))) return vorlesen(el.getAttribute("data-vorlesen"));
    if ((el = t.closest("[data-stimme-toggle]"))) { var vs = document.getElementById("voice-set"); if (vs) { vs.hidden = !vs.hidden; el.setAttribute("aria-expanded", String(!vs.hidden)); } return; }
    if (t.closest("[data-stimme-probe]")) { vorlesenStop(); sprich("Morgen! So klinge ich, wenn ich Ihnen den Tag kurz zusammenfasse."); return; }
    if ((el = t.closest("[data-akte-open]"))) return akteOeffnen(el.getAttribute("data-akte-open"));
    if ((el = t.closest("[data-ka-tab]"))) { state.akteTab = el.getAttribute("data-ka-tab"); return viewKundenakte(); }
    if ((el = t.closest("[data-akte-tab]"))) { var nmA = el.getAttribute("data-akte-name"); akteVon(nmA).tab = el.getAttribute("data-akte-tab"); return akteNeu(nmA); }
    if ((el = t.closest("[data-akte-send]"))) return akteSenden(el.getAttribute("data-akte-send"));
    if ((el = t.closest("[data-mt]"))) return monteurAktion(el.getAttribute("data-mt"), el);
    if ((el = t.closest("[data-wt]"))) { var wt = ex.wartung[+el.getAttribute("data-wt")]; wt.erledigt = true; toast("Terminvorschlag für die " + wt.art + " an " + wt.kunde + " gesendet (Demo)."); return viewWartung(); }
    if ((el = t.closest("[data-po-annehmen]"))) {
      var pl = leadVon(+el.getAttribute("data-po-annehmen")); if (!pl) return; ketteSync(); var pa = angebotVon(pl.id);
      if (!pa || pa.status !== "gesendet") return viewPortal();   // schon angenommen: nichts doppelt anlegen
      pa.status = "angenommen"; verlaufK(pa, "Im Kundenportal angenommen (Demo)"); pl.stage = "auftrag"; add(pl, "Angebot " + pa.nr + " im Kundenportal angenommen");
      var pau = auftragAnlegen(pl, pa, false); verlaufK(pau, "Auftrag angelegt (Annahme im Kundenportal)"); protokoll(pl.name + " hat Angebot " + pa.nr + " im Portal angenommen");
      if (window.Glocke) Glocke.push("stift", "Angebot angenommen: " + pl.name, pa.nr + " · im Kundenportal", "auftraege");
      toast("Angenommen – Auftrag " + pau.nr + " wurde im Cockpit angelegt (Demo)."); renderNav(); return viewPortal();
    }
    if ((el = t.closest("[data-po-termin]"))) { var pt = mod.termine[+el.getAttribute("data-po-termin")]; if (pt) { pt.offen = false; var pl2 = state.leads.filter(function (x) { return x.name === pt.name; })[0]; if (pl2) add(pl2, "Termin " + pt.tag + " " + pt.zeit + " im Portal bestätigt"); toast("Termin bestätigt – steht so im Kalender."); } return viewPortal(); }
    if ((el = t.closest("[data-po]"))) {
      if (el.getAttribute("data-po") === "frage") return toast("Die Frage landet direkt beim Auftrag im Cockpit (Demo).");
      ex.portal = "auftrag";
      var hu = state.leads.filter(function (l) { return l.name === "Familie Huber"; })[0]; if (hu) { hu.stage = "auftrag"; hu.verlauf.push({ t: 0, text: "Angebot im Kundenportal angenommen und unterschrieben" }); state.signiert[hu.id] = { st: "unterschrieben", wie: "im Kundenportal (Familie Huber)", t: 0, widerruf: true, zeit: new Date().toLocaleDateString("de-DE") + ", " + jetztZeit() + " Uhr" }; protokoll("Familie Huber hat das Angebot im Kundenportal unterschrieben"); }
      toast("Familie Huber hat das Angebot online angenommen – der Auftrag ist im Cockpit (Demo)."); renderNav(); return viewPortal();
    }
    if ((el = t.closest("[data-rg]")) && !el.hasAttribute("data-rg-ok") && window.MailVorschau) {
      var rq = mod.rechnungen[+el.getAttribute("data-rg")], lq = state.leads.filter(function (x) { return x.name === rq.name; })[0] || {}, aq = gruss(rq.name), nrq = (rq.erinnert || 0) + 1;
      var knopfRg = el;
      MailVorschau.zeigen({ zweck: nrq + ". Zahlungserinnerung · " + rq.nr, von: BETRIEB, vonMail: "info@musterbetrieb.de", an: rq.name, anMail: lq.mail || "kunde@beispiel.de", anTel: lq.tel,
        betreff: (nrq > 1 ? nrq + ". " : "") + "Zahlungserinnerung zur Rechnung " + rq.nr, anhang: rq.nr + ".pdf",
        mail: [aq + ",\n\nbestimmt ist es einfach untergegangen: Unsere Rechnung " + rq.nr + " über " + euro.format(rq.betrag) + " ist seit " + rq.faellig + " Tagen offen. Ich hänge sie noch einmal an. Wäre schön, wenn Sie sie in den nächsten 7 Tagen überweisen.\n\nFalls Sie schon bezahlt haben, ist alles gut – dann haben sich unsere Nachrichten überschnitten." + "\n\nViele Grüße\n" + absender()[0] + "\n" + BETRIEB,
               aq + ",\n\nnur eine kurze Erinnerung an die Rechnung " + rq.nr + " über " + euro.format(rq.betrag) + ". Am schnellsten geht es über diesen Link: https://pay.musterbetrieb.de/" + rq.nr + "\n\nDanke!" + signatur()],
        wa: [gruss(rq.name, true) + ", kleine Erinnerung: Die Rechnung " + rq.nr + " über " + euro.format(rq.betrag) + " ist noch offen. Hier können Sie direkt bezahlen: https://pay.musterbetrieb.de/" + rq.nr + "\nViele Grüße, " + absender()[1]],
        senden: function () { knopfRg.setAttribute("data-rg-ok", ""); knopfRg.click(); } });
      return;
    }
    if ((el = t.closest("[data-rg]"))) { var r = mod.rechnungen[+el.getAttribute("data-rg")]; r.erinnert = (r.erinnert || 0) + 1; r.faellig = -14; protokoll("Zahlungserinnerung an " + r.name + " gesendet (von Ihnen freigegeben)"); r.info = r.erinnert + ". Erinnerung heute gesendet · neue Frist 14 Tage"; toast("Zahlungserinnerung an " + r.name + " gesendet (Demo)."); renderNav(); return viewRechnungen(); }
    if ((el = t.closest("[data-kp-idee]"))) { var kpi2 = el.getAttribute("data-kp-idee"); state.kpIdee = state.kpIdee || {}; state.kpIdee[kpi2.replace("|", "")] = true; toast("Vorbereitet – liegt zur Freigabe bereit."); return viewKundenakte(); }
    if ((el = t.closest(".kp-notiz-form button"))) { var fm = el.closest("form"), inp = fm.querySelector("input"), v = inp.value.trim(); if (!v) return; var nm2 = fm.getAttribute("data-kp-notiz"); state.kpNotiz = state.kpNotiz || {}; (state.kpNotiz[nm2] = state.kpNotiz[nm2] || []).push(v); toast("Notiz gespeichert – auch in der Montage-App sichtbar."); return viewKundenakte(); }
    if ((el = t.closest("[data-vt-zeit]"))) { mod.vt.zeit = el.getAttribute("data-vt-zeit"); return viewVertrieb(); }
    if ((el = t.closest("[data-vt-wer]"))) { mod.vt.wer = el.getAttribute("data-vt-wer"); return viewVertrieb(); }
    if (t.closest("[data-vt-buero]")) { mod.vt.buero = !mod.vt.buero; toast(mod.vt.buero ? "Vertriebszahlen für das Büro freigegeben." : "Freigabe für das Büro zurückgenommen."); return viewVertrieb(); }
    if ((el = t.closest("[data-frist]"))) { var fr = mod.fristen[+el.getAttribute("data-frist")]; fr.ok = true; toast(fr.was + ": " + (fr.art === "Nachunternehmer" ? "Anfrage an den Nachunternehmer gesendet." : "Termin vorgeschlagen.")); return viewFristen(); }
    if ((el = t.closest("[data-mat]"))) { var mt2 = mod.mat[+el.getAttribute("data-mat")]; mt2.an = !mt2.an; mod.bestellt = false; return viewMaterial(); }
    if ((el = t.closest("[data-lager]"))) { var lg = mod.lager[+el.getAttribute("data-lager")]; mod.mat.push({ name: lg.name, auftrag: "Lager Firmenwagen", menge: lg.min * 2 - lg.ist, einheit: "Stk.", preis: 3, an: true }); lg.ist = lg.min * 2; mod.bestellt = false; toast(lg.name + " auf die Bestellliste gesetzt."); return viewMaterial(); }
    if (t.closest("[data-mat-bestellen]")) { mod.bestellt = true; mod.mat = mod.mat.filter(function (m) { return !m.an; }); toast("Bestellung an " + mod.grosshandel + " gesendet (Demo)."); return viewMaterial(); }
    if (t.closest("[data-kal-buchung]")) { toast("Ihre Buchungsseite: Kunden wählen freie Zeiten für Kundendienst, Wartung oder Besichtigung – der Termin landet direkt hier im Kalender."); return; }
    if ((el = t.closest("[data-fin-beleg]"))) { var bl = mod.belege[+el.getAttribute("data-fin-beleg")]; bl.st = "uebertragen"; toast(bl.name + ": an den Steuerberater übertragen."); return viewFinanzen(); }
    if (t.closest("[data-fin-alle]")) { var nb = 0; mod.belege.forEach(function (b) { if (b.st === "neu") { b.st = "uebertragen"; nb++; } }); toast(nb + " Belege an den Steuerberater übertragen."); return viewFinanzen(); }
    if (t.closest("[data-fin-pdf]")) { toast("Monatsübersicht erstellt (in der Demo ohne Download)."); return; }
    if ((el = t.closest("[data-rgpaid]"))) { var r2 = mod.rechnungen[+el.getAttribute("data-rgpaid")]; r2.status = "bezahlt"; r2.info = "Zahlung manuell bestätigt"; toast(r2.name + ": als bezahlt markiert. Kam der Auftrag über das Portal, kann die Kundschaft jetzt bewerten."); return viewRechnungen(); }
    if ((el = t.closest("[data-ts]"))) { var tm = mod.termine[+el.getAttribute("data-ts")]; tm.offen = false; toast("Terminbestätigung an " + tm.name + " gesendet (Demo)."); return viewTermine(); }
    if ((el = t.closest("[data-aus]"))) { var au = mod.aus[+el.getAttribute("data-aus")]; au.gemerkt = true; toast("Unterlagen für „" + au.titel + "“ werden angefordert (Demo)."); return viewAusschreibungen(); }
    if ((el = t.closest("[data-netz]"))) { var nz = mod.netz[+el.getAttribute("data-netz")]; nz.gemeldet = true; toast("Interesse an „" + nz.titel + "“ gemeldet. Der Auftraggeber meldet sich (Demo)."); return viewNetzwerk(); }
    if ((el = t.closest("[data-bew-zusage]"))) { var bz = mod.bew[+el.getAttribute("data-bew-zusage")]; bz.stufe = "zusage"; toast("Zusage an " + bz.name + " gesendet (Demo)."); return viewPersonal(); }
    if ((el = t.closest("[data-bew]"))) { var bw = mod.bew[+el.getAttribute("data-bew")]; bw.erledigt = true; toast((bw.passt ? "Gesprächsvorschlag an " : "Absage an ") + bw.name + " gesendet (Demo)."); return viewPersonal(); }
    if ((el = t.closest("[data-open]")) && !t.closest(".drawer")) return openLead(+el.getAttribute("data-open"), el.getAttribute("data-act"));
    if (t.closest("[data-mehr]")) return mehrOeffnen();
    if (t.closest("[data-social]")) return openSheetDrawer("social", '<div class="drawer-head"><div><h2 id="drawer-title">Beitrag zur Freigabe</h2><div class="lead-meta"><span class="pill">Instagram</span><span class="pill">Facebook</span><span class="pill">Google-Profil</span></div></div><button class="icon-btn" type="button" data-close aria-label="Schließen">' + svg(ICON.x) + "</button></div>" +
      '<div class="social"><div class="social-bilder"><span>Vorher</span><span>Nachher</span></div><p><b>Aus alt mach neu: Bad im Obergeschoss in Baiersdorf</b> 🛁<br>Bodengleiche Dusche, großformatige Fliesen, Waschtisch mit viel Stauraum – in 12 Arbeitstagen fertig. Danke an Familie Obermeier für das Vertrauen und die 5-Sterne-Bewertung!<br><br>Sie planen auch ein neues Bad? Schreiben Sie uns – Rückmeldung innerhalb von 24 Stunden.<br>#Badsanierung #Baiersdorf #Erlangen #Handwerk</p></div>' +
      '<p class="src">Text von der KI aus Baustellenfotos und Auftrag geschrieben. Der Kunde hat der Veröffentlichung der Fotos zugestimmt (ohne Namen, wenn gewünscht).</p>' +
      '<div class="drawer-actions"><button class="btn btn-signal" type="button" data-social-ok>Freigeben und veröffentlichen</button><button class="btn btn-outline" type="button" data-close>Später</button></div>');
    if (t.closest("[data-social-ok]")) { state.socialOk = true; protokoll("Vorher-nachher-Beitrag Familie Obermeier auf Instagram, Facebook und Google veröffentlicht"); closeDrawer(); render(); return toast("Veröffentlicht auf Instagram, Facebook und im Google-Profil (Demo)."); }
    if ((el = t.closest("[data-zlink]"))) { var rz = mod.rechnungen[+el.getAttribute("data-zlink")]; protokoll("Zahlungslink an " + rz.name + " gesendet"); return toast("Zahlungslink über " + euro.format(rz.betrag) + " an " + rz.name + " gesendet – Zahlung per Karte, PayPal oder Überweisung (Demo)."); }
    if ((el = t.closest("[data-unterwegs]"))) { protokoll("Unterwegs-Nachricht an " + el.getAttribute("data-unterwegs")); return toast(el.getAttribute("data-unterwegs") + " bekommt per WhatsApp: „Ihr Monteur ist unterwegs, Ankunft ca. in 20 Minuten“ mit Live-Link (Demo)."); }
    if (t.closest("[data-lohn]")) return toast("Stunden der Woche an die Lohnabrechnung übergeben (Lexware oder DATEV) – kein Abtippen mehr (Demo).");
    if (t.closest("[data-ki-text]")) { state.kiText = true; return render(); }
    if ((el = t.closest("[data-vm-zuweisen]"))) {
      var zp = el.getAttribute("data-vm-zuweisen").split("|"), vz = state.vm.filter(function (x) { return x.id === zp[0]; })[0], pz = PARTNER[+zp[1]];
      vz.status = "zugewiesen"; vz.partner = pz.name; vz.seit = "gerade eben"; vz.abgelehnt = false; pz.zuletzt = 0;
      protokoll("Anfrage " + vz.name + " (" + vz.vorhaben + ") an " + pz.name + " vermittelt");
      render();
      return toast("An " + pz.name + " vermittelt. Der Betrieb hat 24 Stunden zum Annehmen." + (pz.name === BETRIEB ? " Tipp: Oben „Geschäftsführung“ wählen – dort liegt die Anfrage jetzt unter Anfragen." : ""));
    }
    if ((el = t.closest("[data-vm-geklaert]"))) { var vg = state.vm.filter(function (x) { return x.id === el.getAttribute("data-vm-geklaert"); })[0]; vg.note = "A"; vg.gruende = ["telefonisch geklärt"]; render(); return toast("Geklärt – Note A. Jetzt zuweisen."); }
    if ((el = t.closest("[data-vm-spaeter]"))) { var vs2 = state.vm.filter(function (x) { return x.id === el.getAttribute("data-vm-spaeter"); })[0]; vs2.nachfrage = true; protokoll("Nachfrage bei " + vs2.name + " in 3 Monaten eingeplant"); render(); return toast("Eingeplant: Das Portal fragt in 3 Monaten automatisch nach."); }
    if ((el = t.closest("[data-vm-doch]"))) { var vd = state.vm.filter(function (x) { return x.id === el.getAttribute("data-vm-doch"); })[0]; vd.note = "B"; render(); return toast("Zurück in die Liste – bitte vorher kurz mit dem Kunden sprechen."); }
    if ((el = t.closest("[data-vm-erinnern]"))) return toast("Erinnerung an den Betrieb gesendet: Bitte die Anfrage annehmen oder ablehnen (Demo).");
    if ((el = t.closest("[data-vm-neu]"))) { var vn = state.vm.filter(function (x) { return x.id === el.getAttribute("data-vm-neu"); })[0]; state.leads = state.leads.filter(function (l2) { return l2.vmId !== vn.id; }); vn.status = "neu"; vn.partner = null; render(); return toast("Zurück in „Neu“ – bitte einem anderen Betrieb zuweisen."); }
    if ((el = t.closest("[data-vm-auftrag]"))) { var va = state.vm.filter(function (x) { return x.id === el.getAttribute("data-vm-auftrag"); })[0]; va.status = "auftrag"; va.auftrag = va.angebot; protokoll("Vermittlung " + va.name + ": Auftrag erteilt – Provision " + euro.format(provision(va.auftrag)) + " fällig"); render(); return toast("Auftrag gemeldet: Provision " + euro.format(provision(va.auftrag)) + " ist fällig (Demo)."); }
    if (t.closest("[data-vm-sim]")) { var vp = VM_POOL[(state.vmPool = (state.vmPool || 0) + 1) % VM_POOL.length]; state.vm.unshift(Object.assign({ id: "s" + Date.now(), status: "neu", eingang: "gerade eben" }, vp)); protokoll("Portal-Anfrage von " + vp.name + " eingegangen, KI-Vorprüfung erledigt"); render(); return toast("Neue Anfrage aus dem Portal: " + vp.name + " – " + vp.vorhaben + "."); }
    if ((el = t.closest("[data-dok]"))) return dokOeffnen(el.getAttribute("data-dok"));
    if ((el = t.closest("[data-am-neu]"))) { var nk = el.getAttribute("data-am-neu"); if (AM_KUNDEN.indexOf(nk) < 0) AM_KUNDEN.push(nk); am.kunde = nk; return go("aufmass"); }
    if (t.closest("[data-am-bearbeiten]")) { closeDrawer(); if (state.rolle === "monteur") { mt.tab = "aufmass"; state.view = "monteure"; } else { state.view = "aufmass"; } render(); return window.scrollTo(0, 0); }
    if ((el = t.closest("[data-vorort]"))) return unterschreibenOeffnen(+el.getAttribute("data-vorort"));
    if ((el = t.closest("[data-dok-link]"))) { protokoll("Link zum Unterschreiben an " + el.getAttribute("data-dok-link") + " gesendet"); return toast("Link zum Unterschreiben an " + el.getAttribute("data-dok-link") + " gesendet – der Kunde unterschreibt im Kundenportal (Demo)."); }
    if ((el = t.closest("[data-dok-senden]"))) return toast("PDF an " + el.getAttribute("data-dok-senden") + " gesendet (Demo).");
    if ((el = t.closest("[data-toast]"))) return toast(el.getAttribute("data-toast"));
    if ((el = t.closest("[data-dfilter]"))) { state.dokFilter = el.getAttribute("data-dfilter"); return viewDokumente(); }
    if ((el = t.closest("[data-dstatus]"))) { state.dokStatus = el.getAttribute("data-dstatus"); return viewDokumente(); }
    if ((el = t.closest("[data-wf-sel]"))) { state.wfSel = el.getAttribute("data-wf-sel"); state.wfNode = null; return viewAblaeufe(); }
    if ((el = t.closest("[data-wf-node]"))) { var wn = el.getAttribute("data-wf-node"); state.wfNode = wn === "x" || +wn === state.wfNode ? null : +wn; return viewAblaeufe(); }
    if (t.closest("[data-wf-test]")) return wfTestlauf();
    if ((el = t.closest("[data-flow-alle]"))) { state.flowAlle = state.flowAlle || {}; var fa = el.getAttribute("data-flow-alle"); state.flowAlle[fa] = !state.flowAlle[fa]; return viewAblaeufe(); }
    if ((el = t.closest("[data-btab]"))) { mt.btab = el.getAttribute("data-btab"); return viewMonteure(); }
    if ((el = t.closest("[data-rolle-wechsel]"))) return rolleWechseln(el.getAttribute("data-rolle-wechsel"));
    if ((el = t.closest("[data-stage-m]"))) { state.stageM = el.getAttribute("data-stage-m"); return viewAnfragen(); }
    if (t.closest("[data-briefing-more]")) { state.briefingOffen = !state.briefingOffen; var bf = document.getElementById("briefing"); if (bf) bf.classList.toggle("offen", state.briefingOffen); t.closest("[data-briefing-more]").textContent = state.briefingOffen ? "Weniger anzeigen" : "Ganzen Bericht anzeigen"; return; }
    if (t.closest("#reset") || t.closest("[data-reset]")) { if (!confirm("Demo zurücksetzen? Alle Ihre Änderungen (neue Anfragen, Angebote, Rechnungen, Notizen …) werden gelöscht und die Beispieldaten wiederhergestellt.")) return; try { localStorage.removeItem(SPEICHER); } catch (e2) {} reset(); resetModule(); resetMonteur(); resetErweiterung(); resetAkte(); resetAufmass(); ex.raeume = am.raeume; var rs = document.getElementById("rolle"); if (rs) rs.value = "gf"; vorlesenStop(); closeDrawer(); tourEnd(); render(); if (window.Glocke) Glocke.reset(); toast("Demo zurückgesetzt."); }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-am")) {
      var r = am.raeume[+t.getAttribute("data-am")], k = t.getAttribute("data-k");
      if (k === "name") { r.name = t.value; return; }
      r[k] = Math.max(0, parseFloat(String(t.value).replace(",", ".")) || 0);
      var i = t.getAttribute("data-am");
      document.getElementById("am-erg-" + i).textContent = amErgebnis(+i);
      amSumme();
    }
    if (t.hasAttribute && t.hasAttribute("data-ab") && t.getAttribute("data-k") !== "art") {
      var ij = t.getAttribute("data-ab").split(","), x = am.raeume[+ij[0]].ab[+ij[1]];
      x[t.getAttribute("data-k")] = Math.max(0, parseFloat(String(t.value).replace(",", ".")) || 0);
      document.getElementById("am-erg-" + ij[0]).textContent = amErgebnis(+ij[0]); amSumme();
    }
    if (t.id === "am-vs") { am.verschnitt = Math.max(0, Math.min(40, parseFloat(t.value) || 0)); amSumme(); }
  });
  document.addEventListener("change", function (e) {
    var vg = e.target.closest && e.target.closest("[data-vt-grund]");
    if (vg && vg.value) { mod.vt.verl[vg.getAttribute("data-vt-grund")] = vg.value; toast("Grund gespeichert: " + vg.value + "."); viewVertrieb(); return; }
    var t = e.target;
    if (t.id === "fo-branche") { ex.branche = t.value; return viewMonteure(); }
    if (t.id === "am-kunde") { am.kunde = t.value; return; }
    if (t.id === "stimme") { sprache.stimme = t.value; try { localStorage.setItem("demo-stimme", t.value); } catch (e2) { /* privat */ } vorlesenStop(); sprich("Hallo, so klinge ich."); return; }
    if (t.id === "tempo") { sprache.tempo = parseFloat(t.value) || 0.95; try { localStorage.setItem("demo-tempo", t.value); } catch (e3) { /* privat */ } return; }
    if (t.hasAttribute && t.hasAttribute("data-ab") && t.getAttribute("data-k") === "art") { var ij2 = t.getAttribute("data-ab").split(","); am.raeume[+ij2[0]].ab[+ij2[1]].art = t.value; document.getElementById("am-erg-" + ij2[0]).textContent = amErgebnis(+ij2[0]); amSumme(); return; }
    if (t.hasAttribute && (t.hasAttribute("data-akte-up") || t.hasAttribute("data-papier-up"))) {   // Dateien prüfen: nur Bilder/PDF, max. 10 MB
      var falsch = Array.prototype.filter.call(t.files || [], function (fi) { return !/^image\//.test(fi.type) && fi.type !== "application/pdf"; }), gross = Array.prototype.filter.call(t.files || [], function (fi) { return fi.size > 10 * 1024 * 1024; });
      if (falsch.length || gross.length) { toast(falsch.length ? "„" + falsch[0].name + "“ wird nicht unterstützt – bitte ein Foto (JPG, PNG, HEIC) oder ein PDF wählen." : "„" + gross[0].name + "“ ist größer als 10 MB."); t.value = ""; return; }
    }
    if (t.hasAttribute && t.hasAttribute("data-akte-up")) {
      var nm = t.getAttribute("data-akte-up"), ak2 = akteVon(nm);
      Array.prototype.forEach.call(t.files || [], function (file) { ak2.fotos.push({ src: URL.createObjectURL(file), label: file.name.replace(/\.[^.]+$/, ""), von: ichName(), wann: "gerade eben" }); });
      ak2.tab = "fotos"; akteNeu(nm);
      return toast((t.files.length === 1 ? "1 Foto" : t.files.length + " Fotos") + " in der Kundenakte gespeichert (nur in Ihrem Browser, Demo).");
    }
    if (t.hasAttribute && t.hasAttribute("data-flow")) {
      var fid = t.getAttribute("data-flow");
      if (fid === "nachfassen") state.autoNachfassen = t.checked; else state.flows[fid] = t.checked;
      protokoll("Ablauf „" + ABLAEUFE.filter(function (f) { return f.id === fid; })[0].titel + "“ " + (t.checked ? "eingeschaltet" : "ausgeschaltet"));
      toast(t.checked ? "Ablauf eingeschaltet." : "Ablauf ausgeschaltet – es wird nichts mehr automatisch gesendet.");
      renderNav(); return viewAblaeufe();
    }
    if (t.hasAttribute && t.hasAttribute("data-mat")) {
      mt.material[t.getAttribute("data-mat")] = t.checked;
      var c = document.querySelector("#ph-material .ph-count"); if (c) c.textContent = MATERIAL.filter(function (m) { return mt.material[m.id]; }).length + " von " + MATERIAL.length + " eingeladen";
      return;
    }
    if (t.hasAttribute && t.hasAttribute("data-papier-up")) { if (t.files && t.files[0]) papierZuordnen(t.files[0], t.getAttribute("data-papier-up")); t.value = ""; return; }
    if (t.id === "nz-min") { PARTNER[0].min = +t.value; return toast(+t.value ? "Sie bekommen nur noch Anfragen ab " + euro.format(+t.value) + "." : "Sie bekommen Anfragen jeder Größe."); }
    if (t.id === "nz-vgl") { PARTNER[0].vgl = t.value; return toast({ ja: "Sie bekommen auch Vergleichsanfragen (höchstens 3 Betriebe je Anfrage).", ab5000: "Vergleichsanfragen erst ab 5.000 € Auftragswert.", nein: "Sie bekommen nur noch Anfragen ohne Vergleich." }[t.value]); }
    if (t.id === "nz-google") { PARTNER[0].google = t.value.trim(); return toast(t.value.trim() ? "Google-Link gespeichert." : "Google-Link entfernt."); }
    if (t.id === "nz-voll") { PARTNER[0].voll = t.checked; return toast(t.checked ? "Pausiert – Sie bekommen keine neuen Anfragen." : "Wieder frei – Sie bekommen wieder Anfragen."); }
    if (t.hasAttribute && t.hasAttribute("data-nz-gewerk")) { var gw = t.getAttribute("data-nz-gewerk"), arr = PARTNER[0].gewerk; if (t.checked && arr.indexOf(gw) < 0) arr.push(gw); if (!t.checked) PARTNER[0].gewerk = arr.filter(function (x) { return x !== gw; }); return toast("Gewerke gespeichert."); }
    if (t.id === "mapp-lang") { mt.lang = t.value === "de" ? null : t.value; viewMonteure(); return toast(t.value === "de" ? "Sprache: Deutsch" : "Sprache: " + SPRACHEN[t.value] + " – Anweisungen werden automatisch übersetzt (Demo)."); }
    if (t.id === "zt-bs") { mt.zeit.baustelle = t.value; viewMonteure(); return toast("Zeit läuft jetzt auf " + t.value + "."); }
    if (t.id === "rolle") {
      rolleWechseln(t.value, true);
      toast("Ansicht: " + ROLLEN[state.rolle].label + " – " + ({ gf: "alles inklusive Geschäftszahlen.", buero: "alles für den Büroalltag, ohne Geschäftszahlen.", aussen: "Kunden, Angebote, Aufmaß, Unterschriften und Termine.", monteur: "die komplette Montage-App für die Baustelle.", betreiber: "Ihr Auftragsportal – Anfragen an Betriebe vermitteln." })[state.rolle]);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.hasAttribute && e.target.hasAttribute("data-akte-in")) { e.preventDefault(); return akteSenden(e.target.getAttribute("data-akte-in")); }
    if (e.key !== "Escape") return;
    if (document.querySelector(".tour-card")) return tourEnd();
    if (document.querySelector(".drawer")) closeDrawer();
  });

  // Neue Anfragen aus dem Portal (anderer Tab) live anzeigen
  window.addEventListener("storage", function (e) { if (e.key === "portal-anfragen" && state.view === "vermittlung") render(); });

  /* --- Speicherung: Änderungen bleiben in diesem Browser erhalten (localStorage) ---
     Grenzen: nur dieses Gerät und dieser Browser, keine Synchronisation, privates Surfen kann es verhindern.
     Hochgeladene Fotos werden nicht gespeichert. Zurücksetzen löscht alles. */
  var SPEICHER = "auftragscockpit-demo-v1", speicherTimer = null;
  function zustandSpeichern() {
    try {
      var ohneBlob = function (k, v) { return typeof v === "string" && v.indexOf("blob:") === 0 ? undefined : v; };
      localStorage.setItem(SPEICHER, JSON.stringify({ zeit: Date.now(), state: state, mod: mod, mt: mt, ex: Object.assign({}, ex, { raeume: null }), akte: akte, am: am }, ohneBlob));
    } catch (e) { /* Speicher voll oder gesperrt – Demo läuft trotzdem */ }
  }
  function spaeterSpeichern() { clearTimeout(speicherTimer); speicherTimer = setTimeout(zustandSpeichern, 350); }
  function zustandLaden() {
    var d; try { d = JSON.parse(localStorage.getItem(SPEICHER) || "null"); } catch (e) { d = null; }
    if (!d || !d.state || !d.mod) return false;
    var ergaenzen = function (neu, alt) { Object.keys(alt).forEach(function (k) { if (!(k in neu)) neu[k] = alt[k]; }); return neu; };
    state = ergaenzen(d.state, state); mod = ergaenzen(d.mod, mod); mt = ergaenzen(d.mt || {}, mt); ex = ergaenzen(d.ex || {}, ex); akte = d.akte || akte; am = d.am || am;
    ex.raeume = am.raeume; state.angebotSel = null; state.auftragSel = null; state.akteKunde = state.akteKunde || null;
    akte = akte || {}; Object.keys(akte).forEach(function (k) { akte[k].fotos = (akte[k].fotos || []).filter(function (f) { return f.src !== undefined || !f.blob; }); });
    return true;
  }
  ["click", "change", "input", "submit"].forEach(function (ev) { document.addEventListener(ev, spaeterSpeichern); });
  window.addEventListener("pagehide", zustandSpeichern);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") zustandSpeichern(); });

  // Start (Bereich aus der Adresse übernehmen, z. B. demo.html#rechnungen)
  var startHash = location.hash;
  reset();
  var geladen = zustandLaden();
  if (startHash && VIEWS.some(function (x) { return "#" + x.id === startHash; })) state.view = startHash.slice(1);
  else if (geladen && state.view === "akte" && !state.akteKunde) state.view = "kunden";
  if (geladen) { var rsel0 = document.getElementById("rolle"); if (rsel0) rsel0.value = state.rolle || "gf"; }
  render();
  if (geladen) setTimeout(function () { toast("Ihre Änderungen von vorher sind wieder da (nur in diesem Browser gespeichert)."); }, 400);
  // Tour direkt starten, wenn die Seite mit demo.html#tour geöffnet wird
  if (startHash === "#tour") setTimeout(function () { tourShow(0); }, 300);
  else if (!gwSpeicher().gesehen && !/[?&]branche=/.test(location.search) && !startHash) setTimeout(onboarding, 250);
  if (startHash === "#vermittlung") { rolleWechseln("betreiber", true); state.view = "vermittlung"; render(); }
})();
