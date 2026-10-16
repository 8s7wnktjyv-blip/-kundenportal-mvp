/* =====================================================================
   DEMO HAUSVERWALTUNG – alle Namen, Adressen und Beträge sind erfunden.
   Läuft mit js/demo-mini.js. Nichts wird gespeichert oder verschickt.
   ===================================================================== */
(function () {
  "use strict";
  var I = {
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    haus: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
    uhr: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    werk: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    bericht: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    handy: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    tropfen: '<path d="M12 2.7S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.3-7-12.3z"/>'
  };
  var OBJEKTE = [
    { id: "o1", name: "Schwabacher Straße 14", ort: "Fürth", we: 12, baujahr: 1972, eigent: "WEG Schwabacher Str. 14", kosten: 18400, budget: 24000 },
    { id: "o2", name: "Am Röthelheimpark 3", ort: "Erlangen", we: 24, baujahr: 2004, eigent: "WEG Röthelheimpark 3", kosten: 26900, budget: 30000 },
    { id: "o3", name: "Lindenhof 7–9", ort: "Nürnberg", we: 8, baujahr: 1958, eigent: "Eigentümer: Familie Seidl", kosten: 9800, budget: 12000 },
    { id: "o4", name: "Bahnhofstraße 21", ort: "Herzogenaurach", we: 6, baujahr: 1991, eigent: "WEG Bahnhofstr. 21", kosten: 4300, budget: 8000 }
  ];
  var HW = [
    { id: "h1", name: "Haustechnik Lang", gewerk: "Sanitär/Heizung", reakt: "2 Std.", offen: 2, note: "4,8", rahmen: true },
    { id: "h2", name: "Elektro Yilmaz", gewerk: "Elektro", reakt: "4 Std.", offen: 1, note: "4,7", rahmen: true },
    { id: "h3", name: "Malerbetrieb Brunner", gewerk: "Maler", reakt: "1 Tag", offen: 1, note: "4,6", rahmen: false },
    { id: "h4", name: "Dach & Rinne Kraus", gewerk: "Dach", reakt: "1 Tag", offen: 0, note: "4,5", rahmen: false },
    { id: "h5", name: "Schlüsseldienst Maier", gewerk: "Schlüssel/Tür", reakt: "1 Std.", offen: 0, note: "4,9", rahmen: true }
  ];
  var START_MELD = [
    { id: 1, wer: "Mietpartei Whg. 3", obj: "o1", titel: "Wasser tropft von der Decke im Bad", kat: "Sanitär/Heizung", kanal: "WhatsApp", fotos: 2, dringend: true, st: "neu", t: "vor 20 Min." },
    { id: 2, wer: "Mietpartei Whg. 11", obj: "o2", titel: "Heizung im Kinderzimmer bleibt kalt", kat: "Sanitär/Heizung", kanal: "Formular", fotos: 1, st: "neu", t: "vor 2 Std." },
    { id: 3, wer: "Hausmeisterdienst", obj: "o2", titel: "Haustür schließt nicht richtig", kat: "Schlüssel/Tür", kanal: "App", fotos: 1, st: "neu", t: "heute 7:10" },
    { id: 4, wer: "Mietpartei Whg. 2", obj: "o3", titel: "Steckdose in der Küche ohne Strom", kat: "Elektro", kanal: "Telefon (Assistent)", fotos: 0, st: "beauftragt", hw: "h2", t: "gestern" },
    { id: 5, wer: "Beirat", obj: "o1", titel: "Treppenhaus 2. OG: Wasserfleck an der Wand", kat: "Maler", kanal: "E-Mail", fotos: 3, st: "arbeit", hw: "h3", t: "vor 3 Tagen" },
    { id: 6, wer: "Mietpartei Whg. 5", obj: "o4", titel: "Dachrinne läuft über", kat: "Dach", kanal: "Formular", fotos: 2, st: "arbeit", hw: "h4", t: "vor 4 Tagen" },
    { id: 7, wer: "Mietpartei Whg. 18", obj: "o2", titel: "WC-Spülung läuft nach", kat: "Sanitär/Heizung", kanal: "WhatsApp", fotos: 1, st: "erledigt", hw: "h1", t: "vor 5 Tagen" }
  ];
  var START_FRIST = [
    { was: "Rauchwarnmelder prüfen", obj: "o2", tage: -4, gewerk: "Elektro", hinweis: "jährlich" },
    { was: "Trinkwasser auf Legionellen untersuchen", obj: "o1", tage: 9, gewerk: "Sanitär/Heizung", hinweis: "alle 3 Jahre (Großanlage)" },
    { was: "Heizungswartung", obj: "o3", tage: 16, gewerk: "Sanitär/Heizung", hinweis: "jährlich laut Vertrag" },
    { was: "Aufzug: Hauptprüfung", obj: "o2", tage: 38, gewerk: "Aufzugsfirma", hinweis: "alle 2 Jahre" },
    { was: "Dachrinnen reinigen", obj: "o4", tage: 44, gewerk: "Dach", hinweis: "jeden Herbst" },
    { was: "Spielplatz-Sichtprüfung", obj: "o2", tage: 71, gewerk: "Hausmeisterdienst", hinweis: "vierteljährlich" }
  ];
  var KAT_KOSTEN = [["Sanitär/Heizung", 21400], ["Elektro", 6900], ["Maler", 5200], ["Dach", 4800], ["Hausmeister & Reinigung", 14600], ["Sonstiges", 6500]];
  var S;
  var obj = function (id) { return OBJEKTE.filter(function (o) { return o.id === id; })[0]; };
  var hw = function (id) { return HW.filter(function (h) { return h.id === id; })[0]; };
  var SPALTEN = [["neu", "Neu"], ["beauftragt", "Beauftragt"], ["arbeit", "In Arbeit"], ["erledigt", "Erledigt"]];

  window.MINI = {
    seite: "hausverwaltungen.html", start: "uebersicht",
    rollen: [["verwaltung", "Verwaltung", null], ["mieter", "Mietpartei (Portal)", ["portal"]], ["handwerk", "Handwerker (Auftrag)", ["auftrag"]]],
    gruppen: [["Alltag", ["uebersicht", "meldungen"]], ["Bestand", ["objekte", "fristen"]], ["Partner", ["handwerker", "auftrag"]], ["Berichte", ["eigentuemer"]], ["Portal", ["portal"]]],
    reset: function () {
      S = { meld: START_MELD.map(function (m) { return Object.assign({}, m); }), frist: START_FRIST.map(function (f) { return Object.assign({}, f); }), objSel: "o1", neuId: 100, portalSt: 1, angebote: null };
    },
    zahlen: function () { return { meldungen: S.meld.filter(function (m) { return m.st === "neu"; }).length, fristen: S.frist.filter(function (f) { return !f.ok && f.tage <= 30; }).length }; },
    views: {
      uebersicht: { label: "Übersicht", icon: I.home, render: function (H) {
        var neu = S.meld.filter(function (m) { return m.st === "neu"; }), dr = neu.filter(function (m) { return m.dringend; });
        var laufend = S.meld.filter(function (m) { return m.st === "beauftragt" || m.st === "arbeit"; });
        var max = Math.max.apply(null, OBJEKTE.map(function (o) { return S.meld.filter(function (m) { return m.obj === o.id && m.st !== "erledigt"; }).length; })) || 1;
        return '<section class="welcome" style="grid-template-columns:1fr"><h2>Demo für Hausverwaltungen</h2><p>Alles erfunden – oben bei „Ansicht als“ auch Mieterportal und Handwerker-Sicht.</p></section>' +
          H.head("Guten Morgen.", "Musterverwaltung Franken · 4 Objekte · 50 Wohnungen · Beispieldaten") +
          '<div class="kpis">' + H.kpi("Neue Meldungen", neu.length, dr.length + " davon dringend") + H.kpi("Bei Handwerkern", laufend.length, "beauftragt oder in Arbeit") +
            H.kpi("Fristen in 30 Tagen", S.frist.filter(function (f) { return !f.ok && f.tage <= 30; }).length, "inkl. überfällige") + H.kpi("Kosten Oktober", H.euro.format(8940), "über alle Objekte") + "</div>" +
          '<div class="panel-grid two"><section class="panel"><h2>Heute zu tun</h2><ul class="todo">' +
            (dr.length ? dr.map(function (m) { return '<li><span class="dot" style="background:#B42318"></span><span class="txt">' + H.esc(m.titel) + "<small>" + obj(m.obj).name + " · " + m.wer + '</small></span><button class="btn-mini primary" type="button" data-view="meldungen">Vergeben</button></li>'; }).join("") : "") +
            '<li><span class="dot"></span><span class="txt">Kostenvoranschlag Fassade freigeben<small>Lindenhof 7–9 · 3 Angebote liegen vor</small></span><button class="btn-mini" type="button" data-view="handwerker">Vergleichen</button></li>' +
            '<li><span class="dot" style="background:#E0A400"></span><span class="txt">Rauchwarnmelder überfällig<small>Am Röthelheimpark 3 · seit 4 Tagen</small></span><button class="btn-mini" type="button" data-view="fristen">Ansehen</button></li>' +
          '</ul></section><section class="panel"><h2>Offene Meldungen je Objekt</h2><div class="bars">' +
            OBJEKTE.map(function (o) { var n = S.meld.filter(function (m) { return m.obj === o.id && m.st !== "erledigt"; }).length; return '<div class="bar-row" style="grid-template-columns:minmax(0,1fr) 120px 24px"><span>' + o.name + '</span><span class="bar"><i style="width:' + n / max * 100 + '%"></i></span><b>' + n + "</b></div>"; }).join("") +
          '</div><p class="src" style="margin-top:12px">Mietparteien melden per WhatsApp, Formular oder Telefon. Die KI ordnet Objekt, Wohnung und Gewerk zu und erkennt Dringendes.</p></section></div>';
      } },
      meldungen: { label: "Meldungen", icon: I.inbox, render: function (H) {
        return H.head("Meldungen", "Alle Schadensmeldungen an einem Ort – vom Eingang bis zur Erledigung. Vergeben Sie mit einem Klick an Ihren Stammhandwerker.") +
          '<div class="view-actions" style="margin:-6px 0 14px"><button class="btn btn-signal" type="button" data-hv-sim>+ Neue Meldung per WhatsApp simulieren</button></div>' +
          '<div class="board-wrap"><div class="board hv-board">' + SPALTEN.map(function (sp) {
            var items = S.meld.filter(function (m) { return m.st === sp[0]; });
            return '<section class="col"><div class="col-head"><h2>' + sp[1] + "</h2><small>" + items.length + "</small></div>" + (items.length ? items.map(function (m) {
              var o = obj(m.obj), h = m.hw && hw(m.hw);
              var passend = HW.filter(function (x) { return x.gewerk === m.kat; })[0];
              var knopf = m.st === "neu" ? (passend ? '<button class="btn-mini primary" type="button" data-hv-vergabe="' + m.id + '">An ' + passend.name + " vergeben</button>" : '<button class="btn-mini" type="button" data-hv-vergabe="' + m.id + '">Handwerker wählen</button>') :
                m.st === "beauftragt" ? '<small class="hv-hinweis">Termin wird mit Mietpartei abgestimmt</small>' : m.st === "arbeit" ? '<button class="btn-mini" type="button" data-hv-fertig="' + m.id + '">Als erledigt bestätigen</button>' : '<span class="pill ok">' + H.svg(H.CHECK) + "Fotos vorher/nachher</span>";
              return '<article class="lead' + (m.neu ? " is-new" : "") + '"><div class="lead-top"><strong>' + H.esc(m.titel) + "</strong>" + (m.dringend ? '<span class="pill urgent">dringend</span>' : "") + "</div>" +
                '<p class="lead-sub">' + o.name + " · " + H.esc(m.wer) + "</p>" +
                '<div class="lead-meta"><span class="pill">' + m.kat + "</span><small>" + m.kanal + (m.fotos ? " · " + m.fotos + " Foto" + (m.fotos > 1 ? "s" : "") : "") + " · " + m.t + "</small></div>" +
                (h ? '<p class="lead-sub" style="margin-top:6px">' + H.svg(I.werk) + " " + h.name + "</p>" : "") + knopf + "</article>";
            }).join("") : '<p class="col-empty">Nichts offen</p>') + "</section>";
          }).join("") + "</div></div>";
      } },
      objekte: { label: "Objekte", icon: I.haus, render: function (H) {
        var o = obj(S.objSel);
        var fr = S.frist.filter(function (f) { return f.obj === o.id; }), me = S.meld.filter(function (m) { return m.obj === o.id; });
        return H.head("Objekte", "Jedes Haus mit Wohnungen, Fristen, Meldungen und Kosten – die Vorgeschichte ist immer dabei.") +
          '<div class="hv-objekte">' + OBJEKTE.map(function (x) {
            var off = S.meld.filter(function (m) { return m.obj === x.id && m.st !== "erledigt"; }).length;
            return '<button type="button" class="hv-obj' + (x.id === o.id ? " aktiv" : "") + '" data-hv-obj="' + x.id + '"><span class="hv-obj-bild">' + H.svg(I.haus) + "</span><b>" + x.name + "</b><small>" + x.ort + " · " + x.we + " Wohnungen · Baujahr " + x.baujahr + '</small><span class="hv-obj-zahlen"><span>' + off + " offen</span><span>" + H.euro.format(x.kosten) + "</span></span>" +
              '<span class="hv-budget"><i style="width:' + Math.min(100, x.kosten / x.budget * 100) + '%"></i></span></button>';
          }).join("") + "</div>" +
          '<div class="panel-grid two" style="margin-top:16px"><section class="panel"><h2>' + o.name + '</h2><div class="facts"><div class="fact"><span>Eigentümer</span><b>' + o.eigent + '</b></div><div class="fact"><span>Wohnungen</span><b>' + o.we + '</b></div><div class="fact"><span>Kosten 2026</span><b>' + H.euro.format(o.kosten) + '</b></div><div class="fact"><span>Budget laut Wirtschaftsplan</span><b>' + H.euro.format(o.budget) + "</b></div></div>" +
            '<h2 style="margin-top:16px">Meldungen</h2><ul class="feed">' + (me.length ? me.map(function (m) { return '<li><span class="ic">' + H.svg(m.st === "erledigt" ? H.CHECK : I.inbox) + "</span><span>" + H.esc(m.titel) + "<small>" + m.wer + " · " + SPALTEN.filter(function (s) { return s[0] === m.st; })[0][1] + "</small></span></li>"; }).join("") : "<li>Keine Meldungen</li>") + "</ul></section>" +
          '<section class="panel"><h2>Fristen in diesem Objekt</h2><ul class="feed">' + (fr.length ? fr.map(function (f) { return '<li><span class="ic">' + H.svg(I.uhr) + "</span><span>" + f.was + "<small>" + (f.ok ? "beauftragt" : f.tage < 0 ? "seit " + (-f.tage) + " Tagen überfällig" : "in " + f.tage + " Tagen") + " · " + f.hinweis + "</small></span></li>"; }).join("") : "<li>Keine Fristen in den nächsten 3 Monaten</li>") + "</ul></section></div>";
      } },
      fristen: { label: "Fristen", icon: I.uhr, render: function (H) {
        var l = S.frist.slice().sort(function (a, b) { return a.tage - b.tage; });
        return H.head("Fristen", "Prüf- und Wartungsfristen aller Objekte. Das Cockpit erinnert rechtzeitig und beauftragt nach Ihrer Freigabe den passenden Betrieb.", "Erinnerung und Ablage, keine Rechtsberatung – welche Prüfungen nötig sind, legen Sie fest.") +
          '<section class="panel"><div class="zl">' + l.map(function (f) {
            var i = S.frist.indexOf(f), cls = f.ok ? "ok" : f.tage < 0 ? "rot" : f.tage <= 30 ? "gelb" : "grau";
            return '<div class="zl-punkt ' + cls + '"><div class="zl-inhalt"><b>' + f.was + "</b><small>" + obj(f.obj).name + " · " + f.hinweis + " · " + (f.ok ? "beauftragt" : f.tage < 0 ? "seit " + (-f.tage) + " Tagen fällig" : "in " + f.tage + " Tagen") + "</small></div>" +
              (f.ok ? '<span class="pill ok">' + H.svg(H.CHECK) + "beauftragt</span>" : '<button class="btn-mini' + (f.tage < 0 ? " primary" : "") + '" type="button" data-hv-frist="' + i + '">' + f.gewerk + " beauftragen</button>") + "</div>";
          }).join("") + "</div></section>";
      } },
      handwerker: { label: "Handwerker", icon: I.werk, render: function (H) {
        var ang = [["Malerbetrieb Brunner", 18900, "3 Wochen", "4,6"], ["Fassaden Wolf", 21400, "5 Wochen", "4,4"], ["Farbe & Raum Huber", 17600, "8 Wochen", "4,1"]];
        var min = Math.min.apply(null, ang.map(function (a) { return a[1]; }));
        return H.head("Handwerker", "Ihre Stammhandwerker je Gewerk – mit Reaktionszeit, offenen Aufträgen und Bewertung aus Ihren eigenen Aufträgen.") +
          '<div class="nz-karten">' + HW.map(function (h) {
            return '<article class="nz-karte"><div class="nz-oben"><span class="nz-ort">' + H.svg(I.werk) + h.gewerk + "</span><span>" + (h.rahmen ? "Rahmenvertrag" : "auf Anfrage") + "</span></div><h3>" + h.name + '</h3><div class="nz-zahlen"><div><small>Reaktionszeit</small><b>' + h.reakt + "</b></div><div><small>Offene Aufträge</small><b>" + h.offen + "</b></div></div><p class=\"nz-info\">Ihre Bewertung: " + h.note + " / 5</p></article>";
          }).join("") + "</div>" +
          '<section class="panel" style="margin-top:16px"><h2>Angebote vergleichen: Fassadenanstrich Lindenhof 7–9</h2><div class="rows">' + ang.map(function (a, i) {
            return '<div class="row"><div class="row-main"><strong>' + a[0] + (a[1] === min ? ' <span class="pill ok">günstigstes</span>' : "") + "</strong><small>Beginn in " + a[2] + " · Bewertung " + a[3] + "</small></div><div class=\"row-side\"><span class=\"amount\">" + H.euro.format(a[1]) + "</span>" +
              (S.angebote === i ? '<span class="pill ok">' + H.svg(H.CHECK) + "zur Freigabe an Eigentümer</span>" : '<button class="btn-mini' + (a[1] === min ? " primary" : "") + '" type="button" data-hv-angebot="' + i + '">Auswählen</button>') + "</div></div>";
          }).join("") + '</div><p class="src" style="margin-top:10px">Ab einer Summe, die Sie festlegen, holt das Cockpit automatisch drei Angebote ein und bereitet die Vorlage für die Eigentümerversammlung vor.</p></section>';
      } },
      auftrag: { label: "Auftrag (Handwerker)", icon: I.handy, render: function (H) {
        var m = S.meld.filter(function (x) { return x.st === "beauftragt" || x.st === "arbeit"; })[0] || S.meld[0];
        return H.head("Auftrag für den Handwerker", "So bekommt Ihr Handwerker den Auftrag aufs Handy – ohne eigene Software, per Link.") +
          '<div class="phone"><div class="ph-body" style="padding:16px;display:grid;gap:12px"><p class="ph-label">Auftrag von Musterverwaltung Franken</p><h3 style="margin:0">' + H.esc(m.titel) + "</h3>" +
            '<div class="facts"><div class="fact"><span>Objekt</span><b>' + obj(m.obj).name + '</b></div><div class="fact"><span>Wohnung / Kontakt</span><b>' + m.wer + '</b></div><div class="fact"><span>Fotos</span><b>' + (m.fotos || 0) + '</b></div><div class="fact"><span>Kostenrahmen</span><b>bis 500 € ohne Rückfrage</b></div></div>' +
            '<button class="btn btn-signal" type="button" data-hv-ha="annehmen">Auftrag annehmen</button><button class="btn btn-outline" type="button" data-hv-ha="termin">Termin mit Mietpartei vereinbaren</button><button class="btn btn-outline" type="button" data-hv-ha="fotos">Fotos „nachher“ und Bericht hochladen</button></div></div>';
      } },
      eigentuemer: { label: "Eigentümer", icon: I.bericht, render: function (H) {
        var max = Math.max.apply(null, KAT_KOSTEN.map(function (k) { return k[1]; })), mon = [6, 9, 7, 11, 8, 5, 7, 9, 12, 7], mm = 12;
        return H.head("Bericht für Eigentümer", "Kosten nach Objekt und Kategorie, Meldungen pro Monat – als PDF für Eigentümer oder Beirat, auf Knopfdruck.") +
          '<div class="kpis">' + H.kpi("Kosten 2026", H.euro.format(59400), "alle Objekte, bis Oktober") + H.kpi("Im Budget", "84 %", "laut Wirtschaftsplänen") + H.kpi("Ø Erledigung", "4,2 Tage", "von Meldung bis erledigt") + H.kpi("Zufriedenheit", "4,6 / 5", "Rückmeldungen der Mietparteien") + "</div>" +
          '<div class="panel-grid two"><section class="panel"><h2>Kosten nach Kategorie</h2><div class="bars">' + KAT_KOSTEN.map(function (k) { return '<div class="bar-row" style="grid-template-columns:minmax(0,170px) 1fr auto"><span>' + k[0] + '</span><span class="bar"><i style="width:' + k[1] / max * 100 + '%"></i></span><b>' + H.euro.format(k[1]) + "</b></div>"; }).join("") + "</div></section>" +
          '<section class="panel"><h2>Meldungen pro Monat</h2><div class="hv-saeulen">' + mon.map(function (n, i) { return '<span><i style="height:' + n / mm * 100 + '%"></i><small>' + ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O"][i] + "</small></span>"; }).join("") + "</div>" +
          '<div class="view-actions" style="margin-top:14px"><button class="btn btn-signal" type="button" data-hv-pdf>Bericht als PDF an den Beirat</button></div></section></div>';
      } },
      portal: { label: "Mieterportal", icon: I.handy, render: function (H) {
        var st = ["Meldung eingegangen", "Handwerker beauftragt", "Termin vereinbart", "Erledigt"];
        return H.head("Mieterportal", "So sehen Mietparteien den Stand ihrer Meldung – per Link, ohne App und ohne Passwort. Das spart Anrufe.") +
          '<div class="panel-grid two"><section class="panel portal"><p class="src">Musterverwaltung Franken</p><h2>Ihre Meldung: Heizung im Kinderzimmer bleibt kalt</h2><p>Am Röthelheimpark 3 · Wohnung 11</p>' +
            '<ol class="po-steps">' + st.map(function (s, i) { return '<li class="' + (i < S.portalSt ? "done" : i === S.portalSt ? "now" : "") + '">' + s + "</li>"; }).join("") + "</ol>" +
            '<div class="po-box"><b>' + (S.portalSt >= 2 ? "Termin: Donnerstag, 8–10 Uhr" : "Haustechnik Lang meldet sich heute bei Ihnen") + "</b><p>" + (S.portalSt >= 2 ? "Bitte sorgen Sie dafür, dass jemand zu Hause ist." : "Sie bekommen den Terminvorschlag per WhatsApp oder SMS.") + "</p>" +
            (S.portalSt < 2 ? '<button class="btn btn-signal" type="button" data-hv-portal>Termin bestätigen</button>' : "") + "</div></section>" +
          '<section class="panel"><h2>Neue Meldung</h2><form class="hv-form" onsubmit="return false"><label>Was ist passiert?<textarea rows="3" placeholder="z. B. Wasserhahn in der Küche tropft"></textarea></label><label>Fotos<input type="file" accept="image/*" multiple></label><button class="btn btn-signal" type="button" data-hv-meldung>Meldung senden</button></form><p class="src" style="margin-top:10px">In der Demo wird nichts verschickt.</p></section></div>';
      } }
    },
    klick: function (t, H) {
      var el;
      if (t.closest("[data-hv-sim]")) { S.meld.unshift({ id: S.neuId++, wer: "Mietpartei Whg. 7", obj: "o3", titel: "Kein Warmwasser seit heute Morgen", kat: "Sanitär/Heizung", kanal: "WhatsApp", fotos: 1, dringend: true, st: "neu", t: "gerade eben", neu: true }); if (window.Glocke) Glocke.push("warn", "Neue Meldung: Kein Warmwasser seit heute Morgen", "Lindenhof 7–9 · Whg. 7 · dringend", "meldungen"); H.toast("Neue Meldung per WhatsApp: KI erkennt „dringend“, Objekt Lindenhof 7–9, Gewerk Sanitär/Heizung."); H.render(); return true; }
      if ((el = t.closest("[data-hv-vergabe]"))) { var m = S.meld.filter(function (x) { return x.id === +el.getAttribute("data-hv-vergabe"); })[0], p = HW.filter(function (x) { return x.gewerk === m.kat; })[0] || HW[0]; m.st = "beauftragt"; m.hw = p.id; m.neu = false; H.toast("Auftrag an " + p.name + " gesendet – mit Fotos, Kontakt und Kostenrahmen."); H.render(); return true; }
      if ((el = t.closest("[data-hv-fertig]"))) { var m2 = S.meld.filter(function (x) { return x.id === +el.getAttribute("data-hv-fertig"); })[0]; m2.st = "erledigt"; H.toast("Erledigt – Mietpartei wird informiert, Rechnung landet beim Objekt."); H.render(); return true; }
      if ((el = t.closest("[data-hv-obj]"))) { S.objSel = el.getAttribute("data-hv-obj"); H.render(); return true; }
      if ((el = t.closest("[data-hv-frist]"))) { var f = S.frist[+el.getAttribute("data-hv-frist")]; f.ok = true; H.toast(f.was + ": Auftrag vorbereitet und gesendet."); H.render(); return true; }
      if ((el = t.closest("[data-hv-angebot]"))) { S.angebote = +el.getAttribute("data-hv-angebot"); H.toast("Vorlage für die Eigentümer erstellt."); H.render(); return true; }
      if ((el = t.closest("[data-hv-ha]"))) { H.toast({ annehmen: "Auftrag angenommen – die Verwaltung sieht es sofort.", termin: "Terminvorschlag an Mietpartei gesendet (Demo).", fotos: "Fotos und Bericht hochgeladen (Demo)." }[el.getAttribute("data-hv-ha")]); return true; }
      if (t.closest("[data-hv-pdf]")) { H.toast("Bericht erstellt (in der Demo ohne Download)."); return true; }
      if (t.closest("[data-hv-portal]")) { S.portalSt = 2; H.toast("Termin bestätigt."); H.render(); return true; }
      if (t.closest("[data-hv-meldung]")) { H.toast("Danke! Ihre Meldung ist eingegangen (Demo)."); return true; }
    }
  };
})();
