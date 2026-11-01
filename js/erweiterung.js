/* =====================================================================
   Erweiterungen der Demo (Beispieldaten, es wird nichts verschickt):
   1. Auftragsrentabilität: Soll und Ist je Auftrag, Deckungsbeitrag, Abweichung
   2. Kontrollsystem der Abläufe: Status je Ausführung, erneut starten, Protokoll
   3. Bereich „Wirtschaftlicher Nutzen“: zehn Kennzahlen mit Rechenweg
   4. Betriebsgröße: Team-Auswahl und Menü passen sich an
   Bestehende Ansichten bleiben unverändert, hier wird nur ergänzt.
   ===================================================================== */
(function () {
  "use strict";
  var R = function () { return window.DEMO_REISE; }, X = function () { return window.DEMO_ERW; };
  var esc = function (s) { return R().esc(s); };
  var eur = function (v) { return R().euro.format(Math.round(v || 0)); };
  var n = function (z, ein, mehr) { return z + " " + (z === 1 ? ein : mehr); };
  var std = function (v) { return String(Math.round((v || 0) * 10) / 10).replace(".", ","); };

  /* ---------- 1. Auftragsrentabilität ---------- */
  var KOSTENSATZ = 42;      // Planwert: interne Kosten je Arbeitsstunde (Lohn, Nebenkosten)
  var MAT_ANTEIL = 0.55;    // Planwert: Einkaufsanteil an den Material- und Pauschalpositionen
  var FAHRT_SOLL = 60;      // Planwert: Fahrtkosten je Auftrag
  function angebot(au) { return (R().state().angebote || []).filter(function (a) { return a.id === au.angebotId; })[0]; }
  function zeilenNetto(p) { return (p.menge || 0) * (p.ep || 0) * (1 - (p.rabatt || 0) / 100); }
  function kalk(au) {
    var an = angebot(au), pos = an ? an.positionen.filter(function (p) { return !p.optional; }) : [];
    var stdPos = pos.filter(function (p) { return /Std/.test(p.einheit || ""); }), restPos = pos.filter(function (p) { return !/Std/.test(p.einheit || ""); });
    var umsatz = X().auftragWert(au);
    var plan = {
      std: stdPos.reduce(function (s, p) { return s + (+p.menge || 0); }, 0) || Math.round(umsatz * 0.4 / X().satz()),
      satz: KOSTENSATZ,
      mat: Math.round(restPos.reduce(function (s, p) { return s + zeilenNetto(p); }, 0) * MAT_ANTEIL) || Math.round(umsatz * 0.3),
      fremd: 0, fahrt: FAHRT_SOLL, sonst: 0
    };
    au.kalk = au.kalk || {};
    var k = au.kalk, soll = {}, ist = {};
    ["std", "satz", "mat", "fremd", "fahrt", "sonst"].forEach(function (f) { soll[f] = k["s_" + f] != null ? k["s_" + f] : plan[f]; });
    var rb = X().regieVon(au);
    var rbStd = rb.reduce(function (s, b) { return s + (+b.stunden || 0); }, 0), rbMat = rb.reduce(function (s, b) { return s + (+b.materialEuro || 0); }, 0);
    ist.std = k.i_std != null ? k.i_std : (rbStd || null);
    ist.satz = soll.satz;
    ist.mat = k.i_mat != null ? k.i_mat : (rbMat || null);
    ["fremd", "fahrt", "sonst"].forEach(function (f) { ist[f] = k["i_" + f] != null ? k["i_" + f] : null; });
    var nachtrag = rb.filter(function (b) { return b.zusatz; }).reduce(function (s, b) { return s + (+b.stunden || 0) * X().satz() + (+b.materialEuro || 0); }, 0);
    var re = au.rechnungen.map(function (nr) { return X().rechnungVon(nr); }).filter(Boolean);
    var erloesBrutto = re.reduce(function (s, r) { return s + r.betrag; }, 0);
    var erloes = re.length ? erloesBrutto / 1.19 : null;
    var kosten = function (o, ersatz) { var g = function (f) { return o[f] != null ? o[f] : ersatz[f]; }; return g("std") * soll.satz + g("mat") + g("fremd") + g("fahrt") + g("sonst"); };
    var fehlt = ["std", "mat", "fremd", "fahrt"].filter(function (f) { return ist[f] == null; });
    var sollKosten = kosten(soll, soll), istKosten = kosten(ist, soll);
    var erlIst = erloes != null ? erloes : umsatz + nachtrag;
    return { soll: soll, ist: ist, plan: plan, umsatz: umsatz, nachtrag: nachtrag, erloes: erloes, erlIst: erlIst, rb: rb, an: an, stdPos: stdPos, fehlt: fehlt,
      dbSoll: umsatz - sollKosten, dbIst: erlIst - istKosten, sollKosten: sollKosten, istKosten: istKosten, eigen: Object.keys(k).length > 0 };
  }
  function feld(name, wert, fehlend) {
    return '<input class="rk-in' + (fehlend ? " fehlt" : "") + '" inputmode="decimal" data-rk="' + name + '" value="' + (wert == null ? "" : String(Math.round(wert * 10) / 10).replace(".", ",")) + '" placeholder="' + (fehlend ? "fehlt" : "") + '" aria-label="' + name + '">';
  }
  function rentPanel(au) {
    var c = kalk(au), s = c.soll, i = c.ist, darf = X().darf("auftrag");
    var zeile = function (label, f, einheit) {
      var sv = s[f], iv = i[f], diff = iv == null ? null : iv - sv;
      return "<tr><th>" + label + "</th><td>" + (darf ? feld("s_" + f, sv) : (einheit === "Std." ? std(sv) : eur(sv))) + "</td><td>" + (darf ? feld("i_" + f, iv, iv == null) : iv == null ? '<span class="rk-fehlt">fehlt</span>' : (einheit === "Std." ? std(iv) : eur(iv))) +
        '</td><td class="' + (diff > 0 ? "rk-minus" : diff < 0 ? "rk-plus" : "") + '">' + (diff == null ? "–" : (diff > 0 ? "+" : "") + (einheit === "Std." ? std(diff) + " Std." : eur(diff))) + "</td></tr>";
    };
    var abw = "";
    if (i.std != null && i.std > s.std) {
      var mehr = i.std - s.std, ursache = c.rb.filter(function (b) { return b.zusatz; }).map(function (b) { return b.nr + " (" + (b.taetigkeit || "Zusatzarbeit") + ")"; });
      abw = '<div class="rk-warn"><b>Abweichung: ' + std(mehr) + " Std. mehr als geplant</b><span>Geschätzte Mehrkosten: " + std(mehr) + " Std. × " + eur(s.satz) + " = " + eur(mehr * s.satz) + "</span>" +
        "<span>Mögliche Ursache: " + (ursache.length ? "Zusatzarbeiten laut " + esc(ursache.join(", ")) + (c.nachtrag ? " – als Nachtrag erfasst" : "") : "keine Zusatzarbeit im Regiebericht vermerkt – Aufmaß, Wartezeit oder Nacharbeit prüfen") + "</span>" +
        (c.stdPos.length ? "<span>Betroffene Positionen: " + esc(c.stdPos.map(function (p) { return p.text; }).join(", ")) + "</span>" : "") + "</div>";
    } else if (i.std != null) abw = '<div class="rk-ok">Stunden im Plan: ' + std(i.std) + " von " + std(s.std) + " Std. verbraucht.</div>";
    else abw = '<div class="rk-info">Noch keine Stunden erfasst. Sobald ein Regiebericht vorliegt, rechnet Kundario die Ist-Werte mit.</div>';
    var proz = function (db, u) { return u ? Math.round(db / u * 100) + " %" : "–"; };
    return '<section class="panel rk" aria-labelledby="rk-h"><div class="rk-kopf"><h2 id="rk-h">Rentabilität: geplant und tatsächlich</h2>' +
      (c.eigen && darf ? '<button class="btn-mini" type="button" data-rk-reset>Planwerte zurücksetzen</button>' : "") + "</div>" +
      '<div class="rk-grid"><div class="rk-tab-wrap"><table class="rk-tab"><thead><tr><th></th><th>geplant</th><th>tatsächlich</th><th>Abweichung</th></tr></thead><tbody>' +
        zeile("Arbeitsstunden", "std", "Std.") + zeile("Kosten je Stunde", "satz") + zeile("Materialkosten", "mat") + zeile("Fremdleistungen", "fremd") + zeile("Fahrtkosten", "fahrt") + zeile("Sonstige Kosten", "sonst") +
      "</tbody></table></div>" +
      '<div class="rk-sum"><div><span>Vereinbarter Umsatz</span><b>' + eur(c.umsatz) + "</b><small>netto laut Angebot</small></div>" +
        "<div><span>Nachträge</span><b>" + eur(c.nachtrag) + "</b><small>Zusatzleistungen aus Regieberichten</small></div>" +
        "<div><span>Tatsächliche Erlöse</span><b>" + (c.erloes != null ? eur(c.erloes) : '<span class="rk-fehlt">noch keine Rechnung</span>') + "</b><small>" + (c.erloes != null ? "netto aus gestellten Rechnungen" : "ab Rechnung automatisch") + "</small></div>" +
        '<div class="rk-db"><span>Deckungsbeitrag geplant</span><b>' + eur(c.dbSoll) + "</b><small>" + proz(c.dbSoll, c.umsatz) + " vom Umsatz</small></div>" +
        '<div class="rk-db' + (c.dbIst < c.dbSoll ? " schlechter" : "") + '"><span>Deckungsbeitrag tatsächlich' + (c.fehlt.length ? " (vorläufig)" : "") + "</span><b>" + eur(c.dbIst) + "</b><small>" + proz(c.dbIst, c.erlIst) + " · " + (c.dbIst - c.dbSoll >= 0 ? "+" : "") + eur(c.dbIst - c.dbSoll) + " zum Plan</small></div></div></div>" +
      abw +
      '<p class="src">Deckungsbeitrag = Erlös − Lohnkosten (Stunden × Kosten je Stunde) − Material − Fremdleistungen − Fahrt − Sonstiges. Geplante Werte sind Beispielwerte aus dem Angebot' +
        " (Stunden aus den Stundenpositionen, Material " + Math.round(MAT_ANTEIL * 100) + " % der übrigen Positionen, " + eur(KOSTENSATZ) + " je Stunde, " + eur(FAHRT_SOLL) + " Fahrt) und lassen sich überschreiben." +
        (c.fehlt.length ? " Fehlende Ist-Werte sind markiert und werden bis zur Eingabe mit dem Planwert gerechnet." : "") + " Diese Zahlen sieht der Kunde im Portal nie.</p></section>";
  }
  function rentEinsetzen() {
    var st = R().state(); if (st.view !== "auftraege" || !st.auftragSel) return;
    var m = document.getElementById("app-main"); if (!m || m.querySelector(".rk")) return;
    var au = (st.auftraege || []).filter(function (x) { return x.id === st.auftragSel; })[0]; if (!au) return;
    var k = m.querySelector(".kpis"); if (!k) return;
    var d = document.createElement("div"); d.innerHTML = rentPanel(au); k.parentNode.insertBefore(d.firstChild, k.nextSibling);
  }
  var rkTimer; function rentNeu() { clearTimeout(rkTimer); rkTimer = setTimeout(function () { var m = document.getElementById("app-main"), alt = m && m.querySelector(".rk"); if (alt && alt.parentNode) alt.parentNode.removeChild(alt); rentEinsetzen(); }, 0); }

  /* ---------- 2. Kontrollsystem der Abläufe ---------- */
  var AST = { ok: ["erfolgreich", "ok"], freigabe: ["wartet auf Freigabe", "check"], fehler: ["fehlgeschlagen", "no"], manuell: ["manuelle Bearbeitung nötig", "warn"], aus: ["deaktiviert", ""] };
  var REGELN = {
    anfrage: { ausl: "Neue Anfrage per Telefon, E-Mail, WhatsApp oder Formular", bed: "Kunde noch nicht als Spam markiert", akt: "Kundenakte prüfen, KI-Zusammenfassung, Eingangsbestätigung, Terminvorschlag", wer: "Büro (Sabine)", frei: "Absagen nur nach Ihrer Freigabe" },
    nachfassen: { ausl: "Angebot seit 3, 7 und 14 Tagen offen", bed: "Kunde hat nicht geantwortet und nicht abgesagt", akt: "Erinnerung vorbereiten und versenden, danach Anruf-Hinweis", wer: "Geschäftsführung (Thomas)", frei: "Je nach Einstellung automatisch oder nach Freigabe" },
    auftrag: { ausl: "Angebot unterschrieben", bed: "Unterschrift vollständig", akt: "PDF an Kunden, Auftragsbestätigung, Termin planen, Material bestellen", wer: "Büro (Sabine)", frei: "Materialbestellung über 1.000 € nach Freigabe" },
    regie: { ausl: "Regiebericht abgeschlossen", bed: "Stunden, Tätigkeit und Unterschrift vorhanden", akt: "Vollständigkeit prüfen, PDF erzeugen, Büro informieren, Rechnungsvorlage", wer: "Büro (Sabine)", frei: "Rechnung immer nach Freigabe" },
    zahlung: { ausl: "Täglicher Kontoabgleich, Rechnung überfällig", bed: "Betrag und Verwendungszweck passen eindeutig", akt: "Zahlung zuordnen, Erinnerung vorbereiten", wer: "Büro (Sabine)", frei: "Erinnerungen immer nach Freigabe" },
    vermittlung: { ausl: "Anfrage im Auftragsportal", bed: "Region und Gewerk passen zu einem Betrieb", akt: "KI-Vorprüfung, Vorschlag zur Zuweisung", wer: "Betreiber", frei: "Zuweisung nach Freigabe" },
    nachher: { ausl: "Auftrag abgeschlossen, Wartungstermin nähert sich", bed: "Kunde hat Bewertungen nicht abgelehnt", akt: "Bitte um Bewertung, Wartung anlegen, Kunde informieren, Termin vorschlagen", wer: "Büro (Sabine)", frei: "Bewertungsbitte automatisch" }
  };
  function laeufe() {
    var st = R().state();
    if (!st.autoLaeufe) st.autoLaeufe = [
      { id: 1, flow: "anfrage", titel: "Eingangsbestätigung an Familie Huber", zeit: "07:41", st: "ok", prot: [["07:40", "Anfrage per WhatsApp erfasst"], ["07:40", "KI-Vorprüfung: passt gut"], ["07:41", "Eingangsbestätigung gesendet (Demo)"]] },
      { id: 2, flow: "anfrage", titel: "Formular-Anfrage mit Foto von Andrea Kraus", zeit: "07:58", st: "fehler", grund: "Foto-Anhang ließ sich nicht öffnen (Datei beschädigt). Die Anfrage selbst ist gespeichert.", versuche: 1, prot: [["07:58", "Anfrage über Website-Formular erfasst"], ["07:58", "Fehler: Anhang konnte nicht gelesen werden"]] },
      { id: 3, flow: "nachfassen", titel: "2. Erinnerung an Familie Maier", zeit: "08:00", st: "freigabe", prot: [["08:00", "Angebot seit 9 Tagen offen – Erinnerung vorbereitet"]] },
      { id: 4, flow: "auftrag", titel: "Auftragsbestätigung an Familie Brandl", zeit: "08:10", st: "ok", prot: [["08:09", "Unterschrift erkannt"], ["08:10", "Auftragsbestätigung als PDF gesendet (Demo)"]] },
      { id: 5, flow: "regie", titel: "RB-0412 → Rechnungsvorlage", zeit: "08:05", st: "freigabe", prot: [["08:04", "Regiebericht vollständig: Stunden, Material, Unterschrift"], ["08:05", "PDF erzeugt, Rechnungsvorlage wartet auf Freigabe"]] },
      { id: 6, flow: "zahlung", titel: "Kontoumsatz 412,00 € ohne Verwendungszweck", zeit: "06:02", st: "manuell", grund: "Betrag passt zu keiner offenen Rechnung eindeutig. Bitte selbst zuordnen.", prot: [["06:02", "Kontoumsätze abgerufen"], ["06:02", "Keine eindeutige Zuordnung – an Büro übergeben"]] },
      { id: 7, flow: "zahlung", titel: "Zahlungserinnerung an Johann Forster", zeit: "06:03", st: "freigabe", prot: [["06:03", "Rechnung überfällig – Erinnerung vorbereitet"]] },
      { id: 8, flow: "nachher", titel: "Bewertungsbitte an Georg Hofbauer", zeit: "07:15", st: "fehler", grund: "E-Mail kam zurück (Postfach voll). Es wurde nichts doppelt verschickt.", versuche: 1, prot: [["07:15", "Auftrag abgeschlossen – Bewertungsbitte erstellt"], ["07:15", "Fehler: E-Mail nicht zustellbar"]] }
    ];
    return st.autoLaeufe;
  }
  function statusVon(l) { return X().flowAn(l.flow) ? l.st : "aus"; }
  function alPanel() {
    var st = R().state(), alle = laeufe().filter(function (l) { return st.rolle === "betreiber" ? l.flow === "vermittlung" : l.flow !== "vermittlung"; });
    var filt = st.alFilter || "alle", zahl = {}; Object.keys(AST).forEach(function (k) { zahl[k] = 0; });
    alle.forEach(function (l) { zahl[statusVon(l)]++; });
    var liste = alle.filter(function (l) { return filt === "alle" || statusVon(l) === filt; }).slice().sort(function (a, b) { var o = { fehler: 0, manuell: 1, freigabe: 2, ok: 3, aus: 4 }; return o[statusVon(a)] - o[statusVon(b)] || b.id - a.id; });
    var titel = function (id) { var f = X().ablaeufe().filter(function (a) { return a.id === id; })[0]; return f ? f.titel : id; };
    var rg = REGELN[st.wfSel], fsel = X().ablaeufe().filter(function (a) { return a.id === st.wfSel; })[0];
    return '<section class="panel al" aria-labelledby="al-h" style="margin-top:16px"><h2 id="al-h">Kontrolle: Status jeder Ausführung</h2>' +
      '<p class="al-text">Keine Automatik scheitert still. Jeder Fehler steht hier, bis er erledigt ist – mit Grund und Protokoll.</p>' +
      '<div class="al-chips" role="group" aria-label="Nach Status filtern"><button type="button" data-al-filter="alle" aria-pressed="' + (filt === "alle") + '">Alle ' + alle.length + "</button>" +
        Object.keys(AST).map(function (k) { return '<button type="button" data-al-filter="' + k + '" aria-pressed="' + (filt === k) + '"><i class="al-dot ' + k + '"></i>' + AST[k][0] + " " + zahl[k] + "</button>"; }).join("") + "</div>" +
      (liste.length ? '<div class="al-liste">' + liste.map(function (l) {
        var s = statusVon(l), offen = (st.alOffen || {})[l.id];
        var knopf = s === "fehler" ? '<button class="btn-mini primary" type="button" data-al-retry="' + l.id + '">Erneut starten</button>' :
          s === "freigabe" ? '<button class="btn-mini primary" type="button" data-al-frei="' + l.id + '">Freigeben</button>' :
          s === "manuell" ? '<button class="btn-mini primary" type="button" data-al-manuell="' + l.id + '">Erledigt</button>' :
          s === "aus" ? '<button class="btn-mini" type="button" data-wf-sel="' + l.flow + '">Ablauf ansehen</button>' : "";
        return '<div class="al-run ' + s + '"><div class="al-main"><span class="pill ' + AST[s][1] + '">' + AST[s][0] + "</span><strong>" + esc(l.titel) + "</strong><small>" + esc(titel(l.flow)) + " · " + esc(l.zeit) + " Uhr" + (l.versuche > 1 ? " · " + l.versuche + ". Versuch" : "") + "</small>" +
          (s === "aus" ? "<small>Ablauf ist ausgeschaltet – nichts wird ausgeführt.</small>" : l.grund && (s === "fehler" || s === "manuell") ? '<small class="al-grund">' + esc(l.grund) + "</small>" : "") + "</div>" +
          '<div class="al-side">' + knopf + '<button class="btn-mini" type="button" data-al-prot="' + l.id + '" aria-expanded="' + !!offen + '">Protokoll</button></div>' +
          (offen ? '<ol class="al-prot">' + l.prot.map(function (p) { return "<li><b>" + esc(p[0]) + "</b> " + esc(p[1]) + "</li>"; }).join("") + "</ol>" : "") + "</div>";
      }).join("") + "</div>" : '<p class="col-empty">Keine Ausführungen mit diesem Status.</p>') +
      (rg && fsel ? '<h3 class="al-regel-h">Regel „' + esc(fsel.titel) + '“</h3><dl class="al-regel"><dt>Auslöser</dt><dd>' + esc(rg.ausl) + "</dd><dt>Bedingung</dt><dd>" + esc(rg.bed) + "</dd><dt>Aktion</dt><dd>" + esc(rg.akt) +
        "</dd><dt>Verantwortlich</dt><dd>" + esc(rg.wer) + "</dd><dt>Freigabe</dt><dd>" + esc(rg.frei) + "</dd><dt>Fehlerstatus</dt><dd>" +
        (function () { var f = laeufe().filter(function (l) { return l.flow === fsel.id && statusVon(l) === "fehler"; }).length; return f ? f + " fehlgeschlagen – oben erneut starten" : "keine Fehler"; })() + "</dd></dl>" : "") +
      '<p class="src">Beispieldaten. In der Demo wird nichts verschickt; „Erneut starten“ zeigt, wie ein Fehler sichtbar bleibt, bis er gelöst ist.</p></section>';
  }
  function alEinsetzen() {
    var st = R().state(); if (st.view !== "ablaeufe") return;
    var m = document.getElementById("app-main"); if (!m || m.querySelector(".al")) return;
    var wf = m.querySelector(".wf"); if (!wf) return;
    var d = document.createElement("div"); d.innerHTML = alPanel(); wf.parentNode.insertBefore(d.firstChild, wf.nextSibling);
  }
  function alNeu() { var m = document.getElementById("app-main"), alt = m && m.querySelector(".al"); if (alt) alt.remove(); alEinsetzen(); }
  function alLauf(id) { return laeufe().filter(function (l) { return l.id === +id; })[0]; }
  function alRetry(l) {
    var t = R().jetzt(); l.versuche = (l.versuche || 1) + 1; l.prot.push([t, "Erneut gestartet von " + R().ich()]);
    if (l.id === 2 && l.versuche === 2) { l.st = "manuell"; l.grund = "Anhang weiterhin nicht lesbar. Vorschlag: Kundin um ein neues Foto bitten."; l.prot.push([t, "Fehler wiederholt – an Büro übergeben"]); R().toast("Wieder fehlgeschlagen – jetzt als manuelle Bearbeitung markiert."); }
    else { l.st = "ok"; l.grund = null; l.prot.push([t, "Erfolgreich ausgeführt (Demo, nichts verschickt)"]); R().protokoll(l.titel + " – nach erneutem Start erfolgreich"); R().toast("Erneut gestartet: erfolgreich."); }
  }

  /* ---------- 3. Wirtschaftlicher Nutzen ---------- */
  var MIN_JE_SCHRITT = 4;   // Annahme: Minuten Büroarbeit je automatisch erledigtem Schritt
  var MIN_JE_UEBERNAHME = 6; // Annahme: Minuten Abtippen je übernommenem Datensatz
  function nutzen() {
    var st = R().state(), mod = R().mod(), mt = R().mt(), E = X();
    if (E.ketteSync) E.ketteSync();
    var leads = st.leads || [], angebote = st.angebote || [], auftr = st.auftraege || [], rech = mod.rechnungen || [];
    // 1 zurückgewonnen
    var zurueck = leads.filter(function (l) { return (l.stage === "auftrag" || l.stage === "erledigt") && (l.erinnert || 0) > 0; });
    var zurueckV = zurueck.reduce(function (s, l) { return s + (l.wert || 0); }, 0);
    // 2 reaktiviert
    var reakt = leads.filter(function (l) { return l.reaktiviert && (l.stage === "auftrag" || l.stage === "erledigt"); });
    // 3 offene Angebote
    var offen = E.offeneAngebote(), offenV = offen.reduce(function (s, l) { return s + (l.wert || 0); }, 0);
    // 4 nicht abgerechnet
    var rbOffen = (mt.berichte || []).filter(function (b) { return b.nr.indexOf("RB") === 0 && b.status !== "abgerechnet" && b.stunden != null; });
    var rbV = rbOffen.reduce(function (s, b) { return s + (+b.stunden || 0) * E.satz() + (+b.materialEuro || 0); }, 0);
    var auOhne = auftr.filter(function (a) { return a.status === "abgeschlossen" && !a.rechnungen.length; });
    var auOhneV = auOhne.reduce(function (s, a) { return s + E.auftragWert(a); }, 0);
    // 5 überfällig
    var ueber = rech.filter(function (r) { return r.faellig > 0 && E.restVon(r) > 0; }), ueberV = ueber.reduce(function (s, r) { return s + E.restVon(r); }, 0);
    var eingang = rech.reduce(function (s, r) { return s + E.bezahltVon(r); }, 0);
    var umsatzRe = rech.reduce(function (s, r) { return s + r.betrag; }, 0);
    // 6 Zeit, 10 Vorgänge
    var logN = E.logStart().length + (st.log || []).length;
    var al = laeufe(), alOk = al.filter(function (l) { return statusVon(l) === "ok"; }).length;
    var uebern = angebote.length + auftr.filter(function (a) { return a.angebotId; }).length + auftr.reduce(function (s, a) { return s + a.rechnungen.length; }, 0) + (mt.berichte || []).filter(function (b) { return b.status === "abgerechnet"; }).length;
    var minuten = logN * MIN_JE_SCHRITT + uebern * MIN_JE_UEBERNAHME;
    // 7 Rentabilität
    var mitIst = auftr.map(function (a) { return { a: a, k: kalk(a) }; }).filter(function (x) { return x.k.ist.std != null; });
    var dbIst = mitIst.reduce(function (s, x) { return s + x.k.dbIst; }, 0), dbSoll = mitIst.reduce(function (s, x) { return s + x.k.dbSoll; }, 0);
    var verlust = mitIst.filter(function (x) { return x.k.ist.std > x.k.soll.std; });
    // 9 Probleme
    var alleErinnert = offen.filter(function (l) { return (l.erinnert || 0) >= E.nachfassTage().length; });
    var fehler = al.filter(function (l) { var s = statusVon(l); return s === "fehler" || s === "manuell"; });
    var probleme = ueber.length + verlust.length + alleErinnert.length + fehler.length + auOhne.length;

    var ART = { vol: "Volumen", ums: "Umsatz", zahl: "Zahlungseingang", db: "Deckungsbeitrag", zeit: "Zeitersparnis (geschätzt)", anz: "Anzahl" };
    var karte = function (nr, titel, art, wert, sub, rechenweg, fehlt) {
      return '<article class="nz-karte' + (fehlt ? " fehlt" : "") + '"><div class="nz-kopf"><span class="nz-nr">' + nr + '</span><span class="nz-art ' + art + '">' + ART[art] + "</span></div><h3>" + titel + "</h3>" +
        "<strong>" + (fehlt ? '<span class="rk-fehlt">' + fehlt + "</span>" : wert) + "</strong><small>" + sub + "</small>" +
        '<details><summary>Berechnungsgrundlage</summary><p>' + rechenweg + "</p></details></article>";
    };
    var namen = function (arr, f) { return arr.length ? arr.slice(0, 4).map(function (x) { return esc(f(x)); }).join(", ") + (arr.length > 4 ? " und " + (arr.length - 4) + " weitere" : "") : "keine"; };
    var html = E.head("Wirtschaftlicher Nutzen", "Was die Software nachweisbar bringt – jede Zahl mit Rechenweg. Volumen ist nicht Gewinn: Kundario zeigt getrennt, was angeboten, abgerechnet, bezahlt und verdient wurde.") +
      '<div class="kpis">' + E.kpi("Zahlungseingang", eur(eingang), "tatsächlich bezahlt, alle Rechnungen") + E.kpi("Abgerechneter Umsatz", eur(umsatzRe), n(rech.length, "Rechnung", "Rechnungen") + ", brutto") +
        E.kpi("Deckungsbeitrag tatsächlich", mitIst.length ? eur(dbIst) : "fehlt", mitIst.length ? n(mitIst.length, "Auftrag", "Aufträge") + " mit Ist-Stunden" : "noch keine Ist-Stunden") + E.kpi("Gesparte Bürozeit", "ca. " + std(minuten / 60) + " Std.", "geschätzt, Annahmen unten") + "</div>" +
      '<div class="nz-grid">' +
        karte(1, "Durch Nachfassen zurückgewonnene Angebote", "vol", eur(zurueckV), n(zurueck.length, "Auftrag", "Aufträge") + " nach mindestens einer Erinnerung",
          "Summe der Angebotswerte aller Anfragen, die nach einer automatischen Erinnerung zum Auftrag wurden: " + namen(zurueck, function (l) { return l.name + " " + eur(l.wert); }) + ". Das ist Auftragsvolumen, kein zusätzlicher Gewinn – ob der Kunde auch ohne Erinnerung gekauft hätte, weiß niemand.", zurueck.length ? "" : "noch keiner") +
        karte(2, "Umsatz aus reaktivierten Anfragen", "ums", "", "alte Anfragen, die wieder aufgenommen wurden",
          "Summe der Aufträge aus Anfragen, die über „Altes Angebot reaktivieren“ wieder aufgenommen wurden. In den Beispieldaten ist noch keine reaktivierte Anfrage zum Auftrag geworden – deshalb steht hier keine Zahl.", reakt.length ? "" : "keine Daten") +
        karte(3, "Offene Angebotswerte", "vol", eur(offenV), n(offen.length, "Angebot wartet", "Angebote warten") + " auf Antwort",
          "Summe der Werte aller gesendeten, noch nicht angenommenen oder abgelehnten Angebote: " + namen(offen, function (l) { return l.name + " " + eur(l.wert); }) + ".") +
        karte(4, "Nicht abgerechnete Leistungen", "ums", eur(rbV + auOhneV), n(rbOffen.length, "Regiebericht", "Regieberichte") + ", " + n(auOhne.length, "abgeschlossener Auftrag", "abgeschlossene Aufträge") + " ohne Rechnung",
          "Regieberichte ohne Rechnung: Stunden × " + eur(E.satz()) + " + Material (" + namen(rbOffen, function (b) { return b.nr; }) + "). Dazu abgeschlossene Aufträge ohne Rechnung zum Angebotswert netto (" + namen(auOhne, function (a) { return a.nr; }) + ").") +
        karte(5, "Überfällige Rechnungen", "zahl", eur(ueberV), n(ueber.length, "Rechnung", "Rechnungen") + " über dem Zahlungsziel",
          "Offener Restbetrag aller Rechnungen nach Fälligkeit: " + namen(ueber, function (r) { return r.nr + " (" + r.faellig + " Tage)"; }) + ".") +
        karte(6, "Gesparte Bürozeit", "zeit", "ca. " + std(minuten / 60) + " Std.", logN + " automatische Schritte, " + uebern + " Übernahmen",
          logN + " automatisch erledigte Schritte × " + MIN_JE_SCHRITT + " Min. + " + uebern + " Datensätze ohne Abtippen übernommen × " + MIN_JE_UEBERNAHME + " Min. = " + minuten + " Min. Die Minutenwerte sind Annahmen und im echten Betrieb einstellbar.") +
        karte(7, "Auftragsrentabilität", "db", mitIst.length ? eur(dbIst) : "", mitIst.length ? "geplant " + eur(dbSoll) + " · " + n(verlust.length, "Auftrag", "Aufträge") + " über den geplanten Stunden" : "Ist-Stunden fehlen",
          "Deckungsbeitrag = Erlös − Stunden × Kosten je Stunde − Material − Fremdleistungen − Fahrt − Sonstiges, je Auftrag mit erfassten Stunden: " + namen(mitIst, function (x) { return x.a.nr + " " + eur(x.k.dbIst); }) + ". Details im jeweiligen Auftrag.", mitIst.length ? "" : "fehlt") +
        karte(8, "Vermiedene doppelte Datenerfassung", "anz", String(uebern), "Datensätze ohne erneutes Abtippen übernommen",
          angebote.length + " Angebote aus Anfragen + " + auftr.filter(function (a) { return a.angebotId; }).length + " Aufträge aus Angeboten + " + auftr.reduce(function (s, a) { return s + a.rechnungen.length; }, 0) + " Rechnungen aus Aufträgen + " + (mt.berichte || []).filter(function (b) { return b.status === "abgerechnet"; }).length + " Regieberichte in Rechnungen.") +
        karte(9, "Erkannte Probleme", "anz", String(probleme), "brauchen eine Entscheidung",
          ueber.length + " überfällige Rechnungen, " + verlust.length + " Aufträge über Plan, " + alleErinnert.length + " Angebote nach allen Erinnerungen ohne Antwort, " + fehler.length + " Automatik-Fehler oder Handarbeit, " + auOhne.length + " abgeschlossene Aufträge ohne Rechnung.") +
        karte(10, "Automatisierte Vorgänge", "anz", String(logN), alOk + " von " + al.length + " Ausführungen im Kontrollsystem erfolgreich",
          "Anzahl der Einträge im Ausführungsprotokoll heute (" + E.logStart().length + " aus dem Morgenlauf, " + (st.log || []).length + " aus Ihren Aktionen in der Demo). Fehlgeschlagene und wartende Ausführungen stehen unter Abläufe.") +
      "</div>" +
      '<section class="panel nz-unter"><h2>So trennt Kundario die Zahlen</h2><ul>' +
        "<li><b>Volumen:</b> Wert von Angeboten. Noch kein Geld.</li><li><b>Umsatz:</b> abgerechnete oder abrechenbare Leistungen.</li><li><b>Zahlungseingang:</b> was wirklich auf dem Konto ist.</li>" +
        "<li><b>Deckungsbeitrag:</b> Erlös minus direkte Kosten des Auftrags.</li><li><b>Zeitersparnis:</b> geschätzt, Annahmen stehen offen dabei.</li></ul>" +
        '<p class="src">Beispiel: Ein Angebot über 6.000 € wird nach einer Erinnerung angenommen. Kundario zählt 6.000 € als zurückgewonnenes Volumen – nicht als 6.000 € Gewinn. Fehlende Daten werden als fehlend angezeigt, nicht geschätzt. Alle Werte hier sind Beispieldaten und ändern sich mit jeder Aktion in der Demo.</p></section>';
    return html;
  }
  window.DEMO_ERW_UI = { nutzen: nutzen, kalk: kalk, bgHtml: function () { return bgHtml(); } };

  /* ---------- 4. Betriebsgröße ---------- */
  var GROESSE = {
    allein: { label: "Allein", sub: "1 Person", team: ["Thomas"], menue: "einfach" },
    klein: { label: "Klein", sub: "2–5 Personen", team: ["Alex", "Robin", "Stefan"], menue: "einfach" },
    mittel: { label: "Mittel", sub: "6–15 Personen", team: ["Alex", "Robin", "Stefan", "Mia", "Jonas", "Lena", "Tobias"], menue: "alle" },
    gross: { label: "Groß", sub: "16+ Personen", team: ["Alex", "Robin", "Stefan", "Mia", "Jonas", "Lena", "Tobias", "Kerem", "Julia", "Paul", "Nina", "Felix"], menue: "alle" }
  };
  function groesse() { var g = R().state().betrieb; return GROESSE[g] ? g : "klein"; }
  function teamAnwenden() {
    var T = X().team(), soll = GROESSE[groesse()].team;
    if (T.join() === soll.join()) return;
    T.length = 0; soll.forEach(function (n) { T.push(n); });
  }
  function bgInnen() { var g = groesse(); return "<span>Betriebsgröße</span><select data-bg-wahl aria-label=\"Betriebsgröße\">" + Object.keys(GROESSE).map(function (k) { return '<option value="' + k + '"' + (k === g ? " selected" : "") + ">" + GROESSE[k].label + " · " + GROESSE[k].sub + "</option>"; }).join("") + "</select>"; }
  function bgHtml() { var st = R() && R().state(); if (!st || ["gf", "buero", "aussen"].indexOf(st.rolle) < 0) return ""; return '<label class="bg-wahl im-sheet">' + bgInnen() + "</label>"; }
  function bgEinsetzen() {
    var nav = document.getElementById("side-nav"); if (!nav || nav.querySelector(".bg-wahl")) return;
    var st = R().state(); if (["gf", "buero", "aussen"].indexOf(st.rolle) < 0) return;
    var d = document.createElement("label"); d.className = "bg-wahl";
    d.innerHTML = bgInnen();
    var gw = nav.querySelector(".gw-chip"), leg = nav.querySelector(".stand-legende");
    if (gw) gw.parentNode.insertBefore(d, gw.nextSibling); else if (leg) nav.insertBefore(d, leg); else nav.insertBefore(d, nav.firstChild);
  }
  function bgSetzen(k) {
    var st = R().state(); st.betrieb = k; teamAnwenden();
    st.menue = GROESSE[k].menue; try { localStorage.setItem("auftragscockpit-menue", st.menue); } catch (e) { /* privat */ }
    R().speichern(); R().render(); if (X().sheetNeu) X().sheetNeu();
    R().toast("Betriebsgröße: " + GROESSE[k].label + " (" + GROESSE[k].sub + "). Team-Auswahl: " + GROESSE[k].team.length + (GROESSE[k].team.length === 1 ? " Person" : " Personen") + ", Menü: " + (st.menue === "alle" ? "alle Bereiche" : "einfach") + ". Die Beispieldaten bleiben gleich.");
  }

  /* ---------- Ereignisse ---------- */
  function zahl(v) { v = String(v).trim().replace(/\./g, "").replace(",", "."); return v === "" ? null : (isNaN(+v) ? undefined : +v); }
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t || !t.getAttribute || !R()) return;
    if (t.hasAttribute("data-bg-wahl")) return bgSetzen(t.value);
    if (t.hasAttribute("data-rk")) {
      var st = R().state(), au = (st.auftraege || []).filter(function (x) { return x.id === st.auftragSel; })[0]; if (!au) return;
      var v = zahl(t.value), f = t.getAttribute("data-rk"); if (v === undefined || (v != null && v < 0)) { R().toast("Bitte eine Zahl eingeben."); return rentNeu(); }
      au.kalk = au.kalk || {}; if (v == null) delete au.kalk[f]; else au.kalk[f] = v;
      R().speichern(); rentNeu();
    }
  });
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest || !R()) return;
    var el;
    if (t.closest("[data-rk-reset]")) { var st = R().state(), au = (st.auftraege || []).filter(function (x) { return x.id === st.auftragSel; })[0]; if (au) { au.kalk = {}; R().speichern(); rentNeu(); } return; }
    if (!t.closest(".al")) return;
    var s2 = R().state();
    if ((el = t.closest("[data-al-filter]"))) { s2.alFilter = el.getAttribute("data-al-filter"); return alNeu(); }
    if ((el = t.closest("[data-al-prot]"))) { s2.alOffen = s2.alOffen || {}; var id = el.getAttribute("data-al-prot"); s2.alOffen[id] = !s2.alOffen[id]; return alNeu(); }
    if ((el = t.closest("[data-al-retry]"))) { alRetry(alLauf(el.getAttribute("data-al-retry"))); R().speichern(); return alNeu(); }
    if ((el = t.closest("[data-al-frei]"))) { var l = alLauf(el.getAttribute("data-al-frei")); l.st = "ok"; l.prot.push([R().jetzt(), "Freigegeben von " + R().ich() + " – ausgeführt (Demo, nichts verschickt)"]); R().protokoll(l.titel + " – freigegeben"); R().speichern(); R().toast("Freigegeben."); return alNeu(); }
    if ((el = t.closest("[data-al-manuell]"))) { var l2 = alLauf(el.getAttribute("data-al-manuell")); l2.st = "ok"; l2.grund = null; l2.prot.push([R().jetzt(), "Von Hand erledigt durch " + R().ich()]); R().speichern(); R().toast("Als erledigt markiert."); return alNeu(); }
  });

  function pruefen() { try { if (R() && R().state() && X()) { teamAnwenden(); rentEinsetzen(); alEinsetzen(); bgEinsetzen(); } } catch (x) { if (window.console) console.warn(x); } }
  var main = document.getElementById("app-main"), nav = document.getElementById("side-nav");
  if (window.MutationObserver) { if (main) new MutationObserver(pruefen).observe(main, { childList: true }); if (nav) new MutationObserver(pruefen).observe(nav, { childList: true }); }
  window.addEventListener("load", function () { setTimeout(pruefen, 300); });
})();
