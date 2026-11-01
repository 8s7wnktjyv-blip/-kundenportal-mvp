/* =====================================================================
   Auftragsreise: ein Auftrag von der Anfrage bis zur Zahlung in 20 Schritten.
   Jeder Schritt ändert die echten Demo-Daten (Anfragen, Kundenakte, Termine,
   Angebote, Aufträge, Regieberichte, Rechnungen, Kennzahlen) und springt in
   die Ansicht, in der man die Änderung sieht. Es wird nichts verschickt.
   ===================================================================== */
(function () {
  "use strict";
  var R = function () { return window.DEMO_REISE; };

  // Beispielauftrag je Gewerk (Beispieldaten)
  var BSP = {
    shk:          { betreff: "Badsanierung mit bodengleicher Dusche", wert: 12800, mat: "Duschrinne, Abdichtung, Wandfliesen", arbeit: "Dusche abgedichtet, Rinne gesetzt", std: 7, mass: "Bad 6,5 m², Wandfläche 21 m²" },
    heizung:      { betreff: "Heizungstausch auf Wärmepumpe", wert: 18900, mat: "Wärmepumpe, Pufferspeicher, Rohrleitungen", arbeit: "Altkessel ausgebaut, Wärmepumpe gesetzt", std: 8, mass: "Heizlast 9 kW, 140 m² Wohnfläche" },
    elektro:      { betreff: "Zählerschrank und neue Unterverteilung", wert: 4200, mat: "Zählerschrank, FI-Schutzschalter, Leitungsschutzschalter", arbeit: "Zählerschrank montiert und verdrahtet", std: 6, mass: "12 Stromkreise, 1 Zählerplatz" },
    solar:        { betreff: "Photovoltaik 9,8 kWp mit Speicher", wert: 16400, mat: "24 Module, Wechselrichter, Speicher 10 kWh", arbeit: "Unterkonstruktion und Module montiert", std: 8, mass: "Dachfläche Süd 52 m²" },
    maler:        { betreff: "Wohnung streichen, 3 Zimmer", wert: 3600, mat: "Dispersionsfarbe, Abdeckmaterial", arbeit: "Wände und Decken gestrichen", std: 8, mass: "Wandfläche 210 m², Decken 68 m²" },
    fliesen:      { betreff: "Küchenboden fliesen", wert: 2900, mat: "Feinsteinzeug 60×60, Fliesenkleber", arbeit: "Boden verlegt und verfugt", std: 7, mass: "Boden 18 m²" },
    boden:        { betreff: "Parkett im Wohnzimmer", wert: 4100, mat: "Eiche-Parkett, Trittschalldämmung", arbeit: "Parkett verlegt, Sockelleisten montiert", std: 7, mass: "Boden 32 m², Sockel 24 m" },
    trockenbau:   { betreff: "Dachgeschoss ausbauen", wert: 9800, mat: "Gipskartonplatten, Profile, Dämmung", arbeit: "Ständerwerk gestellt und beplankt", std: 8, mass: "Wandfläche 64 m²" },
    schreiner:    { betreff: "Einbauschrank nach Maß", wert: 3400, mat: "Korpus, Fronten, Beschläge", arbeit: "Schrank montiert und ausgerichtet", std: 6, mass: "Nische 2,40 × 2,60 m" },
    dach:         { betreff: "Dachrinne und Fallrohre erneuern", wert: 2700, mat: "Titanzink-Rinne, Fallrohre, Halter", arbeit: "Rinne und Fallrohre montiert", std: 6, mass: "Rinne 18 m, 2 Fallrohre" },
    fenster:      { betreff: "4 Fenster tauschen", wert: 6900, mat: "4 Kunststofffenster 3-fach verglast", arbeit: "Altfenster ausgebaut, neue Fenster eingesetzt", std: 7, mass: "4 Öffnungen, gemessen je Öffnung" },
    sonnenschutz: { betreff: "Terrassendach mit Markise", wert: 8600, mat: "Terrassendach Alu 5 × 3 m, Unterglasmarkise", arbeit: "Terrassendach montiert, Markise eingebaut", std: 8, mass: "Terrasse 5,0 × 3,0 m" },
    garten:       { betreff: "Einfahrt pflastern", wert: 7200, mat: "Betonpflaster, Splitt, Randsteine", arbeit: "Unterbau verdichtet, Pflaster verlegt", std: 8, mass: "Fläche 42 m², Randsteine 26 m" }
  };
  var ALLG = { betreff: "Arbeiten laut Anfrage", wert: 4800, mat: "Material laut Angebot", arbeit: "Arbeiten laut Angebot ausgeführt", std: 6, mass: "Aufmaß vor Ort" };
  function bsp() { var g = R().gewerk(); return BSP[g] || ALLG; }
  function heuteDE() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear(); }
  function heuteISO() { return new Date().toISOString().slice(0, 10); }

  function rs() { return R().state().reise; }
  function lead() { var r = rs(); return r && R().leadVon(r.leadId); }
  function angebot() { var l = lead(); return l && R().angebotVon(l.id); }
  function auftrag() { var l = lead(); return l && R().auftragVon(l.id); }
  function rechnung() { var r = rs(), m = R().mod(); return r && r.reNr ? m.rechnungen.filter(function (x) { return x.nr === r.reNr; })[0] : null; }
  function bericht() { var r = rs(); return r && r.rbNr ? R().mt().berichte.filter(function (b) { return b.nr === r.rbNr; })[0] : null; }
  function zeige(view, sel) { var st = R().state(); st.angebotSel = null; st.auftragSel = null; Object.keys(sel || {}).forEach(function (k) { st[k] = sel[k]; }); R().go(view); }

  var SCHRITTE = [
    { t: "Eine neue Anfrage kommt herein", d: "Über das Formular auf der Website fragt ein Kunde an. Die Anfrage landet sofort im gemeinsamen Posteingang.", wo: "Anfragen",
      run: function () {
        var st = R().state(), b = bsp(), name = "Familie Reisinger", n = 1;
        while (st.leads.some(function (x) { return x.name === name; })) name = "Familie Reisinger " + (++n);
        var id = st.leads.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
        var l = { id: id, name: name, ort: "Uttenreuth", kanal: "formular", betreff: b.betreff, wert: b.wert, stage: "neu", tage: 0, tel: "0151 000 0099", mail: "reisinger@beispiel.de",
          nachricht: "Guten Tag, wir interessieren uns für: " + b.betreff + ". Wann könnten Sie vorbeikommen? (Beispielanfrage)", ki: "pruefen", kiText: "Wird gerade geprüft …", kiRec: "", erinnert: 0, reise: true };
        l.verlauf = [{ t: 0, text: "Anfrage per Website eingegangen" }];
        st.leads.unshift(l); st.reise.leadId = id;
        R().protokoll("Neue Anfrage von " + name + " über die Website (Auftragsreise)");
        zeige("anfragen");
      } },
    { t: "Die KI prüft die Anfrage", d: "Die KI fasst die Anfrage zusammen, erkennt Gewerk, Ort und fehlende Angaben und gibt eine Empfehlung.", wo: "Anfragen",
      run: function () {
        var l = lead(), b = bsp();
        l.ki = "passt"; l.kiText = b.betreff + ". Ort liegt im Einzugsgebiet (8 km). Es fehlen noch Fotos; Maße werden vor Ort aufgenommen.";
        l.kiRec = "Empfehlung: Besichtigung vereinbaren und Fotos anfordern.";
        R().add(l, "KI-Vorprüfung: passt gut · Besichtigung empfohlen"); zeige("anfragen");
      } },
    { t: "Sie bestätigen die Einschätzung", d: "Die KI schlägt nur vor. Entscheiden tut der Betrieb: Die Anfrage wird angenommen und Stefan zugeteilt.", wo: "Anfragen",
      run: function () { var l = lead(); l.zugeteilt = "Stefan"; l.qualifiziert = true; R().add(l, "Einschätzung bestätigt von " + R().ich() + " · zuständig: Stefan"); zeige("anfragen"); } },
    { t: "Der Kunde ist angelegt", d: "Aus der Anfrage entsteht die Kundenakte mit Kontaktdaten und dem kompletten Verlauf. Jeder spätere Schritt landet dort.", wo: "Kundenakte",
      run: function () { var l = lead(); R().add(l, "Kundenakte angelegt"); zeige("akte", { akteKunde: l.name }); } },
    { t: "Die Besichtigung ist geplant", d: "Ein Termin für morgen, 10 Uhr, steht im Kalender. Der Kunde bekommt eine Bestätigung (in der Demo wird nichts verschickt).", wo: "Kalender",
      run: function () {
        var l = lead(); R().mod().termine.push({ tag: "Morgen", zeit: "10:00", art: "Besichtigung", name: l.name, ort: l.ort, wer: "Stefan", info: l.betreff + " · Aufmaß vor Ort", typ: "termin" });
        R().add(l, "Besichtigung für morgen 10:00 geplant (Stefan)"); zeige("termine");
      } },
    { t: "Das Aufmaß ist aufgenommen", d: "Stefan misst vor Ort und macht Fotos. Die Maße stehen in der Kundenakte und gehen ins Angebot.", wo: "Kundenakte",
      run: function () { var l = lead(), b = bsp(); l.aufmass = b.mass; R().add(l, "Aufmaß aufgenommen: " + b.mass + " · 6 Fotos (Beispiel)"); zeige("akte", { akteKunde: l.name }); } },
    { t: "Das Angebot ist erstellt", d: "Aus Anfrage und Aufmaß entsteht ein Angebotsentwurf mit Positionen. Sie können jede Position ändern.", wo: "Angebote",
      run: function () { var l = lead(), a = R().angebotNeu(l); zeige("angebote", { angebotSel: a.id }); } },
    { t: "Das Angebot ist versendet", d: "Das Angebot geht per E-Mail und als Link in den Kundenbereich. Der Kunde kann dort online bestätigen.", wo: "Angebote", kunde: true,
      run: function () {
        var l = lead(), a = angebot(); a.status = "gesendet"; R().verlaufK(a, "Angebot gesendet (Demo, nichts verschickt)");
        l.stage = "angebot"; l.angebotVor = 0; l.erinnert = 0; R().add(l, "Angebot " + a.nr + " gesendet"); R().protokoll("Angebot " + a.nr + " an " + l.name + " gesendet (Demo)");
        zeige("angebote", { angebotSel: a.id });
      } },
    { t: "Die Erinnerung ist vorbereitet", d: "Drei Tage später hat der Kunde nicht geantwortet. Kundario bereitet eine freundliche Erinnerung vor, Sie geben sie frei.", wo: "Angebote",
      run: function () {
        var l = lead(), a = angebot(); l.angebotVor = 3; l.erinnert = 1;
        R().add(l, "1. Erinnerung nach 3 Tagen vorbereitet und nach Freigabe gesendet (Demo)"); R().verlaufK(a, "1. Erinnerung gesendet (freigegeben von " + R().ich() + ")");
        R().protokoll("Erinnerung an " + l.name + " gesendet (Demo)"); zeige("angebote", { angebotSel: a.id });
      } },
    { t: "Der Kunde nimmt an", d: "Der Kunde bestätigt im Kundenbereich. Das Angebot ist angenommen.", wo: "Angebote",
      run: function () { var l = lead(), a = angebot(); a.status = "angenommen"; R().verlaufK(a, "Vom Kunden online angenommen"); l.stage = "auftrag"; R().add(l, "Angebot " + a.nr + " angenommen"); zeige("angebote", { angebotSel: a.id }); } },
    { t: "Der Auftrag ist angelegt", d: "Mit einem Klick wird aus dem Angebot ein Auftrag. Alle Daten werden übernommen, nichts muss neu eingegeben werden.", wo: "Aufträge",
      run: function () { var l = lead(), au = R().auftragAnlegen(l, angebot()); au.verantwortlich = "Alex"; rs().auId = au.id; R().add(l, "Auftrag " + au.nr + " angelegt"); zeige("auftraege", { auftragSel: au.id }); } },
    { t: "Die Monteure sind eingeplant", d: "Alex und Robin sind für übermorgen eingeplant. Der Termin steht im Auftrag, im Kalender und in der Montage-App.", wo: "Auftrag",
      run: function () {
        var l = lead(), au = auftrag(); R().mod().termine.push({ tag: "Übermorgen", zeit: "07:30", art: "Ausführung", name: l.name, ort: l.ort, wer: "Alex, Robin", info: l.betreff, typ: "regie", auftragId: au.id });
        R().verlaufK(au, "Ausführung übermorgen 07:30 geplant (Alex, Robin)"); zeige("auftraege", { auftragSel: au.id });
      } },
    { t: "Das Material ist zugeordnet", d: "Das Material aus dem Angebot steht als erledigte Aufgabe im Auftrag: bestellt und auf den Auftrag gebucht.", wo: "Auftrag",
      run: function () { var au = auftrag(), b = bsp(); au.aufgaben.push({ titel: "Material bestellt: " + b.mat, bis: heuteISO(), wer: "Büro", erledigt: true }); R().verlaufK(au, "Material bestellt und zugeordnet"); zeige("auftraege", { auftragSel: au.id }); } },
    { t: "Die Baustelle läuft", d: "Die Arbeit hat begonnen. Vorher-Fotos sind dem Auftrag zugeordnet, der Status steht auf „in Arbeit“.", wo: "Auftrag",
      run: function () { var au = auftrag(); au.status = "arbeit"; R().verlaufK(au, "Status: in Arbeit · 4 Vorher-Fotos zugeordnet (Beispiel)"); zeige("auftraege", { auftragSel: au.id }); } },
    { t: "Der Regiebericht ist erstellt", d: "Am Ende des Tages erfasst Alex Stunden, Tätigkeit und Material in der App, auch per Sprache.", wo: "Auftrag",
      run: function () {
        var l = lead(), au = auftrag(), b = bsp(), mt = R().mt(); mt.nr = (mt.nr || 413) + 1; var nr = "RB-0" + mt.nr;
        mt.berichte.unshift({ nr: nr, baustelle: l.name + ", " + l.ort, monteur: "Alex, Robin", datum: "heute", stunden: b.std, material: b.mat, status: "offen", auftragId: au.id, taetigkeit: b.arbeit });
        rs().rbNr = nr; R().verlaufK(au, "Regiebericht " + nr + " erfasst (" + b.std + " Std.)"); zeige("auftraege", { auftragSel: au.id });
      } },
    { t: "Der Kunde unterschreibt", d: "Der Kunde unterschreibt den Regiebericht direkt auf dem Handy des Monteurs. Der Bericht ist jetzt bestätigt.", wo: "Auftrag",
      run: function () { var au = auftrag(), rb = bericht(); if (rb) { rb.unterschrift = true; rb.status = "unterschrieben"; } R().verlaufK(au, "Regiebericht " + (rb ? rb.nr : "") + " vom Kunden unterschrieben"); zeige("auftraege", { auftragSel: au.id }); } },
    { t: "Die Rechnung ist gestellt", d: "Aus Angebot und Regiebericht entsteht die Rechnung. Im echten Betrieb geht sie an Ihr Rechnungsprogramm; hier wird nichts verschickt.", wo: "Auftrag",
      run: function () {
        var l = lead(), au = auftrag(), e = R().rechnungVorbereiten(au), s = R().rechne(e.positionen), nr = R().nrNeu("RE");
        var r = { nr: nr, name: au.kunde, betrag: s.brutto, netto: s.netto, ust: s.ust, faellig: -14, status: "offen", positionen: e.positionen.map(function (p) { return Object.assign({}, p); }), zahlungen: [], auftragId: au.id, info: "heute gestellt · zahlbar in 14 Tagen" };
        R().mod().rechnungen.unshift(r); au.rechnungen.push(nr); au.entwurf = null; rs().reNr = nr;
        var rb = bericht(); if (rb) { rb.status = "abgerechnet"; rb.abgerechnet = true; }
        R().verlaufK(au, "Rechnung " + nr + " über " + R().eur2.format(s.brutto) + " gestellt"); R().add(l, "Rechnung " + nr + " gestellt");
        R().protokoll("Rechnung " + nr + " für " + au.kunde + " gestellt (Demo, nichts verschickt)"); zeige("auftraege", { auftragSel: au.id });
      } },
    { t: "Das Geld ist da", d: "Der Kunde überweist. Die Zahlung wird der Rechnung zugeordnet, die Kennzahlen aktualisieren sich.", wo: "Rechnungen",
      run: function () {
        var l = lead(), au = auftrag(), r = rechnung(); if (!r || r.status === "bezahlt") return zeige("rechnungen");
        r.zahlungen = r.zahlungen || []; r.zahlungen.push({ datum: heuteDE(), betrag: r.betrag, von: "Bankeingang (Beispiel)" }); r.status = "bezahlt"; r.info = "vollständig bezahlt";
        R().verlaufK(au, "Zahlung " + R().eur2.format(r.betrag) + " auf " + r.nr + " eingegangen"); R().add(l, "Zahlung auf " + r.nr + " eingegangen");
        R().protokoll("Zahlung " + R().eur2.format(r.betrag) + " von " + l.name + " zugeordnet"); zeige("rechnungen");
      } },
    { t: "Der Auftrag ist abgeschlossen", d: "Alles erledigt und bezahlt: Der Auftrag wird abgeschlossen. Die Unterlagen bleiben in der Kundenakte.", wo: "Auftrag",
      run: function () { var l = lead(), au = auftrag(); au.status = "abgeschlossen"; R().verlaufK(au, "Status: abgeschlossen"); l.stage = "erledigt"; l.bewertung = "offen"; R().add(l, "Arbeiten abgeschlossen"); zeige("auftraege", { auftragSel: au.id }); } },
    { t: "Die Bewertung ist angefragt", d: "Nach Ihrer Freigabe bekommt der Kunde eine Bitte um eine Google-Bewertung. Ohne Belohnung, ohne Druck.", wo: "Übersicht",
      run: function () { var l = lead(); l.bewertung = "angefragt"; R().add(l, "Bitte um Google-Bewertung gesendet (Demo)"); R().protokoll("Bitte um Bewertung an " + l.name + " gesendet (Demo)"); rs().ende = true; zeige("uebersicht"); } }
  ];

  var $card = null;
  function karte() {
    var r = rs();
    if (!r || r.aus) { if ($card) { $card.remove(); $card = null; } return; }
    if (!$card) { $card = document.createElement("div"); $card.className = "reise-card"; $card.setAttribute("role", "dialog"); $card.setAttribute("aria-label", "Auftrag durchspielen"); document.body.appendChild($card); }
    var E = R().esc, i = r.i, n = SCHRITTE.length;
    if (r.ende && r.erledigt === n) {
      var l = lead(), re = rechnung(), au = auftrag();
      $card.innerHTML = '<div class="reise-kopf"><span class="reise-step">Fertig · 20 von 20</span><button class="reise-x" type="button" data-reise-aus aria-label="Schließen">✕</button></div>' +
        '<div class="reise-bar"><i style="width:100%"></i></div><h2>Von der Anfrage bis zur Zahlung</h2>' +
        "<p>" + E(l ? l.name : "") + ": Anfrage, Angebot, Auftrag " + E(au ? au.nr : "") + ", Regiebericht, Rechnung " + E(re ? re.nr : "") + " über " + (re ? R().eur2.format(re.betrag) : "–") + " – bezahlt. Jeder Schritt steht in der Kundenakte und im Auftrag.</p>" +
        '<div class="reise-nav"><button class="btn btn-outline" type="button" data-reise-zu="akte">Kundenakte</button><button class="btn btn-outline" type="button" data-reise-kunde>Als Kunde ansehen</button><button class="btn btn-signal" type="button" data-reise-aus>Fertig</button></div>';
      return;
    }
    var s = SCHRITTE[i], fertig = r.erledigt > i;
    $card.innerHTML = '<div class="reise-kopf"><span class="reise-step">Schritt ' + (i + 1) + " von " + n + '</span><button class="reise-x" type="button" data-reise-aus aria-label="Durchspielen beenden">✕</button></div>' +
      '<div class="reise-bar"><i style="width:' + Math.round((r.erledigt / n) * 100) + '%"></i></div>' +
      "<h2>" + E(s.t) + "</h2><p>" + E(s.d) + "</p>" +
      (fertig ? '<p class="reise-ok">' + R().svg(R().ICON.check) + "Erledigt – zu sehen unter „" + E(s.wo) + "“.</p>" : "") +
      '<div class="reise-nav">' + (fertig && s.kunde ? '<button class="btn btn-outline" type="button" data-reise-kunde>Als Kunde ansehen</button>' : "") +
      (fertig ? '<button class="btn btn-signal" type="button" data-reise-weiter>Weiter →</button>' : '<button class="btn btn-signal" type="button" data-reise-los>Ausführen</button>') + "</div>";
  }

  function starten() {
    var st = R().state(); R().closeDrawer(); R().tourEnd(); R().rolle("gf");
    if (st.reise && !st.reise.aus && !st.reise.ende && st.reise.erledigt > 0) { karte(); return R().toast("Weiter, wo Sie aufgehört haben."); }
    st.reise = { i: 0, erledigt: 0 }; R().speichern(); karte();
  }
  function ausfuehren() {
    var r = rs(); if (!r || r.erledigt > r.i) return;
    if (r.i > 0 && !lead()) { r.aus = true; karte(); return R().toast("Der Beispielauftrag wurde gelöscht. Starten Sie neu."); }
    R().rolle("gf"); R().closeDrawer();
    SCHRITTE[r.i].run(); r.erledigt = r.i + 1; R().speichern(); karte();
    if (window.innerWidth < 760) window.scrollTo(0, 0);
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("#reise-start") || t.closest("[data-reise-start]")) { e.preventDefault(); return starten(); }
    if (!t.closest(".reise-card")) return;
    var r = rs(); if (!r) return;
    if (t.closest("[data-reise-los]")) return ausfuehren();
    if (t.closest("[data-reise-weiter]")) { r.i = Math.min(r.i + 1, SCHRITTE.length - 1); R().speichern(); return karte(); }
    if (t.closest("[data-reise-aus]")) { r.aus = true; R().speichern(); return karte(); }
    if (t.closest("[data-reise-kunde]")) { var l = lead(); R().state().portalKunde = l ? l.name : null; R().rolle("kunde"); R().toast("Ansicht: Kunde – so sieht " + (l ? l.name : "der Kunde") + " den Auftrag. Oben zurück zur Geschäftsführung."); return; }
    var zu = t.closest("[data-reise-zu]"); if (zu) { var l2 = lead(); R().rolle("gf"); zeige(zu.getAttribute("data-reise-zu"), { akteKunde: l2 ? l2.name : null }); }
  });

  // Nach „Demo zurücksetzen“ oder Neuladen: Karte anzeigen oder ausblenden
  function banner() {   // Hinweis oben in der Übersicht
    var st = R().state(); if (st.view !== "uebersicht" || st.rolle !== "gf") return;
    var m = document.getElementById("app-main"); if (!m || m.querySelector(".reise-banner")) return;
    var vh = m.querySelector(".view-head") || m.firstElementChild; if (!vh) return;
    var r = st.reise, laeuft = r && !r.aus && !r.ende && r.erledigt > 0;
    var d = document.createElement("div"); d.className = "reise-banner";
    d.innerHTML = '<div><b>Einen Auftrag komplett durchspielen</b><span>Von der Anfrage über Angebot, Auftrag, Baustelle und Rechnung bis zur Zahlung – 20 Schritte mit Beispieldaten, jeder Schritt verändert die Demo.</span></div>' +
      '<button class="btn btn-signal" type="button" data-reise-start>' + (laeuft ? "Weiter durchspielen" : "Jetzt durchspielen") + "</button>";
    vh.parentNode.insertBefore(d, vh.nextSibling);
  }
  function pruefen() { try { if (R() && R().state()) { karte(); banner(); } } catch (x) {} }
  var main = document.getElementById("app-main");
  if (main && window.MutationObserver) new MutationObserver(pruefen).observe(main, { childList: true });
  window.addEventListener("load", function () { setTimeout(pruefen, 300); });
})();
