/* Kundario – Morgenbericht „Heute“: die 5–7 Dinge, die heute entschieden oder erledigt werden müssen.
   Jede Zeile: Dringlichkeit (Farbe), ein Verb, der Grund, ein Betrag, genau ein Knopf. Sortiert nach Geld und Zeitdruck. */
(function () {
  var V = K.views, h = U.h || function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var tageZwischen = function (a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5); };
  var sicher = function (p) { return p.catch(function () { return []; }); };

  K.heutePunkte = async function () {
    var c = K.ctx, heute = U.isoTag(), fin = K.darf("rechnungen"), vertr = K.darf("angebote"), chef = c.ich.rolle === "gf" || c.ich.rolle === "buero";
    var r = await Promise.all([
      fin ? sicher(K.liste("rechnungen", { wo: { status: ["gestellt", "teilbezahlt"] } })) : [],
      K.darf("anfragen") ? sicher(K.liste("anfragen", { wo: { status: ["neu"] } })) : [],
      vertr ? sicher(K.liste("angebote", { wo: { status: "gesendet" } })) : [],
      K.darf("berichte") ? sicher(K.liste("berichte", { wo: { status: "unterschrieben" } })) : [],
      sicher(K.liste("termine", { sortiere: "beginn.asc" })),
      sicher(K.liste("aufgaben", { wo: { erledigt: false } })),
      K.darf("ablaeufe") ? sicher(K.liste("ablauf_laeufe", { wo: { status: "freigabe" } })) : [],
      chef && K.darf("material") ? sicher(K.liste("material", { wo: { status: "freigabe" } })) : [],
      K.kundenMap()
    ]);
    var km = r[8], kn = function (id) { return km[id] ? km[id].name : ""; }, p = [];
    // 1) Geld: überfällige Rechnungen
    r[0].filter(function (x) { return x.faellig && x.faellig < heute; }).forEach(function (x) {
      var t = tageZwischen(x.faellig, heute);
      p.push({ stufe: "kritisch", punkte: 900 + Math.min(t, 60) + (+x.brutto || 0) / 1000, verb: "Zahlung anmahnen", was: x.nr + " · " + kn(x.kunde_id), grund: t + (t === 1 ? " Tag" : " Tage") + " überfällig", betrag: +x.brutto, knopf: "Mahnen", aktion: "mahnen", id: x.id, link: "#/rechnungen/" + x.id });
    });
    // 2) Neue Anfragen, die zu lange warten (Antwort binnen 24 Std. entscheidet über den Auftrag)
    r[1].forEach(function (a) {
      var std = (Date.now() - new Date(a.created_at)) / 36e5;
      p.push({ stufe: std > 48 ? "kritisch" : std > 24 ? "heute" : "laeuft", punkte: (std > 48 ? 850 : std > 24 ? 600 : 420) + Math.min(std, 200) / 10, verb: "Anfrage beantworten", was: a.betreff + (kn(a.kunde_id) ? " · " + kn(a.kunde_id) : ""), grund: std < 1 ? "gerade eingegangen" : "wartet seit " + (std < 48 ? Math.round(std) + " Std." : Math.round(std / 24) + " Tagen"), betrag: a.wert_geschaetzt ? +a.wert_geschaetzt : null, schaetzung: true, knopf: "Antworten", link: "#/anfragen/" + a.id });
    });
    // 3) Freigaben, die nur der Chef geben kann
    if (r[6].length) p.push({ stufe: "heute", punkte: 700 + r[6].length, verb: r[6].length === 1 ? "Nachricht freigeben" : r[6].length + " Nachrichten freigeben", was: r[6][0].titel || "Automatischer Ablauf", grund: "wartet auf Ihre Freigabe", betrag: null, knopf: "Prüfen", link: "#/ablaeufe" });
    if (r[7].length) p.push({ stufe: "heute", punkte: 640 + r[7].length, verb: r[7].length === 1 ? "Bestellung freigeben" : r[7].length + " Bestellungen freigeben", was: r[7].map(function (m) { return m.artikel; }).slice(0, 2).join(", "), grund: "Material für die Baustelle", betrag: r[7].reduce(function (s, m) { return s + (+m.preis || 0) * (+m.menge || 0); }, 0) || null, knopf: "Freigeben", link: "#/material" });
    // 4) Angebote: nachfassen und Ablauf
    r[2].forEach(function (a) {
      var nf = K.nachfassFaellig ? K.nachfassFaellig(a) : { faellig: false }, rest = a.gueltig_bis ? tageZwischen(heute, a.gueltig_bis) : 99;
      if (rest >= 0 && rest <= 3) p.push({ stufe: "heute", punkte: 680 + (3 - rest) * 10 + (+a.netto || 0) / 2000, verb: "Angebot retten", was: a.nr + " · " + kn(a.kunde_id), grund: rest === 0 ? "läuft heute ab" : "läuft in " + rest + (rest === 1 ? " Tag" : " Tagen") + " ab", betrag: +a.netto, knopf: "Anrufen", link: km[a.kunde_id] && km[a.kunde_id].telefon ? "tel:" + String(km[a.kunde_id].telefon).replace(/[^\d+]/g, "") : "#/angebote/" + a.id });
      else if (nf.faellig) p.push({ stufe: "heute", punkte: 560 + (+a.netto || 0) / 2000, verb: "Nachfassen", was: a.nr + " · " + kn(a.kunde_id), grund: "keine Antwort seit " + U.relativ(a.gesendet_at || a.created_at).replace(/^vor /, ""), betrag: +a.netto, knopf: "Nachfassen", aktion: "erinnern", id: a.id, link: "#/nachfassen" });
    });
    // 5) Unterschriebene Regieberichte = Geld, das noch nicht berechnet ist
    r[3].forEach(function (b) { p.push({ stufe: "heute", punkte: 620 + (+b.stunden || 0), verb: "Bericht abrechnen", was: b.nr + " · " + (b.taetigkeit || ""), grund: "vom Kunden unterschrieben, noch keine Rechnung", betrag: null, knopf: "Abrechnen", link: "#/berichte/" + b.id }); });
    // 6) Termine heute
    r[4].filter(function (t) { return t.beginn.slice(0, 10) === heute && (c.ich.rolle !== "monteur" || (t.mitarbeiter || []).indexOf(c.user.id) > -1); }).forEach(function (t) {
      p.push({ stufe: "laeuft", punkte: 500 - +t.beginn.slice(11, 13), verb: U.zeit(t.beginn) + " " + (t.art === "besichtigung" ? "Besichtigung" : "Termin"), was: t.titel + (kn(t.kunde_id) ? " · " + kn(t.kunde_id) : ""), grund: t.ort || "heute", betrag: null, knopf: "Öffnen", link: "#/kalender/" + t.id, zeit: true });
    });
    // 7) Aufgaben, die heute fällig oder überfällig sind
    r[5].filter(function (a) { return a.faellig && a.faellig <= heute && (!a.zugewiesen_an || a.zugewiesen_an === c.user.id || chef); }).forEach(function (a) {
      p.push({ stufe: a.faellig < heute ? "kritisch" : "heute", punkte: (a.faellig < heute ? 610 : 450), verb: "Erledigen", was: a.titel, grund: a.faellig < heute ? "seit " + U.datum(a.faellig) + " fällig" : "heute fällig", betrag: null, knopf: "Erledigt", aktion: "aufgabeErledigt", id: a.id });
    });
    // 8) Lager und Wartungen – wichtig, aber selten dringend
    var knapp = K.lagerKnapp && K.darf("material") ? await K.lagerKnapp() : [];
    if (knapp.length) p.push({ stufe: "neutral", punkte: 300 + knapp.length, verb: "Nachbestellen", was: knapp.map(function (x) { return x.text; }).slice(0, 3).join(", ") + (knapp.length > 3 ? " …" : ""), grund: knapp.length + (knapp.length === 1 ? " Artikel" : " Artikel") + " unter Mindestbestand", betrag: null, knopf: "Zum Lager", link: "#/lager" });
    var wart = K.wartungenFaellig && K.darf("wartungen") ? (await K.wartungenFaellig()).filter(function (w) { return w.naechste <= U.plusTage(null, 7); }) : [];
    if (wart.length) p.push({ stufe: "neutral", punkte: 280 + wart.length, verb: "Wartung einplanen", was: wart.map(function (w) { return kn(w.kunde_id) || w.titel; }).slice(0, 3).join(", "), grund: wart.length + " in den nächsten 7 Tagen fällig", betrag: null, knopf: "Planen", link: "#/wartungen" });
    return p.sort(function (a, b) { return b.punkte - a.punkte; });
  };

  K.heuteHtml = async function () {
    var p = await K.heutePunkte(), zeigen = p.slice(0, 7), rest = p.length - zeigen.length;
    var geld = p.filter(function (x) { return x.betrag && !x.schaetzung; }).reduce(function (s, x) { return s + x.betrag; }, 0), krit = p.filter(function (x) { return x.stufe === "kritisch"; }).length;
    var zeile = function (x, i) {
      var art = i === 0 ? "btn-signal" : "btn-outline", knopf = x.aktion ? '<button class="btn ' + art + ' klein" data-a="' + x.aktion + '" data-id="' + x.id + '">' + h(x.knopf) + "</button>" : '<a class="btn ' + art + ' klein" href="' + x.link + '">' + h(x.knopf) + "</a>";
      var innen = !!x.link && x.link.indexOf("#/") === 0;
      return '<li class="hz hz-' + x.stufe + '"><span class="hz-nr">' + (i + 1) + '</span>' + (innen ? '<a class="hz-text" href="' + x.link + '">' : '<div class="hz-text">') + '<b>' + h(x.verb) + '</b> <span class="hz-was">' + h(x.was) + '</span><small>' + h(x.grund) + "</small>" + (innen ? "</a>" : "</div>") + (x.betrag ? '<span class="hz-betrag">' + U.eur(x.betrag) + "</span>" : '<span class="hz-betrag"></span>') + knopf + "</li>";
    };
    return '<section class="heute-karte" id="heute">' +
      '<header><div><h2>Heute entscheiden</h2><p>' + (p.length ? (zeigen.length + (zeigen.length === 1 ? " Punkt" : " Punkte") + ", wichtigster zuerst") + (krit ? " · <b class=\"t-kritisch\">" + krit + " dringend</b>" : "") : "Nichts Dringendes. Gute Zeit für Angebote und Akquise.") + "</p></div>" +
      (geld ? '<div class="heute-geld"><span>Geld, das auf Sie wartet</span><b>' + U.eur(geld) + "</b></div>" : "") + "</header>" +
      (zeigen.length ? '<ol class="heute-liste">' + zeigen.map(zeile).join("") + "</ol>" : '<div class="heute-leer">✓ Alles im Griff.</div>') +
      (rest > 0 ? '<details class="heute-mehr"><summary>' + rest + " weitere Punkte</summary><ol class=\"heute-liste\">" + p.slice(7).map(function (x, i) { return zeile(x, i + 7); }).join("") + "</ol></details>" : "") +
      "</section>";
  };

  // Willkommen: solange noch keine Kunden da sind – drei klare Wege zum ersten Erfolg
  K.willkommenHtml = async function () {
    if (K.ctx.ich.rolle !== "gf" || K.istVerwaltung()) return "";
    var k = await K.liste("kunden", { limit: 1 }).catch(function () { return [1]; }); if (k.length) return "";
    var gw = (K.ctx.betrieb || {}).gewerk || "Ihr Gewerk";
    return '<section class="willkommen"><div><h2>Willkommen bei Kundario</h2><p>So sehen Sie in 2 Minuten, was Kundario für Ihren Betrieb tut.</p></div><div class="wk-wege">' +
      '<button class="wk-weg" data-a="beispiel"><b>1 · Beispieldaten ansehen</b><span>Kunden, Anfrage, Angebot und Termin – gekennzeichnet und jederzeit löschbar.</span></button>' +
      '<button class="wk-weg" data-a="startpaket"><b>2 · Startpaket ' + h(gw) + '</b><span>Typische Leistungen und Textbausteine in den Katalog – nur noch Ihre Preise eintragen.</span></button>' +
      '<a class="wk-weg" href="#/anfragen/neu"><b>3 · Erste echte Anfrage</b><span>Ein Anruf von heute? In 30 Sekunden erfasst – der Rest folgt Schritt für Schritt.</span></a></div></section>';
  };

  var alt = V.uebersicht;
  V.uebersicht = async function (id, extra) {
    var html = await alt(id, extra), block = "";
    try { block = await K.heuteHtml(); } catch (e) { console.warn("Morgenbericht", e); }
    try { block = (await K.willkommenHtml()) + block; } catch (e) { /* ohne Willkommen weiter */ }
    var pos = html.indexOf('<div class="kpis">'); if (pos < 0) return html + block;
    html = html.slice(0, pos) + '<h2 class="ueb-zwischen">Zahlen und Listen</h2>' + html.slice(pos);
    var vor = html.indexOf('<section class="karte checkliste"'); if (vor < 0 || vor > pos) vor = pos;
    return html.slice(0, vor) + block + html.slice(vor);
  };
  if (alt.danach) V.uebersicht.danach = alt.danach;
})();
