/* =====================================================================
   DEMO MAKLER – alle Namen, Objekte und Beträge sind erfunden.
   Läuft mit js/demo-mini.js. Nichts wird gespeichert oder verschickt.
   ===================================================================== */
(function () {
  "use strict";
  var I = {
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    kal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    glocke: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    haus: '<path d="M3 10l9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M10 21v-6h4v6"/>',
    bericht: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    werk: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    handy: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
  };
  var OBJ = [
    { id: "m1", titel: "3-Zimmer-Wohnung mit Balkon", ort: "Erlangen-Bruck", preis: 389000, qm: 84, stufe: 2, tage: 12, anfr: 31, bes: 6, farbe: "#7AA6D8" },
    { id: "m2", titel: "Reihenhaus mit Garten", ort: "Herzogenaurach", preis: 545000, qm: 128, stufe: 3, tage: 26, anfr: 44, bes: 11, farbe: "#8FBF9F" },
    { id: "m3", titel: "Altbauwohnung, sanierungsbedürftig", ort: "Fürth-Südstadt", preis: 229000, qm: 72, stufe: 2, tage: 5, anfr: 19, bes: 2, farbe: "#D9B38C" },
    { id: "m4", titel: "Baugrundstück 620 m²", ort: "Baiersdorf", preis: 310000, qm: 620, stufe: 1, tage: 0, anfr: 0, bes: 0, farbe: "#C9B6E4" },
    { id: "m5", titel: "Einfamilienhaus, Baujahr 1978", ort: "Uttenreuth", preis: 615000, qm: 146, stufe: 4, tage: 41, anfr: 58, bes: 14, farbe: "#E4A99B" }
  ];
  var STUFEN = ["Vorbereitung", "Online", "Besichtigungen", "Reserviert", "Notartermin"];
  var START_INT = [
    { id: 1, name: "Alex Hoffmann", obj: "m1", quelle: "Immobilienportal", budget: "bis 400.000 €", fin: "ja", nutzung: "selbst", t: "vor 15 Min.", st: "neu" },
    { id: 2, name: "Familie Schuster", obj: "m2", quelle: "Website", budget: "bis 560.000 €", fin: "in Klärung", nutzung: "selbst", t: "vor 1 Std.", st: "neu" },
    { id: 3, name: "Robin Weber", obj: "m3", quelle: "Immobilienportal", budget: "unbekannt", fin: "unbekannt", nutzung: "unbekannt", t: "vor 2 Std.", st: "neu", fehlt: true },
    { id: 4, name: "Kim Bauer", obj: "m1", quelle: "Empfehlung", budget: "bis 380.000 €", fin: "ja", nutzung: "Kapitalanlage", t: "gestern", st: "expose" },
    { id: 5, name: "Familie Demir", obj: "m5", quelle: "Schaufenster (QR-Code)", budget: "bis 650.000 €", fin: "ja", nutzung: "selbst", t: "gestern", st: "termin" }
  ];
  var START_BES = [
    { tag: "Heute", zeit: "16:30", obj: "m2", wer: "Familie Schuster", selbst: true },
    { tag: "Heute", zeit: "17:30", obj: "m2", wer: "Sam Richter", selbst: true },
    { tag: "Morgen", zeit: "10:00", obj: "m1", wer: "Kim Bauer", selbst: false },
    { tag: "Morgen", zeit: "11:00", obj: "m1", wer: "Alex Hoffmann", selbst: true },
    { tag: "Freitag", zeit: "15:00", obj: "m5", wer: "Familie Demir", selbst: true },
    { tag: "Samstag", zeit: "11:00", obj: "m3", wer: "Offene Besichtigung (6 Anmeldungen)", selbst: true }
  ];
  var START_NACH = [
    { wer: "Jo Lehmann", obj: "m5", seit: 2, rm: "sehr interessiert, prüft Finanzierung", stufe: 1 },
    { wer: "Familie Kaya", obj: "m2", seit: 4, rm: "Garten zu klein", stufe: 3, raus: true },
    { wer: "Toni Schmid", obj: "m1", seit: 1, rm: "noch keine Rückmeldung", stufe: 0 },
    { wer: "Familie Wolf", obj: "m5", seit: 6, rm: "möchte zweite Besichtigung", stufe: 2 }
  ];
  var NETZ = [["Bad und Sanitär", "Haustechnik Lang", "Erlangen"], ["Heizung und Wärmepumpe", "Haustechnik Lang", "Erlangen"], ["Maler und Böden", "Malerbetrieb Brunner", "Fürth"], ["Elektro und Smart Home", "Elektro Yilmaz", "Nürnberg"], ["Dach und Fenster", "Dach & Rinne Kraus", "Herzogenaurach"]];
  var S;
  var o = function (id) { return OBJ.filter(function (x) { return x.id === id; })[0]; };
  var finPill = function (f) { return f === "ja" ? '<span class="pill ok">Finanzierung geklärt</span>' : f === "in Klärung" ? '<span class="pill check">Finanzierung in Klärung</span>' : '<span class="pill no">Angaben fehlen</span>'; };
  var bild = function (x, gross) { return '<span class="mk-bild' + (gross ? " gross" : "") + '" style="--b:' + x.farbe + '">' + '<svg viewBox="0 0 24 24" aria-hidden="true">' + I.haus + "</svg></span>"; };

  window.MINI = {
    seite: "makler.html", start: "uebersicht",
    rollen: [["makler", "Maklerbüro", null], ["eigentuemer", "Eigentümer (Bericht)", ["bericht"]], ["interessent", "Interessent (Buchung)", ["buchung"]]],
    gruppen: [["Alltag", ["uebersicht", "anfragen", "besichtigungen", "nachfassen"]], ["Bestand", ["objekte"]], ["Berichte", ["bericht"]], ["Netzwerk", ["handwerker"]], ["Portal", ["buchung"]]],
    reset: function () {
      S = { int: START_INT.map(function (x) { return Object.assign({}, x); }), bes: START_BES.map(function (x) { return Object.assign({}, x); }), nach: START_NACH.map(function (x) { return Object.assign({}, x); }), objSel: "m2", gebucht: null, netz: {} };
    },
    zahlen: function () { return { anfragen: S.int.filter(function (x) { return x.st === "neu"; }).length, nachfassen: S.nach.filter(function (x) { return !x.erledigt && !x.raus; }).length }; },
    views: {
      uebersicht: { label: "Übersicht", icon: I.home, render: function (H) {
        var neu = S.int.filter(function (x) { return x.st === "neu"; });
        var q = [["Immobilienportal", 41], ["Website", 18], ["Empfehlung", 9], ["Schaufenster (QR-Code)", 6]], mx = 41;
        return '<section class="welcome" style="grid-template-columns:1fr"><h2>Demo für Makler</h2><p>Alles erfunden – oben bei „Ansicht als“ auch Eigentümer- und Interessenten-Sicht.</p></section>' +
          H.head("Guten Morgen.", "Musterimmobilien Franken · 5 Objekte in Vermarktung · Beispieldaten") +
          '<div class="kpis">' + H.kpi("Neue Interessenten", neu.length, "seit gestern") + H.kpi("Besichtigungen", S.bes.length, "diese Woche, " + S.bes.filter(function (b) { return b.selbst; }).length + " selbst gebucht") +
            H.kpi("In Vermarktung", "5 Objekte", "1 reserviert, 1 beim Notar") + H.kpi("Reaktionszeit", "12 Min.", "bis zur ersten Antwort") + "</div>" +
          '<div class="panel-grid two"><section class="panel"><h2>Heute zu tun</h2><ul class="todo">' +
            neu.map(function (x) { return '<li><span class="dot"></span><span class="txt">' + x.name + " · " + o(x.obj).titel + "<small>" + (x.fehlt ? "Angaben fehlen – Rückfrage vorbereitet" : "Exposé liegt zur Freigabe bereit") + '</small></span><button class="btn-mini primary" type="button" data-view="anfragen">Ansehen</button></li>'; }).join("") +
            '<li><span class="dot" style="background:#E0A400"></span><span class="txt">Eigentümerbericht Reihenhaus Herzogenaurach<small>monatlich, bereit zum Versand</small></span><button class="btn-mini" type="button" data-view="bericht">Öffnen</button></li></ul></section>' +
          '<section class="panel"><h2>Anfragen nach Herkunft (30 Tage)</h2><div class="bars">' + q.map(function (x) { return '<div class="bar-row" style="grid-template-columns:minmax(0,170px) 1fr 30px"><span>' + x[0] + '</span><span class="bar"><i style="width:' + x[1] / mx * 100 + '%"></i></span><b>' + x[1] + "</b></div>"; }).join("") +
          '</div><p class="src" style="margin-top:12px">Anfragen aus Portalen, Website und E-Mail landen automatisch hier. Die KI ergänzt fehlende Angaben per Rückfrage.</p></section></div>';
      } },
      anfragen: { label: "Anfragen", icon: I.inbox, render: function (H) {
        return H.head("Anfragen", "Alle Interessenten an einem Ort. Die KI prüft Budget, Finanzierung und Nutzung – das Exposé geht erst nach Ihrer Freigabe raus.", "Keine Finanzierungsberatung: Die Frage nach der Finanzierung dient nur der Einordnung.") +
          '<div class="rows">' + S.int.map(function (x) {
            var ob = o(x.obj);
            var knopf = x.st === "neu" ? (x.fehlt ? '<button class="btn-mini primary" type="button" data-mk-frage="' + x.id + '">Rückfrage senden</button>' : '<button class="btn-mini primary" type="button" data-mk-expose="' + x.id + '">Exposé freigeben</button>') :
              x.st === "expose" ? '<button class="btn-mini" type="button" data-mk-link="' + x.id + '">Besichtigungslink senden</button>' : x.st === "gefragt" ? '<span class="pill check">Rückfrage gesendet</span>' : '<span class="pill ok">' + H.svg(H.CHECK) + "Besichtigung gebucht</span>";
            return '<div class="row mk-int"><div class="row-main">' + bild(ob) + "<div><strong>" + x.name + " · " + ob.titel + "</strong><small>" + x.quelle + " · " + x.t + " · Budget " + x.budget + " · Nutzung: " + x.nutzung + "</small></div></div>" +
              '<div class="row-side">' + finPill(x.fin) + knopf + "</div></div>";
          }).join("") + "</div>";
      } },
      besichtigungen: { label: "Besichtigungen", icon: I.kal, render: function (H) {
        var tage = []; S.bes.forEach(function (b) { if (tage.indexOf(b.tag) < 0) tage.push(b.tag); });
        return H.head("Besichtigungen", "Interessenten buchen freie Zeiten selbst. Erinnerung am Vortag, Rückmeldung danach – automatisch.") +
          '<div class="mk-tage">' + tage.map(function (t) {
            return '<section class="panel"><h2>' + t + "</h2>" + S.bes.filter(function (b) { return b.tag === t; }).map(function (b) {
              var ob = o(b.obj); return '<div class="mk-termin"><b class="mk-zeit">' + b.zeit + "</b>" + bild(ob) + "<div><strong>" + b.wer + "</strong><small>" + ob.titel + ", " + ob.ort + "</small></div>" + (b.selbst ? '<span class="pill ok">selbst gebucht</span>' : '<span class="pill">von Ihnen</span>') + "</div>";
            }).join("") + "</section>";
          }).join("") + "</div>";
      } },
      nachfassen: { label: "Nachfassen", icon: I.glocke, render: function (H) {
        var SCH = ["Danke-Nachricht", "Rückmeldung abfragen", "Unterlagen anbieten", "Anruf-Hinweis an Sie"];
        return H.head("Nachfassen", "Nach jeder Besichtigung: Danke, Rückmeldung, Unterlagen – freundlich und nur nach Ihrer Freigabe.") +
          '<div class="rows">' + S.nach.map(function (x, i) {
            var ob = o(x.obj);
            var punkte = SCH.map(function (s, k) { return '<i class="' + (x.raus ? "skip" : k < x.stufe ? "done" : k === x.stufe ? "now" : "") + '" title="' + s + '"></i>'; }).join("");
            return '<div class="run"><div class="run-main"><strong>' + x.wer + "</strong><small>" + ob.titel + " · Besichtigung vor " + x.seit + (x.seit === 1 ? " Tag" : " Tagen") + "</small></div>" +
              '<span class="run-steps">' + punkte + '</span><span class="run-hint"><span class="pill ' + (x.raus ? "no" : x.stufe >= 2 ? "ok" : "check") + '">' + (x.raus ? "kein Interesse" : SCH[x.stufe]) + "</span><small>" + x.rm + "</small></span>" +
              (x.raus || x.erledigt ? (x.erledigt ? '<span class="pill ok">' + H.svg(H.CHECK) + "gesendet</span>" : "") : '<button class="btn-mini primary" type="button" data-mk-nach="' + i + '">Freigeben</button>') + "</div>";
          }).join("") + "</div>";
      } },
      objekte: { label: "Objekte", icon: I.haus, render: function (H) {
        return H.head("Objekte", "Jedes Objekt mit Stand der Vermarktung, Anfragen und Besichtigungen.") +
          '<div class="mk-objekte">' + OBJ.map(function (x) {
            return '<article class="mk-obj">' + bild(x, true) + '<div class="mk-obj-text"><b>' + x.titel + "</b><small>" + x.ort + " · " + (x.id === "m4" ? x.qm + " m² Grund" : x.qm + " m²") + '</small><span class="mk-preis">' + H.euro.format(x.preis) + "</span>" +
              '<ol class="mk-stufen">' + STUFEN.map(function (s, k) { return '<li class="' + (k < x.stufe ? "done" : k === x.stufe ? "now" : "") + '" title="' + s + '"></li>'; }).join("") + '</ol><small class="mk-stufe">' + STUFEN[x.stufe] + "</small>" +
              '<div class="mk-zahlen"><span><b>' + x.anfr + "</b> Anfragen</span><span><b>" + x.bes + "</b> Besichtigungen</span><span><b>" + x.tage + "</b> Tage online</span></div></div></article>";
          }).join("") + "</div>";
      } },
      bericht: { label: "Eigentümerbericht", icon: I.bericht, render: function (H) {
        var x = o(S.objSel), st = [["Aufrufe des Exposés", 1240], ["Anfragen", x.anfr], ["Besichtigungen", x.bes], ["Zweitbesichtigungen", 3], ["Angebote", 1]], mx = 1240;
        return H.head("Bericht für Eigentümer", "Was ist mit meinem Objekt passiert? Der Bericht geht jeden Monat automatisch an die Eigentümer – nach Ihrer Freigabe.") +
          '<div class="filter" style="margin-bottom:14px">' + OBJ.filter(function (y) { return y.anfr; }).map(function (y) { return '<button type="button" data-mk-obj="' + y.id + '" aria-pressed="' + (y.id === x.id) + '">' + y.titel + "</button>"; }).join("") + "</div>" +
          '<div class="panel-grid two"><section class="panel"><h2>' + x.titel + ", " + x.ort + '</h2><div class="mk-trichter">' + st.map(function (s) { return '<div class="mk-tr"><span>' + s[0] + '</span><span class="bar"><i style="width:' + Math.max(3, Math.sqrt(s[1] / mx) * 100) + '%"></i></span><b>' + s[1].toLocaleString("de-DE") + "</b></div>"; }).join("") + "</div></section>" +
          '<section class="panel"><h2>Was Interessenten sagen</h2><ul class="feed"><li><span class="ic">' + H.svg(H.CHECK) + '</span><span>Lage und Garten gefallen sehr<small>7 von 11 Rückmeldungen</small></span></li><li><span class="ic">!</span><span>Preis wird als hoch empfunden<small>4 von 11 Rückmeldungen</small></span></li><li><span class="ic">!</span><span>Heizung (Baujahr 1998) wird oft angesprochen<small>3 von 11 – Kostenschätzung vom Fachbetrieb liegt bei</small></span></li></ul>' +
          '<div class="view-actions" style="margin-top:12px"><button class="btn btn-signal" type="button" data-mk-pdf>Bericht an Eigentümer freigeben</button></div></section></div>';
      } },
      handwerker: { label: "Handwerker", icon: I.werk, render: function (H) {
        return H.head("Handwerker für Käufer", "Käufer fragen nach Renovierung, Heizung oder Bad? Sie geben passende Fachbetriebe aus dem Netzwerk weiter – mit Einwilligung des Käufers.",
            "Eine Vergütung für Empfehlungen wird gegenüber dem Käufer offengelegt und beeinflusst die Auswahl nicht.") +
          '<div class="nz-karten">' + NETZ.map(function (n, i) {
            return '<article class="nz-karte"><div class="nz-oben"><span class="nz-ort">' + H.svg(I.werk) + n[2] + "</span><span>geprüfter Fachbetrieb</span></div><h3>" + n[0] + '</h3><p class="nz-info">' + n[1] + " · Rückmeldung in der Regel in 24 Std.</p>" +
              (S.netz[i] ? '<span class="pill ok">' + H.svg(H.CHECK) + "Kontakt an Familie Schuster gesendet</span>" : '<button class="btn btn-signal" type="button" data-mk-netz="' + i + '">Kontakt an Käufer senden</button>') + "</article>";
          }).join("") + "</div>";
      } },
      buchung: { label: "Buchungsseite", icon: I.handy, render: function (H) {
        var x = o("m2"), slots = [["Do", "16:30"], ["Do", "17:30"], ["Fr", "15:00"], ["Sa", "10:00"], ["Sa", "11:00"], ["Sa", "12:00"]];
        return H.head("Buchungsseite für Interessenten", "So bucht ein Interessent einen Besichtigungstermin – per Link aus der Antwort-Mail, ohne Anruf.") +
          '<div class="phone"><div class="ph-body" style="padding:16px;display:grid;gap:12px">' + bild(x, true) + "<h3 style=\"margin:0\">" + x.titel + "</h3><p style=\"margin:0;color:var(--muted)\">" + x.ort + " · " + x.qm + " m² · " + H.euro.format(x.preis) + "</p>" +
            (S.gebucht != null ? '<div class="po-box"><b>Termin gebucht: ' + slots[S.gebucht].join(", ") + ' Uhr</b><p>Sie bekommen eine Bestätigung und am Vortag eine Erinnerung.</p></div>' :
              '<p style="margin:0;font-weight:600">Freie Termine</p><div class="mk-slots">' + slots.map(function (s, i) { return '<button type="button" class="btn-mini" data-mk-slot="' + i + '">' + s[0] + " " + s[1] + "</button>"; }).join("") + "</div>") +
            '<p class="src">Mit der Buchung stimmen Sie zu, dass Musterimmobilien Franken Sie zu diesem Termin kontaktiert. Datenschutzhinweise: Link.</p></div></div>';
      } }
    },
    klick: function (t, H) {
      var el, f = function (a) { return S.int.filter(function (x) { return x.id === +el.getAttribute(a); })[0]; };
      if ((el = t.closest("[data-mk-expose], [data-mk-frage]")) && !el.hasAttribute("data-ok") && window.MailVorschau) {
        var expo = el.hasAttribute("data-mk-expose"), xi = S.int.filter(function (q) { return q.id === +el.getAttribute(expo ? "data-mk-expose" : "data-mk-frage"); })[0], ob = o(xi.obj), kn = el;
        var an = /^Familie/.test(xi.name) ? "Guten Tag, " + xi.name : "Guten Tag " + xi.name;
        MailVorschau.zeigen({ zweck: (expo ? "Exposé an " : "Rückfrage an ") + xi.name, von: "Musterimmobilien Franken", vonMail: "kontakt@musterimmobilien.de", an: xi.name, anMail: xi.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@beispiel.de", anTel: "0160 000 0000",
          betreff: (expo ? "Exposé: " : "Ihre Anfrage: ") + ob.titel + ", " + ob.ort, anhang: expo ? "Expose_" + ob.ort.replace(/[^A-Za-zÄÖÜäöü]+/g, "_") + ".pdf" : null,
          mail: expo ? [an + ",\n\nvielen Dank für Ihr Interesse an der Immobilie „" + ob.titel + "“ in " + ob.ort + ". Anbei finden Sie das Exposé mit allen Details und dem Energieausweis.\n\nEinen Besichtigungstermin können Sie hier direkt selbst buchen: https://termin.musterimmobilien.de/" + ob.id + "\n\nFreundliche Grüße\nMusterimmobilien Franken",
                        an + ",\n\nschön, dass Ihnen „" + ob.titel + "“ gefällt! Das Exposé hängt an. Wenn Sie das Objekt sehen möchten, wählen Sie einfach einen freien Termin: https://termin.musterimmobilien.de/" + ob.id + "\n\nFreundliche Grüße\nMusterimmobilien Franken"] :
                       [an + ",\n\nvielen Dank für Ihre Anfrage zu „" + ob.titel + "“. Damit wir Ihnen passende Unterlagen schicken können, beantworten Sie bitte kurz drei Fragen:\n\n1. Welches Budget haben Sie ungefähr?\n2. Ist die Finanzierung schon geklärt?\n3. Möchten Sie selbst einziehen oder vermieten?\n\nDanach erhalten Sie sofort das Exposé.\n\nFreundliche Grüße\nMusterimmobilien Franken"],
          wa: [expo ? "Danke für Ihr Interesse an „" + ob.titel + "“! Das Exposé: https://expose.musterimmobilien.de/" + ob.id + " · Termin selbst buchen: https://termin.musterimmobilien.de/" + ob.id : "Danke für Ihre Anfrage! Kurz drei Fragen: Budget? Finanzierung geklärt? Selbst einziehen oder vermieten? Dann schicken wir das Exposé 🙂"],
          senden: function () { kn.setAttribute("data-ok", ""); kn.click(); } });
        return true;
      }
      if ((el = t.closest("[data-mk-expose]"))) { var x = f("data-mk-expose"); x.st = "expose"; H.toast("Exposé an " + x.name + " gesendet – mit Link zur Terminbuchung."); H.render(); return true; }
      if ((el = t.closest("[data-mk-frage]"))) { var y = f("data-mk-frage"); y.st = "gefragt"; H.toast("Rückfrage zu Budget, Finanzierung und Nutzung an " + y.name + " gesendet."); H.render(); return true; }
      if ((el = t.closest("[data-mk-link]"))) { var z = f("data-mk-link"); z.st = "termin"; H.toast(z.name + " hat einen Termin gebucht (Demo)."); H.render(); return true; }
      if ((el = t.closest("[data-mk-nach]"))) { var n = S.nach[+el.getAttribute("data-mk-nach")]; n.erledigt = true; H.toast("Nachricht an " + n.wer + " gesendet."); H.render(); return true; }
      if ((el = t.closest("[data-mk-obj]"))) { S.objSel = el.getAttribute("data-mk-obj"); H.render(); return true; }
      if (t.closest("[data-mk-pdf]")) { H.toast("Bericht freigegeben – geht als PDF an die Eigentümer (Demo)."); return true; }
      if ((el = t.closest("[data-mk-netz]"))) { S.netz[+el.getAttribute("data-mk-netz")] = true; H.toast("Kontakt mit Einwilligung des Käufers weitergegeben."); H.render(); return true; }
      if ((el = t.closest("[data-mk-slot]"))) { S.gebucht = +el.getAttribute("data-mk-slot"); H.toast("Termin gebucht (Demo)."); H.render(); return true; }
    }
  };
})();
