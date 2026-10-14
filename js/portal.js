/* =====================================================================
   AUFTRAGSPORTAL FÜR ENDKUNDEN (gehört zu anfrage.html)
   ---------------------------------------------------------------------
   Fünf Schritte: Vorhaben → Details → Ort & Fotos → Preis & Budget → Kontakt.
   - Preis: Groß steht ein TYPISCHER Wert, darunter die übliche Spanne,
     was enthalten ist, was teurer macht und 10 % Puffer.
   - Budget-Abgleich mit der OBEREN Zahl („Können Sie bis zu … einplanen?“).
   - Jede Anfrage bekommt eine Note: A = sofort vermitteln, B = kurz
     nachfragen, C = nicht vermitteln (Budget, Mieter, „später“).
   Beispielversion: Die Anfrage wird NUR im eigenen Browser gespeichert
   (localStorage „portal-anfragen“) und erscheint in der Demo unter
   „Ansicht als: Betreiber“ → „Vermittlung“. Es wird nichts verschickt.

   PREISE: Orientierungswerte für Franken (Stand 2026), brutto, für
   „gehobene“ Ausstattung. Optionen mit einer dritten Zahl ändern den
   Preis (0.8 = 20 % günstiger, 1.15 = 15 % teurer). Später werden die
   Werte mit den echten Auftragswerten der Betriebe abgeglichen.
   ===================================================================== */
(function () {
  "use strict";

  var AUSSTATTUNG = { id: "stufe", typ: "wahl", label: "Welche Ausstattung wünschen Sie?", optionen: [
    ["einfach", "Einfach – solide Standardprodukte", 0.82], ["gehoben", "Gehoben – z. B. größere Fliesen, bodengleiche Dusche", 1], ["hochwertig", "Hochwertig – Designprodukte, raumhohe Fliesen, Extras", 1.3]] };

  var VORHABEN = [
    { id: "bad", label: "Bad sanieren", gewerk: "SHK / Fliesen", icon: '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V5a2 2 0 0 1 4 0"/><path d="M7 20l-1 2M17 20l1 2"/>',
      fragen: [
        { id: "flaeche", typ: "zahl", label: "Wie groß ist das Bad?", einheit: "m²", wert: 8, min: 2, max: 40 },
        { id: "umfang", typ: "wahl", label: "Was soll gemacht werden?", optionen: [["komplett", "Komplett neu"], ["teil", "Teilweise (z. B. nur Dusche oder Fliesen)"], ["barrierefrei", "Barrierefrei umbauen"]] },
        AUSSTATTUNG,
        { id: "leitungen", typ: "wahl", label: "Sollen alte Wasser- und Abwasserleitungen mit erneuert werden?", optionen: [["nein", "Nein, Leitungen sind in Ordnung", 1], ["ja", "Ja, Leitungen mit erneuern", 1.12], ["unklar", "Leitungen: weiß ich nicht", 1.06]] }
      ],
      preis: function (a) { var m = a.flaeche || 8, f = { komplett: [2000, 2600], teil: [1000, 1400], barrierefrei: [2200, 2900] }[a.umfang || "komplett"]; return [m * f[0], m * f[1]]; },
      enthalten: "Abbruch, Material, Einbau von Fliesen, Dusche, WC und Waschtisch, Entsorgung",
      teurer: ["alte oder marode Leitungen", "Wände versetzen oder Tür verlegen", "Fußbodenheizung, Fenster tauschen", "schwer zugängliche Etage ohne Aufzug"] },
    { id: "heizung", label: "Heizung", gewerk: "SHK", icon: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-4 3 0-3 1-6-1-9-2 3-6 7-6 13 0 4 3 7 7 7z"/>',
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["waermepumpe", "Neue Wärmepumpe"], ["gas", "Neue Gas-Brennwertheizung"], ["reparatur", "Reparatur oder Wartung"]] },
        { id: "wohnflaeche", typ: "zahl", label: "Beheizte Wohnfläche", einheit: "m²", wert: 140, min: 30, max: 600 },
        { id: "heizflaechen", typ: "wahl", label: "Wie wird geheizt?", optionen: [["heizkoerper", "Heizkörper", 1], ["fbh", "Fußbodenheizung", 0.95], ["alt", "Alte Heizkörper, evtl. tauschen", 1.12]] }
      ],
      preis: function (a) { var k = Math.max(0.8, Math.min(1.6, (a.wohnflaeche || 140) / 140));
        return { waermepumpe: [30000 * k, 38000 * k], gas: [12000 * k, 15000 * k], reparatur: [180, 900] }[a.art || "waermepumpe"]; },
      hinweis: function (a) { return a.art === "waermepumpe" ? "Für Wärmepumpen gibt es oft staatliche Förderung, die den Eigenanteil deutlich senken kann. Der Betrieb prüft das mit Ihnen." : ""; },
      enthalten: "Gerät, Montage, Anschluss, Inbetriebnahme, Entsorgung der alten Anlage",
      teurer: ["Heizkörper oder Leitungen tauschen", "Elektro-Anpassungen am Zählerschrank", "Fundament oder Schallschutz für die Außeneinheit", "Schornstein- oder Abgasarbeiten"] },
    { id: "fenster", label: "Fenster & Türen", gewerk: "Fenster / Schreiner", icon: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>',
      fragen: [
        { id: "anzahl", typ: "zahl", label: "Wie viele Fenster?", einheit: "Stück", wert: 6, min: 1, max: 60 },
        { id: "material", typ: "wahl", label: "Material", optionen: [["kunststoff", "Kunststoff"], ["holz", "Holz oder Holz-Alu"], ["egal", "Weiß ich noch nicht"]] },
        { id: "extras", typ: "wahl", label: "Rollläden oder Insektenschutz?", optionen: [["nein", "Nein", 1], ["teil", "Bei einigen Fenstern", 1.12], ["alle", "Bei allen Fenstern", 1.28]] }
      ],
      preis: function (a) { var n = a.anzahl || 6, f = { kunststoff: [950, 1250], holz: [1500, 1950], egal: [950, 1950] }[a.material || "kunststoff"]; return [n * f[0], n * f[1]]; },
      enthalten: "Fenster nach Maß, Ausbau und Entsorgung der alten Fenster, Einbau und Abdichtung",
      teurer: ["Sondermaße oder Rundbögen", "Putz- und Malerarbeiten innen und außen", "Gerüst ab dem 2. Obergeschoss", "Schallschutz- oder Sicherheitsglas"] },
    { id: "dach", label: "Dach", gewerk: "Dachdecker", icon: '<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/>',
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["neu", "Neu eindecken"], ["daemmung", "Neu eindecken mit Dämmung"], ["reparatur", "Reparatur (z. B. undicht)"]] },
        { id: "flaeche", typ: "zahl", label: "Dachfläche (ungefähr)", einheit: "m²", wert: 150, min: 10, max: 800 }
      ],
      preis: function (a) { var m = a.flaeche || 150; return { neu: [m * 190, m * 250], daemmung: [m * 290, m * 370], reparatur: [400, 3500] }[a.art || "neu"]; },
      enthalten: "Gerüst, Abdecken, neue Eindeckung, Dachrinnen-Anschlüsse, Entsorgung",
      teurer: ["Schäden am Dachstuhl", "Gauben, Dachfenster oder Kamin-Einfassung", "Entsorgung von Asbestplatten", "neue Dachrinnen und Fallrohre"] },
    { id: "maler", label: "Maler & Boden", gewerk: "Maler / Bodenleger", icon: '<rect x="3" y="3" width="14" height="6" rx="1"/><path d="M17 6h3v5h-8v4"/><rect x="10" y="15" width="4" height="7" rx="1"/>',
      fragen: [
        { id: "art", typ: "wahl", label: "Was soll gemacht werden?", optionen: [["streichen", "Wände und Decken streichen"], ["boden", "Neuer Boden (Vinyl, Parkett, Laminat)"], ["beides", "Beides"]] },
        { id: "flaeche", typ: "zahl", label: "Wohnfläche", einheit: "m²", wert: 80, min: 10, max: 400 },
        { id: "zustand", typ: "wahl", label: "Zustand von Wänden und Untergrund", optionen: [["gut", "Gut, kaum Ausbesserungen", 1], ["mittel", "Einige Risse und Löcher", 1.12], ["schlecht", "Alte Tapeten runter, Untergrund schlecht", 1.3]] }
      ],
      preis: function (a) { var m = a.flaeche || 80; return { streichen: [m * 25, m * 35], boden: [m * 65, m * 95], beides: [m * 90, m * 130] }[a.art || "streichen"]; },
      enthalten: "Abdecken, Vorbereitung, Material, Ausführung, Reinigung",
      teurer: ["Möbel rücken und einlagern", "Spachteln in Q3/Q4-Qualität", "Treppenhaus oder hohe Räume", "Fußleisten und Übergangsprofile"] },
    { id: "elektro", label: "Elektro", gewerk: "Elektro", icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["klein", "Kleinauftrag (Steckdosen, Lampen, Störung)"], ["wallbox", "Wallbox fürs E-Auto"], ["neu", "Elektrik einer Wohnung erneuern"]] },
        { id: "flaeche", typ: "zahl", label: "Wohnfläche (nur bei Erneuerung)", einheit: "m²", wert: 80, min: 10, max: 400 }
      ],
      preis: function (a) { return { klein: [150, 700], wallbox: [1500, 2500], neu: [(a.flaeche || 80) * 100, (a.flaeche || 80) * 140] }[a.art || "klein"]; },
      enthalten: "Material, Montage, Prüfung und Protokoll",
      teurer: ["Zählerschrank muss erneuert werden", "lange Kabelwege oder Wanddurchbrüche", "Anmeldung beim Netzbetreiber mit Auflagen"] },
    { id: "reparatur", label: "Reparatur & Sonstiges", gewerk: "nach Beschreibung", icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
      fragen: [{ id: "text", typ: "text", label: "Was soll gemacht werden?", platzhalter: "z. B. Wasserhahn tropft, Tür klemmt, Rollladen kaputt …" }],
      preis: function () { return [120, 800]; },
      enthalten: "Anfahrt, Arbeitszeit, Kleinmaterial",
      teurer: ["Ersatzteile", "Notdienst am Abend oder Wochenende"] }
  ];
  var ZEIT = [["sofort", "So schnell wie möglich"], ["3m", "In den nächsten 3 Monaten"], ["spaeter", "Später / noch in Planung"]];
  var ROLLE = [["eigen", "Eigentümer/in"], ["mieter", "Mieter/in"], ["verwaltung", "Hausverwaltung"]];
  var BUDGET = [["ja", "Ja, das passt"], ["unklar", "Weiß ich noch nicht"], ["nein", "Eher nicht"]];
  var SCHRITTE = ["Vorhaben", "Details", "Ort & Fotos", "Preis", "Kontakt"];

  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rund = function (n) { return n < 2000 ? Math.round(n / 50) * 50 : Math.round(n / 500) * 500; };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };

  function leer() { return { schritt: 0, vorhaben: null, a: {}, zeit: "3m", rolle: "eigen", plz: "", ort: "", fotos: [], name: "", tel: "", mail: "", text: "", budget: null }; }
  var s = leer();
  var $step = document.getElementById("portal-step"), $err = document.getElementById("portal-err");
  var $next = document.getElementById("p-next"), $back = document.getElementById("p-back");

  function vh() { return VORHABEN.filter(function (v) { return v.id === s.vorhaben; })[0]; }
  function wahl(name, opts, akt) {
    return '<div class="p-wahl" role="radiogroup">' + opts.map(function (o) {
      return '<label class="p-opt"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === akt ? " checked" : "") + "><span>" + esc(o[1]) + "</span></label>"; }).join("") + "</div>";
  }
  /* Preis: Grundspanne × Faktoren der gewählten Optionen */
  function preis() {
    var v = vh(), p = v.preis(s.a), f = 1;
    v.fragen.forEach(function (q) { if (!q.optionen) return; var w = s.a[q.id] || (q.id === "stufe" ? "gehoben" : q.optionen[0][0]); var o = q.optionen.filter(function (x) { return x[0] === w; })[0]; if (o && o[2]) f *= o[2]; });
    var von = rund(p[0] * f), bis = rund(p[1] * f), typ = rund((p[0] + p[1]) / 2 * f);
    return { von: von, bis: bis, typ: typ, puffer: rund(bis * 1.1) };
  }
  function details() {
    return vh().fragen.map(function (f) {
      var w = s.a[f.id] != null ? s.a[f.id] : f.wert != null ? f.wert : f.optionen ? f.optionen[0][0] : "";
      if (f.optionen) { var o = f.optionen.filter(function (x) { return x[0] === w; })[0]; w = o ? o[1].split(" – ")[0] : w; }
      return f.einheit ? w + " " + f.einheit : w;
    }).filter(function (x) { return String(x).trim(); }).join(" · ");
  }
  /* Note A/B/C mit Gründen */
  function note(p) {
    var c = [], b = [];
    if (s.budget === "nein") c.push("Budget passt laut Kunde nicht");
    if (s.zeit === "spaeter") c.push("noch in Planung – in 3 Monaten nachfragen");
    if (s.rolle === "mieter" && p.typ > 1500) c.push("Mieter – Zustimmung des Vermieters nötig");
    if (s.budget === "unklar") b.push("Budget noch unklar – kurz nachfragen");
    if (!s.fotos.length && s.vorhaben !== "reparatur") b.push("keine Fotos");
    if (!s.tel) b.push("nur E-Mail angegeben");
    return { note: c.length ? "C" : b.length ? "B" : "A", gruende: c.concat(b) };
  }

  function zeigen() {
    var html = "", v = vh();
    if (s.schritt === 0) {
      html = "<h2>Was haben Sie vor?</h2>" + '<div class="p-tiles">' + VORHABEN.map(function (x) {
        return '<button type="button" class="p-tile' + (s.vorhaben === x.id ? " on" : "") + '" data-vh="' + x.id + '">' + svg(x.icon) + "<span>" + x.label + "</span></button>"; }).join("") + "</div>";
    }
    if (s.schritt === 1) {
      html = "<h2>" + esc(v.label) + ": ein paar Details</h2>" + v.fragen.map(function (f) {
        var akt = s.a[f.id];
        if (f.typ === "zahl") return '<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><div class="p-zahl"><input id="f-' + f.id + '" data-f="' + f.id + '" type="number" inputmode="decimal" min="' + f.min + '" max="' + f.max + '" value="' + (akt != null ? akt : f.wert) + '"><span>' + f.einheit + "</span></div></div>";
        if (f.typ === "text") return '<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><textarea id="f-' + f.id + '" data-f="' + f.id + '" placeholder="' + esc(f.platzhalter) + '">' + esc(akt || "") + "</textarea></div>";
        return '<div class="field"><span class="p-lab">' + f.label + "</span>" + wahl("f-" + f.id, f.optionen, akt || (f.id === "stufe" ? "gehoben" : f.optionen[0][0])) + "</div>";
      }).join("") +
      '<div class="field"><span class="p-lab">Wann soll es losgehen?</span>' + wahl("zeit", ZEIT, s.zeit) + "</div>" +
      '<div class="field"><span class="p-lab">Sie sind</span>' + wahl("rolle", ROLLE, s.rolle) + "</div>";
    }
    if (s.schritt === 2) {
      var gross = preis().typ > 5000;
      html = "<h2>Wo und wie sieht es aus?</h2>" +
        '<div class="p-row"><div class="field"><label for="p-plz">Postleitzahl</label><input id="p-plz" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="' + esc(s.plz) + '" placeholder="91052"></div>' +
        '<div class="field"><label for="p-ort">Ort</label><input id="p-ort" autocomplete="address-level2" value="' + esc(s.ort) + '" placeholder="Erlangen"></div></div>' +
        '<div class="field"><label for="p-text">Beschreibung <span class="opt">(freiwillig)</span></label><textarea id="p-text" placeholder="Was ist Ihnen wichtig? Besonderheiten?">' + esc(s.text) + "</textarea></div>" +
        '<div class="field"><span class="p-lab">Fotos ' + (gross ? "" : '<span class="opt">(freiwillig, hilft sehr)</span>') + "</span>" +
          (gross ? '<small class="p-sub">Bitte mindestens ein Foto: So kann Ihnen der Betrieb einen Richtpreis nennen, bevor er extra vorbeikommt.</small>' : "") +
          '<div class="p-fotos">' + s.fotos.map(function (f) { return '<img src="' + f + '" alt="Ihr Foto">'; }).join("") +
          '<label class="p-foto-add">' + svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>') + '<span>Foto hinzufügen</span><input type="file" accept="image/*" multiple id="p-foto" hidden></label></div></div>';
    }
    if (s.schritt === 3) {
      var p = preis(), hin = v.hinweis ? v.hinweis(s.a) : "";
      html = "<h2>Was kostet das ungefähr?</h2>" + preisBox(p, v) + (hin ? '<p class="p-hinweis">' + esc(hin) + "</p>" : "") +
        '<div class="field p-budget"><span class="p-lab">Können Sie <b>bis zu ' + euro.format(p.bis) + "</b> für Ihr Vorhaben einplanen?</span>" + wahl("budget", BUDGET, s.budget) + "</div>" +
        '<div id="p-budget-tipp"></div>';
    }
    if (s.schritt === 4) {
      html = "<h2>Wie erreicht Sie der Betrieb?</h2>" +
        '<div class="field"><label for="p-name">Name</label><input id="p-name" autocomplete="name" value="' + esc(s.name) + '"></div>' +
        '<div class="p-row"><div class="field"><label for="p-tel">Telefon <span class="opt">(empfohlen)</span></label><input id="p-tel" type="tel" autocomplete="tel" value="' + esc(s.tel) + '"></div>' +
        '<div class="field"><label for="p-mail">E-Mail</label><input id="p-mail" type="email" autocomplete="email" value="' + esc(s.mail) + '"></div></div>' +
        '<label class="p-check"><input type="checkbox" id="p-ok"> <span>Ich bin einverstanden, dass meine Angaben an <b>einen</b> geprüften Fachbetrieb aus meiner Region weitergegeben werden, damit er mich wegen meines Vorhabens kontaktiert. Details in der <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>.</span></label>';
    }
    $step.innerHTML = html;
    var ol = document.querySelector(".portal-steps");
    ol.innerHTML = SCHRITTE.map(function (t, i) { return '<li class="' + (i < s.schritt ? "done" : i === s.schritt ? "on" : "") + '">' + t + "</li>"; }).join("");
    $back.hidden = s.schritt === 0;
    $next.textContent = s.schritt === 4 ? "Kostenlos anfragen" : "Weiter";
    $err.textContent = "";
    budgetTipp();
  }
  function preisBox(p, v) {
    return '<div class="p-preis"><span>Typisch für ' + esc(v.label) + " · " + esc(details()) + "</span>" +
      "<b>rund " + euro.format(p.typ) + "</b>" +
      "<small>Die meisten Vorhaben dieser Art kosten zwischen " + euro.format(p.von) + " und " + euro.format(p.bis) + ". Planen Sie etwa 10 % Puffer ein (bis rund " + euro.format(p.puffer) + ").</small></div>" +
      '<div class="p-info"><p><b>Enthalten:</b> ' + esc(v.enthalten) + "</p><p><b>Teurer wird es bei:</b></p><ul>" + v.teurer.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<p class="portal-small">Unverbindliche Orientierung inkl. MwSt., kein Angebot. Den genauen Preis nennt Ihnen der Betrieb – zuerst als Richtpreis anhand Ihrer Fotos.</p></div>';
  }
  function budgetTipp() {
    var el = document.getElementById("p-budget-tipp"); if (!el) return;
    var r = document.querySelector('input[name="budget"]:checked');
    el.innerHTML = r && r.value === "nein" ? '<p class="p-tipp"><b>Tipp:</b> Oft hilft eine einfachere Ausstattung, eine Teilsanierung oder eine Förderung. Sie können oben bei „Details“ etwas ändern – oder die Anfrage trotzdem senden; wir melden uns dann mit Ideen, bevor ein Betrieb vorbeikommt.</p>' : "";
  }

  function lesen() {
    document.querySelectorAll("[data-f]").forEach(function (el) { var k = el.getAttribute("data-f"); s.a[k] = el.type === "number" ? parseFloat(String(el.value).replace(",", ".")) || 0 : el.value; });
    (vh() ? vh().fragen : []).forEach(function (f) { var r = document.querySelector('input[name="f-' + f.id + '"]:checked'); if (r) s.a[f.id] = r.value; });
    var z = document.querySelector('input[name="zeit"]:checked'); if (z) s.zeit = z.value;
    var r2 = document.querySelector('input[name="rolle"]:checked'); if (r2) s.rolle = r2.value;
    var b = document.querySelector('input[name="budget"]:checked'); if (b) s.budget = b.value;
    ["plz", "ort", "text", "name", "tel", "mail"].forEach(function (k) { var el = document.getElementById("p-" + k); if (el) s[k] = el.value.trim(); });
  }
  function pruefen() {
    if (s.schritt === 0 && !s.vorhaben) return "Bitte wählen Sie Ihr Vorhaben.";
    if (s.schritt === 1 && s.vorhaben === "reparatur" && !String(s.a.text || "").trim()) return "Bitte beschreiben Sie kurz, was gemacht werden soll.";
    if (s.schritt === 2 && !/^\d{5}$/.test(s.plz)) return "Bitte geben Sie eine gültige Postleitzahl ein.";
    if (s.schritt === 2 && preis().typ > 5000 && !s.fotos.length) return "Bitte laden Sie mindestens ein Foto hoch – damit der Betrieb einen Richtpreis nennen kann.";
    if (s.schritt === 3 && !s.budget) return "Bitte beantworten Sie kurz die Frage zum Budget.";
    if (s.schritt === 4) {
      if (!s.name) return "Bitte geben Sie Ihren Namen an.";
      if (!s.tel && !/@/.test(s.mail)) return "Bitte geben Sie Telefon oder E-Mail an.";
      if (!document.getElementById("p-ok").checked) return "Bitte stimmen Sie der Weitergabe an einen Fachbetrieb zu.";
    }
    return "";
  }

  function fertig() {
    var v = vh(), p = preis(), n = note(p);
    var anfrage = { id: Date.now(), name: s.name, ort: s.ort || ("PLZ " + s.plz), plz: s.plz, vorhaben: v.label, gewerk: v.gewerk, details: details(),
      zeit: ZEIT.filter(function (z) { return z[0] === s.zeit; })[0][1], rolle: ROLLE.filter(function (r) { return r[0] === s.rolle; })[0][1],
      budget: BUDGET.filter(function (b) { return b[0] === s.budget; })[0][1], note: n.note, gruende: n.gruende,
      text: s.text, fotos: s.fotos.length, tel: s.tel, mail: s.mail, von: p.von, bis: p.bis, typ: p.typ, eingang: new Date().toISOString() };
    try { var alt = JSON.parse(localStorage.getItem("portal-anfragen") || "[]"); alt.push(anfrage); localStorage.setItem("portal-anfragen", JSON.stringify(alt.slice(-20))); } catch (e) { /* privat */ }
    document.getElementById("portal-form").hidden = true;
    var d = document.getElementById("portal-done");
    d.hidden = false;
    var weiter = n.note === "C" ?
      "<h3>Wie geht es weiter?</h3><p>Wir schauen uns Ihr Vorhaben in Ruhe an und melden uns mit Ideen, wie es in Ihrem Rahmen klappen kann" + (s.zeit === "spaeter" ? " – oder wir fragen in einigen Wochen nach, wenn Ihre Planung konkreter ist" : "") + ". Erst dann vermitteln wir einen Betrieb.</p>" :
      "<h3>Wie geht es weiter?</h3><ol class=\"p-weiter\"><li>Wir prüfen Ihre Anfrage und wählen <b>einen</b> passenden Fachbetrieb aus Ihrer Region.</li><li>Der Betrieb meldet sich innerhalb von 24 Stunden (werktags) und nennt Ihnen anhand Ihrer Fotos einen <b>Richtpreis</b>.</li><li>Passt der Richtpreis, vereinbaren Sie eine Besichtigung und erhalten ein genaues Angebot. Den Auftrag vergeben Sie direkt an den Betrieb.</li></ol>" +
      (p.typ > 10000 ? '<p class="portal-small">Bei größeren Vorhaben kann der Betrieb für Besichtigung und Planung eine kleine Pauschale berechnen, die bei Auftrag angerechnet wird. Das sagt er Ihnen vorher.</p>' : "");
    d.innerHTML = '<span class="p-ok-ic">' + svg('<path d="M20 6 9 17l-5-5"/>') + "</span><h2>Danke, " + esc(s.name.split(" ")[0]) + "! Ihre Anfrage ist eingegangen.</h2>" +
      preisBox(p, v) + weiter +
      '<p class="portal-small demo-hint"><b>Beispielversion:</b> Es wurde nichts verschickt. Ihre Anfrage liegt nur in Ihrem Browser – in der <a href="demo.html#vermittlung">Demo unter „Betreiber“ → „Vermittlung“</a> sehen Sie, wie sie dort mit Note ' + n.note + " ankommt und vermittelt wird.</p>" +
      '<button class="btn btn-outline" type="button" id="p-neu">Weitere Anfrage stellen</button>';
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-vh]");
    if (t) { s.vorhaben = t.getAttribute("data-vh"); s.a = {}; s.budget = null; s.schritt = 1; zeigen(); return document.getElementById("portal-form").scrollIntoView({ block: "start", behavior: "smooth" }); }
    if (e.target.closest("#p-next")) { lesen(); var f = pruefen(); if (f) { $err.textContent = f; return; } if (s.schritt === 4) return fertig(); s.schritt++; zeigen(); return; }
    if (e.target.closest("#p-back")) { lesen(); s.schritt--; zeigen(); return; }
    if (e.target.closest("#p-neu")) { s = leer(); document.getElementById("portal-done").hidden = true; document.getElementById("portal-form").hidden = false; zeigen(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.name === "budget") { budgetTipp(); return; }
    if (e.target.id !== "p-foto") return;
    lesen();
    Array.prototype.forEach.call(e.target.files || [], function (file) { s.fotos.push(URL.createObjectURL(file)); });
    zeigen();
  });
  zeigen();
})();
