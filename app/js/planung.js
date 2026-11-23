/* Kundario – Spracheingabe, Plantafel (auch am Handy) und Anfragen-Pipeline */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;
  var lies = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var schreib = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } };

  /* ======================= Spracheingabe ======================= */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  K.spracheGeht = function () { return !!SR; };
  K.MIC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  async function spracheErlaubt() {
    if (lies("kundario-sprache") === "ja") return true;
    var ok = await U.bestaetigen("Für die Spracheingabe schickt Ihr Browser die Aufnahme zur Auswertung an seinen Hersteller (z. B. Apple, Google oder Microsoft). Kundario speichert keine Aufnahmen. Bitte keine sensiblen Daten einsprechen. Spracheingabe auf diesem Gerät erlauben?", "Erlauben");
    if (ok) schreib("kundario-sprache", "ja"); return ok;
  }
  K.aktion.diktat = async function (el) {
    var feld = el.dataset.formel ? el.closest(".fz-formel").querySelector("input") : el.previousElementSibling;
    if (!feld || !SR) return; if (!(await spracheErlaubt())) return;
    var rec = new SR(); rec.lang = "de-DE"; rec.interimResults = false; rec.maxAlternatives = 1;
    el.classList.add("hoert"); U.toast("Ich höre zu …");
    await new Promise(function (fertig) {
      rec.onresult = function (e) { var t = e.results[0][0].transcript; feld.value = el.dataset.formel ? K.spracheZuFormel(t) : (feld.value ? feld.value.replace(/\s*$/, " ") : "") + t; feld.dispatchEvent(new Event("input", { bubbles: true })); };
      rec.onerror = function (e) { U.toast(e.error === "not-allowed" ? "Mikrofon ist nicht freigegeben. Bitte in den Einstellungen des Browsers erlauben." : "Nichts verstanden. Bitte noch einmal."); };
      rec.onend = function () { el.classList.remove("hoert"); fertig(); };
      try { rec.start(); } catch (x) { el.classList.remove("hoert"); fertig(); }
    });
  };
  function micAnhaengen(wurzel) {
    if (!SR) return;
    wurzel.querySelectorAll("textarea:not([data-mic])").forEach(function (t) {
      t.dataset.mic = "1"; if (t.closest("table.pe, #druck") || t.readOnly) return;
      t.insertAdjacentHTML("afterend", '<button type="button" class="mini mic mic-ta" data-a="diktat" aria-label="Sprechen statt tippen" title="Sprechen statt tippen">' + K.MIC + "</button>");
    });
  }
  if (SR) new MutationObserver(function () { micAnhaengen(document.body); }).observe(document.body, { childList: true, subtree: true });

  /* ======================= Plantafel ======================= */
  var ABWESEND = /^(urlaub|krank|berufsschule|frei|schule)\b/i;
  var istAbwesend = function (t) { return t.art === "intern" && ABWESEND.test(t.titel || ""); };
  var std = function (t) { return t.ende ? (new Date(t.ende) - new Date(t.beginn)) / 36e5 : 1; };
  K.ptKonflikte = function (liste) {   // überschneidende Termine je Person und Tag
    var k = {}, l = liste.filter(function (t) { return !istAbwesend(t); });
    for (var i = 0; i < l.length; i++) for (var j = i + 1; j < l.length; j++) {
      var a = l[i], b = l[j], ae = a.ende ? new Date(a.ende) : new Date(new Date(a.beginn).getTime() + 36e5), be = b.ende ? new Date(b.ende) : new Date(new Date(b.beginn).getTime() + 36e5);
      if (new Date(a.beginn) < be && new Date(b.beginn) < ae) { k[a.id] = 1; k[b.id] = 1; }
    }
    return k;
  };
  V.plantafel = async function () {
    var mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); mon.setDate(mon.getDate() + (+(sessionStorage.getItem("pt-woche") || 0)) * 7);
    var ende = new Date(mon.getTime() + 7 * 864e5), alle = await K.liste("termine", { sortiere: "beginn.asc" });
    var t = alle.filter(function (x) { var b = new Date(x.beginn); return b >= mon && b < ende; });
    var team = K.ctx.team.filter(function (m) { return m.aktiv; }), tage = []; for (var i = 0; i < 6; i++) tage.push(new Date(mon.getTime() + i * 864e5));
    var modus = sessionStorage.getItem("pt-modus") === "1", wahl = K._ptWahl || {}, woche = +((((K.ctx.betrieb.kalkulation || {}).eingaben) || {}).woche) || 40;
    var heute = U.isoTag(), au = K.darf("auftraege") ? await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit"] }, sortiere: "nr.asc" }) : [];
    var geplant = {}; alle.forEach(function (x) { if (x.auftrag_id && U.isoTag(x.beginn) >= heute) geplant[x.auftrag_id] = 1; });
    var offenAu = au.filter(function (a) { return !geplant[a.id]; });
    var zelle = function (m, d) {
      var iso = U.isoTag(d), l = t.filter(function (x) { return U.isoTag(x.beginn) === iso && (x.mitarbeiter || []).indexOf(m.user_id) > -1; }), weg = l.filter(istAbwesend), konf = K.ptKonflikte(l), arbeit = l.filter(function (x) { return !istAbwesend(x); });
      var warn = weg.length && arbeit.length;
      return '<td data-drop data-m="' + m.user_id + '" data-tag="' + iso + '" class="' + (weg.length ? "abwesend " : "") + (warn || Object.keys(konf).length ? "konflikt" : "") + '">' +
        weg.map(function (x) { return '<a class="pt-weg" href="#/kalender/' + x.id + '">' + h(x.titel) + "</a>"; }).join("") +
        arbeit.map(function (x) { return '<a class="pt-t art-' + x.art + (konf[x.id] ? " pt-konf" : "") + (wahl.t === x.id ? " gewaehlt" : "") + '" draggable="true" data-t="' + x.id + '" data-von="' + m.user_id + '" href="#/kalender/' + x.id + '"><b>' + U.zeit(x.beginn) + "</b> " + h(x.titel) + (konf[x.id] ? ' <span class="pill rot">Überschneidung</span>' : "") + "</a>"; }).join("") +
        (warn ? '<span class="pill rot">abwesend</span>' : "") + (modus && (wahl.t || wahl.au) ? '<span class="pt-ziel">hierher</span>' : "") + "</td>";
    };
    var last = function (m) { return Math.round(t.filter(function (x) { return (x.mitarbeiter || []).indexOf(m.user_id) > -1 && !istAbwesend(x); }).reduce(function (s, x) { return s + std(x); }, 0) * 10) / 10; };
    var offenT = t.filter(function (x) { return !(x.mitarbeiter || []).length; });
    return K.kopf("Plantafel", modus ? "Verschieben: Erst einen Termin oder Auftrag antippen, dann das Feld, wohin er soll." : "Wer ist wann wo? Termine auf andere Mitarbeiter oder Tage ziehen. Am Handy: „Verschieben“ antippen.",
        '<button class="btn btn-outline" data-a="ptWoche" data-n="-1">‹ Woche</button><button class="btn btn-outline" data-a="ptWoche" data-n="0">Heute</button><button class="btn btn-outline" data-a="ptWoche" data-n="1">Woche ›</button>' +
        '<button class="btn ' + (modus ? "btn-signal" : "btn-outline") + '" data-a="ptModus" aria-pressed="' + modus + '">' + (modus ? "Verschieben beenden" : "Verschieben") + '</button><button class="btn btn-outline" data-a="ptAbwesend">Abwesenheit</button><button class="btn btn-signal" data-a="terminNeu">Neuer Termin</button>') +
      '<div class="tabelle plantafel' + (modus ? " pt-modus" : "") + '"><table><thead><tr><th>Mitarbeiter</th>' + tage.map(function (d) { return "<th" + (U.isoTag(d) === heute ? ' class="heute"' : "") + ">" + d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        team.map(function (m) { var l = last(m), p = Math.round(l / woche * 100); return "<tr><th>" + h(m.name) + "<br><small>" + h(K.rolleName[m.rolle]) + '</small><span class="pt-last' + (p > 100 ? " voll" : "") + '" title="verplant">' + U.zahlText(l) + " / " + woche + ' Std.<i style="width:' + Math.min(100, p) + '%"></i></span></th>' + tage.map(function (d) { return zelle(m, d); }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" +
      '<div class="raster-2">' + (offenAu.length ? '<section class="karte"><h2>Noch nicht eingeplant</h2><p class="still">Aufträge ohne kommenden Termin. In die Tafel ziehen' + (modus ? " oder antippen und dann ein Feld wählen" : "") + '.</p><ul class="liste pt-auftraege">' +
          offenAu.map(function (a) { return '<li draggable="true" data-au="' + a.id + '" class="' + (wahl.au === a.id ? "gewaehlt" : "") + '"><b>' + h(a.nr) + "</b> " + h(a.titel) + (a.start ? " <small>ab " + U.datum(a.start) + "</small>" : "") + "</li>"; }).join("") + "</ul></section>" : "") +
        (offenT.length ? '<section class="karte"><h2>Noch niemandem zugeteilt</h2><ul class="liste pt-frei">' + offenT.map(function (x) { return '<li><a class="pt-t" draggable="true" data-t="' + x.id + '" data-von="" href="#/kalender/' + x.id + '">' + U.datumZeit(x.beginn) + " · " + h(x.titel) + "</a></li>"; }).join("") + "</ul></section>" : "") + "</div>";
  };
  K.aktion.ptModus = function () { var an = sessionStorage.getItem("pt-modus") === "1"; sessionStorage.setItem("pt-modus", an ? "0" : "1"); K._ptWahl = null; K.neuLaden(); };
  K.ptVerschieben = async function (tid, von, tag, m) {
    var t = await DB.eins("termine", tid), alt = new Date(t.beginn), neu = new Date(tag + "T" + ("0" + alt.getHours()).slice(-2) + ":" + ("0" + alt.getMinutes()).slice(-2)), dauer = t.ende ? new Date(t.ende) - alt : 0;
    var ma = (t.mitarbeiter || []).filter(function (x) { return x !== von; }); if (ma.indexOf(m) < 0) ma.push(m);
    await DB.aendern("termine", t.id, { beginn: neu.toISOString(), ende: dauer ? new Date(neu.getTime() + dauer).toISOString() : null, mitarbeiter: ma });
    if (t.auftrag_id) await K.verlauf("auftrag", t.auftrag_id, "Termin " + t.titel + " verschoben auf " + U.datum(neu) + " (" + K.mitgliedName(m) + ")");
    U.toast("Termin verschoben.");
  };
  K.ptEinplanen = async function (auId, tag, m) {
    var a = await DB.eins("auftraege", auId), b = new Date(tag + "T07:30"), e = new Date(tag + "T16:00");
    await K.neu("termine", { auftrag_id: a.id, kunde_id: a.kunde_id || null, art: "ausfuehrung", titel: a.titel, beginn: b.toISOString(), ende: e.toISOString(), ort: a.ort || null, mitarbeiter: [m], kunde_sichtbar: true });
    await K.verlauf("auftrag", a.id, "Eingeplant am " + U.datum(b) + " (" + K.mitgliedName(m) + ")");
    U.toast("Eingeplant von 7:30 bis 16:00 Uhr. Uhrzeit können Sie im Termin ändern.");
  };
  // Tippen statt Ziehen (Handy) – nur im Verschieben-Modus
  document.addEventListener("click", function (e) {
    var tafel = e.target.closest(".pt-modus, .pt-auftraege, .pt-frei"); if (!tafel || sessionStorage.getItem("pt-modus") !== "1" || K.aktView !== "plantafel") return;
    var t = e.target.closest(".pt-t[data-t]"), a = e.target.closest("[data-au]"), z = e.target.closest("td[data-drop]");
    if (t) { e.preventDefault(); e.stopPropagation(); K._ptWahl = { t: t.dataset.t, von: t.dataset.von }; K.neuLaden(); return; }
    if (a) { e.preventDefault(); K._ptWahl = { au: a.dataset.au }; K.neuLaden(); return; }
    if (z && K._ptWahl) { e.preventDefault(); var w = K._ptWahl; K._ptWahl = null;
      (w.t ? K.ptVerschieben(w.t, w.von, z.dataset.tag, z.dataset.m) : K.ptEinplanen(w.au, z.dataset.tag, z.dataset.m)).then(K.neuLaden).catch(U.fehler); }
  }, true);
  document.addEventListener("dragstart", function (e) { var a = e.target.closest && e.target.closest("[data-au]"); if (a) e.dataTransfer.setData("text/plain", JSON.stringify({ au: a.dataset.au })); });
  document.addEventListener("drop", function (e) {
    var z = e.target.closest && e.target.closest("[data-drop]"); if (!z) return;
    var p; try { p = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (x) { return; }
    if (!p || !p.au) return; e.preventDefault(); e.stopImmediatePropagation(); z.classList.remove("drop");
    K.ptEinplanen(p.au, z.dataset.tag, z.dataset.m).then(K.neuLaden).catch(U.fehler);
  }, true);
  K.aktion.ptAbwesend = async function () {
    var r = await U.dialog("Abwesenheit eintragen", '<div class="raster">' + U.feld("m", "Wer?", K.ctx.team[0] ? K.ctx.team[0].user_id : "", { optionen: K.ctx.team.filter(function (m) { return m.aktiv; }).map(function (m) { return [m.user_id, m.name]; }) }) +
      U.feld("art", "Grund", "Urlaub", { optionen: ["Urlaub", "Krank", "Berufsschule", "Frei"] }) + U.feld("von", "Von", U.isoTag(), { typ: "date", pflicht: true }) + U.feld("bis", "Bis", U.isoTag(), { typ: "date", pflicht: true }) + "</div><p class=\"still\">Wird an jedem Werktag (Montag bis Freitag) in Kalender und Plantafel eingetragen. Kunden sehen das nicht.</p>"); if (!r) return;
    var d = new Date(r.daten.von + "T12:00"), bis = new Date(r.daten.bis + "T12:00"), n = 0; if (bis < d) throw new Error("„Bis“ muss nach „Von“ liegen.");
    while (d <= bis && n < 90) { if (d.getDay() > 0 && d.getDay() < 6) { var iso = U.isoTag(d); await K.neu("termine", { art: "intern", titel: r.daten.art, beginn: new Date(iso + "T07:00").toISOString(), ende: new Date(iso + "T16:00").toISOString(), mitarbeiter: [r.daten.m], kunde_sichtbar: false }); n++; } d.setDate(d.getDate() + 1); }
    U.toast(n + " Tage eingetragen."); K.neuLaden();
  };

  /* ======================= Anfragen-Pipeline ======================= */
  var SPALTEN = ["neu", "in_pruefung", "besichtigung", "angebot"];
  var altAnfragen = V.anfragen;
  V.anfragen = async function (id, extra) {
    var board = sessionStorage.getItem("anf-ansicht") !== "liste";
    var umschalter = '<div class="ansicht-wahl" role="group" aria-label="Ansicht"><button data-a="anfAnsicht" data-v="liste" aria-pressed="' + !board + '">Liste</button><button data-a="anfAnsicht" data-v="board" aria-pressed="' + board + '">Pipeline</button></div>';
    if (id || !board) { var html = await altAnfragen(id, extra); return id ? html : html.replace('<div class="tabs">', umschalter + '<div class="tabs">'); }
    var r = await Promise.all([K.liste("anfragen", { sortiere: "created_at.desc" }), K.kundenMap(), K.darf("angebote") ? K.liste("angebote", { select: "id,anfrage_id,netto,status,created_at" }) : []]), alle = r[0], km = r[1], ang = r[2];
    var heute = U.isoTag(), jahr = U.plusTage(heute, -365), angVon = {}; ang.forEach(function (a) { if (a.anfrage_id && a.status !== "entwurf") (angVon[a.anfrage_id] = angVon[a.anfrage_id] || []).push(a); });
    var wert = function (a) { var l = angVon[a.id]; return l && l.length ? Math.max.apply(null, l.map(function (x) { return +x.netto; })) : +a.wert_geschaetzt || 0; };
    var entsch = alle.filter(function (a) { return (a.status === "gewonnen" || a.status === "verloren") && String(a.created_at).slice(0, 10) >= jahr; }), gew = entsch.filter(function (a) { return a.status === "gewonnen"; });
    var offen = alle.filter(function (a) { return SPALTEN.indexOf(a.status) > -1; }), wv = offen.filter(function (a) { return a.wiedervorlage && a.wiedervorlage <= heute; });
    var kanal = {}; entsch.forEach(function (a) { var k = kanal[a.kanal] = kanal[a.kanal] || { g: 0, n: 0 }; k.n++; if (a.status === "gewonnen") k.g++; });
    // Priorität: Wert, Wartezeit, Herkunft (Empfehlung/Stammkunde zählen mehr), fällige Wiedervorlage
    var stunden = function (a) { return (Date.now() - new Date(a.created_at)) / 36e5; };
    var prio = function (a) { var st = stunden(a), fr = a.status === "neu" || a.status === "in_pruefung"; return wert(a) / 1000 + (fr ? Math.min(st, 168) / 12 : 0) + (a.kanal === "empfehlung" ? 4 : 0) + (a.wiedervorlage && a.wiedervorlage <= heute ? 6 : 0); };
    var top = offen.slice().sort(function (x, y) { return prio(y) - prio(x); }).slice(0, 3).filter(function (a) { return prio(a) >= 5; }).map(function (a) { return a.id; });
    var weiter = function (a) {
      var k = km[a.kunde_id] || {}, an = (angVon[a.id] || []).slice().sort(function (x, y) { return String(y.created_at).localeCompare(String(x.created_at)); })[0];
      var dr = stunden(a) > 24 ? "btn-signal" : "btn-outline";
      if (a.status === "neu") return k.telefon ? '<a class="btn ' + dr + ' klein pl-weiter" href="tel:' + h(String(k.telefon).replace(/[^\d+]/g, "")) + '">Anrufen</a>' : '<a class="btn ' + dr + ' klein pl-weiter" href="#/anfragen/' + a.id + '">Antworten</a>';
      if (a.status === "in_pruefung") return '<button class="btn btn-outline klein pl-weiter" data-a="besichtigung" data-id="' + a.id + '">Besichtigung planen</button>';
      if (a.status === "besichtigung") return K.darf("angebote") ? '<button class="btn btn-outline klein pl-weiter" data-a="angebotVorschlag" data-id="' + a.id + '">✦ Angebot vorschlagen</button>' : '<a class="btn btn-outline klein pl-weiter" href="#/aufmass/neu/' + a.id + '">Aufmaß</a>';
      return an ? '<a class="btn btn-outline klein pl-weiter" href="#/angebote/' + an.id + '">Nachfassen</a>' : '<a class="btn btn-outline klein pl-weiter" href="#/anfragen/' + a.id + '">Öffnen</a>';
    };
    var karte = function (a) {
      var st = stunden(a), alter = Math.floor(st / 24), w = wert(a), fr = a.status === "neu" || a.status === "in_pruefung";
      var ampel = !fr ? "" : st > 48 ? "kritisch" : st > 24 ? "heute" : "ok", seit = st < 1 ? "gerade eben" : st < 48 ? "seit " + Math.round(st) + " Std." : "seit " + alter + " Tagen";
      return '<article class="pl-karte' + (a.wiedervorlage && a.wiedervorlage <= heute ? " faellig" : "") + (ampel ? " alt-" + ampel : "") + '" draggable="true" data-anf="' + a.id + '">' +
        (top.indexOf(a.id) > -1 ? '<span class="pl-prio">▲ Priorität</span>' : "") + '<a href="#/anfragen/' + a.id + '"><b>' + h(a.betreff) + "</b></a><small>" + h(km[a.kunde_id] ? km[a.kunde_id].name : "–") + " · " + h(K.KANAL[a.kanal] || "") + "</small>" +
        '<div class="pl-fuss">' + (w ? "<b>" + U.eur(w) + "</b>" : '<span class="still">ohne Wert</span>') + '<span class="pl-alter' + (ampel ? " a-" + ampel : "") + '">' + (fr ? seit : (alter ? "seit " + alter + (alter === 1 ? " Tag" : " Tagen") : "heute")) + "</span>" + (a.wiedervorlage ? ' <span class="pill ' + (a.wiedervorlage <= heute ? "warn" : "") + '">↻ ' + U.datum(a.wiedervorlage) + "</span>" : "") + "</div>" +
        weiter(a) +
        '<div class="pl-akt"><select data-a-change="plStatus" data-id="' + a.id + '" aria-label="Status ändern">' + SPALTEN.concat(["gewonnen", "verloren"]).map(function (s) { return '<option value="' + s + '"' + (s === a.status ? " selected" : "") + ">" + K.ST.anfrage[s][0] + "</option>"; }).join("") + '</select><button class="btn btn-ghost klein" data-a="plWv" data-id="' + a.id + '" title="Wiedervorlage" aria-label="Wiedervorlage">↻ Später</button></div></article>';
    };
    return K.kopf("Anfragen", "Ihre Pipeline: Wo steht jede Anfrage, was ist sie wert und wann fassen Sie nach?", '<a class="btn btn-signal" href="#/anfragen/neu">Neue Anfrage</a>') + umschalter +
      '<div class="kpis"><div class="kpi"><span>Offen in der Pipeline</span><b>' + U.eur(offen.reduce(function (s, a) { return s + wert(a); }, 0)) + "</b><small>" + offen.length + ' Anfragen</small></div><div class="kpi"><span>Abschlussquote (12 Monate)</span><b>' + (entsch.length ? Math.round(gew.length / entsch.length * 100) + " %" : "–") + "</b><small>" + gew.length + " von " + entsch.length + ' entschieden</small></div><div class="kpi' + (wv.length ? " warn" : "") + '"><span>Heute nachfassen</span><b>' + wv.length + "</b><small>fällige Wiedervorlagen</small></div></div>" +
      '<div class="pipeline">' + SPALTEN.map(function (s) { var l = offen.filter(function (a) { return a.status === s; }).sort(function (x, y) { return prio(y) - prio(x); });
        return '<section class="pl-spalte" data-pl="' + s + '"><header><h2>' + K.ST.anfrage[s][0] + " <small>" + l.length + "</small></h2><span>" + U.eur(l.reduce(function (x, a) { return x + wert(a); }, 0)) + "</span></header>" + (l.map(karte).join("") || '<p class="still pl-leer">Hierher ziehen</p>') + "</section>"; }).join("") + "</div>" +
      '<div class="pl-ende"><div class="pl-ziel ok" data-pl="gewonnen">Gewonnen – hierher ziehen</div><div class="pl-ziel aus" data-pl="verloren">Verloren – hierher ziehen</div></div>' +
      (Object.keys(kanal).length ? '<section class="karte"><h2>Abschluss nach Herkunft (12 Monate)</h2><ul class="liste">' + Object.keys(kanal).sort(function (a, b) { return kanal[b].n - kanal[a].n; }).map(function (k) { return "<li>" + h(K.KANAL[k] || k) + ": <b>" + Math.round(kanal[k].g / kanal[k].n * 100) + " %</b> <small>(" + kanal[k].g + " von " + kanal[k].n + ")</small></li>"; }).join("") + "</ul></section>" : "");
  };
  K.aktion.anfAnsicht = function (el) { sessionStorage.setItem("anf-ansicht", el.dataset.v); K.neuLaden(); };
  K.plStatus = async function (id, status) {
    var a = await DB.eins("anfragen", id); if (!a || a.status === status) return;
    if (status === "verloren") { var r = await U.dialog("Anfrage verloren", U.feld("grund", "Warum? (hilft bei der Auswertung)", "", { optionen: ["Preis zu hoch", "Zu spät geantwortet", "Kunde hat anderen Betrieb", "Projekt verschoben", "Keine Rückmeldung", "Passt nicht zu uns", "Sonstiges"] })); if (!r) { K.neuLaden(); return; }
      await DB.aendern("anfragen", id, { status: "verloren", verlustgrund: r.daten.grund, wiedervorlage: null }); await K.verlauf("anfrage", id, "Als verloren markiert: " + r.daten.grund); }
    else { var p = { status: status }; if (status === "gewonnen") p.wiedervorlage = null; await DB.aendern("anfragen", id, p); await K.verlauf("anfrage", id, "Status: " + K.ST.anfrage[status][0]); }
    U.toast("Status: " + K.ST.anfrage[status][0]); K.neuLaden();
  };
  K.aktion.plStatus = function (el) { return K.plStatus(el.dataset.id, el.value); };
  K.aktion.plWv = async function (el) {
    var a = await DB.eins("anfragen", el.dataset.id);
    var r = await U.dialog("Wiedervorlage", U.feld("am", "Wann wieder melden?", a.wiedervorlage || U.plusTage(U.isoTag(), 3), { typ: "date" }) + U.feld("notiz", "Was ist zu tun? (optional)", "", { ph: "z. B. Kunde anrufen wegen Termin" }),
      [{ wert: "", text: "Abbrechen" }].concat(a.wiedervorlage ? [{ wert: "weg", text: "Entfernen" }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }])); if (!r) return;
    var am = r.wert === "weg" ? null : r.daten.am || null;
    await DB.aendern("anfragen", a.id, { wiedervorlage: am }); if (am) await K.verlauf("anfrage", a.id, "Wiedervorlage am " + U.datum(am) + (r.daten.notiz ? ": " + r.daten.notiz : ""));
    U.toast(am ? "Wiedervorlage am " + U.datum(am) + "." : "Wiedervorlage entfernt."); K.neuLaden();
  };
  document.addEventListener("dragstart", function (e) { var k = e.target.closest && e.target.closest("[data-anf]"); if (k) e.dataTransfer.setData("text/plain", JSON.stringify({ anf: k.dataset.anf })); });
  document.addEventListener("dragover", function (e) { var z = e.target.closest && e.target.closest("[data-pl]"); if (z) { e.preventDefault(); z.classList.add("drop"); } });
  document.addEventListener("dragleave", function (e) { var z = e.target.closest && e.target.closest("[data-pl]"); if (z) z.classList.remove("drop"); });
  document.addEventListener("drop", function (e) {
    var z = e.target.closest && e.target.closest("[data-pl]"); if (!z) return; e.preventDefault(); z.classList.remove("drop");
    var p; try { p = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (x) { return; } if (p && p.anf) K.plStatus(p.anf, z.dataset.pl).catch(U.fehler);
  });
  // Wiedervorlage auch in der Anfrage selbst
  var altAnfDanach = V.anfragen.danach;
  V.anfragen.danach = async function (id, extra) {
    if (altAnfDanach) altAnfDanach(id, extra);
    if (!id || id === "neu") return; var dl = document.querySelector("#inhalt dl.daten"); if (!dl) return;
    var a = await DB.eins("anfragen", id); if (!a) return;
    dl.insertAdjacentHTML("beforeend", "<dt>Wiedervorlage</dt><dd>" + (a.wiedervorlage ? U.datum(a.wiedervorlage) + " " : "") + '<button class="btn btn-ghost klein" data-a="plWv" data-id="' + id + '">' + (a.wiedervorlage ? "ändern" : "festlegen") + "</button></dd>");
  };
  // Fällige Wiedervorlagen auf der Startseite
  var altUebDanach = V.uebersicht.danach;
  V.uebersicht.danach = async function () {
    if (altUebDanach) altUebDanach();
    if (!K.darf("anfragen")) return; var heute = U.isoTag();
    var l = (await K.liste("anfragen", { wo: { status: SPALTEN } }).catch(function () { return []; })).filter(function (a) { return a.wiedervorlage && a.wiedervorlage <= heute; });
    var kopf = document.querySelector("#inhalt .seite-kopf"); if (!l.length || !kopf || document.getElementById("wv-karte")) return;
    kopf.insertAdjacentHTML("afterend", '<section class="karte nf faellig" id="wv-karte"><h2>Heute nachfassen</h2><ul class="liste">' + l.map(function (a) { return '<li><a href="#/anfragen/' + a.id + '">' + h(a.betreff) + "</a> <small>Wiedervorlage " + U.datum(a.wiedervorlage) + "</small></li>"; }).join("") + "</ul></section>");
  };
})();
