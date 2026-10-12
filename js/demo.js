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
    { name: "Familie Huber", ort: "Erlangen", kanal: "whatsapp", betreff: "Badsanierung, ca. 8 m²", wert: 18500, stage: "neu", tage: 0,
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
    formular: { label: "Website",  icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>' }
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
    sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'
  };
  var VIEWS = [
    { id: "uebersicht", label: "Übersicht", icon: ICON.home },
    { id: "anfragen", label: "Anfragen", icon: ICON.inbox },
    { id: "nachfassen", label: "Nachfassen", icon: ICON.bell },
    { id: "kunden", label: "Kunden", icon: ICON.users },
    { id: "rechnungen", label: "Rechnungen", icon: ICON.euro },
    { id: "termine", label: "Termine", icon: ICON.calendar },
    { id: "monteure", label: "Monteure", icon: ICON.wrench },
    { id: "wartung", label: "Wartung", icon: ICON.shield },
    { id: "portal", label: "Kundenportal", icon: ICON.link },
    { id: "ausschreibungen", label: "Ausschreibungen", icon: ICON.radar },
    { id: "netzwerk", label: "Netzwerk", icon: ICON.network },
    { id: "personal", label: "Personal", icon: ICON.job }
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
      pool: 0,
      leads: START_LEADS.map(function (l) {
        var lead = Object.assign({ id: id++ }, l);
        lead.verlauf = startVerlauf(lead);
        return lead;
      }),
      kunden: START_KUNDEN.map(function (k) { return Object.assign({ erledigt: false }, k); })
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

  function toast(text) {
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = svg(ICON.check) + "<span>" + text + "</span>";
    $toasts.appendChild(el);
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
  function renderNav() {
    var counts = { anfragen: neueAnfragen().length, nachfassen: faelligNachfassen().length,
      rechnungen: mod.rechnungen.filter(function (r) { return r.status !== "bezahlt" && r.faellig > 0; }).length };
    var html = VIEWS.filter(function (v) { return erlaubt(v.id); }).map(function (v) {
      var c = counts[v.id] ? '<span class="count">' + counts[v.id] + "</span>" : "";
      return '<button type="button" data-view="' + v.id + '"' + (state.view === v.id ? ' aria-current="page"' : "") + ">" +
             svg(v.icon) + "<span>" + v.label + "</span>" + c + "</button>";
    }).join("");
    document.getElementById("side-nav").innerHTML = html;
    document.getElementById("app-tabs").innerHTML = html;
  }

  function render() {
    if (!erlaubt(state.view)) state.view = (ROLLEN[state.rolle].views || ["uebersicht"])[0];
    renderNav();
    ({ uebersicht: viewUebersicht, anfragen: viewAnfragen, nachfassen: viewNachfassen, kunden: viewKunden, rechnungen: viewRechnungen, termine: viewTermine, monteure: viewMonteure, wartung: viewWartung, portal: viewPortal, ausschreibungen: viewAusschreibungen, netzwerk: viewNetzwerk, personal: viewPersonal })[state.view]();
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
    var bezahlt = mod.rechnungen.filter(function (r) { return r.status === "bezahlt"; });
    if (bezahlt.length) erledigt.push(bezahlt.length + " Zahlungseingänge zugeordnet");
    var freigabe = faellig.map(function (l) {
      return li('Nachfass-Mail an <b>' + esc(l.name) + "</b> (" + euro.format(l.wert) + ') <button class="btn-mini primary" type="button" data-open="' + l.id + '" data-act="nachfassen">Ansehen &amp; senden</button>');
    }).concat(bewOffen.map(function (l) {
      return li('Bewertungsanfrage an <b>' + esc(l.name) + '</b> <button class="btn-mini primary" type="button" data-open="' + l.id + '" data-act="bewertung">Ansehen &amp; senden</button>');
    })).concat(mod.rechnungen.filter(function (r) { return state.rolle !== "aussen" && r.status !== "bezahlt" && r.faellig > 0; }).map(function (r) {
      return li('Zahlungserinnerung an <b>' + esc(r.name) + "</b> (" + euro.format(r.betrag) + ') <button class="btn-mini primary" type="button" data-go="rechnungen">Ansehen</button>');
    }));
    var termineHeute = mod.termine.filter(function (t) { return t.tag === "Heute"; });
    return '<section class="panel briefing" id="briefing" aria-labelledby="briefing-h">' +
      '<div class="briefing-head"><h2 id="briefing-h">' + svg(ICON.spark) + "Ihr Morgenbericht</h2>" +
        '<button class="btn-mini" type="button" data-vorlesen>' + svg(ICON.sound) + "Vorlesen</button></div>" +
      "<p>Seit gestern " + (neu.length === 1 ? "ist <b>1 neue Anfrage</b>" : "sind <b>" + neu.length + " neue Anfragen</b>") + " eingegangen" +
        (dringend.length ? ", davon " + (dringend.length === 1 ? "eine dringend (" + esc(dringend[0].betreff) + " in " + esc(dringend[0].ort) + ")" : dringend.length + " dringend") : "") + ".</p>" +
      '<div class="briefing-cols">' +
        "<div><h3>Schon erledigt</h3><ul>" + erledigt.map(li).join("") + "</ul></div>" +
        "<div><h3>Zur Freigabe bereit</h3>" + (freigabe.length ? "<ul>" + freigabe.join("") + "</ul>" : "<p>Nichts offen.</p>") + "</div>" +
      "</div>" +
      (aeltestes ? '<p class="briefing-tip"><b>Heute wichtig:</b> Angebot ' + esc(aeltestes.name) + " ist seit " + aeltestes.angebotVor + " Tagen offen – ein Anruf lohnt sich." +
        (termineHeute.length ? " Heute stehen " + termineHeute.length + " Termine an, der erste um " + termineHeute[0].zeit + " Uhr." : "") + "</p>" : "") +
      '<p class="briefing-note">Diesen Bericht bekommen Sie jeden Morgen im Cockpit, per E-Mail oder WhatsApp. Verschickt wird nur, was Sie freigeben.</p>' +
    "</section>";
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
      '<div class="welcome" id="welcome">' +
        '<div><h2>Willkommen in der Demo</h2><p>So arbeiten Sie mit dem Auftragsassistenten. Alle Kunden und Beträge sind erfunden – probieren Sie alles aus, es wird nichts verschickt.</p></div>' +
        '<div class="btn-row"><button class="btn btn-signal" type="button" data-tour>Tour starten</button><button class="btn btn-outline" type="button" data-go="anfragen">Selbst erkunden</button></div>' +
      "</div>" +
      '<div class="view-head"><div><h1>' + gruss + ".</h1><p>" + BETRIEB + " · Ansicht: " + ROLLEN[state.rolle].label + " · Beispieldaten</p></div>" +
        '<div class="view-actions"><button class="btn btn-signal" type="button" data-simulate>+ Neue Anfrage simulieren</button></div></div>' +
      morgenbericht(neu, faellig) +
      (state.rolle === "gf" ? gfPanel() : "") +
      '<div class="kpis" id="kpis">' +
        kpi("Neue Anfragen", neu.length, neu.filter(function (l) { return l.dringend; }).length + " davon dringend") +
        kpi("Offene Angebote", euro.format(summe(angebote)), angebote.length + " Angebote") +
        kpi("Heute nachfassen", faellig.length, state.autoNachfassen ? "läuft automatisch" : "automatisch: aus") +
        kpi("Aufträge", euro.format(summe(auftraege)), auftraege.length + " Aufträge") +
      "</div>" +
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
          '<section class="panel" aria-labelledby="kanal-h"><h2 id="kanal-h">Anfragen nach Kanal</h2><div class="bars">' +
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
    "</button>";
  }
  function viewAnfragen() {
    var q = state.suche.toLowerCase();
    var list = state.leads.filter(function (l) {
      return (state.filter === "alle" || l.kanal === state.filter) &&
             (!q || (l.name + " " + l.ort + " " + l.betreff).toLowerCase().indexOf(q) > -1);
    });
    var filterBtns = [["alle", "Alle"]].concat(Object.keys(KANAL).map(function (k) { return [k, KANAL[k].label]; }))
      .map(function (f) { return '<button type="button" data-filter="' + f[0] + '" aria-pressed="' + (state.filter === f[0]) + '">' + f[1] + "</button>"; }).join("");

    $main.innerHTML =
      '<div class="view-head"><div><h1>Anfragen</h1><p>Alle Kanäle an einem Ort. Tippen Sie auf eine Anfrage für Details.</p></div>' +
        '<div class="view-actions"><button class="btn btn-signal" type="button" data-simulate>+ Neue Anfrage simulieren</button></div></div>' +
      '<div class="toolbar"><input class="search" id="suche" type="search" placeholder="Suchen: Name, Ort, Auftrag …" aria-label="Anfragen durchsuchen" value="' + esc(state.suche) + '">' +
        '<div class="filter" role="group" aria-label="Nach Kanal filtern">' + filterBtns + "</div></div>" +
      '<div class="board-wrap" id="board"><div class="board">' +
        STAGES.map(function (s) {
          var items = list.filter(function (l) { return l.stage === s.id; });
          var sum = items.reduce(function (a, l) { return a + l.wert; }, 0);
          return '<section class="col" aria-label="' + s.label + '"><div class="col-head"><h2>' + s.label + ' <span class="count">' + items.length + "</span></h2><small>" + euro.format(sum) + "</small></div>" +
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
  function nachfassText(l) {
    return anrede(l.name) + ",\n\nich wollte kurz nachfragen, ob Sie unser Angebot für „" + l.betreff + "“ schon anschauen konnten. " +
      "Haben Sie noch Fragen? Ich rufe Sie auch gern an.\n\nViele Grüße\n" + BETRIEB;
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
              "<small>Angebot vor " + l.angebotVor + " Tagen · " + info + "</small></div>" +
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
  function viewKunden() {
    var q = state.suche.toLowerCase();
    var ausLeads = state.leads.map(function (l) {
      return { name: l.name, ort: l.ort, art: l.stage === "auftrag" || l.stage === "erledigt" ? "bestand" : "anfrage",
               info: l.betreff + " · " + STAGES.filter(function (s) { return s.id === l.stage; })[0].label, leadId: l.id,
               umsatz: l.stage === "auftrag" || l.stage === "erledigt" ? l.wert : 0 };
    });
    var alle = ausLeads.concat(state.kunden.map(function (k, i) { return Object.assign({ idx: i }, k); }));
    var list = alle.filter(function (k) {
      return (state.kundenFilter === "alle" || k.art === state.kundenFilter) && (!q || (k.name + " " + k.ort).toLowerCase().indexOf(q) > -1);
    });
    var f = [["alle", "Alle"], ["bestand", "Bestandskunden"], ["alt", "Alte Angebote"], ["anfrage", "Interessenten"]]
      .map(function (x) { return '<button type="button" data-kfilter="' + x[0] + '" aria-pressed="' + (state.kundenFilter === x[0]) + '">' + x[1] + "</button>"; }).join("");

    $main.innerHTML =
      '<div class="view-head"><div><h1>Kunden</h1><p>Alle Kunden an einem Ort – und alte Angebote, die sich wieder lohnen.</p></div></div>' +
      '<div class="toolbar"><input class="search" id="ksuche" type="search" placeholder="Kunden suchen …" aria-label="Kunden durchsuchen" value="' + esc(state.suche) + '">' +
        '<div class="filter" role="group" aria-label="Kunden filtern">' + f + "</div></div>" +
      '<div class="rows" id="kunden-liste">' +
        list.map(function (k) {
          var btn = "";
          if (k.leadId) btn = '<button class="btn-mini" type="button" data-open="' + k.leadId + '">Öffnen</button>';
          else if (k.erledigt) btn = '<span class="pill ok">' + svg(ICON.check) + "Gesendet</span>";
          else btn = '<button class="btn-mini primary" type="button" data-kunde="' + k.idx + '">' + k.aktion + "</button>";
          var tag = k.art === "alt" ? '<span class="pill check">Reaktivierbar</span>' : k.art === "bestand" ? '<span class="pill ok">Bestandskunde</span>' : '<span class="pill">Interessent</span>';
          return '<div class="row"><div class="row-main"><strong>' + esc(k.name) + "</strong><small>" + esc(k.ort) + " · " + esc(k.info) + "</small></div>" +
            '<div class="row-side">' + tag + (k.umsatz ? '<span class="amount">' + euro.format(k.umsatz) + "</span>" : "") + btn + "</div></div>";
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
    if (act === "nachfassen") return nachfassen(l, true);
    if (act === "bewertung") return bewertung(l);
    closeDrawer();
    lastFocus = document.activeElement;

    var stage = STAGES.filter(function (s) { return s.id === l.stage; })[0].label;
    var actions = "";
    if (l.stage === "neu") actions = btn("angebot", "Angebot senden (" + euro.format(l.wert) + ")", "btn-signal") + btn("anrufen", "Termin vereinbaren", "btn-outline");
    if (l.stage === "angebot") actions = btn("nachfassen", "Jetzt nachfassen", "btn-signal") + btn("auftrag", "Auftrag erhalten", "btn-outline");
    if (l.stage === "auftrag") actions = btn("erledigt", "Als erledigt markieren", "btn-signal");
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
      "</div>" +
      (l.denkt ? '<div class="ki-box"><h3><span class="pill thinking">KI prüft …</span></h3><p>Die Anfrage wird gerade zusammengefasst.</p></div>' :
      '<div class="ki-box"><h3>' + svg(ICON.spark, "") .replace("<svg", '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2"') + 'KI-Einschätzung <span class="pill ' + KI[l.ki].cls + '">' + KI[l.ki].label.replace("KI: ", "") + "</span></h3>" +
        "<p>" + esc(l.kiText) + '</p><p class="rec">' + esc(l.kiRec) + "</p></div>") +
      '<div><p class="sec-title">Nachricht des Kunden</p><p class="quote">' + esc(l.nachricht) + "</p></div>" +
      '<div><p class="sec-title">Verlauf</p><ul class="timeline">' +
        verlauf.map(function (e) { return "<li>" + esc(e.text) + "<small>" + vorTagen(e.t) + "</small></li>"; }).join("") + "</ul></div>" +
      '<div class="drawer-actions">' + actions + "</div>";

    document.body.appendChild(back);
    document.body.appendChild(d);
    document.body.style.overflow = "hidden";
    d.querySelector("[data-close]").focus();

    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-do]");
      if (e.target.closest("[data-close]")) return closeDrawer();
      if (!b) return;
      var what = b.getAttribute("data-do");
      if (what === "angebot") { l.stage = "angebot"; l.angebotVor = 0; l.erinnert = 0; l.dringend = false; add(l, "Angebot über " + euro.format(l.wert) + " gesendet"); toast("Angebot an " + l.name + " gesendet. Erinnerungen laufen automatisch."); }
      if (what === "anrufen") { add(l, "Termin vereinbart"); l.dringend = false; toast("Termin mit " + l.name + " eingetragen."); }
      if (what === "nachfassen") return nachfassen(l, false);
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
    toast("Erinnerung an " + l.name + " gesendet (Demo – es wurde nichts verschickt).");
    render();
    if (!ausListe) openLead(l.id);
  }
  function bewertung(l) {
    l.bewertung = "angefragt";
    add(l, "Bitte um Google-Bewertung gesendet");
    toast("Bewertungsanfrage an " + l.name + " gesendet (Demo).");
    render();
  }
  function closeDrawer() {
    document.querySelectorAll(".drawer, .drawer-backdrop").forEach(function (el) { el.remove(); });
    document.body.style.overflow = "";
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  /* =====================================================================
     5. NEUE ANFRAGE SIMULIEREN (zeigt die KI-Vorprüfung)
     ===================================================================== */
  function simulieren() {
    var vorlage = NEUE_ANFRAGEN[state.pool % NEUE_ANFRAGEN.length];
    state.pool++;
    var l = Object.assign({}, vorlage, { id: Date.now(), stage: "neu", tage: 0, denkt: true, frisch: true });
    l.verlauf = [{ t: 0, text: "Anfrage per " + KANAL[l.kanal].label + " eingegangen" }];
    state.leads.unshift(l);
    toast("Neue Anfrage per " + KANAL[l.kanal].label + ": " + l.name + " – die KI prüft …");
    if (state.view !== "anfragen") state.view = "anfragen";
    render();
    setTimeout(function () {
      l.denkt = false;
      add(l, "KI-Vorprüfung: " + KI[l.ki].label.replace("KI: ", ""));
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
  var TERMINE = [
    { tag: "Heute", zeit: "08:00", art: "Ausführung", name: "Familie Brandl", ort: "Erlangen", wer: "Michael, Tobias", info: "Heizungstausch, Tag 2 von 3" },
    { tag: "Heute", zeit: "14:30", art: "Besichtigung", name: "Familie Huber", ort: "Erlangen", wer: "Stefan (Außendienst)", info: "Badsanierung, Fotos liegen vor", offen: true },
    { tag: "Morgen", zeit: "09:00", art: "Wartung", name: "Georg Hofbauer", ort: "Erlangen", wer: "Tobias", info: "Jährliche Wartung Gasheizung" },
    { tag: "Morgen", zeit: "13:00", art: "Notdienst", name: "Thomas Bauer", ort: "Fürth", wer: "Michael", info: "Heizung ausgefallen", offen: true },
    { tag: "Donnerstag", zeit: "10:00", art: "Besichtigung", name: "WEG Regnitzstraße 12", ort: "Erlangen", wer: "Stefan (Außendienst)", info: "Strangsanierung, 18 Einheiten" }
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
  var BEWERBER = [
    { name: "Daniel S.", stelle: "Anlagenmechaniker SHK", info: "Geselle, 6 Jahre Erfahrung, Führerschein B", passt: true, wann: "heute" },
    { name: "Lea M.", stelle: "Auszubildende SHK", info: "Mittlere Reife, Praktikum im Handwerk", passt: true, wann: "gestern" },
    { name: "Kevin R.", stelle: "Anlagenmechaniker SHK", info: "Quereinsteiger, kein Gesellenbrief", passt: false, wann: "vor 3 Tagen" }
  ];
  var mod;
  function resetModule() {
    var cp = function (a) { return a.map(function (x) { return Object.assign({}, x); }); };
    mod = { rechnungen: cp(RECHNUNGEN), termine: cp(TERMINE), aus: cp(AUSSCHREIBUNGEN), netz: cp(NETZWERK), bew: cp(BEWERBER) };
  }
  resetModule();

  function head(titel, text, quelle) {
    return '<div class="view-head"><div><h1>' + titel + "</h1><p>" + text + "</p>" + (quelle ? '<p class="src">' + quelle + "</p>" : "") + "</div></div>";
  }

  /* --- Rechnungen --- */
  function viewRechnungen() {
    var offen = mod.rechnungen.filter(function (r) { return r.status !== "bezahlt"; });
    var ueber = offen.filter(function (r) { return r.faellig > 0; });
    var sum = function (a) { return a.reduce(function (s, r) { return s + r.betrag; }, 0); };
    $main.innerHTML = head("Rechnungen", "Wer muss noch zahlen? Zahlungserinnerungen sind vorbereitet, Sie geben sie frei.",
        '<span class="pill ok">verbunden</span> Daten aus Ihrem Rechnungsprogramm (z. B. Lexware Office, sevDesk). Rechnungen schreiben Sie weiter dort.') +
      '<div class="kpis" id="rg-kpis">' +
        kpi("Offen", euro.format(sum(offen)), offen.length + " Rechnungen") +
        kpi("Überfällig", euro.format(sum(ueber)), ueber.length + " Rechnungen") +
        kpi("Heute bezahlt", euro.format(sum(mod.rechnungen.filter(function (r) { return r.status === "bezahlt"; }))), "automatisch zugeordnet") +
        kpi("Ø Zahlungsdauer", "11 Tage", "Ziel: 14 Tage") +
      "</div>" +
      '<div class="rows" id="rg-liste">' + mod.rechnungen.map(function (r, i) {
        var st = r.status === "bezahlt" ? '<span class="pill ok">bezahlt</span>' :
                 r.faellig > 0 ? '<span class="pill no">' + r.faellig + " Tage überfällig</span>" : '<span class="pill">fällig in ' + (-r.faellig) + " Tagen</span>";
        var btn = r.status === "bezahlt" ? "" : r.faellig > 0 ?
          '<button class="btn-mini primary" type="button" data-rg="' + i + '">' + (r.erinnert ? (r.erinnert + 1) + ". Erinnerung freigeben" : "Erinnerung freigeben") + "</button>" :
          '<button class="btn-mini" type="button" data-rgpaid="' + i + '">Als bezahlt markieren</button>';
        return '<div class="row"><div class="row-main"><strong>' + esc(r.name) + " · " + r.nr + "</strong><small>" + (r.info || (r.erinnert ? r.erinnert + " Erinnerung gesendet" : "noch keine Erinnerung")) + "</small></div>" +
          '<div class="row-side">' + st + '<span class="amount">' + euro.format(r.betrag) + "</span>" + btn + "</div></div>";
      }).join("") + "</div>";
  }

  /* --- Termine --- */
  function viewTermine() {
    var tage = [];
    mod.termine.forEach(function (t) { if (tage.indexOf(t.tag) < 0) tage.push(t.tag); });
    $main.innerHTML = head("Termine", "Besichtigungen, Ausführung und Wartung – mit Mitarbeiter. Bestätigungen an Kunden sind vorbereitet.",
        '<span class="pill ok">verbunden</span> Ihr Google- oder Outlook-Kalender · Mitarbeiter sehen ihre Termine auf dem Handy.') +
      '<div class="panel-grid" id="termine">' + tage.map(function (tag) {
        return '<section class="panel"><h2>' + tag + '</h2><div class="rows">' + mod.termine.map(function (t, i) {
          if (t.tag !== tag) return "";
          return '<div class="row"><div class="row-main"><strong>' + t.zeit + " · " + t.art + ": " + esc(t.name) + "</strong><small>" + esc(t.ort) + " · " + esc(t.info) + " · " + esc(t.wer) + "</small></div>" +
            '<div class="row-side">' + (t.offen ? '<button class="btn-mini primary" type="button" data-ts="' + i + '">Bestätigung an Kunden senden</button>' : '<span class="pill ok">' + svg(ICON.check) + "bestätigt</span>") + "</div></div>";
        }).join("") + "</div></section>";
      }).join("") + "</div>";
  }

  /* --- Ausschreibungen --- */
  function viewAusschreibungen() {
    $main.innerHTML = head("Ausschreibungen", "Passende öffentliche Aufträge für Ihr Gewerk und Ihre Region – mit Eignungsprüfung, bevor Sie Zeit investieren.",
        "Quellen: Datenservice Öffentlicher Einkauf (oeffentlichevergabe.de) und EU-Amtsblatt TED · täglich aktualisiert") +
      '<div class="rows" id="aus-liste">' + mod.aus.map(function (a, i) {
        var p = a.eignung === "passt" ? '<span class="pill ok">passt gut</span>' : '<span class="pill check">prüfen</span>';
        return '<div class="row"><div class="row-main"><strong>' + esc(a.titel) + "</strong><small>" + esc(a.stelle) + " · " + a.wert + " · Frist in " + a.frist + " Tagen<br>" + esc(a.grund) + "</small></div>" +
          '<div class="row-side">' + p + (a.gemerkt ? '<span class="pill ok">' + svg(ICON.check) + "auf der Liste</span>" : '<button class="btn-mini primary" type="button" data-aus="' + i + '">Unterlagen anfordern</button>') + "</div></div>";
      }).join("") + "</div>";
  }

  /* --- Netzwerk / Vermittlung --- */
  function viewNetzwerk() {
    $main.innerHTML = head("Aufträge aus dem Netzwerk", "Hausverwaltungen und Bauherren suchen Fachbetriebe. Den Vertrag schließen Sie direkt mit dem Auftraggeber.",
        "Kein Monatsbeitrag. Provision nur, wenn Sie den Auftrag bekommen.") +
      '<div class="rows" id="netz-liste">' + mod.netz.map(function (n, i) {
        return '<div class="row"><div class="row-main"><strong>' + esc(n.titel) + "</strong><small>" + esc(n.von) + " · " + esc(n.ort) + " · " + esc(n.info) + "<br>Provision bei Auftrag: " + Math.round(n.prov * 100) + " % = " + euro.format(n.wert * n.prov) + "</small></div>" +
          '<div class="row-side"><span class="amount">' + euro.format(n.wert) + "</span>" +
          (n.gemeldet ? '<span class="pill ok">' + svg(ICON.check) + "Interesse gemeldet</span>" : '<button class="btn-mini primary" type="button" data-netz="' + i + '">Interesse melden</button>') + "</div></div>";
      }).join("") + "</div>";
  }

  /* --- Personal --- */
  function viewPersonal() {
    $main.innerHTML = head("Mitarbeitersuche", "Stellenanzeigen und Bewerbungen an einem Ort. Antworten sind vorbereitet – entscheiden tun immer Sie.") +
      '<div class="kpis">' + kpi("Offene Stellen", "2", "Anlagenmechaniker, Azubi") + kpi("Bewerbungen", String(mod.bew.length), "diese Woche") +
        kpi("Anzeige läuft auf", "3 Kanälen", "Website, Jobbörse, Instagram") + kpi("Antwortzeit", "unter 24 h", "schnelle Antwort zählt") + "</div>" +
      '<div class="rows" id="bew-liste">' + mod.bew.map(function (b, i) {
        var p = b.passt ? '<span class="pill ok">Muss-Kriterien erfüllt</span>' : '<span class="pill check">Kriterien prüfen</span>';
        return '<div class="row"><div class="row-main"><strong>' + esc(b.name) + " · " + esc(b.stelle) + "</strong><small>" + esc(b.info) + " · Bewerbung " + b.wann + "</small></div>" +
          '<div class="row-side">' + p + (b.erledigt ? '<span class="pill ok">' + svg(ICON.check) + "beantwortet</span>" :
            '<button class="btn-mini primary" type="button" data-bew="' + i + '">' + (b.passt ? "Gespräch vorschlagen" : "Freundlich absagen") + "</button>") + "</div></div>";
      }).join("") + "</div>";
  }

  /* --- Vorlesen (Morgenbericht) --- */
  function vorlesen() {
    if (!("speechSynthesis" in window)) return toast("Ihr Browser kann leider nicht vorlesen.");
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    var el = document.getElementById("briefing");
    if (!el) return;
    var copy = el.cloneNode(true);
    copy.querySelectorAll("button, .briefing-note, h2").forEach(function (b) { b.remove(); });
    var text = "Guten Morgen. " + copy.textContent.replace(/\s+/g, " ").replace(/Schon erledigt/, ". Schon erledigt: ").replace(/Zur Freigabe bereit/, ". Zur Freigabe bereit: ").replace(/€/g, " Euro");
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = 1;
    var v = speechSynthesis.getVoices().filter(function (x) { return /^de/i.test(x.lang); });
    if (v.length) u.voice = v.filter(function (x) { return /Anna|Petra|Helena|Katja|Google/i.test(x.name); })[0] || v[0];
    speechSynthesis.speak(u);
    toast("Der Morgenbericht wird vorgelesen. Nochmal tippen zum Stoppen.");
  }

  /* =====================================================================
     8. MONTEURE: Handy-Ansicht mit Tagesplan und digitalem Regiebericht
     ===================================================================== */
  var MONTEUR = "Michael";
  var BERICHTE = [
    { nr: "RB-0412", baustelle: "Familie Brandl, Erlangen", monteur: "Michael, Tobias", datum: "gestern", stunden: 15, material: "Brennwerttherme, Abgasrohr 2 m", status: "Rechnung vorbereitet" },
    { nr: "RB-0411", baustelle: "Georg Hofbauer, Erlangen", monteur: "Tobias", datum: "vor 2 Tagen", stunden: 1.5, material: "Dichtungssatz", status: "abgerechnet" }
  ];
  var ZEITEN = [
    { name: "Michael", beginn: "07:00", baustelle: "Familie Brandl", stunden: "läuft" },
    { name: "Tobias", beginn: "07:00", baustelle: "Familie Brandl", stunden: "läuft" },
    { name: "Sandra (Azubi)", beginn: "07:30", baustelle: "Lager / Werkstatt", stunden: "läuft" }
  ];
  var mt;
  function resetMonteur() {
    mt = { tab: "heute", berichte: BERICHTE.map(function (b) { return Object.assign({}, b); }), fotos: 0, unterschrift: false, diktiert: false, nr: 413 };
  }
  resetMonteur();

  function phoneHeute() {
    var heute = mod.termine.filter(function (t) { return t.tag === "Heute" && /Michael|Tobias/.test(t.wer); });
    return '<div class="ph-msg"><b>Guten Morgen, ' + MONTEUR + '.</b> Heute: ' + heute.length + ' Einsatz' + (heute.length === 1 ? "" : "e") +
        ". Erster Termin 08:00 bei Familie Brandl in Erlangen (Tag 2 von 3). Material liegt im Lager bereit: Abgasrohr, Kondensatpumpe.</div>" +
      '<h4>Heute</h4><ul class="ph-list">' + heute.map(function (t) {
        return "<li><b>" + t.zeit + " · " + esc(t.name) + "</b><small>" + esc(t.ort) + " · " + esc(t.info) + "</small>" +
          '<span class="ph-actions"><button class="btn-mini" type="button" data-mt="navi">Navigation</button><button class="btn-mini" type="button" data-mt="anruf">Kunde anrufen</button><button class="btn-mini primary" type="button" data-mt="regie">Regiebericht</button></span></li>';
      }).join("") + "</ul>" +
      '<h4>Arbeitszeit</h4><div class="ph-zeit"><span>Eingestempelt seit 07:00</span><button class="btn-mini" type="button" data-mt="pause">Pause</button></div>' +
      '<h4>Baustellen-Doku</h4><div class="ph-zeit"><span>Fotos, Mängel, Abnahme</span><button class="btn-mini" type="button" data-mt="foto">Foto aufnehmen</button></div>';
  }
  function phoneRegie() {
    var fotos = ""; for (var i = 0; i < mt.fotos; i++) fotos += '<span class="ph-foto" aria-label="Foto ' + (i + 1) + '">Foto ' + (i + 1) + "</span>";
    return '<form class="ph-form" id="regie-form" novalidate>' +
      '<div class="field"><label for="rg-bs">Baustelle</label><select id="rg-bs"><option>Familie Brandl, Erlangen</option><option>Familie Huber, Erlangen</option><option>Thomas Bauer, Fürth</option></select></div>' +
      '<div class="ph-row"><div class="field"><label for="rg-von">von</label><input id="rg-von" type="time" value="07:00"></div><div class="field"><label for="rg-bis">bis</label><input id="rg-bis" type="time" value="15:30"></div><div class="field"><label for="rg-p">Pause</label><select id="rg-p"><option>30 Min.</option><option>45 Min.</option><option>keine</option></select></div></div>' +
      '<div class="field"><label for="rg-wer">Mitarbeiter</label><input id="rg-wer" value="Michael, Tobias"></div>' +
      '<div class="field"><label for="rg-txt">Ausgeführte Arbeiten <button class="btn-mini" type="button" data-mt="diktat">' + svg(ICON.sound) + "Diktieren</button></label>" +
        '<textarea id="rg-txt" placeholder="Was wurde gemacht?">' + (mt.diktiert ? "Alte Gastherme demontiert und entsorgt. Neue Brennwerttherme montiert, Abgasleitung angeschlossen, Kondensatpumpe gesetzt. Anlage befüllt, entlüftet und in Betrieb genommen. Kunde eingewiesen." : "") + "</textarea></div>" +
      '<div class="field"><label>Material</label><div class="ph-mat"><input aria-label="Material 1" value="Abgasrohr DN 80, 2 m"><input aria-label="Menge 1" value="1" inputmode="numeric"></div><div class="ph-mat"><input aria-label="Material 2" value="Kondensatpumpe"><input aria-label="Menge 2" value="1" inputmode="numeric"></div></div>' +
      '<div class="field"><label>Fotos</label><div class="ph-fotos">' + fotos + '<button class="btn-mini" type="button" data-mt="foto">+ Foto</button></div></div>' +
      '<div class="field"><label for="sig">Unterschrift Kunde</label><canvas id="sig" class="ph-sig" width="600" height="180" aria-label="Unterschriftenfeld: mit Finger oder Maus unterschreiben"></canvas>' +
        '<div class="ph-row"><input id="rg-kunde" aria-label="Name des Kunden" placeholder="Name des Kunden" value="Familie Brandl"><button class="btn-mini" type="button" data-mt="sig-clear">Löschen</button></div></div>' +
      '<button class="btn btn-signal" type="button" data-mt="senden" style="width:100%">Bericht abschließen &amp; senden</button>' +
      '<p class="ph-hint">Der Kunde bekommt den Bericht als PDF per E-Mail, das Büro sieht ihn sofort.</p></form>';
  }

  function viewMonteure() {
    mt.unterschrift = false;
    $main.innerHTML = head("Monteure", "Die Handy-Ansicht Ihrer Mitarbeiter: Tagesplan am Morgen, Regiebericht mit Unterschrift direkt beim Kunden, Aufmaß, Formulare, Arbeitszeit und Fotos. Die ersten 2 Monteure kostenlos, jeder weitere 25 € im Monat.") +
      '<div class="panel-grid two mt-grid">' +
        '<section class="panel" aria-labelledby="ph-h"><h2 id="ph-h">So sieht es ' + MONTEUR + ' auf dem Handy</h2>' +
          '<div class="phone" id="phone"><div class="ph-top"><b>' + esc(BETRIEB) + '</b><small>' + MONTEUR + " · Monteur</small></div>" +
            '<div class="ph-tabs three" role="tablist">' + [["heute", "Heute"], ["aufmass", "Aufmaß"], ["formulare", "Formulare"]].map(function (t) {
              return '<button type="button" role="tab" data-mt="tab-' + t[0] + '" aria-selected="' + (mt.tab === t[0] || (t[0] === "formulare" && mt.tab === "regie")) + '">' + t[1] + "</button>"; }).join("") + "</div>" +
            '<div class="ph-body">' + ({ heute: phoneHeute, aufmass: phoneAufmass, formulare: phoneFormulare, regie: phoneRegie })[mt.tab]() + "</div></div>" +
        "</section>" +
        '<div class="panel-grid">' +
          (ex.angebot ? '<section class="panel" id="am-angebot"><h2>Angebotsentwurf aus dem Aufmaß</h2><div class="rows">' + ex.angebot.pos.map(function (p) {
              return '<div class="row"><div class="row-main"><strong>' + p[0] + "</strong><small>" + zahl(p[1]) + " m² × " + euro.format(p[2]) + '</small></div><div class="row-side"><span class="amount">' + euro.format(p[1] * p[2]) + "</span></div></div>"; }).join("") +
            '<div class="row"><div class="row-main"><strong>Sanitär-Pauschale (Dusche, WC, Waschtisch)</strong><small>aus Vorlage</small></div><div class="row-side"><span class="amount">' + euro.format(9800) + "</span></div></div>" +
            '</div><p class="src">Summe netto <b>' + euro.format(ex.angebot.summe) + '</b> · liegt im Cockpit zur Freigabe, der Kunde sieht es im <button class="btn-mini" type="button" data-go="portal">Kundenportal</button></p></section>' : "") +
          '<section class="panel" aria-labelledby="rb-h" id="rb-panel"><h2 id="rb-h">Im Büro eingegangen</h2><div class="rows">' +
            mt.berichte.map(function (b) {
              return '<div class="row"><div class="row-main"><strong>' + b.nr + " · " + esc(b.baustelle) + "</strong><small>" + esc(b.monteur) + " · " + (b.stunden != null ? b.stunden.toString().replace(".", ",") + " Std. · " : "") + esc(b.material) + " · " + b.datum + "</small></div>" +
                '<div class="row-side"><span class="pill ' + (b.status === "abgerechnet" ? "" : "ok") + '">' + b.status + "</span></div></div>";
            }).join("") +
          '</div><p class="src">Aus jedem Regiebericht wird automatisch eine Rechnungsvorlage mit Stunden und Material – Sie prüfen und geben frei.</p></section>' +
          '<section class="panel" aria-labelledby="az-h"><h2 id="az-h">Arbeitszeit heute</h2><div class="rows">' +
            ZEITEN.map(function (z) { return '<div class="row"><div class="row-main"><strong>' + esc(z.name) + "</strong><small>seit " + z.beginn + " · " + esc(z.baustelle) + '</small></div><div class="row-side"><span class="pill ok">' + z.stunden + "</span></div></div>"; }).join("") +
          "</div></section>" +
        "</div>" +
      "</div>";
    initSignatur();
    if (mt.tab === "aufmass") amSumme();
  }

  function initSignatur() {
    var c = document.getElementById("sig");
    if (!c) return;
    var ctx = c.getContext("2d"), drawing = false;
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = getComputedStyle(document.body).color || "#111";
    function pos(e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; }
    c.addEventListener("pointerdown", function (e) { drawing = true; c.setPointerCapture(e.pointerId); var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); });
    c.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); mt.unterschrift = true; });
    c.addEventListener("pointerup", function () { drawing = false; });
    c.addEventListener("pointercancel", function () { drawing = false; });
  }

  function monteurAktion(a, el) {
    if (a.indexOf("tab-") === 0) { mt.tab = a.slice(4); ex.form = null; return viewMonteure(); }
    if (a === "am-raum") { ex.raeume.push({ name: "Raum " + (ex.raeume.length + 1), l: 3, b: 3, h: 2.5, abzug: 2 }); return viewMonteure(); }
    if (a === "am-angebot") { var an = aufmassAngebot(); viewMonteure(); var e2 = document.getElementById("am-angebot"); if (e2) { e2.classList.add("flash"); e2.scrollIntoView({ block: "nearest" }); }
      return toast("Aufmaß übernommen: Angebotsentwurf über " + euro.format(an.summe) + " für Familie Huber erstellt."); }
    if (a === "fo-open") { var v = findeVorlage(el.getAttribute("data-id")); if (v.id === "regie") { mt.tab = "regie"; return viewMonteure(); } ex.form = v; return viewMonteure(); }
    if (a === "fo-zurueck") { ex.form = null; return viewMonteure(); }
    if (a === "fo-senden") {
      if (!mt.unterschrift) return toast("Bitte den Kunden im Feld unterschreiben lassen.");
      var n = document.querySelectorAll("[data-fo]:checked").length;
      mt.berichte.unshift({ nr: "FO-0" + (mt.nr++), baustelle: ex.form.name, monteur: MONTEUR, datum: "gerade eben", stunden: null, material: n + " von " + ex.form.punkte.length + " Punkten erledigt · unterschrieben", status: "neu · PDF erstellt" });
      var name = ex.form.name; ex.form = null; viewMonteure();
      document.getElementById("rb-panel").classList.add("flash");
      return toast(name + " abgeschlossen: PDF an Kunde und Büro gesendet (Demo).");
    }
    if (a === "regie") { mt.tab = "regie"; mt.unterschrift = false; return viewMonteure(); }
    if (a === "navi") return toast("Navigation zur Baustelle wird geöffnet (Demo).");
    if (a === "anruf") return toast("Kunde wird angerufen (Demo).");
    if (a === "pause") return toast("Pause gestartet. Die Zeit wird automatisch erfasst.");
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
      mt.berichte.unshift({ nr: "RB-0" + (mt.nr++), baustelle: document.getElementById("rg-bs").value, monteur: wer, datum: "gerade eben",
        stunden: Math.round(std * personen * 100) / 100, material: "Abgasrohr DN 80, Kondensatpumpe" + (mt.fotos ? " · " + mt.fotos + " Fotos" : ""), status: "neu · Rechnung vorbereitet" });
      mt.tab = "heute"; mt.fotos = 0; mt.unterschrift = false; mt.diktiert = false;
      viewMonteure();
      document.getElementById("rb-panel").classList.add("flash");
      return toast("Regiebericht unterschrieben: PDF an den Kunden gesendet, im Büro angekommen (Demo).");
    }
  }

  /* =====================================================================
     9. ROLLEN, AUFMASS, FORMULARE, WARTUNG, KUNDENPORTAL
     ===================================================================== */
  // Welche Bereiche sieht welche Rolle?
  var ROLLEN = {
    gf:      { label: "Geschäftsführung", views: null },   // null = alles
    buero:   { label: "Büro", views: ["uebersicht", "anfragen", "nachfassen", "kunden", "rechnungen", "termine", "monteure", "wartung", "portal", "ausschreibungen", "netzwerk", "personal"] },
    aussen:  { label: "Außendienst", views: ["uebersicht", "anfragen", "nachfassen", "kunden", "termine", "monteure", "wartung", "portal"] },
    monteur: { label: "Monteur", views: ["monteure"] }
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
      { id: "maengel", name: "Mängelliste", punkte: ["Mangel beschrieben", "Foto aufgenommen", "Frist zur Behebung vereinbart"] }
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
    { kunde: "Familie Brandl", ort: "Erlangen", anlage: "neue Brennwerttherme (nach Einbau)", faellig: "in 11 Monaten", preis: 189, art: "Wartung", neu: true }
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
    var jahr = ex.wartung.reduce(function (s, w) { return s + w.preis; }, 0);
    $main.innerHTML = head("Wartung & Prüffristen", "Wartungsverträge und Prüffristen Ihrer Kunden. Das System erinnert rechtzeitig und schlägt Termine vor – planbarer Umsatz für Sie.") +
      '<div class="kpis">' + kpi("Wartungsverträge", String(ex.wartung.length), "aktiv") + kpi("Umsatz pro Jahr", euro.format(jahr), "aus Verträgen") +
        kpi("Fällig in 30 Tagen", String(ex.wartung.filter(function (w) { return /Woche|Tagen|überfällig/.test(w.faellig); }).length), "Termine vorschlagen") +
        kpi("Neu nach Einbau", "1", "automatisch angelegt") + "</div>" +
      '<div class="rows" id="wartung-liste">' + ex.wartung.map(function (w, i) {
        var p = w.faellig === "überfällig" ? '<span class="pill no">überfällig</span>' : /Woche|Tagen/.test(w.faellig) ? '<span class="pill check">' + w.faellig + "</span>" : '<span class="pill">' + w.faellig + "</span>";
        var btn = w.erledigt ? '<span class="pill ok">' + svg(ICON.check) + "Termin vorgeschlagen</span>" :
          /Woche|Tagen|überfällig/.test(w.faellig) ? '<button class="btn-mini primary" type="button" data-wt="' + i + '">Termin vorschlagen</button>' : "";
        return '<div class="row"><div class="row-main"><strong>' + esc(w.kunde) + " · " + w.art + "</strong><small>" + esc(w.anlage) + " · " + esc(w.ort) + (w.neu ? " · neu angelegt nach dem Einbau" : "") + "</small></div>" +
          '<div class="row-side">' + p + '<span class="amount">' + euro.format(w.preis) + "</span>" + btn + "</div></div>";
      }).join("") + "</div>";
  }

  /* --- Kundenportal (Sicht des Endkunden) --- */
  function viewPortal() {
    var schritte = [["Anfrage", true], ["Besichtigung", true], ["Aufmaß", true], ["Angebot", ex.portal !== "angebot"], ["Auftrag", ex.portal === "auftrag"], ["Ausführung", false], ["Abnahme", false]];
    var aktiv = ex.portal === "angebot" ? 3 : 5;
    $main.innerHTML = head("Kundenportal", "So sieht Ihr Kunde seinen Auftrag – per Link auf dem Handy, ohne App und ohne Passwort. Das spart Anrufe und Nachfragen.") +
      '<div class="panel-grid two"><section class="panel portal" id="portal" aria-labelledby="po-h">' +
        '<p class="src">' + esc(BETRIEB) + "</p><h2 id=\"po-h\">Hallo Familie Huber,</h2><p>hier sehen Sie jederzeit den Stand Ihrer Badsanierung.</p>" +
        '<ol class="po-steps">' + schritte.map(function (s, i) { return '<li class="' + (s[1] ? "done" : i === aktiv ? "now" : "") + '">' + s[0] + "</li>"; }).join("") + "</ol>" +
        (ex.portal === "angebot" ?
          '<div class="po-box"><b>Ihr Angebot liegt bereit</b><p>' + (ex.angebot ? euro.format(ex.angebot.summe) + " · erstellt aus dem Aufmaß vom " + ex.angebot.datum : "18.500 € · Badsanierung komplett") + '</p><div class="btn-row"><button class="btn btn-signal" type="button" data-po="annehmen">Angebot annehmen &amp; unterschreiben</button><button class="btn btn-outline" type="button" data-po="frage">Frage stellen</button></div></div>' :
          '<div class="po-box"><b>Vielen Dank für Ihren Auftrag!</b><p>Wunschtermin für den Start: <b>KW 46</b>. Sie bekommen eine Bestätigung, sobald der Termin feststeht.</p></div>') +
        '<h3>Ihre Unterlagen</h3><ul class="po-docs"><li>Angebot (PDF)</li><li>Aufmaß Bad und Gäste-WC (PDF)</li><li>Fotos der Besichtigung</li></ul>' +
      "</section>" +
      '<section class="panel"><h2>Was der Betrieb davon hat</h2><ul class="checklist" style="margin-top:8px">' +
        "<li><span>Weniger Anrufe: Der Kunde sieht Status, Termin und Unterlagen selbst.</span></li>" +
        "<li><span>Schnellere Zusage: Angebot online annehmen und unterschreiben.</span></li>" +
        "<li><span>Profi-Auftritt: Ihr Name, Ihre Farben, kein fremdes Portal.</span></li>" +
        "<li><span>Fragen landen direkt beim Auftrag im Cockpit.</span></li></ul></section></div>";
  }

  /* --- Geschäftsführung: Kennzahlen auf der Übersicht --- */
  function gfPanel() {
    return '<section class="panel gf-panel" aria-labelledby="gf-h"><h2 id="gf-h">Geschäftszahlen · nur für die Geschäftsführung</h2><div class="kpis">' +
      kpi("Umsatz Oktober", "38.400 €", "+12 % zum Vorjahr") + kpi("Offene Posten", euro.format(mod.rechnungen.filter(function (r) { return r.status !== "bezahlt"; }).reduce(function (s, r) { return s + r.betrag; }, 0)), "davon überfällig siehe Rechnungen") +
      kpi("Auslastung Team", "86 %", "nächste 2 Wochen") + kpi("Abschlussquote", "34 %", "Ziel 40 %") + "</div></section>";
  }

  function aufmassAngebot() {
    var s = summen();
    var pos = [["Bodenfliesen verlegen inkl. Material", s.boden, EP.boden], ["Wandfliesen verlegen inkl. Material", s.wand, EP.wand], ["Decke spachteln und streichen", s.decke, EP.decke]];
    var summe = pos.reduce(function (a, p) { return a + p[1] * p[2]; }, 0) + 9800;
    ex.angebot = { pos: pos, summe: Math.round(summe), datum: "heute" };
    var huber = state.leads.filter(function (l) { return l.name === "Familie Huber"; })[0];
    if (huber) { huber.stage = "angebot"; huber.wert = ex.angebot.summe; huber.angebotVor = 0; huber.erinnert = 0; huber.verlauf.push({ t: 0, text: "Aufmaß übernommen · Angebot über " + euro.format(ex.angebot.summe) + " erstellt" }); }
    return ex.angebot;
  }

  /* =====================================================================
     6. GEFÜHRTE TOUR
     ===================================================================== */
  var TOUR = [
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
    { view: "kunden", sel: "#kunden-liste", title: "Alte Angebote werden wieder zu Aufträgen",
      text: "Bestandskunden und nicht beauftragte Angebote werden gezielt wieder angesprochen – ohne Kosten pro Anfrage." },
    { view: "rechnungen", sel: "#rg-liste", title: "Wer muss noch zahlen?",
      text: "Offene Rechnungen aus Ihrem Rechnungsprogramm. Zahlungseingänge werden automatisch zugeordnet, Erinnerungen geben Sie mit einem Klick frei." },
    { view: "termine", sel: "#termine", title: "Termine und Team",
      text: "Alle Termine mit Mitarbeiter. Ihr Team sieht seine Termine auf dem Handy. Bestätigungen an Kunden sind vorbereitet." },
    { view: "uebersicht", sel: "#rolle", title: "Jeder sieht, was er braucht",
      text: "Wechseln Sie oben die Ansicht: Geschäftsführung sieht alles inklusive Geschäftszahlen, das Büro den Alltag, der Außendienst Kunden, Angebote und Aufmaß – und Monteure nur ihre Handy-App." },
    { view: "monteure", sel: "#phone", mt: "heute", title: "Für Ihre Monteure",
      text: "Auf dem Handy: Tagesplan am Morgen, Arbeitszeit, Fotos – und der Regiebericht direkt beim Kunden, mit Unterschrift auf dem Display. Probieren Sie es aus: Regiebericht öffnen, Diktieren, unterschreiben, senden." },
    { view: "monteure", sel: "#phone", mt: "aufmass", title: "Aufmaß direkt ins Angebot",
      text: "Maße je Raum eintragen, Flächen werden sofort berechnet. Ein Tipp auf „Ins Angebot übernehmen“ erstellt den Angebotsentwurf – probieren Sie es aus." },
    { view: "monteure", sel: "#phone", mt: "formulare", title: "Formulare für jede Branche",
      text: "Regiebericht, Abnahme, Wartung Heizung, E-Check, Montageprotokoll, Reinigungsnachweis … Wählen Sie Ihre Branche – jedes Formular mit Fotos und Unterschrift." },
    { view: "wartung", sel: "#wartung-liste", title: "Wartung und Prüffristen",
      text: "Wartungsverträge und Prüffristen Ihrer Kunden – das System erinnert rechtzeitig und schlägt Termine vor. Planbarer Umsatz für Sie." },
    { view: "portal", sel: "#portal", title: "Das Kundenportal",
      text: "Ihr Kunde sieht per Link Stand, Termin und Unterlagen – und nimmt das Angebot online an. Weniger Anrufe, schnellere Zusagen." },
    { view: "ausschreibungen", sel: "#aus-liste", title: "Öffentliche Aufträge finden",
      text: "Das Ausschreibungsradar sucht täglich passende Aufträge und prüft vorab, ob Sie die Anforderungen erfüllen." },
    { view: "netzwerk", sel: "#netz-liste", title: "Aufträge aus dem Netzwerk",
      text: "Hausverwaltungen und Bauherren suchen Fachbetriebe. Sie zahlen keinen Beitrag, nur eine Provision, wenn Sie den Auftrag bekommen." },
    { view: "personal", sel: "#bew-liste", title: "Mitarbeiter finden",
      text: "Bewerbungen an einem Ort, Antworten vorbereitet. Über Bewerber entscheiden immer Sie." },
    { view: "uebersicht", sel: null, title: "Jetzt sind Sie dran",
      text: "Klicken Sie sich frei durch die Demo. Wie das in Ihrem Betrieb aussehen würde, zeige ich Ihnen gern im kostenlosen Angebots-Check.", ende: true }
  ];
  var tourStep = -1;
  function tourShow(i) {
    tourEnd(true);
    tourStep = i;
    var s = TOUR[i];
    closeDrawer();
    if (i === 0 && state.rolle !== "gf") { state.rolle = "gf"; var rsel = document.getElementById("rolle"); if (rsel) rsel.value = "gf"; render(); }
    if (s.mt) { mt.tab = s.mt; ex.form = null; state.view = s.view; render(); }
    else if (state.view !== s.view) { state.view = s.view; render(); }
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
      (s.ende ? '<a class="btn btn-signal" href="kontakt.html">Angebots-Check</a>' : '<button class="btn btn-signal" type="button" data-tour-next>Weiter</button>') + "</div></div>";
    document.body.appendChild(card);
    (card.querySelector("[data-tour-next]") || card.querySelector("a.btn")).focus({ preventScroll: true });
  }
  function tourEnd(silent) {
    document.querySelectorAll(".tour-dim, .tour-card").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".tour-focus").forEach(function (el) { el.classList.remove("tour-focus"); });
    if (!silent) tourStep = -1;
  }

  /* =====================================================================
     KLICKS VERTEILEN
     ===================================================================== */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var el;
    if ((el = t.closest("[data-view]"))) return go(el.getAttribute("data-view"));
    if ((el = t.closest("[data-go]"))) return go(el.getAttribute("data-go"));
    if (t.closest("[data-simulate]")) return simulieren();
    if (t.closest("[data-tour]") || t.closest("#tour-start")) return tourShow(0);
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
    if (t.closest("[data-vorlesen]")) return vorlesen();
    if ((el = t.closest("[data-mt]"))) return monteurAktion(el.getAttribute("data-mt"), el);
    if ((el = t.closest("[data-wt]"))) { var wt = ex.wartung[+el.getAttribute("data-wt")]; wt.erledigt = true; toast("Terminvorschlag für die " + wt.art + " an " + wt.kunde + " gesendet (Demo)."); return viewWartung(); }
    if ((el = t.closest("[data-po]"))) {
      if (el.getAttribute("data-po") === "frage") return toast("Die Frage landet direkt beim Auftrag im Cockpit (Demo).");
      ex.portal = "auftrag";
      var hu = state.leads.filter(function (l) { return l.name === "Familie Huber"; })[0]; if (hu) { hu.stage = "auftrag"; hu.verlauf.push({ t: 0, text: "Angebot im Kundenportal angenommen und unterschrieben" }); }
      toast("Familie Huber hat das Angebot online angenommen – der Auftrag ist im Cockpit (Demo)."); renderNav(); return viewPortal();
    }
    if ((el = t.closest("[data-rg]"))) { var r = mod.rechnungen[+el.getAttribute("data-rg")]; r.erinnert = (r.erinnert || 0) + 1; r.faellig = -14; r.info = r.erinnert + ". Erinnerung heute gesendet · neue Frist 14 Tage"; toast("Zahlungserinnerung an " + r.name + " gesendet (Demo)."); renderNav(); return viewRechnungen(); }
    if ((el = t.closest("[data-rgpaid]"))) { var r2 = mod.rechnungen[+el.getAttribute("data-rgpaid")]; r2.status = "bezahlt"; r2.info = "Zahlung manuell bestätigt"; toast(r2.name + ": als bezahlt markiert."); return viewRechnungen(); }
    if ((el = t.closest("[data-ts]"))) { var tm = mod.termine[+el.getAttribute("data-ts")]; tm.offen = false; toast("Terminbestätigung an " + tm.name + " gesendet (Demo)."); return viewTermine(); }
    if ((el = t.closest("[data-aus]"))) { var au = mod.aus[+el.getAttribute("data-aus")]; au.gemerkt = true; toast("Unterlagen für „" + au.titel + "“ werden angefordert (Demo)."); return viewAusschreibungen(); }
    if ((el = t.closest("[data-netz]"))) { var nz = mod.netz[+el.getAttribute("data-netz")]; nz.gemeldet = true; toast("Interesse an „" + nz.titel + "“ gemeldet. Der Auftraggeber meldet sich (Demo)."); return viewNetzwerk(); }
    if ((el = t.closest("[data-bew]"))) { var bw = mod.bew[+el.getAttribute("data-bew")]; bw.erledigt = true; toast((bw.passt ? "Gesprächsvorschlag an " : "Absage an ") + bw.name + " gesendet (Demo)."); return viewPersonal(); }
    if ((el = t.closest("[data-open]")) && !t.closest(".drawer")) return openLead(+el.getAttribute("data-open"), el.getAttribute("data-act"));
    if (t.closest("#reset")) { reset(); resetModule(); resetMonteur(); resetErweiterung(); var rs = document.getElementById("rolle"); if (rs) rs.value = "gf"; if (window.speechSynthesis) speechSynthesis.cancel(); closeDrawer(); tourEnd(); render(); toast("Demo zurückgesetzt."); }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-am")) {
      var r = ex.raeume[+t.getAttribute("data-am")], k = t.getAttribute("data-k");
      if (k === "name") { r.name = t.value; return; }
      r[k] = Math.max(0, parseFloat(String(t.value).replace(",", ".")) || 0);
      var f = flaechen(r), i = t.getAttribute("data-am");
      document.getElementById("am-erg-" + i).textContent = "Boden " + zahl(f.boden) + " m² · Wände " + zahl(f.wand) + " m² · Decke " + zahl(f.decke) + " m²";
      amSumme();
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "fo-branche") { ex.branche = t.value; return viewMonteure(); }
    if (t.id === "rolle") {
      state.rolle = t.value; closeDrawer(); tourEnd();
      if (!erlaubt(state.view)) state.view = (ROLLEN[state.rolle].views || ["uebersicht"])[0];
      render(); window.scrollTo(0, 0);
      toast("Ansicht: " + ROLLEN[state.rolle].label + " – " + ({ gf: "alles inklusive Geschäftszahlen.", buero: "alles für den Büroalltag, ohne Geschäftszahlen.", aussen: "Kunden, Angebote, Aufmaß und Termine.", monteur: "nur die Handy-App für die Baustelle." })[state.rolle]);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (document.querySelector(".tour-card")) return tourEnd();
    if (document.querySelector(".drawer")) closeDrawer();
  });

  // Start
  reset();
  render();
  // Tour direkt starten, wenn die Seite mit demo.html#tour geöffnet wird
  if (location.hash === "#tour") setTimeout(function () { tourShow(0); }, 300);
})();
