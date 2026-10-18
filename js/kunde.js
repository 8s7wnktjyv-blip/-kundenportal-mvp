/* =====================================================================
   KUNDEN-DASHBOARD „Mein Bereich“ (gehört zu kunde.html)
   ---------------------------------------------------------------------
   Drei Bereiche: Vorhaben · Nachrichten · Dokumente
   Ein Vorhaben läuft durch 7 Schritte:
   Anfrage → Betrieb vermittelt → Richtpreis → Besichtigung → Angebot →
   Ausführung → Fertig & Bewertung.
   Beispieldaten sind erfunden; nichts wird verschickt oder gespeichert.
   ===================================================================== */
(function () {
  "use strict";
  var SCHRITTE = ["Anfrage", "Betrieb vermittelt", "Richtpreis", "Besichtigung", "Angebot", "Ausführung", "Fertig"];
  var START = [
    { id: "k1", titel: "Badsanierung", details: "9 m² · Komplett neu · Gehoben", ort: "Erlangen", eingang: "12.10.2026", von: 16000, bis: 21000, typ: 18500, stufe: 2,
      betrieb: { name: "Fliesen Yilmaz", kontakt: "Herr Yilmaz", info: "Meisterbetrieb · Haftpflicht geprüft · ★ 4,9 (38 Bewertungen)", tel: "0151 000 0300" },
      richtpreis: 19500, richtpreisText: "Anhand Ihrer Fotos: Bad komplett neu, bodengleiche Dusche, Fliesen raumhoch im Duschbereich, neues WC und Waschtisch. Ob die Leitungen erneuert werden müssen, prüfe ich bei der Besichtigung.",
      termine: ["Do, 16.10., 16:00 Uhr", "Fr, 17.10., 09:00 Uhr", "Mo, 20.10., 14:00 Uhr"],
      angebot: { nr: "AN-2026-214", pos: [["Abbruch und Entsorgung", 1450], ["Sanitärinstallation inkl. Leitungen im Bad", 4300], ["Bodengleiche Dusche mit Glaswand", 3650], ["Fliesen Boden und Wände inkl. Material", 7400], ["WC, Waschtisch, Armaturen inkl. Montage", 2350], ["Elektro-Anpassungen, Abdichtung, Reinigung", 1100]] },
      fotos: 3, chat: [{ von: "betrieb", text: "Guten Tag Frau Roth, danke für Ihre Anfrage! Ich habe Ihnen einen Richtpreis geschickt. Wenn er passt, komme ich gern vorbei.", wann: "gestern, 17:42" }] },
    { id: "k2", titel: "Wasserhahn Küche", details: "Reparatur", ort: "Erlangen", eingang: "02.09.2026", von: 120, bis: 800, typ: 450, stufe: 6, bewertet: 5, bewertung: { text: "Super, vielen Dank für den schnellen Termin!" },
      betrieb: { name: "Musterbetrieb Haustechnik", kontakt: "Alex", info: "Meisterbetrieb · Haftpflicht geprüft · ★ 4,8 (61 Bewertungen)", tel: "0151 000 0400" },
      rechnung: { betrag: 180, bezahlt: true, datum: "10.09.2026" }, chat: [{ von: "betrieb", text: "Erledigt – die Dichtung war durch. Rechnung kommt per E-Mail.", wann: "03.09." }, { von: "ich", text: "Super, vielen Dank für den schnellen Termin!", wann: "03.09." }] }
  ];
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };
  var I = {
    haus: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', plus: '<path d="M12 5v14M5 12h14"/>', star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'
  };

  var st = { tab: "vorhaben", offen: null, chatId: null, vorhaben: START.map(function (v) { return JSON.parse(JSON.stringify(v)); }), termin: null, zeichnung: false };
  /* Anfragen aus dem Portal (gleicher Browser) übernehmen */
  try {
    JSON.parse(localStorage.getItem("portal-anfragen") || "[]").forEach(function (a) {
      var v0 = { id: "p" + a.id, titel: a.vorhaben, details: a.details, ort: a.ort, eingang: new Date(a.eingang).toLocaleDateString("de-DE"), von: a.von, bis: a.bis, typ: a.typ || Math.round((a.von + a.bis) / 2), stufe: 0, note: a.note, chat: [], fotos: a.fotos };
      if (a.betriebe && a.betriebe.length && a.note !== "C") { v0.wahl = a.betriebe.slice(); v0.andere = a.betriebe.slice(1).map(function (n) { return { name: n, status: "angefragt" }; }); }
      st.vorhaben.unshift(v0);
      if (a.name) document.getElementById("kd-user").textContent = a.name + " · Demo";
    });
  } catch (e) { /* privat */ }

  var $app = document.getElementById("kd-app"), $tabs = document.getElementById("kd-tabs");
  function toast(t) { var el = document.createElement("div"); el.className = "toast"; el.innerHTML = svg(I.check) + "<span>" + t + "</span>"; var c = document.getElementById("kd-toasts"); c.appendChild(el); while (c.children.length > 2) c.removeChild(c.firstChild); setTimeout(function () { el.remove(); }, 4200); }
  function vh(id) { return st.vorhaben.filter(function (v) { return v.id === id; })[0]; }
  function betriebInfo(name) {   // Daten aus dem Portal (BETRIEBE), sonst Standard
    var b = null; if (window.BETRIEBE) ["bad", "heizung", "elektro", "solar", "maler", "fliesen", "boden", "trockenbau", "schreiner", "dach", "fenster", "sonnenschutz", "garten"].some(function (g) { b = window.BETRIEBE.fuer(g).filter(function (x) { return x.name === name; })[0]; return !!b; });
    return { name: name, kontakt: "Ihr Ansprechpartner bei " + name, info: (b && b.meister ? "Meisterbetrieb · " : "") + "Haftpflicht geprüft" + (b ? " · ★ " + String(b.schnitt).replace(".", ",") + " (" + b.anzahl + " geprüfte Bewertungen)" : ""), tel: "0151 000 0" + (100 + name.length * 7) };
  }
  function datumIn(tage) { var d = new Date(); d.setDate(d.getDate() + tage); return d.toLocaleDateString("de-DE"); }
  var KRIT = window.BETRIEBE ? window.BETRIEBE.KRIT : [["qualitaet", "Qualität der Arbeit"], ["preis", "Preis eingehalten"], ["termin", "Termine eingehalten"], ["sauber", "Sauber & ordentlich"], ["kontakt", "Gut erreichbar"]];
  function summe(v) { return v.angebot ? v.angebot.pos.reduce(function (s, p) { return s + p[1]; }, 0) : 0; }

  function tabs() {
    var ungelesen = st.vorhaben.reduce(function (s, v) { return s + (v.neuNachricht ? 1 : 0); }, 0);
    var zuTun = st.vorhaben.filter(function (v) { return aufgabe(v); }).length;
    $tabs.innerHTML = [["vorhaben", "Vorhaben", I.haus, zuTun], ["nachrichten", "Nachrichten", I.chat, ungelesen], ["dokumente", "Dokumente", I.doc, 0]].map(function (t) {
      return '<button type="button" data-tab="' + t[0] + '"' + (st.tab === t[0] ? ' aria-current="page"' : "") + ">" + svg(t[2]) + "<span>" + t[1] + "</span>" + (t[3] ? '<b class="kd-count">' + t[3] + "</b>" : "") + "</button>"; }).join("");
  }
  /* Was der Kunde gerade tun muss (oder null) */
  function aufgabe(v) {
    return { 1: "Hat sich der Betrieb gemeldet?", 2: "Richtpreis prüfen", 3: v.termin ? null : "Besichtigungstermin wählen", 4: "Angebot prüfen und beauftragen", 6: v.bewertet ? null : v.rechnung && v.rechnung.bezahlt ? "Betrieb bewerten" : "Rechnung begleichen" }[v.stufe] || null;
  }
  function fortschritt(v) {
    return '<ol class="kd-steps">' + SCHRITTE.map(function (s, i) { return '<li class="' + (i < v.stufe || (v.stufe === 6 && v.bewertet) ? "done" : i === v.stufe ? "on" : "") + '"><span>' + s + "</span></li>"; }).join("") + "</ol>" +
      '<p class="kd-schritt">Schritt ' + (v.stufe + 1) + " von " + SCHRITTE.length + ": <b>" + SCHRITTE[v.stufe] + "</b></p>";
  }

  function render() {
    tabs();
    if (st.tab === "vorhaben") return st.offen ? detail(vh(st.offen)) : liste();
    if (st.tab === "nachrichten") return nachrichten();
    return dokumente();
  }
  /* Kurz erklärt: was der Kundenbereich bringt (ausblendbar, gemerkt im Browser) */
  function infoBox() {
    var weg; try { weg = localStorage.getItem("kd-info-weg") === "1"; } catch (e) {}
    if (weg) return "";
    return '<section class="kd-info" aria-label="Ihre Vorteile"><div class="kd-info-kopf"><b>Ihr Bereich – kostenlos für Sie</b><button type="button" class="btn-mini" data-info-weg>Ausblenden</button></div>' +
      '<ul class="kd-info-liste"><li><b>Immer wissen, wo es steht</b><span>Jeder Schritt von Anfrage bis Abnahme.</span></li>' +
      '<li><b>Alles an einem Ort</b><span>Termine, Angebot, Fotos, Rechnung.</span></li>' +
      '<li><b>Digital unterschreiben</b><span>Kein Papier, kein Ausdrucken.</span></li></ul></section>';
  }
  document.addEventListener("click", function (e) { if (e.target.closest("[data-info-weg]")) { try { localStorage.setItem("kd-info-weg", "1"); } catch (e2) {} var b = document.querySelector(".kd-info"); if (b) b.remove(); } });
  function liste() {
    $app.innerHTML = '<div class="kd-head"><h1>Meine Vorhaben</h1><a class="btn btn-signal" href="anfrage.html">' + svg(I.plus) + "Neues Vorhaben</a></div>" + infoBox() +
      '<div class="kd-liste">' + st.vorhaben.map(function (v) {
        var a = aufgabe(v);
        return '<button type="button" class="kd-karte" data-open="' + v.id + '"><span class="kd-karte-kopf"><b>' + esc(v.titel) + "</b><small>" + esc(v.details) + " · seit " + esc(v.eingang) + "</small></span>" +
          '<span class="kd-status">' + (a ? '<span class="pill check">Zu tun: ' + esc(a) + "</span>" : '<span class="pill ' + (v.stufe === 6 ? "" : "ok") + '">' + SCHRITTE[v.stufe] + (v.stufe === 0 ? " – wir suchen Ihren Betrieb" : "") + "</span>") + "</span>" +
          '<span class="kd-mini">' + SCHRITTE.map(function (_, i) { return '<i class="' + (i <= v.stufe ? "on" : "") + '"></i>'; }).join("") + "</span>" +
          (v.betrieb ? '<small class="kd-betrieb">' + esc(v.betrieb.name) + "</small>" : "") + "</button>";
      }).join("") + "</div>" +
      '<p class="portal-small kd-demo">Beispielversion mit erfundenen Daten. In der echten Version melden Sie sich mit E-Mail und Code an – ohne Passwort.</p>';
  }

  function betriebKarte(v) {
    if (!v.betrieb) return "";
    return '<section class="kd-box kd-betriebskarte"><span class="ph-label">Ihr Fachbetrieb</span><b>' + esc(v.betrieb.name) + "</b><small>" + esc(v.betrieb.info) + "</small>" +
      '<div class="kd-btns"><a class="btn btn-outline" href="tel:' + v.betrieb.tel.replace(/\s/g, "") + '">' + svg(I.tel) + "Anrufen</a><button class=\"btn btn-outline\" type=\"button\" data-chat=\"" + v.id + '">' + svg(I.chat) + "Nachricht</button></div></section>";
  }
  function aktion(v) {
    if (v.stufe === 0 && v.wahl) return '<section class="kd-box kd-aktion"><h2>Ihre Anfrage ist ' + (v.wahl.length > 1 ? "bei " + v.wahl.length + " Betrieben" : "bei " + esc(v.wahl[0])) + "</h2><p>" + (v.wahl.length > 1 ? "Jeder gewählte Betrieb meldet sich" : "Der Betrieb meldet sich") + " innerhalb von 24 Stunden und nennt Ihnen anhand Ihrer Fotos einen Richtpreis.</p>" +
      '<button class="btn-mini" type="button" data-demo="vermitteln" data-id="' + v.id + '">Demo: ' + esc(v.wahl[0]) + " hat sich gemeldet</button></section>";
    if (v.stufe === 0) return '<section class="kd-box kd-aktion"><h2>' + (v.note === "C" ? "Wir melden uns mit Ideen" : "Wir suchen Ihren Betrieb") + "</h2><p>" +
      (v.note === "C" ? "Ihr Vorhaben passt laut Ihren Angaben noch nicht ganz zum Budget oder ist noch in Planung. Wir melden uns mit Vorschlägen, bevor ein Betrieb vorbeikommt." : "Wir prüfen Ihre Anfrage und wählen einen passenden, geprüften Betrieb aus Ihrer Region. Er meldet sich innerhalb von 24 Stunden.") +
      '</p><button class="btn-mini" type="button" data-demo="vermitteln" data-id="' + v.id + '">Demo: Betrieb wurde vermittelt</button></section>';
    if (v.stufe === 1) return '<section class="kd-box kd-aktion"><h2>Hat sich ' + esc(v.betrieb.name) + " gemeldet?</h2><p>Der Betrieb meldet sich innerhalb von 24 Stunden. Wenn nicht, vermitteln wir sofort einen anderen – versprochen.</p>" +
      '<div class="kd-btns"><button class="btn btn-signal" type="button" data-ja="gemeldet" data-id="' + v.id + '">Ja, wir sind in Kontakt</button><button class="btn btn-outline" type="button" data-nein="gemeldet" data-id="' + v.id + '">Nein, noch nicht</button></div></section>';
    if (v.stufe === 2) {
      var abw = Math.round((v.richtpreis - v.typ) / v.typ * 100);
      return '<section class="kd-box kd-aktion"><h2>Ihr Richtpreis</h2><div class="p-preis"><span>Richtpreis von ' + esc(v.betrieb.name) + "</span><b>rund " + euro.format(v.richtpreis) + "</b><small>Portal-Orientierung war rund " + euro.format(v.typ) + " (" + (abw >= 0 ? "+" : "") + abw + " %). Das genaue Angebot kommt nach der Besichtigung.</small></div>" +
        '<p class="kd-zitat">„' + esc(v.richtpreisText) + "“</p>" +
        '<div class="kd-btns"><button class="btn btn-signal" type="button" data-ja="richtpreis" data-id="' + v.id + '">Passt – Besichtigung vereinbaren</button><button class="btn btn-outline" type="button" data-nein="richtpreis" data-id="' + v.id + '">Passt nicht</button></div>' +
        '<p class="portal-small">So fährt niemand umsonst raus – und Sie wissen vorher, woran Sie sind.</p></section>';
    }
    if (v.stufe === 3) return '<section class="kd-box kd-aktion"><h2>Besichtigung</h2>' + (v.termin ?
        "<p>Termin bestätigt: <b>" + esc(v.termin) + "</b>. " + esc(v.betrieb.kontakt) + " kommt bei Ihnen vorbei und nimmt Maß.</p>" + '<button class="btn-mini" type="button" data-demo="angebot" data-id="' + v.id + '">Demo: Besichtigung war, Angebot ist da</button>' :
        "<p>Wählen Sie einen Termin, der Ihnen passt:</p>" + '<div class="p-wahl">' + v.termine.map(function (t, i) { return '<label class="p-opt"><input type="radio" name="termin" value="' + esc(t) + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(t) + "</span></label>"; }).join("") + "</div>" +
        '<div class="kd-btns"><button class="btn btn-signal" type="button" data-termin="' + v.id + '">Termin bestätigen</button></div>') + "</section>";
    if (v.stufe === 4) {
      var sum = summe(v);
      return '<section class="kd-box kd-aktion"><h2>Ihr Angebot ' + esc(v.angebot.nr) + "</h2>" +
        '<table class="dok-tab">' + v.angebot.pos.map(function (p) { return "<tr><td>" + esc(p[0]) + "</td><td>" + euro.format(p[1]) + "</td></tr>"; }).join("") +
        '<tr class="sum"><td>Gesamt inkl. MwSt.</td><td>' + euro.format(sum) + "</td></tr></table>" +
        '<p class="portal-small">Richtpreis war ' + euro.format(v.richtpreis) + " – das Angebot liegt " + Math.round((sum - v.richtpreis) / v.richtpreis * 100) + " % darüber" + (v.id === "k1" ? ", weil die Leitungen erneuert werden müssen" : "") + ".</p>" +
        '<label class="p-check"><input type="checkbox" id="kd-wr"> <span>Ich habe die Widerrufsbelehrung erhalten (14 Tage).</span></label>' +
        '<label class="p-check"><input type="checkbox" id="kd-sofort"> <span>Die Arbeiten sollen vor Ende der Widerrufsfrist beginnen. Bei einem Widerruf bezahle ich die bis dahin erbrachten Leistungen anteilig. <small>(freiwillig)</small></span></label>' +
        '<div class="field"><span class="p-lab">Ihre Unterschrift</span><canvas id="kd-sig" class="kd-sig" width="600" height="180" aria-label="Unterschriftenfeld"></canvas><button class="btn-mini" type="button" data-sig-leeren>Löschen</button></div>' +
        '<div class="kd-btns"><button class="btn btn-signal" type="button" data-beauftragen="' + v.id + '">Verbindlich beauftragen</button><button class="btn btn-outline" type="button" data-chat="' + v.id + '">Frage zum Angebot</button></div>' +
        '<p class="portal-small">Den Vertrag schließen Sie direkt mit ' + esc(v.betrieb.name) + ".</p></section>";
    }
    if (v.stufe === 5) return '<section class="kd-box kd-aktion"><h2>Ausführung</h2><p>Start <b>KW 46</b>, Dauer etwa zwei Wochen. Den Fortschritt sehen Sie hier mit Fotos.</p>' +
      '<div class="kd-fotos"><span>Tag 1 · Abbruch</span><span>Tag 3 · Leitungen</span><span>Tag 6 · Abdichtung</span></div>' +
      '<button class="btn-mini" type="button" data-demo="fertig" data-id="' + v.id + '">Demo: Arbeiten sind fertig</button></section>';
    if (v.stufe === 6) return bewertungBox(v);
    return "";
  }
  function googleBox(v) {   // Google-Bewertung: für alle angeboten (egal wie viele Sterne) – die Kundschaft gibt sie selbst ab
    return '<div class="kd-google"><b>Auch bei Google bewerten?</b><p>Damit helfen Sie dem Betrieb auch außerhalb des Portals. Ihr Text wird kopiert, Sie fügen ihn bei Google nur noch ein und senden ihn selbst ab – freiwillig.</p>' +
      '<button class="btn btn-outline" type="button" data-google="' + v.id + '">Text kopieren und Google-Profil öffnen</button></div>';
  }
  function bewertungBox(v) {
    var r = v.rechnung;
    if (v.bewertet) return '<section class="kd-box kd-aktion"><h2>Fertig – danke für Ihre Bewertung</h2><p class="kd-sterne gross">' + "★★★★★".slice(0, v.bewertet) + '<span class="aus">' + "★★★★★".slice(v.bewertet) + "</span></p>" +
      (v.bewertung && v.bewertung.noten ? '<div class="kd-noten">' + KRIT.map(function (k) { var n = v.bewertung.noten[k[0]]; return "<span>" + k[1] + " <b>" + "★★★★★".slice(0, n) + "</b></span>"; }).join("") + "</div>" : "") +
      (v.bewertung && v.bewertung.antwort ? '<p class="kd-zitat">Antwort von ' + esc(v.betrieb.name) + ": „" + esc(v.bewertung.antwort) + "“</p>" : "") +
      googleBox(v) + "<p>Wir erinnern Sie rechtzeitig an Wartung oder Gewährleistung.</p></section>";
    if (!r || !r.bezahlt) return '<section class="kd-box kd-aktion"><h2>Fertig! Jetzt nur noch die Rechnung</h2>' +
      (r ? '<p>Rechnung über <b>' + euro.format(r.betrag) + "</b>, fällig am " + esc(r.faellig) + ". Sie finden sie unter Dokumente.</p>" : "<p>Die Rechnung kommt in den nächsten Tagen.</p>") +
      (r && r.nachweis ? '<p class="bt-hinweis">Zahlungsnachweis hochgeladen – der Betrieb bestätigt den Eingang. Spätestens nach 5 Werktagen schalten wir die Bewertung frei.</p>' : "") +
      '<p class="portal-small">Bewerten können Sie, sobald die Rechnung bezahlt ist. So stammen alle Bewertungen im Portal von echten, abgeschlossenen Aufträgen.</p>' +
      '<div class="kd-btns">' + (r && !r.nachweis ? '<label class="btn btn-outline">Zahlungsnachweis hochladen<input type="file" accept="image/*,application/pdf" data-nachweis="' + v.id + '" hidden></label>' : "") +
        '<button class="btn btn-outline" type="button" data-chat="' + v.id + '">Etwas ist nicht in Ordnung</button></div>' +
      '<button class="btn-mini" type="button" data-demo="bezahlt" data-id="' + v.id + '">Demo: Betrieb bestätigt den Zahlungseingang</button></section>';
    return '<section class="kd-box kd-aktion"><h2>Wie zufrieden waren Sie mit ' + esc(v.betrieb.name) + "?</h2><p>Rechnung bezahlt – danke! Ihre Bewertung hilft anderen bei der Auswahl und sorgt dafür, dass gute Betriebe mehr Aufträge bekommen.</p>" +
      '<div class="kd-krit">' + KRIT.map(function (k) { var n = (st.noten || {})[k[0]] || 0; return '<div class="kd-krit-z"><span>' + k[1] + '</span><div class="kd-rate klein" role="radiogroup" aria-label="' + k[1] + '">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" class="' + (i <= n ? "on" : "") + '" data-krit="' + k[0] + '" data-n="' + i + '" aria-label="' + i + ' von 5">' + svg(I.star) + "</button>"; }).join("") + "</div></div>"; }).join("") + "</div>" +
      '<textarea class="kd-text" id="kd-bew-text" placeholder="Was war gut, was könnte besser sein? (freiwillig)">' + esc(st.bewText || "") + '</textarea><div class="kd-btns"><button class="btn btn-signal" type="button" data-bewerten="' + v.id + '">Bewertung senden</button></div>' +
      '<p class="portal-small">Ihre Bewertung erscheint mit Vornamen und Ort, zum Beispiel „Maria aus Erlangen“. Der Betrieb kann öffentlich antworten, aber nichts löschen.</p></section>';
  }
  function vergleichBox(v) {
    if (!v.andere || !v.andere.length) return "";
    return '<section class="kd-box"><span class="ph-label">Vergleich</span><p>Ebenfalls angefragt:</p><div class="kd-vgl">' + v.andere.map(function (x, i) {
      return '<div class="kd-vgl-z"><b>' + esc(x.name) + "</b>" + (x.status === "abgesagt" ? '<span class="pill">abgesagt</span>' : '<button class="btn-mini" type="button" data-absagen="' + v.id + '" data-i="' + i + '">Absagen</button>') + "</div>"; }).join("") + "</div>" +
      (v.andere.some(function (x) { return x.status !== "abgesagt"; }) ? '<button class="btn btn-outline" type="button" data-alle-absagen="' + v.id + '">Für ' + esc(v.betrieb ? v.betrieb.name : v.wahl[0]) + " entschieden – allen anderen absagen</button>" : "") +
      '<p class="portal-small">Eine kurze Absage spart den Betrieben Arbeit. Sie geht freundlich und ohne Begründung raus.</p></section>';
  }
  function detail(v) {
    $app.innerHTML = '<p><button class="btn-mini" type="button" data-zurueck>← Alle Vorhaben</button></p>' +
      '<div class="kd-head"><div><h1>' + esc(v.titel) + "</h1><p class=\"kd-sub\">" + esc(v.details) + " · " + esc(v.ort) + " · Anfrage vom " + esc(v.eingang) + "</p></div></div>" +
      fortschritt(v) + aktion(v) + betriebKarte(v) + vergleichBox(v) +
      '<section class="kd-box"><span class="ph-label">Ihre Angaben</span><p>Portal-Orientierung: typisch rund <b>' + euro.format(v.typ) + "</b> (meist " + euro.format(v.von) + " bis " + euro.format(v.bis) + ")" + (v.fotos ? " · " + v.fotos + " Fotos" : "") + "</p></section>";
    var c = document.getElementById("kd-sig");
    if (c) {
      var ctx = c.getContext("2d"), down = false; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#1d3a8a"; st.zeichnung = false;
      var pos = function (e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; };
      c.addEventListener("pointerdown", function (e) { down = true; c.setPointerCapture(e.pointerId); var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); });
      c.addEventListener("pointermove", function (e) { if (!down) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); st.zeichnung = true; });
      c.addEventListener("pointerup", function () { down = false; });
    }
  }
  function nachrichten() {
    var mit = st.vorhaben.filter(function (v) { return v.betrieb; });
    var v = st.chatId ? vh(st.chatId) : null;
    if (v) {
      v.neuNachricht = false; tabs();
      $app.innerHTML = '<p><button class="btn-mini" type="button" data-chat-zurueck>← Alle Nachrichten</button></p><div class="kd-head"><div><h1>' + esc(v.betrieb.name) + '</h1><p class="kd-sub">' + esc(v.titel) + "</p></div></div>" +
        '<div class="kd-chat" id="kd-chat">' + (v.chat.length ? v.chat.map(function (m) { return '<div class="kd-msg ' + (m.von === "ich" ? "me" : "") + '">' + esc(m.text) + "<small>" + esc(m.wann) + "</small></div>"; }).join("") : '<p class="col-empty">Noch keine Nachrichten.</p>') + "</div>" +
        '<div class="kd-send"><input id="kd-in" type="text" placeholder="Nachricht an ' + esc(v.betrieb.name) + ' …" aria-label="Nachricht"><button class="btn btn-signal" type="button" data-senden="' + v.id + '">Senden</button></div>';
      var ch = document.getElementById("kd-chat"); ch.scrollTop = ch.scrollHeight;
      return;
    }
    $app.innerHTML = '<div class="kd-head"><h1>Nachrichten</h1></div><div class="kd-liste">' + (mit.length ? mit.map(function (x) {
      var l = x.chat[x.chat.length - 1];
      return '<button type="button" class="kd-karte" data-chat="' + x.id + '"><span class="kd-karte-kopf"><b>' + esc(x.betrieb.name) + "</b><small>" + esc(x.titel) + "</small></span><span class=\"kd-letzte\">" + (l ? esc(l.text) : "Noch keine Nachrichten") + "</span></button>"; }).join("") :
      '<p class="col-empty">Sobald ein Betrieb vermittelt ist, können Sie ihm hier schreiben.</p>') + "</div>";
  }
  function dokumente() {
    var docs = [];
    st.vorhaben.forEach(function (v) {
      docs.push([v.titel, "Ihre Anfrage mit Angaben" + (v.fotos ? " und " + v.fotos + " Fotos" : ""), v.eingang]);
      if (v.stufe >= 2 && v.richtpreis) docs.push([v.titel, "Richtpreis " + euro.format(v.richtpreis), "Betrieb"]);
      if (v.stufe >= 4 && v.angebot) docs.push([v.titel, "Angebot " + v.angebot.nr + " · " + euro.format(summe(v)), "PDF"]);
      if (v.stufe >= 5 && v.angebot) docs.push([v.titel, "Auftrag – von Ihnen unterschrieben" + (v.unterschrieben ? " am " + v.unterschrieben : ""), "PDF"]);
      if (v.stufe >= 6) docs.push([v.titel, v.rechnung ? "Rechnung · " + euro.format(v.rechnung.betrag) + (v.rechnung.bezahlt ? " · bezahlt" : " · offen") : "Abnahmeprotokoll und Rechnung", "PDF"]);
    });
    $app.innerHTML = '<div class="kd-head"><h1>Dokumente</h1></div><div class="kd-liste">' + docs.map(function (d) {
      return '<button type="button" class="kd-karte kd-doc" data-doc-toast="' + esc(d[1]) + '">' + '<span class="kd-doc-ic">' + svg(I.doc) + '</span><span class="kd-karte-kopf"><b>' + esc(d[1]) + "</b><small>" + esc(d[0]) + " · " + esc(d[2]) + "</small></span></button>"; }).join("") + "</div>" +
      '<p class="portal-small kd-demo">Alle Unterlagen an einem Ort – auch nach Jahren noch, zum Beispiel für die Gewährleistung.</p>';
  }

  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-tab]"))) { st.tab = el.getAttribute("data-tab"); st.offen = null; st.chatId = null; render(); return window.scrollTo(0, 0); }
    if ((el = t.closest("[data-open]"))) { st.offen = el.getAttribute("data-open"); render(); return window.scrollTo(0, 0); }
    if (t.closest("[data-zurueck]")) { st.offen = null; return render(); }
    if ((el = t.closest("[data-chat]"))) { st.tab = "nachrichten"; st.chatId = el.getAttribute("data-chat"); render(); return window.scrollTo(0, 0); }
    if (t.closest("[data-chat-zurueck]")) { st.chatId = null; return render(); }
    if ((el = t.closest("[data-doc-toast]"))) return toast("„" + el.getAttribute("data-doc-toast") + "“ wird als PDF geöffnet (Demo).");
    var id = (el = t.closest("[data-id], [data-termin], [data-beauftragen], [data-bewerten], [data-senden], [data-google]")) ? (el.getAttribute("data-id") || el.getAttribute("data-termin") || el.getAttribute("data-beauftragen") || el.getAttribute("data-bewerten") || el.getAttribute("data-senden") || el.getAttribute("data-google")) : null;
    var v = id ? vh(id) : null;
    if (t.closest('[data-demo="vermitteln"]')) { v.stufe = 1; v.betrieb = v.wahl ? betriebInfo(v.wahl[0]) : { name: "Musterbetrieb Haustechnik", kontakt: "Alex", info: "Meisterbetrieb · Haftpflicht geprüft · ★ 4,8 (61 Bewertungen)", tel: "0151 000 0400" }; v.richtpreis = Math.round(v.typ * 1.04 / 100) * 100; v.richtpreisText = "Anhand Ihrer Angaben und Fotos. Die Details kläre ich gern bei der Besichtigung."; v.termine = ["Mi, 15.10., 15:00 Uhr", "Do, 16.10., 08:00 Uhr"]; render(); return toast(v.wahl ? v.betrieb.name + " hat sich gemeldet." : "Ihr Betrieb: Musterbetrieb Haustechnik. Er meldet sich innerhalb von 24 Stunden."); }
    if (t.closest('[data-ja="gemeldet"]')) { v.stufe = 2; render(); return toast("Danke! Der Betrieb hat Ihnen einen Richtpreis geschickt."); }
    if (t.closest('[data-nein="gemeldet"]')) { v.betrieb = { name: "Bad & Wärme Schmitt", kontakt: "Frau Schmitt", info: "Meisterbetrieb · Haftpflicht geprüft · ★ 4,6 (24 Bewertungen)", tel: "0151 000 0500" }; render(); return toast("Das tut uns leid. Wir haben sofort einen anderen Betrieb vermittelt: Bad & Wärme Schmitt."); }
    if (t.closest('[data-ja="richtpreis"]')) { v.stufe = 3; render(); return toast("Prima! Wählen Sie jetzt einen Termin für die Besichtigung."); }
    if (t.closest('[data-nein="richtpreis"]')) { v.chat.push({ von: "ich", text: "Der Richtpreis ist mir zu hoch. Gibt es eine günstigere Variante?", wann: "gerade eben" }); st.tab = "nachrichten"; st.chatId = v.id; render(); return toast("Wir haben dem Betrieb geschrieben – er meldet sich mit einer günstigeren Variante."); }
    if (t.closest("[data-termin]")) { var r = document.querySelector('input[name="termin"]:checked'); v.termin = r ? r.value : v.termine[0]; render(); return toast("Termin bestätigt: " + v.termin + ". Sie bekommen eine Erinnerung am Vortag."); }
    if (t.closest('[data-demo="angebot"]')) { v.stufe = 4; if (!v.angebot) v.angebot = { nr: "AN-2026-" + (300 + st.vorhaben.indexOf(v)), pos: [["Leistung laut Besichtigung", Math.round(v.richtpreis * 0.86)], ["Material", Math.round(v.richtpreis * 0.18)]] }; render(); return toast("Ihr Angebot ist da."); }
    if (t.closest("[data-sig-leeren]")) { var c = document.getElementById("kd-sig"); c.getContext("2d").clearRect(0, 0, c.width, c.height); st.zeichnung = false; return; }
    if (t.closest("[data-beauftragen]")) {
      if (!document.getElementById("kd-wr").checked) return toast("Bitte bestätigen Sie zuerst die Widerrufsbelehrung.");
      if (!st.zeichnung) return toast("Bitte unterschreiben Sie im Feld.");
      v.stufe = 5; v.unterschrieben = new Date().toLocaleDateString("de-DE"); v.chat.push({ von: "betrieb", text: "Vielen Dank für Ihren Auftrag! Wir starten in KW 46.", wann: "gerade eben" }); v.neuNachricht = true;
      render(); return toast("Beauftragt! Den unterschriebenen Auftrag finden Sie unter Dokumente.");
    }
    if (t.closest('[data-demo="fertig"]')) { v.stufe = 6; v.rechnung = { betrag: summe(v) || v.richtpreis || v.typ, bezahlt: false, faellig: datumIn(14) }; render(); return toast("Fertig! Abnahmeprotokoll und Rechnung liegen unter Dokumente."); }
    if (t.closest('[data-demo="bezahlt"]')) { v.rechnung = v.rechnung || { betrag: v.typ }; v.rechnung.bezahlt = true; v.rechnung.datum = datumIn(0); st.noten = {}; render(); return toast("Zahlung bestätigt – jetzt können Sie bewerten."); }
    if ((el = t.closest("[data-krit]"))) { var tx = document.getElementById("kd-bew-text"); if (tx) st.bewText = tx.value; st.noten = st.noten || {}; st.noten[el.getAttribute("data-krit")] = +el.getAttribute("data-n"); render(); return; }
    if (t.closest("[data-bewerten]")) {
      var no = st.noten || {}, fehlt = KRIT.filter(function (k) { return !no[k[0]]; });
      if (fehlt.length) return toast("Bitte noch bewerten: " + fehlt.map(function (k) { return k[1]; }).join(", ") + ".");
      var txt = (document.getElementById("kd-bew-text") || {}).value || "";
      v.bewertet = Math.round(KRIT.reduce(function (s2, k) { return s2 + no[k[0]]; }, 0) / KRIT.length); v.bewertung = { noten: no, text: txt.trim() }; st.noten = {}; st.bewText = "";
      try { var alle = JSON.parse(localStorage.getItem("portal-bewertungen") || "[]"); alle.push({ betrieb: v.betrieb.name, titel: v.titel, ort: v.ort, noten: no, sterne: v.bewertet, text: txt.trim(), datum: datumIn(0) }); localStorage.setItem("portal-bewertungen", JSON.stringify(alle.slice(-30))); } catch (e2) { /* privat */ }
      render(); return toast("Danke für Ihre Bewertung!");
    }
    if (t.closest("[data-google]")) {
      var gt = (v.bewertung && v.bewertung.text) || "";
      try { if (gt && navigator.clipboard) navigator.clipboard.writeText(gt).catch(function () {}); } catch (e3) { /* egal */ }
      return toast((gt ? "Text kopiert. " : "") + "Demo: Hier öffnet sich das Google-Profil von " + v.betrieb.name + " zum Bewerten – den Link hinterlegt der Betrieb im Cockpit.");
    }
    if ((el = t.closest("[data-absagen]"))) { var vv = vh(el.getAttribute("data-absagen")), x = vv.andere[+el.getAttribute("data-i")]; x.status = "abgesagt"; render(); return toast(x.name + " hat eine freundliche Absage bekommen."); }
    if ((el = t.closest("[data-alle-absagen]"))) { var vw = vh(el.getAttribute("data-alle-absagen")), n2 = 0; vw.andere.forEach(function (x2) { if (x2.status !== "abgesagt") { x2.status = "abgesagt"; n2++; } }); render(); return toast(n2 + (n2 === 1 ? " Betrieb hat" : " Betriebe haben") + " eine freundliche Absage bekommen."); }
    if (t.closest("[data-senden]")) { var inp = document.getElementById("kd-in"); if (!inp.value.trim()) return; v.chat.push({ von: "ich", text: inp.value.trim(), wann: "gerade eben" }); render();
      setTimeout(function () { v.chat.push({ von: "betrieb", text: "Danke für Ihre Nachricht, ich melde mich heute noch dazu.", wann: "gerade eben" }); if (st.tab === "nachrichten" && st.chatId === v.id) render(); }, 1200); return; }
  });
  document.addEventListener("change", function (e) {
    var el = e.target; if (!el.hasAttribute || !el.hasAttribute("data-nachweis") || !el.files || !el.files[0]) return;
    var v = vh(el.getAttribute("data-nachweis")); v.rechnung.nachweis = true; render(); toast("Zahlungsnachweis hochgeladen (Demo: nur in diesem Browser).");
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "kd-in") { e.preventDefault(); var b = document.querySelector("[data-senden]"); if (b) b.click(); } });
  render();
})();
