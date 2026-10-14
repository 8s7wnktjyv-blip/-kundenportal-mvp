/* =====================================================================
   AUFTRAGSPORTAL FÜR ENDKUNDEN (gehört zu anfrage.html)
   ---------------------------------------------------------------------
   Vier Schritte: Vorhaben → Details → Ort & Fotos → Kontakt.
   Am Ende: grobe Preisspanne und „Ein Betrieb meldet sich in 24 Stunden“.
   Beispielversion: Die Anfrage wird NUR im eigenen Browser gespeichert
   (localStorage „portal-anfragen“) und erscheint in der Demo unter
   „Ansicht als: Betreiber“ → „Vermittlung“. Es wird nichts verschickt.

   PREISE: grobe Orientierungswerte für Franken (Stand 2026), brutto.
   Hier anpassen, wenn Ihre Betriebe andere Erfahrungswerte haben.
   ===================================================================== */
(function () {
  "use strict";

  var VORHABEN = [
    { id: "bad", label: "Bad sanieren", icon: '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V5a2 2 0 0 1 4 0"/><path d="M7 20l-1 2M17 20l1 2"/>', gewerk: "SHK / Fliesen",
      fragen: [
        { id: "flaeche", typ: "zahl", label: "Wie groß ist das Bad?", einheit: "m²", wert: 8, min: 2, max: 40 },
        { id: "umfang", typ: "wahl", label: "Was soll gemacht werden?", optionen: [["komplett", "Komplett neu"], ["teil", "Teilweise (z. B. nur Dusche oder Fliesen)"], ["barrierefrei", "Barrierefrei umbauen"]] }
      ],
      preis: function (a) { var m = a.flaeche || 8, f = { komplett: [1900, 2900], teil: [900, 1500], barrierefrei: [2100, 3200] }[a.umfang || "komplett"]; return [m * f[0], m * f[1]]; } },
    { id: "heizung", label: "Heizung", icon: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-4 3 0-3 1-6-1-9-2 3-6 7-6 13 0 4 3 7 7 7z"/>', gewerk: "SHK",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["waermepumpe", "Neue Wärmepumpe"], ["gas", "Neue Gas-Brennwertheizung"], ["reparatur", "Reparatur oder Wartung"]] },
        { id: "wohnflaeche", typ: "zahl", label: "Beheizte Wohnfläche", einheit: "m²", wert: 140, min: 30, max: 600 }
      ],
      preis: function (a) { var w = a.wohnflaeche || 140, k = Math.max(0.8, Math.min(1.6, w / 140));
        return { waermepumpe: [27000 * k, 40000 * k], gas: [11000 * k, 16000 * k], reparatur: [180, 900] }[a.art || "waermepumpe"]; },
      hinweis: function (a) { return a.art === "waermepumpe" ? "Für Wärmepumpen gibt es oft staatliche Förderung. Der Betrieb prüft das mit Ihnen." : ""; } },
    { id: "fenster", label: "Fenster & Türen", icon: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>', gewerk: "Fenster / Schreiner",
      fragen: [
        { id: "anzahl", typ: "zahl", label: "Wie viele Fenster?", einheit: "Stück", wert: 6, min: 1, max: 60 },
        { id: "material", typ: "wahl", label: "Material", optionen: [["kunststoff", "Kunststoff"], ["holz", "Holz oder Holz-Alu"], ["egal", "Weiß ich noch nicht"]] }
      ],
      preis: function (a) { var n = a.anzahl || 6, f = { kunststoff: [850, 1400], holz: [1300, 2200], egal: [850, 2000] }[a.material || "kunststoff"]; return [n * f[0], n * f[1]]; } },
    { id: "dach", label: "Dach", icon: '<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/>', gewerk: "Dachdecker",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["neu", "Neu eindecken"], ["daemmung", "Neu eindecken mit Dämmung"], ["reparatur", "Reparatur (z. B. undicht)"]] },
        { id: "flaeche", typ: "zahl", label: "Dachfläche (ungefähr)", einheit: "m²", wert: 150, min: 10, max: 800 }
      ],
      preis: function (a) { var m = a.flaeche || 150; return { neu: [m * 170, m * 280], daemmung: [m * 260, m * 420], reparatur: [400, 3500] }[a.art || "neu"]; } },
    { id: "maler", label: "Maler & Boden", icon: '<rect x="3" y="3" width="14" height="6" rx="1"/><path d="M17 6h3v5h-8v4"/><rect x="10" y="15" width="4" height="7" rx="1"/>', gewerk: "Maler / Bodenleger",
      fragen: [
        { id: "art", typ: "wahl", label: "Was soll gemacht werden?", optionen: [["streichen", "Wände und Decken streichen"], ["boden", "Neuer Boden (Vinyl, Parkett, Laminat)"], ["beides", "Beides"]] },
        { id: "flaeche", typ: "zahl", label: "Wohnfläche", einheit: "m²", wert: 80, min: 10, max: 400 }
      ],
      preis: function (a) { var m = a.flaeche || 80; return { streichen: [m * 22, m * 40], boden: [m * 55, m * 110], beides: [m * 77, m * 150] }[a.art || "streichen"]; } },
    { id: "elektro", label: "Elektro", icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', gewerk: "Elektro",
      fragen: [
        { id: "art", typ: "wahl", label: "Was ist geplant?", optionen: [["klein", "Kleinauftrag (Steckdosen, Lampen, Störung)"], ["wallbox", "Wallbox fürs E-Auto"], ["neu", "Elektrik einer Wohnung erneuern"]] },
        { id: "flaeche", typ: "zahl", label: "Wohnfläche (nur bei Erneuerung)", einheit: "m²", wert: 80, min: 10, max: 400 }
      ],
      preis: function (a) { return { klein: [150, 700], wallbox: [1200, 2800], neu: [(a.flaeche || 80) * 90, (a.flaeche || 80) * 150] }[a.art || "klein"]; } },
    { id: "reparatur", label: "Reparatur & Sonstiges", icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>', gewerk: "nach Beschreibung",
      fragen: [{ id: "text", typ: "text", label: "Was soll gemacht werden?", platzhalter: "z. B. Wasserhahn tropft, Tür klemmt, Rollladen kaputt …" }],
      preis: function () { return [120, 800]; } }
  ];
  var ZEIT = [["sofort", "So schnell wie möglich"], ["3m", "In den nächsten 3 Monaten"], ["spaeter", "Später / noch in Planung"]];
  var ROLLE = [["eigen", "Eigentümer/in"], ["mieter", "Mieter/in"], ["verwaltung", "Hausverwaltung"]];

  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rund = function (n) { return n < 2000 ? Math.round(n / 50) * 50 : Math.round(n / 500) * 500; };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };

  var s = { schritt: 0, vorhaben: null, a: {}, zeit: "3m", rolle: "eigen", plz: "", ort: "", fotos: [], name: "", tel: "", mail: "", text: "" };
  var $step = document.getElementById("portal-step"), $err = document.getElementById("portal-err");
  var $next = document.getElementById("p-next"), $back = document.getElementById("p-back");

  function vh() { return VORHABEN.filter(function (v) { return v.id === s.vorhaben; })[0]; }
  function wahl(name, opts, akt) {
    return '<div class="p-wahl" role="radiogroup">' + opts.map(function (o) {
      return '<label class="p-opt"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === akt ? " checked" : "") + "><span>" + esc(o[1]) + "</span></label>"; }).join("") + "</div>";
  }

  function zeigen() {
    var html = "";
    if (s.schritt === 0) {
      html = "<h2>Was haben Sie vor?</h2>" + '<div class="p-tiles">' + VORHABEN.map(function (v) {
        return '<button type="button" class="p-tile' + (s.vorhaben === v.id ? " on" : "") + '" data-vh="' + v.id + '">' + svg(v.icon) + "<span>" + v.label + "</span></button>"; }).join("") + "</div>";
    }
    if (s.schritt === 1) {
      var v = vh();
      html = "<h2>" + esc(v.label) + ": ein paar Details</h2>" + v.fragen.map(function (f) {
        var akt = s.a[f.id];
        if (f.typ === "zahl") return '<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><div class="p-zahl"><input id="f-' + f.id + '" data-f="' + f.id + '" type="number" inputmode="decimal" min="' + f.min + '" max="' + f.max + '" value="' + (akt != null ? akt : f.wert) + '"><span>' + f.einheit + "</span></div></div>";
        if (f.typ === "text") return '<div class="field"><label for="f-' + f.id + '">' + f.label + '</label><textarea id="f-' + f.id + '" data-f="' + f.id + '" placeholder="' + esc(f.platzhalter) + '">' + esc(akt || "") + "</textarea></div>";
        return '<div class="field"><span class="p-lab">' + f.label + "</span>" + wahl("f-" + f.id, f.optionen, akt || f.optionen[0][0]) + "</div>";
      }).join("") +
      '<div class="field"><span class="p-lab">Wann soll es losgehen?</span>' + wahl("zeit", ZEIT, s.zeit) + "</div>" +
      '<div class="field"><span class="p-lab">Sie sind</span>' + wahl("rolle", ROLLE, s.rolle) + "</div>";
    }
    if (s.schritt === 2) {
      html = "<h2>Wo und wie sieht es aus?</h2>" +
        '<div class="p-row"><div class="field"><label for="p-plz">Postleitzahl</label><input id="p-plz" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="' + esc(s.plz) + '" placeholder="91052"></div>' +
        '<div class="field"><label for="p-ort">Ort</label><input id="p-ort" autocomplete="address-level2" value="' + esc(s.ort) + '" placeholder="Erlangen"></div></div>' +
        '<div class="field"><label for="p-text">Beschreibung <span class="opt">(freiwillig)</span></label><textarea id="p-text" placeholder="Was ist Ihnen wichtig? Besonderheiten?">' + esc(s.text) + "</textarea></div>" +
        '<div class="field"><span class="p-lab">Fotos <span class="opt">(freiwillig, hilft sehr)</span></span><div class="p-fotos">' +
          s.fotos.map(function (f) { return '<img src="' + f + '" alt="Ihr Foto">'; }).join("") +
          '<label class="p-foto-add">' + svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>') + '<span>Foto hinzufügen</span><input type="file" accept="image/*" multiple id="p-foto" hidden></label></div></div>';
    }
    if (s.schritt === 3) {
      html = "<h2>Wie erreicht Sie der Betrieb?</h2>" +
        '<div class="field"><label for="p-name">Name</label><input id="p-name" autocomplete="name" value="' + esc(s.name) + '"></div>' +
        '<div class="p-row"><div class="field"><label for="p-tel">Telefon</label><input id="p-tel" type="tel" autocomplete="tel" value="' + esc(s.tel) + '"></div>' +
        '<div class="field"><label for="p-mail">E-Mail</label><input id="p-mail" type="email" autocomplete="email" value="' + esc(s.mail) + '"></div></div>' +
        '<label class="p-check"><input type="checkbox" id="p-ok"> <span>Ich bin einverstanden, dass meine Angaben an <b>einen</b> geprüften Fachbetrieb aus meiner Region weitergegeben werden, damit er mich wegen meines Vorhabens kontaktiert. Details in der <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>.</span></label>';
    }
    $step.innerHTML = html;
    document.querySelectorAll(".portal-steps li").forEach(function (li, i) { li.className = i < s.schritt ? "done" : i === s.schritt ? "on" : ""; });
    $back.hidden = s.schritt === 0;
    $next.textContent = s.schritt === 3 ? "Kostenlos anfragen" : "Weiter";
    $err.textContent = "";
  }

  function lesen() {
    document.querySelectorAll("[data-f]").forEach(function (el) { var k = el.getAttribute("data-f"); s.a[k] = el.type === "number" ? parseFloat(String(el.value).replace(",", ".")) || 0 : el.value; });
    (vh() ? vh().fragen : []).forEach(function (f) { var r = document.querySelector('input[name="f-' + f.id + '"]:checked'); if (r) s.a[f.id] = r.value; });
    var z = document.querySelector('input[name="zeit"]:checked'); if (z) s.zeit = z.value;
    var r2 = document.querySelector('input[name="rolle"]:checked'); if (r2) s.rolle = r2.value;
    ["plz", "ort", "text", "name", "tel", "mail"].forEach(function (k) { var el = document.getElementById("p-" + k); if (el) s[k] = el.value.trim(); });
  }
  function pruefen() {
    if (s.schritt === 0 && !s.vorhaben) return "Bitte wählen Sie Ihr Vorhaben.";
    if (s.schritt === 1 && s.vorhaben === "reparatur" && !String(s.a.text || "").trim()) return "Bitte beschreiben Sie kurz, was gemacht werden soll.";
    if (s.schritt === 2 && !/^\d{5}$/.test(s.plz)) return "Bitte geben Sie eine gültige Postleitzahl ein.";
    if (s.schritt === 3) {
      if (!s.name) return "Bitte geben Sie Ihren Namen an.";
      if (!s.tel && !/@/.test(s.mail)) return "Bitte geben Sie Telefon oder E-Mail an.";
      if (!document.getElementById("p-ok").checked) return "Bitte stimmen Sie der Weitergabe an einen Fachbetrieb zu.";
    }
    return "";
  }

  function fertig() {
    var v = vh(), p = v.preis(s.a), von = rund(p[0]), bis = rund(p[1]);
    var details = v.fragen.map(function (f) {
      var w = s.a[f.id] != null ? s.a[f.id] : f.wert != null ? f.wert : f.optionen ? f.optionen[0][0] : "";
      if (f.optionen) { var o = f.optionen.filter(function (x) { return x[0] === w; })[0]; w = o ? o[1] : w; }
      return f.einheit ? w + " " + f.einheit : w;
    }).join(" · ");
    var anfrage = { id: Date.now(), name: s.name, ort: s.ort || ("PLZ " + s.plz), plz: s.plz, vorhaben: v.label, gewerk: v.gewerk, details: details,
      zeit: ZEIT.filter(function (z) { return z[0] === s.zeit; })[0][1], rolle: ROLLE.filter(function (r) { return r[0] === s.rolle; })[0][1],
      text: s.text, fotos: s.fotos.length, tel: s.tel, mail: s.mail, von: von, bis: bis, wert: Math.round((von + bis) / 2), eingang: new Date().toISOString() };
    try { var alt = JSON.parse(localStorage.getItem("portal-anfragen") || "[]"); alt.push(anfrage); localStorage.setItem("portal-anfragen", JSON.stringify(alt.slice(-20))); } catch (e) { /* privat */ }
    var hinweis = v.hinweis ? v.hinweis(s.a) : "";
    document.getElementById("portal-form").hidden = true;
    var d = document.getElementById("portal-done");
    d.hidden = false;
    d.innerHTML = '<span class="p-ok-ic">' + svg('<path d="M20 6 9 17l-5-5"/>') + "</span><h2>Danke, " + esc(s.name.split(" ")[0]) + "! Ihre Anfrage ist eingegangen.</h2>" +
      '<div class="p-preis"><span>Grobe Preisspanne für ' + esc(v.label) + "</span><b>" + euro.format(von) + " – " + euro.format(bis) + "</b><small>" + esc(details) + " · Orientierungswert inkl. MwSt., kein Angebot</small></div>" +
      (hinweis ? '<p class="p-hinweis">' + esc(hinweis) + "</p>" : "") +
      "<h3>Wie geht es weiter?</h3><ol class=\"p-weiter\"><li>Wir prüfen Ihre Anfrage und wählen <b>einen</b> passenden Fachbetrieb aus Ihrer Region.</li><li>Der Betrieb meldet sich innerhalb von 24 Stunden (werktags) bei Ihnen.</li><li>Er besichtigt bei Bedarf und macht Ihnen ein kostenloses Angebot. Den Auftrag vergeben Sie direkt an ihn.</li></ol>" +
      '<p class="portal-small demo-hint"><b>Beispielversion:</b> Es wurde nichts verschickt. Ihre Anfrage liegt nur in Ihrem Browser – in der <a href="demo.html#vermittlung">Demo unter „Betreiber“ → „Vermittlung“</a> sehen Sie, wie sie dort ankommt und an einen Betrieb vermittelt wird.</p>' +
      '<button class="btn btn-outline" type="button" id="p-neu">Weitere Anfrage stellen</button>';
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-vh]");
    if (t) { s.vorhaben = t.getAttribute("data-vh"); s.a = {}; s.schritt = 1; zeigen(); return document.getElementById("portal-form").scrollIntoView({ block: "start", behavior: "smooth" }); }
    if (e.target.closest("#p-next")) { lesen(); var f = pruefen(); if (f) { $err.textContent = f; return; } if (s.schritt === 3) return fertig(); s.schritt++; zeigen(); return; }
    if (e.target.closest("#p-back")) { lesen(); s.schritt--; zeigen(); return; }
    if (e.target.closest("#p-neu")) { s = { schritt: 0, vorhaben: null, a: {}, zeit: "3m", rolle: "eigen", plz: "", ort: "", fotos: [], name: "", tel: "", mail: "", text: "" }; document.getElementById("portal-done").hidden = true; document.getElementById("portal-form").hidden = false; zeigen(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id !== "p-foto") return;
    lesen();
    Array.prototype.forEach.call(e.target.files || [], function (file) { s.fotos.push(URL.createObjectURL(file)); });
    zeigen();
  });
  zeigen();
})();
