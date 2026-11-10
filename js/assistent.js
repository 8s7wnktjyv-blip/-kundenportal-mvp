/* =====================================================================
   KI-Assistent der Demo: Sprache oder Chat
   „Bestell mir 3 Kupferrohre 15 mm, 5 m lang, für Brandl, an Büro senden“
   „Bei Familie Huber muss die Steckdose im Bad versetzt werden“
   „Herr Maier kann erst am Donnerstag um 9 Uhr“
   Kundario macht einen Vorschlag, Sie bestätigen. Erst dann ändert sich etwas.
   Demo: Keine echte KI – ein einfacher Regel-Erkenner für Beispielsätze.
   Es wird nichts verschickt. Spracheingabe nutzt die Spracherkennung des Browsers.
   ===================================================================== */
(function () {
  "use strict";
  var R = function () { return window.DEMO_REISE; }, X = function () { return window.DEMO_ERW; };
  var esc = function (s) { return R().esc(s); };
  var WT = ["sonntag", "montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag"];
  var ZAHL = { ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, "zwölf": 12, zwoelf: 12, zwanzig: 20 };
  var BEISPIELE = [
    "Bestell mir 3 Kupferrohre 15 mm in der Länge 5 m für Brandl und schick es ans Büro",
    "Bei Familie Brandl muss die Steckdose im Bad versetzt werden",
    "Familie Brandl kann erst am Donnerstag um 9 Uhr",
    "Was ist heute noch offen?"
  ];

  function ki() { var st = R().state(); if (!st.ki) st.ki = { msgs: [], vorschlag: null }; return st.ki; }
  function sag(wer, text, extra) { var k = ki(); k.msgs.push({ wer: wer, text: text, zeit: R().jetzt(), extra: extra || null }); if (k.msgs.length > 40) k.msgs.splice(0, k.msgs.length - 40); }

  /* ---------- Verstehen ---------- */
  function norm(t) {
    return String(t || "").toLowerCase().replace(/[„“"!?]/g, " ").replace(/\s+/g, " ").trim();
  }
  function zahlVon(w) { if (/^\d+([.,]\d+)?$/.test(w)) return +w.replace(",", "."); return ZAHL[w] != null ? ZAHL[w] : null; }

  // Bekannte Kunden aus Aufträgen, Anfragen und Terminen
  function kunden() {
    var st = R().state(), mod = R().mod(), set = {};
    (st.auftraege || []).forEach(function (a) { set[a.kunde] = { name: a.kunde, au: a }; });
    (st.leads || []).forEach(function (l) { if (!set[l.name]) set[l.name] = { name: l.name, lead: l }; });
    (mod.termine || []).forEach(function (t) { if (t.name && !set[t.name] && t.typ !== "lager") set[t.name] = { name: t.name }; });
    return Object.keys(set).map(function (k) { return set[k]; });
  }
  function kundeIn(t) {
    var best = null;
    kunden().forEach(function (k) {
      var teile = k.name.toLowerCase().replace(/^(familie|herr|frau|firma)\s+/, "").split(/[\s,]+/).filter(function (w) { return w.length >= 4; });
      teile.forEach(function (w) { if (new RegExp("(^|[^a-zäöüß])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-zäöüß]|$)").test(t) && (!best || w.length > best.l)) best = { k: k, l: w.length }; });
    });
    if (!best) return null;
    var k = best.k; if (!k.au) k.au = (R().state().auftraege || []).filter(function (a) { return a.kunde === k.name; })[0] || null;
    return k;
  }
  function tagIn(t) {
    var h = X().heute0(), d = null, m;
    if (/übermorgen|uebermorgen/.test(t)) d = new Date(h.getTime() + 2 * 864e5);
    else if (/\bmorgen\b/.test(t) && !/morgens/.test(t)) d = new Date(h.getTime() + 864e5);
    else if (/\bheute\b/.test(t)) d = new Date(h);
    else if ((m = t.match(/(\d{1,2})\.\s?(\d{1,2})\.?/))) { d = new Date(h.getFullYear(), +m[2] - 1, +m[1]); if (d < h) d.setFullYear(h.getFullYear() + 1); }
    else WT.forEach(function (w, i) { if (!d && new RegExp("\\b" + w).test(t)) { var o = (i - h.getDay() + 7) % 7; if (o === 0) o = 7; if (/nächste|naechste/.test(t) && o < 7) o += 7; d = new Date(h.getTime() + o * 864e5); } });
    return d;
  }
  function zeitIn(t) {
    var m = t.match(/\bum (\d{1,2})(?:[:.](\d{2}))?(?: uhr)?\b/) || t.match(/\b(\d{1,2})(?:[:.](\d{2}))? uhr\b/);
    if (m) return ("0" + m[1]).slice(-2) + ":" + (m[2] || "00");
    if (/vormittag/.test(t)) return "09:00"; if (/nachmittag/.test(t)) return "14:00"; if (/früh|frueh|morgens/.test(t)) return "08:00";
    return null;
  }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function datumText(d) { var l = X().tagLabel(d); return /^\d/.test(l) ? l : l + ", " + ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "."; }

  function bestellung(text, t) {
    var w = t.replace(/[,]/g, " ").split(" "), menge = null, start = -1;
    var mx = t.match(/(\d+)\s?(x|mal|stück|stk)\b/); if (mx) menge = +mx[1];
    var trig = w.findIndex(function (x) { return /bestell|besorg|brauch|nachbestell|order/.test(x); });
    for (var i = Math.max(0, trig + 1); i < w.length; i++) { var z = zahlVon(w[i]); if (z != null && !/^(mm|cm|m|meter)$/.test(w[i + 1] || "")) { if (menge == null) menge = z; start = i + 1; break; } }
    if (menge == null) menge = 1;
    if (start < 0) start = Math.max(0, trig + 1);
    var rest = w.slice(start).join(" ");
    var laenge = null, ml = rest.match(/(?:in der länge|in der laenge|länge|laenge|lang|je)\s*(?:von\s*)?(\d+(?:[.,]\d+)?)\s*(m|meter|cm|mm)\b/) || rest.match(/(\d+(?:[.,]\d+)?)\s*(m|meter)\s*lang/);
    if (ml) laenge = ml[1].replace(".", ",") + " " + (ml[2] === "meter" ? "m" : ml[2]);
    var artikel = rest.split(/\s(?:in der länge|in der laenge|länge|laenge|je|für|fuer|an das|ans|an|und schick|und send|direkt|bitte|zum|zur|beim|bei)\s/)[0]
      .replace(/^(mir|uns|bitte|noch|mal|x|stück|stk)\s+/g, "").replace(/\s(mal|stück|stk)\b/, "").replace(/\s+\d+(?:[.,]\d+)?\s*(m|meter)\s*lang.*$/, "").trim();
    if (!artikel || artikel.length < 2) return { fehlt: "artikel" };
    var pos = text.toLowerCase().indexOf(artikel); if (pos > -1) artikel = text.substr(pos, artikel.length);   // Schreibweise aus dem Original
    artikel = artikel.charAt(0).toUpperCase() + artikel.slice(1);
    var ziel = /großhand|grosshand|direkt|lieferant/.test(t) ? "grosshandel" : "buero";
    return { art: "bestellung", menge: menge, artikel: artikel, laenge: laenge, ziel: ziel, kunde: kundeIn(t), text: text };
  }
  function verstehen(text) {
    var t = norm(text);
    if (!t) return null;
    if (/was (ist|steht|gibt)|offen\b|tagesplan|meine aufgaben|was muss ich/.test(t) && !/bestell/.test(t)) return { art: "offen" };
    if (/bestell|besorg|nachbestell|brauch(e|en)? (noch|mal)|wir brauchen/.test(t)) return bestellung(text, t);
    var kunde = kundeIn(t), tag = tagIn(t);
    if (tag && /(kann|könnte|koennte|geht|passt|hat zeit|zeit|verschieb|termin|lieber|erst|nur)/.test(t)) return { art: "termin", kunde: kunde, tag: tag, zeit: zeitIn(t), text: text };
    if (/muss|müssen|muessen|soll|ändern|aendern|änderung|aenderung|nachtrag|zusätzlich|zusaetzlich|versetz|tausch|kaputt|fehlt|wünscht|wuenscht|möchte|moechte/.test(t)) {
      var was = text.replace(/^\s*(bei|beim|für|fuer)\s+(familie|herrn?|frau|firma)?\s*[A-ZÄÖÜ][\wäöüß-]*\s*(,|:)?\s*/i, "").replace(/^\s*(familie|herr|frau|firma)\s+[A-ZÄÖÜ][\wäöüß-]*\s*/i, "").trim();
      return { art: "aenderung", kunde: kunde, was: was.charAt(0).toUpperCase() + was.slice(1), text: text };
    }
    return { art: "unklar" };
  }

  /* ---------- Vorschlag ---------- */
  function vorschlagText(v) {
    if (v.art === "bestellung") return "<b>Bestellung</b><ul><li>" + v.menge + " × " + esc(v.artikel) + (v.laenge ? ", Länge " + esc(v.laenge) : "") + "</li><li>Für: " + (v.kunde ? esc(v.kunde.name) + (v.kunde.au ? " (" + esc(v.kunde.au.nr) + ")" : "") : "Lager, ohne Auftrag") + "</li><li>Geht an: " + (v.ziel === "buero" ? "Büro zur Freigabe" : "Großhändler (" + esc(R().mod().grosshandel || "Großhandel") + ") nach Ihrer Freigabe") + "</li></ul>";
    if (v.art === "aenderung") return "<b>Änderung beim Kunden</b><ul><li>Kunde: " + esc(v.kunde.name) + (v.kunde.au ? " (" + esc(v.kunde.au.nr) + ")" : "") + "</li><li>Was: " + esc(v.was) + "</li><li>Wird als Aufgabe fürs Büro angelegt und als möglicher Nachtrag vorgemerkt</li></ul>";
    if (v.art === "termin") { var alt = terminVon(v.kunde); return "<b>Termin ändern</b><ul><li>Kunde: " + esc(v.kunde.name) + "</li><li>" + (alt ? "Bisher: " + esc(alt.tag) + " " + esc(alt.zeit) + "<br>" : "") + "Neu: " + esc(datumText(v.tag)) + (v.zeit ? " um " + v.zeit + " Uhr" : " (Uhrzeit wie bisher" + (alt ? "" : ", sonst 08:00") + ")") + "</li></ul>" +
      '<label class="ki-check"><input type="checkbox" data-ki-info' + (v.info !== false ? " checked" : "") + "> Kunde über den neuen Termin informieren (Demo, nichts wird verschickt)</label>"; }
    return "";
  }
  function terminVon(k) { if (!k) return null; return (R().mod().termine || []).filter(function (t) { return t.name === k.name && t.typ !== "lager"; })[0] || null; }

  function ausfuehren(v) {
    var mod = R().mod(), ich = R().ich();
    if (v.art === "bestellung") {
      var name = v.artikel + (v.laenge ? ", " + v.laenge : "");
      mod.mat = mod.mat || []; mod.mat.unshift({ name: name, auftrag: v.kunde ? v.kunde.name : "Lager", menge: v.menge, einheit: "Stk.", preis: 0, an: true, ki: true });
      if (v.kunde && v.kunde.au) { R().verlaufK(v.kunde.au, "Material bestellt per Assistent: " + v.menge + " × " + name + (v.ziel === "buero" ? " – ans Büro zur Freigabe" : "")); if (v.ziel === "buero") { v.kunde.au.aufgaben = v.kunde.au.aufgaben || []; v.kunde.au.aufgaben.push({ titel: "Bestellung freigeben: " + v.menge + " × " + name, bis: "", wer: "Büro", erledigt: false }); } }
      R().protokoll("Assistent: Bestellung " + v.menge + " × " + name + (v.ziel === "buero" ? " ans Büro" : " vorbereitet"));
      if (v.ziel === "buero") X().glocke("auftrag", "Neue Bestellung von " + ich, v.menge + " × " + name + (v.kunde ? " für " + v.kunde.name : ""), "material");
      return "Erledigt. " + v.menge + " × " + name + " steht im Warenkorb unter Material" + (v.ziel === "buero" ? " und das Büro hat eine Nachricht zur Freigabe." : ". Bestellt wird erst, wenn Sie dort auf „Bestellen“ tippen.") + " Den Preis holt Kundario später aus Ihren Konditionen beim Großhändler.";
    }
    if (v.art === "aenderung") {
      var au = v.kunde.au;
      if (au) { au.aufgaben = au.aufgaben || []; au.aufgaben.push({ titel: "Änderung: " + v.was, bis: "", wer: "Büro", erledigt: false }); R().verlaufK(au, "Änderung gemeldet von " + ich + ": " + v.was + " (Nachtrag prüfen)"); }
      else if (v.kunde.lead) R().add(v.kunde.lead, "Änderung gemeldet von " + ich + ": " + v.was);
      R().protokoll("Assistent: Änderung bei " + v.kunde.name + " – " + v.was);
      X().glocke("auftrag", "Änderung bei " + v.kunde.name, v.was, "auftraege");
      return "Erledigt. Die Änderung steht " + (au ? "im Auftrag " + au.nr + " als Aufgabe fürs Büro" : "im Verlauf von " + v.kunde.name) + ". Ob daraus ein Nachtrag wird, entscheidet das Büro.";
    }
    if (v.art === "termin") {
      var t = terminVon(v.kunde), d = v.tag, zeit = v.zeit || (t ? t.zeit : "08:00");
      if (t) { t.datum = iso(d); t.zeit = zeit; t.tag = X().tagLabel(d); t.offen = false; }
      else { t = { tag: X().tagLabel(d), datum: iso(d), zeit: zeit, art: "Termin", name: v.kunde.name, ort: (v.kunde.lead || {}).ort || "", wer: ich, info: "per Assistent eingetragen", auftragId: v.kunde.au ? v.kunde.au.id : null }; mod.termine.push(t); }
      if (v.kunde.au) R().verlaufK(v.kunde.au, "Termin geändert auf " + datumText(d) + " " + zeit + " (per Assistent)" + (v.info !== false ? ", Kunde informiert (Demo)" : ""));
      R().protokoll("Assistent: Termin " + v.kunde.name + " → " + datumText(d) + " " + zeit);
      return "Erledigt. Der Termin mit " + v.kunde.name + " steht jetzt am " + datumText(d) + " um " + zeit + " Uhr im Kalender." + (v.info !== false ? " Die Nachricht an den Kunden ist vorbereitet – in der Demo wird nichts verschickt." : "");
    }
    return "";
  }

  function offenText() {
    var mod = R().mod(), st = R().state(), ich = R().ich();
    var heute = (mod.termine || []).filter(function (t) { return t.tag === "Heute"; }).sort(function (a, b) { return a.zeit < b.zeit ? -1 : 1; });
    var auf = []; (st.auftraege || []).forEach(function (a) { (a.aufgaben || []).forEach(function (x) { if (!x.erledigt) auf.push(x.titel + " (" + a.kunde + ")"); }); });
    var korb = (mod.mat || []).filter(function (m) { return m.an; }).length;
    return "<b>Heute</b>" + (heute.length ? "<ul>" + heute.map(function (t) { return "<li>" + esc(t.zeit) + " " + esc(t.name) + (t.info ? " – " + esc(t.info) : "") + "</li>"; }).join("") + "</ul>" : "<p>Keine Termine.</p>") +
      "<b>Offene Aufgaben</b>" + (auf.length ? "<ul>" + auf.slice(0, 6).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" + (auf.length > 6 ? "<p>und " + (auf.length - 6) + " weitere</p>" : "") : "<p>Keine offenen Aufgaben.</p>") +
      "<p>Im Warenkorb: " + korb + (korb === 1 ? " Artikel" : " Artikel") + ".</p>";
  }

  function senden(text) {
    text = String(text || "").trim(); if (!text) return;
    var k = ki(); sag("ich", text);
    if (k.warteKunde) {   // Rückfrage „Für welchen Kunden?“
      var kk = kundeIn(norm(text)); var v0 = k.warteKunde; k.warteKunde = null;
      if (kk) { v0.kunde = kk; k.vorschlag = v0; sag("ki", "Verstanden. Bitte prüfen:", { vorschlag: true }); } else sag("ki", "Den Kunden kenne ich nicht. Bitte schreiben Sie den Nachnamen, zum Beispiel „Brandl“.");
      return neu();
    }
    var v = verstehen(text);
    if (!v || v.art === "unklar") sag("ki", "Das habe ich nicht verstanden. In der Demo verstehe ich Sätze wie diese:", { beispiele: true });
    else if (v.fehlt === "artikel") sag("ki", "Was soll ich bestellen? Zum Beispiel „Bestell mir 3 Kupferrohre 15 mm, 5 m lang“.");
    else if (v.art === "offen") sag("ki", offenText(), { html: true });
    else if ((v.art === "aenderung" || v.art === "termin") && !v.kunde) { k.warteKunde = v; sag("ki", "Für welchen Kunden ist das?", { kundenwahl: true }); }
    else { k.vorschlag = v; sag("ki", "Verstanden. Bitte prüfen:", { vorschlag: true }); }
    neu();
  }

  /* ---------- Ansicht ---------- */
  function ansicht() {
    var k = ki(), E = X(), mic = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    var nachrichten = k.msgs.length ? k.msgs : [{ wer: "ki", text: "Hallo " + esc(R().ich()) + ". Sagen oder schreiben Sie mir, was zu tun ist. Ich mache einen Vorschlag, und erst wenn Sie „Passt“ tippen, ändere ich etwas.", zeit: R().jetzt(), extra: { beispiele: true } }];
    var letzteVorschlag = -1; nachrichten.forEach(function (m, i) { if (m.extra && m.extra.vorschlag) letzteVorschlag = i; });
    var aktuelleKunden = (R().state().auftraege || []).filter(function (a) { return a.status !== "abgeschlossen"; }).slice(0, 4);
    return E.head("KI-Assistent", "Per Sprache oder Chat: bestellen, Termine ändern, Änderungen beim Kunden melden. Kundario schlägt vor, Sie bestätigen.") +
      '<section class="panel ki" aria-label="Chat mit dem Assistenten"><div class="ki-log" id="ki-log" aria-live="polite">' +
        nachrichten.map(function (m, i) {
          var inhalt = m.extra && m.extra.html ? m.text : esc(m.text);
          var zusatz = "";
          if (m.extra && m.extra.beispiele) zusatz = '<div class="ki-bsp">' + BEISPIELE.map(function (b) { return '<button type="button" data-ki-bsp="' + esc(b) + '">' + esc(b) + "</button>"; }).join("") + "</div>";
          if (m.extra && m.extra.kundenwahl && k.warteKunde) zusatz = '<div class="ki-bsp">' + aktuelleKunden.map(function (a) { return '<button type="button" data-ki-bsp="' + esc(a.kunde) + '">' + esc(a.kunde) + "</button>"; }).join("") + "</div>";
          if (m.extra && m.extra.vorschlag && i === letzteVorschlag && k.vorschlag) zusatz = '<div class="ki-vorschlag">' + vorschlagText(k.vorschlag) + '<div class="ki-knoepfe"><button class="btn btn-signal" type="button" data-ki-ok>Passt</button><button class="btn btn-outline" type="button" data-ki-aendern>Ändern</button><button class="btn btn-ghost" type="button" data-ki-weg>Abbrechen</button></div></div>';
          else if (m.extra && m.extra.vorschlag && m.extra.ergebnis) zusatz = '<div class="ki-vorschlag erledigt">' + m.extra.ergebnis + "</div>";
          return '<div class="ki-msg ' + m.wer + '"><div class="ki-blase">' + (m.extra && m.extra.html ? "<div>" + inhalt + "</div>" : "<p>" + inhalt + "</p>") + zusatz + "</div><small>" + esc(m.zeit) + "</small></div>";
        }).join("") + "</div>" +
        '<form class="ki-eingabe" data-ki-form onsubmit="return false"><button type="button" class="ki-mic" data-ki-mic aria-label="Sprechen" title="' + (mic ? "Tippen und sprechen" : "Spracheingabe wird von diesem Browser nicht unterstützt") + '"' + (mic ? "" : ' aria-disabled="true"') + '><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>' +
          '<input name="ki" autocomplete="off" placeholder="Zum Beispiel: Bestell mir 3 Kupferrohre 15 mm …" aria-label="Nachricht an den Assistenten"><button class="btn btn-signal" type="submit">Senden</button></form>' +
        '<p class="src">Demo: Hier arbeitet noch keine echte KI, sondern ein einfacher Erkenner für Beispielsätze wie oben. Er ändert Beispieldaten in Material, Aufträgen und Kalender, es wird nichts verschickt. Die Spracheingabe nutzt die Spracherkennung Ihres Browsers; dafür kann der Browser die Aufnahme an seinen Anbieter senden.' +
          ' Im echten Kundario läuft die Sprach-KI über einen Anbieter mit Servern in der EU, und vor jeder Bestellung, Terminänderung oder Kundennachricht steht Ihre Bestätigung.</p></section>';
  }
  function neu() {
    var st = R().state(); R().speichern();
    if (st.view === "assistent") { R().render(); setTimeout(function () { var l = document.getElementById("ki-log"); if (l) l.scrollTop = l.scrollHeight; var i = document.querySelector('[data-ki-form] input'); if (i && !matchMedia("(max-width: 759px)").matches) i.focus(); }, 30); }
  }

  /* ---------- Sprache ---------- */
  var erk = null, hoert = false;
  function sprechen(knopf) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { R().toast("Spracheingabe geht in diesem Browser nicht – bitte tippen. In Chrome und Safari funktioniert sie."); return; }
    if (hoert && erk) { erk.stop(); return; }
    erk = new SR(); erk.lang = "de-DE"; erk.interimResults = true; erk.maxAlternatives = 1;
    var feld = document.querySelector('[data-ki-form] input');
    erk.onresult = function (e) { var t = ""; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; if (feld) feld.value = t; if (e.results[e.results.length - 1].isFinal && t.trim()) { erk.stop(); senden(t); } };
    erk.onerror = function (e) { R().toast(e.error === "not-allowed" ? "Bitte das Mikrofon im Browser erlauben." : "Ich habe nichts verstanden – bitte noch einmal oder tippen."); };
    erk.onend = function () { hoert = false; var k = document.querySelector("[data-ki-mic]"); if (k) k.classList.remove("hoert"); };
    try { erk.start(); hoert = true; knopf.classList.add("hoert"); R().toast("Ich höre zu …"); } catch (x) { hoert = false; }
  }

  /* ---------- Schnellknopf auf jeder Seite ---------- */
  function fab() {
    var st = R() && R().state(); if (!st) return;
    var darf = ["gf", "buero", "aussen", "monteur"].indexOf(st.rolle || "gf") > -1;
    var b = document.getElementById("ki-fab");
    if (!darf || st.view === "assistent") { if (b) b.hidden = true; return; }
    if (!b) {
      b = document.createElement("button"); b.id = "ki-fab"; b.type = "button"; b.setAttribute("aria-label", "KI-Assistent öffnen");
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>Assistent</span>';
      document.body.appendChild(b);
    }
    b.hidden = false;
  }

  /* ---------- Ereignisse ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest || !R()) return;
    var el;
    if (t.closest("#ki-fab")) { R().go("assistent"); return; }
    if (!t.closest(".ki")) return;
    var k = ki();
    if ((el = t.closest("[data-ki-bsp]"))) { senden(el.getAttribute("data-ki-bsp")); return; }
    if (t.closest("[data-ki-mic]")) { sprechen(t.closest("[data-ki-mic]")); return; }
    if (t.closest("[data-ki-ok]") && k.vorschlag) {
      var cb = document.querySelector("[data-ki-info]"); if (cb) k.vorschlag.info = cb.checked;
      var ergebnis = ausfuehren(k.vorschlag), v = k.vorschlag; k.vorschlag = null;
      for (var i = k.msgs.length - 1; i >= 0; i--) if (k.msgs[i].extra && k.msgs[i].extra.vorschlag && !k.msgs[i].extra.ergebnis) { k.msgs[i].extra.ergebnis = vorschlagText(v).replace(/<label[\s\S]*<\/label>/, "") + '<p class="ki-ok">✓ bestätigt</p>'; break; }
      sag("ki", ergebnis); R().toast("Erledigt (Demo, nichts verschickt)."); neu(); return;
    }
    if (t.closest("[data-ki-aendern]") && k.vorschlag) { var txt = k.vorschlag.text || ""; k.vorschlag = null; sag("ki", "Gut, passen Sie den Satz an und senden Sie ihn noch einmal."); neu(); setTimeout(function () { var f = document.querySelector('[data-ki-form] input'); if (f) { f.value = txt; f.focus(); } }, 60); return; }
    if (t.closest("[data-ki-weg]") && k.vorschlag) { k.vorschlag = null; sag("ki", "Abgebrochen, es wurde nichts geändert."); neu(); return; }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f || !f.hasAttribute || !f.hasAttribute("data-ki-form")) return;
    e.preventDefault(); var v = f.ki.value; f.ki.value = ""; senden(v);
  }, true);

  window.DEMO_KI = { ansicht: ansicht, verstehen: verstehen, senden: senden };
  var main = document.getElementById("app-main");
  if (window.MutationObserver && main) new MutationObserver(function () { try { fab(); } catch (x) { /* still */ } }).observe(main, { childList: true });
  window.addEventListener("load", function () { setTimeout(fab, 400); });
})();
