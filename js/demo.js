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
    { name: "Familie Huber", ort: "Landshut", kanal: "whatsapp", betreff: "Badsanierung, ca. 8 m²", wert: 18500, stage: "neu", tage: 0,
      tel: "0151 000 0001", mail: "huber@beispiel.de",
      nachricht: "Hallo, wir möchten unser Bad (ca. 8 m²) komplett sanieren, gerne mit bodengleicher Dusche. Wann hätten Sie Zeit für eine Besichtigung? Fotos schicke ich mit.",
      ki: "passt", kiText: "Komplettsanierung Bad, ca. 8 m², bodengleiche Dusche gewünscht. 4 Fotos vorhanden. Ort liegt im Einzugsgebiet (12 km).",
      kiRec: "Empfehlung: Besichtigungstermin diese Woche anbieten." },
    { name: "Thomas Bauer", ort: "Freising", kanal: "telefon", betreff: "Heizung ausgefallen", wert: 450, stage: "neu", tage: 0, dringend: true,
      tel: "0151 000 0002", mail: "t.bauer@beispiel.de",
      nachricht: "(Anruf, vom Telefonassistenten aufgenommen) Heizung geht seit heute früh nicht mehr, Display zeigt Fehler F28. Bin ab 16 Uhr erreichbar.",
      ki: "passt", kiText: "Störung Gasheizung, Fehler F28 (Zündung). Kunde ab 16 Uhr erreichbar. Dringend: Haushalt ohne Heizung.",
      kiRec: "Empfehlung: Heute zurückrufen und Notdienst-Termin vereinbaren." },
    { name: "Sabine Wimmer", ort: "Moosburg", kanal: "email", betreff: "Heizungswartung", wert: 260, stage: "neu", tage: 1,
      tel: "0151 000 0003", mail: "s.wimmer@beispiel.de",
      nachricht: "Guten Tag, ich hätte gern einen Termin für die jährliche Wartung unserer Gasheizung, gerne im Oktober.",
      ki: "passt", kiText: "Jährliche Wartung Gasheizung, Wunschzeitraum Oktober. Planbarer Auftrag.",
      kiRec: "Empfehlung: Wartungstermin mit anderen Terminen in Moosburg bündeln." },
    { name: "WEG Isarstraße 12", ort: "Landshut", kanal: "formular", betreff: "Strangsanierung, 18 Einheiten", wert: 85000, stage: "neu", tage: 2,
      tel: "0871 000 0004", mail: "verwaltung@beispiel.de",
      nachricht: "Für die Eigentümergemeinschaft suchen wir ein Angebot für die Strangsanierung (Trinkwasser und Abwasser) in 18 Wohnungen. Ausführung frühestens im Frühjahr.",
      ki: "pruefen", kiText: "Großprojekt (18 Einheiten), Ausführung Frühjahr. Eventuell mehrere Angebote angefragt.",
      kiRec: "Empfehlung: Kapazität im Frühjahr prüfen, dann Begehung vereinbaren." },
    { name: "Max Lechner", ort: "Erding", kanal: "formular", betreff: "Wasserhahn tropft", wert: 90, stage: "neu", tage: 1,
      tel: "0151 000 0005", mail: "m.lechner@beispiel.de",
      nachricht: "Mein Küchenwasserhahn tropft. Können Sie vorbeikommen?",
      ki: "passtnicht", kiText: "Kleinauftrag, 38 km Anfahrt. Lohnt sich eher nicht.",
      kiRec: "Empfehlung: Freundlich absagen oder mit einem anderen Termin in Erding verbinden." },

    { name: "Familie Maier", ort: "Landshut", kanal: "whatsapp", betreff: "Badsanierung", wert: 14200, stage: "angebot", tage: 13, angebotVor: 9, erinnert: 1,
      tel: "0151 000 0006", mail: "maier@beispiel.de", nachricht: "Wir interessieren uns für ein neues Bad mit Badewanne und Dusche.",
      ki: "passt", kiText: "Badsanierung mit Wanne und Dusche, ca. 10 m².", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },
    { name: "Petra Schmid", ort: "Vilsbiburg", kanal: "email", betreff: "Wärmepumpe statt Ölheizung", wert: 24800, stage: "angebot", tage: 8, angebotVor: 4, erinnert: 1,
      tel: "0151 000 0007", mail: "p.schmid@beispiel.de", nachricht: "Wir möchten unsere alte Ölheizung durch eine Wärmepumpe ersetzen.",
      ki: "passt", kiText: "Tausch Ölheizung gegen Wärmepumpe, Einfamilienhaus Baujahr 1995.", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },
    { name: "Johann Forster", ort: "Dingolfing", kanal: "telefon", betreff: "Gäste-WC erneuern", wert: 6900, stage: "angebot", tage: 21, angebotVor: 16, erinnert: 2,
      tel: "0151 000 0008", mail: "j.forster@beispiel.de", nachricht: "Gäste-WC soll komplett erneuert werden.",
      ki: "passt", kiText: "Gäste-WC komplett, ca. 3 m².", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },
    { name: "Andrea Kraus", ort: "Ergolding", kanal: "formular", betreff: "Heizkörper tauschen", wert: 3400, stage: "angebot", tage: 4, angebotVor: 2, erinnert: 0,
      tel: "0151 000 0009", mail: "a.kraus@beispiel.de", nachricht: "Fünf alte Heizkörper sollen getauscht werden.",
      ki: "passt", kiText: "Tausch von 5 Heizkörpern, Reihenhaus.", kiRec: "Angebot gesendet – automatische Erinnerungen laufen." },

    { name: "Familie Brandl", ort: "Landshut", kanal: "whatsapp", betreff: "Heizungstausch", wert: 11600, stage: "auftrag", tage: 30,
      tel: "0151 000 0010", mail: "brandl@beispiel.de", nachricht: "Neue Gasbrennwerttherme gewünscht.",
      ki: "passt", kiText: "Tausch Gastherme gegen Brennwertgerät.", kiRec: "Auftrag läuft – Ausführung nächste Woche." },
    { name: "Martin Reiter", ort: "Altdorf", kanal: "email", betreff: "Neue Badarmaturen", wert: 1250, stage: "auftrag", tage: 12,
      tel: "0151 000 0011", mail: "m.reiter@beispiel.de", nachricht: "Bitte Armaturen in Bad und Küche erneuern.",
      ki: "passt", kiText: "Armaturen Bad und Küche.", kiRec: "Auftrag läuft." },

    { name: "Claudia Fischer", ort: "Kumhausen", kanal: "telefon", betreff: "Wartung Heizung", wert: 320, stage: "erledigt", tage: 18, bewertung: "offen",
      tel: "0151 000 0012", mail: "c.fischer@beispiel.de", nachricht: "Jährliche Wartung.",
      ki: "passt", kiText: "Wartung Gasheizung.", kiRec: "Erledigt – jetzt um eine Bewertung bitten." },
    { name: "Familie Obermeier", ort: "Essenbach", kanal: "whatsapp", betreff: "Badsanierung", wert: 16900, stage: "erledigt", tage: 60, bewertung: "erhalten",
      tel: "0151 000 0013", mail: "obermeier@beispiel.de", nachricht: "Komplettes Bad im Obergeschoss.",
      ki: "passt", kiText: "Badsanierung Obergeschoss.", kiRec: "Erledigt – Bewertung erhalten." }
  ];

  // Bestandskunden und alte Angebote (für „Kunden“ → Reaktivierung)
  var START_KUNDEN = [
    { name: "Georg Hofbauer", ort: "Landshut", art: "bestand", info: "Letzte Wartung vor 14 Monaten", aktion: "Wartung anbieten", umsatz: 7400 },
    { name: "Anton Wagner", ort: "Tiefenbach", art: "bestand", info: "Heizung eingebaut vor 7 Jahren", aktion: "Wartung anbieten", umsatz: 9800 },
    { name: "Familie Stadler", ort: "Adlkofen", art: "alt", info: "Angebot Bad (12.300 €) vor 1 Jahr, nicht beauftragt", aktion: "Reaktivieren", umsatz: 0 },
    { name: "Renate Engl", ort: "Bruckberg", art: "alt", info: "Angebot Wärmepumpe (21.500 €) vor 8 Monaten, nicht beauftragt", aktion: "Reaktivieren", umsatz: 0 },
    { name: "Stefan Huber", ort: "Ergolding", art: "alt", info: "Angebot Gäste-WC (5.800 €) vor 5 Monaten, nicht beauftragt", aktion: "Reaktivieren", umsatz: 0 }
  ];

  // Mögliche neue Anfragen für „Neue Anfrage simulieren“
  var NEUE_ANFRAGEN = [
    { name: "Julia Gruber", ort: "Landshut", kanal: "whatsapp", betreff: "Dusche undicht", wert: 1800,
      tel: "0151 000 0020", mail: "j.gruber@beispiel.de",
      nachricht: "Hallo! Unsere Dusche ist seit ein paar Tagen undicht, unten kommt Wasser raus. Ich schick Ihnen gleich zwei Fotos. Wann könnten Sie mal schauen?",
      ki: "passt", kiText: "Undichte Dusche, vermutlich Silikonfuge oder Ablauf. 2 Fotos vorhanden. Ort im Einzugsgebiet (4 km).",
      kiRec: "Empfehlung: Kurzfristigen Termin anbieten – Folgeschäden möglich." },
    { name: "Bernhard Seidl", ort: "Altdorf", kanal: "telefon", betreff: "Wärmepumpe – Beratung", wert: 26000,
      tel: "0151 000 0021", mail: "b.seidl@beispiel.de",
      nachricht: "(Anruf, vom Telefonassistenten aufgenommen) Möchte sich zu einer Wärmepumpe beraten lassen, Haus Baujahr 2002, aktuell Gasheizung.",
      ki: "passt", kiText: "Beratung Wärmepumpe, Einfamilienhaus Baujahr 2002, Gasheizung vorhanden. Förderung wahrscheinlich Thema.",
      kiRec: "Empfehlung: Vor-Ort-Beratung anbieten." },
    { name: "Laura Neumaier", ort: "Velden", kanal: "email", betreff: "Kleines Bad modernisieren", wert: 9500,
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
    spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>'
  };
  var VIEWS = [
    { id: "uebersicht", label: "Übersicht", icon: ICON.home },
    { id: "anfragen", label: "Anfragen", icon: ICON.inbox },
    { id: "nachfassen", label: "Nachfassen", icon: ICON.bell },
    { id: "kunden", label: "Kunden", icon: ICON.users }
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
    var counts = { anfragen: neueAnfragen().length, nachfassen: faelligNachfassen().length };
    var html = VIEWS.map(function (v) {
      var c = counts[v.id] ? '<span class="count">' + counts[v.id] + "</span>" : "";
      return '<button type="button" data-view="' + v.id + '"' + (state.view === v.id ? ' aria-current="page"' : "") + ">" +
             svg(v.icon) + "<span>" + v.label + "</span>" + c + "</button>";
    }).join("");
    document.getElementById("side-nav").innerHTML = html;
    document.getElementById("app-tabs").innerHTML = html;
  }

  function render() {
    renderNav();
    ({ uebersicht: viewUebersicht, anfragen: viewAnfragen, nachfassen: viewNachfassen, kunden: viewKunden })[state.view]();
  }

  function go(view) {
    state.view = view;
    state.suche = "";
    render();
    window.scrollTo(0, 0);
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
      '<div class="view-head"><div><h1>' + gruss + ".</h1><p>" + BETRIEB + " · Beispieldaten</p></div>" +
        '<div class="view-actions"><button class="btn btn-signal" type="button" data-simulate>+ Neue Anfrage simulieren</button></div></div>' +
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
     6. GEFÜHRTE TOUR
     ===================================================================== */
  var TOUR = [
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
    { view: "uebersicht", sel: null, title: "Jetzt sind Sie dran",
      text: "Klicken Sie sich frei durch die Demo. Wie das in Ihrem Betrieb aussehen würde, zeige ich Ihnen gern im kostenlosen Angebots-Check.", ende: true }
  ];
  var tourStep = -1;
  function tourShow(i) {
    tourEnd(true);
    tourStep = i;
    var s = TOUR[i];
    closeDrawer();
    if (state.view !== s.view) { state.view = s.view; render(); }
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
    if ((el = t.closest("[data-open]")) && !t.closest(".drawer")) return openLead(+el.getAttribute("data-open"), el.getAttribute("data-act"));
    if (t.closest("#reset")) { reset(); closeDrawer(); tourEnd(); render(); toast("Demo zurückgesetzt."); }
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
