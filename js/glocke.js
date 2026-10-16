/* =====================================================================
   BENACHRICHTIGUNGEN (Glocke oben rechts) für alle Demos
   Reiter „Mitteilungen“ (je Rolle) und „Neu im Cockpit“.
   Welche Demo: <body data-glocke="handwerk|hv|makler">. Alles erfunden.
   Ein Klick auf eine Mitteilung löst [data-view] aus – das erledigt die Demo selbst.
   ===================================================================== */
(function () {
  "use strict";
  var typ = document.body.getAttribute("data-glocke"); if (!typ) return;
  var IC = {
    anfrage: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    geld: '<path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/>',
    stift: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    warn: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    kal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    stern: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    neu: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>',
    haus: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
  };
  var DATEN = {
    handwerk: {
      rollen: {
        gf: [["anfrage", "Neue Anfrage per WhatsApp: Familie Huber", "Badsanierung, 3 Fotos · KI: passt gut", "vor 5 Min.", "anfragen"],
             ["geld", "Zahlung eingegangen: Familie Obermeier", "16.900 € · automatisch zugeordnet", "vor 40 Min.", "rechnungen"],
             ["stift", "Auftrag unterschrieben: Familie Brandl", "11.600 € · vor Ort auf dem Handy", "vor 1 Std.", "kunden"],
             ["warn", "Freistellungsbescheinigung abgelaufen", "Nachunternehmer Elektro Lang", "heute 6:00", "fristen"],
             ["person", "Neue Bewerbung: Daniel S.", "Anlagenmechaniker SHK · Muss-Kriterien erfüllt", "gestern", "personal"],
             ["stern", "Neue Google-Bewertung: 5 Sterne", "Familie Obermeier · Antwortvorschlag liegt bereit", "gestern", "kunden"]],
        buero: [["anfrage", "Neue Anfrage per WhatsApp: Familie Huber", "Badsanierung, 3 Fotos · KI: passt gut", "vor 5 Min.", "anfragen"],
             ["stift", "Regiebericht RB-0412 wartet auf Freigabe", "Max Lechner · 2,5 Std. · Rechnungsvorlage fertig", "vor 30 Min.", "monteure"],
             ["geld", "2 Zahlungserinnerungen zur Freigabe", "Johann Forster, Hausverwaltung Kaya", "heute 6:03", "rechnungen"],
             ["kal", "Termin verschoben: Anton Wagner", "Wartung jetzt Donnerstag 14:00", "gestern", "termine"]],
        aussen: [["anfrage", "Neue Anfrage in Ihrem Gebiet: Familie Huber", "Erlangen · Badsanierung · Besichtigung vorschlagen", "vor 5 Min.", "anfragen"],
             ["kal", "Morgen 9:00: Aufmaß Familie Huber", "Fotos und Notizen liegen in der Kundenakte", "vor 1 Std.", "termine"],
             ["stift", "Angebot angesehen: Johann Forster", "6.900 € · zum 2. Mal geöffnet", "gestern", "nachfassen"]],
        monteur: [["kal", "Neuer Einsatz morgen 8:00", "Familie Brandl · Heizungstausch, Tag 3", "vor 20 Min.", "monteure"],
             ["haus", "Material liegt bereit", "Kondensatpumpe und Abgasrohr in der Werkstatt", "vor 1 Std.", "monteure"],
             ["person", "Nachricht vom Büro", "„Bitte Fotos vom Zählerstand machen“", "gestern", "monteure"]],
        betreiber: [["anfrage", "Neue Anfrage im Auftragsportal", "Heizung, Schwabach · Note A", "vor 10 Min.", "vermittlung"],
             ["stift", "Betrieb hat angenommen", "Haustechnik Lang · Bad im Mieterwechsel", "vor 2 Std.", "vermittlung"]]
      },
      neu: [["Abläufe als Arbeitsfläche", "Bausteine anklicken, Daten ansehen und Testlauf starten.", "17.10.", "ablaeufe"],
            ["Vertriebsquoten", "Von der Anfrage bis zum Auftrag – je Person, Kanal und Leistung, mit Zielen.", "16.10.", "vertrieb"],
            ["Finanz-Cockpit", "Kontostand für 90 Tage, Rücklage für Steuern, Belege an den Steuerberater.", "16.10.", "finanzen"],
            ["Material & Bestellung", "Bestellliste aus den Aufträgen, Lager im Firmenwagen.", "16.10.", "material"],
            ["Pflichten & Fristen", "Prüfungen, Unterweisungen und Nachweise der Nachunternehmer.", "16.10.", "fristen"],
            ["Online-Terminbuchung", "Kunden buchen freie Zeiten selbst – im Grundpreis.", "16.10.", "termine"]]
    },
    hv: {
      rollen: {
        verwaltung: [["warn", "Neue Meldung: Wasser tropft von der Decke", "Schwabacher Straße 14 · Whg. 3 · dringend", "vor 20 Min.", "meldungen"],
             ["anfrage", "Neue Meldung: Heizung bleibt kalt", "Am Röthelheimpark 3 · Whg. 11", "vor 2 Std.", "meldungen"],
             ["stift", "Haustechnik Lang hat angenommen", "Termin mit der Mietpartei Donnerstag", "vor 3 Std.", "meldungen"],
             ["kal", "Rauchwarnmelder überfällig", "Am Röthelheimpark 3 · seit 4 Tagen", "heute 6:00", "fristen"],
             ["geld", "3 Angebote für die Fassade liegen vor", "Lindenhof 7–9 · Vergleich bereit", "gestern", "handwerker"]],
        mieter: [["stift", "Handwerker beauftragt", "Haustechnik Lang meldet sich heute", "vor 1 Std.", "portal"]],
        handwerk: [["anfrage", "Neuer Auftrag von Musterverwaltung Franken", "Schwabacher Straße 14 · Whg. 3", "vor 15 Min.", "auftrag"]]
      },
      neu: [["Angebote vergleichen", "Drei Angebote nebeneinander, Vorlage für die Eigentümer.", "17.10.", "handwerker"],
            ["Mieterportal", "Mietparteien sehen den Stand ihrer Meldung – ohne Anrufe.", "17.10.", "portal"],
            ["Bericht für Eigentümer", "Kosten nach Kategorie und Meldungen pro Monat als PDF.", "17.10.", "eigentuemer"]]
    },
    makler: {
      rollen: {
        makler: [["anfrage", "Neue Anfrage über das Immobilienportal", "Alex Hoffmann · 3-Zimmer-Wohnung · Finanzierung geklärt", "vor 15 Min.", "anfragen"],
             ["kal", "Besichtigung selbst gebucht", "Sam Richter · Reihenhaus · heute 17:30", "vor 1 Std.", "besichtigungen"],
             ["stern", "Rückmeldung nach Besichtigung", "Jo Lehmann: sehr interessiert", "vor 3 Std.", "nachfassen"],
             ["haus", "Eigentümerbericht bereit", "Reihenhaus Herzogenaurach · Oktober", "heute 6:00", "bericht"]],
        eigentuemer: [["haus", "Neuer Bericht zu Ihrem Objekt", "11 Besichtigungen, 1 Angebot", "heute 6:00", "bericht"]],
        interessent: [["kal", "Neue Termine frei", "Reihenhaus mit Garten · Samstag", "vor 1 Std.", "buchung"]]
      },
      neu: [["Buchungsseite", "Interessenten buchen Besichtigungen selbst.", "17.10.", "buchung"],
            ["Eigentümerbericht", "Aufrufe bis Angebote und Rückmeldungen – monatlich automatisch.", "17.10.", "bericht"],
            ["Handwerker für Käufer", "Kontakte aus dem Netzwerk – mit Einwilligung.", "17.10.", "handwerker"]]
    }
  };
  var D = DATEN[typ], liste = [], gelesenNeu = false, reiter = "mit", offen = false, nId = 1;
  var rolle = function () { var s = document.getElementById("rolle"); return s && s.value ? s.value : Object.keys(D.rollen)[0]; };
  function laden() {
    var r = D.rollen[rolle()] || [];
    liste = r.map(function (m, i) { return { id: nId++, ic: m[0], text: m[1], sub: m[2], zeit: m[3], view: m[4], ungelesen: i < Math.min(3, r.length) }; });
  }
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // Knopf in die Kopfleiste
  var tt = document.querySelector(".app-top .theme-toggle"); if (!tt) return;
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "glocke"; btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false");
  tt.parentNode.insertBefore(btn, tt);
  var panel = document.createElement("div"); panel.className = "glocke-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Mitteilungen"); panel.hidden = true;
  document.body.appendChild(panel);

  function zahl() { return liste.filter(function (m) { return m.ungelesen; }).length + (gelesenNeu ? 0 : 1); }
  function knopf() {
    var z = zahl();
    btn.innerHTML = svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>') + (z ? '<span class="glocke-z">' + z + "</span>" : "");
    btn.setAttribute("aria-label", z ? z + " ungelesene Mitteilungen" : "Mitteilungen");
  }
  function zeichnen() {
    var un = liste.filter(function (m) { return m.ungelesen; }).length;
    panel.innerHTML = '<div class="gl-kopf"><div class="gl-tabs" role="tablist">' +
        '<button type="button" role="tab" data-gl-tab="mit" aria-selected="' + (reiter === "mit") + '">Mitteilungen' + (un ? " <b>" + un + "</b>" : "") + "</button>" +
        '<button type="button" role="tab" data-gl-tab="neu" aria-selected="' + (reiter === "neu") + '">Neu im Cockpit' + (gelesenNeu ? "" : ' <i class="gl-punkt"></i>') + "</button></div>" +
        (reiter === "mit" && un ? '<button type="button" class="gl-alle" data-gl-alle>Alle gelesen</button>' : "") + "</div>" +
      (reiter === "mit" ?
        '<ul class="gl-liste">' + (liste.length ? liste.map(function (m) {
          return '<li><button type="button" class="gl-item' + (m.ungelesen ? " un" : "") + '" data-gl-id="' + m.id + '" data-view="' + m.view + '"><span class="gl-ic gl-' + m.ic + '">' + svg(IC[m.ic]) + '</span><span class="gl-txt"><b>' + esc(m.text) + "</b><small>" + esc(m.sub) + '</small><small class="gl-zeit">' + m.zeit + "</small></span></button></li>";
        }).join("") : '<li class="gl-leer">Keine Mitteilungen</li>') + "</ul>" :
        '<ul class="gl-liste">' + D.neu.map(function (n) {
          return '<li class="gl-neu"><span class="gl-ic gl-neu-ic">' + svg(IC.neu) + '</span><span class="gl-txt"><b>' + n[0] + '</b><small>' + n[1] + '</small><small class="gl-zeit">' + n[2] + '</small></span><button type="button" class="btn-mini" data-view="' + n[3] + '" data-gl-zu>Ansehen</button></li>';
        }).join("") + "</ul>");
    knopf();
  }
  function auf() { offen = true; panel.hidden = false; btn.setAttribute("aria-expanded", "true"); if (reiter === "neu") gelesenNeu = true; zeichnen(); }
  function zu() { offen = false; panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }

  btn.addEventListener("click", function (e) { e.stopPropagation(); offen ? zu() : auf(); });
  panel.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-gl-tab]"))) { e.stopPropagation(); reiter = el.getAttribute("data-gl-tab"); if (reiter === "neu") gelesenNeu = true; return zeichnen(); }
    if (t.closest("[data-gl-alle]")) { e.stopPropagation(); liste.forEach(function (m) { m.ungelesen = false; }); return zeichnen(); }
    if ((el = t.closest("[data-gl-id]"))) { var m = liste.filter(function (x) { return x.id === +el.getAttribute("data-gl-id"); })[0]; if (m) m.ungelesen = false; knopf(); zu(); return; }   // [data-view] erledigt die Demo
    if (t.closest("[data-gl-zu]")) { zu(); return; }
  });
  document.addEventListener("click", function (e) { if (offen && !panel.contains(e.target) && e.target !== btn) zu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && offen) { zu(); btn.focus(); } });
  document.addEventListener("change", function (e) { if (e.target.id === "rolle") { laden(); zeichnen(); } });

  // Von außen: neue Mitteilung (z. B. simulierte Anfrage)
  window.Glocke = {
    push: function (ic, text, sub, view) {
      liste.unshift({ id: nId++, ic: ic, text: text, sub: sub, zeit: "gerade eben", view: view, ungelesen: true });
      zeichnen(); btn.classList.remove("wackelt"); void btn.offsetWidth; btn.classList.add("wackelt");
    },
    reset: function () { gelesenNeu = false; laden(); zeichnen(); }
  };
  laden(); zeichnen();
})();
